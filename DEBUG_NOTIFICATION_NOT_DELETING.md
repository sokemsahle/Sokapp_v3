# 🔧 Debug: Notifications Not Deleting After Click

## Problem
When you click a notification and open it, it should disappear from the list. But it's still showing when you reopen the notification panel.

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Browser Console (MOST IMPORTANT)

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Clear console (trash icon)
4. Click bell icon
5. Click a notification
6. **Look for these logs:**

```
Notification clicked: 123
Token found: true
API Response status: 200
API Response: {success: true, message: "Notification marked as seen"}
✓ Notification marked as seen in database
Filtered requisitionNotifications: X
Filtered finalizedNotifications: X
✓ New notification count: X
✓ Removed from UI successfully
```

---

### Step 2: What Do You See?

#### ✅ If you see ALL the logs above:
The frontend is working! The issue is likely the **database refetch**.

**Next test:**
1. After clicking notification, **reopen bell icon**
2. Check console again
3. Does it show the notification reappearing?

If YES → The backend query might not be filtering correctly  
If NO → The state update isn't working

---

#### ❌ If you see errors:

**Error: "No authentication token found!"**
- You're not logged in properly
- **Fix:** Logout → Login again

**Error: "Failed to fetch" or Network Error**
- Backend server not running
- **Fix:** `cd Backend; npm start`

**Error: API returns 401 Unauthorized**
- Token expired or invalid
- **Fix:** Logout → Login again

**Error: API returns 500 Server Error**
- Database table might not exist
- **Fix:** Run SQL migration (see Step 4)

---

### Step 3: Test Database Directly

Run this in phpMyAdmin:

```sql
-- Check if table exists
SHOW TABLES LIKE 'user_notification_seen';
```

**Expected:** Should return 1 row with table name

**If NO rows returned:**
❌ Table doesn't exist!  
**Fix:** Run `database/add_notification_seen_tracking.sql`

---

### Step 4: Check If Data Is Being Saved

After clicking a notification:

```sql
-- See recent seen records
SELECT * FROM user_notification_seen 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:** Should show your recent clicks with `is_seen = TRUE`

**If empty or no new records:**
❌ Database INSERT is failing!

**Check backend logs:**
```bash
cd Backend
npm start
# Watch for POST /api/notifications/:id/seen requests
```

---

### Step 5: Manual Test

Force mark a notification as seen:

```sql
-- Replace 1 with your user_id, 123 with requisition ID
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 123, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();

-- Verify it worked
SELECT * FROM user_notification_seen 
WHERE user_id = 1 AND requisition_id = 123;
```

**Expected:** `is_seen = TRUE`, `seen_at` has timestamp

Now refresh the app and check notifications - that requisition should be GONE!

---

### Step 6: Check Backend Query

Run the exact query the backend uses:

```sql
-- This is what API returns for unseen notifications
SELECT 
    r.id,
    r.requestor_name,
    r.status,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'SEEN - Should NOT appear'
        WHEN uns.is_seen = FALSE THEN 'UNSEEN - Should appear'
        ELSE 'UNSEEN (no record) - Should appear'
    END as notification_status
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL 
     OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL 
     OR r.authorized_signature IS NULL)
ORDER BY r.created_at DESC;
```

**Expected:** Should NOT show requisition #123 (if you marked it as seen)

**If it still shows #123:**
❌ The LEFT JOIN condition is wrong OR data wasn't saved

---

## 🎯 Common Issues & Fixes

### Issue 1: Table Doesn't Exist

**Symptoms:**
- Console shows success but notification reappears
- SQL query in Step 3 returns nothing

**Fix:**
```bash
# In phpMyAdmin, run:
source database/add_notification_seen_tracking.sql
```

Or copy/paste this:
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

### Issue 2: Token Not Sent

**Symptoms:**
- Console shows "Token found: false"
- API returns 401

**Fix:**
1. Open browser DevTools
2. Go to Application tab
3. Check localStorage
4. Should have `token` key
5. If missing → Logout and login again

---

### Issue 3: Frontend State Not Updating

**Symptoms:**
- Console logs don't show "Filtered requisitionNotifications"
- Notification stays in list even temporarily

**Possible cause:**
- React state update issue
- Component not re-rendering

**Debug:**
Add more console logs in the filter functions (already added in latest version)

---

### Issue 4: Backend Refetch Shows Old Data

**Symptoms:**
- Notification disappears immediately after click ✅
- But reappears when you reopen bell ❌

**This means:**
1. Frontend removal works ✅
2. But database query on reopen shows it again ❌

**Check:**
```sql
-- Does the record exist?
SELECT * FROM user_notification_seen WHERE user_id = 1 AND requisition_id = 123;

-- Is is_seen actually TRUE?
SELECT is_seen FROM user_notification_seen WHERE user_id = 1 AND requisition_id = 123;
```

If `is_seen = FALSE` or record doesn't exist → API call failed!

---

### Issue 5: Wrong User ID Being Sent

**Symptoms:**
- Console shows API success
- Database has record but for different user_id

**Check:**
```sql
-- See all records for all users
SELECT uns.*, u.email 
FROM user_notification_seen uns
JOIN users u ON uns.user_id = u.id
ORDER BY uns.created_at DESC;
```

Make sure the `user_id` matches YOUR user ID!

---

## 📊 Expected Complete Flow

```
1. Click bell icon
   ↓
2. Frontend calls: GET /api/requisitions/unsigned?unseen=true&user_id=1
   ↓
3. Backend queries database, excludes seen notifications
   ↓
4. Displays 3 notifications (e.g., #123, #124, #125)
   ↓
5. User clicks #123
   ↓
6. Frontend calls: POST /api/notifications/123/seen
   ↓
7. Backend executes:
   INSERT INTO user_notification_seen (user_id=1, requisition_id=123, is_seen=TRUE, ...)
   ON DUPLICATE KEY UPDATE is_seen=TRUE
   ↓
8. Frontend removes #123 from arrays
   ↓
9. Notification count: 3 → 2
   ↓
10. Closes panel, navigates to requisition
    ↓
11. User reopens bell
    ↓
12. Frontend calls: GET /api/requisitions/unsigned?unseen=true&user_id=1
    ↓
13. Backend queries:
    SELECT ... LEFT JOIN user_notification_seen
    WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
    ↓
14. Database returns only #124 and #125 (not #123 because is_seen=TRUE)
    ↓
15. Frontend displays 2 notifications ✅
```

---

## 🧪 Quick Test Script

Run this complete sequence:

```sql
-- 1. Clean slate
TRUNCATE TABLE user_notification_seen;

-- 2. Check current notifications
SELECT COUNT(*) as unseen_count
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL OR r.authorized_signature IS NULL);

-- Note the count, then click one notification in the app

-- 3. After clicking, check again
SELECT COUNT(*) as unseen_count_after_click
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL OR r.authorized_signature IS NULL);

-- Count should decrease by 1!
```

---

## 📞 Report Back With:

After trying these steps, tell me:

1. **Browser console logs** - Copy/paste from F12 → Console
2. **Table exists?** - Result of `SHOW TABLES LIKE 'user_notification_seen'`
3. **Records being created?** - Result of `SELECT * FROM user_notification_seen LIMIT 5`
4. **Does notification disappear temporarily then reappear?** Or never disappear at all?

With this info, I can pinpoint the exact issue! 🎯

---

**Debug Guide Created:** March 16, 2026  
**Status:** Awaiting Your Results  
**Files Created:**
- `database/debug_notification_not_deleting.sql` - Diagnostic queries
- `DEBUG_NOTIFICATION_NOT_DELETING.md` - This guide
