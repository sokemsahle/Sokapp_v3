-- =====================================================
-- CHECK APPOINTMENT ATTENDEES ISSUE
-- =====================================================
-- This will show you what's happening with appointments
-- =====================================================

USE sokapptest;

SELECT '=== STEP 1: CHECK NURSE ROLE ===' AS step;
SELECT id, name, description FROM roles WHERE name = 'Nurse';

SELECT '' AS separator;

SELECT '=== STEP 2: CHECK ALL USERS AND THEIR ROLES ===' AS step;
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.is_active,
    r.id as role_id,
    r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.id;

SELECT '' AS separator;

SELECT '=== STEP 3: CHECK ACTIVE NURSES SPECIFICALLY ===' AS step;
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.is_active,
    r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Nurse' AND u.is_active = 1;

SELECT '' AS separator;

SELECT '=== STEP 4: CHECK RECENT APPOINTMENTS ===' AS step;
SELECT 
    a.id,
    a.title,
    a.start_datetime,
    a.end_datetime,
    a.reminder_minutes_before,
    a.status,
    a.creator_user_id,
    a.attendee_user_id,
    creator.full_name as creator_name,
    attendee.full_name as attendee_name,
    attendee.email as attendee_email,
    attendee.role_id as attendee_role_id
FROM appointments a
LEFT JOIN users creator ON a.creator_user_id = creator.id
LEFT JOIN users attendee ON a.attendee_user_id = attendee.id
WHERE a.title LIKE '%Medical Appointment%'
ORDER BY a.created_at DESC
LIMIT 10;

SELECT '' AS separator;

SELECT '=== STEP 5: ANALYZE THE PROBLEM ===' AS step;

-- Check if appointments have NULL attendee
SELECT 
    COUNT(*) as total_medical_appointments,
    SUM(CASE WHEN attendee_user_id IS NULL THEN 1 ELSE 0 END) as appointments_with_null_attendee,
    SUM(CASE WHEN attendee_user_id IS NOT NULL THEN 1 ELSE 0 END) as appointments_with_attendee
FROM appointments
WHERE title LIKE '%Medical Appointment%';

SELECT '' AS separator;

-- Check if any attendee is a nurse
SELECT 
    COUNT(*) as total_appointments,
    SUM(CASE WHEN r.name = 'Nurse' THEN 1 ELSE 0 END) as appointments_with_nurse_attendee,
    SUM(CASE WHEN r.name != 'Nurse' OR r.name IS NULL THEN 1 ELSE 0 END) as appointments_without_nurse_attendee
FROM appointments a
LEFT JOIN users u ON a.attendee_user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE a.title LIKE '%Medical Appointment%';

SELECT '' AS separator;

SELECT '=== STEP 6: CHECK TRIGGER CODE ===' AS step;
SHOW CREATE TRIGGER after_medical_record_insert;

SELECT '' AS separator;

SELECT '=== DIAGNOSIS ===' AS step;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Nurse' AND u.is_active = 1) = 0 
        THEN '❌ PROBLEM: No active nurses exist in the system. Create a nurse user first.'
        
        WHEN (SELECT COUNT(*) FROM appointments WHERE title LIKE '%Medical Appointment%' AND attendee_user_id IS NULL) > 0
        THEN '❌ PROBLEM: Appointments created with NULL attendee. Trigger may not be working correctly.'
        
        WHEN (SELECT COUNT(*) FROM appointments a JOIN users u ON a.attendee_user_id = u.id JOIN roles r ON u.role_id = r.id WHERE a.title LIKE '%Medical Appointment%' AND r.name != 'Nurse') > 0
        THEN '❌ PROBLEM: Appointments assigned to non-nurse users.'
        
        ELSE '✅ Appointments appear to be created correctly with nurse attendees.'
    END as diagnosis_result;
