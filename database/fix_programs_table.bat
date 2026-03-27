@echo off
echo ========================================
echo Fixing Programs Table
echo ========================================
echo.
echo This will recreate the programs table with the correct schema.
echo.
pause
echo.
echo Running SQL script...
mysql -u root -P 3307 -h 127.0.0.1 < fix_programs_table.sql
echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo SUCCESS! Programs table has been fixed.
    echo ========================================
) else (
    echo ========================================
    echo ERROR! Failed to fix programs table.
    echo Please check the error message above.
    echo ========================================
)
echo.
pause
