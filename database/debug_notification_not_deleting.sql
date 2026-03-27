-- ============================================
-- DEBUG NOTIFICATION SEEN TRACKING
-- ============================================
-- Run these queries to diagnose why notifications aren't disappearing

-- 1. Check if user_notification_seen table exists
SHOW TABLES LIKE 'user_notification_seen';

-- 2. Check table structure
DESCRIBE user_notification_seen;

-- 3. See all seen tracking records
SELECT * FROM user_notification_seen ORDER BY created_at DESC LIMIT 10;

-- 4. Check if a specific requisition (e.g., #123) was marked as seen
-- Replace 1 with your user_id and 123 with requisition ID
SELECT 
    uns.id,
    uns.user_id,
    u.email as user_email,
    uns.requisition_id,
    r.requestor_name,
    uns.is_seen,
    uns.seen_at,
    uns.created_at
FROM user_notification_seen uns
JOIN users u ON uns.user_id = u.id
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 1  -- Your user ID
ORDER BY uns.created_at DESC;

-- 5. Test: Manually mark a requisition as seen
-- Replace 1 with your user_id and 123 with requisition ID
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 123, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();

-- 6. Verify it worked
SELECT * FROM user_notification_seen WHERE user_id = 1 AND requisition_id = 123;

-- 7. Check what API should return (unseen only for user_id = 1)
SELECT 
    r.id,
    r.requestor_name,
    r.status,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'SEEN - Should not appear'
        WHEN uns.is_seen = FALSE THEN 'UNSEEN - Should appear'
        ELSE 'UNSEEN (no record) - Should appear'
    END as notification_status
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL 
     OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL 
     OR r.authorized_signature IS NULL)
ORDER BY r.created_at DESC;

-- ============================================
-- TROUBLESHOOTING STEPS
-- ============================================
-- 
-- If table doesn't exist:
-- Run: database/add_notification_seen_tracking.sql
-- 
-- If table exists but no records when clicking:
-- Check browser console for API errors
-- Check backend logs for POST /api/notifications/:id/seen
-- 
-- If records exist but still showing:
-- The LEFT JOIN query in step 7 might be wrong
-- Or frontend is not passing unseen=true parameter
-- 
-- ============================================
