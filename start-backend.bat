@echo off
REM ==========================================
REM SOKAPP - Backend API Server
REM ==========================================
REM This script starts ONLY the backend API server on port 5000

echo.
echo ========================================
echo   SOKAPP - Backend API Server
echo ========================================
echo.
echo Starting backend server...
echo Backend API will run on: http://localhost:5000
echo.

cd Backend
call npm start

echo.
echo Backend server stopped.
echo.
pause
