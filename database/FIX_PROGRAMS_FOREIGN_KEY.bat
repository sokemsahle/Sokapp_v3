@echo off
echo ================================================
echo Fixing Child Program Foreign Key Issue
echo ================================================
echo.

echo Step 1: Running programs data fix...
mysql -u root -p -P 3307 sokapptest < fix_programs_data.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to fix programs table!
    pause
    exit /b 1
)

echo.
echo ================================================
echo Fix complete! Please restart your backend server.
echo ================================================
pause
