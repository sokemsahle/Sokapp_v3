@echo off
REM =====================================================
REM CLEANUP DUPLICATE APPOINTMENTS
REM =====================================================
REM This will remove all duplicate medical appointments
REM keeping only one per nurse per appointment time
REM =====================================================

echo.
echo ============================================
echo  Cleaning Up Duplicate Appointments
echo ============================================
echo.
echo This will:
echo - Find all duplicate medical appointments
echo - Keep only ONE per nurse per time
echo - Remove the extras
echo.
pause

echo.
echo Running cleanup...
echo.

mysql -u root -p sokapptest < database\cleanup_duplicate_appointments.sql

echo.
echo ============================================
echo  Cleanup Complete!
echo ============================================
echo.
echo Review the output above to see:
echo - Duplicates that were removed
echo - Remaining appointments summary
echo.
pause
