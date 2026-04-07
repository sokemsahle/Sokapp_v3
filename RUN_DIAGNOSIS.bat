@echo off
REM =====================================================
REM DIAGNOSE APPOINTMENT CREATION ISSUE
REM =====================================================
REM This script checks what's missing in your setup
REM =====================================================

echo.
echo ========================================
echo  DIAGNOSING APPOINTMENT CREATION ISSUE
echo ========================================
echo.
echo Checking database setup...
echo.

mysql -u root -p sokapptest < database\diagnose_appointment_issue.sql

echo.
echo ========================================
echo  DIAGNOSIS COMPLETE
echo ========================================
echo.
echo Review the output above for issues.
echo Common fixes:
echo - If Nurse role missing: Run add_nurse_role_and_auto_appointments.sql
echo - If trigger missing: Run add_nurse_role_and_auto_appointments.sql
echo - If no nurses: Create a nurse user via frontend or SQL
echo.
pause