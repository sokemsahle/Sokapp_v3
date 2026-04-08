-- Add reminder_minutes_before column to appointments table
-- This allows users to customize when they receive email reminders

ALTER TABLE appointments 
ADD COLUMN reminder_minutes_before INT DEFAULT 1 
COMMENT 'Minutes before appointment start time to send email reminder (1, 5, 10, 30, 60, 1440, 10080)';

-- Update existing appointments to default to 1 minute reminder
UPDATE appointments SET reminder_minutes_before = 1 WHERE reminder_minutes_before IS NULL;
