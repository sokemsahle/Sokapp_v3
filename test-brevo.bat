@echo off
REM ============================================
REM TEST BREVO NETWORK CONNECTIVITY
REM ============================================

echo.
echo ============================================
echo  TESTING BREVO API CONNECTION
echo ============================================
echo.
echo This will test:
echo  1. DNS resolution for api.brevo.com
echo  2. Network connectivity to Brevo
echo  3. API key authentication
echo  4. Send a test email
echo.
echo Running tests...
echo ============================================
echo.

REM Run the network test
node test-brevo-network.js

echo.
echo ============================================
echo  TEST COMPLETE
echo ============================================
echo.
pause
