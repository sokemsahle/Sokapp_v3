# Fix: Approver Not Getting Email Notification

## Problem Identified 🐛

The approver email notification workflow was broken due to a **timing issue** in the signature detection logic.

### Root Cause

In `Backend/server.js` (lines 1213-1249), the code was:
1. Fetching the original requisition (with NULL signatures)
2. **Updating ALL signatures** in the database at once
3. **Then trying to detect** which signatures were new by comparing database values

```javascript
// ❌ BROKEN CODE - BEFORE FIX
const [originalRequisitionRows] = await connection.execute(
    'SELECT reviewed_signature, approved_signature, authorized_signature FROM requisitions WHERE id = ?',
    [requisitionId]
);
const originalRequisition = originalRequisitionRows[0];

// Update ALL signatures in database
await connection.execute('UPDATE requisitions SET ... reviewed_signature = ?, approved_signature = ?, authorized_signature = ? ...', [...]);

// Fetch updated requisition
const [updatedRequisitionRows] = await connection.execute(...);
const updatedRequisition = updatedRequisitionRows[0];

// Compare database values (BROKEN - both are now NOT NULL!)
const isNewReview = !originalRequisition.reviewed_signature && updatedRequisition.reviewed_signature;
```

**The Problem:** By the time we check for changes, ALL signatures have already been updated in the database, so the comparison always shows that nothing changed.

### Why It Failed

When a reviewer signs:
- `reviewedSignature` is sent in `req.body` ✓
- Code updates database with `reviewed_signature` value ✓
- Code tries to detect change by comparing DB values ❌
- Both original AND updated show the signature exists ❌
- `isNewReview` evaluates to `false` ❌
- Approvers are NOT notified ❌

## Solution Implemented ✅

**Check the request body values BEFORE updating the database**, not the database values after updating.

### Fixed Code Logic

```javascript
// ✅ FIXED CODE - AFTER FIX
const [originalRequisitionRows] = await connection.execute(
    'SELECT reviewed_signature, approved_signature, authorized_signature FROM requisitions WHERE id = ?',
    [requisitionId]
);
const originalRequisition = originalRequisitionRows[0];

// ✅ Check which signatures are being ADDED in this request (BEFORE DB update)
const isNewReview = !originalRequisition.reviewed_signature && reviewedSignature;
const isNewApproval = !originalRequisition.approved_signature && approvedSignature;
const isNewAuthorization = !originalRequisition.authorized_signature && authorizedSignature;

console.log('DEBUG: Checking signatures BEFORE database update...');
console.log('DEBUG: Original reviewed_signature =', originalRequisition.reviewed_signature ? 'EXISTS' : 'NULL');
console.log('DEBUG: New review signature in request?', !!reviewedSignature);
console.log('DEBUG: Will trigger approver notification?', isNewReview);

// NOW update the database
await connection.execute('UPDATE requisitions SET ...', [...]);

// Fetch updated requisition for email content
const updatedRequisition = updatedRequisitionRows[0];

// Send notifications based on what we determined BEFORE the update
if (isNewReview) {
    // Notify approvers ✓
}
if (isNewApproval) {
    // Notify authorizers ✓
}
if (isNewAuthorization) {
    // Notify requester and finance ✓
}
```

## Changes Made 📝

### File: `Backend/server.js`

**Lines 1213-1252:** Restructured the signature detection logic

**Before:**
```javascript
// Fetch original
const originalRequisition = ...;

// Update database with ALL signatures
await connection.execute('UPDATE ...', [...signatures]);

// Fetch updated
const updatedRequisition = ...;

// Try to detect changes (FAILED)
const isNewReview = !originalRequisition.reviewed_signature && updatedRequisition.reviewed_signature;
```

**After:**
```javascript
// Fetch original
const originalRequisition = ...;

// ✅ Detect changes BEFORE database update
const isNewReview = !originalRequisition.reviewed_signature && reviewedSignature;
const isNewApproval = !originalRequisition.approved_signature && approvedSignature;
const isNewAuthorization = !originalRequisition.authorized_signature && authorizedSignature;

// Log detection results for debugging
console.log('DEBUG: Will trigger approver notification?', isNewReview);

// Update database
await connection.execute('UPDATE ...', [...]);

// Fetch updated for email content
const updatedRequisition = ...;

// Send notifications based on pre-update detection
if (isNewReview) { /* Notify approvers */ }
```

## How to Test 🧪

### Test Scenario 1: Reviewer Signs → Approvers Get Email

