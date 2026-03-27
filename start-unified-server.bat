@echo off
REM ==========================================
REM SOKAPP - Unified Server Startup Script
REM ==========================================
REM This script builds the React app and starts the unified server
REM Everything runs on http://localhost:5000

echo.
echo ========================================
echo   SOKAPP - Unified Server Startup
echo ========================================
echo.

REM Step 1: Build React app
echo [1/3] Building React application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: React build failed!
    echo Please fix the build errors and try again.
    pause
    exit /b 1
)

echo.
echo [OK] React build completed successfully
echo.

REM Step 2: Start backend server
echo [2/3] Starting backend server...
echo.
cd Backend
call npm start

REM Step 3: Server is running
echo.
echo [3/3] Server startup complete!
echo.
echo ========================================
echo   Application is running at:
echo   http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
pause
