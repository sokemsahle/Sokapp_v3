# Fix: Duplicate Signature Canvas & Email Notifications

## Issues Fixed

### 1. ✅ Duplicate Signature Canvas
**Problem:** When clicking "Sign Approval" or "Sign Authorization", multiple signature canvases appeared because all sections shared the same `sigPad` ref.

**Solution:** Created separate refs for each signature type:
- `sigPad` - For requestor signature
- `reviewSigPad` - For reviewer signature  
- `approveSigPad` - For approver signature
- `authorizeSigPad` - For authorizer signature

### 2. ⚠️ Email Notifications Not Sending
**Status:** Backend workflow logic exists and is correct. If emails aren't being received, check:
1. Brevo API key configuration
2. Verified sender email in `.env`
3. Backend console logs for workflow stage execution
4. Spam/junk folders

## Solution Details

### Issue 1: Duplicate Signature Canvas

#### Root Cause
All signature sections were using the same `sigPad` ref:
```javascript
// WRONG - All sections use same ref
const sigPad = useRef({});

// In Reviewed By section
<SignatureCanvas ref={sigPad} />

// In Approved By section  
<SignatureCanvas ref={sigPad} /> // Same ref!

// In Authorized By section
<SignatureCanvas ref={sigPad} /> // Same ref!
```

When you clicked to sign in one section, it affected all sections because they all referenced the same canvas instance.

#### Solution
Created dedicated refs for each signature type:

**File:** `src/components/Requisition/Requisition.js`

**State Declarations (Lines ~25-30):**
```javascript
const sigPad = useRef({});           // For requestor signature
const reviewSigPad = useRef({});     // For reviewer signature
const approveSigPad = useRef({});    // For approver signature
const authorizeSigPad = useRef({});  // For authorizer signature
```

**Updated Signature Functions (Lines ~239-287):**
```javascript
const clearSignature = (signatureType) => {
  // Determine which pad to use based on signature type
  let padToUse = sigPad;
  if (signatureType === 'reviewed') {
    padToUse = reviewSigPad;
  } else if (signatureType === 'approved') {
    padToUse = approveSigPad;
  } else if (signatureType === 'authorized') {
    padToUse = authorizeSigPad;
  }
    
  padToUse.current.clear();
  // ... clear state
};

const saveSignature = (signatureType) => {
  // Determine which pad to use based on signature type
  let padToUse = sigPad;
  if (signatureType === 'reviewed') {
    padToUse = reviewSigPad;
  } else if (signatureType === 'approved') {
    padToUse = approveSigPad;
  } else if (signatureType === 'authorized') {
    padToUse = authorizeSigPad;
  }
    
  if (!padToUse.current.isEmpty()) {
    const canvas = padToUse.current.getCanvas();
    // ... save signature
  }
};
```

**Updated All Signature Sections:**
- Reviewed By: Uses `reviewSigPad` ref
- Approved By: Uses `approveSigPad` ref
- Authorized By: Uses `authorizeSigPad` ref

**Example - Reviewed By Section (Lines ~810-820):**
```javascript
<SignatureCanvas 
  ref={reviewSigPad}              // ← Dedicated ref
  penColor="black"
  canvasProps={{className: 'sigCanvas'}}
/>
<div className="sig-controls">
  <button onClick={() => clearSignature('reviewed')}>Clear</button>
  <button onClick={() => saveSignature('reviewed')}>Save</button>
</div>
```

### Issue 2: Email Notifications

#### Backend Workflow Status
The backend has complete workflow logic implemented in `Backend/server.js`:

**Stage 1: Reviewer Signs → Notify Approvers**
```javascript
if (updatedRequisition.reviewed_signature && !updatedRequisition.approved_signature) {
    console.log('✓ STAGE 1: Reviewer signed, sending notifications to approvers...');
    // Fetch active approvers from database
    // Send email notification to each approver
}
```

