-- Fix: Increase file column size to store full Base64 data
USE sokapptest;

-- Check current column definition
SELECT 'Current column definition:' as info;
DESCRIBE employee_documents;

-- Change VARCHAR(500) to LONGTEXT to store large Base64 strings
ALTER TABLE employee_documents 
MODIFY COLUMN file LONGTEXT DEFAULT NULL;

-- Verify the change
SELECT 'After modification:' as info;
DESCRIBE employee_documents;

-- Show existing documents (will still be truncated)
SELECT 
    id,
    name,
    type,
    LENGTH(file) as file_length_chars,
    file_size,
    CASE 
        WHEN LENGTH(file) < 1000 THEN '⚠️ TRUNCATED - Needs re-upload'
        ELSE '✓ OK'
    END as status
FROM employee_documents
WHERE file IS NOT NULL AND file != ''
ORDER BY upload_date DESC;
