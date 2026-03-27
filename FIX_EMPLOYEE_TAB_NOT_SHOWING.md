# FIX: Employee Tab Not Showing for HR Users

## 🐛 Problem Identified

HR users with `employee_view` and `employee_edit` permissions were **not seeing** the Employee tab in the sidebar.

## 🔍 Root Cause

The code was checking `user.role` instead of `user.role_name`:

```javascript
// ❌ WRONG - This always returns 'admin' or 'standard'
const userRole = user?.role?.toLowerCase() || '';

// ✅ CORRECT - This returns actual role name like 'HR', 'Finance', etc.
const userRole = user?.role_name?.toLowerCase() || '';
```

### Why This Happened

Looking at the backend login response (`Backend/server.js` line 1533):

```javascript
const user = {
    ...rows[0],
    role: rows[0].is_admin ? 'admin' : 'standard',      // Generic type
    role_name: rows[0].role_name || 'No Role',          // Actual role name
    permissions: permissions
};
```

- `user.role` = 'standard' (for all non-admin users)
- `user.role_name` = 'HR', 'Finance', 'Director', 'Teacher', etc.

## ✅ Solution Applied

### File Modified: `src/layouts/StandardUserLayout.js`

**Line 204 - Changed:**
```javascript
// BEFORE
const userRole = user?.role?.toLowerCase() || '';

// AFTER
const userRole = user?.role_name?.toLowerCase() || '';
```

## 🎯 How It Works Now

### For HR User Login:
```javascript
user = {
  role: 'standard',           // Generic type
  role_name: 'HR',            // ✅ Actual role checked here
  permissions: ['employee_view', 'employee_edit', ...]
}

// Check passes: 'hr' === 'hr' ✓
const isHRUser = user?.role_name?.toLowerCase() === 'hr';
```

### For Finance User Login:
```javascript
user = {
  role: 'standard',           // Generic type
  role_name: 'Finance',       // ✅ Different role
  permissions: [...]
}

// Check fails: 'finance' !== 'hr' ✗
const isHRUser = user?.role_name?.toLowerCase() === 'hr';
```

## 📋 Verification Steps

### 1. Check Your HR User Data
Run this SQL to verify your HR user setup:

```sql
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    GROUP_CONCAT(p.name SEPARATOR ', ') as permissions
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'HR'
GROUP BY u.id, r.id;
```

### 2. Verify Expected Permissions
HR role should have at minimum:
- ✅ `employee_view` - Required to see the tab
- ✅ `employee_edit` - Required to edit employees
- ✅ `employee_manage` - Optional, for full management

### 3. Test the Fix

#### Step 1: Clear Browser Cache
```
Ctrl + Shift + Delete → Clear cache
```

#### Step 2: Logout and Login Again
This ensures fresh user data is loaded from backend.

#### Step 3: Check Browser Console
Open DevTools (F12) and add temporary debug logs:

```javascript
// In getMenuItems() function around line 204
console.log('=== USER DEBUG INFO ===');
console.log('User object:', user);
console.log('user.role:', user?.role);
console.log('user.role_name:', user?.role_name);
console.log('user.permissions:', user?.permissions);
console.log('Is HR?:', user?.role_name?.toLowerCase() === 'hr');
console.log('Has employee_view?:', user?.permissions?.includes('employee_view'));
```

Expected output for HR user:
```
=== USER DEBUG INFO ===
user.role: "standard"
user.role_name: "HR"              ← This should be "HR"
user.permissions: ["employee_view", "employee_edit", ...]
Is HR?: true                      ← Should be true
Has employee_view?: true          ← Should be true
```

#### Step 4: Verify Sidebar
After login, you should see:
- ✅ Dashboard
- ✅ Inventory (if has inventory_view)
- ✅ Child Profiles (if has child_view)
- ✅ **Employees** ← NEW TAB FOR HR ONLY
- ✅ My Requisitions
- ✅ Settings
- ✅ Organization

## 🔐 Permission Matrix

| Role | role_name | employee_view | Sees Employees Tab? |
|------|-----------|---------------|---------------------|
| Admin | admin | ✅ (all perms) | ❌ Uses AdminLayout |
| HR | HR | ✅ | ✅ YES |
| Finance | Finance | ❌ | ❌ No |
| Director | Director | ❌ | ❌ No |
| Teacher | Teacher | ❌ | ❌ No |
| Standard | Standard | ❌ | ❌ No |

## 🛠️ Additional Fixes If Still Not Working

### Fix 1: Verify Database Permissions
```sql
-- Check HR role permissions
SELECT p.name 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'HR';

-- If employee_view is missing, add it:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'HR' AND p.name = 'employee_view'
ON DUPLICATE KEY UPDATE role_id = role_id;
```

### Fix 2: Clear Backend Permission Cache
The backend caches permissions for 5 minutes. Restart the backend:

```bash
# Stop backend (Ctrl+C)
# Then restart
npm start
```

Or use the batch file:
```
RESTART_BACKEND.bat
```

### Fix 3: Check User Role Assignment
```sql
-- Verify your specific user has HR role
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    ur.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
```

## 📝 Files Modified

1. **src/layouts/StandardUserLayout.js** (Line 204)
   - Changed `user?.role` to `user?.role_name`

2. **EMPLOYEE_SIDEBAR_HR_IMPLEMENTATION.md**
   - Updated documentation with correct property name
   - Added troubleshooting section

## ✨ Benefits of This Fix

- ✅ HR users now correctly see the Employee tab
- ✅ Other roles still cannot access employee management
- ✅ Maintains security through permission checks
- ✅ No database changes required
- ✅ Works with existing user structure

## 🎉 Expected Result

**HR User Login Experience:**
1. Login with HR credentials
2. Navigate to dashboard
3. See "Employees" tab in sidebar with group icon (bx-group)
4. Click on Employees tab
5. Access EmployeeManagement component
6. Can view, create, edit employees (based on permissions)

**Other User Login Experience:**
1. Login with Finance/Director/Teacher credentials
2. Navigate to dashboard
3. NO "Employees" tab visible
4. Cannot access `/user/employees` route directly

---

## 🔧 Quick Reference

### Before Fix:
```javascript
❌ const userRole = user?.role?.toLowerCase() || '';
// Always gets 'standard' for non-admin users
```

### After Fix:
```javascript
✅ const userRole = user?.role_name?.toLowerCase() || '';
// Gets actual role name: 'HR', 'Finance', 'Director', etc.
```

---

**Fix Applied**: March 15, 2026  
**Issue**: Employee tab not showing for HR users  
**Root Cause**: Wrong property checked (role vs role_name)  
**Solution**: Use user.role_name instead of user.role  
**Status**: ✅ FIXED
