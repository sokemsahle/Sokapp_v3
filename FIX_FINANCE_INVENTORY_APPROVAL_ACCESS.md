# Fix: Finance Role Inventory Request Approval Access

## Problem
Users with the **Finance role** and **inventory management permission** were not able to see the "Request Approvals" menu item in the Inventory section of the sidebar.

## Root Cause
The frontend code was only checking for `inventory_manage` permission to show the "Request Approvals" submenu, but finance users need this access too even without the `inventory_manage` permission.

## Solution

### 1. Frontend Changes

#### File: `src/StandardUser.js` (Admin View - Legacy)

**Change 1:** Updated menu item logic to include finance users
```javascript
// Before (Line 296-300):
if (hasPermission('inventory_manage')) {
  inventorySubmenu.push({ text: 'Transaction Log', action: 'Inventory-Transactions', route: '/inventory/transactions' });
  inventorySubmenu.push({ text: 'Request Approvals', action: 'Inventory-Approvals', route: '/inventory/approvals' });
}

// After:
const userRole = user?.role?.toLowerCase() || '';
const isFinanceUser = userRole === 'finance';

if (hasPermission('inventory_manage') || isFinanceUser) {
  inventorySubmenu.push({ text: 'Transaction Log', action: 'Inventory-Transactions', route: '/inventory/transactions' });
  inventorySubmenu.push({ text: 'Request Approvals', action: 'Inventory-Approvals', route: '/inventory/approvals' });
}
```

**Change 2:** Updated route rendering to allow finance users
```javascript
// Before (Line 521):
{location.pathname === '/inventory/approvals' && hasPermission('inventory_manage') && (
  <InventoryRequestApproval user={user} hasManagePermission={true} />
)}

// After:
{location.pathname === '/inventory/approvals' && (hasPermission('inventory_manage') || user?.role?.toLowerCase() === 'finance') && (
  <InventoryRequestApproval user={user} hasManagePermission={hasPermission('inventory_manage')} />
)}
```

#### File: `src/layouts/StandardUserLayout.js` (Primary Standard User View) ⭐ CRITICAL FIX

**Change 1:** Added "Request Approvals" submenu item (Lines 173-180)
```javascript
// Before:
if (hasPermission('inventory_manage')) {
  inventorySubmenu.push({ text: 'Transaction Log', route: '/user/inventory/transactions' });
}

// After:
const userRole = user?.role?.toLowerCase() || '';
const isFinanceUser = userRole === 'finance';

if (hasPermission('inventory_manage') || isFinanceUser) {
  inventorySubmenu.push({ text: 'Transaction Log', route: '/user/inventory/transactions' });
  inventorySubmenu.push({ text: 'Request Approvals', route: '/user/inventory/approvals' });
}
```

**Change 2:** Added import for InventoryRequestApproval component (Line 13)
```javascript
import InventoryRequestApproval from '../components/InventoryRequestApproval';
```

**Change 3:** Added route for approval page (Line 443)
```javascript
<Route path="/inventory/approvals" element={<InventoryRequestApproval user={user} hasManagePermission={hasPermission('inventory_manage')} />} />
```

#### File: `src/components/InventoryRequestApproval.js`

**Change:** Added finance role check at component level
```javascript
// Added lines 18-20, 27-28:
const userRole = user?.role?.toLowerCase() || '';
const isFinanceUser = userRole === 'finance';
const canManageRequests = hasManagePermission || isFinanceUser;

useEffect(() => {
  if (canManageRequests) {  // Changed from hasManagePermission
    fetchPendingRequests();
    fetchAllRequests();
  }
}, [canManageRequests]);

// Line 183:
if (!canManageRequests) {  // Changed from hasManagePermission
  return (
    <div className="approval-page">
      <div className="permission-denied">
        <AlertTriangle size={48} className="icon-warning" />
        <h2>Access Denied</h2>
        <p>You don't have permission to manage inventory requests.</p>
      </div>
    </div>
  );
}
```

### 2. Database Changes

Run the SQL script to give finance users the `inventory_view` permission:

```sql
-- Add inventory_view permission to Finance role (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, 2)  -- Finance role gets inventory_view
ON DUPLICATE KEY UPDATE permission_id = permission_id;
```

**Quick Run:** Execute the batch file:
```
database\FIX_FINANCE_INVENTORY_APPROVAL_PERMISSION.bat
```

