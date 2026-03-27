-- Migration: Add support for multiple attendees per appointment
-- This script creates a join table for many-to-many relationship between appointments and users
-- Date: 2026-03-20

USE sokapp_db;

-- Create appointment_attendees junction table
CREATE TABLE IF NOT EXISTS appointment_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL COMMENT 'Reference to appointment',
    user_id INT NOT NULL COMMENT 'Reference to user (attendee)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    
    -- Foreign key constraints
    CONSTRAINT fk_appt_attendee_appointment 
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_appt_attendee_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate attendees
    UNIQUE KEY unique_attendee_per_appointment (appointment_id, user_id),
    
    -- Index for performance
    INDEX idx_user_id (user_id),
    INDEX idx_appointment_id (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Junction table for multiple attendees per appointment';

-- Migrate existing single attendee data to the new table
-- This preserves backward compatibility by converting attendee_user_id to the new format
INSERT INTO appointment_attendees (appointment_id, user_id)
SELECT id, attendee_user_id 
FROM appointments 
WHERE attendee_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE user_id = user_id;

-- Note: We keep the original attendee_user_id column in appointments table for backward compatibility
-- but new code should use the appointment_attendees table instead
