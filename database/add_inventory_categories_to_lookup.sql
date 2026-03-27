-- Add Inventory Categories to Lookup System
-- This script adds inventory categories as a lookup category
-- so they can be managed dynamically through the Lookup Editor

-- Step 1: Add new inventory_categories lookup category (if not exists)
INSERT INTO `lookup_categories` (`name`, `display_name`, `description`, `is_active`) 
VALUES 
    ('inventory_categories', 'Inventory Categories', 'Manage inventory item categories', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Step 2: Get the category_id for inventory_categories
SET @inventory_category_id = (SELECT id FROM lookup_categories WHERE name = 'inventory_categories');

-- Step 3: Insert all inventory categories currently available in the system
-- Based on actual inventory data and standard categories
INSERT INTO `lookup_items` (`category_id`, `value`, `display_order`, `is_active`) 
VALUES 
    -- Standard categories from the application
    (@inventory_category_id, 'Food & Nutrition', 1, 1),
    (@inventory_category_id, 'Hygiene', 2, 1),
    (@inventory_category_id, 'Education', 3, 1),
    (@inventory_category_id, 'Medical', 4, 1),
    (@inventory_category_id, 'Clothing', 5, 1),
    (@inventory_category_id, 'Other', 6, 1),
    
    -- Additional common inventory categories
    (@inventory_category_id, 'Office Supplies', 7, 1),
    (@inventory_category_id, 'Cleaning Supplies', 8, 1),
    (@inventory_category_id, 'Maintenance', 9, 1),
    (@inventory_category_id, 'Electronics', 10, 1),
    (@inventory_category_id, 'Furniture', 11, 1),
    (@inventory_category_id, 'Vehicles', 12, 1),
    (@inventory_category_id, 'Sports & Recreation', 13, 1),
    (@inventory_category_id, 'Kitchen Supplies', 14, 1),
    (@inventory_category_id, 'Bedding & Linens', 15, 1),
    (@inventory_category_id, 'Baby Care', 16, 1),
    (@inventory_category_id, 'First Aid', 17, 1),
    (@inventory_category_id, 'Stationery', 18, 1),
    (@inventory_category_id, 'Tools & Equipment', 19, 1)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Verification queries
SELECT 'Lookup Categories:' AS '';
SELECT * FROM lookup_categories;

SELECT 'Lookup Items - Inventory Categories:' AS '';
SELECT li.id, li.value, li.display_order, li.is_active, lc.display_name
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories'
ORDER BY li.display_order;
