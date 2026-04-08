-- =====================================================
-- ADD NURSE ROLE AND AUTOMATIC MEDICAL APPOINTMENTS
-- =====================================================
-- This script:
-- 1. Creates a 'Nurse' role if it doesn't exist
-- 2. Adds appropriate medical permissions to the Nurse role
-- 3. Sets up trigger to auto-create appointments when medical records are added
-- =====================================================

USE sokapptest;

-- Step 1: Create Nurse role if it doesn't exist
INSERT INTO roles (name, description, is_active)
SELECT 'Nurse', 'Medical staff responsible for child healthcare and medical appointments', 1
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'Nurse'
);

-- Verify the Nurse role was created
SELECT 'Nurse role created/verified:' AS info;
SELECT * FROM roles WHERE name = 'Nurse';

-- Step 2: Add medical-related permissions to Nurse role
-- First, let's check what medical permissions exist
SELECT 'Available medical permissions:' AS info;
SELECT * FROM permissions WHERE category = 'Children' AND name LIKE '%medical%' OR name LIKE '%health%';

-- Assign medical_manage permission to Nurse role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Nurse' 
AND p.name = 'medical_manage'
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Also give child_view permission so nurses can see children
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Nurse' 
AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Verify Nurse role permissions
SELECT 'Nurse role permissions:' AS info;
SELECT p.id, p.name, p.description, p.category
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'Nurse'
ORDER BY p.category, p.name;

-- Step 3: Create stored procedure to handle automatic appointment creation
-- This will be called from the backend when a medical record is created

DROP PROCEDURE IF EXISTS `create_medical_appointment_from_record`;

DELIMITER $$

CREATE PROCEDURE `create_medical_appointment_from_record`(
    IN p_child_id INT,
    IN p_next_appointment_date DATETIME,
    IN p_medical_record_id INT,
    OUT p_appointment_id INT
)
BEGIN
    DECLARE v_appointment_title VARCHAR(255);
    DECLARE v_appointment_description TEXT;
    DECLARE v_creator_user_id INT;
    
    -- Get the user who created the medical record (you may need to adjust this based on your tracking)
    -- For now, we'll use the first active Nurse as default creator
    SELECT id INTO v_creator_user_id 
    FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'Nurse') 
    AND is_active = 1 
    LIMIT 1;
    
    -- If no nurse found, use first active admin
    IF v_creator_user_id IS NULL THEN
        SELECT id INTO v_creator_user_id 
        FROM users 
        WHERE is_admin = 1 AND is_active = 1 
        LIMIT 1;
    END IF;
    
    -- If still null, use user ID 1 as fallback
    IF v_creator_user_id IS NULL THEN
        SET v_creator_user_id = 1;
    END IF;
    
    -- Get child name for appointment title
    SELECT CONCAT(
        'Medical Appointment - ', 
        c.first_name, ' ', 
        COALESCE(c.middle_name, ''), ' ', 
        c.last_name
    ) INTO v_appointment_title
    FROM children c
    WHERE c.id = p_child_id;
    
    -- Create appointment description
    SET v_appointment_description = CONCAT(
        'Automatic appointment created from medical record #', 
        p_medical_record_id, 
        '. Please review the child''s medical record for details.'
    );
    
    -- Insert into appointments table
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
    SELECT 
        v_creator_user_id,
        n.user_id,
        v_appointment_title,
        v_appointment_description,
        p_next_appointment_date,
        DATE_ADD(p_next_appointment_date, INTERVAL 1 HOUR),
        'Medical Center',
        'scheduled',
        1440  -- 24 hours before (24 * 60 = 1440 minutes)
    FROM (
        -- Get all active users with Nurse role
        SELECT u.id as user_id
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Nurse' AND u.is_active = 1
    ) n;
    
    -- Get the last inserted appointment ID
    SET p_appointment_id = LAST_INSERT_ID();
    
END$$

DELIMITER ;

-- Step 4: Create a simpler trigger-based approach
-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS `after_medical_record_insert`;

DELIMITER $$

CREATE TRIGGER `after_medical_record_insert`
AFTER INSERT ON `child_medical_records`
FOR EACH ROW
BEGIN
    DECLARE v_nurse_role_id INT;
    DECLARE v_creator_user_id INT;
    DECLARE v_appointment_title VARCHAR(255);
    DECLARE v_child_name VARCHAR(200);
    
    -- Only proceed if next_appointment_date is set
    IF NEW.next_appointment_date IS NOT NULL THEN
        
        -- Get Nurse role ID
        SELECT id INTO v_nurse_role_id FROM roles WHERE name = 'Nurse' LIMIT 1;
        
        -- Get creator user ID (first active nurse or admin)
        SELECT id INTO v_creator_user_id 
        FROM users 
        WHERE role_id = v_nurse_role_id AND is_active = 1 
        LIMIT 1;
        
        IF v_creator_user_id IS NULL THEN
            SELECT id INTO v_creator_user_id 
            FROM users 
            WHERE is_admin = 1 AND is_active = 1 
            LIMIT 1;
        END IF;
        
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
        
        -- Insert appointment for each nurse
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
        SELECT 
            v_creator_user_id,
            u.id,
            v_appointment_title,
            CONCAT('Follow-up appointment for medical record. Created automatically when medical record was saved.'),
            NEW.next_appointment_date,
            DATE_ADD(NEW.next_appointment_date, INTERVAL 1 HOUR),
            COALESCE(NEW.medical_center_name, NEW.hospital_name, 'Medical Center'),
            'scheduled',
            1440  -- 24 hours reminder
        FROM users u
        WHERE u.role_id = v_nurse_role_id AND u.is_active = 1;
        
    END IF;
END$$

DELIMITER ;

-- Step 5: Verify trigger was created
SELECT 'Trigger created:' AS info;
SHOW TRIGGERS LIKE 'child_medical_records';

-- Step 6: Show summary
SELECT '=== SETUP COMPLETE ===' AS status;
SELECT 'Nurse Role:' AS component, COUNT(*) as count FROM roles WHERE name = 'Nurse';
SELECT 'Nurse Permissions:' AS component, COUNT(*) as count FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'Nurse';
SELECT 'Active Nurses:' AS component, COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Nurse' AND u.is_active = 1;
SELECT 'Trigger Status:' AS component, 'after_medical_record_insert' as trigger_name;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
-- After running this script, when you create a medical record like this:
--
-- INSERT INTO child_medical_records (
--     child_id, note_type, next_appointment_date, ...
-- ) VALUES (
--     1, 'ongoing_health', '2026-04-15 10:00:00', ...
-- );
--
-- An appointment will be automatically created with:
-- - Title: "Medical Appointment - [Child Name]"
-- - Start: 2026-04-15 10:00:00
-- - End: 2026-04-15 11:00:00
-- - Reminder: 24 hours before (1440 minutes)
-- - Attendees: All active users with Nurse role
-- =====================================================
