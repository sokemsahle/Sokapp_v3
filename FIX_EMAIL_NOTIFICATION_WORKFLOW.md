# Fix: Email Notifications Not Sending to Requester & Finance

## Problem Identified

### Why Emails Weren't Being Sent

The workflow was checking if signatures **exist** rather than if they were **newly added**. When editing a requisition and clicking "Update Requisition", all three signatures (reviewed, approved, authorized) were sent together, even if some were already signed before.

**Example Scenario:**
1. ✅ Reviewer signs → Stage 1 triggers correctly (emails approvers)
2. ✅ Approver signs → Stage 2 triggers correctly (emails authorizers)  
3. ❌ Authorizer signs → Stage 3 **FAILS** because it checks:
   ```javascript
   // OLD LOGIC - WRONG
   if (updatedRequisition.authorized_signature && 
       !updatedRequisition.approved_signature) {  // ← This is FALSE!
       // Send emails
   }
   ```

The problem: When authorizer signs in edit mode, the requisition already has `approved_signature` from step 2, so the condition fails!

## Solution Implemented

### Track NEW Signatures Only

Compare original vs updated signatures to detect which ones are newly added:

**File:** `Backend/server.js` (Lines ~985-1020)

**Step 1: Fetch Original Signatures First**
```javascript
// Fetch the ORIGINAL requisition to compare signatures
const [originalRequisitionRows] = await connection.execute(
    'SELECT reviewed_signature, approved_signature, authorized_signature FROM requisitions WHERE id = ?',
    [requisitionId]
);
const originalRequisition = originalRequisitionRows[0];

// Update with new values
await connection.execute('UPDATE requisitions SET ...');

// Fetch updated requisition
const [updatedRequisitionRows] = await connection.execute(
    'SELECT * FROM requisitions WHERE id = ?',
    [requisitionId]
);
const updatedRequisition = updatedRequisitionRows[0];
```

**Step 2: Detect Which Signatures Are NEW**
```javascript
// Determine which signatures are NEW (were null before, now have value)
const isNewReview = !originalRequisition.reviewed_signature && updatedRequisition.reviewed_signature;
const isNewApproval = !originalRequisition.approved_signature && updatedRequisition.approved_signature;
const isNewAuthorization = !originalRequisition.authorized_signature && updatedRequisition.authorized_signature;

console.log('DEBUG: New review signature?', isNewReview);
console.log('DEBUG: New approval signature?', isNewApproval);
console.log('DEBUG: New authorization signature?', isNewAuthorization);
```

**Step 3: Use NEW Flags in Workflow Conditions**

**Stage 1 - Reviewer Signs:**
```javascript
// OLD - Checks if signature exists
if (updatedRequisition.reviewed_signature && !updatedRequisition.approved_signature) {
    console.log('✓ STAGE 1: Reviewer signed...');
}

// NEW - Checks if signature is NEW
if (isNewReview) {
    console.log('✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...');
    // Send emails to approvers
}
```

**Stage 2 - Approver Signs:**
```javascript
// OLD - Checks if signatures exist in certain pattern
if (updatedRequisition.approved_signature && !updatedRequisition.authorized_signature) {
    console.log('✓ STAGE 2: Approver signed...');
}

// NEW - Checks if approval signature is NEW
if (isNewApproval) {
    console.log('✓ STAGE 2: NEW approver signature detected, sending notifications to authorizers...');
    // Send emails to authorizers
}
```

