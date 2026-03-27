# Fix: Signature Pad Not Showing in View Mode

## Issue
When users with requisition roles clicked "Sign Review", "Sign Approval", or "Sign Authorization" buttons in view mode, the signature canvas/pad did not appear.

## Root Cause
The signature pad display logic was only present in non-view mode (`mode !== 'view'`). In view mode, the conditional rendering only showed:
1. Existing signature (if present)
2. Sign button (if no signature)
3. "No signature" text (if user has no role)

**Missing:** The signature pad container that should appear when `isSigning` state is set.

## Solution

Added signature pad display logic to all three signature sections (Review, Approval, Authorization) in view mode.

### Changes Made

**File:** `src/components/Requisition/Requisition.js`

#### 1. Reviewed By Section (Lines ~803-817)
**Before:**
```javascript
{mode === 'view' || isCompleted ? (
  reviewedSignature ? (
    <div className="signature-preview">
      <img src={reviewedSignature} alt="Reviewed Signature" />
    </div>
  ) : (
    // Show sign button...
  )
) : (...)}
```

**After:**
```javascript
{mode === 'view' || isCompleted ? (
  reviewedSignature ? (
    <div className="signature-preview">
      <img src={reviewedSignature} alt="Reviewed Signature" />
    </div>
  ) : isSigning === 'reviewed' ? (
    // Show signature pad when signing
    <div className="signature-pad-container">
      <SignatureCanvas 
        ref={sigPad}
        penColor="black"
        canvasProps={{className: 'sigCanvas'}}
      />
      <div className="sig-controls">
        <button className="btn-sig-clear" onClick={clearSignature}>Clear</button>
        <button className="btn-sig-save" onClick={saveSignature}>Save</button>
      </div>
    </div>
  ) : (
    // Show sign button...
  )
) : (...)}
```

#### 2. Approved By Section (Lines ~876-890)
Same pattern added for `isSigning === 'approved'`

#### 3. Authorized By Section (Lines ~957-971)
Same pattern added for `isSigning === 'authorized'`

## How It Works Now

### Complete Signing Flow in View Mode:

```
Step 1: User enters name in field
┌──────────────────────────────┐
│ Reviewed By: [John Doe____]  │
│                              │
│ [✏️ Sign Review] ← Click     │
└──────────────────────────────┘

Step 2: Signature pad appears
┌──────────────────────────────┐
│ Reviewed By: [John Doe____]  │
│                              │
│ ┌─────────────────────────┐  │
│ │  Draw signature here    │  │
│ │                         │  │
│ └─────────────────────────┘  │
│ [Clear]  [Save]              │
└──────────────────────────────┘

Step 3: After saving
┌──────────────────────────────┐
│ Reviewed By: [John Doe____]  │
│                              │
│ ┌─────────────────┐          │
│ │ John's Sig img  │ ← Saved  │
│ └─────────────────┘          │
└──────────────────────────────┘
```

## Conditional Logic

The signature section now uses a 3-tier condition:

```javascript
{mode === 'view' || isCompleted ? (
  // Condition 1: Signature exists - show preview
  reviewedSignature ? (
    <SignaturePreview />
  ) 
  // Condition 2: Currently signing - show pad
  : isSigning === 'reviewed' ? (
    <SignaturePad />
  )
  // Condition 3: No signature yet - show button
  : (
    <SignButton />
  )
) : (
  // Non-view mode logic...
)}
```

## State Flow

```
Initial State:
  isSigning = null
  reviewedSignature = null
  → Shows "Sign Review" button

User clicks "Sign Review":
  setIsSigning('reviewed')
  → Shows Signature Canvas

User draws and clicks "Save":
  saveSignature() saves data URL
  setReviewedSignature(dataURL)
  setIsSigning(false)
  → Shows signature image preview

User clicks "Save Signature" (form footer):
  handleSignatureSubmit() sends to server
  → Page refreshes, signature permanent
```

## Testing Steps

### Test as Reviewer:
1. ✅ Navigate to pending requisition in view mode
2. ✅ Enter name in "Reviewed By" field
3. ✅ Click "Sign Review" button
4. ✅ **Expected:** Signature pad appears with canvas
5. ✅ Draw signature on canvas
6. ✅ Click "Save" button on signature controls
7. ✅ **Expected:** Signature image appears
8. ✅ Click "Save Signature" at bottom of form
9. ✅ **Expected:** Success message, page refreshes

### Test as Approver:
1. ✅ Navigate to reviewed requisition in view mode
2. ✅ Enter name in "Approved By" field
3. ✅ Click "Sign Approval" button
4. ✅ **Expected:** Signature pad appears
5. ✅ Draw and save signature
6. ✅ **Expected:** Approval signature saved

### Test as Authorizer:
1. ✅ Navigate to approved requisition in view mode
2. ✅ Enter name in "Authorized By" field
3. ✅ Click "Sign Authorization" button
4. ✅ **Expected:** Signature pad appears
5. ✅ Draw and save signature
6. ✅ **Expected:** Authorization signature saved

## Browser Console Debug Output

When clicking "Sign Review", you should see:
```javascript
// If name field is empty:
alert('Please enter the reviewer name first');

// If name field has value:
// Button click handler executes
// isSigning state changes to 'reviewed'
// Component re-renders showing signature pad
```

## Common Issues & Solutions

### Issue: Canvas still not showing
**Check:**
1. Is `formData.reviewedBy` filled? (Required before signing)
2. Is user logged in with proper role?
3. Is requisition already completed? (Can't sign completed)

### Issue: "Clear" and "Save" buttons don't work
**Check:**
1. Are `clearSignature` and `saveSignature` functions defined?
2. Is `sigPad` ref properly initialized?
3. Check browser console for errors

### Issue: Signature doesn't save after clicking "Save"
**Check:**
1. Did you draw on the canvas? (Can't save empty)
2. Check `saveSignature()` function validation
3. Verify signature data URL is being created

## Files Modified

✅ `src/components/Requisition/Requisition.js`
- Updated Reviewed By section (added signature pad display)
- Updated Approved By section (added signature pad display)
- Updated Authorized By section (added signature pad display)

## Related Documentation

- Previous Fix: [`FIX_VIEW_MODE_INPUT_FIELDS.md`](./FIX_VIEW_MODE_INPUT_FIELDS.md)
- Save Button: [`FIX_SAVE_SIGNATURE_BUTTON.md`](./FIX_SAVE_SIGNATURE_BUTTON.md)
- Visual Guide: [`VISUAL_GUIDE_SIGNING_FLOW.md`](./VISUAL_GUIDE_SIGNING_FLOW.md)
- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ FIXED  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js signature sections in view mode  
**Impact:** All users with requisition roles can now sign properly in view mode
