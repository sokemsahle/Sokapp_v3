-- Rename file_path column to file in employee_documents table
USE sokapptest;

-- Check current structure
SELECT 'Before:' as status;
DESCRIBE employee_documents;

-- Show current data
SELECT 'Current Data:' as status;
SELECT 
    id,
    employee_id,
    name,
    type,
    CASE 
        WHEN file_path IS NULL THEN 'NULL'
        WHEN file_path LIKE 'data:%' THEN 'Base64 (Valid)'
        ELSE 'Invalid'
    END as file_status,
    LEFT(file_path, 50) as file_preview
FROM employee_documents
ORDER BY upload_date DESC;

-- Delete invalid documents (optional - uncomment if you want to clean up)
-- DELETE FROM employee_documents WHERE file_path IS NULL;

-- Rename the column
ALTER TABLE employee_documents 
CHANGE COLUMN file_path file VARCHAR(500) DEFAULT NULL;

-- Verify the change
SELECT 'After:' as status;
DESCRIBE employee_documents;

-- Show sample data with renamed column
SELECT 'Updated Data:' as status;
SELECT 
    id,
    employee_id,
    name,
    type,
    CASE 
        WHEN file IS NULL THEN 'NULL (Delete this!)'
        WHEN file LIKE 'data:%' THEN 'Base64 (Valid) ✓'
        ELSE 'Invalid'
    END as file_status,
    LEFT(file, 50) as file_preview,
    file_name,
    file_size
FROM employee_documents
ORDER BY upload_date DESC;
