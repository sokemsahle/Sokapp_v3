-- ============================================
-- ADD NOTIFICATION SEEN TRACKING
-- ============================================
-- This adds support for tracking when users have seen notifications

-- Add is_seen column to requisitions table (for notification tracking)
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS is_notification_seen BOOLEAN DEFAULT FALSE 
COMMENT 'Tracks if user has seen this requisition in notification center';

-- Add seen_at timestamp
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS notification_seen_at TIMESTAMP NULL 
COMMENT 'Timestamp when notification was last viewed';

-- ============================================
-- CREATE USER_NOTIFICATION_SEEN TABLE
-- ============================================
-- Alternative approach: Separate table for tracking which users have seen which notifications

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

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Mark notification as seen for a user
-- INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
-- VALUES (1, 123, TRUE, NOW())
-- ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();

-- Get unseen notifications count for a user
-- SELECT COUNT(*) as unseen_count 
-- FROM requisitions r
-- LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
-- WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
-- AND r.status IN ('pending', 'approved');

-- ============================================
-- MIGRATION SCRIPT FOR EXISTING DATA
-- ============================================
-- Mark all existing requisitions as seen for all users (optional - run if you want to start fresh)

-- INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
-- SELECT u.id, r.id, TRUE, NOW()
-- FROM users u
-- CROSS JOIN requisitions r
-- ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();
