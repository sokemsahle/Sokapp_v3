# Fix: Reviewer/Approver/Authorizer Editing Requestor Signature Canvas

## Issue Description

When users with requisition roles (reviewer, approver, authorizer) tried to sign their respective sections in view mode, they were accidentally editing the **requestor's signature canvas** instead of their own.

### Root Cause

The "Requested By" signature section in view mode only displayed:
- Existing signature (if present), OR
- "No signature" text (if not present)

**Missing:** The ability for the requestor to sign in view mode.

This caused the `isSigning` state to be set to `true` (boolean) instead of a specific signature type string like `'reviewed'`, `'approved'`, or `'authorized'`. When other users clicked their sign buttons, the condition `isSigning === 'reviewed'` would fail because `isSigning` was `true`, causing ALL signature sections to render the same shared `sigPad` canvas.

## Solution

Updated the "Requested By" signature section to follow the same pattern as other signature sections:

### Changes Made

**File:** `src/components/Requisition/Requisition.js`

#### 1. View Mode - Requested By Section (Lines 794-826)

**Added:**
- Signature pad display when `isSigning === 'requestor'`
- Sign button for requestor even in view mode
- Proper conditional rendering logic

```javascript
{mode === 'view' ? (
  signature ? (
    <div className="signature-preview">
      <img src={signature} alt="Requestor Signature" />
    </div>
  ) : isSigning === 'requestor' ? (
    // Show signature pad when signing as requestor
    <div className="signature-pad-container">
      <SignatureCanvas 
        ref={sigPad}
        penColor="black"
        canvasProps={{className: 'sigCanvas'}}
      />
      <div className="sig-controls">
        <button className="btn-sig-clear" onClick={() => clearSignature('requestor')}>Clear</button>
        <button className="btn-sig-save" onClick={() => saveSignature('requestor')}>Save</button>
      </div>
    </div>
  ) : (
    // Show sign button for requestor even in view mode
    currentUser?.email ? (
      <button 
        className="btn-sign-trigger"
        onClick={() => {
          setIsSigning('requestor');
        }}
      >
        <i className='bx bx-pen'></i> Sign Request
      </button>
    ) : (
      <div className="no-signature">No signature</div>
    )
  )
) : (...)}
```

#### 2. Non-View Mode - Updated State Management

Changed from boolean-based to string-based state:
- `setIsSigning(true)` → `setIsSigning('requestor')`
- `isSigning` → `isSigning === 'requestor'`
- `clearSignature` → `clearSignature('requestor')`
- `saveSignature` → `saveSignature('requestor')`

## State Type Consistency

All signature types now use **string values** for `isSigning`:
- `'requestor'` - Requestor signature
- `'reviewed'` - Reviewer signature
- `'approved'` - Approver signature
- `'authorized'` - Authorizer signature

This ensures proper isolation between signature canvases.

## Testing Steps

### Test as Requestor:
1. ✅ Create a new requisition
2. ✅ Click "Click to Sign" or "Sign Request" button
3. ✅ **Expected:** Requestor signature pad appears (NOT other sections)
4. ✅ Draw and save signature
5. ✅ **Expected:** Signature saved correctly

### Test as Reviewer:
1. ✅ Open pending requisition in view mode
2. ✅ Enter name in "Reviewed By" field
3. ✅ Click "Sign Review" button
4. ✅ **Expected:** Reviewer signature pad appears (NOT requestor's)
5. ✅ Draw and save signature
6. ✅ **Expected:** Reviewer signature saved, requestor's unchanged

### Test as Approver:
1. ✅ Open reviewed requisition in view mode
2. ✅ Enter name in "Approved By" field
3. ✅ Click "Sign Approval" button
4. ✅ **Expected:** Approver signature pad appears (NOT requestor's or reviewer's)
5. ✅ Draw and save signature
6. ✅ **Expected:** Approver signature saved correctly

### Test as Authorizer:
1. ✅ Open approved requisition in view mode
2. ✅ Enter name in "Authorized By" field
3. ✅ Click "Sign Authorization" button
4. ✅ **Expected:** Authorizer signature pad appears (NOT others)
5. ✅ Draw and save signature
6. ✅ **Expected:** Authorizer signature saved correctly

## Signature Refs Summary

Each signature type has its own dedicated ref:
- `sigPad` - Requestor signature
- `reviewSigPad` - Reviewer signature
- `approveSigPad` - Approver signature
- `authorizeSigPad` - Authorizer signature

This prevents cross-contamination between signature canvases.

## Related Files

- ✅ `src/components/Requisition/Requisition.js` - Main fix applied
- ✅ `FIX_DUPLICATE_SIGNATURE_CANVAS_AND_EMAILS.md` - Previous related fix
- ✅ `FIX_SIGNATURE_PAD_NOT_SHOWING.md` - View mode signature pad implementation

## Status

✅ **FIXED** - Each role now signs on their own dedicated canvas without affecting others.
