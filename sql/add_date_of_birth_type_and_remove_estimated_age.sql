-- Migration to add date_of_birth_type column and remove estimated_age column
-- This ensures we track whether a birth date is actual or estimated

-- Step 1: Add the new date_of_birth_type column
ALTER TABLE children 
ADD COLUMN date_of_birth_type VARCHAR(20) DEFAULT 'actual' COMMENT 'Type of birth date: "actual" or "estimated"';

-- Step 2: Update existing records based on whether they have estimated_age
UPDATE children 
SET date_of_birth_type = 'estimated' 
WHERE estimated_age IS NOT NULL AND estimated_age != '' AND (date_of_birth IS NULL OR date_of_birth = '');

UPDATE children 
SET date_of_birth_type = 'actual' 
WHERE date_of_birth IS NOT NULL AND date_of_birth != '';

-- Step 3: Migrate estimated_age values to date_of_birth if possible
-- Note: This requires manual intervention as we can't convert age to exact birth date
-- Records with only estimated_age will need to have an approximate birth date entered manually

-- Step 4: Remove the estimated_age column
ALTER TABLE children 
DROP COLUMN estimated_age;

-- Step 5: Add index for better query performance
CREATE INDEX idx_date_of_birth_type ON children(date_of_birth_type);

-- Verification query
SELECT 
    id,
    first_name,
    last_name,
    date_of_birth,
    date_of_birth_type,
    CASE 
        WHEN date_of_birth_type = 'actual' THEN 'Exact birth date known'
        WHEN date_of_birth_type = 'estimated' THEN 'Approximate birth date'
        ELSE 'Unknown'
    END as birth_date_info
FROM children
ORDER BY created_at DESC
LIMIT 20;
