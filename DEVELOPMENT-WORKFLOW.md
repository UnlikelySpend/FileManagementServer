# Development Workflow

Standard process for making changes, testing, versioning, and releasing to GitHub.

## 🔄 **Standard Workflow**

### **1. Development Phase**
```bash
# Check current status
bash version-manager.sh status

# Make your code changes
# Edit files, add features, fix bugs...

# Test locally
bash version-manager.sh deploy  # Restart application to test changes
```

### **2. Testing Phase**
```bash
# Verify application is working
# Test at: http://localhost:5173
# Check all functionality works as expected

# If issues found:
# - Fix the issues
# - Restart: bash version-manager.sh deploy
# - Test again
```

### **3. Version Release Phase**
```bash
# Once testing confirms everything works:

# Commit changes
git add .
git commit -m "Descriptive commit message"

# Create new version (choose appropriate type)
bash version-manager.sh create patch   # Bug fixes (1.0.0 → 1.0.1)
bash version-manager.sh create minor   # New features (1.0.0 → 1.1.0)
bash version-manager.sh create major   # Breaking changes (1.0.0 → 2.0.0)

# Push to GitHub
git push origin main --tags
```

## 🎯 **Version Types Guide**

### **Patch Release (x.x.1)**
- Bug fixes
- Security patches  
- Minor UI tweaks
- Performance improvements

**Example:**
```bash
# Fix download button bug
bash version-manager.sh create patch
```

### **Minor Release (x.1.x)**
- New features
- UI improvements
- New API endpoints
- Enhanced functionality

**Example:**
```bash
# Add file sharing feature
bash version-manager.sh create minor
```

### **Major Release (1.x.x)**
- Breaking changes
- Major UI redesign
- API changes
- Database schema changes

**Example:**
```bash
# Complete authentication rewrite
bash version-manager.sh create major
```

## 🧪 **Testing Checklist**

Before creating a new version, verify:

### **Core Functionality**
- [ ] File upload works (single files)
- [ ] Folder upload works (preserves structure)
- [ ] File download works
- [ ] Folder download works (creates ZIP)
- [ ] File/folder deletion works
- [ ] Folder navigation works
- [ ] Search functionality works
- [ ] Sorting works (name, size, date)

### **UI Components**
- [ ] All buttons respond correctly
- [ ] View buttons open files/folders
- [ ] Download buttons work for files and folders
- [ ] Bulk selection works
- [ ] Toolbar appears when items selected
- [ ] Breadcrumb navigation works

### **Backend API**
- [ ] All endpoints respond
- [ ] File operations complete successfully
- [ ] Error handling works properly
- [ ] ZIP creation works for folders

### **Docker Deployment**
- [ ] Application starts without errors
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend accessible at http://localhost:8000
- [ ] File uploads persist in volumes

## 🚨 **Rollback Procedure**

If issues are discovered after release:

### **Quick Rollback**
```bash
# Rollback to previous stable version
bash version-manager.sh list                    # See available versions
bash version-manager.sh rollback v1.0.0         # Rollback to stable
bash version-manager.sh deploy                  # Deploy the rollback
```

### **Fix and Re-release**
```bash
# After rollback, fix the issues
# Make fixes...
# Test thoroughly...

# Create new version with fixes
git add .
git commit -m "Fix issues from previous release"
bash version-manager.sh create patch            # Bug fix release
git push origin main --tags
```

## 📋 **Example Development Session**

```bash
# Starting development
cd /mnt/c/Users/JayTu/Projects/FileManagementServer
bash version-manager.sh status

# Make changes (example: add new feature)
# Edit Program/frontend/src/components/EnhancedFileManager.jsx
# Add new functionality...

# Test the changes
bash version-manager.sh deploy
# Go to http://localhost:5173 and test thoroughly

# If working correctly, commit and release
git add .
git commit -m "Add file preview feature for documents

✨ Features added:
- PDF preview in file viewer
- Word document preview
- Improved file type detection
- Enhanced preview modal"

# Create minor version (new feature)
bash version-manager.sh create minor

# Push to GitHub
git push origin main --tags
```

## 🔧 **Useful Commands**

### **Development**
```bash
bash version-manager.sh status        # Check current state
bash version-manager.sh deploy        # Restart application
docker-compose logs                   # View application logs
```

### **Version Management**
```bash
bash version-manager.sh list          # List all versions
bash version-manager.sh create minor  # Create new version
git push origin main --tags           # Push to GitHub
```

### **Emergency**
```bash
bash version-manager.sh rollback v1.0.0  # Emergency rollback
bash version-manager.sh backup           # Manual backup
```

## 📊 **GitHub Integration**

### **Repository Updates**
After pushing new versions:
- ✅ **New commits** appear in repository
- ✅ **Version tags** appear in releases section
- ✅ **Release notes** generated automatically
- ✅ **CHANGELOG.md** should be updated manually for major releases

### **Checking GitHub**
- **Repository**: https://github.com/UnlikelySpend/FileManagementServer
- **Releases**: https://github.com/UnlikelySpend/FileManagementServer/releases
- **Latest Code**: https://github.com/UnlikelySpend/FileManagementServer/tree/main

## 🎯 **Best Practices**

1. **Always test before versioning**
2. **Use descriptive commit messages**
3. **Choose appropriate version types**
4. **Keep changes focused per version**
5. **Update documentation for major changes**
6. **Test rollback procedures occasionally**
7. **Backup before major changes**

## 🆘 **Troubleshooting**

### **If deployment fails:**
```bash
docker-compose down
docker system prune -f
docker-compose up --build -d
```

### **If Git push fails:**
```bash
git status
git pull origin main
git push origin main --tags
```

### **If version creation fails:**
```bash
git status                    # Check for uncommitted changes
git add . && git commit -m "Fix"  # Commit changes first
bash version-manager.sh create patch
```