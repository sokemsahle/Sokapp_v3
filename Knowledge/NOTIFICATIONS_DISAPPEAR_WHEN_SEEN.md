# 🔔 Notifications Disappear When Seen - Feature Update

## What Changed?

Now when you click on a notification, it **disappears from the list immediately** after being seen!

---

## 🎯 How It Works

### User Flow:
```
1. User sees bell icon with badge (3)
   ↓
2. Clicks bell → Opens notification center
   ↓
3. Sees 3 unseen notifications
   ↓
4. Clicks notification #123
   ↓
5. Notification marked as seen in database
   ↓
6. Notification INSTANTLY removed from UI
   ↓
7. Badge count decreases by 1
   ↓
8. User navigates to requisition page
```

---

## ✨ New Features

### 1. Instant Disappear ✅
- Click notification → It's gone immediately
- No refresh needed
- Smooth UX experience

### 2. Show All Toggle 👁️
- Button to toggle between "Unseen Only" and "Show All"
- Default: Shows only unseen notifications
- Click eye icon 👁️ to see all (including seen ones)

### 3. Smart Filtering
- Backend filters by `user_id` and `is_seen` status
- Each user sees their own unseen notifications
- Seen notifications hidden by default

---

## 🎨 UI Updates

### Notification Center Header

```
┌─────────────────────────────────────────────────┐
│ Notifications          🔔(2) ⚙️ 👁️ Show All  ✕ │
│                            ↑   ↑                │
│                     Tabs  Settings  Toggle      │
└─────────────────────────────────────────────────┘
```

### Empty States

**When no unseen notifications:**
```
✓ No unseen notifications
  All notifications are up to date
  
[👁️ Show All Notifications (including seen)]
```

**When showing all (including seen):**
```
✓ No notifications
  All notifications have been viewed
  
[⚙️ Manage Notification Preferences]
```

---

## 🔧 Technical Implementation

### Frontend Changes

**File:** `src/components/NotificationCenter.js`

#### Added State:
```javascript
const [showAll, setShowAll] = useState(false); // Toggle show all vs unseen
```

#### Updated API Calls:
```javascript
// Fetch only unseen by default
const unsignedResponse = await fetch(
  `http://localhost:5000/api/requisitions/unsigned?unseen=${!showAll}&user_id=${currentUser.id}`
);

const finalizedResponse = await fetch(
  `http://localhost:5000/api/requisitions/finalized?email=${email}&unseen=${!showAll}&user_id=${currentUser.id}`
);
```

#### Instant Removal on Click:
```javascript
const handleRequisitionClick = async (reqId) => {
  // Mark as seen in database
  await fetch(`/api/notifications/${reqId}/seen`, { method: 'POST' });
  
  // Remove from UI immediately
  setRequisitionNotifications(prev => prev.filter(req => req.id !== reqId));
  setFinalizedNotifications(prev => prev.filter(req => req.id !== reqId));
  
  // Update badge count
  setNotificationCount(prev => Math.max(0, prev - 1));
  
  // Navigate to requisition
  onRequisitionClick(reqId);
};
```

---

### Backend Changes

**File:** `Backend/server.js`

#### Updated Endpoints:

**GET /api/requisitions/unsigned**
```javascript
if (unseen === 'true' && user_id) {
  // Only unseen notifications
  query = `
    SELECT r.* FROM requisitions r
    LEFT JOIN user_notification_seen uns 
      ON r.id = uns.requisition_id AND uns.user_id = ?
    WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
    AND (signature_data IS NULL OR ...)
    ORDER BY created_at DESC
  `;
} else {
  // All notifications
  query = `SELECT * FROM requisitions WHERE ...`;
}
```

**GET /api/requisitions/authorized (and /finalized)**
```javascript
if (unseen === 'true' && user_id) {
  // Only unseen authorized requisitions
  query = `
    SELECT r.* FROM requisitions r
    LEFT JOIN user_notification_seen uns 
      ON r.id = uns.requisition_id AND uns.user_id = ?
    WHERE r.status = 'authorized' 
      AND r.requestor_email = ?
      AND (uns.is_seen = FALSE OR uns.is_seen IS NULL)
  `;
}
```

---

## 📊 Database Query Examples

### Get Unseen Notifications for User
```sql
-- Pending notifications
SELECT r.* 
FROM requisitions r
LEFT JOIN user_notification_seen uns 
  ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
