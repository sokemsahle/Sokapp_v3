# Fix: Input Fields Disabled in View Mode

## Issue
Users with requisition roles (reviewer, approver, authorizer) were unable to:
1. Edit their name in the "Reviewed By", "Approved By", or "Authorized By" fields
2. Sign requisitions because the input fields were disabled in view mode

## Root Cause
In `Requisition.js`, the input fields for reviewer, approver, and authorizer names had:
- `disabled={mode === 'view' || isCompleted}` - Always disabled in view mode
- `onChange={mode === 'view' ? undefined : handleInputChange}` - No change handler in view mode

This prevented users with requisition roles from entering their names to sign.

## Solution

### Updated Field Logic
Changed the `disabled` and `onChange` attributes to check if the user has the appropriate role:

**Before:**
```javascript
<input 
  type="text" 
  value={formData.reviewedBy} 
  onChange={mode === 'view' ? undefined : handleInputChange}
  disabled={mode === 'view' || isCompleted}
/>
```

**After:**
```javascript
<input 
  type="text" 
  value={formData.reviewedBy} 
  onChange={(mode === 'view' && (userRoles.isReviewer || currentUser?.is_admin)) ? handleInputChange : undefined}
  disabled={mode === 'view' && !(userRoles.isReviewer || currentUser?.is_admin) || isCompleted}
/>
```

### Applied To All Signature Fields
1. ✅ **Reviewed By** field - enabled for reviewers
2. ✅ **Approved By** field - enabled for approvers  
3. ✅ **Authorized By** field - enabled for authorizers

## Behavior Now

### For Users WITH Requisition Roles:
- ✅ Can edit their name field in view mode
- ✅ Can click signature button after entering name
- ✅ Can draw and save signature
- ✅ Signature appears in the requisition

### For Users WITHOUT Requisition Roles:
- ❌ Cannot edit name fields (still disabled)
- ❌ Cannot see signature buttons
- ❌ Can only view existing signatures

### For Completed Requisitions:
- ❌ All fields remain disabled regardless of role
- ℹ️ Completed requisitions cannot be modified

## Testing

### Test as Reviewer:
1. Navigate to a pending requisition in view mode
2. Click on "Reviewed By" field
3. **Expected:** Field is editable, can type name
4. Enter your name
5. Click "Sign Review" button
6. **Expected:** Signature pad opens
7. Draw signature and save
8. **Expected:** Signature appears in review section

### Test as Approver:
1. Navigate to a reviewed requisition in view mode
2. Click on "Approved By" field
3. **Expected:** Field is editable, can type name
4. Enter your name
5. Click "Sign Approval" button
6. **Expected:** Signature pad opens
7. Draw signature and save
8. **Expected:** Signature appears in approval section

### Test as Authorizer:
1. Navigate to an approved requisition in view mode
2. Click on "Authorized By" field
3. **Expected:** Field is editable, can type name
4. Enter your name
5. Click "Sign Authorization" button
6. **Expected:** Signature pad opens
7. Draw signature and save
8. **Expected:** Signature appears in authorization section

### Test as User WITHOUT Role:
1. Navigate to any requisition in view mode
2. Try to click on any signature field
3. **Expected:** Fields are disabled, cannot edit
4. **Expected:** No signature buttons visible

## Files Modified

- ✅ `src/components/Requisition/Requisition.js`
  - Updated "Reviewed By" field (lines 729-735)
  - Updated "Approved By" field (lines 779-785)
  - Updated "Authorized By" field (lines 831-837)

## Code Changes Summary

| Field | Changed Attribute | Old Value | New Value |
|-------|------------------|-----------|-----------|
| Reviewed By | `disabled` | `mode === 'view' \|\| isCompleted` | `mode === 'view' && !userRoles.isReviewer \|\| isCompleted` |
| Reviewed By | `onChange` | `mode === 'view' ? undefined : handleInputChange` | Conditional based on role |
| Approved By | `disabled` | `mode === 'view' \|\| isCompleted` | `mode === 'view' && !userRoles.isApprover \|\| isCompleted` |
| Approved By | `onChange` | `mode === 'view' ? undefined : handleInputChange` | Conditional based on role |
| Authorized By | `disabled` | `mode === 'view' \|\| isCompleted` | `mode === 'view' && !userRoles.isAuthorizer \|\| isCompleted` |
| Authorized By | `onChange` | `mode === 'view' ? undefined : handleInputChange` | Conditional based on role |

## Security Notes

✅ **Role-based access maintained** - Only users with specific roles can edit corresponding fields
✅ **Admin override preserved** - Admins can edit all fields regardless of roles
✅ **Completion protection** - Completed requisitions cannot be modified by anyone
✅ **No unauthorized access** - Users without roles still cannot edit fields

## Related Documentation

- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)
- Test Guide: [`TEST_STANDARD_USER_REQUISITION_ACCESS.md`](./TEST_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ FIXED  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js signature fields
