@echo off
REM ============================================
REM RESTART BACKEND SERVER
REM ============================================
REM This script restarts the backend server
REM to apply the new route changes

echo ============================================
echo RESTARTING BACKEND SERVER
echo ============================================
echo.

REM Kill any existing Node processes on port 5000
echo Stopping existing Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Navigate to Backend folder
cd /d "%~dp0Backend"

REM Clear console
cls

echo Starting Backend Server...
echo ============================================
echo.

REM Start the server
npm start

pause
