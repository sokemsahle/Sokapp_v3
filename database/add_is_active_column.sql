-- Add missing is_active column to programs table
USE sokapptest;

-- Check current structure first
SELECT '=== CURRENT PROGRAMS TABLE STRUCTURE ===' as '';
SHOW COLUMNS FROM programs;

-- Add is_active column if it doesn't exist
ALTER TABLE programs 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER description;

-- Verify the column was added
SELECT '=== UPDATED PROGRAMS TABLE STRUCTURE ===' as '';
SHOW COLUMNS FROM programs;

-- Update existing records to be active
UPDATE programs SET is_active = TRUE WHERE is_active IS NULL;

-- Show final data
SELECT '=== FINAL PROGRAM DATA ===' as '';
SELECT * FROM programs ORDER BY id;
