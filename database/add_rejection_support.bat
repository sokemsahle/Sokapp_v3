@echo off
echo ================================================
echo Adding Rejection Support to Requisitions Table
echo ================================================
echo.
echo This script will add the following columns to your requisitions table:
echo - rejection_note (TEXT)
echo - rejected_by (VARCHAR)
echo - rejected_at (TIMESTAMP)
echo.
echo Please ensure:
echo 1. MySQL server is running
echo 2. You have proper database credentials in .env file
echo.
pause

echo.
echo Running SQL script...
mysql -u root -p < add_rejection_support.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo SUCCESS! Rejection support has been added.
    echo ================================================
) else (
    echo.
    echo ================================================
    echo ERROR! Failed to execute SQL script.
    echo Please check the error message above and try again.
    echo ================================================
)

echo.
pause
