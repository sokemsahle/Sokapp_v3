@echo off
echo ==========================================
echo SOKAPP Test Database Setup
echo ==========================================
echo.
echo This will create the sokapptest database
echo and set up all required tables.
echo.
echo Make sure MySQL is running on port 3307
echo.
pause

echo.
echo Creating database and tables...
mysql -u root -P 3307 < sokapptest_schema.sql

if %ERRORLEVEL% == 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Database setup complete.
    echo ==========================================
    echo.
    echo Default roles created:
    echo   - admin
    echo   - Finance
    echo   - HR
    echo   - Director
    echo   - Teacher
    echo   - Standard
    echo.
    echo Default forms created:
    echo   - Requisition Form (accessible by: admin, Finance, Director)
    echo   - Employee Form (accessible by: admin, HR, Director)
    echo.
    echo Next steps:
    echo   1. Restart the backend server
    echo   2. Create an admin user to log in
    echo.
) else (
    echo.
    echo ==========================================
    echo ERROR: Database setup failed!
    echo ==========================================
    echo.
    echo Please check:
    echo   - MySQL is running on port 3307
    echo   - Username 'root' is correct
    echo   - Password is empty (or edit this file)
    echo.
)

pause
