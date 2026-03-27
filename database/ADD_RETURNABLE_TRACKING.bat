@echo off
REM ============================================
REM ADD RETURNABLE ITEMS TRACKING SYSTEM
REM ============================================
REM This script will add the returnable tracking system to your inventory
REM 
REM Instructions:
REM 1. Make sure MySQL is installed and accessible from command line
REM 2. Update the MySQL credentials below if needed
REM 3. Double-click this file to run the migration
REM ============================================

echo.
echo ============================================
echo Adding Returnable Items Tracking System
echo ============================================
echo.

REM MySQL connection settings - UPDATE THESE IF NEEDED
set MYSQL_USER=root
set MYSQL_PASS=
set MYSQL_HOST=localhost
set MYSQL_DB=sokapptest

echo Database: %MYSQL_DB%
echo.
echo Running migration...
echo.

REM Execute the SQL file
mysql -u %MYSQL_USER% -p%MYSQL_PASS% -h %MYSQL_HOST% %MYSQL_DB% < add_returnable_tracking.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Migration completed successfully!
    echo ============================================
    echo.
    echo New features added:
    echo - returnable_transactions table created
    echo - Checkout/Return tracking enabled
    echo - Automatic inventory updates on checkout/return
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Migration failed!
    echo ============================================
    echo.
    echo Possible issues:
    echo - MySQL is not installed or not in PATH
    echo - Incorrect username/password
    echo - Database does not exist
    echo - Table already exists
    echo.
    echo Please check the error message above and try again.
    echo.
)

pause
