@echo off
echo ============================================
echo FIX: MariaDB Trigger Syntax
echo ============================================
echo.
echo This will create the inventory request trigger with correct syntax
echo.
pause

mysql -u root -p sokapptest < FIX_TRIGGER_SYNTAX.sql

echo.
echo ============================================
echo Trigger created successfully!
echo ============================================
echo.
echo To verify, run this in phpMyAdmin:
echo SHOW TRIGGERS LIKE 'inventory_requests';
echo.
pause
