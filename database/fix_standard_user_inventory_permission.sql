-- ============================================
-- FIX: Add inventory_view permission to Standard users
-- ============================================
-- This script adds the missing permissions to the Standard role (role_id = 6)
-- so they can see the Inventory tab in the sidebar

-- First, let's check what permissions the Standard role currently has
SELECT 'Current Standard role permissions:' AS info;
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 6;

-- Add inventory_view permission (permission_id = 2)
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (6, 2)
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Add dashboard_view permission (permission_id = 1) if not exists
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (6, 1)
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Add settings_view permission (permission_id = 11) if not exists
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (6, 11)
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Add requisition_create permission (permission_id = 13) if not exists
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (6, 13)
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Add employee_view permission (permission_id = 18) if not exists
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (6, 18)
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Verify the changes
SELECT 'Updated Standard role permissions:' AS info;
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 6
ORDER BY p.id;

-- Show all users with Standard role
SELECT 'Users with Standard role:' AS info;
SELECT u.id, u.full_name, u.email, r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Standard';
