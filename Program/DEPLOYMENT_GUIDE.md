# File Management System - Deployment Guide

## Docker Deployment Instructions

### Prerequisites
- Docker and Docker Compose installed on target machine
- Ports 5173 (frontend) and 8000 (backend) available

### Quick Start

1. **Copy the project folder to your target machine**
   - Ensure all files are transferred, including the hidden .dockerignore files

2. **Navigate to the project directory:**
   ```bash
   cd "File Management System Application"
   ```

3. **Build and run the containers:**
   ```bash
   docker compose up --build -d
   ```
   Note: Use `docker-compose` on older Docker versions

4. **Verify the services are running:**
   ```bash
   docker compose ps
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

### Managing the Application

#### View logs:
```bash
docker compose logs -f
```

#### Stop the application:
```bash
docker compose down
```

#### Remove all data (including uploaded files):
```bash
docker compose down -v
```

#### Restart the application:
```bash
docker compose restart
```

### Production Deployment

For production environments:

1. Create a `.env` file with production settings:
   ```env
   CORS_ORIGIN=https://your-domain.com
   API_URL=https://api.your-domain.com
   ```

2. Use the production compose file:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

### Troubleshooting

1. **Port conflicts:**
   - Frontend default: 5173
   - Backend default: 8000
   - Modify ports in docker-compose.yml if needed

2. **Permission issues:**
   - Ensure the uploads directory has proper permissions
   - The Docker container creates this directory automatically

3. **Build failures:**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild without cache: `docker compose build --no-cache`

### Data Persistence

- Uploaded files are stored in a Docker volume
- Data persists between container restarts
- Backup the volume data regularly in production

### Security Notes

- Change default ports in production
- Use HTTPS with proper SSL certificates
- Configure firewall rules appropriately
- Keep Docker and dependencies updated