**Stage 2: Approver Signs → Notify Authorizers**
```javascript
if (updatedRequisition.approved_signature && !updatedRequisition.authorized_signature) {
    console.log('✓ STAGE 2: Approver signed, sending notifications to authorizers...');
    // Fetch active authorizers from database
    // Send email notification to each authorizer
}
```

**Stage 3: Authorizer Signs → Notify Requester & Finance**
```javascript
if (updatedRequisition.authorized_signature && updatedRequisition.status !== 'authorized') {
    console.log('✓ STAGE 3: Requisition AUTHORIZED - sending notifications to requester and finance...');
    
    // Update status to 'authorized'
    await connection.execute('UPDATE requisitions SET status = ? WHERE id = ?', ['authorized', requisitionId]);
    
    // Send notification to REQUESTER
    if (updatedRequisition.requestor_email) {
        console.log(`Sending finalization notification to requester: ${updatedRequisition.requestor_email}`);
        // Send HTML email with requisition details
    }
    
    // Send notification to FINANCE TEAM
    const [financeUsers] = await connection.execute(
        'SELECT u.email, u.full_name FROM requisition_roles rr ' +
        'JOIN users u ON rr.user_id = u.id ' +
        'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
        ['finance', true, true]
    );
    
    if (financeUsers && financeUsers.length > 0) {
        console.log(`Notifying ${financeUsers.length} finance team members...`);
        for (const financeUser of financeUsers) {
            // Send email to each finance team member
        }
    }
}
```

#### Why Emails Might Not Be Received

If the workflow is executing (check backend console for "✓ STAGE 3" message) but emails aren't received:

1. **Brevo API Configuration**
   ```bash
   # Check .env file in Backend folder
   BREVO_API_KEY=your_api_key_here
   BREVO_SENDER_EMAIL=verified@gmail.com
   ```

2. **Verified Sender Email**
   - The sender email MUST be verified in Brevo
   - Default: Use your Gmail account (must verify in Brevo dashboard)
   - Alternative: Use `noreply@sokapp.online` (requires domain verification)

3. **Check Backend Console**
   ```
   ✓ STAGE 3: Requisition AUTHORIZED - sending notifications to requester and finance...
   Sending finalization notification to requester: user@example.com
   ✗ Failed to send email: Invalid API key
   ```

4. **Database Role Assignments**
   ```sql
   -- Check if finance roles are assigned
   SELECT u.email, u.full_name, rr.role_type 
   FROM requisition_roles rr 
   JOIN users u ON rr.user_id = u.id 
   WHERE rr.role_type = 'finance' AND rr.is_active = TRUE;
   
   -- Check if requester_email is set
   SELECT id, requestor_email, requestor_name, status 
   FROM requisitions 
   WHERE id = 46;
   ```

## Testing Steps

### Test Separate Signature Pads:

#### Test Review Signature:
1. ✅ Navigate to requisition in edit mode
2. ✅ Enter name in "Reviewed By" field
3. ✅ Click "Sign Review"
4. ✅ **Expected:** ONE signature pad appears
5. ✅ Draw signature and save
6. ✅ **Expected:** Signature saved correctly

#### Test Approval Signature:
1. ✅ Enter name in "Approved By" field
2. ✅ Click "Sign Approval"
3. ✅ **Expected:** ONE signature pad appears (not multiple!)
4. ✅ Draw signature and save
5. ✅ **Expected:** Signature saved correctly

#### Test Authorization Signature:
1. ✅ Enter name in "Authorized By" field
2. ✅ Click "Sign Authorization"
3. ✅ **Expected:** ONE signature pad appears (not multiple!)
4. ✅ Draw signature and save
5. ✅ **Expected:** Signature saved correctly

### Test Email Notifications:

#### Setup Test User with Finance Role:
1. Login as admin
2. Go to User Access Control
3. Create/select a user
4. Assign "finance" requisition role
5. Save changes

