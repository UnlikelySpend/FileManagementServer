# File Management System

A modern web-based file management system with dark/light mode support, containerized with Docker for easy deployment.

## Features
- File upload/download
- File deletion
- Dark/light mode toggle
- Responsive UI
- Real-time file listing
- Dockerized for easy deployment

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed on your machine

### Running with Docker

1. Clone the repository and navigate to the project directory:
```bash
cd "File Management System Application"
```

2. Build and run with Docker Compose:
```bash
docker-compose up --build
```

Or run in detached mode:
```bash
docker-compose up --build -d
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Stopping the Application
```bash
docker-compose down
```

## Manual Setup (Alternative)

### Backend
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
# Install dependencies
npm install

# Run frontend
npm run dev
```

## Deployment to Another Machine

1. Copy the entire project folder to the target machine

2. Ensure Docker and Docker Compose are installed on the target machine

3. Navigate to the project directory and run:
```bash
docker-compose up --build -d
```

### Production Deployment

For production environments, use the production compose file:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

Create a `.env` file based on `.env.example` with your production settings.

## Environment Variables

- `CORS_ORIGIN`: Frontend URL for CORS configuration (default: http://localhost:5173)
- `VITE_API_URL`: Backend API URL for frontend (default: http://localhost:8000)

## Docker Commands

- Build images: `docker-compose build`
- Start containers: `docker-compose up -d`
- Stop containers: `docker-compose down`
- View logs: `docker-compose logs -f`
- Remove volumes: `docker-compose down -v`

## Tech Stack
- Frontend: React, Chakra UI, Vite
- Backend: FastAPI, Python
- Container: Docker, Docker Compose
- File Operations: Python aiofiles 