@echo off
REM ==========================================
REM SOKAPP - Frontend Development Server
REM ==========================================
REM This script starts ONLY the React frontend on port 3000
REM Backend API must be running separately on port 5000

echo.
echo ========================================
echo   SOKAPP - Frontend Development Server
echo ========================================
echo.
echo Starting React development server...
echo Frontend will run on: http://localhost:3000
echo Backend API should be running on: http://localhost:5000
echo.

REM Set PORT environment variable for React dev server (Windows syntax)
set PORT=3000
set REACT_APP_API_URL=http://localhost:5000

REM Start the React development server with explicit port
call npm start --port 3000

echo.
echo Frontend server stopped.
echo.
pause
