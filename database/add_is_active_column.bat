@echo off
echo ============================================
echo Adding is_active column to programs table
echo ============================================
echo.

mysql -u root -P 3307 sokapptest < add_is_active_column.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo SUCCESS! Column added successfully
    echo ============================================
) else (
    echo.
    echo ============================================
    echo ERROR! Check the error message above
    echo ============================================
    echo If the error says column already exists, that's OK - you can skip this step.
)

echo.
pause
