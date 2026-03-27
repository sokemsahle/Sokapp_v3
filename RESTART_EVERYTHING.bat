@echo off
echo ========================================
echo  RESTARTING ALL SERVERS - PLEASE WAIT
echo ========================================
echo.

echo [1/4] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo Done!
echo.

echo [2/4] Waiting for ports to be freed...
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k "cd Backend && node server.js"
timeout /t 5 /nobreak >nul
echo Backend starting on port 5000...
echo.

echo [4/4] Starting Frontend Server...
start "Frontend Server" cmd /k "npm start"
echo Frontend starting on port 3000...
echo.

echo ========================================
echo  SERVERS STARTING!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Wait 30 seconds for frontend to compile
echo 2. Open http://localhost:3000
echo 3. Press Ctrl+Shift+R to hard refresh
echo 4. Log in and check for changes
echo.
echo For Admin:
echo   - Click Organization in sidebar
echo   - Look for "WiFi IPs" submenu item
echo.
echo For Employee Dashboard:
echo   - Look below your profile header
echo   - Should see Attendance Tracker widget
echo.
echo ========================================
pause
