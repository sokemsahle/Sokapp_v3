-- Fix blank status in appointments table
-- This fixes appointments that have empty string '' instead of 'scheduled'

USE sokapptest;

-- Update appointments with blank status to 'scheduled'
UPDATE appointments 
SET status = 'scheduled' 
WHERE status = '' OR status IS NULL;

SELECT '✅ Fixed blank statuses!' AS result;

-- Verify the fix
SELECT 
    id,
    title,
    status,
    start_datetime
FROM appointments
WHERE id = 41;
