-- ============================================
-- ADD CHILD PERMISSIONS TO EDIT ROLE
-- Run this in phpMyAdmin first
-- ============================================

USE sokapptest;

-- Step 1: Insert all 9 child management permissions
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

-- Step 2: Verify permissions were added
SELECT '✅ Child Permissions Added:' as status;
SELECT id, name, description, category 
FROM permissions 
WHERE category = 'Children'
ORDER BY id;

-- Step 3: Show all available permissions grouped by category
SELECT '📋 All Permissions by Category:' as status;
SELECT category, GROUP_CONCAT(name ORDER BY name SEPARATOR ', ') as permission_names
FROM permissions
GROUP BY category
ORDER BY category;
