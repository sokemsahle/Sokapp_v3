-- ============================================
-- CRITICAL: Check if user_notification_seen table exists
-- ============================================
-- Run this in phpMyAdmin RIGHT NOW

USE sokapptest;

-- 1. Check if table exists
SHOW TABLES LIKE 'user_notification_seen';

-- If NO rows returned = TABLE DOESN'T EXIST = THAT'S THE PROBLEM!
-- Create it immediately with this:

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

-- 2. Verify it was created
SHOW TABLES LIKE 'user_notification_seen';
-- Should return 1 row now!

-- 3. Test manual insert (replace 1 and 85 with real IDs)
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 85, TRUE, NOW());

-- 4. Verify insert worked
SELECT * FROM user_notification_seen WHERE user_id = 1 AND requisition_id = 85;
-- Should show: is_seen = TRUE, seen_at has timestamp

-- 5. Check what API should return for YOUR user
SELECT 
    r.id,
    r.requestor_name,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'SEEN - Should NOT appear'
        ELSE 'UNSEEN - Should appear'
    END as status
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL 
     OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL 
     OR r.authorized_signature IS NULL)
ORDER BY r.created_at DESC;

-- This shows what the notification bell SHOULD display
-- If requisition #85 appears here even after you marked it = PROBLEM!
