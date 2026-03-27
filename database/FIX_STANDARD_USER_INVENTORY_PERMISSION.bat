@echo off
echo ============================================
echo FIX: Adding Inventory Permission to Standard Users
echo ============================================
echo.
echo This script will add the following permissions to Standard users:
echo - inventory_view (to see Inventory tab)
echo - dashboard_view
echo - settings_view
echo - requisition_create
echo - employee_view
echo.
echo Database: sokapptest
echo.
pause

mysql -u root -p sokapptest < fix_standard_user_inventory_permission.sql

echo.
echo ============================================
echo Fix completed!
echo ============================================
echo.
echo IMPORTANT: You must now:
echo 1. Restart your backend server
echo 2. Logout and login again as a standard user
echo 3. Check if Inventory tab appears in sidebar
echo.
pause
