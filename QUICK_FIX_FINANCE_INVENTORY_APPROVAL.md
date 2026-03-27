# Quick Fix Guide: Finance Role Inventory Approval Access

## Problem
Finance users can't see the "Request Approvals" menu in Inventory.

## Solution (3 Steps)

### Step 1: Run Database Fix (1 minute)
```bash
cd database
FIX_FINANCE_INVENTORY_APPROVAL_PERMISSION.bat
```
**OR** manually run this SQL query:
```sql
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, 2)  -- Give Finance role inventory_view permission
ON DUPLICATE KEY UPDATE permission_id = permission_id;
```

### Step 2: Restart Frontend (if running)
Stop the frontend server and restart it to load the updated code.

### Step 3: Test
1. Login as finance user
2. Go to Inventory tab
3. Click "Request Approvals" submenu
4. Approve/reject requests

## What Changed?
- ✅ Frontend now checks for **finance role** OR `inventory_manage` permission
- ✅ Finance users can approve inventory requests without needing `inventory_manage` permission
- ✅ Database gives finance users `inventory_view` permission to see the Inventory tab
- ✅ **Fixed StandardUserLayout.js** - Added "Request Approvals" submenu item and route

## Files Modified
1. `src/StandardUser.js` - Menu logic (Admin view)
2. `src/layouts/StandardUserLayout.js` - **PRIMARY FIX** - Menu logic, import, and route
3. `src/components/InventoryRequestApproval.js` - Permission check
4. `database/fix_finance_inventory_approval_permission.sql` - SQL fix

## Verification Query
```sql
SELECT p.name 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2  -- Finance role
ORDER BY p.id;
```
Should show `inventory_view` in the list.

---
**Status:** ✅ FIXED  
**Time to fix:** < 5 minutes
