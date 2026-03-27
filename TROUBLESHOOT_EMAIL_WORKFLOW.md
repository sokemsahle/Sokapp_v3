# Troubleshooting: Email Notifications Not Working

## Quick Diagnosis

### ✅ Your Setup Looks Correct!

Based on the test results:
- ✓ Finance team: 1 member (sahlesokem606@gmail.com)
- ✓ Approvers: 2 members configured
- ✓ Authorizers: 1 member (Kebede - sahlesokem30@gmail.com)
- ✓ Brevo API key configured
- ✓ Sender email verified (sahlesokem@gmail.com)
- ✓ Recent requisitions exist with all signatures

## The Problem: Workflow Trigger Logic

The issue is that when you **edit** an existing requisition and add signatures, the workflow might not detect them as "new" if they're being updated along with other changes.

### Root Cause Analysis

When you click "Update Requisition" in edit mode after adding signatures:

**Scenario:**
1. Original state: `reviewed=null`, `approved=null`, `authorized=null`
2. You add all 3 signatures at once
3. Updated state: `reviewed="data:..."`, `approved="data:..."`, `authorized="data:..."`

**Expected behavior:**
```javascript
isNewReview = true       // null → data:  ✓
isNewApproval = true     // null → data:  ✓
isNewAuthorization = true // null → data:  ✓

All 3 stages should trigger!
```

**But if there's an issue:**
The original fetch might be getting updated values instead of original values due to transaction timing.

## Solution Applied

I've already fixed the order of operations in `Backend/server.js`:

**BEFORE (WRONG):**
```javascript
// Line 980-983: UPDATE first
await connection.execute('UPDATE requisitions SET ...');

// Line 986-990: Fetch ORIGINAL (but it's already updated!)
const [originalRequisitionRows] = await connection.execute(
    'SELECT reviewed_signature, approved_signature, authorized_signature FROM requisitions WHERE id = ?',
    [requisitionId]
);
```

**AFTER (CORRECT):**
```javascript
// Line 979-984: Fetch ORIGINAL BEFORE update
const [originalRequisitionRows] = await connection.execute(
    'SELECT reviewed_signature, approved_signature, authorized_signature FROM requisitions WHERE id = ?',
    [requisitionId]
);
const originalRequisition = originalRequisitionRows[0];

// Line 986-989: UPDATE after fetching original
await connection.execute('UPDATE requisitions SET ...');
```

This ensures we get the TRUE original state before any changes!

## How to Test If It's Working

### Method 1: Watch Backend Console Logs

1. **Start backend server** (if not already running)
   ```bash
   cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
   npm start
   ```

2. **Open a requisition in edit mode**
   - Go to `http://localhost:3000/user/my-requisitions/:id`
   - Click "Edit Requisition"

3. **Add all three signatures**
   - Fill in: Reviewed By, Approved By, Authorized By
   - Add signatures for all three sections
   - Click "Update Requisition"

4. **Watch the backend console output**

**Expected output if working:**
```
POST http://localhost:5000/api/requisition/89 200
DEBUG: Checking if we should send workflow notifications...
DEBUG: Original reviewed_signature = NULL
DEBUG: Original approved_signature = NULL
DEBUG: Original authorized_signature = NULL
DEBUG: Updated reviewed_signature = EXISTS
DEBUG: Updated approved_signature = EXISTS
DEBUG: Updated authorized_signature = EXISTS
DEBUG: New review signature? true
DEBUG: New approval signature? true
DEBUG: New authorization signature? true
✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
Fetching active approvers from database...
Found 2 active approvers
Processing approver: yilkal sahle (sokem@shamidaethiopia.com)
Attempting to send approval notification to: sokem@shamidaethiopia.com (yilkal sahle)
✓ Approval notification sent successfully to sokem@shamidaethiopia.com
✓ STAGE 2: NEW approver signature detected, sending notifications to authorizers...
✓ STAGE 3: NEW authorization signature detected - Requisition AUTHORIZED, sending notifications to requester and finance...
Sending finalization notification to requester: sahlesokem@gmail.com
Fetching active finance personnel from database...
Found 1 active finance personnel
Processing finance: Test User (sahlesokem606@gmail.com)
✓ Email sent successfully to sahlesokem@gmail.com
✓ Email sent successfully to sahlesokem606@gmail.com
```

**If NOT working, you'll see:**
```
DEBUG: New review signature? false
DEBUG: New approval signature? false
DEBUG: New authorization signature? false
(No stage execution messages)
```

### Method 2: Check Email Delivery in Brevo

1. Go to https://app.brevo.com/
2. Login to your account
3. Navigate to **Email** → **Transactional Emails**
4. Check recent sends

You should see emails sent to:
- Requester (sahlesokem@gmail.com)
- Finance team (sahlesokem606@gmail.com)
- Approvers (if Stage 1 triggered)
- Authorizers (if Stage 2 triggered)

### Method 3: Test with Fresh Requisition

