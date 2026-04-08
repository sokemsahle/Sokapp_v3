-- ============================================
-- FIX: NOTIFICATION COUNT SHOWING ZERO
-- ============================================
-- This script diagnoses and fixes the "notification count = 0" issue
-- Run this in phpMyAdmin or MySQL client

-- ============================================
-- STEP 1: DIAGNOSIS - Check Your Current Setup
-- ============================================

-- 1a. Find your user ID and email
SELECT 'YOUR USER ACCOUNT:' AS info;
SELECT id, email, full_name, is_active 
FROM users 
WHERE is_active = TRUE 
ORDER BY id DESC 
LIMIT 5;

-- 1b. Check what requisition roles you have
SELECT 'YOUR REQUISITION ROLES (if any):' AS info;
SELECT rr.id, rr.user_id, rr.role_type, rr.is_active, u.email, u.full_name
FROM requisition_roles rr
LEFT JOIN users u ON rr.user_id = u.id
ORDER BY rr.user_id, rr.role_type;

-- 1c. Count how many active reviewers/approvers/authorizers exist
SELECT 'COUNT OF ACTIVE ROLES:' AS info;
SELECT role_type, COUNT(*) as count
FROM requisition_roles
WHERE is_active = TRUE
GROUP BY role_type;

-- 1d. Check if there are requisitions waiting for review
SELECT 'REQUISITIONS WAITING FOR REVIEW:' AS info;
SELECT 
    CASE 
        WHEN signature_data IS NOT NULL AND reviewed_signature IS NULL THEN 'Needs Review'
        WHEN reviewed_signature IS NOT NULL AND approved_signature IS NULL THEN 'Needs Approval'
        WHEN approved_signature IS NOT NULL AND authorized_signature IS NULL THEN 'Needs Authorization'
        ELSE 'Other Status'
    END as status_category,
    COUNT(*) as count
FROM requisitions
GROUP BY status_category;

-- ============================================
-- STEP 2: FIX - Choose Your Solution
-- ============================================

-- OPTION A: Make yourself a reviewer (most common)
-- Replace YOUR_USER_ID with your actual user ID from step 1a
-- Example: If your user ID is 5, change YOUR_USER_ID to 5
/*
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (YOUR_USER_ID, 'reviewer', TRUE);
*/

-- OPTION B: Make yourself an approver
/*
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (YOUR_USER_ID, 'approver', TRUE);
*/

-- OPTION C: Make yourself an authorizer
/*
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (YOUR_USER_ID, 'authorizer', TRUE);
*/

-- OPTION D: Give yourself all roles (for testing/admin purposes)
/*
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES 
    (YOUR_USER_ID, 'reviewer', TRUE),
    (YOUR_USER_ID, 'approver', TRUE),
    (YOUR_USER_ID, 'authorizer', TRUE);
*/

-- ============================================
-- STEP 3: ALTERNATIVE FIX - If You Want to See ALL Requisitions
-- ============================================
-- If you want notifications to work WITHOUT requiring roles,
-- you need to modify the backend code (server.js line 1039-1042)
-- 
-- CHANGE THIS (line 1039-1042):
--   if (userRoles.length === 0) {
--       console.log('User has no requisition roles - returning empty array');
--       return res.status(200).json({ success: true, requisitions: [] });
--   }
--
-- TO THIS:
--   if (userRoles.length === 0) {
--       // For users without specific roles, show requisitions that need their attention
--       // Or comment out this block entirely to use the default query
--   }

-- ============================================
-- STEP 4: VERIFICATION - Test the Fix
-- ============================================

-- After running the INSERT statement above, verify it worked:
SELECT 'VERIFICATION - Your new roles:' AS info;
SELECT rr.role_type, rr.is_active, u.email, u.full_name
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE u.email = (SELECT email FROM users WHERE is_active = TRUE ORDER BY id DESC LIMIT 1)
AND rr.is_active = TRUE;

-- ============================================
-- QUICK FIX EXAMPLE
-- ============================================
-- If your user ID is 1, run this:
-- INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (1, 'reviewer', TRUE);
-- INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (1, 'approver', TRUE);
-- INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (1, 'authorizer', TRUE);
