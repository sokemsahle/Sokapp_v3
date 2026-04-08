# CRITICAL FIX: Request Approvals Menu Not Showing

## Problem Summary
Users with `inventory_manage` permission could NOT see the "Request Approvals" submenu in the Inventory menu, even though the code appeared to be correct.

## Root Cause
The application has **TWO** Standard User components:
1. `src/StandardUser.js` - Used in some contexts (Admin view switching)
2. `src/layouts/StandardUserLayout.js` - **PRIMARY component** used for standard user dashboard

The initial fix only updated `src/StandardUser.js`, but the **main component being used** (`src/layouts/StandardUserLayout.js`) was missing:
- The "Request Approvals" submenu item
- The import for `InventoryRequestApproval` component
- The route for `/inventory/approvals`

## Complete Solution

### File 1: `src/layouts/StandardUserLayout.js` ⭐ PRIMARY FIX

#### Change 1: Added Import (Line 13)
```javascript
import InventoryRequestApproval from '../components/InventoryRequestApproval';
```

#### Change 2: Updated Menu Logic (Lines 173-180)
```javascript
// BEFORE: Only Transaction Log
if (hasPermission('inventory_manage')) {
  inventorySubmenu.push({ text: 'Transaction Log', route: '/user/inventory/transactions' });
}

// AFTER: Both Transaction Log AND Request Approvals
const userRole = user?.role?.toLowerCase() || '';
const isFinanceUser = userRole === 'finance';

if (hasPermission('inventory_manage') || isFinanceUser) {
  inventorySubmenu.push({ text: 'Transaction Log', route: '/user/inventory/transactions' });
  inventorySubmenu.push({ text: 'Request Approvals', route: '/user/inventory/approvals' });
}
```

#### Change 3: Added Route (Line 443)
```javascript
<Route path="/inventory/approvals" element={<InventoryRequestApproval user={user} hasManagePermission={hasPermission('inventory_manage')} />} />
```

### File 2: `src/StandardUser.js` (Secondary/Legacy View)

Same changes as above but with different syntax (using activeItem instead of Routes).

### File 3: `src/components/InventoryRequestApproval.js`

Updated permission check to allow finance users:
```javascript
const userRole = user?.role?.toLowerCase() || '';
const isFinanceUser = userRole === 'finance';
const canManageRequests = hasManagePermission || isFinanceUser;

// Use canManageRequests instead of hasManagePermission
```

### File 4: Database Permission

Run this SQL to give finance users `inventory_view` permission:
```sql
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (2, 2)  -- Finance role gets inventory_view
ON DUPLICATE KEY UPDATE permission_id = permission_id;
```

Or use the batch file:
```bash
cd database
FIX_FINANCE_INVENTORY_APPROVAL_PERMISSION.bat
```

## Testing Steps

### Test 1: User with inventory_manage permission
1. Login as user with `inventory_manage` permission (e.g., Admin or Inventory Manager)
2. Navigate to Inventory tab
3. Click on Inventory in sidebar → Should expand submenu
4. Verify you see:
   - View Inventory ✅
   - Request Item ✅
   - **Request Approvals** ✅ (THIS WAS MISSING!)
   - Transaction Log ✅
5. Click "Request Approvals" → Should open approval page
6. Verify you can approve/reject requests

### Test 2: Finance user (without inventory_manage)
1. Login as finance user (role = "finance")
2. Ensure finance user has `inventory_view` permission (run SQL script if needed)
3. Navigate to Inventory tab
4. Click on Inventory in sidebar → Should expand submenu
5. Verify you see:
   - View Inventory ✅
   - Request Item ✅
   - **Request Approvals** ✅ (Finance role access!)
   - Transaction Log ✅ (Finance role access!)
6. Click "Request Approvals" → Should open approval page
7. Verify you can approve/reject requests

### Test 3: Standard user (no special permissions)
1. Login as standard user with only `inventory_view` permission
2. Navigate to Inventory tab
3. Click on Inventory in sidebar → Should expand submenu
4. Verify you see ONLY:
   - View Inventory ✅
   - Request Item ✅
5. Verify you do NOT see:
   - ❌ Transaction Log (correct - no permission)
   - ❌ Request Approvals (correct - no permission)

## Permission Matrix

| User Type | Has `inventory_view` | Has `inventory_manage` | Is Finance Role | Can See "Request Approvals"? |
|-----------|---------------------|------------------------|-----------------|------------------------------|
| **Admin** | ✅ Yes | ✅ Yes | ❌ No | ✅ **YES** |
| **Inventory Manager** | ✅ Yes | ✅ Yes | ❌ No | ✅ **YES** |
| **Finance User** | ✅ Yes | ❌ No | ✅ Yes | ✅ **YES** |
| **Standard User** | ✅ Yes | ❌ No | ❌ No | ❌ NO |

## Files Modified

1. ✅ `src/layouts/StandardUserLayout.js` - **CRITICAL FIX** (Primary component)
2. ✅ `src/StandardUser.js` - Secondary fix (Legacy/Admin switch view)
3. ✅ `src/components/InventoryRequestApproval.js` - Permission check update
4. ✅ `database/fix_finance_inventory_approval_permission.sql` - SQL script
5. ✅ `database/FIX_FINANCE_INVENTORY_APPROVAL_PERMISSION.bat` - Batch file

## Why This Happened

The application uses two different Standard User components:
- `StandardUserLayout.js` is the main layout component used by the router
- `StandardUser.js` is used when switching between Admin/Standard views

Both needed to be updated, but `StandardUserLayout.js` is the **primary** one that users interact with.

## Verification

After applying the fix, verify with these console checks:

1. **Check which component is rendering:**
   ```javascript
   // In browser console while on standard user view
   console.log(window.location.pathname);
   // Should show /user/inventory or /user/inventory/approvals
   ```

2. **Check user permissions:**
   ```javascript
   // In React component
   console.log('User role:', user.role);
   console.log('Has inventory_manage:', hasPermission('inventory_manage'));
   console.log('Is finance:', user.role?.toLowerCase() === 'finance');
   ```

3. **Check menu items:**
   ```javascript
   // In getMenuItems() function
   console.log('Inventory submenu:', inventorySubmenu);
   // Should include 'Request Approvals' if user has permission or is finance
   ```

## Related Documentation

- `FIX_FINANCE_INVENTORY_APPROVAL_ACCESS.md` - Full detailed guide
- `QUICK_FIX_FINANCE_INVENTORY_APPROVAL.md` - Quick reference
- `INVENTORY_REQUEST_WORKFLOW.md` - Complete workflow documentation

---

**Status:** ✅ FIXED  
**Priority:** HIGH (Critical functionality)  
**Date:** March 15, 2026  
**Affected Users:** Finance users, Inventory managers, Admins
