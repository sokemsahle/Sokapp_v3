@echo off
REM ============================================
REM TEST EMAIL SETUP
REM ============================================
REM This script tests if email is configured correctly

echo.
echo ============================================
echo  TESTING EMAIL SETUP
echo ============================================
echo.
echo This will test:
echo  1. Database connection
echo  2. requisition_roles table exists
echo  3. Active reviewers configured
echo  4. Brevo API key configuration
echo  5. Send a test email
echo.
echo Running test...
echo ============================================
echo.

REM Run the test script
node test-email-setup.js

echo.
echo ============================================
echo  TEST COMPLETE
echo ============================================
echo.
echo Check the results above for any FAIL messages.
echo If all tests PASS, check your email inbox!
echo.
pause
