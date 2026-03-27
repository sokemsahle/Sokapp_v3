# 🔧 Debug: Notification Not Disappearing After Click

## Do This RIGHT NOW (2 minutes)

### Step 1: Check Database Table Exists

**In phpMyAdmin:**

1. Select **sokapptest** database
2. Click **SQL** tab
3. Run this:

```sql
SHOW TABLES LIKE 'user_notification_seen';
```

**Expected:** Should return 1 row with table name

**If 0 rows returned:** ❌ **TABLE DOESN'T EXIST!** Create it immediately:

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

### Step 2: Test With Console Logs

**In your browser:**

1. Open DevTools (F12)
2. Go to **Console** tab
3. Clear console (trash icon)
4. Click bell icon (🔔)
5. Click any notification
6. **Watch the console output**

You should see:

```
=== NOTIFICATION CLICK DEBUG ===
Notification clicked: 85
Current user: {id: 1, email: "...", ...}
Current user ID: 1
Token found: false/true
Sending request to mark as seen...
Request body will be: {"user_id": 1}
API Response status: 200
API Response: {success: true, message: "Notification marked as seen"}
✓ Notification marked as seen in database
Filtered requisitionNotifications: 2 (was 3 )
Filtered finalizedNotifications: 0 (was 0 )
✓ New notification count: 2 (was 3 )
✓ Removed from UI successfully
=== END DEBUG ===
```

---

### Step 3: Check Backend Terminal

Your backend terminal should show:

```
POST /api/notifications/85/seen
Marking requisition 85 as seen for user 1
✓ Requisition 85 marked as seen for user 1
```

---

### Step 4: Verify Database Record

After clicking notification, run this in phpMyAdmin:

```sql
SELECT * FROM user_notification_seen 
WHERE user_id = 1 AND requisition_id = 85;
```

**Expected:** Shows record with `is_seen = TRUE` and `seen_at` timestamp

---

## 🐛 Common Issues & Fixes

### Issue 1: Console shows "No current user or no user ID!"

**Problem:** currentUser object is missing or has no ID

**Fix:**
1. Check if you're logged in
2. Check localStorage for user data
3. Logout and login again

---

### Issue 2: API Response status is not 200

**If 400 Bad Request:**
- Missing user_id in request
- Check console for "Request body will be:" log
- Should show `{"user_id": 1}` (or your actual ID)

**If 500 Internal Server Error:**
- Database table probably doesn't exist
- Go back to Step 1 and create the table!

---

### Issue 3: Frontend logs success but notification reappears

**This means:**
1. Frontend removal works ✅
2. But database INSERT failed ❌
3. Next time you load notifications, it refetches from database

**Check backend logs:**
- Should show: "✓ Requisition 85 marked as seen"
- If shows error → Database issue!

**Check database:**
```sql
SELECT * FROM user_notification_seen WHERE requisition_id = 85;
```
- If empty → INSERT failed
- If exists with is_seen=TRUE → Working correctly

---

### Issue 4: Notification disappears temporarily but comes back on reopen

**Symptoms:**
- Click notification → Disappears ✅
- Close bell panel
- Reopen bell → Notification is back ❌

**This means:**
- Frontend removal works ✅
- But database isn't persisting it ❌

**Most likely cause:** `user_notification_seen` table doesn't exist!

**Solution:** Go to Step 1 and CREATE THE TABLE!

---

## 📊 Expected Complete Flow

```
User clicks notification #85
    ↓
Console: "=== NOTIFICATION CLICK DEBUG ==="
Console: "Notification clicked: 85"
Console: "Current user ID: 1"
    ↓
Frontend sends POST:
  URL: /api/notifications/85/seen
  Body: {"user_id": 1}
    ↓
Backend receives request
Backend logs: "Marking requisition 85 as seen for user 1"
    ↓
Database executes:
  INSERT INTO user_notification_seen (user_id=1, requisition_id=85, is_seen=TRUE)
  ON DUPLICATE KEY UPDATE is_seen=TRUE
    ↓
Backend responds: {success: true}
Backend logs: "✓ Requisition 85 marked as seen"
    ↓
Frontend receives success
Console: "✓ Notification marked as seen in database"
    ↓
Frontend removes from arrays:
  setRequisitionNotifications([all except #85])
  setNotificationCount(2) // was 3
Console: "Filtered requisitionNotifications: 2 (was 3 )"
    ↓
UI updates - notification disappears ✨
Badge count decreases ✨
    ↓
User closes notification panel
    ↓
User reopens bell icon
    ↓
Frontend fetches: GET /api/requisitions/unsigned?unseen=true&user_id=1
    ↓
Backend queries database with LEFT JOIN on user_notification_seen
    ↓
Database returns only UNSEEN requisitions (not #85 because is_seen=TRUE)
    ↓
Frontend displays only unseen notifications
#85 is GONE! ✅
```

---

## 🎯 Quick Diagnostic Commands

### Database Check:
```sql
-- Does table exist?
SHOW TABLES LIKE 'user_notification_seen';

-- What's been marked as seen?
SELECT uns.*, r.requestor_name 
FROM user_notification_seen uns
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 1
ORDER BY uns.created_at DESC;

-- What should appear in notifications?
SELECT r.id, r.requestor_name
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (r.signature_data IS NULL OR r.reviewed_signature IS NULL 
     OR r.approved_signature IS NULL OR r.authorized_signature IS NULL);
```

### Browser Console Check:
Look for these specific logs:
- `=== NOTIFICATION CLICK DEBUG ===` (starting marker)
- `Current user ID: X` (should be a number, not undefined!)
- `API Response status: 200` (success!)
- `✓ Notification marked as seen in database` (database saved it)
- `Filtered requisitionNotifications: X (was Y)` (removed from UI)

### Backend Terminal Check:
Look for:
- `POST /api/notifications/:id/seen` (request received)
- `Marking requisition :id as seen for user :id` (processing)
- `✓ Requisition :id marked as seen for user :id` (success!)

---

## ✅ Success Indicators

You know it's working when ALL of these are true:

✅ **Console shows complete debug logs** (from === to ===)  
✅ **API Response status is 200**  
✅ **Backend logs show checkmark (✓)**  
✅ **Database has record** (SELECT query returns row)  
✅ **Notification disappears immediately**  
✅ **Stays gone after reopening bell**  
✅ **Stays gone after page refresh**  

---

## 🚨 Most Likely Issue (90% probability)

**The `user_notification_seen` table doesn't exist in your database!**

**Quick Fix:**
1. Open phpMyAdmin
2. Select sokapptest database
3. SQL tab
4. Copy/paste the CREATE TABLE statement from Step 1
5. Click Go
6. Try clicking a notification again!

---

**Debug Guide Created:** March 16, 2026  
**Status:** Awaiting Your Results  
**Next Action:** Run Step 1 (check if table exists) and share results!
