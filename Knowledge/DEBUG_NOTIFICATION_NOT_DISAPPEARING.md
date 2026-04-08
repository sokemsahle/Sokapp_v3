# 🔧 Debug: Notification Not Disappearing

## Problem
When clicking on a notification, it's still showing in the list when you return.

---

## ✅ Solution Implemented

I've added **detailed console logging** to help debug the issue.

---

## 🧪 How to Debug

### Step 1: Open Browser DevTools

1. Press `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Clear console (trash icon)

### Step 2: Test the Notification

1. Login to app
2. Click bell icon (🔔)
3. **Before clicking notification**, note what you see in console
4. Click a notification
5. **Watch the console output**

### Step 3: Check Console Logs

You should see:

```
Notification clicked: 123
Token found: true
API Response status: 200
API Response: {success: true, message: "Notification marked as seen"}
✓ Notification marked as seen in database
✓ Removed from UI, new count: 2
```

---

## 🔍 Possible Issues & Solutions

### Issue 1: No Token Found ❌

**Console shows:**
```
Token found: false
No authentication token found!
```

**Solution:**
- You're not logged in properly
- Token expired
- **Fix:** Logout and login again

---

### Issue 2: API Returns Error ❌

**Console shows:**
```
API Response status: 401
API Response: {success: false, message: "Invalid token"}
```

**Solution:**
- Token is invalid/expired
- **Fix:** Logout and login again

---

### Issue 3: Network Error ❌

**Console shows:**
```
❌ Error marking notification as seen: TypeError: Failed to fetch
```

**Solution:**
- Backend server not running
- Wrong API URL
- **Fix:** 
  - Check if backend is running on http://localhost:5000
  - Restart backend: `cd Backend; npm start`

---

### Issue 4: API Returns Success but Still Shows ❌

**Console shows:**
```
✓ Notification marked as seen in database
✓ Removed from UI, new count: 2
```

**But when you click bell again, it reappears!**

**This means:**
- Frontend removal works ✅
- But database update NOT persisting ❌

**Solution:**
Check if `user_notification_seen` table exists:

```sql
-- Run in phpMyAdmin
SHOW TABLES LIKE 'user_notification_seen';
```

If table doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS user_notification_seen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    requisition_id INT NOT NULL,
    is_seen BOOLEAN DEFAULT FALSE,
    seen_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_requisition (user_id, requisition_id),
    INDEX idx_user_seen (user_id, is_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Issue 5: Database Table Exists but Not Updating ❌

**Console shows success, but SQL shows `is_seen = FALSE`**

**Check what's in database:**

```sql
SELECT * FROM user_notification_seen 
WHERE requisition_id = 123 
ORDER BY seen_at DESC;
```

If you see:
- `is_seen = FALSE` → Update didn't work
- `is_seen = TRUE` → Update worked, but frontend refetch issue

**Solution if is_seen = FALSE:**
Backend might have wrong query. Check server.js line 70-74:

```javascript
await connection.execute(
  `INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
   VALUES (?, ?, TRUE, NOW())
   ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW()`,
  [userId, requisitionId]
);
```

---

### Issue 6: Refetch Shows Old Data ❌

**After clicking, notification disappears, but when you open bell again it's back!**

This means the list is being refetched from database, and database query is wrong.

**Test:**
Run this SQL manually in phpMyAdmin:

```sql
-- Replace 1 with your user_id
SELECT r.id, r.requestor_name
FROM requisitions r
LEFT JOIN user_notification_seen uns 
  ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL OR r.authorized_signature IS NULL)
ORDER BY r.created_at DESC;
```

**If this shows the requisition you already clicked:**
- The JOIN condition is wrong
- Or data wasn't saved properly

**Solution:**
Manually mark it as seen:

```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 123, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();
```

---

## 📋 Complete Diagnostic Checklist

Run through these steps:

- [ ] **Step 1:** Check console logs when clicking notification
- [ ] **Step 2:** Verify token exists (`localStorage.getItem('token')`)
- [ ] **Step 3:** Check API response status (should be 200)
- [ ] **Step 4:** Check API response includes `success: true`
- [ ] **Step 5:** Verify table exists in phpMyAdmin
- [ ] **Step 6:** Run SQL query to check if record was created
- [ ] **Step 7:** Manually verify `is_seen = TRUE` in database
- [ ] **Step 8:** Refresh page and check if notification still gone

---

## 🎯 Expected Behavior

When you click notification #123:

1. **Console logs appear** ✅
2. **API call succeeds** ✅
3. **Database record created/updated** ✅
4. **Notification removed from UI** ✅
5. **Close and reopen bell** → #123 still gone ✅
6. **Refresh page** → #123 still gone ✅

---

## 🔧 Quick Fix Commands

### If Table Doesn't Exist:
```sql
CREATE TABLE user_notification_seen (...);
```

### If Record Not Created:
```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (YOUR_USER_ID, REQUISITION_ID, TRUE, NOW());
```

### If Backend Not Running:
```bash
cd "Backend"
npm start
```

---

## 📞 What to Report Back

After debugging, tell me:

1. **What do console logs show?**
   - Token found: true/false?
   - API Response status: 200/401/500?
   - API Response: success true/false?

2. **Does database table exist?**
   - Run: `SHOW TABLES LIKE 'user_notification_seen';`

3. **What does database show for clicked notification?**
   - Run: `SELECT * FROM user_notification_seen WHERE requisition_id = 123;`
   - Is `is_seen` = TRUE or FALSE?

4. **Does notification disappear temporarily then reappear?**
   - Or does it never disappear at all?

With this info, I can pinpoint the exact issue! 🎯

---

**Debug Guide Created:** March 16, 2026  
**Status:** Awaiting Your Debug Results
