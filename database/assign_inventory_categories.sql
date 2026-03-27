-- Assign Categories to Uncategorized Inventory Items
-- This script helps categorize inventory items that are currently empty/uncategorized
-- Run this AFTER adding inventory_categories to lookup list

-- First, let's see what inventory items exist and their current categories
SELECT 'Current Inventory Items:' AS '';
SELECT id, name, category, quantity, unit 
FROM inventory 
ORDER BY category, name;

-- Step 1: Find items with NULL or empty category
SELECT 'Items needing categorization:' AS '';
SELECT id, name, category, quantity, unit, location
FROM inventory 
WHERE category IS NULL OR category = '' OR TRIM(category) = '';

-- Step 2: Update statements for common uncategorized items
-- Uncomment and modify the lines below based on your actual inventory items

-- Example updates (customize based on your inventory):

-- Medical supplies
-- UPDATE inventory SET category = 'Medical' 
-- WHERE name LIKE '%medicine%' OR name LIKE '%bandage%' OR name LIKE '%first aid%';

-- Educational materials
-- UPDATE inventory SET category = 'Education' 
-- WHERE name LIKE '%book%' OR name LIKE '%notebook%' OR name LIKE '%pen%' OR name LIKE '%pencil%';

-- Hygiene products
-- UPDATE inventory SET category = 'Hygiene' 
-- WHERE name LIKE '%soap%' OR name LIKE '%shampoo%' OR name LIKE '%toothbrush%' OR name LIKE '%towel%';

-- Clothing items
-- UPDATE inventory SET category = 'Clothing' 
-- WHERE name LIKE '%shirt%' OR name LIKE '%pants%' OR name LIKE '%dress%' OR name LIKE '%shoes%';

-- Kitchen items
-- UPDATE inventory SET category = 'Kitchen Supplies' 
-- WHERE name LIKE '%pot%' OR name LIKE '%pan%' OR name LIKE '%plate%' OR name LIKE '%spoon%' OR name LIKE '%fork%';

-- Cleaning supplies
-- UPDATE inventory SET category = 'Cleaning Supplies' 
-- WHERE name LIKE '%broom%' OR name LIKE '%mop%' OR name LIKE '%detergent%' OR name LIKE '%cleaner%';

-- Office supplies
-- UPDATE inventory SET category = 'Office Supplies' 
-- WHERE name LIKE '%paper%' OR name LIKE '%folder%' OR name LIKE '%stapler%';

-- Furniture
-- UPDATE inventory SET category = 'Furniture' 
-- WHERE name LIKE '%chair%' OR name LIKE '%table%' OR name LIKE '%desk%' OR name LIKE '%bed%';

-- Electronics
-- UPDATE inventory SET category = 'Electronics' 
-- WHERE name LIKE '%computer%' OR name LIKE '%phone%' OR name LIKE '%tablet%' OR name LIKE '%charger%';

-- Sports & Recreation
-- UPDATE inventory SET category = 'Sports & Recreation' 
-- WHERE name LIKE '%ball%' OR name LIKE '%game%' OR name LIKE '%toy%';

-- Baby care items
-- UPDATE inventory SET category = 'Baby Care' 
-- WHERE name LIKE '%diaper%' OR name LIKE '%baby bottle%' OR name LIKE '%pacifier%';

-- Bedding items
-- UPDATE inventory SET category = 'Bedding & Linens' 
-- WHERE name LIKE '%blanket%' OR name LIKE '%pillow%' OR name LIKE '%sheet%' OR name LIKE '%towel%';

-- Step 3: Verify all items now have categories
SELECT 'Updated Inventory Summary:' AS '';
SELECT category, COUNT(*) as item_count, SUM(quantity) as total_quantity
FROM inventory 
GROUP BY category
ORDER BY item_count DESC;

-- Step 4: Check if any items still need categorization
SELECT 'Still Uncategorized (if any):' AS '';
SELECT id, name, category, quantity, unit, location
FROM inventory 
WHERE category IS NULL OR category = '' OR TRIM(category) = '';

-- Final verification
SELECT 'Complete Categorized Inventory:' AS '';
SELECT 
    i.id,
    i.name,
    i.category,
    i.quantity,
    i.unit,
    i.location,
    li.display_name as category_display_name
FROM inventory i
LEFT JOIN lookup_items li_lookup ON li_lookup.value = i.category
LEFT JOIN lookup_categories lc ON lc.id = li_lookup.category_id AND lc.name = 'inventory_categories'
LEFT JOIN lookup_items li ON li.id = li_lookup.id
WHERE i.category IS NOT NULL AND i.category != ''
ORDER BY i.category, i.name;
