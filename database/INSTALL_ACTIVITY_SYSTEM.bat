@echo off
REM ============================================
REM INSTALL USER ACTIVITY REPORTING SYSTEM
REM ============================================
REM This script will install the User Activity Reporting System
REM for the SOKAPP application

echo.
echo ============================================
echo  USER ACTIVITY REPORTING SYSTEM INSTALLER
echo ============================================
echo.

REM Check if MySQL is accessible
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MySQL command not found!
    echo Please ensure MySQL is installed and added to PATH.
    echo.
    pause
    exit /b 1
)

echo Step 1: Database Backup
echo -------------------------------------------
echo Creating backup of current database...
echo.

set BACKUP_FILE=sokapptest_backup_before_activity_%DATE:~-4,4%%DATE:~-7,2%%DATE:~-10,2%.sql
mysqldump -u root -p sokapptest > %BACKUP_FILE% 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Backup may have failed. Continue anyway?
    choice /C YN /M "Continue"
    if errorlevel 2 exit /b 1
) else (
    echo Backup created: %BACKUP_FILE%
)

echo.
echo Step 2: Install Activity Reporting System
echo -------------------------------------------
echo Running installation script...
echo.

mysql -u root -p sokapptest < add_user_activity_reporting.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Installation failed!
    echo Please check the error messages above.
    echo You can restore from backup: mysql -u root -p sokapptest ^< %BACKUP_FILE%
    pause
    exit /b 1
)

echo.
echo ============================================
echo  INSTALLATION COMPLETED SUCCESSFULLY!
echo ============================================
echo.
echo Next Steps:
echo 1. Verify installation by running:
echo    mysql -u root -p -e "USE sokapptest; SELECT COUNT(*) FROM user_activity_log;"
echo.
echo 2. View today's activity:
echo    SELECT * FROM v_today_activity;
echo.
echo 3. See README_USER_ACTIVITY.md for usage guide
echo 4. Run report queries from USER_ACTIVITY_REPORT_QUERIES.sql
echo.
echo Files Created:
echo - add_user_activity_reporting.sql (Installation script)
echo - USER_ACTIVITY_REPORT_QUERIES.sql (Report library)
echo - LOGIN_LOGOUT_TRACKING.sql (Session tracking)
echo - README_USER_ACTIVITY.md (User guide)
echo - ACTIVITY_REPORTING_SUMMARY.md (Quick reference)
echo.
pause
