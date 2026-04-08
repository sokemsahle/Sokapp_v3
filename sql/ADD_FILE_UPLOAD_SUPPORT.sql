-- ============================================
-- FILE UPLOAD SUPPORT - DATABASE UPDATE
-- ============================================
-- This SQL script updates the child management tables
-- to properly support file uploads
-- 
-- Run this in phpMyAdmin or MySQL command line
-- ============================================

USE sokapptest;

-- ============================================
-- 1. CHILDREN TABLE - Profile Photo
-- ============================================
-- Ensure profile_photo column can store file paths
ALTER TABLE children 
MODIFY COLUMN profile_photo VARCHAR(500) NULL COMMENT 'Profile photo file path (e.g., /uploads/filename.jpg)';

-- ============================================
-- 2. LEGAL DOCUMENTS TABLE - Document Files
-- ============================================
-- Ensure document_file column can store file paths
ALTER TABLE child_legal_documents 
MODIFY COLUMN document_file VARCHAR(500) NOT NULL COMMENT 'Document file path (e.g., /uploads/filename.pdf)';

-- ============================================
-- 3. MEDICAL RECORDS TABLE - Medical Reports
-- ============================================
-- Ensure medical_report_file column can store file paths
ALTER TABLE child_medical_records 
MODIFY COLUMN medical_report_file VARCHAR(500) NULL COMMENT 'Medical report file path (e.g., /uploads/report.pdf)';

-- ============================================
-- 4. EDUCATION RECORDS TABLE - Certificates
-- ============================================
-- Ensure certificate_file column can store file paths
ALTER TABLE child_education_records 
MODIFY COLUMN certificate_file VARCHAR(500) NULL COMMENT 'Certificate file path (e.g., /uploads/cert.pdf)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the changes were applied

-- Check children table
DESCRIBE children;

-- Check legal documents table
DESCRIBE child_legal_documents;

-- Check medical records table
DESCRIBE child_medical_records;

-- Check education records table
DESCRIBE child_education_records;

-- ============================================
-- SAMPLE DATA INSERTION (FOR TESTING)
-- ============================================
-- Uncomment to test with sample data

/*
-- Insert a test child with profile photo
INSERT INTO children (
    first_name, middle_name, last_name, gender, date_of_birth, 
    place_of_birth, nationality, religion, blood_group, 
    disability_status, health_status, date_of_admission, 
    admitted_by, current_status, profile_photo
) VALUES (
    'Test', 'Middle', 'Child', 'Male', '2020-01-15',
    'City', 'Nationality', 'Religion', 'A+',
    FALSE, 'Healthy', '2024-01-01',
    1, 'Active', '/uploads/test-photo.jpg'
);

-- Get the last inserted ID
SET @test_child_id = LAST_INSERT_ID();

-- Add a legal document with file
INSERT INTO child_legal_documents (
    child_id, document_type, document_number, issue_date, 
    expiry_date, document_file, verified_status
) VALUES (
    @test_child_id, 'Birth Certificate', 'BC-123456', '2020-02-01',
    NULL, '/uploads/birth-cert.pdf', TRUE
);

-- Add a medical record with file
INSERT INTO child_medical_records (
    child_id, medical_condition, vaccination_status, 
    last_medical_checkup, allergies, medications, 
    doctor_name, hospital_name, medical_report_file
) VALUES (
    @test_child_id, 'None', 'Up to date', '2024-01-15',
    'None', 'None', 'Dr. Smith', 'City Hospital', '/uploads/medical-report.pdf'
);

-- Add an education record with file
INSERT INTO child_education_records (
    child_id, school_name, grade_level, enrollment_date, 
    performance_notes, certificate_file
) VALUES (
    @test_child_id, 'Primary School', 'Grade 3', '2023-09-01',
    'Good performance', '/uploads/school-cert.pdf'
);
*/

-- ============================================
-- CLEANUP TEST DATA (IF NEEDED)
-- ============================================
-- To remove test data, run:
-- DELETE FROM children WHERE first_name = 'Test';

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. File uploads are now REQUIRED for:
--    - Legal Documents (document_file)
--    - Medical Reports (medical_report_file)  
--    - Education Certificates (certificate_file)
--
-- 2. Profile photos are OPTIONAL but recommended
--
-- 3. All file paths should be stored as:
--    /uploads/filename.ext
--
-- 4. Files are physically stored in:
--    Backend/uploads/ directory
--
-- 5. Files can be accessed via:
--    http://localhost:5000/uploads/filename.ext
--
-- ============================================
