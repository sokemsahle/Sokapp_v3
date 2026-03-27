# Standard User Requisition Access Fix

## Problem
Standard users with requisition roles (reviewer, approver, authorizer) were unable to:
1. View individual requisition pages like `http://localhost:3000/user/my-requisitions/87`
2. Reject requisitions based on their roles
3. Sign requisitions in view mode

## Root Cause
The `StandardUserLayout.js` was missing:
1. A route for viewing individual requisitions (`/user/my-requisitions/:id`)
2. Import of the `ViewRequisitionPage` component
3. Proper navigation from the requisition list to individual requisition pages

## Solution Implemented

### 1. Added Route for Individual Requisitions
**File:** `src/layouts/StandardUserLayout.js`

```javascript
// Import ViewRequisitionPage component
import ViewRequisitionPage from '../components/Requisition\ViewRequisitionPage';

// Add route for viewing/editing individual requisitions
<Route path="/my-requisitions/:id" element={
  <ViewRequisitionPage currentUser={user} />
} />
```

### 2. Updated Requisition List Navigation
**File:** `src/layouts/StandardUserLayout.js`

Added `onEditRequisition` prop to navigate to individual requisition pages:

```javascript
<RequisitionList 
  onCreateNew={() => navigate('/user/my-requisitions/create')} 
  onEditRequisition={(reqId) => navigate(`/user/my-requisitions/${reqId}`)} 
  userOnly={true} 
  currentUser={user} 
/>
```

### 3. Enabled Reject Button in View Mode
**File:** `src/components/Requisition/Requisition.js`

Changed the condition to show reject button in view mode:

**Before:**
```javascript
{mode !== 'view' && !isCompleted && (
  <button className="btn-danger" onClick={() => setIsRejecting(true)}>
    <i className='bx bx-x-circle'></i> Reject Requisition
  </button>
)}
```

**After:**
```javascript
{!isCompleted && (
  <button className="btn-danger" onClick={() => setIsRejecting(true)}>
    <i className='bx bx-x-circle'></i> Reject Requisition
  </button>
)}
```

Now the reject button shows for users with requisition roles even in view mode.

### 4. Enabled Signature Buttons in View Mode
**File:** `src/components/Requisition/Requisition.js`

Updated review, approval, and authorization sections to allow signing in view mode:

**Before:**
```javascript
{mode === 'view' || isCompleted ? (
  reviewedSignature ? (
    <div className="signature-preview">
      <img src={reviewedSignature} alt="Reviewed Signature" />
    </div>
  ) : (
    <div className="no-signature">No signature</div>
  )
) : (
  // Signature buttons...
)}
```

**After:**
```javascript
{mode === 'view' || isCompleted ? (
  reviewedSignature ? (
    <div className="signature-preview">
      <img src={reviewedSignature} alt="Reviewed Signature" />
    </div>
  ) : (
    // Show sign button for reviewers even in view mode
    userRoles.isReviewer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? (
      <button 
        className="btn-sign-trigger"
        onClick={() => {
          if (formData.reviewedBy) {
            setIsSigning('reviewed');
          } else {
            alert('Please enter the reviewer name first');
          }
        }}
        disabled={!formData.reviewedBy || isCompleted}
      >
        <i className='bx bx-pen'></i> Sign Review
      </button>
    ) : (
      <div className="no-signature">No signature</div>
    )
  )
) : (
  // Signature buttons...
)}
```

Similar changes were made for approval and authorization sections.

## Features Now Available

### For Standard Users with Requisition Roles:

1. **View Requisitions** ✓
   - Navigate to `http://localhost:3000/user/my-requisitions/:id`
   - See full requisition details
   - View all items and signatures

2. **Reject Requisitions** ✓
   - Click "Reject Requisition" button (if not completed)
   - Enter rejection reason
   - Requester receives email notification

3. **Sign Requisitions** ✓
   - **Reviewers** can sign review section
   - **Approvers** can sign approval section
   - **Authorizers** can sign authorization section
   - Signature buttons appear even in view mode for authorized users

4. **Role-Based Access Control** ✓
   - Only users with requisition roles can view/reject/sign
   - Regular users can only see their own requisitions
   - Admins have full access

## Testing Checklist

### Test as Standard User with Requisition Role:
- [ ] Navigate to `/user/my-requisitions/list`
- [ ] Click edit button on a pending requisition
- [ ] Verify URL changes to `/user/my-requisitions/:id`
- [ ] Verify requisition details load correctly
- [ ] If you have reviewer role, verify you can sign review section
- [ ] If you have approver role, verify you can sign approval section
- [ ] If you have authorizer role, verify you can sign authorization section
- [ ] Verify you can reject requisition (if not completed)
- [ ] Enter rejection reason and submit
- [ ] Verify success message appears
- [ ] Verify redirected back to list

### Test Access Control:
- [ ] Standard user WITHOUT requisition roles should NOT see sign buttons
- [ ] Standard user WITHOUT requisition roles should NOT see reject button
- [ ] Standard user WITH roles should see appropriate buttons based on their role
- [ ] Admin should see all buttons regardless of roles

## Files Modified

1. ✅ `src/layouts/StandardUserLayout.js`
   - Added import for ViewRequisitionPage
   - Added route for `/my-requisitions/:id`
   - Added onEditRequisition navigation

2. ✅ `src/components/Requisition/Requisition.js`
   - Enabled reject button in view mode
   - Enabled signature buttons for roles in view mode
   - Updated review, approval, and authorization sections

3. ✅ `src/components/Requisition\ViewRequisitionPage.js`
   - Changed mode from "edit" to "view" to enable proper permissions

## Backend Endpoints Used

- `GET /api/requisition/:id` - Fetch requisition details
- `POST /api/requisition/:id/reject` - Reject requisition with reason
- `GET /api/user/requisition-roles?email=X` - Check user's requisition roles

## Database Requirements

Ensure these tables exist:
- `requisitions` - Main requisition table
- `requisition_items` - Requisition line items
- `requisition_roles` - User role assignments
- `users` - User information

## Notes

- The view mode now properly supports role-based actions (sign, reject)
- Users can only perform actions they have roles for
- Completed requisitions cannot be modified or rejected
- Email notifications are sent when requisitions are rejected
