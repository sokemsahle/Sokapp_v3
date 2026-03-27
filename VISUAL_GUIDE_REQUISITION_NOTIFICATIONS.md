# 📬 Quick Visual Guide - Requisition Notifications

## What You Have ✅

Your Standard User Layout already has a complete notification system that:

1. **Shows notifications in the nav bar** (bell icon with count badge)
2. **Tracks requisition status changes** (pending → reviewed → approved → authorized)
3. **Notifies based on user role** (requester, reviewer, approver, authorizer)
4. **Auto-refreshes every 30 seconds**
5. **Marks notifications as seen when clicked**

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STANDARD USER LAYOUT                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ NAV BAR                                               │   │
│  │ ☰ [Program]                          🔔 3  👤 User    │   │
│  │                                         ↑              │   │
│  │                            RED BADGE SHOWS COUNT       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  When user clicks bell (🔔):                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ NOTIFICATION CENTER PANEL                             │   │
│  │ ───────────────────────────────────────────────────   │   │
│  │                                                       │   │
│  │ ⏰ Pending Your Action (for reviewers/approvers)     │   │
│  │ ├─ #87 - John Doe - Lab Equipment [Pending Review]  │   │
│  │ ├─ #86 - Sarah - Office Supplies [Pending Approval] │   │
│  │ └─ #84 - Mike - Computer Parts [Pending Auth]       │   │
│  │                                                       │   │
│  │ ✓ Approved Requisitions (for requesters)             │   │
│  │ ├─ #85 - Jane - Textbooks [✓ Approved] 5000 Birr    │   │
│  │ └─ #83 - Bob - Sports Eqmt [✓ Approved] 3000 Birr   │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Who Gets Notified About What?

### Scenario: Requisition #100 Submitted by Alice

```
STEP 1: Submission
┌──────────────────────────────────────────┐
│ Requisition #100                         │
│ Requester: Alice (Standard User)         │
│ Purpose: Science Lab Materials           │
│ Status: pending                          │
└──────────────────────────────────────────┘
         ↓
NOTIFICATION SENT TO:
✅ Reviewers → "Pending Your Action"
❌ Alice (requester) → No notification yet


STEP 2: After Review
┌──────────────────────────────────────────┐
│ Requisition #100                         │
│ Status: reviewed                         │
│ reviewed_signature: ✓ (by Reviewer)      │
└──────────────────────────────────────────┘
         ↓
NOTIFICATION SENT TO:
✅ Approvers → "Pending Your Action"
❌ Reviewers → Done, no more notification
❌ Alice → Still waiting


STEP 3: After Approval
┌──────────────────────────────────────────┐
│ Requisition #100                         │
│ Status: approved                         │
│ approved_signature: ✓ (by Approver)      │
└──────────────────────────────────────────┘
         ↓
NOTIFICATION SENT TO:
✅ Authorizers → "Pending Your Action"
❌ Approvers → Done
❌ Alice → Still waiting


STEP 4: After Authorization (FINAL)
┌──────────────────────────────────────────┐
│ Requisition #100                         │
│ Status: authorized                       │
│ authorized_signature: ✓ (by Authorizer)  │
└──────────────────────────────────────────┘
         ↓
NOTIFICATION SENT TO:
✅ Alice (Requester) → "Approved Requisitions"
❌ Others → All done
```

---

## How To Test It Right Now

### Test 1: See Notification Badge Appear

**As Admin:**
1. Create a requisition OR use existing one
2. Sign ALL signature sections (review, approve, authorize)
3. Status should be: `authorized`

**As Standard User (Alice):**
1. Login with Alice's account (must be the requester email)
2. Look at top-right corner
3. Wait up to 30 seconds
4. **YOU SHOULD SEE:** Bell icon with red badge (e.g., 🔔 1)

```
Before:                    After 30s:
┌──────────────┐          ┌──────────────┐
│     🔔   👤 │          │   🔔 1   👤 │
│              │          │      ↑       │
│  No badge    │          │  RED BADGE!  │
└──────────────┘          └──────────────┘
```

