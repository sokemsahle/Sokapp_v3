-- Events/Calendar Table Migration
-- Run this SQL in your database to create the events table

USE sokapptest;  -- Change to your database name if different

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `reminder_time` datetime DEFAULT NULL,
  `category` varchar(50) DEFAULT 'general',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_category` (`category`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_events_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Create event attendees table for tracking multiple attendees
CREATE TABLE IF NOT EXISTS `event_attendees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(20) DEFAULT 'pending' COMMENT 'pending, accepted, declined',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_user` (`event_id`, `user_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_event_attendees_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_attendees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional - for testing)
INSERT INTO `events` (`title`, `description`, `start_time`, `end_time`, `location`, `category`, `created_by`) 
VALUES 
('Team Meeting', 'Weekly team sync meeting', '2026-03-23 10:00:00', '2026-03-23 11:00:00', 'Conference Room A', 'meeting', 1),
('Project Deadline', 'Q1 Project submission deadline', '2026-03-25 17:00:00', '2026-03-25 18:00:00', NULL, 'deadline', 1)
ON DUPLICATE KEY UPDATE title=title;

SELECT 'Events table created successfully!' AS status;
