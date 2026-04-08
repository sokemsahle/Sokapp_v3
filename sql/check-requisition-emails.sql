-- Diagnostic query to check requisition email storage
-- Run this to see if requestor_email is being saved correctly

SELECT 
    id,
    requestor_name,
    requestor_email,
    user_id,
    department,
    purpose,
    status,
    created_at
FROM requisitions
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any NULL or empty requestor_email values
SELECT 
    COUNT(*) as total_requisitions,
    SUM(CASE WHEN requestor_email IS NULL OR requestor_email = '' THEN 1 ELSE 0 END) as missing_emails,
    SUM(CASE WHEN requestor_email IS NOT NULL AND requestor_email != '' THEN 1 ELSE 0 END) as with_emails
FROM requisitions;

-- Show sample of different email values
SELECT DISTINCT requestor_email 
FROM requisitions 
WHERE requestor_email IS NOT NULL AND requestor_email != ''
LIMIT 10;
