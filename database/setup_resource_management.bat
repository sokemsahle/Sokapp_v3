@echo off
echo ============================================
echo SETTING UP RESOURCE MANAGEMENT SYSTEM
echo ============================================
echo.

REM Get the directory of this batch file
set "SCRIPT_DIR=%~dp0"

REM MySQL connection parameters - adjust if needed
set "MYSQL_USER=root"
set "MYSQL_PASS="
set "MYSQL_HOST=localhost"
set "MYSQL_PORT=3306"
set "MYSQL_DB=sokapptest"

echo Running SQL script...
echo.

REM Run the SQL script
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% %MYSQL_DB% < "%SCRIPT_DIR%add_resource_management.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo RESOURCE MANAGEMENT SETUP COMPLETED!
    echo ============================================
    echo.
    echo Tables created:
    echo - rooms
    echo - beds
    echo.
    echo Children table updated with:
    echo - room_id column
    echo - bed_id column
    echo.
    echo Permissions added for resource management
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR: Setup failed!
    echo ============================================
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database credentials are correct
    echo 3. child_management_schema.sql was run first
    echo.
)

pause
