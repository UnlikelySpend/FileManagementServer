#!/bin/bash

# Build and run the File Management System with Docker Compose

echo "Building and starting File Management System..."

# Stop any running containers
docker-compose down

# Build and start containers
docker-compose up --build -d

# Show container status
echo ""
echo "Container status:"
docker-compose ps

echo ""
echo "File Management System is now running!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop, run: docker-compose down"