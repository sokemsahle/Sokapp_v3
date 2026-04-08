# 📬 Rejection Notifications Feature

## Overview
Users can now see **rejected requisitions** in their notification panel. When a requisition is rejected, the requester receives:
1. An email notification (already existed)
2. A notification in the nav bar badge (NEW ✅)
3. A detailed entry in the notification panel showing the rejection reason (NEW ✅)

---

## What Was Added

### 1. Backend API Endpoint
**File:** `Backend/server.js`  
**Lines:** ~1212-1256

Added new endpoint: `GET /api/requisitions/rejected`

**Purpose:** Fetch rejected requisitions for a specific user's email

**Query Parameters:**
- `email` (required): User's email address
- `unseen` (optional): Filter to only unseen notifications (`true`/`false`)
- `user_id` (optional): User ID for tracking seen status

**Response Example:**
```json
{
  "success": true,
  "requisitions": [
    {
      "id": 123,
      "requestor_name": "John Doe",
      "requestor_email": "john@example.com",
      "department": "IT Department",
      "purpose": "Office Supplies",
      "status": "rejected",
      "rejection_note": "Budget exceeded for this quarter",
      "rejected_by": "Jane Smith",
      "rejected_at": "2026-03-29T10:30:00.000Z",
      "grand_total": "1500.00",
      "created_at": "2026-03-28T09:00:00.000Z"
    }
  ]
}
```

---

### 2. Frontend - StandardUserLayout.js
**File:** `src/layouts/StandardUserLayout.js`  
**Lines:** ~186-221

**Changes:**
- Added fetch call to `/api/requisitions/rejected` endpoint
- Includes rejected count in total notification badge count
- Logs breakdown: unsigned, finalized, and rejected counts

**Code:**
```javascript
// Fetch rejected requisitions (for requester notification)
const rejectedResponse = await fetch(`http://localhost:5000/api/requisitions/rejected?email=${encodeURIComponent(user.email)}&unseen=true&user_id=${user.id}`);
const rejectedResult = await rejectedResponse.json();

// Add rejected count (for requesters)
if (rejectedResult.success && rejectedResult.requisitions && rejectedResult.requisitions.length > 0) {
  totalCount += rejectedResult.requisitions.length;
}
```

---

### 3. Frontend - NotificationCenter Component
**File:** `src/components/NotificationCenter.js`

#### State Addition
```javascript
const [rejectedNotifications, setRejectedNotifications] = useState([]);
```

#### Fetch Logic
```javascript
// Fetch rejected requisitions (for requester notification)
const rejectedResponse = await fetch(`http://localhost:5000/api/requisitions/rejected?email=${encodeURIComponent(currentUser.email)}&unseen=${!showAll}&user_id=${currentUser.id}`);
const rejectedResult = await rejectedResponse.json();

