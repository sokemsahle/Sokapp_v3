@echo off
REM ============================================
REM CREATE INVENTORY TABLE WITH EXPIRY & RETURNABLE
REM ============================================
REM This script will:
REM 1. Create inventory table if it doesn't exist
REM 2. Add has_expiry_date, expiry_date, and is_returnable columns
REM 
REM Instructions:
REM 1. Make sure MySQL is installed and accessible from command line
REM 2. Update the MySQL credentials below if needed
REM 3. Double-click this file to run
REM ============================================

echo.
echo ============================================
echo Creating/Updating Inventory Table
echo ============================================
echo.

REM MySQL connection settings - UPDATE THESE IF NEEDED
set MYSQL_USER=root
set MYSQL_PASS=
set MYSQL_HOST=localhost
set MYSQL_DB=sokapptest

echo Database: %MYSQL_DB%
echo.
echo Running SQL script...
echo.

REM Execute the SQL file
mysql -u %MYSQL_USER% -p%MYSQL_PASS% -h %MYSQL_HOST% %MYSQL_DB% < CREATE_INVENTORY_WITH_EXPIRY_RETURNABLE.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS!
    echo ============================================
    echo.
    echo The inventory table now exists with:
    echo - has_expiry_date (TINYINT)
    echo - expiry_date (DATE)
    echo - is_returnable (TINYINT)
    echo.
    echo You can now update inventory items!
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Script failed!
    echo ============================================
    echo.
    echo Possible issues:
    echo - MySQL is not installed or not in PATH
    echo - Incorrect username/password
    echo - Database does not exist
    echo - Foreign key constraint issue (programs table missing)
    echo.
    echo Please check the error message above.
    echo.
)

pause
