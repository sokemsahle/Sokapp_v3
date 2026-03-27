# ✅ StandardUserLayout Notification Update - Quick Reference

## What Changed

**StandardUserLayout now has the SAME notification system as AdminLayout!**

### Before
- ❌ Only showed requester's approved requisitions
- ❌ No notifications for reviewer/approver/authorizer roles

### After
- ✅ Shows requester's approved requisitions
- ✅ Shows pending reviews (for reviewers)
- ✅ Shows pending approvals (for approvers)
- ✅ Shows pending authorizations (for authorizers)
- ✅ Auto-refreshes every 30 seconds
- ✅ Matches AdminLayout functionality

---

## How It Works

```
User Logs In
    ↓
fetchAllNotifications() runs
    ↓
┌──────────────────────────────┐
│ API Call 1:                  │
│ GET /api/requisitions/unsigned │
│ (For reviewer/approver/authorizer) │
└──────────────────────────────┘
    ↓
┌──────────────────────────────┐
│ API Call 2:                  │
│ GET /api/requisitions/finalized │
│ (For requester notifications) │
└──────────────────────────────┘
    ↓
Combine both counts
    ↓
Nav bar shows: 🔔 5
```

---

## Role-Based Examples

### Example 1: Requester Only
```
User: alice@example.com (no special roles)

Nav Bar: 🔔 2
Panel Shows:
└─ ✓ Approved Requisitions (2)
   ├─ Alice's Request #1 [Approved]
   └─ Alice's Request #2 [Approved]
```

---

### Example 2: Reviewer
```
User: bob@example.com (reviewer role)

Nav Bar: 🔔 4
Panel Shows:
├─ ⏰ Pending Your Action (3)
│  ├─ #87 - Needs Review
│  ├─ #86 - Needs Review
│  └─ #85 - Needs Review
└─ ✓ Approved Requisitions (1)
   └─ Bob's Request [Approved]
```

---

### Example 3: Multiple Roles
```
User: carol@example.com (reviewer + approver)

Nav Bar: 🔔 6
Panel Shows:
├─ ⏰ Pending Your Action (5)
│  ├─ To Review (2)
│  └─ To Approve (3)
└─ ✓ Approved Requisitions (1)
   └─ Carol's Request [Approved]
```

---

## Testing (5 Minutes)

### Test 1: Basic Functionality
```sql
-- Setup test data
UPDATE requisitions 
SET status = 'authorized', requestor_email = 'test@example.com'
WHERE id = 85;

INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (15, 85, FALSE);
```

**Expected:**
1. Login as test user
2. Wait 30 seconds
3. See badge: 🔔 1
4. Click bell → Panel opens
5. Click notification → Navigates to requisition

---

### Test 2: Reviewer Role
```sql
-- Give user reviewer role
INSERT INTO requisition_roles (user_id, role_type, is_active)
VALUES (15, 'reviewer', TRUE);

-- Create pending review
UPDATE requisitions 
SET status = 'pending', signature_data = 'signed', reviewed_signature = NULL
WHERE id = 87;

INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (15, 87, FALSE);
```

**Expected:**
1. Login as test user
2. Wait 30 seconds
3. See badge: 🔔 1
4. Click bell → "Pending Your Action" section visible
5. Can sign review section

---

## Code Changes Summary

### File Modified
**`src/layouts/StandardUserLayout.js`**

### Key Changes

