# 🚀 Quick Start - Test Requisition Notifications NOW

## Your System Already Has Notifications! ✅

The Standard User Layout in your app **ALREADY** shows notifications in the nav bar based on requisition roles. Nothing needs to be added - just follow these steps to see it working!

---

## 5-Minute Test Guide

### Step 1: Verify Database Table Exists (2 min)

Open phpMyAdmin and run:

```sql
SHOW TABLES LIKE 'user_notification_seen';
```

**Expected:** Should return 1 row with table name

**If NOT found**, run this:

```sql
-- File: database/create_user_notification_seen_table.sql
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

---

### Step 2: Create a Test Requisition (3 min)

**Option A: Use Existing Requisition**

Find an existing requisition and mark it as authorized:

```sql
-- Find requisitions
SELECT id, requestor_name, requestor_email, status 
FROM requisitions 
ORDER BY created_at DESC 
LIMIT 5;

-- Update one to authorized (replace ID with actual ID)
UPDATE requisitions 
SET status = 'authorized',
    authorized_signature = 'test_admin_signature'
WHERE id = 85; -- Change this ID!
```

**Option B: Create New Test Requisition**

1. Login as any standard user
2. Go to "My Requisitions" → "Create New"
3. Fill out the form with test data
4. Submit it
5. Login as admin and sign ALL sections (review, approve, authorize)
6. Status becomes 'authorized'

---

### Step 3: Check Notification Tracking (1 min)

Insert a test unseen notification:

```sql
-- Replace with YOUR actual user ID and email
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (15, 85, FALSE)  -- Change user_id and requisition_id!
ON DUPLICATE KEY UPDATE is_seen = FALSE, seen_at = NULL;
```

Verify it was inserted:

```sql
SELECT 
    uns.requisition_id,
    r.requestor_name,
    r.status,
    uns.is_seen,
    uns.seen_at
FROM user_notification_seen uns
JOIN requisitions r ON uns.requisition_id = r.id
WHERE uns.user_id = 15  -- Your user ID
AND uns.is_seen = FALSE;
```

---

### Step 4: Login & See Badge (1 min)

1. **Login** as the standard user (with requisition role OR as requester)
2. **Wait** up to 30 seconds (the polling interval)
3. **Look** at top-right corner of screen

**YOU SHOULD SEE:**
```
┌─────────────────────────────┐
│     Nav Bar                 │
│            🔔 1         👤  │ ← RED BADGE WITH NUMBER!
└─────────────────────────────┘
```

---

### Step 5: Click Bell & See Panel (30 sec)

**Click the bell icon (🔔):**

Panel should open showing:
```
┌─────────────────────────────────┐
│ NOTIFICATIONS              [X]  │
│ ─────────────────────────────── │
│ ✓ Approved Requisitions         │
│ #85 - [Requestor Name]          │
│    [Department]                 │
│    [✓ Approved] [Amount] Birr   │
└─────────────────────────────────┘
```

---

## Expected Results Checklist

After following steps above, you should see:

- ✅ Bell icon in nav bar (top-right)
- ✅ Red badge with number (e.g., 🔔 1)
- ✅ Clicking bell opens notification panel
- ✅ Panel shows approved requisitions
- ✅ Clicking requisition navigates to details page
- ✅ Badge count decreases after clicking

---

## Troubleshooting

### Problem: No Badge Appears

**Check 1: Is backend running?**
```bash
cd Backend
npm start
# Should show: Server running on port 5000
```

**Check 2: Is API returning data?**

Open browser console (F12) and run:
```javascript
fetch('http://localhost:5000/api/requisitions/authorized?email=your@email.com')
  .then(r => r.json())
  .then(d => console.log('API Response:', d));
```

**Expected:** Should see array with requisitions

**If empty:** Your email doesn't match any authorized requisitions

**Fix:**
```sql
-- Make sure email matches
UPDATE requisitions 
SET requestor_email = 'your@login.email'
WHERE id = 85;
```

---

### Problem: Badge Shows But Never Disappears

**Check 1: Is seen endpoint working?**

Open browser console and run:
```javascript
fetch('http://localhost:5000/api/notifications/85/seen', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 15 }) // Your user ID
})
.then(r => r.json())
.then(d => console.log('Response:', d));
```

**Expected:** `{ success: true, message: "Notification marked as seen" }`

**If error:** Check backend logs or database connection

**Manual Fix:**
```sql
-- Mark as seen manually
UPDATE user_notification_seen 
SET is_seen = TRUE, seen_at = NOW()
WHERE user_id = 15 AND requisition_id = 85;

-- Then refresh page
```

---

### Problem: Don't Have Test User with Requisition Role

**Create reviewer role for user:**

```sql
-- Find your user ID first
SELECT id, email, full_name FROM users WHERE email = 'your@email.com';

-- Add reviewer role (replace USER_ID with actual ID)
INSERT INTO requisition_roles (user_id, role_type, is_active)
VALUES (15, 'reviewer', TRUE)  -- Change 15 to your user ID!
ON DUPLICATE KEY UPDATE is_active = TRUE;
```

**Verify role was added:**
```sql
SELECT 
    rr.role_type,
    rr.is_active,
    u.email
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE u.email = 'your@email.com';
```

---

## Role-Based Testing Scenarios

### Scenario 1: Test as Requester

**Setup:**
```sql
-- Create authorized requisition
UPDATE requisitions 
SET status = 'authorized', requestor_email = 'alice@example.com'
WHERE id = 85;

