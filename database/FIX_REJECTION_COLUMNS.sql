-- ============================================
-- FIX MISSING COLUMNS IN inventory_requests
-- ============================================
-- This script adds the missing rejection-related columns
-- that are required for the approval/rejection system

USE sokapptest;

-- Check if columns exist before adding them
-- Add rejected_by column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'inventory_requests';
SET @columnname = 'rejected_by';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_NAME = @tablename
      AND TABLE_SCHEMA = @dbname
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT(11) DEFAULT NULL AFTER approved_by_name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add rejected_by_name column if it doesn't exist
SET @columnname = 'rejected_by_name';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_NAME = @tablename
      AND TABLE_SCHEMA = @dbname
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(255) DEFAULT NULL AFTER rejected_by")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add rejection_reason column if it doesn't exist
SET @columnname = 'rejection_reason';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_NAME = @tablename
      AND TABLE_SCHEMA = @dbname
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT DEFAULT NULL AFTER rejected_by_name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add rejected_at column if it doesn't exist
SET @columnname = 'rejected_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_NAME = @tablename
      AND TABLE_SCHEMA = @dbname
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TIMESTAMP NULL DEFAULT NULL AFTER rejection_reason")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the changes
SELECT 'Columns added successfully!' AS status;

-- Show the updated table structure
DESCRIBE inventory_requests;

-- Verify all required columns now exist
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sokapptest'
  AND TABLE_NAME = 'inventory_requests'
  AND COLUMN_NAME IN ('rejected_by', 'rejected_by_name', 'rejection_reason', 'rejected_at')
ORDER BY ORDINAL_POSITION;
