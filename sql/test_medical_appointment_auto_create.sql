-- =====================================================
-- QUICK TEST SCRIPT - Medical Appointment Auto-Creation
-- =====================================================
-- Run this to quickly test the feature after setup
-- =====================================================

USE sokapptest;

-- Step 1: Check if Nurse role exists
SELECT '=== CHECKING NURSE ROLE ===' AS step;
SELECT id, name, description, is_active 
FROM roles 
WHERE name = 'Nurse';

-- Step 2: Check active nurses
SELECT '=== ACTIVE NURSES ===' AS step;
SELECT u.id, u.full_name, u.email, u.department
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Nurse' AND u.is_active = 1;

-- Step 3: Check trigger exists
SELECT '=== TRIGGER STATUS ===' AS step;
SHOW TRIGGERS LIKE 'child_medical_records';

-- Step 4: Create a test medical record with appointment
SELECT '=== CREATING TEST MEDICAL RECORD ===' AS step;

-- Get a child ID (use first active child)
SET @test_child_id = (SELECT id FROM children LIMIT 1);

-- Create medical record with future appointment date
INSERT INTO child_medical_records (
    child_id,
    note_type,
    medical_condition,
    next_appointment_date,
    diagnosis,
    visit_reason,
    created_at
) VALUES (
    @test_child_id,
    'ongoing_health',
    'Test condition - Auto appointment test',
    DATE_ADD(NOW(), INTERVAL 2 DAY),  -- 2 days from now
    'Test diagnosis',
    'Testing automatic appointment creation',
    NOW()
);

SET @new_record_id = LAST_INSERT_ID();

SELECT CONCAT('Created medical record ID: ', @new_record_id) AS result;

-- Step 5: Verify appointment was created
SELECT '=== VERIFYING APPOINTMENT CREATED ===' AS step;

SELECT 
    a.id,
    a.title,
    a.start_datetime,
    a.end_datetime,
    a.reminder_minutes_before,
    a.status,
    u.full_name as attendee_name,
    u.email as attendee_email,
    c.first_name,
    c.last_name
FROM appointments a
JOIN users u ON a.attendee_user_id = u.id
LEFT JOIN children c ON a.title LIKE CONCAT('%', c.first_name, '%')
WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
ORDER BY a.created_at DESC
LIMIT 5;

-- Step 6: Show all recent medical appointments
SELECT '=== RECENT MEDICAL APPOINTMENTS ===' AS step;

SELECT 
    a.id,
    a.title,
    DATE_FORMAT(a.start_datetime, '%Y-%m-%d %H:%i') as start_time,
    CONCAT(a.reminder_minutes_before, ' min') as reminder,
    GROUP_CONCAT(DISTINCT CONCAT(u.full_name, ' (', u.email, ')') SEPARATOR '; ') as attendees
FROM appointments a
LEFT JOIN users u ON a.attendee_user_id = u.id
WHERE a.title LIKE '%Medical Appointment%'
GROUP BY a.id, a.title, a.start_datetime, a.reminder_minutes_before
ORDER BY a.start_datetime DESC
LIMIT 10;

-- Step 7: Summary
SELECT '=== SUMMARY ===' AS step;
SELECT 
    'Appointments Created' as metric, 
    COUNT(*) as value 
FROM appointments 
WHERE title LIKE '%Medical Appointment%';

-- Cleanup option (uncomment to delete test data)
-- DELETE FROM appointments WHERE title LIKE '%Auto appointment test%';
-- DELETE FROM child_medical_records WHERE id = @new_record_id;
