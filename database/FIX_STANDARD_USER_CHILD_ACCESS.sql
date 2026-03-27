-- ============================================
-- FIX STANDARD USER CHILD PROFILE ACCESS
-- ============================================
-- This script grants child_view permission to standard users
-- so they can access child profiles based on their role.
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: Check current permissions
-- ============================================
SELECT '📊 CURRENT USER PERMISSIONS:' as status;

SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.role_id AND p.name = 'child_view'
        ) THEN '✅ HAS ACCESS' 
        ELSE '❌ NO ACCESS' 
    END as child_profile_access
FROM users u
JOIN user_roles r ON u.id = r.user_id
ORDER BY u.id;

-- ============================================
-- STEP 2: Grant child_view to Standard Role
-- ============================================
-- Uncomment ONLY the roles you want to give access to

-- Option A: Give ALL roles access (including Standard)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Option B: Give specific roles only (uncomment as needed)
-- -- Give HR role access
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id FROM roles r, permissions p 
-- WHERE r.name = 'HR' AND p.name = 'child_view'
-- ON DUPLICATE KEY UPDATE role_id = role_id;

-- -- Give Director role access
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id FROM roles r, permissions p 
-- WHERE r.name = 'Director' AND p.name = 'child_view'
-- ON DUPLICATE KEY UPDATE role_id = role_id;

-- -- Give Teacher role access
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id FROM roles r, permissions p 
-- WHERE r.name = 'Teacher' AND p.name = 'child_view'
-- ON DUPLICATE KEY UPDATE role_id = role_id;

-- -- Give Finance role access
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id FROM roles r, permissions p 
-- WHERE r.name = 'Finance' AND p.name = 'child_view'
-- ON DUPLICATE KEY UPDATE role_id = role_id;

-- -- Give Standard role access
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id FROM roles r, permissions p 
-- WHERE r.name = 'Standard' AND p.name = 'child_view'
-- ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- STEP 3: Verify permissions were granted
-- ============================================
SELECT '✅ VERIFICATION - Roles with child_view:' as status;

SELECT 
    r.name as role_name,
    COUNT(p.id) as child_permissions_count,
    GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as child_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Children'
GROUP BY r.id, r.name
HAVING child_permissions_count > 0
ORDER BY r.id;

-- ============================================
-- STEP 4: Check which users are affected
-- ============================================
SELECT '👥 USERS WHO NOW HAVE ACCESS:' as status;

SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role,
    '✅ Can now view child profiles' as access_status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.id 
    WHERE rp.role_id = r.id AND p.name = 'child_view'
)
ORDER BY u.id;

-- ============================================
-- STEP 5: Users who still DON'T have access
-- ============================================
SELECT '⚠️ USERS WHO STILL CANNOT VIEW:' as status;

SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role,
    '❌ Cannot view child profiles' as access_status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.id 
    WHERE rp.role_id = r.id AND p.name = 'child_view'
)
ORDER BY u.id;

-- ============================================
-- IMPORTANT NEXT STEPS:
-- ============================================
SELECT '💡 NEXT STEPS:' as info;
SELECT '1. Logout from the application' as step;
SELECT '2. Login again to refresh your permissions' as step;
SELECT '3. Child Profiles should now appear in sidebar (if you have permission)' as step;
SELECT '4. If still not visible, restart backend server' as step;
