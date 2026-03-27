@echo off
REM Batch file to set up Child Management System database
REM Run this AFTER setting up the base sokapptest database

echo ============================================
echo CHILD MANAGEMENT SYSTEM - DATABASE SETUP
echo ============================================
echo.
echo This will create:
echo - Tier 1: Core Child Table
echo - Tier 2: Guardian, Legal, Medical, Education, Case History Tables
echo - New Permissions for Child Management
echo.
echo IMPORTANT: Ensure MySQL is running on port 3307
echo.
pause

REM Get MySQL credentials from user
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD="Enter MySQL password (press Enter if none): "

echo.
echo Running SQL schema...
echo.

REM Execute SQL file
if "%MYSQL_PASSWORD%"=="" (
    mysql -u %MYSQL_USER% -P 3307 < child_management_schema.sql
) else (
    mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% -P 3307 < child_management_schema.sql
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo DATABASE SETUP COMPLETED SUCCESSFULLY!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Restart your Node.js server
    echo 2. Assign child permissions to roles as needed
    echo 3. Test the API endpoints
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: DATABASE SETUP FAILED
    echo ============================================
    echo Please check:
    echo - MySQL is running
    echo - Database 'sokapptest' exists
    echo - You have proper permissions
    echo.
)

pause
