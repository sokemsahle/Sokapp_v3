# Fix: Signature Pad Not Showing in Edit Mode

## Issue
In edit mode (`mode === 'edit'`), users couldn't add signatures:
- "Sign Approval" button didn't show signature pad
- "Sign Authorization" button didn't show signature pad
- Only "Sign Review" worked (already fixed)

## Root Cause
The signature pad display logic was missing from the **non-view mode** sections. The conditional rendering only checked for:
1. Existing signature (show preview)
2. Sign button (if no signature)

**Missing:** Check for `isSigning` state to show the signature pad in edit mode.

### Previous Logic (WRONG):
```javascript
{mode === 'view' || isCompleted ? (
  // View mode logic with signature pad check
  approvedSignature ? <Preview /> : 
  isSigning === 'approved' ? <Pad /> :  // ✓ Had this check
  <Button />
) : (
  // Edit mode logic WITHOUT signature pad check
  !approvedSignature ? <Button /> : <Preview />  // ✗ Missing isSigning check
)}
```

## Solution

Added signature pad display logic to both **Approval** and **Authorization** sections in non-view mode (which includes edit mode).

### Changes Made

**File:** `src/components/Requisition/Requisition.js`

#### 1. Approved By Section (Lines ~909-937)
**Before:**
```javascript
} else (
  <>
    {!approvedSignature ? (
      <button onClick={handleSign}>Sign Approval</button>
    ) : (
      <img src={approvedSignature} alt="Approved Signature" />
    )}
  </>
)}
```

**After:**
```javascript
} else (
  <>
    {isSigning === 'approved' ? (
      // Show signature pad when signing in edit/non-view mode
      <div className="signature-pad-container">
        <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'sigCanvas'}} />
        <div className="sig-controls">
          <button className="btn-sig-clear" onClick={clearSignature}>Clear</button>
          <button className="btn-sig-save" onClick={saveSignature}>Save</button>
        </div>
      </div>
    ) : !approvedSignature ? (
      <button onClick={handleSign}>Sign Approval</button>
    ) : (
      <img src={approvedSignature} alt="Approved Signature" />
    )}
  </>
)}
```

#### 2. Authorized By Section (Lines ~1003-1031)
Same pattern added for authorization signatures with `isSigning === 'authorized'`

## How It Works Now

### Complete Signing Flow in Edit Mode:

```
Step 1: User enters name
┌──────────────────────────────┐
│ Approved By: [Jane Doe___]   │ ← Editable ✓
│                              │
│ [✏️ Sign Approval] ← Click   │
└──────────────────────────────┘

Step 2: Signature pad appears
┌──────────────────────────────┐
│ Approved By: [Jane Doe___]   │
│                              │
│ ┌─────────────────────────┐  │
│ │  Draw signature here    │  │ ← Canvas shows!
│ │                         │  │
│ └─────────────────────────┘  │
│ [Clear]  [Save]              │
└──────────────────────────────┘

Step 3: After saving
┌──────────────────────────────┐
│ Approved By: [Jane Doe___]   │
│                              │
│ ┌─────────────────┐          │
│ │ Jane's Sig img  │ ← Saved  │
│ └─────────────────┘          │
│                              │
│ [Update Requisition]         │ ← Saves everything
└──────────────────────────────┘
```

## Conditional Logic Summary

### Three-Tier Condition (All Modes):

```javascript
{mode === 'view' || isCompleted ? (
  // VIEW MODE or COMPLETED
  approvedSignature ? (
    <SignaturePreview />           // Already signed - show image
  ) : isSigning === 'approved' ? (
    <SignaturePad />               // Currently signing - show pad
  ) : (
    <SignButton />                 // Not signed yet - show button
  )
) : (
  // EDIT MODE (or create mode)
  isSigning === 'approved' ? (
    <SignaturePad />               // Currently signing - show pad ← NEW!
  ) : !approvedSignature ? (
    <SignButton />                 // Not signed yet - show button
  ) : (
    <SignaturePreview />           // Already signed - show image
  )
)}
```

## State Flow in Edit Mode

```
Initial State:
  isSigning = null
  approvedSignature = null
  → Shows "Sign Approval" button

User clicks "Sign Approval":
  setIsSigning('approved')
  → Shows Signature Canvas

User draws and clicks "Save":
  saveSignature() saves data URL
  setApprovedSignature(dataURL)
  setIsSigning(false)
  → Shows signature image preview

User clicks "Update Requisition":
  handleSubmit() sends all data to backend
  → Requisition updated with signatures
```

## Testing Steps

