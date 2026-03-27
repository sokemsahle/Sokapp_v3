-- ============================================
-- QUICK CHECK: Do you have child_view permission?
-- Run this to see if YOUR user can view children
-- ============================================

USE sokapptest;

-- Change this email to YOUR email address
SET @my_email = 'admin@example.com';

-- This will show if YOU can view children
SELECT 
    u.email,
    u.full_name,
    r.name as your_role,
    ur.is_active as role_active,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.id AND p.name = 'child_view'
        ) THEN '✅ YES - You CAN view child profiles' 
        ELSE '❌ NO - You CANNOT view child profiles - RUN THE FIX!' 
    END as can_view_children,
    GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as your_child_permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Children'
WHERE u.email = @my_email
GROUP BY u.id, r.id, ur.is_active;

-- ============================================
-- BONUS: Show ALL users who can view children
-- ============================================

SELECT '📊 All Users Child Access Status:' as report;

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
            WHERE rp.role_id = r.id AND p.name = 'child_view'
        ) THEN '✅ CAN VIEW' 
        ELSE '❌ CANNOT VIEW' 
    END as child_access
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY 
    child_access DESC,
    r.name,
    u.email;
