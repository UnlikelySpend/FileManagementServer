#!/usr/bin/env bash

# File Management Server - Version Manager
# Provides easy version control and rollback functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Get current version
get_current_version() {
    if [ -f "VERSION" ]; then
        cat VERSION
    else
        echo "0.0.0"
    fi
}

# Update version file
update_version_file() {
    echo "$1" > VERSION
    print_success "Updated VERSION file to $1"
}

# Create new version
create_version() {
    local version_type=$1
    local current_version=$(get_current_version)
    
    if [ "$current_version" = "0.0.0" ]; then
        new_version="1.0.0"
    else
        # Parse current version
        IFS='.' read -ra ADDR <<< "$current_version"
        major=${ADDR[0]}
        minor=${ADDR[1]}
        patch=${ADDR[2]}
        
        case $version_type in
            major)
                major=$((major + 1))
                minor=0
                patch=0
                ;;
            minor)
                minor=$((minor + 1))
                patch=0
                ;;
            patch)
                patch=$((patch + 1))
                ;;
            *)
                print_error "Invalid version type. Use: major, minor, or patch"
                exit 1
                ;;
        esac
        
        new_version="$major.$minor.$patch"
    fi
    
    echo $new_version
}

# Backup current state
create_backup() {
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_dir="backups/$backup_name"
    
    mkdir -p backups
    cp -r Program "$backup_dir"
    print_success "Created backup: $backup_dir"
    echo $backup_dir
}

# Show usage
show_usage() {
    echo "File Management Server - Version Manager"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  status                 Show current version and Git status"
    echo "  list                   List all version tags"
    echo "  create <type>          Create new version (major|minor|patch)"
    echo "  rollback <version>     Rollback to specific version"
    echo "  backup                 Create backup of current state"
    echo "  restore <backup>       Restore from backup"
    echo "  diff <version>         Show changes since version"
    echo "  deploy                 Deploy current version"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 create minor"
    echo "  $0 rollback v1.0.0"
    echo "  $0 backup"
}

# Show current status
show_status() {
    local current_version=$(get_current_version)
    local git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local git_status=$(git status --porcelain 2>/dev/null | wc -l)
    
    print_info "=== File Management Server Status ==="
    echo "Current Version: $current_version"
    echo "Git Branch: $git_branch"
    echo "Modified Files: $git_status"
    echo ""
    
    if [ $git_status -gt 0 ]; then
        print_warning "You have uncommitted changes"
        git status --short
    else
        print_success "Working directory is clean"
    fi
}

# List all versions
list_versions() {
    print_info "=== Available Versions ==="
    git tag -l --sort=-version:refname | head -10
    echo ""
    local total_tags=$(git tag -l | wc -l)
    if [ $total_tags -gt 10 ]; then
        print_info "Showing latest 10 versions (total: $total_tags)"
        print_info "Use 'git tag -l' to see all versions"
    fi
}

# Create new version
new_version() {
    local version_type=$1
    
    if [ -z "$version_type" ]; then
        print_error "Version type required (major|minor|patch)"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [ $(git status --porcelain | wc -l) -gt 0 ]; then
        print_warning "You have uncommitted changes. Commit them first."
        git status --short
        exit 1
    fi
    
    local new_version=$(create_version $version_type)
    
    print_info "Creating version $new_version ($version_type bump)"
    
    # Update version file
    update_version_file $new_version
    
    # Add and commit
    git add VERSION
    git commit -m "Bump version to $new_version

Version type: $version_type
Previous: $(git describe --tags --abbrev=0 2>/dev/null || echo 'none')

🤖 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    # Create tag
    git tag -a "v$new_version" -m "Release v$new_version

$(git log --oneline $(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo '--')..HEAD 2>/dev/null || echo 'Initial release')"
    
    print_success "Created version v$new_version"
    print_info "To push: git push origin main --tags"
}

# Rollback to version
rollback_version() {
    local target_version=$1
    
    if [ -z "$target_version" ]; then
        print_error "Target version required (e.g., v1.0.0)"
        exit 1
    fi
    
    # Add 'v' prefix if not present
    if [[ ! $target_version == v* ]]; then
        target_version="v$target_version"
    fi
    
    # Check if tag exists
    if ! git tag -l | grep -q "^$target_version$"; then
        print_error "Version $target_version not found"
        print_info "Available versions:"
        git tag -l
        exit 1
    fi
    
    print_warning "This will restore your project to $target_version"
    print_warning "Current changes will be lost!"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Rollback cancelled"
        exit 0
    fi
    
    # Create backup before rollback
    local backup_dir=$(create_backup)
    print_info "Backup created at: $backup_dir"
    
    # Checkout the version
    git checkout $target_version
    
    print_success "Rolled back to $target_version"
    print_warning "You are now in 'detached HEAD' state"
    print_info "To make changes: git checkout -b new-branch-name"
    print_info "To return to latest: git checkout main"
}

# Deploy current version
deploy_version() {
    print_info "Deploying File Management Server..."
    
    # Restart the application
    cd Program
    docker-compose down
    docker-compose up --build -d
    
    print_success "Deployment complete!"
    print_info "Frontend: http://localhost:5173"
    print_info "Backend: http://localhost:8000"
}

# Main script logic
case $1 in
    status)
        show_status
        ;;
    list)
        list_versions
        ;;
    create)
        new_version $2
        ;;
    rollback)
        rollback_version $2
        ;;
    backup)
        create_backup
        ;;
    deploy)
        deploy_version
        ;;
    diff)
        if [ -z "$2" ]; then
            print_error "Version required for diff"
            exit 1
        fi
        git diff $2..HEAD
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        if [ -z "$1" ]; then
            show_status
        else
            print_error "Unknown command: $1"
            show_usage
            exit 1
        fi
        ;;
esac