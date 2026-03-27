-- Direct execution script for appointment_attendees table
-- Run this in MySQL Workbench or command line

USE sokapptest;

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
INSERT INTO appointment_attendees (appointment_id, user_id)
SELECT id, attendee_user_id 
FROM appointments 
WHERE attendee_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE user_id = user_id;

-- Verify it was created
SHOW TABLES LIKE 'appointment_attendees';

-- Show structure
DESCRIBE appointment_attendees;

-- Show sample data
SELECT 
    aa.appointment_id,
    aa.user_id,
    u.full_name as attendee_name,
    a.title as appointment_title
FROM appointment_attendees aa
JOIN users u ON aa.user_id = u.id
JOIN appointments a ON aa.appointment_id = a.id
ORDER BY aa.appointment_id DESC
LIMIT 10;
