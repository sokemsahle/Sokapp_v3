-- Check if expiry and returnable columns exist in inventory table
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sokapptest' 
  AND TABLE_NAME = 'inventory'
  AND COLUMN_NAME IN ('has_expiry_date', 'expiry_date', 'is_returnable')
ORDER BY ORDINAL_POSITION;

-- Show all inventory columns
DESCRIBE inventory;
