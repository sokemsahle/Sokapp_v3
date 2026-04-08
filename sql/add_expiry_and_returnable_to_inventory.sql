-- ============================================
-- ADD EXPIRY DATE AND RETURNABLE FLAGS TO INVENTORY
-- ============================================
-- Description: Adds two new boolean fields to the inventory table:
-- 1. has_expiry_date - Indicates if the item has an expiry date (for perishable goods)
-- 2. is_returnable - Indicates if the item can be returned after use
-- 
-- Usage: Run this script in phpMyAdmin or via MySQL command line
-- ============================================

USE sokapptest;

-- Add has_expiry_date column (default: false, as most items don't expire)
ALTER TABLE inventory 
ADD COLUMN has_expiry_date TINYINT(1) DEFAULT 0 AFTER cost_per_unit,
ADD COLUMN expiry_date DATE DEFAULT NULL AFTER has_expiry_date,
COMMENT = 'Indicates whether this item has an expiry date';

-- Add is_returnable column (default: false, as most items are consumed)
ALTER TABLE inventory 
ADD COLUMN is_returnable TINYINT(1) DEFAULT 0 AFTER expiry_date,
COMMENT = 'Indicates whether this item can be returned after use';

-- Create indexes for better query performance
CREATE INDEX idx_inventory_has_expiry_date ON inventory(has_expiry_date);
CREATE INDEX idx_inventory_is_returnable ON inventory(is_returnable);
CREATE INDEX idx_inventory_expiry_date ON inventory(expiry_date);

-- Verification queries
SELECT 'Inventory table structure updated successfully!' AS '';

SELECT 'Updated Inventory Schema:' AS '';
DESCRIBE inventory;

SELECT 'Sample query to find perishable items:' AS '';
SELECT id, name, category, has_expiry_date, expiry_date 
FROM inventory 
WHERE has_expiry_date = 1 
LIMIT 5;

SELECT 'Sample query to find returnable items:' AS '';
SELECT id, name, category, is_returnable 
FROM inventory 
WHERE is_returnable = 1 
LIMIT 5;
