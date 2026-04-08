-- ============================================
-- UPDATE FIXED ASSET CATEGORIES
-- Organization Resource Management
-- ============================================
-- Updates asset categories using lookup_categories/lookup_items structure
-- Includes: Land/Buildings, Machinery, Vehicles, Furniture, 
-- Computer Hardware, Office Equipment, and more
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: ADD ASSET CATEGORIES LOOKUP CATEGORY
-- ============================================

-- Add the asset_categories category to lookup_categories
INSERT INTO `lookup_categories` (`name`, `display_name`, `description`, `is_active`) 
VALUES 
    ('asset_categories', 'Asset Categories', 'Manage fixed asset categories for organization resources', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================
-- STEP 2: ADD FIXED ASSET CATEGORIES TO LOOKUP ITEMS
-- ============================================

-- Get the category_id for asset_categories
SET @asset_category_id = (SELECT id FROM lookup_categories WHERE name = 'asset_categories');

-- Insert comprehensive fixed asset categories
INSERT INTO `lookup_items` (`category_id`, `value`, `display_order`, `is_active`) 
VALUES 
    -- Core Fixed Asset Categories (User Requested)
    (@asset_category_id, 'Land & Buildings', 1, 1),
    (@asset_category_id, 'Machinery', 2, 1),
    (@asset_category_id, 'Vehicles', 3, 1),
    (@asset_category_id, 'Furniture', 4, 1),
    (@asset_category_id, 'Computer Hardware', 5, 1),
    (@asset_category_id, 'Office Equipment', 6, 1),
    
    -- Additional Recommended Categories
    (@asset_category_id, 'IT Equipment', 7, 1),
    (@asset_category_id, 'Medical Equipment', 8, 1),
    (@asset_category_id, 'Kitchen Equipment', 9, 1),
    (@asset_category_id, 'Appliances', 10, 1),
    (@asset_category_id, 'Sports & Recreation Equipment', 11, 1),
    (@asset_category_id, 'Security Equipment', 12, 1),
    (@asset_category_id, 'Communication Equipment', 13, 1),
    (@asset_category_id, 'Industrial Equipment', 14, 1),
    (@asset_category_id, 'Laboratory Equipment', 15, 1),
    (@asset_category_id, 'Audio/Visual Equipment', 16, 1),
    (@asset_category_id, 'Construction Equipment', 17, 1),
    (@asset_category_id, 'Agricultural Equipment', 18, 1),
    (@asset_category_id, 'Transportation Equipment', 19, 1),
    (@asset_category_id, 'Library Books & Resources', 20, 1),
    (@asset_category_id, 'Art & Collectibles', 21, 1),
    (@asset_category_id, 'Leasehold Improvements', 22, 1),
    (@asset_category_id, 'Other', 99, 1)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- ============================================
-- STEP 3: VERIFY UPDATES
-- ============================================

SELECT 'Fixed Asset Categories Updated Successfully' as status;

-- Display all asset categories from the new structure
SELECT 
    lc.name as category_name,
    lc.display_name,
    li.value,
    li.display_order,
    li.is_active
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'asset_categories'
ORDER BY li.display_order ASC;

-- Count total categories
SELECT 
    COUNT(*) as total_asset_categories
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'asset_categories' AND li.is_active = 1;

-- ============================================
-- NOTES:
-- ============================================
-- Core Categories (as requested):
-- 1. Land & Buildings - Real estate, land, buildings, warehouses
-- 2. Machinery - Production machines, industrial equipment
-- 3. Vehicles - Cars, trucks, forklifts, company vehicles
-- 4. Furniture - Desks, chairs, tables, cabinets
-- 5. Computer Hardware - Servers, desktops, laptops, printers
-- 6. Office Equipment - Copiers, fax machines, calculators
--
-- Additional Categories Added:
-- - IT Equipment - Network devices, routers, switches
-- - Medical Equipment - Health-related equipment
-- - Kitchen Equipment - Refrigerators, microwaves, etc.
-- - Appliances - Various electrical appliances
-- - Sports & Recreation Equipment - Gym/sports facilities
-- - Security Equipment - Cameras, alarm systems
-- - Communication Equipment - Radios, phones, satellites
-- - Industrial Equipment - Heavy machinery, tools
-- - Laboratory Equipment - Scientific instruments
-- - Audio/Visual Equipment - Projectors, speakers, TVs
-- - Construction Equipment - Bulldozers, cranes, etc.
-- - Agricultural Equipment - Tractors, harvesters, etc.
-- - Transportation Equipment - Non-vehicle transport equipment
-- - Library Books & Resources - Books, digital resources
-- - Art & Collectibles - Valuable art pieces, antiques
-- - Leasehold Improvements - Building improvements
-- - Other - For uncategorized assets
-- ============================================
