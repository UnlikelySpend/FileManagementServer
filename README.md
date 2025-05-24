# File Management Server

A full-stack web application for file and folder management with modern UI and comprehensive features.

## 🚀 Features

### File Management
- ✅ Upload files (drag & drop or button)
- ✅ Upload entire folders (preserves structure)
- ✅ Download files individually
- ✅ Download folders as ZIP files
- ✅ Bulk download (mixed files + folders)
- ✅ View file contents (text, images, documents)
- ✅ Edit text files inline
- ✅ Delete files and folders

### Folder Operations
- ✅ Create new folders
- ✅ Navigate folder hierarchy
- ✅ Breadcrumb navigation
- ✅ Folder size calculation (recursive)
- ✅ Copy/move operations
- ✅ Bulk operations on folders

### User Interface
- ✅ Modern responsive design with Chakra UI
- ✅ Dark/light mode support
- ✅ Search functionality
- ✅ Sort by name, size, or date
- ✅ Grid and list view modes
- ✅ Multi-select with checkboxes
- ✅ Keyboard shortcuts (Ctrl+A, Ctrl+C, Delete)
- ✅ Real-time file previews

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI for high-performance API
- **File Operations**: Async file handling with aiofiles
- **Authentication**: Ready for JWT integration
- **Storage**: Local filesystem with Docker volume mapping
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

### Frontend (React + Vite)
- **Framework**: React 18 with Vite for fast development
- **UI Library**: Chakra UI for modern, accessible components
- **State Management**: React hooks for local state
- **HTTP Client**: Axios for API communication
- **Icons**: Chakra UI icons + React Icons

### Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Volumes**: Persistent storage for uploads
- **Networking**: Internal Docker network for services

## 📦 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FileManagementServer
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development

1. **Backend development**
   ```bash
   cd Program/backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend development**
   ```bash
   cd Program/frontend
   npm install
   npm run dev
   ```

## 🗂️ Project Structure

```
FileManagementServer/
├── .git/                   # Git repository
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── CHANGELOG.md           # Version history
├── VERSION                # Current version
└── Program/               # Main application
    ├── docker-compose.yml # Docker orchestration
    ├── backend/           # FastAPI backend
    │   ├── Dockerfile     # Backend container
    │   ├── main.py        # Main API application
    │   └── requirements.txt # Python dependencies
    ├── frontend/          # React frontend
    │   ├── Dockerfile     # Frontend container
    │   ├── package.json   # Node.js dependencies
    │   ├── vite.config.js # Vite configuration
    │   └── src/           # Source code
    │       ├── App.jsx    # Main React component
    │       ├── main.jsx   # Entry point
    │       └── components/ # React components
    └── uploads/           # File storage (gitignored)
        └── .gitkeep       # Preserve directory structure
```

## 🏷️ Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Management

- **Current Version**: See `VERSION` file
- **View Changes**: See `CHANGELOG.md`
- **Create Release**: `git tag v1.0.0`
- **Rollback**: `git checkout v1.0.0`

## 🔧 Configuration

### Environment Variables

Create `.env` file in the root directory:

```env
# Backend
CORS_ORIGIN=http://localhost:5173
UPLOAD_MAX_SIZE=100MB

# Frontend
VITE_API_URL=http://localhost:8000
```

### Docker Configuration

- **Backend Port**: 8000
- **Frontend Port**: 5173
- **Upload Volume**: `./Program/uploads:/app/uploads`

## 📊 API Endpoints

### Files
- `GET /files` - List files and folders
- `POST /upload` - Upload single file
- `POST /upload-folder` - Upload folder with structure
- `GET /download/{path}` - Download file or folder (as ZIP)
- `DELETE /files/{path}` - Delete file or folder
- `GET /files/{path}/content` - Get file content
- `PUT /files/{path}/content` - Update file content

### Folders
- `POST /folders` - Create new folder
- `POST /files/bulk-delete` - Delete multiple items
- `POST /files/operation` - Copy/move operations
- `GET /files/download-multiple` - Bulk download as ZIP

### Utilities
- `GET /files/{path}/thumbnail` - Get image thumbnails

## 🛠️ Development Commands

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Create version tag
git tag v1.1.0

# Push changes
git push origin main --tags
```

### Docker Commands
```bash
# Build and start
docker-compose up --build

# Restart services
docker-compose restart

# View logs
docker-compose logs

# Clean rebuild
docker-compose down && docker-compose up --build
```

## 🔒 Security Considerations

- File uploads are stored outside web root
- File type validation on upload
- Directory traversal protection
- CORS configuration
- Input sanitization
- File size limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Create a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check this README and API docs
- **Logs**: Use `docker-compose logs` for debugging

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.