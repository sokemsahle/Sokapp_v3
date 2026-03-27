@echo off
REM =====================================================
REM MEDICAL RECORDS DATABASE UPDATE SCRIPT
REM Run this to add Home Health Care and Ongoing Health fields
REM =====================================================

echo.
echo ========================================
echo  MEDICAL RECORDS SCHEMA UPDATE
echo ========================================
echo.
echo This script will update the child_medical_records table with:
echo - Home Health Care Note fields
echo - Ongoing Health Note fields
echo.
echo Please ensure:
echo 1. MySQL/MariaDB is running
echo 2. You have access to sokapptest database
echo 3. You have backed up your database (recommended)
echo.
pause

echo.
echo Running SQL update...
echo.

REM Run the SQL script using mysql command line
mysql -u root -p sokapptest < database\UPDATE_MEDICAL_RECORDS_SCHEMA.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Database updated successfully.
    echo ========================================
    echo.
    echo New features added:
    echo ✓ Note type toggle (Home/Ongoing Health)
    echo ✓ Growth metrics tracking
    echo ✓ Vital signs monitoring
    echo ✓ Medical visit documentation
    echo ✓ Appointment scheduling
    echo.
    echo Next steps:
    echo 1. Restart your frontend server
    echo 2. Test the new Medical Records form
    echo 3. See QUICK_START_MEDICAL_UPDATE.md for testing guide
    echo.
) else (
    echo.
    echo ========================================
    echo  ERROR! Failed to update database.
    echo ========================================
    echo.
    echo Possible solutions:
    echo 1. Check if MySQL is running
    echo 2. Verify database name is 'sokapptest'
    echo 3. Check user permissions
    echo 4. Try running SQL manually in phpMyAdmin
    echo.
    echo Manual option:
    echo - Open phpMyAdmin
    echo - Select sokapptest database
    echo - Click SQL tab
    echo - Copy contents from database\UPDATE_MEDICAL_RECORDS_SCHEMA.sql
    echo - Paste and click Go
    echo.
)

pause
