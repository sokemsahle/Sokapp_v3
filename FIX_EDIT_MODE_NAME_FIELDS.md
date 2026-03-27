# Fix: Enable Editing Name Fields in Edit Mode

## Issue
In edit mode (`mode === 'edit'`), users couldn't edit the name fields:
- "Reviewed By" field was not editable
- "Approved By" field was not editable
- "Authorized By" field was not editable

## Root Cause
The `onChange` and `disabled` attributes on the input fields were only checking for **view mode** with role-based permissions, but didn't account for **edit mode**.

### Previous Logic (WRONG):
```javascript
// onChange only worked in view mode with proper role
onChange={(mode === 'view' && userHasRole) ? handleInputChange : undefined}

// disabled in view mode without role OR completed
disabled={mode === 'view' && !userHasRole || isCompleted}
```

**Problem:** In edit mode, these conditions evaluated to:
- `onChange`: `(false && anything) = false` → No change handler
- `disabled`: `false || isCompleted` → Only disabled if completed

But without an `onChange` handler, the fields couldn't be edited!

## Solution

Updated all three signature sections to allow editing in both:
1. **View mode** - For users with requisition roles
2. **Edit mode** - For all authorized users (no role check needed)

### Changes Made

**File:** `src/components/Requisition/Requisition.js`

#### 1. Reviewed By Field (Line ~785-788)
**Before:**
```javascript
<input 
  type="text" 
  value={formData.reviewedBy} 
  onChange={(mode === 'view' && userRoles.isReviewer) ? handleInputChange : undefined}
  disabled={mode === 'view' && !userRoles.isReviewer || isCompleted}
/>
```

**After:**
```javascript
<input 
  type="text" 
  value={formData.reviewedBy} 
  onChange={(mode === 'view' && userRoles.isReviewer) || mode === 'edit' ? handleInputChange : undefined}
  disabled={(mode === 'view' && !userRoles.isReviewer) || isCompleted}
/>
```

#### 2. Approved By Field (Line ~866-869)
Same pattern updated for approvers

#### 3. Authorized By Field (Line ~947-950)
Same pattern updated for authorizers

## How It Works Now

### Edit Mode Behavior:
```
Mode: 'edit'
┌──────────────────────────────┐
│ Reviewed By: [John Doe____]  │ ← Editable ✓
│                              │
│ Approved By: [Jane Smith__]  │ ← Editable ✓
│                              │
│ Authorized By: [Bob Johnson] │ ← Editable ✓
│                              │
│ [✏️ Sign Review]             │ ← Can sign
│ [✏️ Sign Approval]           │ ← Can sign
│ [✏️ Sign Authorization]      │ ← Can sign
│                              │
│ [Update Requisition]         │ ← Saves all changes
└──────────────────────────────┘
```

### View Mode Behavior (Unchanged):
```
Mode: 'view' + User has role
┌──────────────────────────────┐
│ Reviewed By: [_____________] │ ← Editable ✓ (has role)
│                              │
│ [✏️ Sign Review]             │ ← Can sign
│                              │
│ [💾 Save Signature]          │ ← Saves signatures
└──────────────────────────────┘

Mode: 'view' + User NO role
┌──────────────────────────────┐
│ Reviewed By: [Disabled]      │ ← Disabled ✗
│                              │
│ No signature                 │ ← Just text
└──────────────────────────────┘
```

## Conditional Logic Summary

### onChange Handler:
```javascript
onChange = 
  (mode === 'view' && userHasRole)   // View mode with role
  || 
  mode === 'edit'                     // OR edit mode (anyone)
    ? handleInputChange               // Allow changes
    : undefined                       // Don't allow changes
```

### disabled Attribute:
```javascript
disabled = 
  (mode === 'view' && !userHasRole)  // View mode without role
  || 
  isCompleted                         // OR requisition completed
    ? true                            // Disable field
    : false                           // Enable field
```

