@echo off
REM ============================================
REM RESTART BACKEND SERVER - CLEAN RESTART
REM ============================================

echo.
echo ============================================
echo RESTARTING BACKEND SERVER
echo ============================================
echo.

echo Step 1: Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Done!

echo.
echo Step 2: Waiting for ports to release...
timeout /t 2 /nobreak >nul
echo Done!

echo.
echo Step 3: Starting new backend server...
cd /d "%~dp0.."
cd Backend

echo.
echo ============================================
echo BACKEND SERVER STARTING...
echo ============================================
echo.
echo Press Ctrl+C to stop the server
echo You should see "Server running on port 5000..."
echo ============================================
echo.

npm start
