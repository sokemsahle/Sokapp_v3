# 🔧 Investigation: "Pending Your Action" Notifications Not Disappearing

## Your Suspicion is Correct! 🕵️

You said: *"I don't think it is on database and it is using some other logic to show notification of requisition"*

Let me trace the complete flow:

---

## ✅ How It SHOULD Work

```
Frontend (NotificationCenter.js)
    ↓
Calls: GET /api/requisitions/unsigned?unseen=true&user_id=1
    ↓
Backend (server.js line 884)
    ↓
SQL Query with LEFT JOIN on user_notification_seen table
    ↓
Database returns ONLY unseen requisitions
    ↓
Frontend displays them
    ↓
User clicks notification
    ↓
Frontend calls: POST /api/notifications/:id/seen
    ↓
Backend INSERTs into user_notification_seen (is_seen = TRUE)
    ↓
Frontend removes from UI immediately
    ↓
Next time notifications load, backend excludes seen ones
    ↓
Notification disappears permanently ✅
```

---

## 🔍 What's Probably Happening

### Scenario A: Table Doesn't Exist ❌

```
Frontend calls API with ?unseen=true&user_id=1
    ↓
Backend tries to query: LEFT JOIN user_notification_seen
    ↓
Database: "Table doesn't exist!" → 500 Error
    ↓
Frontend gets error, shows all requisitions anyway
    ↓
Click notification → POST /api/notifications/:id/seen
    ↓
Database: "Table doesn't exist!" → 500 Error
    ↓
Nothing recorded!
    ↓
Reopen notifications → ALL still there ❌
```

**Symptoms:**
- Backend logs show: `Error fetching unsigned requisitions: Table 'sokapptest.user_notification_seen' doesn't exist`
- Clicking notifications does nothing
- They never disappear

**Fix:** Create the table! (See below)

---

### Scenario B: Table Exists But No Records ❌

```
Table exists but empty
    ↓
API returns all requisitions as "unseen"
    ↓
Click notification → POST saves record with is_seen=TRUE ✅
    ↓
Frontend removes temporarily
    ↓
Reopen bell → API refetches
    ↓
LEFT JOIN finds record with is_seen=TRUE
    ↓
Excludes it from results
    ↓
Should disappear! ✅
```

If this scenario but still showing → Query bug!

---

### Scenario C: Using Different Logic Than Database ❌

Maybe notifications are coming from a completely different endpoint that doesn't use `user_notification_seen`?

**Check DevTools Network tab:**
1. Click bell icon
2. Look for: `GET /api/requisitions/unsigned`
3. Check query params: Should have `?unseen=true&user_id=1`
4. If NO query params → That's the problem!

---

## 🧪 Step-by-Step Diagnosis

### Step 1: Check Backend Logs

After clicking bell icon, check terminal running backend:

**Expected logs (with new debug code):**
```
GET /api/requisitions/unsigned - Params: { unseen: 'true', user_id: '1' }
Fetching UNSEEN notifications for user_id: 1
Query with JOIN on user_notification_seen
Found 3 unseen requisitions
```

**If you see errors instead:**
```
Error fetching unsigned requisitions: Error: Table 'sokapptest.user_notification_seen' doesn't exist
```

→ **THAT'S YOUR PROBLEM!** Table missing!

---

### Step 2: Check Database

In phpMyAdmin, run:
```sql
SHOW TABLES LIKE 'user_notification_seen';
```

**Result:**
- ✅ Returns 1 row → Table exists
- ❌ Returns 0 rows → Table missing → **CREATE IT!**

---

### Step 3: Test Manual Insert

Try manually marking a requisition as seen:

```sql
-- Replace 1 with your user_id, 90 with real requisition ID
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 90, TRUE, NOW());

-- Verify
SELECT * FROM user_notification_seen WHERE user_id = 1 AND requisition_id = 90;
```

**Expected:** Shows record with `is_seen = TRUE`

**If error:** Foreign key constraint (requisition doesn't exist)  
**If works:** Refresh app, that requisition should be gone!

---

### Step 4: Check Browser Console

Open DevTools → Console tab → Click notification

**Expected logs:**
```
Notification clicked: 90
Token found: true
API Response status: 200
API Response: {success: true, message: "Notification marked as seen"}
✓ Notification marked as seen in database
Filtered requisitionNotifications: 2
✓ New notification count: 2
✓ Removed from UI successfully
```

**If you see 404 or 500 errors:** Backend issue!

---

## 🎯 Most Likely Issues & Fixes

### Issue #1: Table Doesn't Exist (90% probability)

**Quick Fix:**
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

Run in phpMyAdmin SQL tab → Click Go → Done!

---

### Issue #2: Frontend Not Passing Parameters

Check Network tab in browser DevTools:

**Look for this request:**
```
GET http://localhost:5000/api/requisitions/unsigned?unseen=true&user_id=1
```

**If URL is missing `?unseen=true&user_id=1`:**
Frontend bug! Check NotificationCenter.js line 31.

---

### Issue #3: Backend Not Using Parameters

Backend logs should show:
```
Fetching UNSEEN notifications for user_id: 1
```

**If it shows:**
```
Fetching ALL unsigned requisitions
```

Then `unseen` parameter isn't being read correctly!

---

## 📊 Complete Test Sequence

### Test 1: Fresh Start
1. Create table (SQL above)
2. Restart backend (`npm start`)
3. Refresh frontend (F5)
4. Click bell icon
5. See notifications

### Test 2: Click to Disappear
1. Click any notification
2. Console should show success logs
3. Notification disappears immediately
4. Badge count decreases

### Test 3: Persistence
1. Close notification panel
2. Reopen bell icon
3. Clicked notification should STILL be gone
4. Only unseen remain

### Test 4: Database Verification
1. Run SQL query:
```sql
SELECT uns.*, r.requestor_name 
FROM user_notification_seen uns
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 1
ORDER BY uns.created_at DESC;
```
2. Should show all clicked notifications with `is_seen = TRUE`

---

## 🔧 Files I Created for You

1. **`database/diagnose_notifications_not_disappearing.sql`**
   - Complete diagnostic queries
   - Copy/paste solutions
   - Step-by-step checks

2. **`INVESTIGATION_PENDING_ACTION_NOT_DISAPPEARING.md`**
   - This guide
   - All scenarios explained
   - Troubleshooting steps

---

## 🎯 What To Do RIGHT NOW

### Immediate Action (2 minutes):

1. **Open phpMyAdmin**
2. **Select sokapptest database**
3. **Click SQL tab**
4. **Run this:**
```sql
SHOW TABLES LIKE 'user_notification_seen';
```

5. **If returns 0 rows → Create table:**
```sql
CREATE TABLE IF NOT EXISTS user_notification_seen (...);
-- Use full CREATE TABLE statement from above
```

6. **Restart backend:**
```bash
cd "Backend"
npm start
```

7. **Test:**
   - Refresh app
   - Click bell
   - Click notification
   - Should disappear! ✨

---

## 📞 Report Back With Results

After trying above, tell me:

1. **Does table exist?** (Result of SHOW TABLES)
2. **What do backend logs show?** (Check terminal)
3. **What does browser console show?** (Check DevTools)
4. **Does notification disappear temporarily then reappear?** Or never disappear?

With this info, I can pinpoint the exact issue! 🎯

---

**Investigation Status:** In Progress  
**Most Likely Cause:** Missing `user_notification_seen` table  
**Action Required:** Create table, restart backend, test
