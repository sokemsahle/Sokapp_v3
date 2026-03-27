-- WiFi IP-Restricted Clock-In/Clock-Out System
-- This script creates tables for managing allowed office IPs and tracking employee attendance

-- ============================================
-- 1. ALLOWED IPS TABLE
-- ============================================
-- Stores IP addresses that are authorized for clock-in/clock-out
CREATE TABLE IF NOT EXISTS allowed_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE COMMENT 'Supports IPv4 and IPv6',
    description VARCHAR(255) COMMENT 'Description of the location (e.g., Main Office WiFi)',
    created_by INT COMMENT 'User ID who added this IP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. ATTENDANCE LOGS TABLE
-- ============================================
-- Tracks employee clock-in and clock-out times
CREATE TABLE IF NOT EXISTS attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Employee user ID',
    clock_in TIMESTAMP NULL COMMENT 'Time when employee clocked in',
    clock_out TIMESTAMP NULL COMMENT 'Time when employee clocked out',
    ip_address VARCHAR(45) COMMENT 'IP address used for clock-in/out',
    date DATE NOT NULL COMMENT 'Date of attendance (for easy daily queries)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA (Optional - Remove in production if not needed)
-- ============================================
-- Insert a sample allowed IP (replace with your actual office IP)
-- INSERT INTO allowed_ips (ip_address, description, created_by) 
-- VALUES ('192.168.1.1', 'Main Office WiFi', 1);

-- ============================================
-- NOTES
-- ============================================
-- 1. The allowed_ips table stores IPs from which employees can clock in/out
-- 2. The attendance_logs table tracks each day's attendance separately
-- 3. Each attendance log entry represents one day's clock-in/out activity
-- 4. Multiple clock-in/out entries per day are possible (e.g., lunch break)
-- 5. IP address validation should be done at application level
