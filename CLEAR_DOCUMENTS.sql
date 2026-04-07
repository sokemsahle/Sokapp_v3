-- Clear all employee documents
USE sokapptest;

-- Option 1: Delete ALL documents (start fresh)
-- TRUNCATE TABLE employee_documents;

-- Option 2: Delete only INVALID documents (keep working ones)
-- Remove blob URLs
DELETE FROM employee_documents WHERE file_path LIKE 'blob:%';

-- Remove old file system paths
DELETE FROM employee_documents WHERE file_path LIKE '/uploads/%';

-- Remove documents with NULL file_path (no actual file)
DELETE FROM employee_documents WHERE file_path IS NULL;

-- Verify what's left
SELECT COUNT(*) as remaining_documents FROM employee_documents;

-- Show all remaining documents
SELECT 
    id,
    employee_id,
    name,
    type,
    file_name,
    file_size,
    mime_type,
    LEFT(file_path, 50) as file_path_preview,
    is_active,
    upload_date
FROM employee_documents
ORDER BY upload_date DESC;

-- Check the table structure
DESCRIBE employee_documents;
