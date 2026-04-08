-- Add rejection support to requisitions table
-- Run this SQL in your database (phpMyAdmin or MySQL client)

-- Add rejection_note column to store the reason for rejection
ALTER TABLE requisitions 
ADD COLUMN rejection_note TEXT NULL AFTER status;

-- Add rejected_by column to store who rejected the requisition
ALTER TABLE requisitions 
ADD COLUMN rejected_by VARCHAR(100) NULL AFTER rejection_note;

-- Add rejected_at timestamp to track when it was rejected
ALTER TABLE requisitions 
ADD COLUMN rejected_at TIMESTAMP NULL AFTER rejected_by;

-- Update the status enum to include 'rejected' if not already present
-- Note: This might fail if 'rejected' already exists, which is fine
ALTER TABLE requisitions 
MODIFY COLUMN status ENUM('pending', 'reviewed', 'approved', 'authorized', 'rejected') DEFAULT 'pending';
