-- ============================================
-- CLEANUP: Remove Sample/Test Activity Logs
-- ============================================
-- This script removes test data and sample activity logs
-- Run this before going to production or to clean up test data

USE sokapptest;

-- Option 1: Delete ALL activity logs (complete cleanup)
-- Uncomment the line below to delete everything
-- DELETE FROM user_activity_log;

-- Option 2: Delete only test data (recommended)
-- This removes entries with test emails and test users
DELETE FROM user_activity_log 
WHERE user_email IN (
    'test@example.com',
    'user2@example.com',
    'admin@sokapp.com',
    'unknown@example.com'
);

-- Option 3: Delete activities created today (for recent testing cleanup)
-- DELETE FROM user_activity_log 
-- WHERE DATE(activity_timestamp) = CURDATE();

-- Option 4: Delete specific activity types (e.g., only test logins)
-- DELETE FROM user_activity_log 
-- WHERE activity_type IN ('login', 'login_failed') 
-- AND user_name IN ('Test User', 'Another User', 'Admin User', 'Unknown');

-- Verify deletion - show remaining activities
SELECT 
    'Remaining Activities' as Description,
    COUNT(*) as Count
FROM user_activity_log;

-- Show what was deleted (before deletion, uncomment to preview)
-- SELECT * FROM user_activity_log 
-- WHERE user_email IN (
--     'test@example.com',
--     'user2@example.com',
--     'admin@sokapp.com',
--     'unknown@example.com'
-- );

-- Reset auto-increment if needed (optional, after complete cleanup)
-- ALTER TABLE user_activity_log AUTO_INCREMENT = 1;
