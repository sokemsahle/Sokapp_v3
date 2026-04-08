-- =====================================================
-- FIX: Updated Trigger for Nurse Attendees
-- =====================================================
-- This version creates ONE appointment and adds ALL nurses as attendees
-- Uses appointment_attendees junction table for multiple attendees
-- Includes proper description (NOT blank)
-- Prevents duplicates by using INSERT...SELECT correctly
-- =====================================================

USE sokapptest;

-- Drop existing trigger to prevent duplicates
DROP TRIGGER IF EXISTS `after_medical_record_insert`;

DELIMITER $$

CREATE TRIGGER `after_medical_record_insert`
AFTER INSERT ON `child_medical_records`
FOR EACH ROW
BEGIN
    DECLARE v_nurse_role_id INT DEFAULT NULL;
    DECLARE v_creator_user_id INT DEFAULT NULL;
    DECLARE v_appointment_title VARCHAR(255);
    DECLARE v_child_name VARCHAR(200);
    
    -- Only proceed if next_appointment_date is set
    IF NEW.next_appointment_date IS NOT NULL AND NEW.next_appointment_date != '' THEN
        
        -- Get Nurse role ID
        SELECT id INTO v_nurse_role_id 
        FROM roles 
        WHERE name = 'Nurse' 
        LIMIT 1;
        
        -- If Nurse role exists and we have active nurses
        IF v_nurse_role_id IS NOT NULL THEN
            
            -- Get first active nurse as creator (or fallback)
            SELECT id INTO v_creator_user_id 
            FROM users 
            WHERE role_id = v_nurse_role_id AND is_active = 1 
            LIMIT 1;
            
            -- Fallback to admin if no active nurses
            IF v_creator_user_id IS NULL THEN
                SELECT id INTO v_creator_user_id 
                FROM users 
                WHERE is_admin = 1 AND is_active = 1 
                LIMIT 1;
            END IF;
            
            -- Fallback to user ID 1 if no admin
            IF v_creator_user_id IS NULL THEN
                SET v_creator_user_id = 1;
            END IF;
            
            -- Get child name
            SELECT CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) 
            INTO v_child_name
            FROM children 
            WHERE id = NEW.child_id 
            LIMIT 1;
            
            -- Create appointment title
            SET v_appointment_title = CONCAT('Medical Appointment - ', v_child_name);
            
            -- Create ONE appointment with first nurse/admin as primary attendee
            INSERT INTO appointments (
                creator_user_id,
                attendee_user_id,
                title,
                description,
                start_datetime,
                end_datetime,
                location,
                status,
                reminder_minutes_before
            )
            VALUES (
                v_creator_user_id,
                v_creator_user_id,  -- Primary attendee (will also be in appointment_attendees)
                v_appointment_title,
                CONCAT('Follow-up appointment for medical record #', NEW.id, '. Please review the child\'s medical record for details.'),
                NEW.next_appointment_date,
                DATE_ADD(NEW.next_appointment_date, INTERVAL 1 HOUR),
                COALESCE(NEW.medical_center_name, NEW.hospital_name, 'Medical Center'),
                'scheduled',
                1440  -- 24 hours before
            );
            
            -- Get the newly created appointment ID
            SET @new_appointment_id = LAST_INSERT_ID();
            
            -- Add ALL active nurses as additional attendees via junction table
            INSERT INTO appointment_attendees (appointment_id, user_id)
            SELECT @new_appointment_id, u.id
            FROM users u
            WHERE u.role_id = v_nurse_role_id AND u.is_active = 1;
            
        END IF;
    END IF;
END$$

DELIMITER ;

SELECT '✅ Trigger updated successfully!' AS status;
SELECT 'The trigger now:' AS info;
SELECT '- Creates ONE appointment (not multiple)' AS feature1;
SELECT '- Adds ALL active nurses as attendees via junction table' AS feature2;
SELECT '- Always includes proper description with medical record ID' AS feature3;
SELECT '- Falls back to admin if no nurses exist' AS feature4;
SELECT '- Handles missing Nurse role gracefully' AS feature5;
SELECT '- Validates next_appointment_date is not NULL or empty' AS feature6;

-- Verify trigger was created
SELECT 'Trigger details:' AS info;
SHOW TRIGGERS LIKE 'child_medical_records';