**Stage 3 - Authorizer Signs:**
```javascript
// OLD - Complex condition that often failed
if (updatedRequisition.authorized_signature && 
    updatedRequisition.status !== 'authorized' && 
    updatedRequisition.status !== 'finalized') {
    console.log('✓ STAGE 3: Requisition AUTHORIZED...');
}

// NEW - Simple check for NEW authorization signature
if (isNewAuthorization) {
    console.log('✓ STAGE 3: NEW authorization signature detected - Requisition AUTHORIZED, sending notifications to requester and finance...');
    
    // Send email to REQUESTER
    if (updatedRequisition.requestor_email) {
        console.log(`Sending finalization notification to requester: ${updatedRequisition.requestor_email}`);
        const requesterHtmlContent = `...`;
        await sendEmailNotification(updatedRequisition.requestor_email, '✓ Your Requisition Has Been Authorized', requesterHtmlContent);
    }
    
    // Send email to FINANCE TEAM
    const [finance] = await connection.execute(
        'SELECT u.email, u.full_name FROM requisition_roles rr ' +
        'JOIN users u ON rr.user_id = u.id ' +
        'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
        ['finance', true, true]
    );
    
    if (finance && finance.length > 0) {
        console.log(`Found ${finance.length} active finance personnel`);
        for (const financeMember of finance) {
            const financeHtmlContent = `...`;
            await sendEmailNotification(financeMember.email, '🏦 Payment Processing Required - Requisition Authorized', financeHtmlContent);
        }
    }
}
```

## How It Works Now

### Complete Workflow Example

**Scenario:** Creating a requisition from scratch and getting all signatures in one edit session

#### Step 1: Create Requisition (No Signatures Yet)
```
POST /api/requisition
Body: { requestor: "John", department: "IT", items: [...], reviewedSignature: null, approvedSignature: null, authorizedSignature: null }

Result:
- Original: reviewed=null, approved=null, authorized=null
- Updated:  reviewed=null, approved=null, authorized=null
- isNewReview=false, isNewApproval=false, isNewAuthorization=false
- No workflow triggered (correct!)
```

#### Step 2: Reviewer Signs (Edit Mode)
```
PUT /api/requisition/46
Body: { reviewedSignature: "data:image...", reviewedBy: "Jane Smith", ... }

Result:
- Original: reviewed=null, approved=null, authorized=null
- Updated:  reviewed="data:...", approved=null, authorized=null
- isNewReview=true ✓, isNewApproval=false, isNewAuthorization=false
- Stage 1 TRIGGERED → Emails sent to approvers ✓
```

#### Step 3: Approver Signs (Edit Mode)
```
PUT /api/requisition/46
Body: { reviewedSignature: "data:image...", approvedSignature: "data:image...", reviewedBy: "Jane", approvedBy: "Bob" }

Result:
- Original: reviewed="data:...", approved=null, authorized=null
- Updated:  reviewed="data:...", approved="data:...", authorized=null
- isNewReview=false (already existed), isNewApproval=true ✓, isNewAuthorization=false
- Stage 2 TRIGGERED → Emails sent to authorizers ✓
```

#### Step 4: Authorizer Signs (Edit Mode) - **THE FIX!**
```
PUT /api/requisition/46
Body: { reviewedSignature: "...", approvedSignature: "...", authorizedSignature: "...", all names filled }

Result:
- Original: reviewed="data:...", approved="data:...", authorized=null
- Updated:  reviewed="data:...", approved="data:...", authorized="data:..."
- isNewReview=false, isNewApproval=false, isNewAuthorization=true ✓
- Stage 3 TRIGGERED → Emails sent to requester AND finance ✓✓✓
```

**Before the fix:** Stage 3 would NOT trigger because `approved_signature` already existed!

## Testing Steps

### Test 1: Sequential Signing (One at a Time)

1. **Create requisition** as regular user
2. **Login as reviewer** → Add review signature only
   - Expected: Approvers receive email
3. **Login as approver** → Add approval signature only
   - Expected: Authorizers receive email
4. **Login as authorizer** → Add authorization signature
   - Expected: Requester AND finance receive emails ✓

### Test 2: Bulk Signing (All at Once in Edit Mode)

1. **Create requisition** as regular user
2. **Login as admin** (has all roles)
3. **Click "Edit"** on requisition
4. **Fill all names**: Reviewed By, Approved By, Authorized By
5. **Add all signatures**: Review, Approval, Authorization
6. **Click "Update Requisition"**

**Expected Console Output:**
```
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
✓ STAGE 2: NEW approver signature detected, sending notifications to authorizers...
✓ STAGE 3: NEW authorization signature detected - Requisition AUTHORIZED, sending notifications to requester and finance...
Sending finalization notification to requester: john@example.com
Found 2 active finance personnel
Notifying 2 finance team members...
✓ Email sent successfully to john@example.com
✓ Email sent successfully to finance1@example.com
✓ Email sent successfully to finance2@example.com
```

