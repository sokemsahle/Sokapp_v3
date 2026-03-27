-- Troubleshooting: Inventory Categories Not Showing
-- Run these queries to diagnose the issue

-- 1. Check if inventory_categories category exists in lookup_categories
SELECT 'Step 1: Check lookup_categories table:' AS '';
SELECT id, name, display_name, description, is_active 
FROM lookup_categories 
WHERE name = 'inventory_categories';

-- Expected: Should return 1 row with name='inventory_categories'

-- 2. Check if inventory category items exist in lookup_items
SELECT 'Step 2: Check lookup_items table:' AS '';
SELECT li.id, li.category_id, li.value, li.display_order, li.is_active, lc.name as category_name
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories';

-- Expected: Should return 19 rows (all categories)

-- 3. Test the exact query the API uses
SELECT 'Step 3: Test API query:' AS '';
SELECT li.value 
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories' AND li.is_active = TRUE
ORDER BY li.display_order, li.value;

-- Expected: List of all 19 category names

-- 4. Check for any issues with the data
SELECT 'Step 4: Check for common issues:' AS '';

-- Issue A: Category might be inactive
SELECT 'Issue A - Inactive categories:' AS '';
SELECT * FROM lookup_items li
JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories' AND li.is_active = FALSE;

-- Issue B: Category name mismatch (check spelling)
SELECT 'Issue B - Check exact category name:' AS '';
SELECT name, display_name FROM lookup_categories 
WHERE name LIKE '%inventory%' OR display_name LIKE '%Inventory%';

-- Issue C: Check if items are linked to wrong category
SELECT 'Issue C - All lookup items by category:' AS '';
SELECT lc.name, lc.display_name, COUNT(li.id) as item_count
FROM lookup_categories lc
LEFT JOIN lookup_items li ON li.category_id = lc.id
GROUP BY lc.id, lc.name, lc.display_name;

-- 5. Fix: Re-insert inventory categories if missing
SELECT 'Step 5: Fix script (if needed):' AS '';

-- If category is missing, run this:
INSERT INTO `lookup_categories` (`name`, `display_name`, `description`, `is_active`) 
VALUES ('inventory_categories', 'Inventory Categories', 'Manage inventory item categories', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Get the category ID
SET @cat_id = (SELECT id FROM lookup_categories WHERE name = 'inventory_categories');

-- Insert all 19 categories
INSERT INTO `lookup_items` (`category_id`, `value`, `display_order`, `is_active`) 
VALUES 
    (@cat_id, 'Food & Nutrition', 1, 1),
    (@cat_id, 'Hygiene', 2, 1),
    (@cat_id, 'Education', 3, 1),
    (@cat_id, 'Medical', 4, 1),
    (@cat_id, 'Clothing', 5, 1),
    (@cat_id, 'Other', 6, 1),
    (@cat_id, 'Office Supplies', 7, 1),
    (@cat_id, 'Cleaning Supplies', 8, 1),
    (@cat_id, 'Maintenance', 9, 1),
    (@cat_id, 'Electronics', 10, 1),
    (@cat_id, 'Furniture', 11, 1),
    (@cat_id, 'Vehicles', 12, 1),
    (@cat_id, 'Sports & Recreation', 13, 1),
    (@cat_id, 'Kitchen Supplies', 14, 1),
    (@cat_id, 'Bedding & Linens', 15, 1),
    (@cat_id, 'Baby Care', 16, 1),
    (@cat_id, 'First Aid', 17, 1),
    (@cat_id, 'Stationery', 18, 1),
    (@cat_id, 'Tools & Equipment', 19, 1)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- 6. Final verification
SELECT 'Step 6: Final Verification:' AS '';
SELECT 
    lc.display_name as category,
    COUNT(li.id) as total_items,
    SUM(CASE WHEN li.is_active = 1 THEN 1 ELSE 0 END) as active_items
FROM lookup_categories lc
LEFT JOIN lookup_items li ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories'
GROUP BY lc.id, lc.display_name;
