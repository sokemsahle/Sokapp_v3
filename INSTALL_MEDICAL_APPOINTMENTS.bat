@echo off
REM =====================================================
REM QUICK FIX - Install Medical Appointment Auto-Creation
REM =====================================================
REM This will set up everything needed for automatic
REM medical appointments
REM =====================================================

echo.
echo ========================================
echo  INSTALLING MEDICAL APPOINTMENT FEATURE
echo ========================================
echo.
echo This will:
echo 1. Create Nurse role
echo 2. Set up automatic appointment trigger
echo 3. Configure 24-hour email reminders
echo.
echo Please ensure:
echo - MySQL/MariaDB is running
echo - You have database access
echo - You have backed up your database (recommended)
echo.
pause

echo.
echo ========================================
echo  Running SQL Setup Script...
echo ========================================
echo.

mysql -u root -p sokapptest < database\add_nurse_role_and_auto_appointments.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✅ SUCCESS! Installation Complete
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Create at least one Nurse user (if not exists)
    echo 2. Test by creating a medical record with next appointment date
    echo 3. Check calendar to see if appointment was created
    echo.
    echo To test now, run: RUN_TEST_APPOINTMENT.bat
    echo.
) else (
    echo.
    echo ========================================
    echo  ❌ ERROR! Installation Failed
    echo ========================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database name is correct (sokapptest)
    echo 3. You have proper permissions
    echo.
)

pause