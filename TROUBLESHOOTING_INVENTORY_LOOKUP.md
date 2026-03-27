# Troubleshooting: Inventory Categories Not Showing in Application

## Problem
You added inventory categories to the database, but they're not appearing in the Lookup Editor or Inventory form.

---

## Quick Fix Steps

### Step 1: Verify Database Data ✅

Open phpMyAdmin and run:

```sql
-- Check if category exists
SELECT id, name, display_name 
FROM lookup_categories 
WHERE name = 'inventory_categories';
```

**Expected Result:** Should return 1 row

If **NO rows returned**, the category wasn't added. Run this:
```sql
INSERT INTO `lookup_categories` (`name`, `display_name`, `description`, `is_active`) 
VALUES ('inventory_categories', 'Inventory Categories', 'Manage inventory item categories', 1);
```

### Step 2: Check Items Exist ✅

```sql
-- Check if items were added
SELECT li.value, li.display_order, li.is_active
FROM lookup_items li
INNER JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories'
ORDER BY li.display_order;
```

**Expected Result:** Should return 19 rows (all categories)

If **0 rows**, run the migration file again:
```sql
source "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database\add_inventory_categories_to_lookup.sql";
```

### Step 3: Test API Endpoint ✅

Run this in your browser or Postman:
```
http://localhost:5000/api/lookup
```

**Expected JSON Response:**
```json
{
  "success": true,
  "departments": [...],
  "positions": [...],
  "employeeStatuses": [...],
  "inventoryCategories": [
    "Food & Nutrition",
    "Hygiene",
    "Education",
    ...
  ]
}
```

If `inventoryCategories` is **missing or empty**, the backend isn't reading the data correctly.

### Step 4: Restart Backend Server ⚠️

**This is usually the problem!** The backend needs to be restarted to pick up new data.

```bash
# Stop the current backend (Ctrl+C)
# Then restart it:
cd Backend
npm start
```

Wait for the server to fully restart, then refresh your frontend application.

### Step 5: Clear Browser Cache 🌐

Sometimes the browser caches old data:

1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the application (`F5`)

OR use hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

---

## Common Issues & Solutions

### Issue 1: Categories Added But Not Showing

**Symptoms:** SQL shows data, but app doesn't display it

**Solution:**
1. ✅ Restart backend server (most common fix)
2. ✅ Clear browser cache
3. ✅ Check browser console for errors (F12)

### Issue 2: API Returns Empty Array

**Symptoms:** `inventoryCategories: []` in API response

**Check:**
```sql
-- Verify items are active
SELECT * FROM lookup_items li
JOIN lookup_categories lc ON li.category_id = lc.id
WHERE lc.name = 'inventory_categories' AND li.is_active = 0;
```

If any results, activate them:
```sql
UPDATE lookup_items li
JOIN lookup_categories lc ON li.category_id = lc.id
SET li.is_active = 1
WHERE lc.name = 'inventory_categories';
```

### Issue 3: Wrong Category Name

**Symptoms:** Data exists but API can't find it

**Check exact spelling:**
```sql
SELECT name FROM lookup_categories 
WHERE name LIKE '%inventory%';
```

Should return exactly: `inventory_categories`

If it's different (e.g., `inventory_category`), you need to fix it:
```sql
UPDATE lookup_categories 
SET name = 'inventory_categories' 
WHERE name LIKE '%inventory%';
```

### Issue 4: Database Connection Issue

**Symptoms:** API endpoint returns error or timeout

**Check:**
1. ✅ Backend server is running
2. ✅ Database server (MariaDB) is running
3. ✅ Backend `.env` file has correct database credentials
4. ✅ Check backend logs for database connection errors

### Issue 5: Frontend Not Calling API

**Symptoms:** Network tab shows no request to `/api/lookup`

**Check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for request to `http://localhost:5000/api/lookup`
5. If missing, check if LookupEditor component is loading

---

## Complete Diagnostic Script

Run this comprehensive check in phpMyAdmin:

```sql
source "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database\TROUBLESHOOT_INVENTORY_CATEGORIES.sql";
```

This will:
- Check if category exists
- Verify items are present
- Test the API query
- Identify common issues
- Provide fix commands

---

## Verification Checklist

After following steps above, verify:

- [ ] Database has `inventory_categories` in `lookup_categories` table
- [ ] Database has 19 items in `lookup_items` linked to `inventory_categories`
- [ ] All items have `is_active = 1`
- [ ] Backend server was restarted after adding data
- [ ] Browser cache was cleared
- [ ] API endpoint `http://localhost:5000/api/lookup` returns `inventoryCategories` array
- [ ] No console errors in browser (F12 → Console tab)
- [ ] Lookup Editor shows "Inventory Categories" tab
- [ ] Inventory form dropdown shows all categories

---

## Still Not Working?

### Check Backend Logs

Look at `Backend/backend.log` or terminal output for errors like:
- Database connection failed
- Query errors
- API route not found

### Test API Manually

Using curl or Postman:
```bash
curl http://localhost:5000/api/lookup
```

Should return JSON with `inventoryCategories` array.

### Check Frontend Code

Verify `src/components/LookupEditor/LookupEditor.js` has:
```javascript
inventoryCategories: []  // In state initialization
inventoryCategories: result.inventoryCategories || []  // In fetch
```

### Database Permissions

Ensure database user has SELECT permissions:
```sql
SHOW GRANTS FOR CURRENT_USER();
```

---

## Success Indicators

✅ When everything works:
- Lookup Editor shows "Inventory Categories" tab
- Tab displays 19 categories
- Can add/delete categories (admin only)
- Inventory form dropdown shows all categories
- Filter dropdown in inventory list shows categories

---

## Quick Contact Checklist

If still stuck, provide this info when asking for help:

1. **Database Check Results:**
   - How many rows in `lookup_categories` for 'inventory_categories'?
   - How many rows in `lookup_items` for inventory categories?

2. **API Test Results:**
   - Screenshot of `http://localhost:5000/api/lookup` response
   - Any error messages from backend

3. **Frontend Check:**
   - Browser console errors (screenshot)
   - Network tab - is API being called?

4. **Server Status:**
   - Is backend running? (any errors in terminal?)
   - Is database running? (can access phpMyAdmin?)

---

**Last Updated:** March 23, 2026  
**Files Created:**
- `database/TROUBLESHOOT_INVENTORY_CATEGORIES.sql`
- `database/add_inventory_categories_to_lookup.sql`
