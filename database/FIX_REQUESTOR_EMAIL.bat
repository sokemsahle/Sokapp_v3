@echo off
cls
echo =========================================================================
echo                  FIX REQUESTOR EMAIL COLUMN
echo =========================================================================
echo.
echo This script will add the missing requestor_email column to your
echo requisitions table, along with other required columns.
echo.
echo Changes:
echo   - Add requestor_email column (VARCHAR)
echo   - Add user_id column (INT)
echo   - Add program_id column (INT)
echo   - Add unique_id column (VARCHAR)
echo   - Update status enum to include 'rejected'
echo.
echo =========================================================================
echo.

REM Check if MySQL is accessible
where mysql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MySQL command not found in PATH.
    echo.
    echo Please ensure MySQL is installed and added to your system PATH.
    echo Alternatively, you can run the SQL file manually from phpMyAdmin.
    echo.
    pause
    exit /b 1
)

echo Starting database update...
echo.

REM Try to run the SQL script
mysql -u root -p < fix_requestor_email.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo SUCCESS! Database updated successfully.
    echo =========================================================================
    echo.
    echo The requestor_email column has been added to the requisitions table.
    echo Rejection emails should now work properly.
    echo.
    echo Next steps:
    echo   1. Restart your backend server
    echo   2. Test rejecting a requisition
    echo   3. Check if the requester receives the email
    echo.
) else (
    echo.
    echo =========================================================================
    echo ERROR! Database update failed.
    echo =========================================================================
    echo.
    echo Possible solutions:
    echo   1. Check if MySQL server is running
    echo   2. Verify your MySQL password
    echo   3. Run the SQL file manually from phpMyAdmin:
    echo      - Open phpMyAdmin
    echo      - Select your database
    echo      - Click on SQL tab
    echo      - Copy and paste contents of fix_requestor_email.sql
    echo      - Click Go
    echo.
)

pause
