# FIX: Inventory Not Showing in Standard User Sidebar

## Problem Identified
The **Inventory tab was not showing** in the standard user sidebar because the Standard role (role_id = 6) in the database was missing the `inventory_view` permission.

### Root Cause
Analysis of the database (`sokapptest.sql`) revealed:
- **Standard role (role_id = 6)** only had ONE permission: `child_view` (permission_id = 24)
- Missing critical permissions:
  - `inventory_view` (permission_id = 2) ← **This is why Inventory tab doesn't show**
  - `dashboard_view` (permission_id = 1)
  - `settings_view` (permission_id = 11)
  - `requisition_create` (permission_id = 13)
  - `employee_view` (permission_id = 18)

## Solution

### Step 1: Run the Database Fix
Execute the SQL script to add missing permissions to the Standard role:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
FIX_STANDARD_USER_INVENTORY_PERMISSION.bat
```

Or manually run in MySQL/phpMyAdmin:
```sql
-- Add inventory_view permission to Standard users
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 2);

-- Add other missing permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 1);   -- dashboard_view
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 11);  -- settings_view
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 13);  -- requisition_create
INSERT INTO role_permissions (role_id, permission_id) VALUES (6, 18);  -- employee_view
```

### Step 2: Restart Backend Server
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
# Stop current server (Ctrl+C if running)
# Then restart
node server.js
```

### Step 3: Test the Fix
1. Open your browser and go to `http://localhost:3000`
2. Login as a standard user (e.g., sokem@sokapp.online)
3. Check the sidebar - **Inventory tab should now be visible**
4. Click on Inventory → Should expand submenu with:
   - View Inventory
   - Request Item

## Verification Queries

To verify the fix worked, run this SQL query:
```sql
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 6
ORDER BY p.id;
```

Expected result should show:
```
id | name                | description
---|---------------------|------------------
 1 | dashboard_view      | View Dashboard
 2 | inventory_view      | View Inventory
11 | settings_view       | View settings
13 | requisition_create  | Create requisitions
18 | employee_view       | View employees
24 | child_view          | View child profiles
```

## How Permissions Work

### Database Structure:
1. **permissions** table - Contains all available permissions
2. **roles** table - Contains user roles (Admin, Standard, Finance, etc.)
3. **role_permissions** table - Links roles to permissions (many-to-many)
4. **users** table - Users assigned to roles

### Permission Flow:
```
User → Role → Permissions
 ↓       ↓        ↓
John  → Standard → inventory_view, dashboard_view, etc.
```

### Frontend Permission Check:
```javascript
// In StandardUserLayout.js
const hasPermission = (permission) => {
  if (!user) return false;
  if (user.is_admin) return true; // Admin has all permissions
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  return false;
};

// Menu rendering
if (hasPermission('inventory_view')) {
  // Show Inventory menu item
}
```

## Files Created/Modified

### Created:
1. `database/fix_standard_user_inventory_permission.sql` - SQL fix script
2. `database/FIX_STANDARD_USER_INVENTORY_PERMISSION.bat` - Batch file to run fix
3. `FIX_STANDARD_USER_INVENTORY_PERMISSION.md` - This documentation

### Modified:
1. `src/layouts/StandardUserLayout.js` - Removed debug logging

## Additional Notes

### Why This Happened:
The backend code in `server.js` (line 1575) has fallback logic that assigns default permissions to standard users:
```javascript
permissions = ['dashboard_view', 'requisition_create', 'settings_view', 'employee_view', 'inventory_view'];
```

However, this fallback is ONLY used when the user's role has NO permissions assigned via the role_permissions table. Since the Standard role had one permission (child_view), the fallback wasn't triggered.

### Best Practice:
Always assign permissions through the `role_permissions` table rather than relying on hardcoded fallbacks in the backend. This ensures:
- Permissions are consistent across all users with the same role
- Changes can be made via database without code deployment
- Audit trail of what permissions each role has

## Troubleshooting

### If Inventory still doesn't show after applying fix:

1. **Check if SQL ran successfully:**
   ```sql
   SELECT * FROM role_permissions WHERE role_id = 6;
   ```
   Should show permission_id 2 (inventory_view)

2. **Restart backend server:**
   The backend caches permissions on login. A restart ensures fresh data.

3. **Logout and login again:**
   The user object with permissions is stored in localStorage. Logout clears it and forces a fresh login.

4. **Check browser console:**
   Look for any errors related to permissions or API calls.

5. **Verify user has Standard role:**
   ```sql
   SELECT u.email, r.name as role_name 
   FROM users u 
   JOIN roles r ON u.role_id = r.id 
   WHERE u.email = 'sokem@sokapp.online';
   ```

## Success Criteria
✅ Inventory tab appears in standard user sidebar  
✅ Clicking Inventory expands submenu  
✅ Can access `/user/inventory` route  
✅ Can view inventory items  
✅ Can request items  

---
**Status:** ✅ READY TO APPLY FIX  
**Date:** March 14, 2026  
**Affected Users:** All users with "Standard" role
