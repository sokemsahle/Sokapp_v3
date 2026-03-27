-- ============================================
-- DIAGNOSE: Why Notifications Aren't Disappearing
-- ============================================
-- Run these queries in phpMyAdmin to check what's happening

-- 1. Does the user_notification_seen table exist?
SHOW TABLES LIKE 'user_notification_seen';
-- Expected: Should return 1 row with table name
-- If NO rows = Table doesn't exist = THAT'S THE PROBLEM!

-- 2. If table exists, check its structure
DESCRIBE user_notification_seen;
-- Expected: Should show columns: id, user_id, requisition_id, is_seen, seen_at, etc.

-- 3. Check if ANY records exist (even old ones)
SELECT COUNT(*) as total_records FROM user_notification_seen;
-- Expected: Some number >= 0

-- 4. Check what should be marked as seen for YOUR user (replace 1 with your user_id)
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
WHERE uns.user_id = 1  -- CHANGE THIS to your actual user_id
ORDER BY uns.created_at DESC;
-- Expected: Should show all requisitions you've clicked
-- If empty = Database isn't recording your clicks!

-- 5. Check what API should return (unseen only for user_id=1)
SELECT 
    r.id,
    r.requestor_name,
    r.status,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'SEEN - Should NOT appear in notifications'
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
-- Expected: Should show ONLY requisitions you HAVEN'T clicked yet
-- If it shows ALL requisitions including ones you clicked = PROBLEM!

-- 6. Test: Manually mark a requisition as seen (use real IDs!)
-- First get your user_id from users table:
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Then get a requisition ID:
SELECT id, requestor_name FROM requisitions ORDER BY created_at DESC LIMIT 3;

-- Now insert (replace 1 and 90 with real IDs):
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 90, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();

-- Verify it worked:
SELECT * FROM user_notification_seen WHERE user_id = 1 AND requisition_id = 90;

-- ============================================
-- MOST LIKELY ISSUE: Table doesn't exist!
-- ============================================
-- If Step 1 returned no rows, create the table NOW:

CREATE TABLE IF NOT EXISTS user_notification_seen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    requisition_id INT NOT NULL,
    is_seen BOOLEAN DEFAULT FALSE,
    seen_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_requisition (user_id, requisition_id),
    INDEX idx_user_seen (user_id, is_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Then try clicking a notification again!
