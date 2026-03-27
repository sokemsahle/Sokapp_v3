-- Fix programs table - Complete solution
USE sokapptest;

-- Step 1: Check current structure
SELECT '=== CURRENT PROGRAMS TABLE STRUCTURE ===' as '';
SHOW COLUMNS FROM programs;

-- Step 2: Check current data
SELECT '=== CURRENT DATA ===' as '';
SELECT * FROM programs;

-- Step 3: Add name column if it doesn't exist
-- First try to add it (this will fail if it already exists)
ALTER TABLE programs ADD COLUMN name VARCHAR(100) DEFAULT 'Temporary Program' AFTER id;

-- Step 4: Update existing rows with unique names
UPDATE programs SET name = CONCAT('Program_', id) WHERE name LIKE 'Temporary%';

-- Step 5: Make name NOT NULL and UNIQUE
ALTER TABLE programs MODIFY name VARCHAR(100) NOT NULL;
ALTER TABLE programs ADD UNIQUE KEY uk_programs_name (name);

-- Step 6: Final verification
SELECT '=== FIXED PROGRAMS TABLE ===' as '';
SHOW COLUMNS FROM programs;

SELECT '=== FINAL DATA ===' as '';
SELECT * FROM programs ORDER BY id;
