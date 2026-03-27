@echo off
echo ================================================
echo COMPLETE FIX FOR CHILD AND EMPLOYEE ERRORS
echo ================================================
echo.
echo This will fix both issues:
echo 1. Child update foreign key error (programs table)
echo 2. Employee creation packet size error
echo.
pause

echo.
echo ================================================
echo Step 1: Fixing Programs Table...
echo ================================================
mysql -u root -p -P 3307 sokapptest < fix_programs_data.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to fix programs table!
    pause
    exit /b 1
)
echo Programs table fixed successfully!

echo.
echo ================================================
echo Step 2: Increasing MySQL Packet Size...
echo ================================================
mysql -u root -p -P 3307 -e "SET GLOBAL max_allowed_packet = 67108864;"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not set packet size temporarily
    echo You may need to manually edit my.ini
    echo See FIXES_APPLIED.md for instructions
) else (
    echo Packet size increased to 64MB (temporary)
)

echo.
echo ================================================
echo ALL FIXES APPLIED SUCCESSFULLY!
echo ================================================
echo.
echo Next steps:
echo 1. Restart your backend server
echo 2. Test child update
echo 3. Test employee creation
echo.
echo For permanent packet size fix, edit my.ini:
echo   [mysqld]
echo   max_allowed_packet=64M
echo.
pause
