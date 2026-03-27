-- ============================================
-- FIX: CHILD PROFILE NOT WORKING
-- Run this in phpMyAdmin to fix all issues
-- ============================================

USE sokapptest;

-- ============================================
-- FIX 1: Ensure permissions exist
-- ============================================

-- Insert child permissions if they don't exist
INSERT INTO permissions (name, description, category) 
VALUES 
('child_view', 'View child profiles', 'Children'),
('child_create', 'Create new child profile', 'Children'),
('child_update', 'Update child profile', 'Children'),
('child_delete', 'Delete child profile', 'Children'),
('guardian_manage', 'Manage guardian information', 'Children'),
('legal_manage', 'Manage legal documents', 'Children'),
('medical_manage', 'Manage medical records', 'Children'),
('education_manage', 'Manage education records', 'Children'),
('case_manage', 'Manage case history', 'Children')
ON DUPLICATE KEY UPDATE 
description = VALUES(description), 
category = VALUES(category);

-- ============================================
-- FIX 2: Assign ALL permissions to admin role
-- ============================================

DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin';

-- ============================================
-- FIX 3: Assign child_view to ALL roles (so everyone can see it)
-- ============================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE p.name = 'child_view'
AND r.name != 'Standard'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Give Standard users view access too
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Standard' 
AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- FIX 4: Create tables if they don't exist
-- ============================================

CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male','Female','Other') NOT NULL,
    date_of_birth DATE,
    estimated_age INT,
    place_of_birth VARCHAR(150),
    nationality VARCHAR(100),
    religion VARCHAR(100),
    blood_group VARCHAR(5),
    disability_status BOOLEAN DEFAULT FALSE,
    disability_description TEXT,
    health_status TEXT,
    date_of_admission DATE NOT NULL,
    admitted_by INT,
    current_status ENUM('Active','Reunified','Adopted','Deceased','Transferred') DEFAULT 'Active',
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (current_status),
    INDEX idx_admission_date (date_of_admission),
    
    FOREIGN KEY (admitted_by)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_guardian_information (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    guardian_name VARCHAR(150) NOT NULL,
    relationship_to_child VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    alive_status BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_guardian_child (child_id),
    
    FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_legal_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    document_type ENUM('Birth Certificate','Court Order','Police Report','Surrender Form','Adoption Paper','Other') NOT NULL,
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    document_file VARCHAR(255),
    verified_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_legal_child (child_id),
    INDEX idx_document_type (document_type),
    
    FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    medical_condition TEXT,
    vaccination_status TEXT,
    last_medical_checkup DATE,
    allergies TEXT,
    medications TEXT,
    doctor_name VARCHAR(150),
    hospital_name VARCHAR(150),
    medical_report_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_medical_child (child_id),
    
    FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_education_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    school_name VARCHAR(150),
    grade_level VARCHAR(50),
    enrollment_date DATE,
    performance_notes TEXT,
    certificate_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_education_child (child_id),
    
    FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_case_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    case_type ENUM('Abandonment','Abuse','Orphaned','Single Parent','Other') NOT NULL,
    description TEXT,
    reported_by VARCHAR(150),
    report_date DATE,
    case_status ENUM('Open','Under Review','Closed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_case_child (child_id),
    
    FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FIX 5: Insert sample child data for testing
-- ============================================

INSERT INTO children (first_name, last_name, gender, date_of_birth, estimated_age, date_of_admission, current_status)
VALUES 
('John', 'Doe', 'Male', '2015-05-15', 10, '2024-01-15', 'Active'),
('Jane', 'Smith', 'Female', '2016-08-20', 9, '2024-02-01', 'Active')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check 1: Verify permissions exist
SELECT '✅ Permissions Check:' as status;
SELECT name, description FROM permissions WHERE category = 'Children';

-- Check 2: Verify role assignments
SELECT '✅ Role Assignments:' as status;
SELECT r.name as role_name, COUNT(p.id) as child_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Children'
GROUP BY r.id, r.name;

-- Check 3: Verify tables exist
SELECT '✅ Tables Created:' as status;
SHOW TABLES LIKE 'child%';

-- Check 4: Verify sample data
SELECT '✅ Sample Children:' as status;
SELECT id, first_name, last_name, gender, current_status FROM children;

-- Check 5: Verify your user has permissions
SELECT '✅ Your User Permissions:' as status;
SELECT u.email, u.full_name, r.name as role_name, p.name as permission_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'Children'
ORDER BY u.email, p.name;
