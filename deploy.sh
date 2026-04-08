#!/bin/bash

# SOKAPP Docker Deployment Script
# This script helps you deploy SOKAPP on your VPS

echo "================================"
echo "SOKAPP Docker Deployment"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    echo "✅ Docker installed successfully!"
else
    echo "✅ Docker is already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully!"
else
    echo "✅ Docker Compose is already installed"
fi

echo ""
echo "================================"
echo "Step 1: Environment Setup"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example.docker .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file before continuing!"
    echo "   Update these values:"
    echo "   - BACKEND_URL (your VPS IP or domain)"
    echo "   - FRONTEND_URL (your VPS IP or domain)"
    echo "   - SESSION_SECRET (generate a secure key)"
    echo "   - BREVO_API_KEY (if using email features)"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "================================"
echo "Step 2: Building and Starting Services"
echo "================================"

# Stop any running containers
echo "🛑 Stopping any running containers..."
docker-compose down

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "================================"
echo "Step 3: Verifying Deployment"
echo "================================"

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "================================"
echo "Checking Service Health"
echo "================================"

# Check backend
echo -n "Backend (Port 5000): "
if curl -s --max-time 5 http://localhost:5000/ > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not responding (check logs: docker-compose logs backend)"
fi

# Check frontend
echo -n "Frontend (Port 3000): "
if curl -s --max-time 5 http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not responding (check logs: docker-compose logs frontend)"
fi

echo ""
echo "================================"
echo "Deployment Complete! 🎉"
echo "================================"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://YOUR_VPS_IP:3000"
echo "   Backend:  http://YOUR_VPS_IP:5000"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:         docker-compose logs -f"
echo "   Restart services:  docker-compose restart"
echo "   Stop services:     docker-compose down"
echo "   Update app:        git pull && docker-compose up -d --build"
echo ""
echo "📖 For more information, see DOCKER_DEPLOYMENT.md"
echo ""
