# ✅ Notification Seen Tracking - Quick Start

## What Was Added?

When a user **clicks on a notification**, it's now automatically marked as **"seen"** in the database.

---

## 🚀 3-Minute Setup

### Step 1: Create Database Table (1 minute)

Open phpMyAdmin → Select `sokapptest` database → Click SQL tab → Run this:

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

Click **Go** ✅

---

### Step 2: Restart Backend (30 seconds)

```bash
cd "Backend"
npm start
```

Or press `Ctrl+C` if running, then restart.

---

### Step 3: Test It! (1.5 minutes)

1. Open app: `http://localhost:3000`
2. Login
3. Click bell icon (🔔)
4. Click any notification
5. Open phpMyAdmin and run:

```sql
SELECT * FROM user_notification_seen ORDER BY seen_at DESC LIMIT 5;
```

You should see records showing which user saw which notification and when! ✅

---

## 🎯 How It Works

```
User clicks notification #123
    ↓
Frontend calls: POST /api/notifications/123/seen
    ↓
Backend inserts into database:
{
  user_id: 1,
  requisition_id: 123,
  is_seen: TRUE,
  seen_at: "2026-03-16 14:30:45"
}
    ↓
Navigation proceeds to requisition page
```

---

## 📊 What Gets Saved

| Field | Value | Description |
|-------|-------|-------------|
| `user_id` | 1 | Which user saw it |
| `requisition_id` | 123 | Which notification |
| `is_seen` | TRUE | Marked as seen |
| `seen_at` | NOW() | Timestamp when viewed |

---

## 🔍 Useful Queries

### Check if User Has Seen a Specific Notification
```sql
SELECT * FROM user_notification_seen 
WHERE user_id = 1 AND requisition_id = 123;
```

### Get All Seen Notifications for User
```sql
SELECT r.id, r.requestor_name, uns.seen_at
FROM requisitions r
JOIN user_notification_seen uns ON r.id = uns.requisition_id
WHERE uns.user_id = 1
ORDER BY uns.seen_at DESC;
```

### Count Unseen Notifications
```sql
SELECT COUNT(*) as unseen_count 
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL);
```

---

## 💡 Future Features You Can Add

### 1. Show Unread Badge Count
Update the number on the bell icon based on unseen count

### 2. Visual Indicator
```css
/* Unseen notifications have blue background */
.notification-item.unseen {
  background-color: #e6f3ff;
  border-left: 4px solid var(--primary);
}
```

### 3. "Mark All as Read" Button
Let users clear all notifications at once

### 4. Filter by Seen/Unseen
Add tabs: "All | Unread | Read"

---

## 📁 Files Changed

**Created:**
1. `database/add_notification_seen_tracking.sql` - Migration script
2. `NOTIFICATION_SEEN_TRACKING.md` - Full documentation

**Modified:**
1. `Backend/server.js` - Added POST endpoint (lines 58-91)
2. `src/components/NotificationCenter.js` - Added click handler

---

## ✅ Testing Checklist

- [ ] Database table exists
- [ ] Click notification → No errors in console
- [ ] Database record created
- [ ] Timestamp recorded correctly
- [ ] Works for multiple users
- [ ] Authentication required (try without login → should fail)

---

## 🎉 Benefits

✅ Track which notifications users have seen  
✅ Accurate badge counts (future enhancement)  
✅ Better user experience  
✅ Analytics and engagement metrics  
✅ Audit trail with timestamps  

---

**Setup Time:** ~3 minutes  
**Status:** ✅ Complete and Ready to Use  
**Database Table:** `user_notification_seen`  
**API Endpoint:** `POST /api/notifications/:id/seen`