## Testing Steps

### Test in Edit Mode:
1. ✅ Navigate to requisition in edit mode
2. ✅ Click on "Reviewed By" field
3. ✅ **Expected:** Field is editable, can type
4. ✅ Enter new reviewer name
5. ✅ Click on "Approved By" field
6. ✅ **Expected:** Field is editable, can type
7. ✅ Enter new approver name
8. ✅ Click on "Authorized By" field
9. ✅ **Expected:** Field is editable, can type
10. ✅ Enter new authorizer name
11. ✅ Click "Update Requisition"
12. ✅ **Expected:** All names saved successfully

### Test in View Mode (With Role):
1. ✅ Navigate to requisition in view mode
2. ✅ Ensure you have the appropriate role
3. ✅ Click on "Reviewed By" field
4. ✅ **Expected:** Field is editable
5. ✅ Enter name
6. ✅ Click "Sign Review"
7. ✅ **Expected:** Signature pad appears
8. ✅ Draw and save signature
9. ✅ Click "Save Signature"
10. ✅ **Expected:** Signatures saved

### Test in View Mode (Without Role):
1. ✅ Navigate to requisition in view mode
2. ✅ Ensure you DON'T have the role
3. ✅ Try to click on "Reviewed By" field
4. ✅ **Expected:** Field is disabled, can't edit
5. ✅ **Expected:** Shows "No signature" or existing signature

## Comparison: Edit Mode vs View Mode

| Feature | Edit Mode | View Mode (with role) | View Mode (no role) |
|---------|-----------|----------------------|---------------------|
| **Edit Names** | ✅ Yes | ✅ Yes | ❌ No |
| **Add Signatures** | ✅ Yes | ✅ Yes | ❌ No |
| **Save Button** | Update Requisition | Save Signature | N/A |
| **API Endpoint** | PUT /api/requisition/:id | PUT /api/requisition/:id | N/A |
| **Saves Everything** | ✅ Yes | ✅ Signatures only | N/A |

## What Gets Saved

### Edit Mode (Clicking "Update Requisition"):
```javascript
const payload = {
  requestor: formData.requestor,
  department: formData.department,
  description: formData.description,
  requestedBy: formData.requestedBy,
  reviewedBy: formData.reviewedBy,      // ← Updated name
  approvedBy: formData.approvedBy,      // ← Updated name
  authorizedBy: formData.authorizedBy,  // ← Updated name
  reviewedSignature: reviewedSignature, // ← Signature if added
  approvedSignature: approvedSignature, // ← Signature if added
  authorizedSignature: authorizedSignature, // ← Signature if added
  // ... other fields
};
```

### View Mode (Clicking "Save Signature"):
```javascript
const payload = {
  reviewed_signature: reviewedSignature, // ← Signature only
  approved_signature: approvedSignature,
  authorized_signature: authorizedSignature,
  reviewed_by: formData.reviewedBy,      // ← Name
  approved_by: formData.approvedBy,      // ← Name
  authorized_by: formData.authorizedBy   // ← Name
};
```

## Files Modified

✅ `src/components/Requisition/Requisition.js`
- Updated Reviewed By field onChange and disabled logic
- Updated Approved By field onChange and disabled logic
- Updated Authorized By field onChange and disabled logic

## Related Documentation

- Signature Pad Fix: [`FIX_SIGNATURE_PAD_NOT_SHOWING.md`](./FIX_SIGNATURE_PAD_NOT_SHOWING.md)
- 500 Error Fix: [`FIX_500_ERROR_SIGNATURE_SAVE.md`](./FIX_500_ERROR_SIGNATURE_SAVE.md)
- Save Button: [`FIX_SAVE_SIGNATURE_BUTTON.md`](./FIX_SAVE_SIGNATURE_BUTTON.md)
- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ FIXED  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js signature input fields  
**Impact:** Users can now edit reviewer, approver, and authorizer names in edit mode
