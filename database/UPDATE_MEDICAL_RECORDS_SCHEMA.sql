-- =====================================================
-- MEDICAL RECORDS ENHANCEMENT - HOME & ONGOING HEALTH NOTES
-- Run this in phpMyAdmin on your sokapptest database
-- =====================================================

-- Add new columns for Home Health Care Note and Ongoing Health Note
ALTER TABLE child_medical_records 
ADD COLUMN note_type ENUM('home_health_care', 'ongoing_health') NOT NULL DEFAULT 'ongoing_health' AFTER medical_condition,

-- Home Health Care Note Fields
ADD COLUMN age_years DECIMAL(5,2) DEFAULT NULL COMMENT 'Age in years' AFTER note_type,
ADD COLUMN height_cm DECIMAL(6,2) DEFAULT NULL COMMENT 'Height in centimeters' AFTER age_years,
ADD COLUMN weight_kg DECIMAL(6,2) DEFAULT NULL COMMENT 'Weight in kilograms' AFTER height_cm,
ADD COLUMN head_circumference_cm DECIMAL(6,2) DEFAULT NULL COMMENT 'Head circumference in centimeters' AFTER weight_kg,
ADD COLUMN weight_for_age_percentile VARCHAR(20) DEFAULT NULL COMMENT 'Weight for age percentile' AFTER head_circumference_cm,
ADD COLUMN weight_for_height_percentile VARCHAR(20) DEFAULT NULL COMMENT 'Weight for height percentile' AFTER weight_for_age_percentile,
ADD COLUMN height_for_age_percentile VARCHAR(20) DEFAULT NULL COMMENT 'Height for age percentile' AFTER weight_for_height_percentile,
ADD COLUMN temperature_celsius DECIMAL(4,2) DEFAULT NULL COMMENT 'Temperature in Celsius' AFTER height_for_age_percentile,
ADD COLUMN respiration_rate INT DEFAULT NULL COMMENT 'Respiration rate per minute' AFTER temperature_celsius,
ADD COLUMN pulse_rate INT DEFAULT NULL COMMENT 'Pulse rate per minute' AFTER respiration_rate,
ADD COLUMN spo2_percentage INT DEFAULT NULL COMMENT 'SpO2 percentage' AFTER pulse_rate,
ADD COLUMN other_vitals TEXT DEFAULT NULL COMMENT 'Other vital signs or observations' AFTER spo2_percentage,
ADD COLUMN present_illness TEXT DEFAULT NULL COMMENT 'Present illness description' AFTER other_vitals,
ADD COLUMN treatment_plan TEXT DEFAULT NULL COMMENT 'Treatment plan' AFTER present_illness,

-- Ongoing Health Note Fields
ADD COLUMN performer_first_name VARCHAR(100) DEFAULT NULL COMMENT 'Performer first name' AFTER treatment_plan,
ADD COLUMN performer_middle_name VARCHAR(100) DEFAULT NULL COMMENT 'Performer middle name' AFTER performer_first_name,
ADD COLUMN performer_last_name VARCHAR(100) DEFAULT NULL COMMENT 'Performer last name' AFTER performer_middle_name,
ADD COLUMN medical_center_name VARCHAR(200) DEFAULT NULL COMMENT 'Name of medical center' AFTER performer_last_name,
ADD COLUMN doctor_specialty VARCHAR(150) DEFAULT NULL COMMENT 'Doctor specialty' AFTER medical_center_name,
ADD COLUMN diagnosis TEXT DEFAULT NULL COMMENT 'Diagnosis' AFTER doctor_specialty,
ADD COLUMN visit_reason VARCHAR(255) DEFAULT NULL COMMENT 'Reason for visit' AFTER diagnosis,
ADD COLUMN visit_details TEXT DEFAULT NULL COMMENT 'Visit details' AFTER visit_reason,
ADD COLUMN next_appointment_date DATE DEFAULT NULL COMMENT 'Next appointment date' AFTER visit_details;

-- Modify existing column to make medical_report_file optional
ALTER TABLE child_medical_records 
MODIFY COLUMN medical_report_file VARCHAR(500) DEFAULT NULL COMMENT 'Medical report file path';

-- Optional: Add index for note_type for faster filtering
CREATE INDEX idx_note_type ON child_medical_records(note_type);

-- Verify the changes
DESCRIBE child_medical_records;
