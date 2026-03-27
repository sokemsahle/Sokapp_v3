-- ============================================
-- CLEAN NOTIFICATION SEEN DATA
-- ============================================
-- This script clears all notification seen tracking data
-- Run this to start fresh with a clean slate

-- Option 1: Clear ALL seen notifications for ALL users
-- This resets everything - use with caution!
TRUNCATE TABLE user_notification_seen;

-- Option 2: Clear for specific user only (uncomment if needed)
-- DELETE FROM user_notification_seen WHERE user_id = 1;

-- Option 3: Clear specific requisition from all users (uncomment if needed)
-- DELETE FROM user_notification_seen WHERE requisition_id = 123;

-- ============================================
-- VERIFY CLEANUP
-- ============================================
-- After running TRUNCATE, verify table is empty

SELECT COUNT(*) as total_records FROM user_notification_seen;
-- Should return: 0

-- ============================================
-- RESET AUTO INCREMENT (Optional)
-- ============================================
-- This makes IDs start from 1 again

ALTER TABLE user_notification_seen AUTO_INCREMENT = 1;

-- ============================================
-- CONFIRMATION QUERY
-- ============================================
-- This should show no records after cleanup

SELECT 
    'Records in user_notification_seen' as description,
    COUNT(*) as count
FROM user_notification_seen;

-- Expected result: count = 0

-- ============================================
-- AFTER CLEANUP - WHAT TO EXPECT
-- ============================================
-- 
-- 1. All notifications will appear as "unseen" again
-- 2. Badge counts will reset
-- 3. Fresh start for testing the system
-- 4. No historical seen data
--
-- Run this in phpMyAdmin:
-- 1. Select sokapptest database
-- 2. Go to SQL tab
-- 3. Copy and paste this entire script
-- 4. Click "Go"
-- 5. Verify with SELECT query at the end
-- ============================================
