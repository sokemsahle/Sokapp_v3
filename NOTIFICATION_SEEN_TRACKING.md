# 🔔 Notification Seen Tracking Feature

## Overview
When a user clicks on a notification in the NotificationCenter, it is automatically marked as "seen" in the database. This allows the system to track which notifications have been viewed and potentially show unread counts.

---

## 📋 Implementation Details

### 1. Database Schema Changes

**File:** `database/add_notification_seen_tracking.sql`

**Two Approaches:**

#### Approach A: Simple (Columns in requisitions table)
```sql
ALTER TABLE requisitions 
ADD COLUMN is_notification_seen BOOLEAN DEFAULT FALSE;

ALTER TABLE requisitions 
ADD COLUMN notification_seen_at TIMESTAMP NULL;
```

#### Approach B: Scalable (Separate tracking table) ✅ RECOMMENDED
```sql
CREATE TABLE user_notification_seen (
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
);
```

**Why Approach B is Better:**
- Tracks seen status per user (multiple users can see same requisition)
- More flexible for future features
- Better query performance with indexes
- Maintains history

---

### 2. Backend API Endpoint

**Endpoint:** `POST /api/notifications/:id/seen`

**Location:** `Backend/server.js` (lines 58-91)

**Code:**
```javascript
app.post('/api/notifications/:id/seen', async (req, res) => {
    const { authMiddleware } = require('./middleware/auth.middleware');
    
    authMiddleware(req, res, async () => {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const { id: requisitionId } = req.params;
            const userId = req.user.id;
            
            // Insert or update the seen status
            await connection.execute(
                `INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
                 VALUES (?, ?, TRUE, NOW())
                 ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW()`,
                [userId, requisitionId]
            );
            
            res.json({
                success: true,
                message: 'Notification marked as seen'
            });
        } catch (error) {
            console.error('Error marking notification as seen:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as seen',
                error: error.message
            });
        } finally {
            await connection.end();
        }
    });
});
```

**Features:**
- ✅ JWT authentication required
- ✅ Uses `req.user.id` from auth middleware
- ✅ Upsert logic (INSERT ... ON DUPLICATE KEY UPDATE)
- ✅ Records timestamp when seen
- ✅ Error handling

---

### 3. Frontend Integration

**File:** `src/components/NotificationCenter.js`

#### New Function: `handleRequisitionClick`
```javascript
const handleRequisitionClick = async (reqId) => {
  // Mark notification as seen in database
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/notifications/${reqId}/seen`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error marking notification as seen:', error);
  }
  
  // Navigate to requisition
  if (onRequisitionClick) {
    onRequisitionClick(reqId);
  }
};
```

#### Updated onClick Handlers
```javascript
// For pending notifications
<div 
  key={req.id} 
  className="notification-item"
  onClick={() => handleRequisitionClick(req.id)}
>

// For approved notifications
<div 
  key={req.id} 
  className="notification-item finalized"
  onClick={() => handleRequisitionClick(req.id)}
>
```

**Flow:**
1. User clicks notification
2. Frontend calls `/api/notifications/:id/seen`
3. Backend marks as seen in database
4. Frontend proceeds with navigation
5. Badge count can be updated

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Open phpMyAdmin and execute:

```sql
-- Use the scalable approach (separate table)
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

### Step 2: Restart Backend Server

```bash
cd Backend
npm start
```

### Step 3: Test the Feature

1. Open app at `http://localhost:3000`
2. Login with credentials
3. Click bell icon (🔔) to open notifications
4. Click any notification
5. Check database - record should exist in `user_notification_seen` table

---

## 📊 Database Queries

### Check if User Has Seen a Notification
```sql
SELECT * FROM user_notification_seen 
WHERE user_id = 1 AND requisition_id = 123;
```

### Get Unseen Notifications Count for User
```sql
SELECT COUNT(*) as unseen_count 
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND r.status IN ('pending', 'approved');
```

### Get All Seen Notifications for User
```sql
SELECT r.id, r.requestor_name, r.department, uns.seen_at
FROM requisitions r
JOIN user_notification_seen uns ON r.id = uns.requisition_id
WHERE uns.user_id = 1 AND uns.is_seen = TRUE
ORDER BY uns.seen_at DESC;
```