AND (signature_data IS NULL OR reviewed_signature IS NULL 
     OR approved_signature IS NULL OR authorized_signature IS NULL);

-- Approved notifications
SELECT r.* 
FROM requisitions r
LEFT JOIN user_notification_seen uns 
  ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE r.status = 'authorized' 
  AND r.requestor_email = 'user@example.com'
  AND (uns.is_seen = FALSE OR uns.is_seen IS NULL);
```

### After Clicking (Marked as Seen)
```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 123, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();
```

---

## 🎯 User Experience

### Before:
```
User clicks notification → Stays in list → Confusing which are new
```

### After:
```
User clicks notification → Disappears → Clear what's left to see ✅
```

---

## 🧪 Testing Steps

1. **Setup:**
   - Run SQL migration to create `user_notification_seen` table
   - Restart backend server
   - Login to app

2. **Test Unseen Filtering:**
   - Click bell icon
   - Should see only unseen notifications
   - Count badge shows number of unseen items

3. **Test Disappear on Click:**
   - Click any notification
   - Should disappear immediately
   - Badge count should decrease
   - Navigate to requisition page

4. **Test Show All Toggle:**
   - Click "Show All" button (eye icon)
   - Should now see all notifications (including seen ones)
   - Click again to go back to "Unseen Only"

5. **Test Persistence:**
   - Refresh page
   - Seen notifications should still be hidden
   - Only new unseen notifications appear

---

## 💡 Benefits

✅ **Clear Visual Feedback**: Users know exactly what they haven't seen  
✅ **Reduced Clutter**: List gets shorter as you process notifications  
✅ **Gamification**: Satisfying to clear the list to zero  
✅ **Better UX**: No confusion about what's new vs already seen  
✅ **Control**: "Show All" toggle gives users flexibility  

---

## 🎨 CSS Additions

**File:** `src/index.css`

```css
/* Show All Toggle Button */
.show-all-toggle {
  background: transparent;
  border: 2px solid var(--grey);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  color: var(--dark-gray);
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
}

.show-all-toggle:hover {
  border-color: var(--primary);
  background-color: var(--light-primary);
  color: var(--primary);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .show-all-toggle span {
    display: none; /* Hide text, show only icon */
  }
}
```

---

## 📱 Mobile Behavior

On mobile devices:
- "Show All" button shows only the eye icon 👁️
- Text label hidden to save space
- Tooltip on hover explains function
- Touch-friendly size (44px minimum)

---

## 🔄 State Management

```
Initial State: showAll = false
               ↓
Fetch API with unseen=true
               ↓
Display only unseen notifications
               ↓
User clicks "Show All"
               ↓
showAll = true
               ↓
Refetch with unseen=false
               ↓
Display all notifications
               ↓
User clicks notification
               ↓
Remove from array instantly
               ↓
Badge count updates
```

---

## ✅ Summary

| Feature | Before | After |
|---------|--------|-------|
| Seen notifications stay in list | ❌ Yes | ✅ No - disappear |
| Filter by unseen | ❌ No | ✅ Yes |
| Show all toggle | ❌ No | ✅ Yes |
| Instant removal | ❌ No | ✅ Yes |
| Badge updates | ❌ Manual refresh | ✅ Automatic |

---

**Implementation Date:** March 16, 2026  
**Status:** ✅ Complete  
**User Impact:** Major UX Improvement  
**Breaking Changes:** None
