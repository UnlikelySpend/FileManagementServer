# File Management System v2.0 🗂️

A comprehensive, modern web-based file management system with advanced features including recycle bin, themes, bookmarks, and rich media previews. Built with React and FastAPI, containerized with Docker for easy deployment.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## ✨ Features

### Core Functionality
- 📁 **File Operations** - Upload, download, delete, rename files and folders
- 📋 **Clipboard Operations** - Cut, copy, paste with keyboard shortcuts (Ctrl+C/X/V)
- 🔍 **Advanced Search** - Search by name, type, size, date with multiple filters
- 📦 **Bulk Operations** - Select multiple files for batch operations
- 🗜️ **ZIP Download** - Download multiple files as a single archive

### Enhanced Features (v2.0)
- ♻️ **Recycle Bin** - Non-destructive deletion with restore capability
- 🎨 **Theme System** - 6 beautiful color themes + dark/light mode
- ⏰ **Recent Files** - Quick access to recently viewed files
- 📌 **Folder Bookmarks** - Save frequently accessed folders
- 🎬 **Rich Previews** - View PDFs, videos, audio files, and images
- 📊 **File Information** - Detailed metadata and file statistics

### UI/UX Features
- 🎯 Drag & drop file upload
- 📱 Fully responsive design
- ⌨️ Keyboard shortcuts support
- 🔄 Real-time updates
- 💫 Smooth animations
- 🎪 Collapsible sidebar

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for development)
- Python 3.9+ (for development)

### Running with Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/UnlikelySpend/FileManagementServer.git
cd FileManagementServer/Program
```

2. Build and run with Docker Compose:
```bash
docker-compose up --build -d
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Stopping the Application
```bash
docker-compose down
```

## 🎨 Available Themes

- 🌊 **Ocean Blue** - Default calming blue theme
- 🌿 **Forest Green** - Nature-inspired green
- 💜 **Royal Purple** - Elegant purple theme
- 🌅 **Sunset Orange** - Warm orange tones
- 🌸 **Cherry Blossom** - Soft pink theme
- 🐚 **Tropical Teal** - Vibrant teal colors

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+C | Copy selected files |
| Ctrl+X | Cut selected files |
| Ctrl+V | Paste files |
| Ctrl+A | Select all files |
| Delete | Delete selected files |

## 📸 Screenshots

### Main Interface
- Clean, modern file browser with sidebar panels
- Breadcrumb navigation
- Advanced search filters

### Features in Action
- Recycle bin with restore options
- Theme selector with live preview
- Rich media file previews
- Drag-and-drop uploads

## 🛠️ Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Project Structure
```
FileManagementServer/Program/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   └── App.jsx      # Main app component
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml   # Docker configuration
├── uploads/            # File storage
└── recycle_bin/        # Deleted files
```

## 🔧 Configuration

### Environment Variables

**Backend:**
- `CORS_ORIGIN` - Frontend URL (default: http://localhost:5173)
- `UPLOAD_DIR` - Upload directory path
- `RECYCLE_DIR` - Recycle bin directory

**Frontend:**
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

### Docker Volumes
- `./uploads:/app/uploads` - Persistent file storage
- `./frontend/src:/app/src` - Hot reload for development

## 📝 API Documentation

When running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints
- `GET /files` - List files with sorting and filtering
- `POST /upload` - Upload single or multiple files
- `DELETE /files/{path}` - Move file to recycle bin
- `GET /search` - Advanced search with filters
- `POST /files/operation` - Copy/move operations
- `GET /recycle-bin` - List deleted files
- `POST /recycle-bin/restore` - Restore deleted files

## 🚢 Production Deployment

For production environments:

1. Update environment variables in `.env`
2. Use production Docker Compose file:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Set up reverse proxy (nginx/Apache)
4. Configure SSL certificates
5. Set up backup strategy for uploads

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [Chakra UI](https://chakra-ui.com/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
- Containerized with [Docker](https://www.docker.com/)

## 📞 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/UnlikelySpend/FileManagementServer/issues) page.

---

**Current Version:** 2.0.0 | **Last Updated:** January 2025