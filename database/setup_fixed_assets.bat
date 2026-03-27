@echo off
echo ============================================
echo FIXED ASSET MANAGEMENT SETUP
echo ============================================
echo.

REM Get the directory where this batch file is located
cd /d "%~dp0"

echo Running Fixed Assets SQL script...
echo.

mysql -u root -p < add_fixed_assets.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo FIXED ASSET MANAGEMENT SETUP COMPLETED!
    echo ============================================
    echo.
    echo Database tables created:
    echo - fixed_assets
    echo - asset_maintenance_log
    echo.
    echo Lookup categories added:
    echo - Asset Category (10 categories)
    echo.
    echo Permissions added:
    echo - asset_view, asset_create, asset_update, asset_delete, asset_maintenance
    echo.
    echo ============================================
) else (
    echo.
    echo ============================================
    echo ERROR: Setup failed!
    echo ============================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. You have correct permissions
    echo 3. The database 'sokapptest' exists
    echo.
)

pause
