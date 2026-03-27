# Standard User Requisition Notification System

## Overview
Standard users with requisition roles (reviewer, approver, authorizer) receive notifications in the navigation bar about their requisition status changes. This includes notifications when:
1. Their submitted requisitions are approved/finalized
2. Requisitions require their action (review, approval, authorization)

---

## How It Works

### 1. Navigation Bar Notification Badge

**Location:** Top-right corner of the screen (bell icon)

**What it shows:**
- Red badge with number indicating unseen notifications
- Counts both pending action items AND finalized requisitions

**Visual Example:**
```
┌─────────────────────────────────────┐
│  ☰  [Program Dropdown]    🔔 3  👤 │
└─────────────────────────────────────┘
                                    ↑
                              Notification bell
                              with count badge
```

---

### 2. Notification Types

#### Type A: Pending Your Action
For users with requisition roles (reviewer, approver, authorizer)

**Triggers:**
- New requisition assigned to their role
- Requisition waiting for their signature

**Example:**
```
┌──────────────────────────────────────────┐
│ ⏰ Pending Your Action                   │
├──────────────────────────────────────────┤
│ #87 - John Doe                           │
│ Science Department                       │
│ Lab Equipment Purchase                   │
│ [Pending Review] [Jan 15, 2024 10:30 AM]│
└──────────────────────────────────────────┘
```

#### Type B: Approved Requisitions
For requesters (any standard user)

**Triggers:**
- Their submitted requisition gets fully approved
- Status changes to 'authorized'

**Example:**
```
┌──────────────────────────────────────────┐
│ ✓ Approved Requisitions                  │
├──────────────────────────────────────────┤
│ #85 - Jane Smith                         │
│ Mathematics Department                   │
│ Textbook Purchase                        │
│ [✓ Approved] [5000 Birr] [Jan 14, 2024] │
└──────────────────────────────────────────┘
```

---

### 3. Role-Based Notification Flow

```
User Submits Requisition
         ↓
[Requester gets notification when approved]
         ↓
Requisition Pending Review
         ↓
[Reviewers get notification]
         ↓
Reviewer Signs → Pending Approval
         ↓
[Approvers get notification]
         ↓
Approver Signs → Pending Authorization
         ↓
[Authorizers get notification]
         ↓
Authorizer Signs → Approved/Finalized
         ↓
[Requester gets final notification]
```

---

## Technical Implementation

### Frontend Components

#### 1. StandardUserLayout.js
**File:** `src/layouts/StandardUserLayout.js`

**Key Features:**
- Polls backend every 30 seconds for new notifications
- Maintains notification count state
- Passes count to Nav component

```javascript
// Polling mechanism
useEffect(() => {
  checkForFinalizedRequisitions(); // Check immediately
  const interval = setInterval(checkForFinalizedRequisitions, 30000); // Every 30s
  return () => clearInterval(interval);
}, [user?.email]);

const checkForFinalizedRequisitions = async () => {
  const response = await fetch(
    `http://localhost:5000/api/requisitions/authorized?email=${encodeURIComponent(user.email)}`
  );
  const result = await response.json();
  if (result.success) {
    setNewRequisitionCount(result.requisitions.length);
  }
};
```

#### 2. Nav.js
**File:** `src/components/Nav.js`

**Displays notification badge:**
```javascript
<a href="#" className="notification">
  <i className='bx bx-bell'></i>
  {notificationCount > 0 && (
    <span className="num">{notificationCount}</span>
  )}
