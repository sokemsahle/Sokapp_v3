# Fix Standard User Child Profile Access

## ✅ What Was Fixed

The **StandardUser** component was not checking permissions before showing the "Child Profiles" menu item. This meant that:

1. ❌ **Before**: All standard users saw "Child Profiles" in the sidebar, but got errors when clicking it if they didn't have permission
2. ✅ **After**: "Child Profiles" only appears for standard users who have the `child_view` permission in their role

## 🔧 Changes Made

### 1. Updated `src/StandardUser.js`

**Added permission checking function:**
```javascript
const hasPermission = (permission) => {
  if (!user) return false;
  if (user.is_admin === 1 || user.is_admin === true || user.is_admin === '1') {
    return true; // Admins have all permissions
  }
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  return false;
};
```

**Updated menu to check permissions:**
```javascript
// Show Child Profiles only if user has permission
if (hasPermission('child_view')) {
  items.push({ 
    icon: 'bx bx-user', 
    text: 'Child Profiles'
  });
}
```

**Added access denied message:**
- If a user without permission tries to access child profiles via URL, they'll see an "Access Denied" error page

## 📋 How to Grant Child Profile Access to Standard Users

### Option 1: Run the SQL Script (Recommended)

1. Open phpMyAdmin or your MySQL client
2. Select the `sokapptest` database
3. Run the script: `database/FIX_STANDARD_USER_CHILD_ACCESS.sql`

This will:
- Show you which users currently have/don't have access
- Grant `child_view` permission to ALL roles
- Verify the changes were successful

### Option 2: Grant Access Manually

If you want to give access to specific roles only:

```sql
-- Give HR role access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'HR' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Give Director role access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Director' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Give Teacher role access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Teacher' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Give Finance role access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Finance' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Give Standard role access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'Standard' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;
```

## 🧪 Testing the Fix

### Step 1: Apply Database Changes
Run the SQL script as described above

### Step 2: Refresh Permissions
1. Logout from the application
2. Login again with the standard user account
3. The permissions are loaded at login

### Step 3: Verify Access
1. Check if "Child Profiles" appears in the sidebar
2. Click on it - should show the child list (if you have permission)
3. Try creating/viewing/editing children based on your permissions

### Step 4: Check Console Logs
Open browser console (F12) and verify:
```javascript
console.log('User permissions:', currentUser?.permissions);
```
You should see `'child_view'` in the permissions array

## 🎯 Permission Levels

Different roles can have different levels of access:

| Permission | Description | Recommended Roles |
|------------|-------------|-------------------|
| `child_view` | View child profiles | All staff |
| `child_create` | Create new child profiles | Admin, HR |
| `child_update` | Edit child profiles | Admin, HR, Teachers |
| `child_delete` | Delete child profiles | Admin only |
| `guardian_manage` | Manage guardian info | Admin, HR |
| `legal_manage` | Manage legal documents | Admin, HR, Legal |
| `medical_manage` | Manage medical records | Admin, HR, Medical |
| `education_manage` | Manage education records | Admin, HR, Teachers |
| `case_manage` | Manage case history | Admin, HR, Social Workers |

## 🔍 Troubleshooting

### Issue: "Child Profiles" still not showing

**Solution:**
1. Verify you ran the SQL script successfully
2. Logout and login again (permissions load at login)
3. Check browser console for permission errors
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Menu shows but clicking gives error

**Solution:**
1. Check if the backend server is running
2. Verify the `children` table exists in the database
3. Check backend console for errors

### Issue: "You do not have permission" error

**Solution:**
1. Your user's role doesn't have `child_view` permission
2. Run the diagnostic query to check your permissions:
```sql
SELECT u.email, u.full_name, r.name as role,
       GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'your.email@example.com'
GROUP BY u.id, r.id;
```

## 📝 Summary

✅ **Frontend**: StandardUser.js now checks permissions before showing Child Profiles  
✅ **Backend**: ChildList.js already had permission checks  
✅ **Database**: SQL script grants `child_view` permission to roles  
✅ **Security**: Users without permission see "Access Denied" message  

Now standard users can access child profiles **based on their role permissions**, just like admins! 🎉
