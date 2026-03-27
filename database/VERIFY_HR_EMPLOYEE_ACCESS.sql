-- ============================================
-- VERIFY HR USER EMPLOYEE ACCESS SETUP
-- Run this to check if HR users are set up correctly
-- ============================================

SELECT '=== STEP 1: Check HR Role Exists ===' as step;
SELECT id, name, description, is_active 
FROM roles 
WHERE name = 'HR';

SELECT '=== STEP 2: Check Employee Permissions Exist ===' as step;
SELECT id, name, description, category 
FROM permissions 
WHERE name IN ('employee_view', 'employee_edit', 'employee_manage')
ORDER BY name;

SELECT '=== STEP 3: Check HR Role Has employee_view Permission ===' as step;
SELECT 
    r.name as role_name,
    p.name as permission_name,
    rp.role_id,
    rp.permission_id
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'HR' AND p.name = 'employee_view';

SELECT '=== STEP 4: List ALL HR Role Permissions ===' as step;
SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'HR'
ORDER BY p.category, p.name;

SELECT '=== STEP 5: Find All Users with HR Role ===' as step;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    r.name as role_name,
    u.role_id,
    GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as permissions
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'HR'
GROUP BY u.id, r.id;

SELECT '=== STEP 6: Verify Specific HR User (CHANGE EMAIL) ===' as step;
-- REPLACE 'your-hr-user@example.com' with actual HR user email
SET @hr_user_email = 'your-hr-user@example.com';

SELECT 
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    r.name as role_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.id AND p.name = 'employee_view'
        ) THEN '✅ CAN VIEW EMPLOYEES' 
        ELSE '❌ CANNOT VIEW EMPLOYEES - MISSING PERMISSION' 
    END as employee_view_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.id AND p.name = 'employee_edit'
        ) THEN '✅ CAN EDIT EMPLOYEES' 
        ELSE '❌ CANNOT EDIT EMPLOYEES' 
    END as employee_edit_status
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = @hr_user_email;

SELECT '=== STEP 7: Quick Fix - Add employee_view to HR Role ===' as step;
SELECT 'Run this if HR role is missing employee_view permission:' as instruction;
SELECT '
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = ''HR'' AND p.name = ''employee_view''
ON DUPLICATE KEY UPDATE role_id = role_id;
' as sql_to_run;

SELECT '=== STEP 8: Verify All Active Users and Their Access ===' as step;
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    u.is_active,
    CASE 
        WHEN r.name = 'HR' AND EXISTS (
            SELECT 1 FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE rp.role_id = r.id AND p.name = 'employee_view'
        ) THEN '✅ SHOULD SEE EMPLOYEES TAB' 
        ELSE '❌ NO ACCESS TO EMPLOYEES TAB' 
    END as employees_tab_access
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.is_active = 1
ORDER BY r.name, u.email;

SELECT '=== NEXT STEPS ===' as step;
SELECT '1. If HR role is missing employee_view, run the INSERT statement in Step 7' as action;
SELECT '2. Logout from the application' as action;
SELECT '3. Login again with HR user credentials' as action;
SELECT '4. Check if Employees tab appears in sidebar' as action;
SELECT '5. If still not working, restart backend server to clear permission cache' as action;