Or manually run the SQL file:
```
database\fix_finance_inventory_approval_permission.sql
```

## What Finance Users Can Now Do

After applying this fix, finance users will be able to:

1. ✅ **See the Inventory tab** in the sidebar (requires `inventory_view` permission)
2. ✅ **See "Request Approvals" submenu** under Inventory (checks for finance role OR inventory_manage permission)
3. ✅ **Access the approval page** to view all pending inventory requests
4. ✅ **Approve requests** (full or partial approval)
5. ✅ **Reject requests** with a reason
6. ✅ **View transaction log** (if needed for audit purposes)

## Permission Matrix

| Action | Standard User | Inventory Manager | Finance User | Admin |
|--------|--------------|-------------------|--------------|-------|
| View Inventory | ✅ (with inventory_view) | ✅ | ✅ (with inventory_view) | ✅ |
| Request Items | ✅ (with inventory_view) | ✅ | ✅ (with inventory_view) | ✅ |
| **Approve Requests** | ❌ | ✅ | ✅ (NEW!) | ✅ |
| **Reject Requests** | ❌ | ✅ | ✅ (NEW!) | ✅ |
| Manage Inventory | ❌ | ✅ | ❌ | ✅ |
| View Transaction Log | ❌ | ✅ | ✅ (NEW!) | ✅ |

## Testing Steps

### Step 1: Apply Database Fix
```bash
cd database
FIX_FINANCE_INVENTORY_APPROVAL_PERMISSION.bat
```

### Step 2: Verify Database Changes
Run this query to confirm finance role has inventory_view permission:
```sql
SELECT p.id, p.name, p.description 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 2
ORDER BY p.id;
```

Expected result should include:
```
id | name           | description
---|----------------|------------------
 1 | dashboard_view | View Dashboard
 2 | inventory_view | View Inventory  ← NEW!
... (other permissions)
```

### Step 3: Test Frontend
1. Open your browser and go to `http://localhost:3000`
2. Login as a finance user
3. Check the sidebar - **Inventory tab should now be visible**
4. Click on Inventory → Should expand submenu with:
   - View Inventory
   - Request Item
   - **Request Approvals** ✨ (NEW!)
   - Transaction Log (optional)
5. Click on "Request Approvals" → Should open the approval page
6. Verify you can see pending requests
7. Test approving/rejecting a request

## Files Modified

1. `src/StandardUser.js` - Menu logic and route rendering (Admin view)
2. `src/layouts/StandardUserLayout.js` - **PRIMARY FIX** - Menu logic, import, and route rendering
3. `src/components/InventoryRequestApproval.js` - Component permission check
4. `database/fix_finance_inventory_approval_permission.sql` - SQL script
5. `database/FIX_FINANCE_INVENTORY_APPROVAL_PERMISSION.bat` - Batch file

## Additional Notes

- Finance users do **NOT** need the `inventory_manage` permission to approve requests
- The frontend checks for the finance role specifically
- This is intentional because finance users need to approve inventory requests as part of their role
- If you want finance users to have full inventory management (add/edit/delete items), uncomment STEP 2 in the SQL script

## Troubleshooting

### Issue: Finance user still can't see "Request Approvals"
**Solution:** 
1. Verify the user's role is exactly "finance" (case-insensitive)
2. Check that `inventory_view` permission is assigned in the database
3. Clear browser cache and refresh
4. Check browser console for errors

### Issue: "Access Denied" on approval page
**Solution:**
1. Verify the user's role in the database: `SELECT * FROM users WHERE email = 'user@email.com'`
2. Check role_permissions: `SELECT * FROM role_permissions WHERE role_id = 2`
3. Ensure the SQL script was run successfully

### Issue: Can see menu but can't approve requests
**Solution:**
1. Check backend API permissions in `Backend/server.js`
2. Verify finance user is properly authenticated
3. Check browser network tab for API errors

## Related Documentation

- `INVENTORY_REQUEST_WORKFLOW.md` - Complete inventory request system guide
- `INVENTORY_APPROVAL_REJECTION_IMPLEMENTATION.md` - Approval/rejection feature details
- `QUICK_START_INVENTORY.md` - Quick start guide for inventory features

---

**Status:** ✅ FIXED  
**Last Updated:** March 15, 2026  
**Version:** 3
