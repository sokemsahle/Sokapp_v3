-- Insert Test Appointments Data
-- This will add some sample appointments to test the calendar system

USE sokapp_db;

-- First, let's see what users exist
SELECT id, first_name, last_name, email FROM users LIMIT 5;

-- Insert test appointments (adjust user IDs based on your actual data)
-- Replace creator_user_id and attendee_user_id with actual user IDs from your database

INSERT INTO appointments (creator_user_id, attendee_user_id, title, description, start_datetime, end_datetime, location, status) VALUES
(1, 2, 'Team Meeting', 'Weekly team sync-up', '2026-03-19 10:00:00', '2026-03-19 11:00:00', 'Conference Room A', 'scheduled'),
(1, 3, 'Project Review', 'Q1 project milestones discussion', '2026-03-20 14:00:00', '2026-03-20 15:30:00', 'Virtual - Zoom', 'scheduled'),
(2, 1, 'One-on-One Check-in', 'Weekly team sync-up', '2026-03-21 09:00:00', '2026-03-21 09:30:00', 'Office', 'scheduled'),
(1, 4, 'Budget Planning', 'Review departmental budget allocations', '2026-03-22 13:00:00', '2026-03-22 14:00:00', 'Meeting Room B', 'scheduled'),
(3, 2, 'Client Presentation', 'Product demo for potential client', '2026-03-23 15:00:00', '2026-03-23 16:00:00', 'Client Site', 'scheduled');

-- Verify the appointments were created
SELECT 
    a.id,
    a.title,
    CONCAT(c.first_name, ' ', c.last_name) as creator,
    CONCAT(at.first_name, ' ', at.last_name) as attendee,
    a.start_datetime,
    a.end_datetime,
    a.location,
    a.status
FROM appointments a
JOIN users c ON a.creator_user_id = c.id
JOIN users at ON a.attendee_user_id = at.id
ORDER BY a.start_datetime DESC;