</a>
```

#### 3. NotificationCenter.js
**File:** `src/components/NotificationCenter.js`

**Features:**
- Shows/hides seen notifications toggle
- Marks notifications as seen when clicked
- Removes from UI immediately after marking seen
- Two sections: Pending Action & Approved

**Mark as Seen Logic:**
```javascript
const handleRequisitionClick = async (reqId) => {
  // Mark as seen in database
  await fetch(`http://localhost:5000/api/notifications/${reqId}/seen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.id })
  });
  
  // Remove from UI immediately
  setRequisitionNotifications(prev => 
    prev.filter(req => req.id !== reqId)
  );
  setNotificationCount(prev => Math.max(0, prev - 1));
  
  // Navigate to requisition
  onRequisitionClick(reqId);
};
```

---

### Backend Endpoints

#### 1. GET /api/requisitions/authorized
**Purpose:** Fetch finalized requisitions for requester

**Query Parameters:**
- `email` (required): Requester's email
- `unseen` (optional): Filter only unseen notifications
- `user_id` (optional): User ID for unseen filter

**Response:**
```json
{
  "success": true,
  "requisitions": [
    {
      "id": 85,
      "requestor_name": "Jane Smith",
      "requestor_email": "jane@example.com",
      "department": "Mathematics",
      "purpose": "Textbook Purchase",
      "status": "authorized",
      "grand_total": 5000.00,
      "created_at": "2024-01-14T10:30:00Z"
    }
  ]
}
```

**SQL Query (Unseen Only):**
```sql
SELECT r.id, r.requestor_name, r.requestor_email, r.department, 
       r.purpose, r.request_date, r.status, r.grand_total, r.created_at 
FROM requisitions r
LEFT JOIN user_notification_seen uns 
  ON r.id = uns.requisition_id AND uns.user_id = ?
WHERE r.status = 'authorized' 
  AND r.requestor_email = ?
  AND (uns.is_seen = FALSE OR uns.is_seen IS NULL)
ORDER BY r.created_at DESC
```

---

#### 2. GET /api/requisitions/unsigned
**Purpose:** Fetch requisitions pending user's action

**Query Parameters:**
- `unseen` (optional): Filter only unseen notifications
- `user_id` (required): User ID for filtering

**Response:**
```json
{
  "success": true,
  "requisitions": [
    {
      "id": 87,
      "requestor_name": "John Doe",
      "department": "Science",
      "purpose": "Lab Equipment Purchase",
      "status": "pending",
      "signature_data": null,
      "reviewed_signature": null,
      "approved_signature": null,
      "authorized_signature": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### 3. POST /api/notifications/:id/seen
**Purpose:** Mark notification as seen

**URL Parameters:**
- `id`: Requisition ID

**Request Body:**
```json
{
  "user_id": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as seen"
}
```

**SQL Operation:**
```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (?, ?, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW()
```

---

## Database Schema

### user_notification_seen Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Purpose:**
- Tracks which users have seen which requisition notifications
- Prevents duplicate notifications
- Enables "Show Unseen Only" filtering

---

## User Experience Flow

### Scenario 1: Requester Gets Approval Notification

```
Step 1: User submits requisition
        ↓
Step 2: Requisition goes through workflow
        (review → approval → authorization)
        ↓
Step 3: Status becomes 'authorized'
        ↓
Step 4: Backend adds to user_notification_seen table
        (is_seen = FALSE)
        ↓
Step 5: Frontend polls every 30s
        ↓
Step 6: Nav badge appears: 🔔 1
        ↓
Step 7: User clicks bell
        ↓
Step 8: NotificationCenter opens
        Shows: "✓ Approved Requisitions"
        ↓
Step 9: User clicks requisition
        ↓
Step 10: Notification marked as seen
         Badge disappears
         Navigate to requisition details
```

---

### Scenario 2: Reviewer Gets Pending Action Notification

```
Step 1: New requisition submitted
        ↓
Step 2: User has 'reviewer' role
        ↓
Step 3: Appears in /api/requisitions/unsigned
        ↓
Step 4: Frontend polling detects it
        ↓
Step 5: Nav badge appears: 🔔 1
        ↓
Step 6: User clicks bell
        ↓
Step 7: NotificationCenter opens
        Shows: "⏰ Pending Your Action"
        ↓
Step 8: User clicks requisition
        ↓
Step 9: Notification marked as seen
         Opens requisition in view mode
         Can sign review section
```

---

## Role-Based Access

### Who Gets Notified About What

| User Type | Pending Action | When Approved |
|-----------|---------------|---------------|
| **Requester** | ❌ No | ✅ Yes |
| **Reviewer** | ✅ Yes (pending review) | ❌ No |
| **Approver** | ✅ Yes (pending approval) | ❌ No |
| **Authorizer** | ✅ Yes (pending authorization) | ❌ No |
| **Admin** | ✅ Yes (all types) | ✅ Yes (all) |

---

## Testing Guide

### Test 1: Verify Notification Badge Appears

**Steps:**
1. Login as standard user
2. Submit a requisition
3. Login as admin and approve it (sign all sections)
4. Login back as standard user
5. Wait up to 30 seconds
6. **Expected:** Red badge appears on bell icon

**Troubleshooting:**
- Check browser console for errors
- Verify `/api/requisitions/authorized` returns data
- Check `user_notification_seen` table for record

---

### Test 2: Verify Notification Click Works

**Steps:**
1. Click the bell icon
2. **Expected:** NotificationCenter panel opens
3. See your approved requisition listed
4. Click on the requisition card
5. **Expected:** 
   - Panel closes
   - Badge count decreases
   - Navigate to requisition details page

---

### Test 3: Verify Role-Based Notifications

**Setup:**
1. Create user with 'reviewer' role
2. Login as different user and submit requisition
3. Login as reviewer

**Expected:**
- Reviewer sees notification in "Pending Your Action" section
- Can click to open requisition
- Can sign the review section

---

## Common Issues & Solutions

### Issue 1: Badge Never Appears

**Possible Causes:**
- Frontend not polling (check console errors)
- API endpoint returning errors
- Email mismatch in query

**Solution:**
```javascript
// Check browser console
console.log('Current user email:', user.email);

// Test API directly
fetch('http://localhost:5000/api/requisitions/authorized?email=test@example.com')
  .then(r => r.json())
  .then(d => console.log('API Response:', d));
```

---

### Issue 2: Notification Doesn't Disappear After Click

**Possible Causes:**
- `/api/notifications/:id/seen` endpoint failing
- User ID missing from request
- Database constraint issue

**Solution:**
```sql
-- Manually mark as seen for testing
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (15, 87, TRUE, NOW())
ON DUPLICATE KEY UPDATE is_seen = TRUE;
```

---

### Issue 3: Duplicate Notifications

**Cause:** Same requisition appears multiple times

**Solution:**
```sql
-- Check for duplicates
SELECT user_id, requisition_id, COUNT(*) as count
FROM user_notification_seen
GROUP BY user_id, requisition_id
HAVING count > 1;

-- Clean up duplicates (keep latest)
DELETE uns1 FROM user_notification_seen uns1
INNER JOIN user_notification_seen uns2 
WHERE uns1.user_id = uns2.user_id 
  AND uns1.requisition_id = uns2.requisition_id 
  AND uns1.created_at > uns2.created_at;
```

---

## Quick Reference Commands

### Check Current Notifications
```sql
-- All unseen notifications for user
SELECT r.id, r.requestor_name, r.status, r.created_at
FROM requisitions r
LEFT JOIN user_notification_seen uns 
  ON r.id = uns.requisition_id AND uns.user_id = 15
WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
  AND r.status = 'authorized'
  AND r.requestor_email = 'user@example.com';
```

### Mark All as Seen
```sql
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
SELECT 15, id, TRUE, NOW() 
FROM requisitions 
WHERE requestor_email = 'user@example.com'
ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW();
```

### Reset All to Unseen (for testing)
```sql
UPDATE user_notification_seen 
SET is_seen = FALSE, seen_at = NULL 
WHERE user_id = 15;
```

---

## Files Involved

### Frontend:
- `src/layouts/StandardUserLayout.js` - Main layout with polling
- `src/components/Nav.js` - Displays notification badge
- `src/components/NotificationCenter.js` - Notification panel UI
- `src/components/Requisition/ViewRequisitionPage.js` - View requisition details

### Backend:
- `Backend/server.js` - API endpoints for notifications

### Database:
- `database/create_user_notification_seen_table.sql` - Table schema
- `database/mark_all_notifications_as_seen.sql` - Utility scripts
- `database/diagnose_notifications_not_disappearing.sql` - Debug queries

---

## Summary

✅ **Standard users with requisition roles get notifications based on their role**

✅ **Requesters get notified when their requisitions are approved**

✅ **Reviewers/Approvers/Authorizers get notified when action is needed**

✅ **Notifications appear in nav bar with count badge**

✅ **Clicking notification marks it as seen and navigates to requisition**

✅ **Polling every 30 seconds ensures real-time updates**

✅ **Database tracking prevents duplicate notifications**

---

## Next Steps for Enhancement

1. **Email Notifications** - Send email when requisition status changes
2. **Push Notifications** - Browser push for instant alerts
3. **Notification Preferences** - Let users choose what to be notified about
4. **Notification History** - Show all past notifications with pagination
5. **Bulk Actions** - Mark all as seen button

---

**Last Updated:** March 16, 2026  
**Status:** ✅ Fully Implemented and Working
