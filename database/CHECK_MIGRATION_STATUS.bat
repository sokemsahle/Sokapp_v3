@echo off
REM ============================================
REM QUICK FIX - Check if migration was run
REM ============================================

echo.
echo ============================================
echo CHECKING DATABASE MIGRATION STATUS
echo ============================================
echo.

REM Try to connect to MySQL and check column type
echo Checking children table profile_photo column...
mysql -u root -p -e "USE sokapptest; DESCRIBE children;" | findstr profile_photo

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Column found. Checking if it's LONGTEXT...
    mysql -u root -p -e "USE sokapptest; DESCRIBE children;" | findstr LONGTEXT
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo SUCCESS! Database is migrated to LONGTEXT
        echo Your database is ready for Base64 storage!
    ) else (
        echo.
        echo WARNING! Column is still VARCHAR, not LONGTEXT
        echo You need to run the migration!
        echo.
        echo Running migration now...
        mysql -u root -p sokapptest < database\UPDATE_TO_BASE64_STORAGE.sql
    )
) else (
    echo.
    echo ERROR: Cannot connect to MySQL
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database 'sokapptest' exists
    echo 3. Username/password is correct
)

echo.
pause
