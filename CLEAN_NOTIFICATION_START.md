# 🧹 Clean Start - Notification System Reset

## Purpose
Clear all existing notification seen data and start fresh for perfect system testing.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Clean Database (1 minute)

1. Open **phpMyAdmin**
2. Select `sokapptest` database
3. Click **SQL** tab
4. Copy and paste this:

```sql
-- Clear ALL notification seen data
TRUNCATE TABLE user_notification_seen;

-- Verify it's empty
SELECT COUNT(*) as total_records FROM user_notification_seen;

-- Reset auto-increment
ALTER TABLE user_notification_seen AUTO_INCREMENT = 1;
```

5. Click **Go**
6. Should show: `total_records = 0` ✅

---

### Step 2: Restart Backend (30 seconds)

Open terminal:
```bash
cd "Backend"
npm start
```

Or if already running:
- Press `Ctrl+C` to stop
- Run `npm start` again

---

### Step 3: Test Fresh Start (1 minute)

1. Open app: `http://localhost:3000`
2. Login with credentials
3. Click bell icon (🔔)
4. **All notifications should appear** (since we cleared the data)
5. Click any notification
6. Watch console logs (F12 → Console tab)
7. Should see:
   ```
   Notification clicked: 123
   Token found: true
   API Response status: 200
   ✓ Notification marked as seen in database
   ✓ Removed from UI
   ```
8. Notification should disappear! ✅

---

## 📊 What This Cleans

### Cleared:
✅ All `user_notification_seen` records  
✅ All `is_seen` statuses  
✅ All `seen_at` timestamps  
✅ Auto-increment counter  

### NOT Cleared:
❌ Requisitions themselves  
❌ User accounts  
❌ Other database tables  
❌ Notification settings preferences  

---

## 🎯 Expected Behavior After Cleanup

### Before Cleanup:
```
Bell icon shows: Maybe some notifications
Click notification: Might not disappear
Database: Has old/conflicting data
```

### After Cleanup:
```
Bell icon shows: ALL notifications as unseen
Click notification: Disappears immediately ✅
Database: Clean, only new data
Badge count: Accurate ✅
```

---

## 🔍 Verification Steps

### Immediately After TRUNCATE:

Run this SQL:
```sql
SELECT * FROM user_notification_seen;
```

**Expected:** Empty result set (0 rows)

### After Clicking a Notification:

Run this SQL:
```sql
SELECT 
    uns.user_id,
    u.email,
    r.id as requisition_id,
    r.requestor_name,
    uns.is_seen,
    uns.seen_at
FROM user_notification_seen uns
JOIN users u ON uns.user_id = u.id
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.is_seen = TRUE
ORDER BY uns.seen_at DESC;
```

**Expected:** Should show the notification you just clicked with `is_seen = TRUE`

---

## 🧪 Complete Testing Workflow

### Test 1: Fresh Start
1. Run TRUNCATE script
2. Refresh app
3. Click bell
4. **Should see ALL notifications** (even ones you saw before)
5. ✅ This is correct!

### Test 2: Click and Disappear
1. Click any notification
2. Check console logs (should show success)
3. **Notification should vanish immediately**
4. Badge count decreases
5. ✅ Working perfectly!

### Test 3: Persistence
1. Click notification #123
2. It disappears
3. Refresh page (F5)
4. Click bell again
5. **#123 should still be gone**
6. ✅ Database tracking works!

### Test 4: Multiple Notifications
1. Click 3 different notifications
2. Each should disappear on click
3. Badge count should decrease by 3
4. Only unseen remain
5. ✅ Filtering works correctly!

---

## 🐛 Troubleshooting After Cleanup

### Issue: Notifications still don't disappear

**Check 1:** Is backend running?
```bash
# Should show server listening on port 5000
netstat -ano | findstr :5000
```

**Check 2:** Are API calls succeeding?
- Open browser DevTools (F12)
- Go to Network tab
- Click notification
- Look for POST to `/api/notifications/:id/seen`
- Status should be 200

**Check 3:** Is data being saved?
```sql
-- Should show recent clicks
SELECT * FROM user_notification_seen 
ORDER BY seen_at DESC 
LIMIT 5;
```

If empty after clicking notifications → Backend issue!

---

### Issue: No notifications showing at all

**Possible causes:**
1. No requisitions in database
2. All requisitions already fully signed
3. Wrong user logged in

**Solution:**
```sql
-- Check if requisitions exist
SELECT COUNT(*) as total FROM requisitions;

-- Check unsigned ones
SELECT COUNT(*) as unsigned 
FROM requisitions 
WHERE signature_data IS NULL 
   OR reviewed_signature IS NULL 
   OR approved_signature IS NULL 
   OR authorized_signature IS NULL;
```

---

### Issue: Console shows errors

**Common errors:**

1. **"No authentication token"**
   - Logout and login again
   - Token might be expired

2. **"Failed to fetch"**
   - Backend not running
   - Wrong port (should be 5000)

3. **"Invalid token"**
   - Token corrupted/expired
   - Logout → Login again

---

## 📋 Cleanup Script Variations

### Full Reset (Recommended):
```sql
TRUNCATE TABLE user_notification_seen;
ALTER TABLE user_notification_seen AUTO_INCREMENT = 1;
```

### Partial Reset (Specific User):
```sql
DELETE FROM user_notification_seen WHERE user_id = 1;
```

### Partial Reset (Specific Requisition):
```sql
DELETE FROM user_notification_seen WHERE requisition_id IN (123, 124, 125);
```

### Keep Last Week's Data:
```sql
DELETE FROM user_notification_seen 
WHERE seen_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## ✅ Success Indicators

After cleanup, you know it's working when:

✅ **All notifications visible** (fresh start)  
✅ **Click → Disappears instantly**  
✅ **Console shows success logs**  
✅ **Badge count accurate**  
✅ **Persists after refresh**  
✅ **Database records created**  
✅ **Each user has separate tracking**  

---

## 🎯 Next Steps After Cleanup

1. **Test thoroughly** - Click multiple notifications
2. **Monitor console** - Watch for any errors
3. **Check database** - Verify records being created
4. **Test persistence** - Refresh page, verify still gone
5. **Test multi-user** - Different users see different unseen

---

## 📞 If Issues Persist

After cleanup and restart, if still having issues:

1. **Share console logs** (from F12 → Console)
2. **Share database state** (run SELECT query above)
3. **Share network tab** (API response status)
4. **Confirm backend is running** (port 5000)

With clean data + fresh restart + debug logs, we can pinpoint any remaining issues!

---

**Cleanup Date:** March 16, 2026  
**Status:** Ready to Execute  
**Impact:** Resets all notification seen tracking  
**Recovery:** Run cleanup script again if needed
