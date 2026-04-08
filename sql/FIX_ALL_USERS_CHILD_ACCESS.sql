-- ============================================
-- CRITICAL FIX: ALL USERS MUST SEE CHILD PROFILE
-- Run this IMMEDIATELY in phpMyAdmin
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: Ensure child_view permission exists
-- ============================================

INSERT INTO permissions (name, description, category) 
VALUES 
('child_view', 'View child profiles', 'Children'),
('child_create', 'Create new child profile', 'Children'),
('child_update', 'Update child profile', 'Children'),
('child_delete', 'Delete child profile', 'Children'),
('guardian_manage', 'Manage guardian information', 'Children'),
('legal_manage', 'Manage legal documents', 'Children'),
('medical_manage', 'Manage medical records', 'Children'),
('education_manage', 'Manage education records', 'Children'),
('case_manage', 'Manage case history', 'Children')
ON DUPLICATE KEY UPDATE 
description = VALUES(description), 
category = VALUES(category);

-- ============================================
-- STEP 2: Give EVERY ROLE the child_view permission
-- This is CRITICAL - ALL users must have this
-- ============================================

-- Insert child_view permission for ALL roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- STEP 3: Verify ALL roles now have child_view
-- ============================================

SELECT '✅ VERIFICATION - All Roles Should Have child_view:' as status;
SELECT 
    r.id as role_id,
    r.name as role_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.id AND p.name = 'child_view'
        ) THEN 'YES ✅' 
        ELSE 'NO ❌ - RUN FIX AGAIN!' 
    END as has_child_view_permission
FROM roles r
ORDER BY r.id;

-- ============================================
-- STEP 4: Check YOUR specific user
-- Replace with your email if needed
-- ============================================

SELECT '🔍 YOUR USER CHECK - Update email below:' as status;
SET @check_email = 'admin@example.com'; -- CHANGE THIS TO YOUR EMAIL

SELECT 
    u.email,
    u.full_name,
    r.name as your_role,
    GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as your_permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = @check_email
GROUP BY u.id, r.id;

-- ============================================
-- STEP 5: List ALL users and their roles
-- ============================================

SELECT '👥 ALL USERS AND THEIR ROLES:' as status;
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    ur.is_active,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.id AND p.name = 'child_view'
        ) THEN 'CAN VIEW CHILDREN ✅' 
        ELSE 'CANNOT VIEW CHILDREN ❌' 
    END as child_access_status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.id;

-- ============================================
-- STEP 6: Clear permission cache notice
-- ============================================

SELECT '⚠️ IMPORTANT NEXT STEPS:' as notice;
SELECT '1. Logout from the application' as step;
SELECT '2. Login again with your credentials' as step;
SELECT '3. Child Profiles menu should now appear' as step;
SELECT '4. If still not visible, restart the backend server' as step;

-- ============================================
-- FINAL SUMMARY
-- ============================================

SELECT '📊 FINAL PERMISSION SUMMARY:' as summary;
SELECT 
    r.name as role,
    COUNT(rp.permission_id) as total_permissions,
    SUM(CASE WHEN p.category = 'Children' THEN 1 ELSE 0 END) as child_permissions,
    MAX(CASE WHEN p.name = 'child_view' THEN 1 ELSE 0 END) as has_child_view
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.id;
