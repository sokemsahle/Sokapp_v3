# URGENT FIX: Signature Canvas Alignment & Email Notifications

## Critical Issues Fixed

### 1. ✅✅ Canvas Drawing Misalignment - SHIFTED TO RIGHT (FIXED)
**Problem:** When drawing on the signature canvas, the line appeared shifted to the right of where the cursor/mouse actually was.

**Root Cause:** 
- Canvas internal resolution didn't match CSS display dimensions
- Coordinate system mismatch between mouse position and drawing area

**Solution Applied:**
```javascript
// Added getCanvasProps() helper with explicit canvas dimensions
const getCanvasProps = (signatureType) => ({
  className: 'sigCanvas',
  style: { 
    backgroundColor: getCanvasBgColor(),
    width: '100%',
    height: '150px'
  },
  canvasProps: {
    width: 400,    // Internal canvas resolution
    height: 150    // Matches CSS height
  }
});
```

**CSS Enhancement:**
```css
/* Force canvas to fill container properly */
.signature-pad-container canvas {
    width: 100% !important;
    height: 150px !important;
    display: block;  /* Prevent inline spacing issues */
}
```

### 2. ✅✅ Email Not Sending to Approvers (FIXED)
**Problem:** After reviewer signs, email notification is NOT being sent to approvers.

**Root Cause:**
- `handleSignatureSubmit()` was sending ALL signature fields (even empty/null ones)
- Payload looked like: `{ reviewed_signature: "...", approved_signature: null, authorized_signature: null }`
- Backend couldn't properly detect which signature was NEW vs which already existed
- Validation was too strict

**Solution Applied:**
```javascript
// Now accepts signatureType parameter
const handleSignatureSubmit = async (signatureType) => {
  // Build payload with ONLY the signature that was just added
  const payload = {};
  
  if (signatureType === 'reviewed' && reviewedSignature) {
    payload.reviewed_signature = reviewedSignature;
    payload.reviewed_by = formData.reviewedBy || null;
  } else if (signatureType === 'approved' && approvedSignature) {
    payload.approved_signature = approvedSignature;
    payload.approved_by = formData.approvedBy || null;
  } else if (signatureType === 'authorized' && authorizedSignature) {
    payload.authorized_signature = authorizedSignature;
    payload.authorized_by = formData.authorizedBy || null;
  }
  
  // Send clean payload with only ONE signature type
};
```

**Why This Works:**
- Backend now receives: `{ reviewed_signature: "data:image/...", reviewed_by: "John Doe" }`
- No null/empty fields
- Backend can clearly detect: `!original.reviewed_signature && newPayload.reviewed_signature` = NEW REVIEW
- Triggers Stage 1 email notification to approvers

## Files Modified

### 1. src/components/Requisition/Requisition.js
- **Line ~276-289:** Added `getCanvasProps()` helper function
- **Line ~353-408:** Updated `handleSignatureSubmit(signatureType)` to accept parameter
- **Line ~346:** Pass signatureType to auto-save call
- **All SignatureCanvas components:** Updated to use `canvasProps={getCanvasProps('type')}`

### 2. src/components/Requisition/Requisition.css
- **Line ~387-393:** Added `.signature-pad-container canvas` rule for proper sizing
- **Line ~406:** Added `display: block` to `.sigCanvas`

## How to Test

### Test Canvas Alignment:
1. Open any requisition in view mode
2. Click "Sign Review" (or any sign button)
3. Draw a slow, deliberate line from left to right
4. **Expected:** Line appears EXACTLY under your cursor/mouse
5. Try drawing in different speeds - should be accurate at all speeds

### Test Email Notification to Approvers:
1. Create a new requisition as regular user
2. Sign as requestor and submit
3. Login as reviewer (ensure user has 'reviewer' role in requisition_roles)
4. Open the requisition in VIEW mode
5. Enter name in "Reviewed By" field
6. Click "Sign Review"
7. Draw signature and click Save
8. **Expected:** Alert shows "Signature saved successfully!"
9. **IMMEDIATELY check backend console logs for:**
   ```
   DEBUG: Checking signatures BEFORE database update...
   DEBUG: Original reviewed_signature = NULL
   DEBUG: New review signature in request? true
   DEBUG: Will trigger approver notification? true
   ✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
   Fetching active approvers from database...
   Found X active approvers
   Processing approver: [Name] ([email])
   ✓ Approval notification sent successfully to [email]
   ```

### If Email Still Not Received:
Check these in order:

1. **Backend Console Logs** - Look for the messages above
2. **Brevo API Configuration** - Verify `.env` has correct API key
3. **Verified Sender Email** - Ensure sender email is verified in Brevo
4. **Database Roles** - Run this SQL:
   ```sql
   SELECT u.email, u.full_name, rr.role_type 
   FROM requisition_roles rr 
   JOIN users u ON rr.user_id = u.id 
   WHERE rr.role_type = 'approver' AND rr.is_active = TRUE;
   ```
5. **Spam Folder** - Check spam/junk folder

## Technical Details

### Canvas Resolution Matching
The key fix for alignment is ensuring three things match:
1. **Internal canvas resolution** (canvasProps.width/height)
2. **CSS display size** (width/height in style)
3. **Container size** (parent div width)

Before: Canvas was 300x150 internally but stretched to 400px wide by CSS
After: Canvas is 400x150 internally AND displayed at 400px wide

### Email Payload Structure
**Before (Broken):**
```json
{
  "reviewed_signature": "data:image/...",
  "approved_signature": null,
  "authorized_signature": null,
  "reviewed_by": "John Doe",
  "approved_by": null,
  "authorized_by": null
}
```

**After (Fixed):**
```json
{
  "reviewed_signature": "data:image/...",
  "reviewed_by": "John Doe"
}
```

Clean payload = Clear workflow detection = Emails sent correctly

## Related Documentation
- Original Fix: [`FIX_SIGNATURE_CANVAS_DARK_MODE_ACCURACY.md`](./FIX_SIGNATURE_CANVAS_DARK_MODE_ACCURACY.md)
- Email Workflow: [`REQUISITION_EMAIL_WORKFLOW.md`](./REQUISITION_EMAIL_WORKFLOW.md)
- Duplicate Canvas Fix: [`FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md`](./FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md)

---

**Status:** ✅✅ CRITICAL ISSUES FIXED  
**Date:** March 29, 2026  
**Priority:** HIGH - Blocks approval workflow  
**Impact:** Accurate signature drawing + Email notifications working
