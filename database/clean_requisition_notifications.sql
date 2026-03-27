-- ============================================
-- CLEAN REQUISITION NOTIFICATIONS
-- ============================================
-- Choose ONE option below based on what you want to do
-- ============================================

-- ============================================
-- OPTION 1: DELETE ALL REQUISITIONS (COMPLETE RESET)
-- ============================================
-- WARNING: This deletes ALL requisitions and their items!
-- Use this only if you want a completely fresh start
-- UNCOMMENT THE NEXT LINE TO EXECUTE:

-- DELETE FROM requisition_items;
-- DELETE FROM requisitions;

-- After deleting all, reset auto-increment
-- ALTER TABLE requisitions AUTO_INCREMENT = 1;

-- ============================================
-- OPTION 2: DELETE ONLY PENDING/UNSIGNED REQUISITIONS
-- ============================================
-- This keeps authorized/completed ones but removes pending actions
-- UNCOMMENT THE NEXT LINES TO EXECUTE:

-- DELETE FROM requisition_items 
-- WHERE requisition_id IN (
--     SELECT id FROM requisitions 
--     WHERE signature_data IS NULL 
--        OR reviewed_signature IS NULL 
--        OR approved_signature IS NULL 
--        OR authorized_signature IS NULL
-- );
-- 
-- DELETE FROM requisitions 
-- WHERE signature_data IS NULL 
--    OR reviewed_signature IS NULL 
--    OR approved_signature IS NULL 
--    OR authorized_signature IS NULL;

-- ============================================
-- OPTION 3: DELETE SPECIFIC REQUISITION BY ID
-- ============================================
-- Replace 123 with the actual requisition ID you want to remove
-- UNCOMMENT AND UPDATE THE ID:

-- DELETE FROM requisition_items WHERE requisition_id = 123;
-- DELETE FROM requisitions WHERE id = 123;

-- ============================================
-- OPTION 4: MARK ALL AS SEEN (Without Deleting)
-- ============================================
-- This keeps requisitions but marks them all as "seen" so they won't show
-- Run this to mark all existing requisitions as seen for user_id = 1

INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
SELECT 1, id, TRUE, NOW()
FROM requisitions
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();

-- For all users:
-- INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
-- SELECT u.id, r.id, TRUE, NOW()
-- FROM users u CROSS JOIN requisitions r
-- ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();

-- ============================================
-- VERIFY AFTER CLEANUP
-- ============================================
-- Run this to see what's left after your chosen cleanup:

SELECT 
    r.id,
    r.requestor_name,
    r.status,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'Seen'
        ELSE 'Unseen'
    END as notification_status
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
ORDER BY r.created_at DESC;

-- Should show either:
-- - No rows (if you deleted all requisitions)
-- - Only rows with notification_status = 'Seen' (if you marked as seen)

-- ============================================
-- RECOMMENDED APPROACH
-- ============================================
-- 
-- For testing purposes, use OPTION 4 first (mark all as seen)
-- This clears notifications without losing data
-- 
-- If you really want to delete, use OPTION 2 (delete pending only)
-- This keeps historical completed requisitions
-- 
-- Only use OPTION 1 if you want complete database reset
-- 
-- ============================================
