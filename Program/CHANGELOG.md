# Changelog

## [2.0.0] - 2025-01-24

### Added
- ♻️ **Recycle Bin** - Non-destructive file deletion with restore capability
- 🎨 **6 Color Themes** - Ocean Blue, Forest Green, Royal Purple, Sunset Orange, Cherry Blossom, Tropical Teal
- ⏰ **Recent Files Panel** - Track and quickly access recently viewed files
- 📌 **Folder Bookmarks** - Save and organize frequently accessed folders
- 📋 **Cut/Copy/Paste** - Full clipboard operations with keyboard shortcuts
- 🎬 **Rich Media Previews** - Support for PDF, video, and audio file previews
- 🔍 **Advanced Search** - Multi-criteria file search with filters
- 📦 **Bulk ZIP Download** - Download multiple files as a single archive

### Changed
- Enhanced UI with collapsible sidebar containing Bookmarks, Recent Files, and Recycle Bin
- Improved theme system with CSS custom properties
- Better error handling and loading states
- Upgraded file viewer with support for more file types

### Fixed
- Import errors with non-existent Chakra UI icons
- Docker volume mapping for development
- Recent files API response format
- Duplicate CSS hover attributes

### Technical
- Added React Context for clipboard management
- Implemented advanced search endpoint with recursive directory scanning
- Enhanced backend with recycle bin metadata management
- Added volume mapping for frontend development

## [1.0.0] - 2025-01-23

### Initial Release
- Basic file upload/download functionality
- File listing with sorting
- Simple file viewer with text editing
- Dark/light mode toggle
- Docker containerization
- Responsive design