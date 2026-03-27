# 🔧 Fix: 500 Error on Notification API

## Problem
```
GET http://localhost:5000/api/requisitions/unsigned?unseen=true&user_id=1 500 (Internal Server Error)
```

This means the **database table `user_notification_seen` doesn't exist**!

---

## ✅ Solution (2 Minutes)

### Step 1: Create Database Table

**In phpMyAdmin:**

1. Open **phpMyAdmin** in browser
2. Select **sokapptest** database (left sidebar)
3. Click **SQL** tab at top
4. Copy and paste this SQL:

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

5. Click **Go** button
6. Should see: "Query executed successfully" ✅

---

### Step 2: Verify Table Created

Still in phpMyAdmin SQL tab, run:

```sql
SHOW TABLES LIKE 'user_notification_seen';
```

Should return **1 row** with table name!

---

### Step 3: Test App Again

1. **Refresh your app** (F5 or Ctrl+R)
2. **Click bell icon**
3. **Should work now!** ✨

Console should show:
```
✓ Notification marked as seen in database
✓ Removed from UI successfully
```

---

## 🎯 Why This Happened

The backend code tries to query a table that doesn't exist:

```javascript
// Backend tries to INSERT into user_notification_seen
await connection.execute(
  `INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)...`
);

// But table doesn't exist → 500 Error!
```

Creating the table fixes it!

---

## 📊 What the Table Does

| Column | Purpose |
|--------|---------|
| `id` | Auto-increment primary key |
| `user_id` | Which user saw it |
| `requisition_id` | Which requisition they saw |
| `is_seen` | TRUE = seen, FALSE = unseen |
| `seen_at` | When they saw it |

**Example record:**
```
id: 1
user_id: 1
requisition_id: 90
is_seen: TRUE
seen_at: 2026-03-16 15:45:32
```

This means: User 1 saw requisition #90 at 3:45 PM

---

## 🧪 Complete Test Sequence

After creating table:

1. **Login to app**
2. **Open DevTools Console** (F12)
3. **Click bell icon** (🔔)
4. **Check console logs:**
   ```
   Notification clicked: 90
   Token found: true
   API Response status: 200
   ✓ Notification marked as seen in database
   ✓ Removed from UI successfully
   ```
5. **Notification disappears** ✨
6. **Badge count decreases** ✨

---

## ⚠️ If You Still Get Errors

### Error: "Table already exists"

**Good news!** Table already exists. The issue might be:

1. **Backend not restarted** - Stop (Ctrl+C) and restart (`npm start`)
2. **Wrong database** - Make sure you're using `sokapptest` database
3. **Permissions issue** - MySQL user doesn't have CREATE privileges

**Fix:**
```sql
-- Check if table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'sokapptest' 
AND table_name = 'user_notification_seen';
```

Should return `1` if table exists.

---

### Error: "Foreign key constraint fails"

This means you're trying to insert a `user_id` or `requisition_id` that doesn't exist.

**Check valid IDs:**
```sql
-- See valid user IDs
SELECT id, email FROM users LIMIT 5;

-- See valid requisition IDs
SELECT id, requestor_name FROM requisitions ORDER BY created_at DESC LIMIT 5;
```

Use only IDs that exist!

---

## 📁 Files Created for You

1. **`database/create_user_notification_seen_table.sql`** - Simple SQL to create table
2. **`FIX_500_ERROR_NOTIFICATION_TABLE.md`** - This guide

---

## ✅ Success Checklist

After following steps:

- [ ] Ran CREATE TABLE SQL in phpMyAdmin
- [ ] Verified table exists: `SHOW TABLES LIKE 'user_notification_seen'` returned result
- [ ] Restarted backend server (`npm start`)
- [ ] Refreshed frontend (F5)
- [ ] Clicked notification
- [ ] Console shows success logs
- [ ] Notification disappeared
- [ ] Badge count updated

---

## 🎯 Quick Commands

**Create Table (phpMyAdmin SQL tab):**
```sql
CREATE TABLE IF NOT EXISTS user_notification_seen (...);
```

**Verify:**
```sql
SHOW TABLES LIKE 'user_notification_seen';
```

**Test Data:**
```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 90, TRUE, NOW());

SELECT * FROM user_notification_seen;
```

Should show your test record!

---

**Most Likely:** Table doesn't exist → Create it → Works perfectly! ✨

Let me know once you've created the table!
