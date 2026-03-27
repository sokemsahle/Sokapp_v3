-- Add 'notified' column to requisitions table if it doesn't exist
-- This column tracks whether the requester has been notified of finalization

ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS notified TINYINT(1) DEFAULT 0 COMMENT 'Whether requester has been notified of approval';

-- Update all existing finalized requisitions to be marked as notified
UPDATE requisitions 
SET notified = 1 
WHERE status = 'finalized' AND notified IS NULL;
