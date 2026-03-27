@echo off
REM ============================================
REM CHECK REVIEWER EMAIL SETUP
REM ============================================
REM This script runs the diagnostic SQL queries
REM to help troubleshoot reviewer email issues

echo.
echo ============================================
echo  CHECKING REVIEWER EMAIL SETUP
echo ============================================
echo.
echo This will check:
echo  1. If requisition_roles table exists
echo  2. All configured roles
echo  3. Active reviewers
echo  4. User accounts
echo.
echo Please open phpMyAdmin or MySQL and run:
echo   source database\CHECK_REVIEWER_EMAIL.sql
echo.
echo Or copy-paste the SQL queries from that file.
echo ============================================
echo.

REM Open the SQL file in Notepad for easy copying
notepad database\CHECK_REVIEWER_EMAIL.sql

echo.
echo The SQL file has been opened in Notepad.
echo Copy and run the queries in phpMyAdmin or MySQL console.
echo.
pause
