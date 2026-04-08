-- ============================================
-- CHECK AND FIX REVIEWER EMAIL SETUP
-- ============================================
-- Run this script to diagnose and fix reviewer email issues

-- Step 1: Check if requisition_roles table exists
SELECT 'Checking if requisition_roles table exists...' AS step;
SELECT TABLE_NAME, TABLE_SCHEMA 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sokapptest' AND TABLE_NAME = 'requisition_roles';

-- Step 2: Check all requisition roles
SELECT 'All requisition roles:' AS step;
SELECT rr.id, rr.user_id, rr.role_type, rr.is_active, u.email, u.full_name, u.is_active as user_is_active
FROM requisition_roles rr
LEFT JOIN users u ON rr.user_id = u.id
ORDER BY rr.role_type, rr.user_id;

-- Step 3: Check specifically for active reviewers
SELECT 'Active reviewers with their emails:' AS step;
SELECT u.email, u.full_name, u.is_active as user_status, rr.is_active as role_status
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE AND u.is_active = TRUE;

-- Step 4: Count active reviewers
SELECT 'Count of active reviewers:' AS step;
SELECT COUNT(*) as active_reviewer_count
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE AND u.is_active = TRUE;

-- Step 5: Check all active users (to see available emails)
SELECT 'All active users in the system:' AS step;
SELECT id, email, full_name, is_active
FROM users
WHERE is_active = TRUE
ORDER BY email;

-- ============================================
-- FIX: Add reviewer role to a user
-- ============================================
-- UNCOMMENT THE LINE BELOW AND REPLACE WITH THE USER ID YOU WANT TO MAKE A REVIEWER
-- First, find your user ID from the query above, then run:

-- INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (1, 'reviewer', TRUE);
-- Example: If your user ID is 1, run:
-- INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (1, 'reviewer', TRUE);

-- ============================================
-- FIX: Update existing reviewer to be active
-- ============================================
-- If you have a reviewer but is_active is FALSE, run:
-- UPDATE requisition_roles SET is_active = TRUE WHERE role_type = 'reviewer';

-- ============================================
-- FIX: Activate a user account
-- ============================================
-- If the user has is_active = FALSE, run:
-- UPDATE users SET is_active = TRUE WHERE id = YOUR_USER_ID;

-- ============================================
-- TEST DATA: Create test reviewer if needed
-- ============================================
-- Only run this if you need a test reviewer
-- This creates a test user and assigns reviewer role

-- Uncomment to create test data:
/*
INSERT INTO users (email, full_name, password, is_active) 
VALUES ('test.reviewer@example.com', 'Test Reviewer', '$2a$10$YourHashedPasswordHere', TRUE);

-- Get the last inserted ID and assign reviewer role
SET @test_user_id = LAST_INSERT_ID();
INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (@test_user_id, 'reviewer', TRUE);
*/

-- ============================================
-- FINAL VERIFICATION
-- ============================================
-- Run this again to verify the fix worked
SELECT 'Final verification - Active reviewers:' AS step;
SELECT u.email, u.full_name
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE AND u.is_active = TRUE;
