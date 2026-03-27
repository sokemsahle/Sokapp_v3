@echo off
REM ==========================================
REM SOKAPP - Frontend Development Server (Port 3000)
REM ==========================================
REM This script ensures the frontend runs on port 3000 ONLY

echo.
echo ========================================
echo   SOKAPP - Frontend Development Server
echo ========================================
echo.
echo Starting React development server...
echo Frontend will run on: http://localhost:3000
echo Backend API should be running on: http://localhost:5000
echo.

REM Check if port 3000 is already in use
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use!
    echo Please close the application using port 3000 or use a different port.
    echo.
    pause
    exit /b 1
)

REM Set environment variables
set PORT=3000
set REACT_APP_API_URL=http://localhost:5000
set BROWSER=chrome

REM Start the React development server with explicit port
echo [INFO] Starting React on port 3000...
call npm start --port 3000

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] React development server failed to start!
    echo Please check for errors above.
    pause
    exit /b 1
)

echo.
echo Frontend server stopped.
echo.
pause
