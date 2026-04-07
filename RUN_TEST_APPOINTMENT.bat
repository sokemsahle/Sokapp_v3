@echo off
REM =====================================================
REM TEST MEDICAL APPOINTMENT AUTO-CREATION
REM =====================================================

echo.
echo ========================================
echo  TESTING MEDICAL APPOINTMENT FEATURE
echo ========================================
echo.

mysql -u root -p sokapptest < database\test_medical_appointment_auto_create.sql

echo.
echo ========================================
echo  TEST COMPLETE
echo ========================================
echo.
echo Check the output above:
echo - If you see appointment created: ✅ Feature is working!
echo - If no appointment: ❌ Run INSTALL_MEDICAL_APPOINTMENTS.bat first
echo.
pause