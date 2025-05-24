# Claude AI Development Guide 🤖

This document provides essential information for Claude AI to effectively work on and enhance this File Management System. Based on v2.0 development experience, this guide includes specific optimizations and lessons learned.

## ⚡ Quick Reference (Most Common Tasks)

```bash
# Fix black screen / frontend issues
docker-compose restart frontend
# Then clear browser cache (Ctrl+Shift+Delete)

# Apply backend changes
docker-compose restart backend

# Full reset when things go wrong
docker-compose down && docker-compose up --build -d

# Check what's wrong
docker-compose logs -f

# Commit changes (from repository root!)
cd /mnt/c/Users/JayTu/Projects/FileManagementServer
git add . && git commit -m "feat: your message" && git push
```

## Project Overview

This is a full-stack web application for file management with advanced features. Version 2.0 includes recycle bin, themes, bookmarks, and rich media previews.

## Quick Context

```yaml
Project: File Management System v2.0
Stack: React + FastAPI + Docker
Main Features: File operations, Recycle bin, Themes, Search, Bookmarks
Repository Root: /mnt/c/Users/JayTu/Projects/FileManagementServer
Working Directory: ./Program
Frontend Port: 5173 (NOT 3000!)
Backend Port: 8000
Critical Libraries: Chakra UI (limited icons!), React Icons, Vite
```

## 🚨 Critical First Steps (Do This First!)

1. **Check if containers are running:**
   ```bash
   cd /mnt/c/Users/JayTu/Projects/FileManagementServer/Program
   docker-compose ps
   ```

2. **If not running or having issues:**
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

3. **Verify application is accessible:**
   - Frontend: http://localhost:5173 (NOT 3000!)
   - Backend: http://localhost:8000/docs

4. **Check for errors:**
   ```bash
   docker-compose logs -f
   ```

## Essential Commands

### Start Development
```bash
cd /mnt/c/Users/JayTu/Projects/FileManagementServer
cd Program
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

### Common Issues & Fixes (Learned from v2.0 Development)

1. **Import errors (Icon not found) - CRITICAL**
   - ⚠️ Chakra UI has LIMITED icons - does NOT include: PauseIcon, PlayIcon, VolumeUpIcon
   - ✅ Solution: Use react-icons: `import { FaPlay, FaPause } from 'react-icons/fa'`
   - This caused black screen in v2.0 development!

2. **Black screen - Most Common Issue**
   - First check: Browser console (F12) for import errors
   - Clear browser cache: Ctrl+Shift+Delete
   - Try incognito window
   - Restart frontend: `docker-compose restart frontend`
   - If using volumes, may need full rebuild: `docker-compose down && docker-compose up --build -d`

3. **Changes not reflecting in container**
   - Check docker-compose.yml has volume mapping:
     ```yaml
     volumes:
       - ./frontend/src:/app/src  # This enables hot reload
     ```
   - Without this, need rebuild for every change
   - Backend ALWAYS needs restart: `docker-compose restart backend`

4. **API 404 errors**
   - New endpoints need backend restart
   - Check if backend actually has the code: `docker-compose exec backend cat /app/main.py | grep "your-endpoint"`
   - May need full rebuild if Dockerfile copies are cached

5. **CSS Theme Issues**
   - CSS custom properties must be initialized before use
   - Use fallback colors: `color={useColorModeValue('blue.500', 'blue.200')}`
   - Don't use `var(--theme-primary)` without initialization

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

## Important Notes & Lessons Learned

### From v2.0 Development Experience:

1. **Docker Volume Mapping is CRITICAL**
   - Without `./frontend/src:/app/src` in docker-compose.yml, changes won't reflect
   - We had to add this mid-development to avoid constant rebuilds
   - Backend doesn't need volume mapping but ALWAYS needs restart

2. **Icon Import Issues = Black Screen**
   - This was our #1 issue in v2.0
   - NEVER import non-existent Chakra UI icons
   - Always use react-icons for Play, Pause, Volume, etc.
   - Black screen? Check browser console first!

3. **Browser Caching is Aggressive**
   - Use Ctrl+Shift+Delete to clear cache
   - Or use incognito window for testing
   - Vite hot reload sometimes needs a manual refresh

4. **Git Operations from Root**
   - ALWAYS run git commands from repository root
   - Update root README.md when version changes
   - Keep documentation in sync (root and Program)

5. **Testing After Changes**
   - Frontend changes: Usually instant with volume mapping
   - Backend changes: MUST restart container
   - New endpoints: Full restart required
   - Database/storage changes: Check file permissions

6. **State Management**
   - Theme colors: CSS custom properties + localStorage
   - Clipboard: React Context (browser limitations)
   - Recent files: Backend JSON file
   - Bookmarks: Browser localStorage
   - File paths: Always sanitize for security

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

## Important Repository Notes

### Documentation Structure
- **Root README.md** - Main project documentation (keep updated with version changes)
- **Program/README.md** - Application-specific documentation
- **IMPORTANT**: When updating version or features, update BOTH README files

### GitHub Best Practices
1. Always work from repository root for git operations
2. Keep root-level docs (README.md, CLAUDE.md, CHANGELOG.md) in sync
3. Application code lives in `/Program` directory
4. Use conventional commits for clear history
5. Tag releases with version numbers (e.g., v2.0.0)

## ❌ What NOT to Do (Avoid These Mistakes)

1. **DON'T import these Chakra UI icons:**
   - PauseIcon, PlayIcon, VolumeUpIcon, VolumeDownIcon
   - Use react-icons instead!

2. **DON'T forget to restart containers:**
   - Backend changes = restart required
   - New npm packages = rebuild required

3. **DON'T use port 3000:**
   - Frontend is on port 5173 (Vite default)
   - This isn't Create React App!

4. **DON'T commit from Program directory:**
   - Always use repository root for git operations
   - Keep root docs updated

5. **DON'T skip browser cache clearing:**
   - When in doubt, clear cache or use incognito
   - Vite sometimes holds onto old code

6. **DON'T forget volume mapping:**
   - Check docker-compose.yml has frontend volume
   - Without it, you'll rebuild constantly

---

**Remember**: This project prioritizes user experience, clean code, and maintainability. Always test thoroughly and keep the UI intuitive and responsive. When something goes wrong, check the browser console first!