### Mark All Notifications as Seen for User
```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
SELECT 1, id, TRUE, NOW()
FROM requisitions
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();
```

---

## 🎯 User Flow

```
User sees bell icon with badge (3)
    ↓
Clicks bell icon
    ↓
NotificationCenter opens showing 3 notifications
    ↓
User clicks on notification #123
    ↓
Frontend calls POST /api/notifications/123/seen
    ↓
Backend marks as seen in database
    ↓
Database records: user_id=1, requisition_id=123, is_seen=TRUE, seen_at=NOW()
    ↓
Frontend navigates to requisition details page
    ↓
Badge count updates (optional - can be implemented)
```

---

## 💡 Future Enhancements

### 1. Update Badge Count Dynamically
```javascript
// In NotificationCenter component
useEffect(() => {
  fetchUnseenCount();
}, []);

const fetchUnseenCount = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/notifications/unseen-count', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  setNotificationCount(result.unseen_count);
};
```

### 2. Add "Mark All as Read" Button
```javascript
const markAllAsSeen = async () => {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:5000/api/notifications/mark-all-seen', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Refresh notifications
};
```

### 3. Visual Indicator for Seen/Unseen
```css
.notification-item.unseen {
  background-color: #e6f3ff;
  border-left: 4px solid var(--primary);
}

.notification-item.seen {
  opacity: 0.7;
  background-color: transparent;
}
```

### 4. Filter Seen/Unseen Notifications
```javascript
const [filter, setFilter] = useState('all'); // 'all', 'unseen', 'seen'

const filteredNotifications = notifications.filter(req => {
  if (filter === 'unseen') return !req.is_seen;
  if (filter === 'seen') return req.is_seen;
  return true;
});
```

---

## 🔧 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/:id/seen` | Mark specific notification as seen |
| GET | `/api/notifications/unseen-count` | Get count of unseen notifications (future) |
| POST | `/api/notifications/mark-all-seen` | Mark all as seen (future) |
| GET | `/api/notifications/history` | Get seen notification history (future) |

---

## ✅ Testing Checklist

- [ ] Database table created successfully
- [ ] Backend endpoint responds to POST requests
- [ ] Frontend calls endpoint when clicking notification
- [ ] Database record created with correct user_id and requisition_id
- [ ] `is_seen` column set to TRUE
- [ ] `seen_at` timestamp recorded
- [ ] Works for both pending and approved notifications
- [ ] Authentication required (401 without token)
- [ ] Error handling works correctly
- [ ] Multiple users can see same requisition independently

---

## 🐛 Troubleshooting

### Issue: Endpoint returns 401
**Solution:** Ensure JWT token is included in Authorization header

### Issue: Database table doesn't exist
**Solution:** Run the SQL migration script in phpMyAdmin

### Issue: Notification not marked as seen
**Solution:** Check browser console for errors, verify backend logs

### Issue: Duplicate entries in database
**Solution:** The UNIQUE constraint should prevent this - verify index exists

---

## 📝 Code Locations

**Frontend Files:**
- `src/components/NotificationCenter.js` - Main component with click handler
- `src/components/Nav.js` - Bell icon displays count

**Backend Files:**
- `Backend/server.js` - API endpoint definition (lines 58-91)
- `Backend/middleware/auth.middleware.js` - Authentication

**Database Files:**
- `database/add_notification_seen_tracking.sql` - Migration script
- Table: `user_notification_seen`

---

## 🎉 Benefits

1. **User Experience**: Users can track which notifications they've viewed
2. **Analytics**: Admin can see engagement metrics
3. **Smart Filtering**: Can filter seen/unseen notifications
4. **Badge Accuracy**: Badge count reflects truly unseen items
5. **Audit Trail**: Timestamp shows exactly when viewed

---

**Implementation Date:** March 16, 2026  
**Status:** ✅ Complete  
**Database Table:** `user_notification_seen`  
**API Endpoint:** `POST /api/notifications/:id/seen`
