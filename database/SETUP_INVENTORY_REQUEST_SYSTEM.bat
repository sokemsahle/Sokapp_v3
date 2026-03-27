@echo off
echo ============================================
echo ENHANCED INVENTORY REQUEST SYSTEM SETUP
echo ============================================
echo.
echo This script will:
echo 1. Create inventory_requests table
echo 2. Add sample inventory items (optional)
echo 3. Set up database trigger for auto-stock management
echo 4. Update role permissions
echo.
echo Database: sokapptest
echo.
pause

mysql -u root -p sokapptest < enhanced_inventory_request_system.sql

echo.
echo ============================================
echo Setup completed!
echo ============================================
echo.
echo NEXT STEPS:
echo 1. The inventory request table is now created
echo 2. Backend route file created at: Backend/routes/inventory.routes.js
echo 3. You need to register this route in server.js
echo.
echo To register the route, add this line to server.js:
echo const inventoryRoutes = require('./routes/inventory.routes');
echo app.use('/api/inventory', inventoryRoutes);
echo.
pause
