# Version Control Guide

Quick reference for managing versions and rollbacks in the File Management Server project.

## 🚀 Quick Commands

### Check Current Status
```bash
./version-manager.sh status
# or just
./version-manager.sh
```

### List All Versions
```bash
./version-manager.sh list
```

### Create New Version
```bash
# Patch release (1.0.0 → 1.0.1) - Bug fixes
./version-manager.sh create patch

# Minor release (1.0.1 → 1.1.0) - New features  
./version-manager.sh create minor

# Major release (1.1.0 → 2.0.0) - Breaking changes
./version-manager.sh create major
```

### Rollback to Previous Version
```bash
# Rollback to specific version
./version-manager.sh rollback v1.0.0

# Create backup before rollback (automatic)
./version-manager.sh backup
```

### Deploy Current Version
```bash
./version-manager.sh deploy
```

## 📋 Version Management Workflow

### 1. Making Changes
```bash
# Make your code changes
# Test the changes
# When ready to create a version:

# Check status
./version-manager.sh status

# Commit your changes
git add .
git commit -m "Add new feature"

# Create new version
./version-manager.sh create minor
```

### 2. Rolling Back if Issues Found
```bash
# If you need to rollback
./version-manager.sh list                 # See available versions
./version-manager.sh rollback v1.0.0      # Rollback to stable version
./version-manager.sh deploy               # Deploy the rollback
```

### 3. Emergency Rollback
```bash
# Quick rollback to last known good version
git tag -l --sort=-version:refname | head -2    # See last 2 versions
./version-manager.sh rollback v1.0.0            # Rollback to previous
./version-manager.sh deploy                     # Deploy immediately
```

## 🏷️ Version Numbering

We follow [Semantic Versioning](https://semver.org/):

### MAJOR.MINOR.PATCH (e.g., 2.1.3)

- **MAJOR** (2.x.x): Breaking changes that require user action
  - API changes that break existing functionality
  - Major UI redesigns
  - Database schema changes

- **MINOR** (x.1.x): New features that are backward compatible
  - New file management features
  - UI improvements
  - New API endpoints

- **PATCH** (x.x.3): Bug fixes that are backward compatible
  - Bug fixes
  - Security patches
  - Minor UI tweaks

## 📁 Git Structure

```
main branch:
├── v1.0.0 (tag) ← Current production
├── v1.0.1 (tag) ← Bug fix
├── v1.1.0 (tag) ← New features
└── HEAD         ← Latest development
```

## 🔄 Common Scenarios

### Scenario 1: Bug Fix Release
```bash
# Fix the bug
git add .
git commit -m "Fix folder download issue"

# Create patch version
./version-manager.sh create patch  # 1.0.0 → 1.0.1

# Deploy
./version-manager.sh deploy
```

### Scenario 2: New Feature Release
```bash
# Add the feature
git add .
git commit -m "Add file sharing functionality"

# Create minor version
./version-manager.sh create minor  # 1.0.1 → 1.1.0

# Deploy
./version-manager.sh deploy
```

### Scenario 3: Emergency Rollback
```bash
# Something is broken in production
./version-manager.sh rollback v1.0.0  # Go back to last stable
./version-manager.sh deploy            # Deploy the stable version

# Later, when fixed:
git checkout main                      # Return to development
# Fix the issue
./version-manager.sh create patch     # New version with fix
```

### Scenario 4: Major Rewrite
```bash
# Complete rewrite of a major component
git add .
git commit -m "Rewrite authentication system"

# Create major version (breaking change)
./version-manager.sh create major  # 1.1.0 → 2.0.0

# Deploy
./version-manager.sh deploy
```

## 📂 Backup System

### Automatic Backups
- Created automatically before rollbacks
- Stored in `backups/` directory
- Named with timestamp: `backup-20250524-140530`

### Manual Backup
```bash
./version-manager.sh backup
```

### Restore from Backup
```bash
# List backups
ls backups/

# Restore manually
cp -r backups/backup-20250524-140530/* Program/
./version-manager.sh deploy
```

## 🔍 Checking Changes

### See what changed since last version
```bash
./version-manager.sh diff v1.0.0
```

### See commit history
```bash
git log --oneline --graph
```

### Compare two versions
```bash
git diff v1.0.0..v1.1.0
```

## 🚨 Emergency Procedures

### If Version Manager Breaks
```bash
# Manual rollback using Git
git tag -l                    # List versions
git checkout v1.0.0          # Checkout stable version
cd Program && docker-compose up --build -d  # Deploy
```

### If Docker Issues
```bash
# Clean rebuild
cd Program
docker-compose down
docker system prune -f
docker-compose up --build -d
```

### If Git Issues
```bash
# Check Git status
git status
git log --oneline -5

# Reset to last commit if needed
git reset --hard HEAD

# Or reset to specific version
git reset --hard v1.0.0
```

## 📋 Best Practices

1. **Always test before creating versions**
2. **Use descriptive commit messages**
3. **Create versions frequently for major changes**
4. **Keep backups of important versions**
5. **Document breaking changes in CHANGELOG.md**
6. **Test rollback procedures regularly**

## 🆘 Getting Help

```bash
./version-manager.sh help    # Show all commands
git --help                   # Git help
docker-compose --help        # Docker help
```