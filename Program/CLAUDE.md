# Claude AI Development Guide 🤖

This document provides essential information for Claude AI to effectively work on and enhance this File Management System.

## Project Overview

This is a full-stack web application for file management with advanced features. Version 2.0 includes recycle bin, themes, bookmarks, and rich media previews.

## Quick Context

```yaml
Project: File Management System v2.0
Stack: React + FastAPI + Docker
Main Features: File operations, Recycle bin, Themes, Search, Bookmarks
Development Path: /mnt/c/Users/JayTu/Projects/FileManagementServer/Program
```

## Essential Commands

### Start Development
```bash
cd /mnt/c/Users/JayTu/Projects/FileManagementServer/Program
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
docker-compose logs -f frontend  # Frontend logs
docker-compose logs -f backend   # Backend logs
```

### Apply Changes
```bash
docker-compose restart frontend  # After frontend changes
docker-compose restart backend   # After backend changes
```

## Project Structure

```
Program/
├── backend/
│   ├── main.py          # ⚡ FastAPI app - all endpoints here
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # 🎨 Main app with theme logic
│   │   ├── components/  # 📦 All React components
│   │   │   ├── EnhancedFileManager.jsx  # Main file browser
│   │   │   ├── FileViewer.jsx          # File preview modal
│   │   │   ├── RecentFiles.jsx         # Recent files panel
│   │   │   ├── RecycleBin.jsx          # Recycle bin panel
│   │   │   ├── FolderBookmarks.jsx     # Bookmarks panel
│   │   │   └── AdvancedSearch.jsx      # Search modal
│   │   └── contexts/
│   │       └── ClipboardContext.jsx     # Clipboard state
│   └── package.json
├── docker-compose.yml   # Container configuration
├── uploads/            # File storage directory
└── recycle_bin/        # Deleted files storage
```

## Key Technical Details

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Chakra UI
- **State Management**: React Context (ClipboardContext)
- **Routing**: React Router
- **Icons**: @chakra-ui/icons (⚠️ Limited set - no PauseIcon, PlayIcon)
- **Dev Server**: http://localhost:5173

### Backend
- **Framework**: FastAPI (Python)
- **File Operations**: Python os, shutil, aiofiles
- **CORS**: Configured for localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Storage**: Local filesystem (./uploads)

### Docker Setup
- **Frontend**: Node 18 Alpine image
- **Backend**: Python 3.9 Slim image
- **Volumes**: 
  - `./uploads:/app/uploads` (persistent storage)
  - `./frontend/src:/app/src` (hot reload in dev)

## Common Tasks & Solutions

### Adding a New Feature

1. **Plan the feature**
   - Identify affected components
   - Check if new endpoints are needed
   - Consider state management needs

2. **Backend changes (if needed)**
   ```python
   # Add to backend/main.py
   @app.get("/new-endpoint")
   async def new_feature():
       # Implementation
   ```

3. **Frontend component**
   ```jsx
   // Create in frontend/src/components/NewFeature.jsx
   import { Box, Button } from '@chakra-ui/react'
   
   export default function NewFeature() {
       // Component logic
   }
   ```

4. **Apply changes**
   ```bash
   docker-compose restart backend   # If backend changed
   docker-compose restart frontend  # If frontend changed
   ```

### Common Issues & Fixes

1. **Import errors (Icon not found)**
   - Chakra UI has limited icons
   - Use react-icons instead: `import { FaPlay } from 'react-icons/fa'`

2. **Black screen**
   - Check browser console for errors
   - Clear browser cache (Ctrl+Shift+Delete)
   - Restart frontend container

3. **API not responding**
   - Check backend logs: `docker-compose logs backend`
   - Ensure CORS is configured correctly
   - Verify API_URL in frontend

4. **Changes not reflecting**
   - Frontend uses volume mapping - changes should be instant
   - Backend requires restart: `docker-compose restart backend`

## Best Practices

### Code Style
- Use functional React components with hooks
- Async/await for all API calls
- Consistent error handling with try/catch
- Use Chakra UI components for consistency

### State Management
- Local state for component-specific data
- Context for cross-component state (clipboard)
- Avoid prop drilling - use context or composition

### File Organization
- One component per file
- Related components in same directory
- Reusable utilities in separate utils file

### API Design
- RESTful endpoints
- Consistent error responses
- Use appropriate HTTP methods
- Document with FastAPI automatic docs

## Performance Optimization

1. **Frontend**
   - Use React.memo for expensive components
   - Implement virtualization for large file lists
   - Lazy load heavy components
   - Optimize re-renders with proper dependencies

2. **Backend**
   - Use async file operations
   - Implement pagination for large directories
   - Cache frequently accessed data
   - Stream large file downloads

## Testing Approach

1. **Manual Testing**
   - Test each feature after implementation
   - Check responsive design
   - Verify keyboard shortcuts
   - Test error scenarios

2. **API Testing**
   - Use FastAPI's /docs interface
   - Test edge cases (empty folders, large files)
   - Verify error responses

## Deployment Checklist

- [ ] Remove debug code
- [ ] Update version in VERSION.md
- [ ] Update CHANGELOG.md
- [ ] Test production build
- [ ] Update README if needed
- [ ] Create git commit with conventional format
- [ ] Push to GitHub

## Future Enhancement Ideas

High Priority:
- User authentication system
- Real-time collaboration
- File sharing with links
- Activity logs

Medium Priority:
- File versioning
- Batch rename operations
- Image thumbnails
- Folder size calculation

Low Priority:
- File compression
- Cloud storage integration
- Mobile app
- Plugin system

## Important Notes

1. **Always use docker-compose** for development to ensure consistency
2. **Theme colors** are stored as CSS custom properties
3. **Clipboard operations** use browser limitations (no system clipboard access)
4. **File paths** must be carefully handled to prevent directory traversal
5. **Recent files** are stored in JSON file on backend
6. **Bookmarks** are stored in browser localStorage

## Quick Debugging

```bash
# Check if services are running
docker-compose ps

# View real-time logs
docker-compose logs -f

# Restart everything
docker-compose down && docker-compose up -d

# Check file permissions
docker-compose exec backend ls -la /app/uploads

# Access backend shell
docker-compose exec backend /bin/bash

# Access frontend shell
docker-compose exec frontend /bin/sh
```

## Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit with conventional format
git commit -m "feat: Add new feature"
# Types: feat, fix, docs, style, refactor, test, chore

# Push to GitHub
git push origin main
```

---

**Remember**: This project prioritizes user experience, clean code, and maintainability. Always test thoroughly and keep the UI intuitive and responsive.