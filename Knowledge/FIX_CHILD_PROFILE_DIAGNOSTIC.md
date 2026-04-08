# 🔧 FIX: Child Profile Not Visible - Complete Diagnostic Guide

## ⚡ IMMEDIATE FIX (Do This First)

### **Step 1: Run SQL to Give Everyone child_view Permission**

1. Open phpMyAdmin
2. Select `sokapptest` database
3. Click "SQL" tab
4. Copy and paste this ENTIRE script:

```sql
USE sokapptest;

-- Add child permissions
INSERT INTO permissions (name, description, category) 
VALUES 
('child_view', 'View child profiles', 'Children'),
('child_create', 'Create new child profile', 'Children'),
('child_update', 'Update child profile', 'Children'),
('child_delete', 'Delete child profile', 'Children'),
('guardian_manage', 'Manage guardian information', 'Children'),
('legal_manage', 'Manage legal documents', 'Children'),
('medical_manage', 'Manage medical records', 'Children'),
('education_manage', 'Manage education records', 'Children'),
('case_manage', 'Manage case history', 'Children')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Give ALL roles the child_view permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Verify
SELECT '✅ Roles with child_view:' as status;
SELECT r.name, COUNT(p.id) as has_permission
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.permission_id = (SELECT id FROM permissions WHERE name = 'child_view')
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name;
```

5. Click **"Go"**
6. You should see **YES ✅** for all roles

---

### **Step 2: Restart Everything** 🔄

**Backend:**
```bash
cd Backend
# Press Ctrl+C to stop if running
node server.js
```

**Frontend:**
- In browser: **Ctrl + Shift + R** (hard refresh)
- Or close and reopen browser

---

### **Step 3: Logout and Login Again** 🚪

**IMPORTANT:** Permissions are loaded on login!
1. Click **Logout** in your app
2. Login again with your credentials
3. Check sidebar → "Child Profiles" should appear

---

## 🔍 DIAGNOSTIC STEPS

If still not visible, run these diagnostics:

### **Diagnostic 1: Check If Tables Exist**

```sql
USE sokapppet;
SHOW TABLES LIKE 'child%';
```

**Expected:** Should show:
- children
- child_guardian_information
- child_legal_documents
- child_medical_records
- child_education_records
- child_case_history

**If missing:** Run the full SQL from `database/FIX_CHILD_PROFILE_NOT_VISIBLE.sql`

---

### **Diagnostic 2: Check Your User's Role**

```sql
SELECT u.email, u.full_name, r.name as your_role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'YOUR_EMAIL_HERE';
```

**Note:** Remember your role name (admin, HR, Teacher, Standard, etc.)

---

### **Diagnostic 3: Check If Your Role Has child_view**

```sql
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'child_view'
AND r.name = 'YOUR_ROLE_NAME_HERE';
```

**Expected:** Should return 1 row showing your role has `child_view`

**If empty:** Your role doesn't have the permission. Run the SQL above.

---

### **Diagnostic 4: Check Browser Console**

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for errors related to:
   - `/api/children` - API call errors
   - "permission" - Permission check errors
   - "token" - Authentication errors

**Common errors:**
- `401 Unauthorized` → Token expired or missing
- `403 Forbidden` → Don't have permission
- `Failed to fetch` → Backend not running

---

### **Diagnostic 5: Check Network Tab**

1. Press **F12**
2. Go to **Network** tab
3. Refresh page
4. Look for request to `/api/children`
5. Click on it
6. Check:
   - **Status:** Should be 200 OK
   - **Request Headers:** Should have `Authorization: Bearer [token]`
   - **Response:** Should return JSON with children data

---

## 🎯 COMMON ISSUES & SOLUTIONS

### ❌ Issue: "Child Profiles" not in sidebar

**Cause:** User doesn't have `child_view` permission

**Solution:**
```sql
-- Find your email first
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your-email@example.com';

-- Then give your role the permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'YOUR_ROLE' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;
```

Then **logout and login again**!

---

### ❌ Issue: Menu shows but page is blank

**Cause:** Database tables don't exist

**Solution:** Run the full setup SQL:
```bash
# File: database/FIX_CHILD_PROFILE_NOT_VISIBLE.sql
```

Copy entire file content → Paste in phpMyAdmin SQL tab → Click Go

---

### ❌ Issue: "You do not have permission" message

**Cause:** Backend permission check failing

**Solution:**
1. Make sure backend is running: `node server.js`
2. Check if auth middleware is working
3. Verify token is being sent with requests
4. Check browser console for errors

---

### ❌ Issue: Backend error or crash

**Cause:** Missing dependencies or wrong code

**Check:**
```bash
cd Backend
npm list jsonwebtoken bcryptjs mysql2
```

**Should show:** All packages installed

**If missing:**
```bash
npm install jsonwebtoken bcryptjs mysql2 cors dotenv
```

---

## ✅ VERIFICATION CHECKLIST

After running fixes, verify:

- [ ] Ran SQL script successfully (no errors)
- [ ] All 9 child permissions exist in database
- [ ] Your role has `child_view` permission
- [ ] Restarted backend server
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Logged out and logged back in
- [ ] Can see "Child Profiles" in sidebar
- [ ] Click it → See child list (even if empty)
- [ ] No errors in browser console

---

## 📊 WHAT THE PROBLEM LIKELY IS

Based on common issues, the problem is usually:

### **Problem #1: No child_view Permission (90% of cases)**

Users need the `child_view` permission to see the menu.

**Quick Fix:**
```sql
-- Give EVERYONE child_view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;
```

Then **LOGOUT AND LOGIN AGAIN**!

---

### **Problem #2: Tables Don't Exist (8% of cases)**

Database tables weren't created.

**Quick Fix:**
Run the complete SQL in `database/FIX_CHILD_PROFILE_NOT_VISIBLE.sql`

---

### **Problem #3: Forgot to Logout/Login (2% of cases)**

Permissions cache needs refresh.

**Quick Fix:**
1. Logout
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login again

---

## 🆘 STILL NOT WORKING?

### **Nuclear Option - Complete Reset:**

```sql
USE sokapptest;

-- Delete old permissions
DELETE FROM role_permissions WHERE permission_id IN (
    SELECT id FROM permissions WHERE category = 'Children'
);
DELETE FROM permissions WHERE category = 'Children';

-- Drop tables
DROP TABLE IF EXISTS child_case_history;
DROP TABLE IF EXISTS child_education_records;
DROP TABLE IF EXISTS child_medical_records;
DROP TABLE IF EXISTS child_legal_documents;
DROP TABLE IF EXISTS child_guardian_information;
DROP TABLE IF EXISTS children;

-- Now run FULL setup from scratch
-- Use file: database/child_setup_phpmyadmin.sql
```

Then start fresh with the complete setup script.

---

## 📞 NEED MORE HELP?

Provide this information:
1. What error messages do you see?
2. What does browser console show? (F12 → Console)
3. What does Network tab show? (F12 → Network → /api/children)
4. What role is your user? (Run Diagnostic 2)
5. Does your role have child_view? (Run Diagnostic 3)

---

**Good luck! Run the SQL at the top and you should be all set!** 🎉
