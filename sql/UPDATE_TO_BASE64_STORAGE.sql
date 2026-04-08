-- ============================================
-- DATABASE UPDATE - STORE FILES AS BASE64
-- ============================================
-- This SQL script updates columns to store Base64-encoded files
-- instead of file paths. Files are now stored directly in the database.
-- 
-- Run this in phpMyAdmin or MySQL command line
-- ============================================

USE sokapptest;

-- ============================================
-- 1. CHILDREN TABLE - Profile Photo
-- ============================================
-- Change from VARCHAR(500) to LONGTEXT for Base64 image data
ALTER TABLE children 
MODIFY COLUMN profile_photo LONGTEXT NULL COMMENT 'Profile photo as Base64 data URL (data:image/jpeg;base64,/9j/4AAQSkZJRg...)';

-- ============================================
-- 2. LEGAL DOCUMENTS TABLE - Document Files
-- ============================================
-- Change from VARCHAR(500) to LONGTEXT for Base64 document data
ALTER TABLE child_legal_documents 
MODIFY COLUMN document_file LONGTEXT NOT NULL COMMENT 'Document file as Base64 data URL (data:application/pdf;base64,JVBERi0xLjQK...)';

-- ============================================
-- 3. MEDICAL RECORDS TABLE - Medical Reports
-- ============================================
-- Change from VARCHAR(500) to LONGTEXT for Base64 document data
ALTER TABLE child_medical_records 
MODIFY COLUMN medical_report_file LONGTEXT NULL COMMENT 'Medical report as Base64 data URL (data:application/pdf;base64,...)';

-- ============================================
-- 4. EDUCATION RECORDS TABLE - Certificates
-- ============================================
-- Change from VARCHAR(500) to LONGTEXT for Base64 document data
ALTER TABLE child_education_records 
MODIFY COLUMN certificate_file LONGTEXT NULL COMMENT 'Certificate as Base64 data URL (data:application/pdf;base64,...)';

-- ============================================
-- 5. EMPLOYEES TABLE - Profile Image
-- ============================================
-- Change from VARCHAR(500) to LONGTEXT for Base64 image data
ALTER TABLE employees 
MODIFY COLUMN profile_image LONGTEXT NULL COMMENT 'Profile image as Base64 data URL (data:image/jpeg;base64,...)';

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

-- Check employees table
DESCRIBE employees;

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. All file uploads are now stored as Base64-encoded strings
--    directly in the database using LONGTEXT columns
--
-- 2. Base64 format allows easy embedding in HTML/CSS without
--    additional server requests
--
-- 3. Format: data:mimeType;base64,base64EncodedString
--    Example: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
--
-- 4. File size limits:
--    - Images: 5MB max (configured in multer middleware)
--    - Documents: 5MB max (configured in multer middleware)
--
-- 5. Database configuration:
--    - Ensure max_allowed_packet is at least 64MB
--    - Run: database/increase_packet_size.sql if needed
--
-- 6. NO files are stored in Backend/uploads/ folder anymore
--
-- 7. The /uploads static route has been removed from server.js
--
-- ============================================