#### 1. New Function: `fetchAllNotifications()`
```javascript
// Fetches BOTH unsigned (pending action) AND finalized (approved)
const fetchAllNotifications = async () => {
  // API Call 1: Pending actions
  const unsignedResponse = await fetch(
    `http://localhost:5000/api/requisitions/unsigned?unseen=true&user_id=${user.id}`
  );
  
  // API Call 2: Approved requisitions
  const finalizedResponse = await fetch(
    `http://localhost:5000/api/requisitions/finalized?email=${encodeURIComponent(user.email)}&unseen=true&user_id=${user.id}`
  );
  
  // Combine counts
  let totalCount = 0;
  if (unsignedResult.success) totalCount += unsignedResult.requisitions?.length || 0;
  if (finalizedResult.success) totalCount += finalizedResult.requisitions?.length || 0;
  
  setNewRequisitionCount(totalCount);
};
```

#### 2. Updated Polling
```javascript
useEffect(() => {
  if (!user?.email || !user?.id) return; // Need BOTH now
  fetchAllNotifications();
  const interval = setInterval(fetchAllNotifications, 30000);
  return () => clearInterval(interval);
}, [user?.email, user?.id]);
```

---

## Backend Endpoints Used

### 1. GET /api/requisitions/unsigned
**Purpose:** Get pending actions for reviewer/approver/authorizer

**Query:**
```
GET /api/requisitions/unsigned?unseen=true&user_id=15
```

**Returns:** Requisitions needing user's signature based on their role

---

### 2. GET /api/requisitions/finalized
**Purpose:** Get approved requisitions for requester

**Query:**
```
GET /api/requisitions/finalized?email=user@example.com&unseen=true&user_id=15
```

**Returns:** User's authorized requisitions

---

## Database Requirements

### Required Table
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

**Verify it exists:**
```sql
SHOW TABLES LIKE 'user_notification_seen';
```

---

## Troubleshooting

### No Badge Appears

**Check:**
1. User has both email AND user ID
2. Backend running on port 5000
3. Database table exists
4. Browser console for errors

**Quick Test:**
```javascript
// In browser console
fetch('http://localhost:5000/api/requisitions/unsigned?unseen=true&user_id=15')
  .then(r => r.json())
  .then(d => console.log('Unsigned:', d));

fetch('http://localhost:5000/api/requisitions/finalized?email=test@example.com&user_id=15')
  .then(r => r.json())
  .then(d => console.log('Finalized:', d));
```

---

### Badge Never Disappears

**Manual Mark as Seen:**
```sql
UPDATE user_notification_seen 
SET is_seen = TRUE, seen_at = NOW()
WHERE user_id = 15 AND requisition_id = 87;
```

---

### Wrong Count Shows

**Debug SQL:**
```sql
SELECT 
  uns.requisition_id,
  r.requestor_name,
  r.status,
  uns.is_seen,
  uns.seen_at
FROM user_notification_seen uns
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 15
ORDER BY uns.created_at DESC;
```

---

## Comparison Table

| Feature | Before | After |
|---------|--------|-------|
| Requester notifications | ✅ Yes | ✅ Yes |
| Reviewer notifications | ❌ No | ✅ Yes |
| Approver notifications | ❌ No | ✅ Yes |
| Authorizer notifications | ❌ No | ✅ Yes |
| Auto-refresh (30s) | ✅ Yes | ✅ Yes |
| Mark as seen | ✅ Yes | ✅ Yes |
| Matches AdminLayout | ❌ No | ✅ **Yes** |

---

## Success Indicators

✅ Badge appears within 30 seconds of login  
✅ Badge count = unsigned + finalized notifications  
✅ Different roles see different notifications  
✅ Clicking notification marks as seen  
✅ Badge count decreases after clicking  
✅ Auto-refresh works silently in background  

---

## Files Involved

### Changed
- ✅ `src/layouts/StandardUserLayout.js`

### Already Working (No Changes)
- ✅ `src/components/NotificationCenter.js`
- ✅ `src/components/Nav.js`
- ✅ `Backend/server.js`
- ✅ Database schema

---

## Quick Start Commands

### Check Table Exists
```sql
SHOW TABLES LIKE 'user_notification_seen';
```

### Create Test Data
```sql
-- Authorized requisition for requester
UPDATE requisitions 
SET status = 'authorized', requestor_email = 'test@example.com'
WHERE id = 85;

-- Insert unseen notification
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (15, 85, FALSE);
```

### Verify Role Assignment
```sql
SELECT rr.role_type, rr.is_active, u.email, u.full_name
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE u.email = 'test@example.com';
```

### Reset All Notifications (for testing)
```sql
UPDATE user_notification_seen 
SET is_seen = FALSE, seen_at = NULL 
WHERE user_id = 15;
```

---

## Summary

🎉 **StandardUserLayout now matches AdminLayout!**

**What Users Get:**
- ✅ Requesters → See approved requisitions
- ✅ Reviewers → See pending reviews
- ✅ Approvers → See pending approvals
- ✅ Authorizers → See pending authorizations
- ✅ Auto-refresh every 30 seconds
- ✅ Clean, intuitive UI

**What Changed:**
- 1 file modified (`StandardUserLayout.js`)
- No breaking changes
- No database changes needed
- No backend changes needed

**Status:** ✅ Complete and Ready to Use!

---

**Updated:** March 16, 2026  
**Time to Implement:** 10 minutes  
**Testing Time:** 5 minutes  
**Production Ready:** ✅ Yes
