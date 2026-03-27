-- Fix missing requestor_email column in requisitions table
-- Run this SQL in your database (phpMyAdmin or MySQL client)

-- First, check if requestor_email column exists
-- If it doesn't exist, add it
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS requestor_email VARCHAR(255) NULL AFTER requestor_name;

-- Also ensure user_id column exists for proper tracking
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER requestor_email;

-- Ensure program_id column exists
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS program_id INT NULL AFTER user_id;

-- Add unique_id column if it doesn't exist
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS unique_id VARCHAR(100) NULL AFTER program_id;

-- Update status enum to include 'rejected' and other statuses if not already present
-- This will safely update even if some statuses already exist
ALTER TABLE requisitions 
MODIFY COLUMN status ENUM('pending', 'reviewed', 'approved', 'authorized', 'rejected') DEFAULT 'pending';

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'requisitions' 
ORDER BY ORDINAL_POSITION;
