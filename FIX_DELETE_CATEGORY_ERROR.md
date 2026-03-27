# Fix: "Failed to delete: Category not found" Error

## Problem
When trying to delete an inventory category from the Lookup Editor, you get the error:
```
Failed to delete: Category not found
```

## Root Cause
The frontend sends category names in **camelCase** format (e.g., `inventoryCategories`), but the database uses **snake_case** format (e.g., `inventory_categories`).

The backend wasn't mapping between these two formats, so it was looking for a category named `inventoryCategories` in the database, which doesn't exist.

## Solution Applied ✅

Updated `Backend/routes/lookup.routes.js` to map frontend category names to database names:

### Category Mapping
```javascript
const categoryMap = {
    'departments': 'departments',
    'positions': 'positions',
    'employeeStatuses': 'employee_statuses',
    'inventoryCategories': 'inventory_categories'
};
```

This mapping is now used in:
- ✅ **GET /api/lookup** - Fetching lookup data
- ✅ **POST /api/lookup/add** - Adding new items
- ✅ **DELETE /api/lookup/delete** - Deleting items

## What Was Fixed

### Before (❌ Not Working)
```javascript
// Frontend sends: category = 'inventoryCategories'
// Backend tries to find in database:
SELECT id FROM lookup_categories WHERE name = 'inventoryCategories';
// Result: 0 rows (category not found) ❌
```

### After (✅ Working)
```javascript
// Frontend sends: category = 'inventoryCategories'
// Backend maps to: dbCategoryName = 'inventory_categories'
// Backend queries database:
SELECT id FROM lookup_categories WHERE name = 'inventory_categories';
// Result: Found! (id = X) ✅
```

## Testing the Fix

### 1. Restart Backend Server
```bash
# Stop current server (Ctrl+C)
cd Backend
npm start
```

### 2. Test Delete Functionality
1. Go to **Lookup Editor** → **Inventory Categories** tab
2. Try deleting any category (e.g., "Other")
3. Should now work with message: "Item deleted successfully!"

### 3. Test Add Functionality
1. Go to **Lookup Editor** → **Inventory Categories** tab
2. Add a new category (e.g., "Automotive")
3. Should work with message: "Item added successfully!"

### 4. Verify in Database
```sql
-- Check all inventory categories
SELECT li.value, li.is_active, lc.display_name
FROM lookup_items li
JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories'
ORDER BY li.display_order;
```

## All Supported Categories

The mapping now works for all lookup categories:

| Frontend Name | Database Name | Display Name |
|--------------|---------------|--------------|
| `departments` | `departments` | Departments |
| `positions` | `positions` | Positions |
| `employeeStatuses` | `employee_statuses` | Employee Statuses |
| `inventoryCategories` | `inventory_categories` | Inventory Categories |

## Files Modified

- ✅ `Backend/routes/lookup.routes.js` - Added category mapping for POST and DELETE endpoints

## Additional Notes

This fix applies to **all** lookup list operations:
- Deleting departments
- Deleting positions
- Deleting employee statuses
- Deleting inventory categories
- Adding any of the above

All now correctly map between frontend and database naming conventions.

---

**Date:** March 23, 2026  
**Status:** ✅ Fixed  
**Action Required:** Restart backend server for changes to take effect
