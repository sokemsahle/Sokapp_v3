-- ============================================
-- FIX: Add Inventory Management Permissions to Finance Role
-- ============================================
-- This script gives finance users with inventory management permission
-- access to the Request Approvals menu in inventory
-- ============================================

USE sokapptest;

-- Check current Finance role permissions
SELECT 'Current Finance Role Permissions:' AS info;
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2
ORDER BY p.id;

-- STEP 1: Add inventory_view permission to Finance role if not exists
-- This allows finance users to see the Inventory tab
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, 2)  -- Finance role gets inventory_view
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- STEP 2: Add inventory_manage permission to Finance role
-- This allows finance users to manage inventory requests and see Transaction Log
-- Uncomment the line below if you want finance users to have full inventory management
-- INSERT INTO role_permissions (role_id, permission_id) 
-- VALUES (2, 3)  -- Finance role gets inventory_manage
-- ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Verify the changes
SELECT 'Updated Finance Role Permissions:' AS info;
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2
ORDER BY p.id;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- The frontend code has been updated to allow finance users to:
-- 1. See the Inventory tab (requires inventory_view permission) ✅
-- 2. See "Request Approvals" submenu (checks for finance role OR inventory_manage permission) ✅
-- 3. Access the approval page (checks for finance role OR inventory_manage permission) ✅
--
-- You only need to run STEP 1 above to give finance users inventory_view permission.
-- The frontend will automatically handle the rest by checking if the user is a finance role.
-- ============================================
