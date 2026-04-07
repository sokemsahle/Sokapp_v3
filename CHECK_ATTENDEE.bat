@echo off
REM =====================================================
REM CHECK ATTENDEE ISSUE
REM =====================================================

echo.
echo ========================================
echo  CHECKING ATTENDEE ASSIGNMENT ISSUE
echo ========================================
echo.

mysql -u root -p sokapptest < database\check_attendee_issue.sql

echo.
echo ========================================
echo  DIAGNOSIS COMPLETE
echo ========================================
echo.
echo Review the output above to see:
echo - If nurses exist in the system
echo - What attendee_user_id is being set to
echo - If appointments are assigned to nurses
echo.
pause