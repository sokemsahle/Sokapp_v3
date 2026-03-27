# 🔧 Child Profile Not Working - Quick Fixes

## ⚡ MOST COMMON ISSUES & SOLUTIONS

---

## ❌ Issue 1: "Child Profiles" menu not showing in sidebar

### **Cause:** User doesn't have `child_view` permission

### **Solution:**
Run this SQL in phpMyAdmin:

```sql
USE sokapptest;

-- Give ALL roles (except Standard) the child_view permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Also give Standard users access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Standard' AND p.name = 'child_view'
ON DUPLICATE KEY UPDATE role_id = role_id;
```

**Then:** Refresh browser → Logout → Login again

---

## ❌ Issue 2: Click "Child Profiles" but page is blank/error

### **Cause:** Database tables don't exist

### **Solution:**
Run the complete SQL fix script:

1. Open phpMyAdmin
2. Select `sokapptest` database
3. Go to "SQL" tab
4. Copy and paste content from: `database/fix_child_profile.sql`
5. Click "Go"

This will:
- ✅ Create all missing tables
- ✅ Add permissions
- ✅ Assign to all roles
- ✅ Add sample data for testing

---

## ❌ Issue 3: "Failed to load children" error

### **Cause:** Backend API failing or JWT token issue

### **Check:**
1. Open Browser Console (F12)
2. Look for errors in Console tab
3. Check Network tab for failed API calls

### **Common fixes:**

**A. Backend not running**
```bash
cd Backend
node server.js
```

**B. Wrong API URL**
Check `.env` file has:
```
REACT_APP_API_URL=http://localhost:5000
```

**C. Token expired**
- Logout
- Clear browser cache (Ctrl+Shift+Delete)
- Login again

---

## ❌ Issue 4: "You do not have permission" message

### **Cause:** Permission check failing

### **Solution:**
Run this to verify your user's permissions:

```sql
USE sokapptest;

-- Replace with YOUR email
SELECT u.email, u.full_name, r.name as role_name, p.name as permission_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'your-email@example.com'
AND p.category = 'Children';
```

If no results → Run the fix SQL above

---

## ❌ Issue 5: Tables exist but empty

### **Cause:** No children in database yet

### **Solution:**
Add test data:

```sql
USE sokapptest;

INSERT INTO children (first_name, last_name, gender, date_of_birth, estimated_age, date_of_admission, current_status)
VALUES 
('John', 'Doe', 'Male', '2015-05-15', 10, '2024-01-15', 'Active'),
('Jane', 'Smith', 'Female', '2016-08-20', 9, '2024-02-01', 'Active');
```

Then click "Child Profiles" → You should see the list!

---

## 🎯 COMPLETE FIX - ALL-IN-ONE SCRIPT

For fastest results, run this ONE script:

### **Steps:**
1. Open `database/fix_child_profile.sql`
2. Copy ALL content
3. Paste in phpMyAdmin SQL tab
4. Click "Go"
5. Restart backend: `node server.js`
6. Refresh browser
7. Logout and login again

---

## 📊 VERIFICATION CHECKLIST

After running fixes, verify:

- [ ] Can see "Child Profiles" in sidebar
- [ ] Click it → See list of children (or "No children found")
- [ ] "Add New Child" button visible (if you have create permission)
- [ ] Click a child → See details with tabs
- [ ] Can switch between tabs (Guardians, Legal, Medical, etc.)
- [ ] Can add new entries in each tab

---

## 🔍 DEBUGGING STEPS

If still not working:

### **Step 1: Check Database**
```sql
-- Verify tables exist
SHOW TABLES LIKE 'child%';

-- Verify permissions exist
SELECT * FROM permissions WHERE category = 'Children';

-- Verify your user has permissions
SELECT u.email, r.name as role, COUNT(p.id) as child_perms
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'YOUR_EMAIL' AND p.category = 'Children'
GROUP BY u.id, r.id;
```

### **Step 2: Check Backend**
Look at terminal where backend is running:
- Any error messages?
- Does it show "Server running on http://localhost:5000"?

### **Step 3: Check Frontend**
Open browser DevTools (F12):
- Console tab → Any red errors?
- Network tab → Check `/api/children` request
  - Status code? (Should be 200)
  - Response data?

### **Step 4: Test API Directly**
In browser address bar:
```
http://localhost:5000/api/children
```
Should return JSON (might error without token, that's OK)

---

## 💡 QUICK TIPS

1. **Always logout/login after database changes**
   - Permissions are loaded on login

2. **Clear browser cache if issues persist**
   - Ctrl+Shift+Delete → Clear cached images

3. **Check you're logged in as admin**
   - Admin has all permissions by default

4. **Restart both backend AND frontend**
   - Stop both servers
   - Start backend: `node server.js`
   - Start frontend: `npm start`

---

## 🆘 STILL NOT WORKING?

### **Nuclear Option - Complete Reset:**

```sql
-- WARNING: This deletes EVERYTHING!
USE sokapptest;

-- Drop all child tables
DROP TABLE IF EXISTS child_case_history;
DROP TABLE IF EXISTS child_education_records;
DROP TABLE IF EXISTS child_medical_records;
DROP TABLE IF EXISTS child_legal_documents;
DROP TABLE IF EXISTS child_guardian_information;
DROP TABLE IF EXISTS children;

-- Delete child permissions
DELETE FROM role_permissions WHERE permission_id IN (
    SELECT id FROM permissions WHERE category = 'Children'
);
DELETE FROM permissions WHERE category = 'Children';

-- Now run the full setup script again
```

Then run `database/child_setup_phpmyadmin.sql` from scratch.

---

## ✅ SUCCESS INDICATORS

You'll know it's working when:
- ✅ Sidebar shows "Child Profiles"
- ✅ List page loads (even if empty)
- ✅ Can click "Add New Child"
- ✅ Form opens without errors
- ✅ Can submit form successfully
- ✅ Child appears in list after creation

---

**Need more help?** Check the browser console and backend terminal for specific error messages!