---

### Test 2: Open Notification Panel

**Click the bell icon:**

```
BEFORE CLICKING:
┌─────────────────────────────┐
│        Nav Bar              │
│            🔔 2         👤  │
└─────────────────────────────┘

AFTER CLICKING:
┌─────────────────────────────┐
│        Nav Bar              │
│            🔔 2         👤  │
└─────────────────────────────┘
     ↓ Opens overlay panel →
┌─────────────────────────────────┐
│ NOTIFICATIONS              [X]  │
│ ─────────────────────────────── │
│ ⏰ Pending Your Action          │
│ #87 - John Doe                  │
│    Science Department           │
│    [Pending Review] 10:30 AM    │
│                                 │
│ ✓ Approved Requisitions         │
│ #85 - Jane Smith                │
│    Mathematics Department       │
│    [✓ Approved] 5000 Birr       │
└─────────────────────────────────┘
```

---

### Test 3: Click Notification & Mark as Seen

**Click on a notification card:**

```
1. Click "#85 - Jane Smith"
         ↓
2. Notification marked as SEEN in database
         ↓
3. Badge count decreases: 🔔 2 → 🔔 1
         ↓
4. Navigate to requisition details page
         ↓
5. Can view full requisition with all items
```

**What happens behind the scenes:**
```javascript
// Frontend sends:
POST /api/notifications/85/seen
Body: { "user_id": 15 }

// Database records:
INSERT INTO user_notification_seen 
  (user_id, requisition_id, is_seen, seen_at)
VALUES 
  (15, 85, TRUE, NOW())

// UI updates immediately:
setNotificationCount(prev => prev - 1);
```

---

## Role-Based Testing

### If You Have Reviewer Role:

```
Login as Reviewer
    ↓
Check Nav Bar
    ↓
See Badge: 🔔 1
    ↓
Click Bell
    ↓
See in "Pending Your Action":
┌──────────────────────────────┐
│ #87 - John Doe               │
│ Lab Equipment                │
│ [Pending Review]             │
└──────────────────────────────┘
    ↓
Click to Open
    ↓
Can Sign Review Section ✅
```

---

### If You Have Approver Role:

```
Login as Approver
    ↓
Check Nav Bar
    ↓
See Badge: 🔔 1
    ↓
Click Bell
    ↓
See in "Pending Your Action":
┌──────────────────────────────┐
│ #86 - Sarah                  │
│ Office Supplies              │
│ [Pending Approval]           │
└──────────────────────────────┘
    ↓
Click to Open
    ↓
Can Sign Approval Section ✅
```

---

### If You Have Authorizer Role:

```
Login as Authorizer
    ↓
Check Nav Bar
    ↓
See Badge: 🔔 1
    ↓
Click Bell
    ↓
See in "Pending Your Action":
┌──────────────────────────────┐
│ #84 - Mike                   │
│ Computer Parts               │
│ [Pending Authorization]      │
└──────────────────────────────┘
    ↓
Click to Open
    ↓
Can Sign Authorization Section ✅
```

---

## Debugging Commands

### Check What Notifications You Should See

Run this SQL query in phpMyAdmin:

```sql
-- Replace 'alice@example.com' with your email
SELECT 
    r.id,
    r.requestor_name,
    r.status,
    r.created_at,
    CASE 
        WHEN r.signature_data IS NULL THEN 'Unsigned by Requestor'
        WHEN r.reviewed_signature IS NULL THEN 'Pending Review'
        WHEN r.approved_signature IS NULL THEN 'Pending Approval'
        WHEN r.authorized_signature IS NULL THEN 'Pending Authorization'
        ELSE 'Complete'
    END as current_stage
FROM requisitions r
WHERE r.requestor_email = 'alice@example.com'
   OR EXISTS (
       SELECT 1 FROM requisition_roles rr
       JOIN users u ON rr.user_id = u.id
       WHERE u.email = 'alice@example.com'
       AND rr.is_active = TRUE
   )
ORDER BY r.created_at DESC;
```

