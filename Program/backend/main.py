from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel
import os
import shutil
from typing import List, Optional
import aiofiles
import mimetypes
import base64
from datetime import datetime
import zipfile
import io
from pathlib import Path
import json
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
RECYCLE_DIR = "recycle_bin"
RECENT_FILES_DB = "recent_files.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RECYCLE_DIR, exist_ok=True)

# Initialize recent files database
def load_recent_files():
    if os.path.exists(RECENT_FILES_DB):
        try:
            with open(RECENT_FILES_DB, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_recent_files(recent_files):
    with open(RECENT_FILES_DB, 'w') as f:
        json.dump(recent_files, f)

def add_to_recent_files(file_path, file_name, file_type):
    recent_files = load_recent_files()
    
    # Remove if already exists
    recent_files = [f for f in recent_files if f['path'] != file_path]
    
    # Add to beginning
    recent_files.insert(0, {
        'path': file_path,
        'name': file_name,
        'type': file_type,
        'accessed_at': int(time.time())
    })
    
    # Keep only last 20 files
    recent_files = recent_files[:20]
    
    save_recent_files(recent_files)

# Text file extensions that can be edited
EDITABLE_EXTENSIONS = {'.txt', '.md', '.json', '.xml', '.csv', '.html', '.css', '.js', '.py', '.java', '.cpp', '.c', '.h', '.yml', '.yaml', '.ini', '.conf', '.log'}

# Image extensions for thumbnails
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'}

def calculate_folder_size(folder_path):
    """Calculate total size of all files in a folder recursively."""
    total_size = 0
    try:
        for dirpath, dirnames, filenames in os.walk(folder_path):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                try:
                    total_size += os.path.getsize(file_path)
                except (OSError, FileNotFoundError):
                    # Skip files that can't be accessed
                    continue
    except (OSError, FileNotFoundError):
        # Return 0 if folder can't be accessed
        return 0
    return total_size

class FileContent(BaseModel):
    content: str

class CreateFolder(BaseModel):
    name: str
    path: Optional[str] = ""

class FileOperation(BaseModel):
    files: List[str]
    operation: str  # "copy" or "move"
    destination: str

class BulkDelete(BaseModel):
    files: List[str]

class RestoreFiles(BaseModel):
    files: List[str]

@app.get("/files")
async def list_files(
    path: str = Query("", description="Folder path"),
    search: str = Query("", description="Search query"),
    sort_by: str = Query("name", description="Sort by: name, size, modified"),
    sort_order: str = Query("asc", description="Sort order: asc or desc")
):
    base_path = os.path.join(UPLOAD_DIR, path.strip("/"))
    if not os.path.exists(base_path):
        os.makedirs(base_path, exist_ok=True)
    
    files = []
    items = os.listdir(base_path)
    
    for filename in items:
        # Skip if search query doesn't match
        if search and search.lower() not in filename.lower():
            continue
            
        item_path = os.path.join(base_path, filename)
        stats = os.stat(item_path)
        is_dir = os.path.isdir(item_path)
        
        # Calculate size - for directories, get total size of all contents
        if is_dir:
            folder_size = calculate_folder_size(item_path)
        else:
            folder_size = stats.st_size
        
        file_info = {
            "name": filename,
            "size": folder_size,
            "modified": stats.st_mtime,
            "type": "directory" if is_dir else "file",
            "path": os.path.join(path, filename).replace("\\", "/"),
        }
        
        if not is_dir:
            mime_type, _ = mimetypes.guess_type(filename)
            file_info["mimeType"] = mime_type or "application/octet-stream"
            ext = os.path.splitext(filename)[1].lower()
            file_info["isImage"] = ext in IMAGE_EXTENSIONS
            file_info["isEditable"] = ext in EDITABLE_EXTENSIONS
        
        files.append(file_info)
    
    # Sorting
    reverse = sort_order == "desc"
    if sort_by == "size":
        files.sort(key=lambda x: x["size"], reverse=reverse)
    elif sort_by == "modified":
        files.sort(key=lambda x: x["modified"], reverse=reverse)
    else:  # name
        files.sort(key=lambda x: x["name"].lower(), reverse=reverse)
    
    # Always put directories first
    files.sort(key=lambda x: x["type"] != "directory")
    
    return {
        "files": files,
        "currentPath": path,
        "breadcrumbs": path.split("/") if path else []
    }

@app.get("/search")
async def advanced_search(
    query: str = Query("", description="Search query"),
    file_type: str = Query("", description="File type filter: image, video, audio, document, archive"),
    min_size: int = Query(0, description="Minimum file size in bytes"),
    max_size: int = Query(0, description="Maximum file size in bytes (0 = no limit)"),
    date_from: str = Query("", description="Modified after date (YYYY-MM-DD)"),
    date_to: str = Query("", description="Modified before date (YYYY-MM-DD)"),
    path: str = Query("", description="Search within specific path"),
    recursive: bool = Query(True, description="Search subdirectories"),
    sort_by: str = Query("name", description="Sort by: name, size, modified"),
    sort_order: str = Query("asc", description="Sort order: asc or desc")
):
    import datetime
    
    def matches_file_type(filename, mime_type, target_type):
        if not target_type:
            return True
            
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        
        type_mappings = {
            'image': (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'], ['image/']),
            'video': (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'], ['video/']),
            'audio': (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'], ['audio/']),
            'document': (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'], ['application/pdf', 'text/']),
            'archive': (['zip', 'rar', '7z', 'tar', 'gz'], ['application/zip', 'application/x-'])
        }
        
        if target_type in type_mappings:
            extensions, mime_prefixes = type_mappings[target_type]
            return (ext in extensions or 
                   any(mime_type.startswith(prefix) for prefix in mime_prefixes if mime_type))
        
        return True
    
    def matches_date_range(file_time, date_from_str, date_to_str):
        if not date_from_str and not date_to_str:
            return True
            
        try:
            file_date = datetime.datetime.fromtimestamp(file_time).date()
            
            if date_from_str:
                date_from = datetime.datetime.strptime(date_from_str, '%Y-%m-%d').date()
                if file_date < date_from:
                    return False
                    
            if date_to_str:
                date_to = datetime.datetime.strptime(date_to_str, '%Y-%m-%d').date()
                if file_date > date_to:
                    return False
                    
            return True
        except (ValueError, OSError):
            return True
    
    def search_directory(dir_path, relative_path=""):
        results = []
        
        try:
            for item in os.listdir(dir_path):
                if item.startswith('.'):
                    continue
                    
                item_path = os.path.join(dir_path, item)
                item_relative = os.path.join(relative_path, item) if relative_path else item
                
                try:
                    stats = os.stat(item_path)
                    is_dir = os.path.isdir(item_path)
                    
                    # Get MIME type
                    mime_type, _ = mimetypes.guess_type(item_path)
                    
                    # Check search query match
                    if query and query.lower() not in item.lower():
                        if recursive and is_dir:
                            results.extend(search_directory(item_path, item_relative))
                        continue
                    
                    # Check file type filter (only for files)
                    if not is_dir and not matches_file_type(item, mime_type, file_type):
                        continue
                    
                    # Check size filter (only for files)
                    if not is_dir:
                        if min_size > 0 and stats.st_size < min_size:
                            continue
                        if max_size > 0 and stats.st_size > max_size:
                            continue
                    
                    # Check date filter
                    if not matches_date_range(stats.st_mtime, date_from, date_to):
                        continue
                    
                    # Calculate size
                    if is_dir:
                        size = calculate_folder_size(item_path)
                    else:
                        size = stats.st_size
                    
                    # Check if it's an image
                    is_image = False
                    if not is_dir and mime_type:
                        is_image = mime_type.startswith('image/')
                    
                    file_info = {
                        "name": item,
                        "path": item_relative.replace("\\", "/"),
                        "type": "directory" if is_dir else "file",
                        "size": size,
                        "modified": stats.st_mtime,
                        "isImage": is_image,
                        "mimeType": mime_type
                    }
                    
                    results.append(file_info)
                    
                    # Recursively search subdirectories
                    if recursive and is_dir:
                        results.extend(search_directory(item_path, item_relative))
                        
                except (OSError, PermissionError):
                    continue
                    
        except (OSError, PermissionError):
            pass
            
        return results
    
    # Set up search path
    search_path = os.path.join(UPLOAD_DIR, path.strip("/")) if path else UPLOAD_DIR
    if not os.path.exists(search_path):
        return {"files": [], "query": query, "total": 0}
    
    # Perform search
    files = search_directory(search_path)
    
    # Sort results
    reverse = sort_order == "desc"
    if sort_by == "size":
        files.sort(key=lambda x: x["size"], reverse=reverse)
    elif sort_by == "modified":
        files.sort(key=lambda x: x["modified"], reverse=reverse)
    else:  # name
        files.sort(key=lambda x: x["name"].lower(), reverse=reverse)
    
    # Always put directories first when sorting by name
    if sort_by == "name":
        files.sort(key=lambda x: x["type"] != "directory")
    
    return {
        "files": files,
        "query": query,
        "total": len(files),
        "filters": {
            "file_type": file_type,
            "min_size": min_size,
            "max_size": max_size,
            "date_from": date_from,
            "date_to": date_to,
            "path": path,
            "recursive": recursive
        }
    }

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    path: str = Query("", description="Upload path")
):
    try:
        upload_path = os.path.join(UPLOAD_DIR, path.strip("/"))
        os.makedirs(upload_path, exist_ok=True)
        
        file_path = os.path.join(upload_path, file.filename)
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        return {"message": f"Successfully uploaded {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-folder")
async def upload_folder(
    files: List[UploadFile] = File(...),
    path: str = Query("", description="Upload path")
):
    try:
        base_upload_path = os.path.join(UPLOAD_DIR, path.strip("/"))
        os.makedirs(base_upload_path, exist_ok=True)
        
        uploaded_files = []
        created_folders = set()
        
        for file in files:
            # Extract relative path from filename (browsers include folder structure)
            relative_path = file.filename
            if hasattr(file, 'webkitRelativePath') and file.webkitRelativePath:
                relative_path = file.webkitRelativePath
            
            # Create full file path
            full_file_path = os.path.join(base_upload_path, relative_path)
            
            # Create directory structure if it doesn't exist
            file_dir = os.path.dirname(full_file_path)
            if file_dir and file_dir not in created_folders:
                os.makedirs(file_dir, exist_ok=True)
                created_folders.add(file_dir)
            
            # Write the file
            async with aiofiles.open(full_file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            uploaded_files.append(relative_path)
        
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} files",
            "uploaded_files": uploaded_files,
            "created_folders": list(created_folders)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/files/{file_path:path}")
async def delete_file(file_path: str):
    full_path = os.path.join(UPLOAD_DIR, file_path)
    if os.path.exists(full_path):
        # Move to recycle bin instead of permanent deletion
        import time
        timestamp = int(time.time())
        recycled_name = f"{timestamp}_{os.path.basename(file_path)}"
        recycle_path = os.path.join(RECYCLE_DIR, recycled_name)
        
        # Store original path info
        metadata = {
            "original_path": file_path,
            "deleted_at": timestamp,
            "original_name": os.path.basename(file_path)
        }
        
        shutil.move(full_path, recycle_path)
        
        # Save metadata
        metadata_path = f"{recycle_path}.meta"
        with open(metadata_path, 'w') as f:
            import json
            json.dump(metadata, f)
        
        return {"message": f"Successfully moved {file_path} to recycle bin"}
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/download/{file_path:path}")
async def download_file(file_path: str):
    full_path = os.path.join(UPLOAD_DIR, file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File or folder not found")
    
    # If it's a file, return it directly
    if os.path.isfile(full_path):
        return FileResponse(full_path, filename=os.path.basename(file_path))
    
    # If it's a directory, create a ZIP file
    elif os.path.isdir(full_path):
        zip_buffer = io.BytesIO()
        folder_name = os.path.basename(file_path)
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for root, dirs, files in os.walk(full_path):
                for file in files:
                    file_full_path = os.path.join(root, file)
                    # Create relative path from the folder being zipped
                    arc_name = os.path.relpath(file_full_path, full_path)
                    zip_file.write(file_full_path, arc_name)
        
        zip_buffer.seek(0)
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type='application/zip',
            headers={'Content-Disposition': f'attachment; filename="{folder_name}.zip"'}
        )
    
    raise HTTPException(status_code=404, detail="Invalid file or folder")

@app.get("/files/{file_path:path}/content")
async def get_file_content(file_path: str):
    path = os.path.join(UPLOAD_DIR, file_path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Add to recent files
    add_to_recent_files(file_path, os.path.basename(file_path), "file")
    
    mime_type, _ = mimetypes.guess_type(file_path)
    file_ext = os.path.splitext(file_path)[1].lower()
    
    # Check if it's a text file that can be edited
    is_text = file_ext in EDITABLE_EXTENSIONS or (mime_type and mime_type.startswith('text/'))
    
    try:
        if is_text:
            async with aiofiles.open(path, 'r', encoding='utf-8') as f:
                content = await f.read()
                return {
                    "content": content,
                    "type": "text",
                    "editable": True,
                    "mimeType": mime_type
                }
        else:
            # For binary files (images, etc), return base64 encoded content
            async with aiofiles.open(path, 'rb') as f:
                content = await f.read()
                base64_content = base64.b64encode(content).decode('utf-8')
                return {
                    "content": base64_content,
                    "type": "binary",
                    "editable": False,
                    "mimeType": mime_type
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/files/{file_path:path}/content")
async def update_file_content(file_path: str, file_content: FileContent):
    path = os.path.join(UPLOAD_DIR, file_path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext not in EDITABLE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not editable")
    
    try:
        async with aiofiles.open(path, 'w', encoding='utf-8') as f:
            await f.write(file_content.content)
        return {"message": f"Successfully updated {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New endpoints for enhanced functionality

@app.post("/folders")
async def create_folder(folder: CreateFolder):
    folder_path = os.path.join(UPLOAD_DIR, folder.path.strip("/"), folder.name)
    if os.path.exists(folder_path):
        raise HTTPException(status_code=400, detail="Folder already exists")
    try:
        os.makedirs(folder_path)
        return {"message": f"Successfully created folder {folder.name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/files/bulk-delete")
async def bulk_delete(bulk: BulkDelete):
    deleted = []
    errors = []
    
    for file_path in bulk.files:
        full_path = os.path.join(UPLOAD_DIR, file_path.strip("/"))
        try:
            if os.path.exists(full_path):
                # Move to recycle bin instead of permanent deletion
                import time
                timestamp = int(time.time())
                recycled_name = f"{timestamp}_{os.path.basename(file_path.strip('/'))}"
                recycle_path = os.path.join(RECYCLE_DIR, recycled_name)
                
                # Store original path info
                metadata = {
                    "original_path": file_path.strip("/"),
                    "deleted_at": timestamp,
                    "original_name": os.path.basename(file_path.strip("/"))
                }
                
                shutil.move(full_path, recycle_path)
                
                # Save metadata
                metadata_path = f"{recycle_path}.meta"
                with open(metadata_path, 'w') as f:
                    import json
                    json.dump(metadata, f)
                
                deleted.append(file_path)
        except Exception as e:
            errors.append({"file": file_path, "error": str(e)})
    
    return {
        "deleted": deleted,
        "errors": errors,
        "message": f"Moved {len(deleted)} items to recycle bin"
    }

@app.post("/files/operation")
async def file_operation(operation: FileOperation):
    results = []
    errors = []
    
    dest_path = os.path.join(UPLOAD_DIR, operation.destination.strip("/"))
    os.makedirs(dest_path, exist_ok=True)
    
    for file_path in operation.files:
        src_path = os.path.join(UPLOAD_DIR, file_path.strip("/"))
        filename = os.path.basename(file_path)
        dst_path = os.path.join(dest_path, filename)
        
        try:
            if operation.operation == "copy":
                if os.path.isdir(src_path):
                    shutil.copytree(src_path, dst_path)
                else:
                    shutil.copy2(src_path, dst_path)
            elif operation.operation == "move":
                shutil.move(src_path, dst_path)
            results.append(file_path)
        except Exception as e:
            errors.append({"file": file_path, "error": str(e)})
    
    return {
        "processed": results,
        "errors": errors,
        "message": f"{operation.operation.capitalize()}d {len(results)} items"
    }

@app.get("/files/download-multiple")
async def download_multiple(files: str = Query(..., description="Comma-separated file paths")):
    file_paths = [f.strip() for f in files.split(",")]
    
    # Create a zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in file_paths:
            full_path = os.path.join(UPLOAD_DIR, file_path.strip("/"))
            if os.path.exists(full_path):
                if os.path.isdir(full_path):
                    # Add directory recursively
                    for root, dirs, files in os.walk(full_path):
                        for file in files:
                            file_full_path = os.path.join(root, file)
                            arc_name = os.path.relpath(file_full_path, UPLOAD_DIR)
                            zip_file.write(file_full_path, arc_name)
                else:
                    # Add single file
                    arc_name = os.path.relpath(full_path, UPLOAD_DIR)
                    zip_file.write(full_path, arc_name)
    
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type='application/zip',
        headers={'Content-Disposition': 'attachment; filename="files.zip"'}
    )

@app.get("/files/{file_path:path}/thumbnail")
async def get_thumbnail(file_path: str, size: int = Query(200, description="Thumbnail size")):
    full_path = os.path.join(UPLOAD_DIR, file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Not an image file")
    
    # For now, return the original image
    # In production, you'd want to use PIL/Pillow to create actual thumbnails
    return FileResponse(full_path, media_type=f"image/{ext[1:]}")

# Recycle Bin Endpoints
@app.get("/recycle-bin")
async def list_recycle_bin():
    """List all files in recycle bin"""
    try:
        recycled_items = []
        for item in os.listdir(RECYCLE_DIR):
            if item.endswith('.meta'):
                continue
                
            item_path = os.path.join(RECYCLE_DIR, item)
            meta_path = f"{item_path}.meta"
            
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    import json
                    metadata = json.load(f)
                
                stats = os.stat(item_path)
                recycled_items.append({
                    "recycled_name": item,
                    "original_name": metadata["original_name"],
                    "original_path": metadata["original_path"],
                    "deleted_at": metadata["deleted_at"],
                    "size": stats.st_size,
                    "type": "directory" if os.path.isdir(item_path) else "file"
                })
        
        # Sort by deletion time (newest first)
        recycled_items.sort(key=lambda x: x["deleted_at"], reverse=True)
        return {"items": recycled_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recycle-bin/restore")
async def restore_files(restore_data: RestoreFiles):
    """Restore files from recycle bin"""
    restored = []
    errors = []
    
    for recycled_name in restore_data.files:
        try:
            recycle_path = os.path.join(RECYCLE_DIR, recycled_name)
            meta_path = f"{recycle_path}.meta"
            
            if not os.path.exists(recycle_path) or not os.path.exists(meta_path):
                errors.append({"file": recycled_name, "error": "File not found in recycle bin"})
                continue
            
            with open(meta_path, 'r') as f:
                import json
                metadata = json.load(f)
            
            # Restore to original location
            original_path = os.path.join(UPLOAD_DIR, metadata["original_path"])
            original_dir = os.path.dirname(original_path)
            
            # Create directories if they don't exist
            if original_dir:
                os.makedirs(original_dir, exist_ok=True)
            
            # Check if file already exists at original location
            if os.path.exists(original_path):
                # Add timestamp to avoid conflicts
                base, ext = os.path.splitext(original_path)
                import time
                timestamp = int(time.time())
                original_path = f"{base}_restored_{timestamp}{ext}"
            
            shutil.move(recycle_path, original_path)
            os.remove(meta_path)  # Remove metadata file
            
            restored.append({
                "recycled_name": recycled_name,
                "restored_to": os.path.relpath(original_path, UPLOAD_DIR)
            })
            
        except Exception as e:
            errors.append({"file": recycled_name, "error": str(e)})
    
    return {
        "restored": restored,
        "errors": errors,
        "message": f"Restored {len(restored)} items"
    }

@app.delete("/recycle-bin/empty")
async def empty_recycle_bin():
    """Permanently delete all files in recycle bin"""
    try:
        deleted_count = 0
        for item in os.listdir(RECYCLE_DIR):
            item_path = os.path.join(RECYCLE_DIR, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
            else:
                os.remove(item_path)
            deleted_count += 1
        
        return {"message": f"Permanently deleted {deleted_count} items from recycle bin"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/recycle-bin/{recycled_name}")
async def permanently_delete(recycled_name: str):
    """Permanently delete a specific file from recycle bin"""
    try:
        recycle_path = os.path.join(RECYCLE_DIR, recycled_name)
        meta_path = f"{recycle_path}.meta"
        
        if not os.path.exists(recycle_path):
            raise HTTPException(status_code=404, detail="File not found in recycle bin")
        
        if os.path.isdir(recycle_path):
            shutil.rmtree(recycle_path)
        else:
            os.remove(recycle_path)
        
        if os.path.exists(meta_path):
            os.remove(meta_path)
        
        return {"message": f"Permanently deleted {recycled_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Recent Files Endpoints
@app.get("/recent-files")
async def get_recent_files():
    """Get list of recently accessed files"""
    try:
        recent_files = load_recent_files()
        
        # Filter out files that no longer exist
        valid_files = []
        for file_info in recent_files:
            file_path = os.path.join(UPLOAD_DIR, file_info['path'])
            if os.path.exists(file_path):
                # Add current file stats
                stats = os.stat(file_path)
                file_info['size'] = stats.st_size
                file_info['modified'] = stats.st_mtime
                file_info['exists'] = True
                valid_files.append(file_info)
        
        # Update the recent files list to remove non-existent files
        if len(valid_files) != len(recent_files):
            save_recent_files(valid_files)
        
        return {"recent_files": valid_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/recent-files")
async def clear_recent_files():
    """Clear all recent files history"""
    try:
        save_recent_files([])
        return {"message": "Recent files history cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 