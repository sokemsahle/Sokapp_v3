# Fixed Asset Categories - Lookup Integration

## Overview
This update integrates **Fixed Asset Categories** into the centralized lookup list management system, allowing administrators to dynamically manage asset categories through the Lookup Editor interface.

## Changes Made

### 1. Database Migration (`database/update_fixed_asset_categories.sql`)
- ✅ Creates `asset_categories` category in `lookup_categories` table
- ✅ Populates 23 comprehensive fixed asset categories in `lookup_items` table
- ✅ Uses proper `lookup_categories`/`lookup_items` structure (same as departments, positions, etc.)

### 2. Backend API (`Backend/routes/lookup.routes.js`)
- ✅ Updated `GET /api/lookup` endpoint to include `assetCategories`
- ✅ Updated `POST /api/lookup/add` endpoint with asset category mapping
- ✅ Updated `DELETE /api/lookup/delete` endpoint with asset category mapping
- ✅ Categories are fetched dynamically from the database

### 3. Frontend - Lookup Editor (`src/components/LookupEditor/LookupEditor.js`)
- ✅ Added "Asset Categories" tab in the sidebar
- ✅ Integrated asset categories into state management
- ✅ Added ability to add/delete categories (admin only)
- ✅ Updated UI descriptions and placeholders for asset categories

## Fixed Asset Categories List

### Core Categories (As Requested):
1. **Land & Buildings** - Real estate, land, office buildings, warehouses
2. **Machinery** - Production machines, industrial equipment
3. **Vehicles** - Cars, trucks, forklifts, company vehicles
4. **Furniture** - Desks, chairs, tables, cabinets, fixtures
5. **Computer Hardware** - Servers, desktops, laptops, printers
6. **Office Equipment** - Copiers, fax machines, calculators, scanners

### Additional Recommended Categories:
7. **IT Equipment** - Network devices, routers, switches, cables
8. **Medical Equipment** - Health-related medical devices
9. **Kitchen Equipment** - Refrigerators, microwaves, stoves
10. **Appliances** - Various electrical appliances
11. **Sports & Recreation Equipment** - Gym equipment, sports facilities
12. **Security Equipment** - Cameras, alarm systems, access control
13. **Communication Equipment** - Radios, phones, satellite equipment
14. **Industrial Equipment** - Heavy machinery, power tools
15. **Laboratory Equipment** - Scientific instruments, lab devices
16. **Audio/Visual Equipment** - Projectors, speakers, TVs, cameras
17. **Construction Equipment** - Bulldozers, cranes, excavators
18. **Agricultural Equipment** - Tractors, harvesters, farm machinery
19. **Transportation Equipment** - Non-vehicle transport equipment
20. **Library Books & Resources** - Books, digital resources
21. **Art & Collectibles** - Valuable art pieces, antiques
22. **Leasehold Improvements** - Building improvements, renovations
23. **Other** - For uncategorized assets

## Installation Instructions

### Step 1: Run the Database Migration
Open phpMyAdmin or your MySQL client and execute:

```bash
mysql -u root -p sokapptest < database/update_fixed_asset_categories.sql
```

**OR** copy and paste the contents of `database/update_fixed_asset_categories.sql` directly into phpMyAdmin's SQL tab.

### Step 2: Restart Backend Server
```bash
cd Backend
npm start
```

The server will automatically reload with the new asset categories endpoint.

### Step 3: Verify Integration
1. Navigate to **Lookup Editor** in the application
2. Click on **"Asset Categories"** tab (new icon: building with house)
3. You should see all 23 default categories listed
4. As an admin, you can:
   - Add new asset categories
   - Delete existing categories (if not in use)

### Step 4: Test in Fixed Assets Form
1. Go to **Organization** → **Resources** → **Fixed Assets**
2. Click **"Add New Asset"**
3. The Category dropdown should now be populated from the lookup list
4. Categories can be managed centrally via the Lookup Editor

## How It Works

### Database Structure
```
lookup_categories
├── id
├── name (e.g., 'asset_categories')
├── display_name (e.g., 'Asset Categories')
├── description
└── is_active

lookup_items
├── id
├── category_id (FK to lookup_categories)
├── value (e.g., 'Land & Buildings')
├── display_order
└── is_active
```

### API Response Structure
```json
{
  "success": true,
  "departments": ["HR", "Finance", "Operations"],
  "positions": ["Manager", "Supervisor", "Staff"],
  "employeeStatuses": ["Active", "Inactive", "Former Employee"],
  "inventoryCategories": ["Food & Nutrition", "Hygiene", ...],
  "assetCategories": [
    "Land & Buildings",
    "Machinery",
    "Vehicles",
    "Furniture",
    "Computer Hardware",
    "Office Equipment",
    "IT Equipment",
    ...
  ]
}
```

## Benefits

✅ **Centralized Management**: All asset categories managed in one place
✅ **Dynamic Updates**: No code changes needed to add/remove categories
✅ **Consistency**: Same pattern as departments, positions, and employee statuses
✅ **Admin Control**: Admins can customize categories without database access
✅ **Data Integrity**: Lookup items validated against usage before deletion
✅ **Comprehensive Coverage**: 23 categories covering all major asset types

## Verification Queries

Run these SQL queries to verify the installation:

```sql
-- Check if asset_categories category exists
SELECT id, name, display_name, is_active 
FROM lookup_categories 
WHERE name = 'asset_categories';

-- View all asset categories
SELECT li.value, li.display_order, li.is_active
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'asset_categories'
ORDER BY li.display_order;

-- Count total categories
SELECT COUNT(*) as total_categories
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'asset_categories' AND li.is_active = 1;
```

Expected result: **23 active categories**

## Troubleshooting

### Issue: Asset Categories tab not showing
**Solution:** Clear browser cache and restart the frontend application

### Issue: Categories empty in dropdown
**Solution:** 
1. Verify database migration ran successfully
2. Check backend logs for errors
3. Test API endpoint: `http://localhost:5000/api/lookup`

### Issue: Cannot add/delete categories
**Solution:** Ensure you're logged in as an admin user

## Files Modified

1. ✅ `database/update_fixed_asset_categories.sql` - Database migration
2. ✅ `Backend/routes/lookup.routes.js` - API endpoints
3. ✅ `src/components/LookupEditor/LookupEditor.js` - UI component

## Technical Notes

- The migration uses `ON DUPLICATE KEY UPDATE` to prevent errors if run multiple times
- Category names are case-sensitive in the database
- Deleted categories are checked for usage before removal (for departments)
- The same lookup structure is used across all organization resources

---

**Date:** April 1, 2026  
**Status:** ✅ Complete  
**Action Required:** Run database migration and restart backend server
