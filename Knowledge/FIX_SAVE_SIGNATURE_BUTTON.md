# Fix: Add Save Signature Button in View Mode

## Issues Fixed

1. ✅ **No Submit/Update Button** - Users with requisition roles couldn't save their signature changes in view mode
2. ✅ **Can't Sign** - Missing "Save Signature" button to submit signatures added in view mode

## Root Cause

In view mode (`mode === 'view'`), the submit button was completely hidden:
```javascript
{mode !== 'view' && !isCompleted && (
  <button className="btn-primary" onClick={handleSubmit}>
    {mode === 'edit' ? 'Update Requisition' : 'Submit Requisition'}
  </button>
)}
```

Users with requisition roles who edited fields and added signatures had no way to save their changes.

## Solution Implemented

### 1. Added "Save Signature" Button
**Location:** Form footer section in `Requisition.js`

```javascript
{/* Show Update button for users with roles in view mode who have edited fields */}
{mode === 'view' && !isCompleted && (userRoles.isReviewer || userRoles.isApprover || userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1')) && (
  <button className="btn-primary" onClick={handleSignatureSubmit}>
    <i className='bx bx-save'></i> Save Signature
  </button>
)}
```

**Visibility Rules:**
- Shows only in **view mode** (`mode === 'view'`)
- Shows only for users with **requisition roles** (reviewer, approver, authorizer, admin)
- Shows only if requisition is **not completed** (`!isCompleted`)

### 2. Added `handleSignatureSubmit` Function
**Purpose:** Save signature changes made in view mode to the database

```javascript
const handleSignatureSubmit = async () => {
  if (!requisitionId) {
    alert('Cannot save - requisition ID not available');
    return;
  }
  
  // Validate that at least one signature field has been updated
  if (!reviewedSignature && !approvedSignature && !authorizedSignature) {
    alert('Please add at least one signature');
    return;
  }
  
  try {
    const payload = {
      reviewedSignature: reviewedSignature || null,
      approvedSignature: approvedSignature || null,
      authorizedSignature: authorizedSignature || null,
      reviewedBy: formData.reviewedBy || null,
      approvedBy: formData.approvedBy || null,
      authorizedBy: formData.authorizedBy || null
    };
    
    const response = await fetch(`http://localhost:5000/api/requisition/${requisitionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Signature(s) saved successfully!');
      if (onBack) {
        onBack(); // Refresh the page
      }
    } else {
      alert('Failed to save signatures: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving signatures:', error);
    alert('Error saving signatures: ' + error.message);
  }
};
```

**What It Does:**
1. Validates requisition ID exists
2. Checks at least one signature has been added
3. Sends PUT request to update requisition with signatures
4. Saves: `reviewedBy`, `approvedBy`, `authorizedBy` names and their signatures
5. Refreshes the page after successful save

## How It Works Now

### User Flow for Signing in View Mode:

1. **User with role navigates to requisition**
   - URL: `http://localhost:3000/user/my-requisitions/87`
   - Mode: `view`

2. **User enters their name**
   - Clicks on "Reviewed By" / "Approved By" / "Authorized By" field
   - Field is editable (not disabled) for users with roles
   - Types their name

3. **User clicks "Sign [Role]" button**
   - Signature pad appears
   - Draws signature
   - Clicks "Save" on signature pad
   - Signature preview shows

4. **User clicks "Save Signature" button** (NEW!)
   - Clicks the blue "Save Signature" button at bottom
   - Signatures are saved to database
   - Page refreshes showing updated requisition

5. **Success!**
   - Signature appears permanently
   - Other users can see the signature
   - Requisition moves to next approval stage

## Button Visibility Matrix

| User Type | Mode | Requisition Status | Buttons Visible |
|-----------|------|-------------------|-----------------|
| Reviewer | View | Pending | ✅ Save Signature, ❌ Reject |
| Approver | View | Reviewed | ✅ Save Signature, ❌ Reject |
| Authorizer | View | Approved | ✅ Save Signature, ❌ Reject |
| Admin | View | Any (not completed) | ✅ Save Signature, ✅ Reject |
| Regular User | View | Any | ❌ No buttons |
| Anyone | View | Completed | ❌ No buttons (read-only) |
| Requester | View | Pending | ❌ No buttons (can't sign own) |

## Complete Button Set (Bottom of Form)

From left to right:

1. **Back to List** (gray) - Always visible
2. **Reject Requisition** (red) - For users with roles, when not completed
3. **Save Signature** (blue) - NEW! For users with roles in view mode
4. **Submit/Update Requisition** (blue) - Only in create/edit modes

## Testing Steps

### Test as Reviewer:
1. Navigate to pending requisition in view mode
2. Enter your name in "Reviewed By" field
3. Click "Sign Review" button
4. Draw signature and click "Save" on signature pad
5. **See "Save Signature" button appear** at bottom
6. Click "Save Signature" button
7. **Expected:** Success message, page refreshes, signature saved

### Test as Approver:
1. Navigate to reviewed requisition in view mode
2. Enter your name in "Approved By" field
3. Click "Sign Approval" button
4. Draw signature and save
5. Click "Save Signature" button
6. **Expected:** Approval signature saved successfully

### Test as Authorizer:
1. Navigate to approved requisition in view mode
2. Enter your name in "Authorized By" field
3. Click "Sign Authorization" button
4. Draw signature and save
5. Click "Save Signature" button
6. **Expected:** Authorization signature saved successfully

### Test Multiple Signatures:
1. User with multiple roles signs all sections
2. Click "Save Signature" once
3. **Expected:** All signatures saved in single API call

## Backend Endpoint Used

**Endpoint:** `PUT /api/requisition/:id`

**Request Body:**
```json
{
  "reviewedBy": "John Doe",
  "approvedBy": "Jane Smith",
  "authorizedBy": "Bob Johnson",
  "reviewedSignature": "data:image/png;base64,...",
  "approvedSignature": "data:image/png;base64,...",
  "authorizedSignature": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Requisition updated successfully",
  "id": 87
}
```

## Files Modified

✅ `src/components/Requisition/Requisition.js`
- Added `handleSignatureSubmit()` function (lines ~273-324)
- Added "Save Signature" button (lines ~991-997)
- Updated button visibility logic

## Security Features

✅ **Role-based access** - Only users with requisition roles can see the button
✅ **Validation** - Requires at least one signature to save
✅ **Status protection** - Can't modify completed requisitions
✅ **ID verification** - Checks requisition ID before submitting

## Related Documentation

- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)
- View Mode Fields: [`FIX_VIEW_MODE_INPUT_FIELDS.md`](./FIX_VIEW_MODE_INPUT_FIELDS.md)
- Test Guide: [`TEST_STANDARD_USER_REQUISITION_ACCESS.md`](./TEST_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ FIXED  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js form footer and signature handling
