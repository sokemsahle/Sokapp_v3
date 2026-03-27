@echo off
REM ============================================
REM QUICK FIX: Child Profile Not Visible
REM This will attempt to fix the issue automatically
REM ============================================

echo.
echo ========================================
echo  CHILD PROFILE FIX - AUTOMATED SCRIPT
echo ========================================
echo.
echo This script will help you fix the child profile visibility issue.
echo.
echo INSTRUCTIONS:
echo 1. Open phpMyAdmin (http://localhost:8080)
echo 2. Select 'sokapptest' database
echo 3. Click SQL tab
echo 4. Copy content from: database\FIX_ALL_USERS_CHILD_ACCESS.sql
echo 5. Paste and click Go
echo.
echo OR use MySQL command line if installed:
echo.
pause

REM Try to run MySQL command if available
echo Attempting to connect to MySQL...
mysql -u root -P 3307 sokapptest < database\FIX_ALL_USERS_CHILD_ACCESS.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  SUCCESS! SQL executed.
    echo ========================================
    echo.
    echo NEXT STEPS:
    echo 1. Logout from the application
    echo 2. Login again
    echo 3. Child Profiles menu should appear
    echo.
    echo If it still doesn't work, restart the backend server.
    echo.
) else (
    echo.
    echo ========================================
    echo  MySQL command failed.
    echo ========================================
    echo.
    echo Please use phpMyAdmin instead:
    echo 1. Open http://localhost:8080
    echo 2. Select 'sokapptest' database
    echo 3. Click SQL tab
    echo 4. Copy and paste content from: database\FIX_ALL_USERS_CHILD_ACCESS.sql
    echo 5. Click Go
    echo.
)

echo IMPORTANT: After running the fix, you MUST logout and login again!
echo.
pause
