@echo off
REM Batch file to add 'notified' column to requisitions table
REM This tracks whether requesters have been notified of requisition finalization

echo ========================================
echo Adding 'notified' column to requisitions table
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Run the SQL file using mysql command
echo Executing SQL script...
mysql -u root -p sokapptest < "%SCRIPT_DIR%add_notified_column.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Database updated successfully!
    echo ========================================
    echo.
    echo The 'notified' column has been added to the requisitions table.
    echo This will track when requesters are notified of approved requisitions.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to update database
    echo ========================================
    echo.
    echo Please ensure:
    echo 1. MySQL is running
    echo 2. You have the correct database name 'sokapptest'
    echo 3. Your MySQL user has permission to alter tables
)

pause
