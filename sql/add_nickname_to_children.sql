-- ============================================
-- ADD NICKNAME COLUMN TO CHILDREN TABLE
-- ============================================
-- This migration adds a nickname field to store 
-- preferred names for children
-- ============================================

USE sokapptest;

-- Add nickname column after middle_name
ALTER TABLE children 
ADD COLUMN nickname VARCHAR(100) NULL AFTER middle_name;

-- Verify the column was added
SELECT 'Nickname column added successfully' as status;

-- Show the updated table structure
DESCRIBE children;
