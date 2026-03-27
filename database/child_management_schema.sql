-- ============================================
-- CHILD MANAGEMENT SYSTEM - TIER 1 & TIER 2
-- ============================================
-- Run this AFTER the base sokapptest_schema.sql
-- DO NOT modify existing tables
-- Only ADD new tables and permissions

USE sokapptest;

-- ============================================
-- STEP 1: ADD NEW PERMISSIONS
-- ============================================

INSERT IGNORE INTO permissions (name, description, category) VALUES
('child_view', 'View child profiles', 'Children'),
('child_create', 'Create new child profile', 'Children'),
('child_update', 'Update child profile', 'Children'),
('child_delete', 'Delete child profile', 'Children'),
('guardian_manage', 'Manage guardian information', 'Children'),
('legal_manage', 'Manage legal documents', 'Children'),
('medical_manage', 'Manage medical records', 'Children'),
('education_manage', 'Manage education records', 'Children'),
('case_manage', 'Manage case history', 'Children');

-- Assign all child permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.category = 'Children'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- STEP 2: TIER 1 - CORE CHILD TABLE
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
    
    CONSTRAINT fk_children_user
        FOREIGN KEY (admitted_by)
            REFERENCES users(id)
            ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: TIER 2 - EXTENDED DOCUMENTATION
-- ============================================

-- 3.1 Guardian Information
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
    
    CONSTRAINT fk_guardian_child
        FOREIGN KEY (child_id)
            REFERENCES children(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 Legal Documents
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
    
    CONSTRAINT fk_legal_child
        FOREIGN KEY (child_id)
            REFERENCES children(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 Medical Records
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
    
    CONSTRAINT fk_medical_child
        FOREIGN KEY (child_id)
            REFERENCES children(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4 Education Records
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
    
    CONSTRAINT fk_education_child
        FOREIGN KEY (child_id)
            REFERENCES children(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.5 Case History
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
    
    CONSTRAINT fk_case_child
        FOREIGN KEY (child_id)
            REFERENCES children(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VERIFICATION
-- ============================================

SHOW TABLES LIKE 'child%';

SELECT 'Child Permissions Added' as status, COUNT(*) as count 
FROM permissions 
WHERE category = 'Children';
