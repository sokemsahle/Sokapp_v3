-- Check programs table structure and test update
USE sokapptest;

-- Show table structure
SELECT '=== PROGRAMS TABLE STRUCTURE ===' as '';
DESCRIBE programs;

-- Show current data
SELECT '=== CURRENT PROGRAM DATA ===' as '';
SELECT * FROM programs;

-- Test a simple update manually
SELECT '=== TESTING MANUAL UPDATE ===' as '';
UPDATE programs SET name = 'Test Update', description = 'Test description', is_active = 1 WHERE id = 1;

-- Verify update worked
SELECT '=== AFTER UPDATE ===' as '';
SELECT * FROM programs WHERE id = 1;