#### Trigger Email Workflow:
1. Login as regular user
2. Create new requisition
3. Submit requisition
4. Login as reviewer
5. Sign as reviewer → Should email approvers
6. Login as approver
7. Sign as approver → Should email authorizers
8. Login as authorizer
9. Sign as authorizer → Should email requester AND finance

#### Check Backend Console:
```
POST /api/requisition/46 200
DEBUG: Checking if we should send workflow notifications...
DEBUG: reviewed_signature = EXISTS
DEBUG: approved_signature = EXISTS
DEBUG: authorized_signature = EXISTS
✓ STAGE 3: Requisition AUTHORIZED - sending notifications to requester and finance...
Sending finalization notification to requester: user@example.com
Found 2 active finance team members
Notifying 2 finance team members...
Processing finance member: Finance Manager (finance@example.com)
✓ Email sent successfully to finance@example.com
✓ Email sent successfully to user@example.com
```

#### Verify Database:
```sql
-- Check requisition status
SELECT id, requestor_email, status, created_at 
FROM requisitions 
WHERE id = 46;
-- Expected: status = 'authorized'

-- Check finance roles exist
SELECT COUNT(*) as finance_count 
FROM requisition_roles 
WHERE role_type = 'finance' AND is_active = TRUE;
-- Expected: Count > 0
```

## Common Issues & Solutions

### Issue: Multiple signature canvases still appearing
**Solution:**
1. Restart the development server
2. Clear browser cache
3. Check that all SignatureCanvas components use correct refs

### Issue: Emails not being received
**Solutions:**

#### Check Brevo Configuration:
```bash
# In Backend/.env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=your.verified@gmail.com
FRONTEND_URL=http://localhost:3000
```

#### Verify Sender Email in Brevo:
1. Go to Brevo dashboard
2. Navigate to Senders & IP
3. Add your Gmail address
4. Click verification link sent to your email
5. Wait for confirmation (usually instant)

#### Check Backend Logs:
```bash
# Look for these messages:
"✓ STAGE 3: Requisition AUTHORIZED"
"Sending finalization notification to requester"
"Found X finance team members"
"✓ Email sent successfully"
```

#### If Using Gmail:
- Must use App Password (not regular password)
- Enable 2FA on Google account first
- Generate app password at: myaccount.google.com/apppasswords
- Use this 16-character password as API key

### Issue: Finance users not getting emails
**Check:**
```sql
-- Ensure finance roles are assigned and active
SELECT u.email, u.full_name, rr.is_active 
FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'finance';

-- If no results, assign finance role:
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'finance', TRUE);  -- Replace 1 with actual user ID
```

## Files Modified

✅ `src/components/Requisition/Requisition.js`
- Added separate refs for each signature type (lines ~25-28)
- Updated `clearSignature()` to accept parameter and use correct ref (lines ~239-256)
- Updated `saveSignature()` to accept parameter and use correct ref (lines ~258-287)
- Updated Reviewed By section to use `reviewSigPad` (lines ~810-820)
- Updated Approved By section to use `approveSigPad` (lines ~890-900)
- Updated Authorized By section to use `authorizeSigPad` (lines ~970-980)
- Updated all button click handlers to pass signature type

## Related Documentation

- Edit Mode Signatures: [`FIX_EDIT_MODE_SIGNATURES.md`](./FIX_EDIT_MODE_SIGNATURES.md)
- Edit Mode Names: [`FIX_EDIT_MODE_NAME_FIELDS.md`](./FIX_EDIT_MODE_NAME_FIELDS.md)
- Signature Pad (View): [`FIX_SIGNATURE_PAD_NOT_SHOWING.md`](./FIX_SIGNATURE_PAD_NOT_SHOWING.md)
- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ SIGNATURE PAD ISSUE FIXED | ⚠️ EMAIL REQUIRES CONFIGURATION  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js signature handling  
**Impact:** Each signature type now has its own dedicated canvas, preventing duplicates
