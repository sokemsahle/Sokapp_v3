-- ============================================
-- POPULATE USER ACTIVITY TABLES WITH SAMPLE DATA
-- ============================================
-- This script adds realistic sample data to test the User Activity Report
-- Run this after installing the user activity system

USE sokapptest;

-- First, let's make sure we have users in the database
-- If you already have users, this will use existing user data

-- Insert sample activities into user_activity_log
INSERT INTO user_activity_log (
    `id`, 
    `user_id`, 
    `user_email`, 
    `user_name`, 
    `role_id`, 
    `role_name`, 
    `activity_type`, 
    `module`, 
    `action_description`, 
    `table_name`, 
    `record_id`, 
    `old_values`, 
    `new_values`, 
    `session_id`, 
    `ip_address`, 
    `user_agent`, 
    `device_type`, 
    `status`, 
    `failure_reason`, 
    `activity_timestamp`, 
    `session_duration`
) VALUES
-- Login activities
(1, 1, 'admin@sokapp.com', 'Admin User', 1, 'Administrator', 'login', 'Authentication', 'User login successful', NULL, NULL, NULL, NULL, UUID(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 5 MINUTE), NULL),

(2, 2, 'hr.manager@sokapp.com', 'HR Manager', 2, 'HR Manager', 'login', 'Authentication', 'User login successful', NULL, NULL, NULL, NULL, UUID(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE), NULL),