if (rejectedResult.success) {
  const rejectedCount = rejectedResult.requisitions?.length || 0;
  console.log('[NotificationCenter] Rejected requisitions:', rejectedCount);
  setRejectedNotifications(rejectedResult.requisitions || []);
}
```

#### UI Display
Added new section in notification panel:
```jsx
{/* Rejected Notifications */}
{rejectedNotifications.length > 0 && (
  <div className="notification-section">
    <h4 className="notification-section-title">
      <i className='bx bx-x-circle'></i> Rejected Requisitions
    </h4>
    <div className="notification-list">
      {rejectedNotifications.map((req) => (
        <div 
          key={req.id} 
          className="notification-item rejected"
          onClick={() => handleRequisitionClick(req.id)}
        >
          {/* ... details ... */}
          <span className="status-badge status-rejected">
            ✗ Rejected
          </span>
          {req.rejection_note && (
            <span className="rejection-note" title={req.rejection_note}>
              {req.rejection_note?.substring(0, 40)}...
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

---

### 4. CSS Styling
**File:** `src/index.css`  
**Lines:** ~3433-3470

Added styles for rejected notifications:

```css
.status-badge.status-rejected {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  /* ... */
}

.rejection-note {
  background-color: #fef2f2;
  color: #991b1b;
  font-size: 0.7rem;
  /* Shows truncated rejection reason */
}

.notification-item.rejected {
  border-left: 3px solid #dc2626;
}

.notification-item.rejected:hover {
  background-color: #fef2f2;
}
```

---

## User Experience

### What Users See

#### Nav Bar Badge
```
┌──────────────────────┐
│ 🔔 3                 │ ← 1 pending + 1 approved + 1 rejected
└──────────────────────┘
```

#### Notification Panel
```
╔═══════════════════════════════════╗
║ Requisition Notifications    [X] ║
╠═══════════════════════════════════╣
║ ⏰ Pending Your Action (1)        ║
║ ✓ Approved Requisitions (1)       ║
║ ✗ Rejected Requisitions (1)       ║
╟───────────────────────────────────╢
║ REJECTED REQUISITIONS             ║
╟───────────────────────────────────╢
║ #123 | Office Supplies            ║
║ IT Department                     ║
║ ✗ Rejected                        ║
║ Budget exceeded for this quarter  ║
║ 1,500.00 Birr | Mar 28, 2026     ║
╚═══════════════════════════════════╝
```

---

## Notification Flow

### Complete Workflow

```
1. User submits requisition
   ↓
2. Requisition goes through workflow:
   - Reviewer signs → reviewed
   - Approver signs → approved
   - Authorizer signs → authorized
   ↓
3a. SUCCESS: Fully approved → Email + Notification ✅
    
3b. REJECTION: Any signer rejects → Email + Notification ✗
   ├─ Email sent to requester (already exists)
   ├─ Badge appears on nav bar (NEW)
   └─ Shows in notification panel with reason (NEW)
```

---

## Testing Instructions

### Test 1: Basic Rejection Notification
1. **Login as:** Any regular user (requester)
2. **Create:** A new requisition
3. **Have admin/reviewer:** Reject it with a reason
4. **Check:** 
   - ✅ Email received
   - ✅ Nav bar shows badge (🔔 1)
   - ✅ Notification panel shows "Rejected Requisitions" section
   - ✅ Rejection reason is visible

### Test 2: Multiple Notifications
1. **Login as:** User with multiple requisitions
2. **Scenario:**
   - 1 pending review
   - 1 approved
   - 1 rejected
3. **Check:**
   - ✅ Badge shows 🔔 3
   - ✅ All three sections visible in panel
   - ✅ Each section has correct icon and color

### Test 3: Seen Status Tracking
1. **Login as:** User with rejected requisition
2. **Click:** The rejected notification
3. **Navigate:** To requisition details
4. **Refresh:** Page
5. **Check:**
   - ✅ Badge count decreased by 1
   - ✅ Notification marked as seen (won't show if "Hide Seen" selected)

---

## Database Queries for Testing

### Create Test Data
```sql
-- Find your user email
SELECT id, email, full_name FROM users WHERE is_active = TRUE ORDER BY id DESC LIMIT 5;

-- Create a rejected requisition for testing
UPDATE requisitions 
SET 
  status = 'rejected',
  rejection_note = 'Testing rejection notification feature',
  rejected_by = 'Admin User',
  rejected_at = NOW()
WHERE requestor_email = 'your.email@example.com' 
  AND id = YOUR_REQUISITION_ID;

-- Insert unseen notification
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (YOUR_USER_ID, REQUISITION_ID, FALSE);
```

### Verify Rejection Data
```sql
-- Check rejected requisitions
SELECT 
  id,
  requestor_email,
  status,
  rejection_note,
  rejected_by,
  rejected_at
FROM requisitions
WHERE status = 'rejected'
ORDER BY created_at DESC;
```

---

## Debug Commands

### Browser Console Tests
```javascript
// Test the new endpoint directly
fetch('http://localhost:5000/api/requisitions/rejected?email=your.email@example.com&unseen=true&user_id=YOUR_USER_ID')
  .then(r => r.json())
  .then(d => console.log('Rejected requisitions:', d));

// Expected output:
// { success: true, requisitions: [...] }
```

### Check Notification Count
```javascript
// In browser console, check sessionStorage
console.log('Notification count:', sessionStorage.getItem('notificationCount'));

// Should show total of all notification types
```

---

## Files Modified

### Backend
- ✅ `Backend/server.js` - Added `/api/requisitions/rejected` endpoint

### Frontend
- ✅ `src/layouts/StandardUserLayout.js` - Fetch rejected count
- ✅ `src/components/NotificationCenter.js` - Display rejected notifications
- ✅ `src/index.css` - Styling for rejected items

---

## Visual Design

### Color Scheme
- **Rejected Badge:** Red (#dc2626) with light red background (#fee2e2)
- **Border:** Red left border (3px) on notification item
- **Hover Effect:** Light red background (#fef2f2)
- **Rejection Note:** Dark red text (#991b1b) on very light background (#fef2f2)

### Icons
- **Rejected Section:** `bx bx-x-circle` (red X circle)
- **Status Badge:** ✗ Rejected

---

## Integration with Existing Features

### Works With:
- ✅ Email notifications (already sends rejection emails)
- ✅ Notification seen tracking (`user_notification_seen` table)
- ✅ Badge count polling (30-second refresh)
- ✅ Click to navigate to requisition details
- ✅ Mark as seen functionality

### Does Not Affect:
- ❌ Admin notification panel (separate implementation)
- ❌ Inventory notifications (different system)
- ❌ Other notification types

---

## Common Issues & Solutions

### Issue 1: Rejected Notifications Not Showing
**Symptoms:** Badge shows count but panel empty

**Solution:**
```sql
-- Check if rejection data exists
SELECT * FROM requisitions 
WHERE status = 'rejected' 
  AND requestor_email = 'your.email@example.com';

-- Check if notification tracking exists
SELECT * FROM user_notification_seen 
WHERE user_id = YOUR_USER_ID;
```

### Issue 2: Badge Count Wrong
**Symptoms:** Count doesn't match what's in panel

**Solution:**
1. Clear sessionStorage: `sessionStorage.clear()`
2. Refresh page
3. Wait 30 seconds for poll to update

### Issue 3: Rejection Note Not Displaying
**Symptoms:** Shows "Rejected" but no reason

**Solution:**
```sql
-- Check if rejection_note exists in database
SELECT id, rejection_note FROM requisitions 
WHERE id = REQUISITION_ID;

-- If NULL, the requisition was rejected without a note
-- Update with a note:
UPDATE requisitions 
SET rejection_note = 'Your rejection reason here'
WHERE id = REQUISITION_ID;
```

---

## Summary

### Before
- ✗ Rejection emails sent (worked fine)
- ✗ No visual notification in app
- ✗ Users had to check email to know about rejections

### After
- ✅ Email notifications (still working)
- ✅ Nav bar badge shows rejection count
- ✅ Notification panel displays rejected requisitions
- ✅ Rejection reason visible at a glance
- ✅ Click to view full requisition details
- ✅ Seen/unseen tracking works perfectly

---

**Last Updated:** March 29, 2026  
**Status:** ✅ Fully Implemented and Working  
**Tested:** Ready for production testing
