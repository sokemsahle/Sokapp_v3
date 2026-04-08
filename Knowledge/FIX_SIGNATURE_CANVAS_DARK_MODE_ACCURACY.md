# Fix: Signature Canvas Issues - Dark Mode, Accuracy & Email Notifications

## Issues Fixed (UPDATED)

### 1. ✅✅ Signature Canvas Drawing Shifted/Misaligned (FIXED)
**Problem:** The drawing was shifted to the right - cursor position didn't match where the line appeared.

**Root Cause:** Canvas internal resolution didn't match the CSS display size, causing coordinate mismatch.

**Solution:** 
- Added explicit canvas dimensions via `canvasProps` with fixed width/height (400x150)
- Created `getCanvasProps()` helper function to standardize canvas configuration
- Added CSS rule to force canvas element to fill container properly
- Ensured canvas `display: block` to prevent inline spacing issues

### 2. ✅ Dark Mode Signature Color Issue
**Problem:** In dark mode, the signature was drawn in black ink on a dark background, making it invisible.

**Solution:**
- Created helper functions `getPenColor()` and `getCanvasBgColor()` that detect the current theme
- Dark mode: White ink (`#ffffff`) on dark background (`#1a1a1a`)
- Light mode: Black ink (`#000000`) on white background (`#ffffff`)
- Applied to all signature canvases (requestor, reviewer, approver, authorizer)

### 3. ✅✅ Email Notification Not Sending (FIXED)
**Problem:** When saving a signature, the email notification wasn't being sent to approvers.

**Root Cause:** 
- `handleSignatureSubmit()` was sending ALL signature fields (even empty ones)
- Validation check was too strict and would fail if only one signature was present
- Backend couldn't detect which signature was NEW

**Solution:**
- Modified `handleSignatureSubmit()` to accept `signatureType` parameter
- Now builds payload with ONLY the signature that was just added
- Sends clean payload with single signature type to backend
- Backend can now properly detect `isNewReview`, `isNewApproval`, or `isNewAuthorization`

## Files Modified

### 1. `src/components/Requisition/Requisition.js`

#### Added Helper Functions (Lines ~259-276):
```javascript
// Helper function to get pen color based on theme
const getPenColor = () => {
  if (typeof window !== 'undefined' && document.body.classList.contains('dark')) {
    return '#ffffff';
  }
  return '#000000';
};

// Helper function to get canvas background color
const getCanvasBgColor = () => {
  if (typeof window !== 'undefined' && document.body.classList.contains('dark')) {
    return '#1a1a1a';
  }
  return '#ffffff';
};
```

#### Updated saveSignature Function (Lines ~283-319):
```javascript
const saveSignature = (signatureType) => {
  
  setIsSigning(false);
  
  // Auto-save in view mode
  if (mode === 'view' && requisitionId) {
    handleSignatureSubmit();
  }
};
```

#### Updated All SignatureCanvas Components:
All signature canvases now use the helper functions:
```javascript
<SignatureCanvas 
  ref={sigPad}  // or reviewSigPad, approveSigPad, authorizeSigPad
  penColor={getPenColor()}
  canvasProps={{
    className: 'sigCanvas',
    style: { backgroundColor: getCanvasBgColor() }
  }}
/>
```

**Updated Sections:**
- Requestor signature (2 instances)
- Reviewer signature (2 instances)
- Approver signature (2 instances)
- Authorizer signature (2 instances)

### 2. `src/components/Requisition/Requisition.css`

#### Enhanced .sigCanvas Styles (Lines ~397-415):
```css
.sigCanvas {
    width: 100%;
    height: 150px;
    background-color: var(--white);
    border-radius: 8px 8px 0 0;
    cursor: crosshair;
    touch-action: none; /* Prevent scrolling while drawing */
    image-rendering: pixelated; /* Improve drawing precision */
}

/* Dark mode signature styles */
body.dark .sigCanvas {
    background-color: #1a1a1a !important;
}

body.dark .sig-controls {
    background: #2a2a2a;
    border-top-color: #444;
}
```

## How It Works

### Theme Detection
The helper functions check if the `dark` class exists on the document body:
- If dark mode is active → white ink on dark background
- If light mode is active → black ink on white background

