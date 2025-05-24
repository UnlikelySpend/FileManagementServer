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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)
        else:
            os.remove(full_path)
        return {"message": f"Successfully deleted {file_path}"}
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
            if os.path.isdir(full_path):
                shutil.rmtree(full_path)
            elif os.path.exists(full_path):
                os.remove(full_path)
            deleted.append(file_path)
        except Exception as e:
            errors.append({"file": file_path, "error": str(e)})
    
    return {
        "deleted": deleted,
        "errors": errors,
        "message": f"Deleted {len(deleted)} items"
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