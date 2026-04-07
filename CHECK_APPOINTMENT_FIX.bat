@echo off
REM =====================================================
REM CHECK APPOINTMENT FIX STATUS
REM =====================================================
REM This will show you:
REM - Nurse role and active nurses
REM - Recent medical appointments created
REM - Whether duplicates exist
REM - Whether nurses are assigned as attendees
REM =====================================================

echo.
echo ============================================
echo  Checking Appointment Fix Status
echo ============================================
echo.

echo Running checks...
echo.

mysql -u root -p sokapptest < database\test_appointment_fix.sql

echo.
echo ============================================
echo  Check Complete!
echo ============================================
echo.
echo Review the results above:
echo.
echo EXPECTED RESULTS (if working correctly):
echo - Nurse role exists
echo - At least 1 active nurse user
echo - Trigger 'after_medical_record_insert' exists
echo - Recent appointments show nurse attendees
echo - NO duplicates found
echo - Descriptions are NOT empty
echo.
pause
