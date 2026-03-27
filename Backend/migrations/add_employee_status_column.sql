-- Add status column to employees table
-- This migration adds a new ENUM column for employee status
-- Status values: 'Active', 'Inactive', 'Former Employee'

ALTER TABLE employees 
ADD COLUMN status ENUM('Active', 'Inactive', 'Former Employee') DEFAULT 'Active' AFTER is_active;

-- Update existing employees to have 'Active' status if is_active = 1, otherwise 'Inactive'
UPDATE employees 
SET status = CASE 
    WHEN is_active = 1 THEN 'Active' 
    ELSE 'Inactive' 
END;

-- Note: The is_active column is kept for backward compatibility
-- Future updates may phase it out completely in favor of the status column
