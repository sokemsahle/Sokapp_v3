-- ============================================
-- FIX: CHILD PROFILE NOT VISIBLE - COMPLETE FIX
-- This will ensure ALL users can see Child Profiles
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: Make sure permissions exist
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
-- STEP 2: Give ALL roles (including Standard) the child_view permission
-- ============================================

-- First, let's give EVERY role the basic child_view permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- STEP 3: Verify which roles have child_view
-- ============================================

SELECT '✅ Roles with child_view permission:' as status;
SELECT r.name as role_name, 
       CASE WHEN COUNT(p.id) > 0 THEN 'YES ✅' ELSE 'NO ❌' END as has_child_view
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.permission_id = (
    SELECT id FROM permissions WHERE name = 'child_view'
)
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.id;

-- ============================================
-- STEP 4: Check YOUR user's permissions
-- ============================================

SELECT '🔍 Your User Permissions:' as status;
SELECT u.email, u.full_name, r.name as your_role,
       GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as your_child_permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Children'
GROUP BY u.id, r.id
HAVING your_child_permissions IS NOT NULL;

-- ============================================
-- STEP 5: Create tables if they don't exist
-- ============================================

CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male','Female','Other') NOT NULL,
    date_of_birth DATE,
    estimated_age INT,
    place_of_birth VARCHAR(150),
    nationality VARCHAR(100),
    religion VARCHAR(100),
    blood_group VARCHAR(5),
    disability_status BOOLEAN DEFAULT FALSE,
    disability_description TEXT,
    health_status TEXT,
    date_of_admission DATE NOT NULL,
    admitted_by INT,
    current_status ENUM('Active','Reunified','Adopted','Deceased','Transferred') DEFAULT 'Active',
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (current_status),
    INDEX idx_admission_date (date_of_admission),
    
    FOREIGN KEY (admitted_by)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 6: Add sample child data for testing
-- ============================================

INSERT INTO children (first_name, last_name, gender, date_of_birth, estimated_age, date_of_admission, current_status)
VALUES 
('John', 'Doe', 'Male', '2015-05-15', 10, '2024-01-15', 'Active'),
('Jane', 'Smith', 'Female', '2016-08-20', 9, '2024-02-01', 'Active')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- ============================================
-- FINAL VERIFICATION
-- ============================================

SELECT '📊 Final Verification:' as status;

-- Show all permissions by role
SELECT 'Role Permissions Summary:' as info;
SELECT r.name as role, COUNT(rp.permission_id) as total_permissions,
       SUM(CASE WHEN p.category = 'Children' THEN 1 ELSE 0 END) as child_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.id;

-- Show tables
SELECT 'Tables Created:' as info;
SHOW TABLES LIKE 'child%';

-- Show sample children
SELECT 'Sample Children in Database:' as info;
SELECT id, CONCAT(first_name, ' ', last_name) as name, gender, current_status 
FROM children;