**Expected Emails Received:**
- ✅ Approvers get "Requisition Awaiting Approval" email
- ✅ Authorizers get "Requisition Awaiting Authorization" email
- ✅ Requester gets "Your Requisition Has Been Authorized" email
- ✅ Finance team gets "Payment Processing Required" email

### Test 3: Partial Signing (Some Already Signed)

1. **Create requisition** → Reviewer signs first
2. **Later** → Approver signs (adds both review + approval signatures)
3. **Even later** → Authorizer signs (adds all three signatures)

**Expected:** Each stage triggers correctly regardless of what other signatures are included!

## Database Verification

### Check Original vs Updated Signatures

```sql
-- Before update - check current state
SELECT 
    id,
    reviewed_signature IS NOT NULL AS has_review,
    approved_signature IS NOT NULL AS has_approval,
    authorized_signature IS NOT NULL AS has_authorization,
    status
FROM requisitions 
WHERE id = 46;

-- After update - verify workflow executed
SELECT 
    id,
    reviewed_signature IS NOT NULL AS has_review,
    approved_signature IS NOT NULL AS has_approval,
    authorized_signature IS NOT NULL AS has_authorization,
    status,
    updated_at
FROM requisitions 
WHERE id = 46;
```

### Check Finance Roles Exist

```sql
-- Verify finance team members are configured
SELECT 
    u.id,
    u.email,
    u.full_name,
    rr.role_type,
    rr.is_active
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'finance' AND rr.is_active = TRUE;
```

**If no results**, assign finance role:
```sql
-- Add finance role to a user (replace 1 with actual user ID)
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'finance', TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;
```

## Common Issues & Solutions

### Issue: Still not getting emails to requester/finance

**Check Backend Console Logs:**
```bash
# Look for these exact messages:
"✓ STAGE 3: NEW authorization signature detected"
"Sending finalization notification to requester: user@example.com"
"Found X active finance personnel"
```

**If you see "New authorization signature? false":**
- The authorization signature already existed before the update
- Need to clear it first, then add again to trigger as "new"

**If you see "No requestor email found":**
- Check that `requestor_email` field is populated in database
- This field comes from the user who created the requisition

**If you see "No active finance personnel found":**
- Assign finance roles to users via User Access Control
- Or directly in database:
  ```sql
  INSERT INTO requisition_roles (user_id, role_type, is_active) 
  VALUES (1, 'finance', TRUE);
  ```

### Issue: Getting duplicate emails

This shouldn't happen with the new logic since we only trigger on NEW signatures. If duplicates occur:

1. Check if multiple updates are being sent rapidly
2. Verify database doesn't have trigger loops
3. Check Brevo delivery logs for actual sends

## Files Modified

✅ `Backend/server.js` (Lines ~985-1175)
- Added fetch of original requisition signatures before update
- Added comparison logic to detect NEW signatures (`isNewReview`, `isNewApproval`, `isNewAuthorization`)
- Updated Stage 1 condition to use `isNewReview` instead of existence check
- Updated Stage 2 condition to use `isNewApproval` instead of existence check
- Updated Stage 3 condition to use `isNewAuthorization` instead of complex status check
- Enhanced debug logging to show original vs updated signatures

## Related Documentation

- Duplicate Signature Canvas Fix: [`FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md`](./FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md)
- Edit Mode Signatures: [`FIX_EDIT_MODE_SIGNATURES.md`](./FIX_EDIT_MODE_SIGNATURES.md)
- Email Workflow Overview: [`REQUISITION_EMAIL_WORKFLOW.md`](./REQUISITION_EMAIL_WORKFLOW.md)
- Rejection Feature: [`REQUISITION_REJECTION_FEATURE.md`](./REQUISITION_REJECTION_FEATURE.md)

---

**Status:** ✅ EMAIL WORKFLOW FIXED - NOW PROPERLY DETECTS NEW SIGNATURES  
**Date:** March 13, 2026  
**Impact:** Requester and finance team will now receive emails when requisition is fully authorized  
**Key Change:** Compare original vs updated signatures to detect what's NEW, not what EXISTS
