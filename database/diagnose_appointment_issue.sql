-- =====================================================
-- DIAGNOSE: Why Appointments Not Being Created
-- =====================================================
-- Run this to check what's missing in the setup
-- =====================================================

USE sokapptest;

SELECT '=== STEP 1: CHECK IF NURSE ROLE EXISTS ===' AS diagnostic_step;
SELECT id, name, description, is_active 
FROM roles 
WHERE name = 'Nurse';

SELECT '' AS separator;

SELECT '=== STEP 2: CHECK IF ANY ACTIVE NURSES EXIST ===' AS diagnostic_step;
SELECT u.id, u.full_name, u.email, u.is_active, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Nurse' OR u.role_id IN (SELECT id FROM roles WHERE name = 'Nurse');

IF ROW_COUNT() = 0 THEN
    SELECT '⚠️  WARNING: No active nurses found!' AS issue;
    SELECT 'Solution: Create a nurse user or run the main SQL script' AS solution;
END IF;

SELECT '' AS separator;

SELECT '=== STEP 3: CHECK IF TRIGGER EXISTS ===' AS diagnostic_step;
SHOW TRIGGERS LIKE 'child_medical_records';

SELECT '' AS separator;

SELECT '=== STEP 4: CHECK TRIGGER DEFINITION ===' AS diagnostic_step;
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    ACTION_TIMING,
    ACTION_STATEMENT
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'sokapptest' 
AND TRIGGER_NAME = 'after_medical_record_insert';

SELECT '' AS separator;

SELECT '=== STEP 5: CHECK RECENT MEDICAL RECORDS WITH APPOINTMENTS ===' AS diagnostic_step;
SELECT 
    cmr.id as medical_record_id,
    cmr.child_id,
    c.first_name,
    c.last_name,
    cmr.next_appointment_date,
    cmr.created_at as record_created,
    CASE 
        WHEN cmr.next_appointment_date IS NOT NULL THEN 'Has appointment date'
        ELSE 'No appointment date'
    END as appointment_status
FROM child_medical_records cmr
LEFT JOIN children c ON cmr.child_id = c.id
WHERE cmr.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY cmr.created_at DESC
LIMIT 5;

SELECT '' AS separator;

SELECT '=== STEP 6: CHECK IF APPOINTMENTS WERE CREATED ===' AS diagnostic_step;
SELECT 
    a.id as appointment_id,
    a.title,
    a.start_datetime,
    a.end_datetime,
    a.reminder_minutes_before,
    a.status,
    u.full_name as attendee_name,
    a.created_at as appointment_created
FROM appointments a
LEFT JOIN users u ON a.attendee_user_id = u.id
WHERE a.title LIKE '%Medical Appointment%'
AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY a.created_at DESC
LIMIT 10;

IF ROW_COUNT() = 0 THEN
    SELECT '⚠️  WARNING: No medical appointments created in last hour!' AS issue;
END IF;

SELECT '' AS separator;

SELECT '=== STEP 7: CHECK APPOINTMENTS TABLE STRUCTURE ===' AS diagnostic_step;
DESCRIBE appointments;

SELECT '' AS separator;

SELECT '=== STEP 8: COUNT TOTAL MEDICAL APPOINTMENTS ===' AS diagnostic_step;
SELECT 
    COUNT(*) as total_medical_appointments
FROM appointments
WHERE title LIKE '%Medical Appointment%';

SELECT '' AS separator;

SELECT '=== SUMMARY & RECOMMENDATIONS ===' AS diagnostic_step;

-- Check all required components
SELECT 
    'Nurse Role Exists' as component,
    CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO' END as status
FROM roles WHERE name = 'Nurse'
UNION ALL
SELECT 
    'Active Nurses',
    CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO' END
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Nurse' AND u.is_active = 1
UNION ALL
SELECT 
    'Trigger Exists',
    CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO' END
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'sokapptest' 
AND TRIGGER_NAME = 'after_medical_record_insert';

SELECT '' AS separator;
SELECT 'If any component shows ❌ NO, you need to:' AS recommendation;
SELECT '1. Run: mysql -u root -p sokapptest < database/add_nurse_role_and_auto_appointments.sql' AS step1;
SELECT '2. Then test again by creating a medical record with next_appointment_date' AS step2;
