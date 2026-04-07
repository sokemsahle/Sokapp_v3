@echo off
REM =====================================================
REM APPLY FIX: UPDATED TRIGGER FOR NURSE ATTENDEES
REM =====================================================
REM This will install the fixed trigger that:
REM - Creates ONE appointment PER active nurse
REM - Assigns each nurse as attendee properly
REM - Includes proper description (not blank)
REM - Prevents duplicates
REM =====================================================

echo.
echo ============================================
echo  Installing Fixed Trigger for Nurse Attendees
echo ============================================
echo.
echo The new trigger will:
echo - Create ONE appointment per active nurse (not just one total)
echo - Each nurse will be properly assigned as attendee
echo - All appointments will have proper descriptions
echo - No more duplicate appointments!
echo.
echo WARNING: This will drop and recreate the trigger.
echo.
pause

echo.
echo Applying fix...
echo.

mysql -u root -p sokapptest < database\fix_trigger_for_nurse_attendees.sql

echo.
echo ============================================
echo  Fix Applied Successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Create a test medical record with next appointment date
echo 2. Run CHECK_APPOINTMENT_FIX.bat to verify
echo.
pause