Create a completely new requisition and add signatures one at a time:

**Step 1: Create requisition (no signatures)**
```
Requestor: Sokem
Department: Program
Items: [...]
Signatures: All null
```

**Step 2: Add ONLY review signature**
```
PUT /api/requisition/:id
Body: { reviewedSignature: "data:image...", reviewedBy: "Name" }

Expected console:
DEBUG: Original reviewed_signature = NULL
DEBUG: Updated reviewed_signature = EXISTS
DEBUG: New review signature? true
✓ STAGE 1: NEW reviewer signature detected...
→ Approvers receive email
```

**Step 3: Add ONLY approval signature**
```
PUT /api/requisition/:id
Body: { reviewedSignature: "...", approvedSignature: "...", reviewedBy: "...", approvedBy: "..." }

Expected console:
DEBUG: Original reviewed_signature = EXISTS
DEBUG: Original approved_signature = NULL
DEBUG: Updated approved_signature = EXISTS
DEBUG: New approval signature? true
✓ STAGE 2: NEW approver signature detected...
→ Authorizers receive email
```

**Step 4: Add ONLY authorization signature**
```
PUT /api/requisition/:id
Body: { all signatures filled }

Expected console:
DEBUG: Original authorized_signature = NULL
DEBUG: Updated authorized_signature = EXISTS
DEBUG: New authorization signature? true
✓ STAGE 3: NEW authorization signature detected...
→ Requester AND finance receive email
```

## Common Issues & Solutions

### Issue 1: No emails received at all

**Check:**
1. Is Brevo sender email verified?
   - Go to Brevo dashboard → Senders & IP
   - Verify sahlesokem@gmail.com is confirmed
   
2. Check Brevo API key validity:
   ```bash
   # In Backend folder
   node -e "console.log(require('dotenv').config()); console.log(process.env.BREVO_API_KEY.substring(0, 10))"
   ```

3. Check backend logs for errors:
   ```
   ✗ Failed to send notification: Invalid API key
   OR
   ✗ Failed to send notification: Sender email not verified
   ```

### Issue 2: Only some emails work

**Example:** Stage 1 works but Stage 3 doesn't

**Solution:**
- This indicates the workflow logic IS working for early stages
- Check if Stage 3 condition is being met:
  ```javascript
  // Must be exactly: isNewAuthorization = true
  // If false, check database:
  SELECT reviewed_signature, approved_signature, authorized_signature 
  FROM requisitions WHERE id = 89;
  ```

### Issue 3: Duplicate emails sent

This shouldn't happen with the new logic, but if it does:

**Cause:** Multiple rapid updates or browser double-clicking

**Solution:**
- Disable submit button after clicking
- Add debouncing to prevent multiple rapid submissions

### Issue 4: Emails going to spam

**Solution:**
1. Check spam folder
2. Add Brevo sending domain to safe senders
3. Use a custom domain email instead of Gmail

## Database Verification Commands

### Check if workflow executed:

```sql
-- Check requisition status progression
SELECT 
    id,
    status,
    reviewed_signature IS NOT NULL AS has_review,
    approved_signature IS NOT NULL AS has_approval,
    authorized_signature IS NOT NULL AS has_authorization,
    created_at,
    updated_at
FROM requisitions 
WHERE id IN (87, 88, 89)
ORDER BY id DESC;
```

### Check role assignments:

```sql
-- See all active roles
SELECT 
    u.id,
    u.email,
    u.full_name,
    rr.role_type,
    rr.is_active
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.is_active = TRUE
ORDER BY rr.role_type, u.full_name;
```

### Manually trigger email test:

If you want to manually test email sending without going through the workflow:

```sql
-- Get a requisition with all signatures
SELECT id, requestor_email, requestor_name, grand_total, department
FROM requisitions 
WHERE reviewed_signature IS NOT NULL 
  AND approved_signature IS NOT NULL 
  AND authorized_signature IS NOT NULL
  AND status = 'authorized'
LIMIT 1;
```

Then use the test script:
```bash
node test-email-workflow.js
```

## Files Modified

✅ `Backend/server.js` (Lines ~973-1018)
- Moved original requisition fetch to BEFORE the UPDATE query
- This ensures we capture the TRUE original state
- Workflow conditions now correctly detect NEW signatures

## Related Documentation

- Email Workflow Fix: [`FIX_EMAIL_NOTIFICATION_WORKFLOW.md`](./FIX_EMAIL_NOTIFICATION_WORKFLOW.md)
- Duplicate Canvas Fix: [`FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md`](./FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md)
- Email Workflow Overview: [`REQUISITION_EMAIL_WORKFLOW.md`](./REQUISITION_EMAIL_WORKFLOW.md)

---

**Status:** ⚠️ FIX APPLIED - NEEDS TESTING  
**Date:** March 13, 2026  
**Next Action:** Test by updating a requisition and watching backend console logs  
**Expected Result:** All 3 workflow stages execute and emails are sent to all recipients
