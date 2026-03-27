@echo off
echo ========================================
echo Adding program_id column to employees table
echo ========================================
echo.

REM Get MySQL password from user
set /p MYSQL_PASSWORD="Enter MySQL password for root user: "

REM Run the SQL script
echo Running database update...
mysql -u root -p%MYSQL_PASSWORD% -D sokapptest < database\add_program_id_to_employees.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database updated successfully
    echo ========================================
    echo.
    echo The employees table now has a program_id column
    echo You can now filter employees by program
) else (
    echo.
    echo ========================================
    echo ERROR! Failed to update database
    echo ========================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. You entered the correct password
    echo 3. The database 'sokapptest' exists
)

echo.
pause
