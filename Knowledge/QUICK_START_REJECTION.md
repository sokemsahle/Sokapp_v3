# Quick Start: Rejection Feature Setup

## 🚀 Quick Setup (3 Steps)

### Step 1: Update Database
Open a terminal/Command Prompt and run:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
ADD_REJECTION_FEATURE.bat
```

**OR** manually in phpMyAdmin:
1. Open phpMyAdmin
2. Select your database
3. Go to SQL tab
4. Copy & paste content from `database/add_rejection_support.sql`
5. Click "Go"

### Step 2: Restart Backend
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
npm start
```

### Step 3: Test It!
1. Login as admin or user with requisition role
2. Open any pending requisition
3. Click the red **"Reject Requisition"** button
4. Enter a rejection reason
5. Click **"Confirm Rejection"**
6. ✅ Done! Requester gets an email notification

---

## 📧 What Happens When You Reject?

1. **Requisition status** changes to "rejected"
2. **Email sent** to requester with:
   - Rejection reason
   - Who rejected it
   - When it was rejected
3. **Red banner** appears on the requisition showing rejection details

---

## 👥 Who Can Reject Requisitions?

✅ **Can Reject:**
- Reviewers
 Approvers
- Authorizers
- Admins

❌ **Cannot Reject:**
- Standard users (no requisition role)
- Finance personnel only
- The person who created the requisition

---

## 🎯 Features Added

### 1. Reject Button (Red)
- Only visible to authorized users
- Located next to Submit button
- Opens rejection modal

### 2. Rejection Modal
- Requires a reason (mandatory)
- Cancel option available
- Confirms before rejecting

### 3. Rejection Banner
- Shows on rejected requisitions
- Displays:
  - ❌ "This Requisition Has Been Rejected"
  - Reason for rejection
  - Who rejected it
  - When it was rejected

---

## 📝 Example Email Content

```
Subject: ✗ Your Requisition Has Been Rejected - #123

✗ Requisition Rejected

Hello John Doe,

We regret to inform you that your requisition has been rejected.

[REJECTED]

Reason for Rejection:
The budget allocation for this department has been exceeded. 
Please review and resubmit with reduced quantities.

Requisition ID: #123
Department: Program
Total Amount: 5000.00 Birr
Rejected By: Jane Smith (Finance Manager)

[View Requisition Details]
```

---

## 🔧 Troubleshooting

**Problem**: Don't see the Reject button
- Check if you have a requisition role (reviewer/approver/authorizer) or are admin
- Refresh the page

**Problem**: Database error
- Run the SQL script again
- Check if MySQL server is running

**Problem**: Email not received
- Check spam folder
- Verify email settings in backend `.env` file

---

## 📁 Files Changed

**Backend:**
- `Backend/server.js` ← New reject endpoint added

**Frontend:**
- `src/components/Requisition/Requisition.js` ← Rejection UI added

**Database:**
- `database/add_rejection_support.sql` ← Migration script
- `database/ADD_REJECTION_FEATURE.bat` ← Easy setup script

**Docs:**
- `REQUISITION_REJECTION_FEATURE.md` ← Full documentation

---

## ✅ Testing Checklist

Test the feature works correctly:

- [ ] Database updated successfully
- [ ] Reject button visible (for authorized users)
- [ ] Reject button hidden (for unauthorized users)
- [ ] Modal opens when clicking Reject
- [ ] Cannot submit without entering reason
- [ ] Confirmation shows success message
- [ ] Requester receives email notification
- [ ] Rejection banner displays on requisition
- [ ] All details saved in database

---

## 🎉 That's It!

The rejection feature is now fully implemented. Users with proper roles can reject requisitions with reasons, and requesters will receive automated email notifications.

For detailed documentation, see `REQUISITION_REJECTION_FEATURE.md`.