(3, 3, 'social.worker@sokapp.com', 'Social Worker', 3, 'Social Worker', 'login', 'Authentication', 'User login successful', NULL, NULL, NULL, NULL, UUID(), '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'Mobile', 'success', NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL),

-- Failed login attempts
(4, NULL, 'unknown@hacker.com', 'Unknown', NULL, NULL, 'login_failed', 'Authentication', 'Failed login attempt - invalid credentials', NULL, NULL, NULL, NULL, UUID(), '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'failed', 'Invalid password', DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL),

(5, NULL, 'unknown@hacker.com', 'Unknown', NULL, NULL, 'login_failed', 'Authentication', 'Failed login attempt - invalid credentials', NULL, NULL, NULL, NULL, UUID(), '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'failed', 'Invalid password', DATE_SUB(NOW(), INTERVAL 59 MINUTE), NULL),

(6, NULL, 'unknown@hacker.com', 'Unknown', NULL, NULL, 'login_failed', 'Authentication', 'Failed login attempt - invalid credentials', NULL, NULL, NULL, NULL, UUID(), '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'failed', 'Invalid password', DATE_SUB(NOW(), INTERVAL 58 MINUTE), NULL),

(7, NULL, 'test@test.com', 'Unknown', NULL, NULL, 'login_failed', 'Authentication', 'Failed login attempt - user not found', NULL, NULL, NULL, NULL, UUID(), '192.168.1.201', 'Mozilla/5.0 (Linux; Android 10)', 'Mobile', 'failed', 'User not found', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL),

-- Create activities
(8, 1, 'admin@sokapp.com', 'Admin User', 1, 'Administrator', 'create', 'Users', 'Created new user account', 'users', 10, NULL, '{"email": "newuser@sokapp.com", "full_name": "New User"}', UUID(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL),

(9, 2, 'hr.manager@sokapp.com', 'HR Manager', 2, 'HR Manager', 'create', 'Employees', 'Created new employee record', 'employees', 25, NULL, '{"full_name": "John Doe", "position": "Social Worker"}', UUID(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL),

(10, 1, 'admin@sokapp.com', 'Admin User', 1, 'Administrator', 'create', 'Inventory', 'Added new inventory item', 'inventory', 50, NULL, '{"item_name": "Office Supplies", "quantity": 100}', UUID(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL),

-- Update activities
(11, 3, 'social.worker@sokapp.com', 'Social Worker', 3, 'Social Worker', 'update', 'Children', 'Updated child information', 'children', 15, '{"status": "active"}', '{"status": "inactive"}', UUID(), '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'Mobile', 'success', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL),

(12, 2, 'hr.manager@sokapp.com', 'HR Manager', 2, 'HR Manager', 'update', 'Employees', 'Updated employee department', 'employees', 10, '{"department": "HR"}', '{"department": "Administration"}', UUID(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR), NULL),

(13, 1, 'admin@sokapp.com', 'Admin User', 1, 'Administrator', 'update', 'Inventory', 'Updated inventory quantity', 'inventory', 30, '{"quantity": 50}', '{"quantity": 75}', UUID(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL),

-- Delete activities
(14, 1, 'admin@sokapp.com', 'Admin User', 1, 'Administrator', 'delete', 'Users', 'Deleted user account', 'users', 8, '{"email": "deleteduser@sokapp.com"}', NULL, UUID(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 7 HOUR), NULL),

(15, 2, 'hr.manager@sokapp.com', 'HR Manager', 2, 'HR Manager', 'delete', 'Employees', 'Terminated employee', 'employees', 20, '{"full_name": "Former Employee"}', NULL, UUID(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),

-- View activities
(16, 3, 'social.worker@sokapp.com', 'Social Worker', 3, 'Social Worker', 'view', 'Children', 'Viewed child profile', 'children', 12, NULL, NULL, UUID(), '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'Mobile', 'success', NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR), NULL),

(17, 2, 'hr.manager@sokapp.com', 'HR Manager', 2, 'HR Manager', 'view', 'Employees', 'Viewed employee records', 'employees', NULL, NULL, NULL, UUID(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 9 HOUR), NULL),

-- Logout activities
(18, 1, 'admin@sokapp.com', 'Admin User', 1, 'Administrator', 'logout', 'Authentication', 'User logout', NULL, NULL, NULL, NULL, UUID(), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 10 HOUR), 36000),

(19, 2, 'hr.manager@sokapp.com', 'HR Manager', 2, 'HR Manager', 'logout', 'Authentication', 'User logout', NULL, NULL, NULL, NULL, UUID(), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Desktop', 'success', NULL, DATE_SUB(NOW(), INTERVAL 11 HOUR), 28800),

(20, 3, 'social.worker@sokapp.com', 'Social Worker', 3, 'Social Worker', 'logout', 'Authentication', 'User logout', NULL, NULL, NULL, NULL, UUID(), '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'Mobile', 'success', NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR), 14400);

-- Add more historical data for better reporting
INSERT INTO user_activity_log (
    `id`, 
    `user_id`, 
    `user_email`, 
    `user_name`, 
    `role_id`, 
    `role_name`, 
    `activity_type`, 
    `module`, 
    `action_description`, 
    `table_name`, 
    `record_id`, 
    `old_values`, 
    `new_values`, 
    `session_id`, 
    `ip_address`, 
    `user_agent`, 
    `device_type`, 
    `status`, 
    `failure_reason`, 
    `activity_timestamp`, 
    `session_duration`
)
SELECT 
    id + 20,
    user_id,
    user_email,
    user_name,
    role_id,
    role_name,
    activity_type,
    module,
    action_description,
    table_name,
    record_id,
    old_values,
    new_values,
    UUID(),
    ip_address,
    user_agent,
    device_type,
    status,
    failure_reason,
    DATE_SUB(activity_timestamp, INTERVAL FLOOR(RAND() * 7) DAY),
    session_duration
FROM user_activity_log
WHERE id <= 20;

-- Insert sample data into user_activity_summary (aggregated data)
INSERT INTO user_activity_summary (
    `id`, 
    `user_id`, 
    `activity_date`, 
    `total_activities`, 
    `login_count`, 
    `logout_count`, 
    `create_count`, 
    `update_count`, 
    `delete_count`, 
    `view_count`, 
    `failed_login_count`, 
    `modules_accessed`, 
    `first_activity`, 
    `last_activity`, 
    `total_session_time`, 
    `successful_actions`, 
    `failed_actions`
) VALUES
(1, 1, CURDATE(), 8, 1, 1, 2, 2, 1, 1, 0, 'Users,Inventory,Authentication', DATE_SUB(NOW(), INTERVAL 10 HOUR), DATE_SUB(NOW(), INTERVAL 5 MINUTE), 36000, 8, 0),
(2, 2, CURDATE(), 6, 1, 1, 1, 2, 1, 1, 0, 'Employees,Authentication', DATE_SUB(NOW(), INTERVAL 11 HOUR), DATE_SUB(NOW(), INTERVAL 15 MINUTE), 28800, 6, 0),
(3, 3, CURDATE(), 4, 1, 1, 0, 1, 0, 1, 0, 'Children,Authentication', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 30 MINUTE), 14400, 4, 0);

-- Verify data insertion
SELECT 'Sample data inserted successfully!' AS Status;
SELECT COUNT(*) AS 'Total Activities in Log' FROM user_activity_log;
SELECT COUNT(*) AS 'Summary Records' FROM user_activity_summary;

-- Show today's activity
SELECT 
    user_name,
    role_name,
    activity_type,
    module,
    status,
    activity_timestamp
FROM user_activity_log
WHERE DATE(activity_timestamp) = CURDATE()
ORDER BY activity_timestamp DESC;
