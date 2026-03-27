-- Fix 1: Check and populate programs table
-- This fixes the foreign key constraint error
USE sokapptest;

-- Check current programs
SELECT '=== CURRENT PROGRAMS ===' as '';
SELECT * FROM programs;

-- Insert default programs if table is empty
INSERT INTO programs (name, description) 
SELECT 'Early Childhood Development', 'Ages 0-6 years' WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Early Childhood Development');

INSERT INTO programs (name, description) 
SELECT 'Primary Education', 'Ages 7-13 years' WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Primary Education');

INSERT INTO programs (name, description) 
SELECT 'Secondary Education', 'Ages 14-18 years' WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Secondary Education');

INSERT INTO programs (name, description) 
SELECT 'Vocational Training', 'Skills development program' WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Vocational Training');

INSERT INTO programs (name, description) 
SELECT 'General Program', 'Default program' WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'General Program');

-- Verify
SELECT '=== UPDATED PROGRAMS ===' as '';
SELECT * FROM programs ORDER BY id;
