@echo off
echo ============================================
echo ADD INVENTORY MANAGEMENT TO FINANCE ROLE
echo ============================================
echo.
echo This script will add full inventory management permissions
echo to the Finance role, allowing finance users to:
echo   - Add new inventory items
echo   - Edit existing items
echo   - Delete items
echo   - Adjust stock levels
echo   - View transaction log
echo   - Approve/reject inventory requests
echo.
pause

mysql -u root -p sokapptest < add_inventory_manage_to_finance.sql

echo.
echo ============================================
echo Permission update completed!
echo ============================================
echo.
echo Finance users can now manage inventory items.
echo Please restart the backend server for changes to take effect.
echo.
pause
