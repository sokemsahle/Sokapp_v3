-- ============================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================
-- This table stores user preferences for different notification categories
-- Linked to users table via user_id with auto-creation trigger

CREATE TABLE IF NOT EXISTS notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    welfare_alerts BOOLEAN DEFAULT TRUE COMMENT 'Child Welfare Alerts: medical alerts, dietary requirements, incident reports',
    task_reminders BOOLEAN DEFAULT TRUE COMMENT 'Task & Shift Reminders: daily chores, shift handovers, staff meetings',
    system_announcements BOOLEAN DEFAULT TRUE COMMENT 'General System Announcements: facility updates, policy changes, emergency drills',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGER TO AUTO-CREATE SETTINGS FOR NEW USERS
-- ============================================
-- This trigger automatically creates a notification_settings record 
-- whenever a new user is inserted into the users table

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_user_insert 
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
    VALUES (NEW.id, TRUE, TRUE, TRUE)
    ON DUPLICATE KEY UPDATE
        welfare_alerts = VALUES(welfare_alerts),
        task_reminders = VALUES(task_reminders),
        system_announcements = VALUES(system_announcements);
END$$
DELIMITER ;

-- ============================================
-- MIGRATION SCRIPT FOR EXISTING USERS
-- ============================================
-- This will create default notification settings for all existing users
-- Run this only once during initial setup

INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
SELECT id, TRUE, TRUE, TRUE 
FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_settings)
ON DUPLICATE KEY UPDATE
    welfare_alerts = VALUES(welfare_alerts),
    task_reminders = VALUES(task_reminders),
    system_announcements = VALUES(system_announcements);

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

-- View all notification settings
-- SELECT ns.*, u.email, u.full_name 
-- FROM notification_settings ns
-- JOIN users u ON ns.user_id = u.id;

-- Update specific setting for a user
-- UPDATE notification_settings 
-- SET welfare_alerts = FALSE 
-- WHERE user_id = 1;

-- Delete settings (will cascade on user delete)
-- DELETE FROM notification_settings WHERE user_id = 1;