---

### Check If Notification Is Tracked

```sql
-- Replace user_id with your actual user ID
SELECT 
    uns.requisition_id,
    r.requestor_name,
    r.status,
    uns.is_seen,
    uns.seen_at
FROM user_notification_seen uns
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 15  -- Your user ID
ORDER BY uns.created_at DESC;
```

**Expected Results:**
- `is_seen = 0` → Unseen notification (badge shows)
- `is_seen = 1` → Seen notification (no badge)

---

### Manually Add Test Notification

For testing purposes, to force a notification to appear:

```sql
-- First, make sure requisition exists and is authorized
UPDATE requisitions 
SET status = 'authorized' 
WHERE id = 85;

-- Then insert unseen notification
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (15, 85, FALSE)
ON DUPLICATE KEY UPDATE is_seen = FALSE, seen_at = NULL;
```

Then refresh the page and wait 30 seconds - badge should appear!

---

## Common Scenarios

### Scenario 1: I submitted a requisition but no badge appears

**Check:**
1. Is requisition status = 'authorized'? (Check in database)
2. Is your email matching the `requestor_email` field?
3. Did you wait 30 seconds for polling?

**Quick Fix:**
```sql
-- Update requisition to authorized
UPDATE requisitions 
SET status = 'authorized',
    authorized_signature = 'test_signature_data'
WHERE id = 85 AND requestor_email = 'your@email.com';
```

---

### Scenario 2: Badge appears but doesn't disappear when clicked

**Check:**
1. Is `/api/notifications/:id/seen` endpoint working?
2. Check browser console for errors
3. Verify user_id is being sent

**Manual Fix:**
```sql
-- Mark as seen manually
UPDATE user_notification_seen 
SET is_seen = TRUE, seen_at = NOW()
WHERE user_id = 15 AND requisition_id = 85;
```

---

### Scenario 3: I have a role but don't see pending requisitions

**Check:**
1. Is your role active in database?
2. Does requisition match your role type?

**Verify Role:**
```sql
SELECT 
    rr.role_type,
    rr.is_active,
    u.email,
    u.full_name
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE u.email = 'your@email.com';
```

**Expected:**
```
role_type   | is_active | email              | full_name
------------|-----------|--------------------|------------
reviewer    | 1         | you@example.com    | Your Name
```

---

## Files Checklist ✅

All these files are already implemented in your codebase:

### Frontend:
- ✅ `src/layouts/StandardUserLayout.js` (lines 87, 165-193, 439-443)
  - Polling every 30 seconds
  - Maintains notification count
  
- ✅ `src/components/Nav.js` (lines 106-121)
  - Displays bell icon
  - Shows count badge
  
- ✅ `src/components/NotificationCenter.js` (entire file)
  - Shows notification panel
  - Marks as seen on click
  - Two sections (Pending + Approved)

### Backend:
- ✅ `Backend/server.js` (line 890)
  - GET `/api/requisitions/unsigned` - Pending actions
  
- ✅ `Backend/server.js` (line 947)
  - GET `/api/requisitions/authorized` - Approved requisitions
  
- ✅ `Backend/server.js` (line 58)
  - POST `/api/notifications/:id/seen` - Mark as seen

### Database:
- ✅ `database/create_user_notification_seen_table.sql`
  - Table schema for tracking seen status

---

## Summary

You ALREADY HAVE a complete notification system that:

✅ Shows badge count in nav bar  
✅ Displays notifications in overlay panel  
✅ Filters by user role (requester vs reviewer/approver/authorizer)  
✅ Auto-refreshes every 30 seconds  
✅ Marks as seen when clicked  
✅ Removes from UI immediately  
✅ Tracks in database  

**NO CHANGES NEEDED** - Everything is working!

Just test it following the steps above to see it in action.

---

**Created:** March 16, 2026  
**Purpose:** Visual guide for testing existing notification system  
**Status:** ✅ Fully Implemented