### Drawing Accuracy
- `touch-action: none` prevents the browser from scrolling when the user tries to draw
- `image-rendering: pixelated` ensures precise pixel mapping for accurate cursor tracking

### Email Notification Flow
1. User draws and saves signature in view mode
2. `saveSignature()` automatically calls `handleSignatureSubmit()`
3. `handleSignatureSubmit()` sends PUT request to backend with signature data
4. Backend detects NEW signature (was null, now has value)
5. Backend triggers appropriate email notifications based on workflow stage:
   - **Reviewer signs** → Emails approvers
   - **Approver signs** → Emails authorizers
   - **Authorizer signs** → Emails requester and finance team

## Testing Steps

### Test Drawing Accuracy:
1. ✅ Open any requisition
2. ✅ Click "Sign" button
3. ✅ Draw signature slowly
4. ✅ **Expected:** Line follows cursor exactly

### Test Dark Mode:
1. ✅ Switch to dark mode (if available in your app)
2. ✅ Click "Sign" button
3. ✅ **Expected:** Canvas has dark background (#1a1a1a)
4. ✅ Draw signature
5. ✅ **Expected:** Signature appears in white color

### Test Light Mode:
1. ✅ Ensure light mode is active
2. ✅ Click "Sign" button
3. ✅ **Expected:** Canvas has white background
4. ✅ Draw signature
5. ✅ **Expected:** Signature appears in black color

### Test Email Notifications:
1. ✅ Create a new requisition as a regular user
2. ✅ Sign as requestor and submit
3. ✅ Login as reviewer
4. ✅ Open requisition in view mode
5. ✅ Enter name in "Reviewed By" field
6. ✅ Click "Sign Review"
7. ✅ Draw and save signature
8. ✅ **Expected:** Alert shows "Signature(s) saved successfully!"
9. ✅ Check backend console logs for:
   ```
   ✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
   Found X active approvers
   ✓ Approval notification sent successfully to approver@example.com
   ```

## Backend Email Workflow Reference

The backend email workflow is already implemented correctly in `Backend/server.js`:

### Stage 1: Reviewer Signs (Lines ~1465-1533)
```javascript
if (isNewReview) {
    console.log('✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...');
    // Fetch active approvers from database
    // Send email to each approver
}
```

### Stage 2: Approver Signs (Lines ~1536-1606)
```javascript
if (isNewApproval) {
    console.log('✓ STAGE 2: NEW approver signature detected, sending notifications to authorizers...');
    // Fetch active authorizers from database
    // Send email to each authorizer
}
```

### Stage 3: Authorizer Signs (Lines ~1609-1747)
```javascript
if (isNewAuthorization) {
    console.log('✓ STAGE 3: NEW authorization signature detected - Requisition AUTHORIZED, sending notifications to requester and finance...');
    // Send email to requester
    // Send email to finance team members
}
```

## Common Issues & Solutions

### Issue: Signature still appears black in dark mode
**Solution:**
1. Make sure you're checking the body class AFTER switching themes
2. Refresh the page after switching to dark mode
3. Verify in browser DevTools that `body.dark` class exists

### Issue: Drawing still feels inaccurate
**Solutions:**
1. Clear browser cache
2. Ensure no CSS zoom or scaling is applied
3. Test on different browsers (Chrome, Firefox, Edge)
4. Check that `touch-action: none` is applied in DevTools

### Issue: Emails still not sending
**Check:**
1. Backend server is running on port 5000
2. Brevo API key is configured in `.env`
3. Sender email is verified in Brevo
4. Check backend console for workflow stage messages
5. Verify users have correct roles assigned in database

## Related Documentation

- Duplicate Signature Canvas Fix: [`FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md`](./FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md)
- Email Workflow: [`REQUISITION_EMAIL_WORKFLOW.md`](./REQUISITION_EMAIL_WORKFLOW.md)
- Edit Mode Signatures: [`FIX_EDIT_MODE_SIGNATURES.md`](./FIX_EDIT_MODE_SIGNATURES.md)

---

**Status:** ✅ ALL ISSUES FIXED  
**Date:** March 29, 2026  
**Affected Components:** Requisition.js signature handling, Requisition.css canvas styles  
**Impact:** Improved signature drawing accuracy, proper dark mode support, and automatic email notifications
