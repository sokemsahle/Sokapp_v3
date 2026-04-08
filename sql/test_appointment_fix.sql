-- =====================================================
-- TEST MEDICAL APPOINTMENT AUTO-CREATION
-- =====================================================
-- This script tests that appointments are created correctly
-- with all nurses as attendees and proper descriptions
-- =====================================================

USE sokapptest;

-- Step 1: Check Nurse Role exists
SELECT '=== STEP 1: CHECK NURSE ROLE ===' AS step;
SELECT id, name, description FROM roles WHERE name = 'Nurse';

-- Step 2: Check Active Nurses
SELECT '=== STEP 2: CHECK ACTIVE NURSES ===' AS step;
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.is_active,
    r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Nurse' AND u.is_active = 1
ORDER BY u.id;

-- Step 3: Show Trigger Details
SELECT '=== STEP 3: CHECK TRIGGER ===' AS step;
SHOW TRIGGERS LIKE 'child_medical_records';

-- Step 4: Count Recent Appointments and Their Attendees
SELECT '=== STEP 4: RECENT MEDICAL APPOINTMENTS ===' AS step;
SELECT 
    a.id,
    a.title,
    a.start_datetime,
    a.end_datetime,
    a.attendee_user_id as primary_attendee_id,
    primary_attendee.full_name as primary_attendee_name,
    (SELECT COUNT(*) FROM appointment_attendees aa WHERE aa.appointment_id = a.id) as additional_attendees_count,
    LEFT(a.description, 50) as description_preview,
    a.created_at
FROM appointments a
LEFT JOIN users primary_attendee ON a.attendee_user_id = primary_attendee.id
WHERE a.title LIKE '%Medical Appointment%'
ORDER BY a.created_at DESC
LIMIT 10;

-- Step 4b: Show Appointment Attendees Details
SELECT '=== STEP 4b: ATTENDEES PER APPOINTMENT ===' AS step;
SELECT 
    a.id as appointment_id,
    a.title,
    'Primary:' as type,
    primary_attendee.full_name as attendee_name,
    primary_attendee.email as email
FROM appointments a
JOIN users primary_attendee ON a.attendee_user_id = primary_attendee.id
WHERE a.title LIKE '%Medical Appointment%'
UNION ALL
SELECT 
    aa.appointment_id,
    a.title,
    'Additional:' as type,
    u.full_name as attendee_name,
    u.email as email
FROM appointment_attendees aa
JOIN appointments a ON aa.appointment_id = a.id
JOIN users u ON aa.user_id = u.id
WHERE a.title LIKE '%Medical Appointment%'
ORDER BY appointment_id, type DESC, attendee_name;

-- Step 5: Check for Duplicates in appointments table
SELECT '=== STEP 5: CHECK FOR DUPLICATES ===' AS step;
SELECT 
    title,
    start_datetime,
    attendee_user_id,
    COUNT(*) as count,
    GROUP_CONCAT(a.id ORDER BY a.id) as appointment_ids
FROM appointments a
WHERE a.title LIKE '%Medical Appointment%'
GROUP BY title, start_datetime, attendee_user_id
HAVING COUNT(*) > 1;

SELECT 'No rows returned = ✅ No duplicates found!' AS result;

-- Step 6: Summary Statistics
SELECT '=== STEP 6: SUMMARY ===' AS step;
SELECT 
    COUNT(*) as total_medical_appointments,
    COUNT(DISTINCT CONCAT(title, '|', start_datetime)) as unique_appointment_times,
    (SELECT COUNT(*) FROM appointment_attendees aa 
     JOIN appointments a ON aa.appointment_id = a.id 
     WHERE a.title LIKE '%Medical Appointment%') as total_additional_attendee_records
FROM appointments
WHERE title LIKE '%Medical Appointment%';

SELECT '✅ Test complete! Review the results above.' AS status;