### Test Approval Signature in Edit Mode:
1. ✅ Navigate to requisition in edit mode
2. ✅ Enter name in "Approved By" field
3. ✅ Click "Sign Approval" button
4. ✅ **Expected:** Signature pad appears with canvas
5. ✅ Draw signature on canvas
6. ✅ Click "Save" button on signature controls
7. ✅ **Expected:** Signature image appears
8. ✅ Click "Update Requisition" at bottom
9. ✅ **Expected:** Success message, approval signature saved

### Test Authorization Signature in Edit Mode:
1. ✅ Navigate to requisition in edit mode
2. ✅ Enter name in "Authorized By" field
3. ✅ Click "Sign Authorization" button
4. ✅ **Expected:** Signature pad appears with canvas
5. ✅ Draw signature on canvas
6. ✅ Click "Save" button on signature controls
7. ✅ **Expected:** Signature image appears
8. ✅ Click "Update Requisition" at bottom
9. ✅ **Expected:** Success message, authorization signature saved

### Test All Three Signatures in Edit Mode:
1. ✅ Navigate to requisition in edit mode
2. ✅ Fill in "Reviewed By" → Sign Review → Save
3. ✅ Fill in "Approved By" → Sign Approval → Save
4. ✅ Fill in "Authorized By" → Sign Authorization → Save
5. ✅ Click "Update Requisition"
6. ✅ **Expected:** All three signatures saved successfully

## Browser Console Debug Output

When clicking "Sign Approval" in edit mode:
```javascript
// Button click handler executes
// isSigning state changes to 'approved'
// Component re-renders showing signature pad

// After drawing and saving:
setApprovedSignature("data:image/png;base64,iVBOR...")
setIsSigning(false)
// Signature image displays
```

## Common Issues & Solutions

### Issue: Still can't see signature pad in edit mode
**Check:**
1. Is `formData.approvedBy` or `formData.authorizedBy` filled? (Required before signing)
2. Are you in actual edit mode? (Check URL and route)
3. Is requisition already completed? (Can't sign completed requisitions)

### Issue: Signature doesn't appear after saving
**Check:**
1. Did you draw on the canvas? (Can't save empty signature)
2. Check browser console for errors
3. Verify `approvedSignature` or `authorizedSignature` state is being set

### Issue: Can't update requisition after signing
**Check:**
1. Are all required fields filled?
2. Check backend API endpoint is working
3. Verify payload structure matches backend expectations

## Comparison: All Signature Sections

| Section | Edit Mode | View Mode (with role) | View Mode (no role) |
|---------|-----------|----------------------|---------------------|
| **Reviewed By** | ✅ Editable + Signable | ✅ Editable + Signable | ❌ Disabled |
| **Approved By** | ✅ Editable + Signable | ✅ Editable + Signable | ❌ Disabled |
| **Authorized By** | ✅ Editable + Signable | ✅ Editable + Signable | ❌ Disabled |
| **Save Method** | Update Requisition | Save Signature | N/A |

## What Gets Updated

### Edit Mode Payload (handleSubmit):
```javascript
const payload = {
  requestor: formData.requestor,
  department: formData.department,
  description: formData.description,
  requestedBy: formData.requestedBy,
  reviewedBy: formData.reviewedBy,        // Name
  approvedBy: formData.approvedBy,        // Name
  authorizedBy: formData.authorizedBy,    // Name
  reviewedSignature: reviewedSignature,   // Base64 image
  approvedSignature: approvedSignature,   // Base64 image
  authorizedSignature: authorizedSignature, // Base64 image
  items: items,
  grandTotal: grandTotal,
  program_id: formData.program_id
  // ... other fields
};
```

**Backend Endpoint:** `PUT /api/requisition/:id`

## Files Modified

✅ `src/components/Requisition/Requisition.js`
- Updated Approved By section to show signature pad in edit mode
- Updated Authorized By section to show signature pad in edit mode

## Related Documentation

- Edit Mode Names: [`FIX_EDIT_MODE_NAME_FIELDS.md`](./FIX_EDIT_MODE_NAME_FIELDS.md)
- Signature Pad (View): [`FIX_SIGNATURE_PAD_NOT_SHOWING.md`](./FIX_SIGNATURE_PAD_NOT_SHOWING.md)
- 500 Error Fix: [`FIX_500_ERROR_SIGNATURE_SAVE.md`](./FIX_500_ERROR_SIGNATURE_SAVE.md)
- Save Button: [`FIX_SAVE_SIGNATURE_BUTTON.md`](./FIX_SAVE_SIGNATURE_BUTTON.md)
- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ FIXED  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js approval and authorization sections  
**Impact:** Users can now add approval and authorization signatures in edit mode
