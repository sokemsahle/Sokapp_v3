# 🔧 Fix: Notification Count Shows Zero Even With Notifications

## Problem

The notification badge shows **0** even when there are notifications in the database.

---

## Root Cause

The backend (`Backend/server.js` lines 1038-1042) checks if users have **requisition roles** assigned:

```javascript
// If user has no requisition roles, return empty array
if (userRoles.length === 0) {
    console.log('User has no requisition roles - returning empty array');
    return res.status(200).json({ success: true, requisitions: [] });
}
```

**What this means:**
- Your user account must have a role: `reviewer`, `approver`, or `authorizer`
- These roles are stored in the `requisition_roles` table
- Without these roles → API returns 0 notifications

---

## Solution Options

### ✅ Option 1: Assign Yourself Requisition Roles (Recommended)

Run this SQL in phpMyAdmin:

```sql
-- Step 1: Find your user ID
SELECT id, email, full_name FROM users WHERE is_active = TRUE ORDER BY id DESC LIMIT 5;

-- Step 2: Replace YOUR_USER_ID with your actual ID from step 1
-- Example: If your ID is 1, change to: VALUES (1, 'reviewer', TRUE);
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (YOUR_USER_ID, 'reviewer', TRUE);

-- Optional: Give yourself all roles for testing
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES 
    (YOUR_USER_ID, 'reviewer', TRUE),
    (YOUR_USER_ID, 'approver', TRUE),
    (YOUR_USER_ID, 'authorizer', TRUE);
```

**Quick Fix Script:**
I've created `database/FIX_NOTIFICATION_COUNT_ZERO.sql` - run this in phpMyAdmin!

---

### ⚠️ Option 2: Modify Backend Code (Skip Role Check)

If you want **all users** to see notifications without needing specific roles:

**File:** `Backend/server.js`  
**Lines:** 1038-1042

**Change this:**
```javascript
// If user has no requisition roles, return empty array
if (userRoles.length === 0) {
    console.log('User has no requisition roles - returning empty array');
    return res.status(200).json({ success: true, requisitions: [] });
}
```

**To this:**
```javascript
// If user has no requisition roles, show requisitions that need attention
// Commented out to allow all users to see notifications
/*
if (userRoles.length === 0) {
    console.log('User has no requisition roles - returning empty array');
    return res.status(200).json({ success: true, requisitions: [] });
}
*/
```

Then **restart your backend server**.

---

## How to Test

### Test 1: Check Current Setup
1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh page
4. Look for logs like:
   ```
   GET /api/requisitions/unsigned - Params: { unseen: true, user_id: 1 }
   User requisition roles: []
   User has no requisition roles - returning empty array
   ```
5. If you see "returning empty array" → You need to add roles!

### Test 2: After Adding Roles
1. Run the SQL INSERT statement
2. Refresh your app
3. Bell icon should now show the correct count ✅

### Test 3: Verify in Database
```sql
-- Check your roles
SELECT rr.role_type, rr.is_active, u.email, u.full_name
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE u.id = YOUR_USER_ID;

-- Should show: reviewer, approver, authorizer (all active)
```

---

## Expected Results

### Before Fix:
```
Login → Bell shows: 0 (or no badge)
Console: "User has no requisition roles - returning empty array"
Database: Has requisitions waiting for review
```

### After Fix:
```
Login → Bell shows: 3 (example count)
Console: "Found 3 unseen requisitions for user roles"
Click bell → See list of notifications ✅
```

---

## Which Option Should I Choose?

### Choose Option 1 (Add Roles) If:
- ✅ You want proper role-based access control
- ✅ Multiple users with different responsibilities
- ✅ Production environment with real workflow
- ✅ Want to track who can review/approve/authorize

### Choose Option 2 (Remove Role Check) If:
- ✅ Testing/development environment
- ✅ Single user system
- ✅ Want all users to see all requisitions
- ✅ Don't need role-based restrictions

---

## Troubleshooting

### Still showing 0 after adding roles?

**Check:**
1. Is your user `is_active = TRUE`?
   ```sql
   UPDATE users SET is_active = TRUE WHERE id = YOUR_USER_ID;
   ```

2. Is the role `is_active = TRUE`?
   ```sql
   UPDATE requisition_roles SET is_active = TRUE WHERE user_id = YOUR_USER_ID;
   ```

3. Are there actually requisitions to review?
   ```sql
   SELECT id, requestor_name, purpose, 
          CASE 
              WHEN signature_data IS NOT NULL AND reviewed_signature IS NULL THEN 'Needs Review'
              WHEN reviewed_signature IS NOT NULL AND approved_signature IS NULL THEN 'Needs Approval'
              WHEN approved_signature IS NOT NULL AND authorized_signature IS NULL THEN 'Needs Authorization'
              ELSE 'Other'
          END as status
   FROM requisitions
   ORDER BY created_at DESC;
   ```

### Console still says "no requisition roles"?

1. Check if INSERT succeeded:
   ```sql
   SELECT * FROM requisition_roles WHERE user_id = YOUR_USER_ID;
   ```

2. Clear browser cache and refresh

3. Restart backend server:
   ```bash
   cd Backend
   npm start
   ```

---

## Related Files

- **SQL Fix Script:** `database/FIX_NOTIFICATION_COUNT_ZERO.sql`
- **Backend Code:** `Backend/server.js` (lines 1038-1042)
- **Frontend Layouts:** 
  - `src/layouts/AdminLayout.js` (lines 98-136)
  - `src/layouts/StandardUserLayout.js` (lines 196-207)

---

## Quick Reference

### Common User IDs:
- First admin user: Usually ID = 1
- Check yours: `SELECT id, email FROM users ORDER BY id LIMIT 5;`

### Role Types:
- `reviewer` - Reviews requisitions (first step)
- `approver` - Approves requisitions (second step)
- `authorizer` - Authorizes requisitions (final step)

### SQL Quick Fix:
```sql
-- For user ID 1 (most common):
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'reviewer', TRUE), (1, 'approver', TRUE), (1, 'authorizer', TRUE);
```

---

**Fix Date:** March 24, 2026  
**Status:** Ready to Apply  
**Estimated Time:** 2 minutes  
**Difficulty:** Easy
