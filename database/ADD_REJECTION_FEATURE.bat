@echo off
cls
echo =========================================================================
echo                  REJECTION FEATURE - DATABASE SETUP
echo =========================================================================
echo.
echo This script will add rejection support to your requisitions table.
echo.
echo Changes:
echo   - Add rejection_note column (TEXT)
echo   - Add rejected_by column (VARCHAR)
echo   - Add rejected_at column (TIMESTAMP)
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
mysql -u root -p < add_rejection_support.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo SUCCESS! Database updated successfully.
    echo =========================================================================
    echo.
    echo The rejection feature is now available in your requisition system.
    echo Users with requisition roles (reviewer, approver, authorizer, admin)
    echo can now reject requisitions with a reason.
    echo.
    echo Next steps:
    echo   1. Restart your backend server
    echo   2. Test the rejection feature
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
    echo      - Copy and paste contents of add_rejection_support.sql
    echo      - Click Go
    echo.
)

pause
