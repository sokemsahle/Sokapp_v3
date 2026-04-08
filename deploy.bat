@echo off
REM SOKAPP Docker Deployment Helper for Windows
REM This script helps you prepare for deployment

echo ================================
echo SOKAPP Docker Deployment Prep
echo ================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker is not installed.
    echo Please install Docker Desktop for Windows:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Docker is installed
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Compose is not available.
    echo Please ensure Docker Desktop is running.
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Docker Compose is available
)

echo.
echo ================================
echo Step 1: Environment Setup
echo ================================

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example.docker .env
    echo [OK] .env file created!
    echo.
    echo IMPORTANT: Please edit the .env file before continuing!
    echo Update these values:
    echo   - BACKEND_URL ^(your VPS IP or domain^)
    echo   - FRONTEND_URL ^(your VPS IP or domain^)
    echo   - SESSION_SECRET ^(generate a secure key^)
    echo   - BREVO_API_KEY ^(if using email features^)
    echo.
    pause
) else (
    echo [OK] .env file already exists
)

echo.
echo ================================
echo Step 2: Build and Deploy
echo ================================
echo.
echo To deploy, run these commands:
echo.
echo   docker-compose down
echo   docker-compose build --no-cache
echo   docker-compose up -d
echo.
echo Or use the automated script on your VPS:
echo   chmod +x deploy.sh
echo   ./deploy.sh
echo.

REM Ask if user wants to build now
set /p BUILD_NOW="Do you want to build now? (y/n): "
if /i "%BUILD_NOW%"=="y" (
    echo.
    echo Stopping any running containers...
    docker-compose down
    
    echo.
    echo Building Docker images...
    docker-compose build --no-cache
    
    echo.
    echo Starting services...
    docker-compose up -d
    
    echo.
    echo ================================
    echo Deployment Complete!
    echo ================================
    echo.
    echo Service Status:
    docker-compose ps
    
    echo.
    echo Access your application:
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:5000
    echo.
    echo View logs: docker-compose logs -f
)

echo.
pause
