-- ============================================
-- ADD INVENTORY_MANAGE PERMISSION TO FINANCE ROLE
-- ============================================
-- This script gives finance users full inventory management capabilities
-- including: Add, Edit, Delete items, and manage stock adjustments
-- ============================================

USE sokapptest;

-- Check current Finance role permissions
SELECT 'Current Finance Role Permissions:' AS info;
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2
ORDER BY p.id;

-- STEP 1: Ensure inventory_view permission exists (should already be there)
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, 2)  -- Finance role gets inventory_view
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- STEP 2: Add inventory_manage permission to Finance role
-- This allows finance users to:
-- - Add new inventory items
-- - Edit existing items
-- - Delete items
-- - Adjust stock levels
-- - View transaction log
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, 3)  -- Finance role gets inventory_manage (permission_id = 3)
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Verify the changes
SELECT 'Updated Finance Role Permissions:' AS info;
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2
ORDER BY p.id;

-- Confirm that finance users now have both inventory permissions
SELECT 'Verification Summary:' AS info;
SELECT 
    COUNT(*) as total_inventory_permissions,
    SUM(CASE WHEN p.name = 'inventory_view' THEN 1 ELSE 0 END) as has_inventory_view,
    SUM(CASE WHEN p.name = 'inventory_manage' THEN 1 ELSE 0 END) as has_inventory_manage
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2
AND p.name IN ('inventory_view', 'inventory_manage');

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- After running this script, finance users will be able to:
-- 1. See the Inventory tab in the sidebar (requires inventory_view) ✅
-- 2. See "Add New Item" submenu under Inventory ✅
-- 3. Add new inventory items through the form ✅
-- 4. Edit existing items ✅
-- 5. Delete items ✅
-- 6. Adjust stock levels (stock in/out) ✅
-- 7. View transaction log ✅
-- 8. Approve/reject inventory requests ✅
--
-- The frontend code has been updated to check for:
-- - inventory_manage permission OR
-- - finance role
--
-- You only need to run this script to give finance users full inventory management.
-- ============================================
