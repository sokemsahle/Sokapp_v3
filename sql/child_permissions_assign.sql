-- ============================================
-- PERMISSION ASSIGNMENT HELPER SCRIPTS
-- ============================================
-- Use these scripts to assign child management 
-- permissions to different roles
-- ============================================

USE sokapptest;

-- ============================================
-- VIEW CURRENT PERMISSIONS
-- ============================================

-- See all child-related permissions
SELECT 'CHILD PERMISSIONS AVAILABLE' as info;
SELECT * FROM permissions WHERE category = 'Children';

-- See which roles have child permissions
SELECT 'CURRENT ROLE ASSIGNMENTS' as info;
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'Children'
ORDER BY r.name, p.name;

-- ============================================
-- ASSIGN PERMISSIONS TO SPECIFIC ROLES
-- ============================================

-- Give HR role FULL access to child management
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'HR' 
AND p.category = 'Children';

-- Give Finance role VIEW ONLY access
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Finance' 
AND p.name = 'child_view';

-- Give Teacher role VIEW and education manage
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Teacher' 
AND p.name IN ('child_view', 'education_manage');

-- Give Director FULL access
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Director' 
AND p.category = 'Children';

-- ============================================
-- REMOVE PERMISSIONS
-- ============================================

-- Remove all child permissions from a role
-- Example: Remove from Standard role
DELETE rp FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'Standard' 
AND p.category = 'Children';

-- ============================================
-- VERIFY ASSIGNMENTS
-- ============================================

-- Check what permissions a specific role has
SET @role_name = 'HR';

SELECT CONCAT('Permissions for ', @role_name) as info;
SELECT p.name as permission_name, p.description
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = @role_name
ORDER BY p.category, p.name;

-- ============================================
-- BULK OPERATIONS
-- ============================================

-- Assign ALL child permissions to ALL existing roles except Standard
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name != 'Standard'
AND p.category = 'Children';

-- ============================================
-- AUDIT QUERIES
-- ============================================

-- Count permissions per role
SELECT 'PERMISSION COUNT BY ROLE' as info;
SELECT r.name as role_name, COUNT(p.id) as child_permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Children'
GROUP BY r.id, r.name
ORDER BY child_permission_count DESC;

-- Find users with child management access
SELECT 'USERS WITH CHILD ACCESS' as info;
SELECT u.full_name, u.email, r.name as role_name,
       COUNT(DISTINCT p.id) as permissions_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Children'
WHERE u.is_active = TRUE
GROUP BY u.id, r.id
ORDER BY permissions_count DESC;

-- ============================================
-- SECURITY CHECKS
-- ============================================

-- Ensure admin has all permissions
SELECT 'ADMIN ROLE CHECK' as info;
SELECT p.name as missing_permission
FROM permissions p
WHERE p.category = 'Children'
AND p.id NOT IN (
    SELECT rp.permission_id 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.name = 'admin'
);

-- If any missing permissions shown above, run:
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.category = 'Children';

-- ============================================
-- CLEANUP (USE WITH CAUTION)
-- ============================================

-- Remove ALL child permissions from ALL roles
-- WARNING: This will remove all access!
-- DELETE rp FROM role_permissions rp
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.category = 'Children';

-- ============================================
-- FINAL VERIFICATION
-- ============================================

SHOW TABLES LIKE 'child%';

SELECT 'TOTAL CHILDREN REGISTERED' as info, COUNT(*) as count FROM children;
SELECT 'TOTAL GUARDIANS' as info, COUNT(*) as count FROM child_guardian_information;
SELECT 'TOTAL LEGAL DOCUMENTS' as info, COUNT(*) as count FROM child_legal_documents;
SELECT 'TOTAL MEDICAL RECORDS' as info, COUNT(*) as count FROM child_medical_records;
SELECT 'TOTAL EDUCATION RECORDS' as info, COUNT(*) as count FROM child_education_records;
SELECT 'TOTAL CASE HISTORIES' as info, COUNT(*) as count FROM child_case_history;