1. **Create a requisition** as a staff member
   - Go to Requisitions → Create New
   - Fill in all details
   - Submit (don't add any signatures yet)

2. **Sign as Reviewer**
   - Open the requisition
   - Add reviewer signature
   - Save

3. **Check Approver Email**
   - ✓ Approvers should receive email: "Requisition Awaiting Approval - #ID"
   - ✓ Check spam folder if not in inbox
   - ✓ Email should go to: `sokem@shamidaethiopia.com` and `sahlesokem@gmail.com`

### Test Scenario 2: Approver Signs → Authorizers Get Email

1. **Sign as Approver** (after reviewer has signed)
   - Open the same requisition
   - Add approver signature
   - Save

2. **Check Authorizer Email**
   - ✓ Authorizers should receive email: "Requisition Awaiting Authorization - #ID"

### Test Scenario 3: Authorizer Signs → Requester & Finance Get Email

1. **Sign as Authorizer** (after approver has signed)
   - Open the same requisition
   - Add authorizer signature
   - Save

2. **Check Emails**
   - ✓ Requester should receive: "Your Requisition Has Been Authorized - #ID"
   - ✓ Finance team should receive: "Payment Processing Required - Requisition #ID"

## Expected Console Output

When a reviewer signs, you should see in backend logs:

```
DEBUG: Checking signatures BEFORE database update...
DEBUG: Original reviewed_signature = NULL
DEBUG: New review signature in request? true
DEBUG: Will trigger approver notification? true
DEBUG: Original approved_signature = NULL
DEBUG: New approval signature in request? false
DEBUG: Will trigger authorizer notification? false
✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
Fetching active approvers from database...
Found 2 active approvers
Processing approver: yilkal sahle (sokem@shamidaethiopia.com)
Attempting to send approval notification to: sokem@shamidaethiopia.com (yilkal sahle)
✓ Approval notification sent successfully to sokem@shamidaethiopia.com (yilkal sahle)
Processing approver: System Administrator (sahlesokem@gmail.com)
Attempting to send approval notification to: sahlesokem@gmail.com (System Administrator)
✓ Approval notification sent successfully to sahlesokem@gmail.com (System Administrator)
```

## Verification Steps

1. **Check Active Approvers Exist**
   ```sql
   SELECT u.email, u.full_name 
   FROM requisition_roles rr 
   JOIN users u ON rr.user_id = u.id 
   WHERE rr.role_type = 'approver' AND rr.is_active = TRUE AND u.is_active = TRUE;
   ```
   
   Expected result: 2 rows (yilkal sahle, System Administrator)

2. **Run Diagnostic Test**
   ```bash
   node test-approver-email.js
   ```
   
   Expected output:
   - ✓ Found 2 active approver(s)
   - ✓ Brevo API key found
   - ✓ Email sent successfully to both approvers

3. **Check Backend Logs**
   - Look for "STAGE 1: NEW reviewer signature detected"
   - Look for "Approval notification sent successfully"

## Common Issues & Solutions

### Issue: No emails received
**Solution:** Check Brevo API key in `Backend/.env`:
```
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=sahlesokem@gmail.com
```

### Issue: "No active approvers found" in logs
**Solution:** Activate approver roles:
```sql
UPDATE requisition_roles SET is_active = TRUE WHERE role_type = 'approver';
```

### Issue: Emails going to spam
**Solution:** 
1. Add sender to contacts
2. Check spam folder
3. Verify Brevo sender identity is verified

### Issue: Only one approver receives email
**Solution:** Check both users have `is_active = TRUE`:
```sql
SELECT id, email, full_name, is_active FROM users WHERE id IN (
    SELECT user_id FROM requisition_roles WHERE role_type = 'approver'
);
```

## Files Modified

- ✅ `Backend/server.js` (Lines 1213-1252) - Fixed signature detection timing
- ✅ Created `test-approver-email.js` - Diagnostic test script

## Related Documentation

- `REQUISITION_EMAIL_WORKFLOW.md` - Complete email workflow documentation
- `QUICK_START_NOTIFICATIONS.md` - Notification testing guide
- `TROUBLESHOOTING_REVIEWER_EMAIL.md` - Email troubleshooting steps

## Success Criteria

✅ When reviewer signs, ALL active approvers receive email  
✅ When approver signs, ALL active authorizers receive email  
✅ When authorizer signs, requester and finance receive email  
✅ Console logs show clear debug messages  
✅ Emails arrive within 1-2 minutes  
✅ Email content includes correct requisition details  

---

**Status:** ✅ FIXED - Ready for testing  
**Date:** March 16, 2026  
**Tested:** Diagnostic test confirms email system works
