-- Add program_id column to employees table if it doesn't exist
-- This allows filtering employees by program/organization

USE sokapptest;

-- Check if column exists before adding
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'sokapptest' 
    AND TABLE_NAME = 'employees' 
    AND COLUMN_NAME = 'program_id'
);

-- Add the column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE employees ADD COLUMN program_id INT DEFAULT NULL AFTER visibility',
    'SELECT "Column program_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for better query performance
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'sokapptest' 
    AND TABLE_NAME = 'employees' 
    AND INDEX_NAME = 'idx_employees_program_id'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE employees ADD INDEX idx_employees_program_id (program_id)',
    'SELECT "Index already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the changes
SELECT 'Employees table structure:' AS info;
DESCRIBE employees;

SELECT 'Employees with program_id:' AS info, COUNT(*) AS count FROM employees WHERE program_id IS NOT NULL;
SELECT 'Employees without program_id:' AS info, COUNT(*) AS count FROM employees WHERE program_id IS NULL;
