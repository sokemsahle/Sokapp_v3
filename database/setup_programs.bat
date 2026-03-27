@echo off
echo ==========================================
echo Adding Programs Table and program_id columns
echo ==========================================
echo.
echo This will add the programs table and program_id
echo columns to employees, requisitions, users,
echo inventory, and children tables.
echo.
echo Make sure MySQL is running on port 3307
echo.
pause

echo.
echo Running SQL migration...
mysql -u root -P 3307 < add_programs_table.sql

if %ERRORLEVEL% == 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Programs table added.
    echo ==========================================
    echo.
    echo Default programs created:
    echo   - Main Program
    echo   - Youth Program
    echo   - Emergency Program
    echo   - Family Reunification
    echo.
    echo Next steps:
    echo   1. Restart the backend server
    echo   2. Test program filtering in all modules
    echo.
) else (
    echo.
    echo ==========================================
    echo ERROR: Migration failed!
    echo ==========================================
    echo.
    echo Please check:
    echo   - MySQL is running on port 3307
    echo   - Username 'root' is correct
    echo   - Password is empty (or edit this file)
    echo.
)

pause
