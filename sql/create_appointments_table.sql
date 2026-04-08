-- Quick Execution Script for Appointments Table
-- Run this in MySQL Workbench, phpMyAdmin, or command line

-- Use the database
USE sokapp_db;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_user_id INT NOT NULL COMMENT 'User who created the appointment',
    attendee_user_id INT NOT NULL COMMENT 'User invited to the appointment',
    title VARCHAR(255) NOT NULL COMMENT 'Appointment title',
    description TEXT COMMENT 'Appointment details',
    start_datetime DATETIME NOT NULL COMMENT 'Appointment start time (stored in UTC)',
    end_datetime DATETIME NOT NULL COMMENT 'Appointment end time (stored in UTC)',
    location VARCHAR(255) COMMENT 'Meeting location or virtual link',
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled' COMMENT 'Current status of appointment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
    
    -- Foreign key constraints
    CONSTRAINT fk_appointment_creator 
        FOREIGN KEY (creator_user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_appointment_attendee 
        FOREIGN KEY (attendee_user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_start_datetime (start_datetime),
    INDEX idx_attendee_user_id (attendee_user_id),
    INDEX idx_creator_user_id (creator_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table creation
SHOW TABLES LIKE 'appointments';

-- Show table structure
DESCRIBE appointments;

-- Optional: Insert sample data for testing
-- Uncomment the lines below if you want test data
/*
INSERT INTO appointments (creator_user_id, attendee_user_id, title, description, start_datetime, end_datetime, location, status) VALUES
(1, 2, 'Project Review Meeting', 'Discuss Q1 project milestones and deliverables', '2026-03-20 10:00:00', '2026-03-20 11:00:00', 'Conference Room A', 'scheduled'),
(1, 3, 'Budget Planning Session', 'Review departmental budget allocations', '2026-03-21 14:00:00', '2026-03-21 15:30:00', 'Virtual - Zoom', 'scheduled'),
(2, 1, 'One-on-One Check-in', 'Weekly team sync-up', '2026-03-22 09:00:00', '2026-03-22 09:30:00', 'Office', 'scheduled');

-- Verify sample data
SELECT * FROM appointments;
*/