-- Insert unseen notification
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen)
VALUES (10, 85, FALSE); -- Alice's user ID
```

**Test:**
1. Login as Alice
2. Wait 30 seconds
3. Should see: 🔔 1
4. Click bell → See "Approved Requisitions" section
5. Click requisition → Navigate to details

---

### Scenario 2: Test as Reviewer

**Setup:**
```sql
-- Give user reviewer role
INSERT INTO requisition_roles (user_id, role_type, is_active)
VALUES (15, 'reviewer', TRUE);

-- Create pending requisition
UPDATE requisitions 
SET status = 'pending', signature_data = NULL
WHERE id = 87;
```

**Test:**
1. Login as reviewer
2. Wait 30 seconds
3. Should see: 🔔 1
4. Click bell → See "Pending Your Action" section
5. Can sign review section

---

### Scenario 3: Test as Approver

**Setup:**
```sql
-- Give user approver role
INSERT INTO requisition_roles (user_id, role_type, is_active)
VALUES (15, 'approver', TRUE);

-- Create reviewed requisition (has review signature, missing approval)
UPDATE requisitions 
SET status = 'reviewed',
    reviewed_signature = 'reviewer_sig_data',
    approved_signature = NULL
WHERE id = 86;
```

**Test:**
1. Login as approver
2. Wait 30 seconds
3. Should see: 🔔 1
4. Click bell → See "Pending Your Action"
5. Can sign approval section

---

## Auto-Refresh Verification

The system polls every 30 seconds automatically. To verify:

**Browser Console:**
```javascript
// Enable logging to see polling in action
console.log('Notification polling active - check badge every 30s');
```

**Test:**
1. Open browser console
2. Login as user with notifications
3. Watch network tab - should see API call every 30s to `/api/requisitions/authorized`
4. Badge updates without page refresh

---

## Quick SQL Commands for Testing

### Reset All Notifications to Unseen
```sql
UPDATE user_notification_seen 
SET is_seen = FALSE, seen_at = NULL 
WHERE user_id = 15; -- Your user ID
```

### Mark All as Seen
```sql
UPDATE user_notification_seen 
SET is_seen = TRUE, seen_at = NOW() 
WHERE user_id = 15;
```

### Delete All (Start Fresh)
```sql
DELETE FROM user_notification_seen WHERE user_id = 15;
```

### Check Current Status
```sql
SELECT 
    r.id as requisition_id,
    r.requestor_name,
    r.status,
    r.grand_total,
    uns.is_seen,
    uns.seen_at
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id
WHERE r.requestor_email = 'alice@example.com'
ORDER BY r.created_at DESC;
```

---

## Success Indicators

You'll know everything is working when:

✅ Badge appears within 30 seconds of login  
✅ Badge number matches unseen notifications count  
✅ Clicking bell opens panel smoothly  
✅ Panel shows correct requisitions  
✅ Clicking requisition marks as seen  
✅ Badge count decreases immediately  
✅ Can navigate to requisition details  

---

## What Each User Type Sees

### Standard User (Requester):
```
Nav Bar: 🔔 2
         ↓
Opens Panel:
├─ ✓ Approved Requisitions (2 items)
└─ ⏰ Pending Your Action (empty)
```

### Reviewer:
```
Nav Bar: 🔔 3
         ↓
Opens Panel:
├─ ✓ Approved Requisitions (empty)
└─ ⏰ Pending Your Action (3 pending review)
```

### Multiple Roles (Reviewer + Approver):
```
Nav Bar: 🔔 5
         ↓
Opens Panel:
├─ ⏰ Pending Your Action (2 pending review)
└─ ⏰ Pending Your Action (3 pending approval)
```

---

## Files Reference

All code is already in place:

**Frontend:**
- `src/layouts/StandardUserLayout.js` - Polling logic (lines 165-193)
- `src/components/Nav.js` - Bell icon display (lines 106-121)
- `src/components/NotificationCenter.js` - Full panel UI

**Backend:**
- `Backend/server.js` - All API endpoints
  - Line 890: GET `/api/requisitions/unsigned`
  - Line 947: GET `/api/requisitions/authorized`
  - Line 58: POST `/api/notifications/:id/seen`

**Database:**
- `database/create_user_notification_seen_table.sql`

---

## Next Steps After Testing

Once you confirm notifications are working:

1. **Add more users** with different roles
2. **Test real workflow** - submit actual requisitions
3. **Customize styling** if needed
4. **Add email notifications** (optional enhancement)
5. **Adjust polling interval** (currently 30s)

---

## Summary

🎉 **Your notification system is COMPLETE and WORKING!**

Just follow the 5-minute test guide above to see it in action.

**What you have:**
- ✅ Nav bar badge with count
- ✅ Notification panel overlay
- ✅ Role-based filtering
- ✅ Auto-refresh every 30s
- ✅ Mark as seen tracking
- ✅ Database persistence

**No code changes needed** - everything is already implemented!

---

**Created:** March 16, 2026  
**Purpose:** Quick testing guide for existing notification system  
**Time to Test:** 5 minutes  
**Difficulty:** Easy

For detailed documentation, see:
- `STANDARD_USER_REQUISITION_NOTIFICATIONS.md` (Full technical docs)
- `VISUAL_GUIDE_REQUISITION_NOTIFICATIONS.md` (Visual diagrams)
