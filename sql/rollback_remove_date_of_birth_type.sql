-- Rollback script to restore estimated_age column and remove date_of_birth_type
-- Use this if you need to revert the migration

-- Step 1: Add back the estimated_age column
ALTER TABLE children 
ADD COLUMN estimated_age INT COMMENT 'Estimated age in years (if exact DOB unknown)';

-- Step 2: Populate estimated_age for records marked as 'estimated'
-- Note: This will set estimated_age to NULL since we can't derive age from DOB
-- You may want to manually estimate ages based on the birth dates
UPDATE children 
SET estimated_age = NULL
WHERE date_of_birth_type = 'estimated';

-- For records with actual birth dates, calculate approximate age
UPDATE children 
SET estimated_age = TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE())
WHERE date_of_birth_type = 'actual' AND date_of_birth IS NOT NULL;

-- Step 3: Remove the date_of_birth_type column
ALTER TABLE children 
DROP COLUMN date_of_birth_type;

-- Step 4: Drop the index
DROP INDEX idx_date_of_birth_type ON children;

-- Verification query
SELECT 
    id,
    first_name,
    last_name,
    date_of_birth,
    estimated_age
FROM children
ORDER BY created_at DESC
LIMIT 20;
