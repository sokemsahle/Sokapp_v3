-- ============================================
-- MARK ALL EXISTING NOTIFICATIONS AS SEEN
-- ============================================
-- This will mark ALL existing requisitions as seen for YOUR user account
-- Run this in phpMyAdmin

USE sokapptest;

-- Step 1: Find your user_id (replace with your actual email)
SELECT id, email FROM users WHERE email = 'sahlesokem@gmail.com';
-- Note your user_id from this query (let's assume it's 1)

-- Step 2: Mark ALL existing requisitions as seen for your user
-- This inserts records for every requisition that doesn't have a seen record yet
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
SELECT 1, r.id, TRUE, NOW()
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE uns.requisition_id IS NULL;

-- Update any existing records to ensure is_seen = TRUE
UPDATE user_notification_seen 
SET is_seen = TRUE, seen_at = NOW()
WHERE user_id = 1;

-- Step 3: Verify - should show all requisitions as seen
SELECT 
    uns.requisition_id,
    r.requestor_name,
    r.status,
    uns.is_seen,
    uns.seen_at
FROM user_notification_seen uns
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 1
ORDER BY uns.seen_at DESC;

-- Step 4: Check what should appear in notifications now (should be empty or very few)
SELECT 
    r.id,
    r.requestor_name,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'SEEN'
        ELSE 'UNSEEN'
    END as status
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL 
     OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL 
     OR r.authorized_signature IS NULL)
ORDER BY r.created_at DESC;
-- Expected: Empty result set or only NEW requisitions created after this script

-- ============================================
-- ALTERNATIVE: Mark specific requisitions as seen
-- ============================================
-- If you only want to mark certain ones, use this instead:

-- Mark requisitions #1 through #100 as seen for user 1:
-- INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
-- SELECT 1, id, TRUE, NOW()
-- FROM requisitions
-- WHERE id BETWEEN 1 AND 100
-- ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();
