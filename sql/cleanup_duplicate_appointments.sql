-- =====================================================
-- CLEANUP DUPLICATE MEDICAL APPOINTMENTS
-- =====================================================
-- This script removes duplicate medical appointments
-- keeping only ONE appointment per nurse per appointment time
-- =====================================================

USE sokapptest;

-- Step 1: Show duplicates before cleanup
SELECT '=== DUPLICATES BEFORE CLEANUP ===' AS step;
SELECT 
    title,
    start_datetime,
    attendee_user_id,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as appointment_ids
FROM appointments
WHERE title LIKE '%Medical Appointment%'
GROUP BY title, start_datetime, attendee_user_id
HAVING COUNT(*) > 1;

-- Step 2: Create temporary table to track which appointments to keep
DROP TEMPORARY TABLE IF EXISTS temp_appointments_to_keep;
CREATE TEMPORARY TABLE temp_appointments_to_keep AS
SELECT 
    MIN(id) as keep_id,
    title,
    start_datetime,
    attendee_user_id
FROM appointments
WHERE title LIKE '%Medical Appointment%'
GROUP BY title, start_datetime, attendee_user_id;

-- Step 3: Delete duplicates (keep the oldest one for each group)
DELETE a FROM appointments a
INNER JOIN temp_appointments_to_keep t 
    ON a.title = t.title 
    AND a.start_datetime = t.start_datetime 
    AND a.attendee_user_id = t.attendee_user_id
WHERE a.id != t.keep_id;

-- Step 4: Show results after cleanup
SELECT '=== CLEANUP COMPLETE ===' AS status;
SELECT 'Checking for remaining duplicates...' AS step;

SELECT 
    title,
    start_datetime,
    attendee_user_id,
    COUNT(*) as count
FROM appointments
WHERE title LIKE '%Medical Appointment%'
GROUP BY title, start_datetime, attendee_user_id
HAVING COUNT(*) > 1;

-- If this returns 0 rows, all duplicates are removed!
SELECT 'Summary:' AS info;
SELECT 
    COUNT(*) as total_medical_appointments,
    COUNT(DISTINCT attendee_user_id) as unique_nurses,
    COUNT(DISTINCT start_datetime) as unique_times
FROM appointments
WHERE title LIKE '%Medical Appointment%';

-- Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS temp_appointments_to_keep;
