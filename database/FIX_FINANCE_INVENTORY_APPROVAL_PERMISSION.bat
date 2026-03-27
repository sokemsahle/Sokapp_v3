@echo off
echo ============================================
echo FIX: Finance Role Inventory Approval Access
echo ============================================
echo.
echo This script will add inventory_view permission to the Finance role
echo so finance users can see the Request Approvals menu in Inventory.
echo.
pause

mysql -u root -p sokapptest < fix_finance_inventory_approval_permission.sql

echo.
echo ============================================
echo Fix completed!
echo ============================================
echo.
echo Finance users can now:
echo 1. See the Inventory tab in the sidebar
echo 2. See "Request Approvals" submenu under Inventory
echo 3. Approve and reject inventory requests
echo.
pause
