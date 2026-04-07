@echo off
REM =====================================================
REM APPLY FINAL FIX - Single Appointment, No Description
REM =====================================================

echo.
echo ========================================
echo  APPLYING FINAL TRIGGER FIX
echo ========================================
echo.
echo This will update the trigger to:
echo - Create ONLY ONE appointment (no duplicates)
echo - Leave description BLANK/EMPTY
echo - Assign creator as attendee
echo.
pause

echo.
echo ========================================
echo  Running Fix Script...
echo ========================================
echo.

mysql -u root -p sokapptest < database\fix_trigger_for_nurse_attendees.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✅ SUCCESS! Trigger Updated
    echo ========================================
    echo.
    echo The trigger now:
    echo - Creates ONE appointment total (not per nurse)
    echo - Leaves description empty/blank
    echo - No duplicate appointments
    echo.
    echo Next steps:
    echo 1. Run CLEANUP_DUPLICATES.bat to remove old duplicates
    echo 2. Create a test medical record with next_appointment_date
    echo 3. Check calendar - should see only ONE appointment
    echo.
) else (
    echo.
    echo ========================================
    echo  ❌ ERROR! Fix Failed
    echo ========================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database name is correct (sokapptest)
    echo 3. You have proper permissions
    echo.
)

pause