# Quick Test Guide - Standard User Requisition Access

## What Was Fixed
Standard users with requisition roles can now:
1. View individual requisition pages (e.g., `http://localhost:3000/user/my-requisitions/87`)
2. Reject requisitions based on their roles
3. Sign requisitions in view mode

## How to Test

### Step 1: Setup Test User
1. Login as admin
2. Go to User Access Control
3. Create or select a standard user
4. Assign them one or more requisition roles:
   - Reviewer
   - Approver  
   - Authorizer
5. Save changes

### Step 2: Test Viewing Requisitions
1. Logout from admin
2. Login as the standard user with requisition roles
3. Navigate to "My Requisitions" → "View My Requests"
4. You should see a list of requisitions
5. Click the **Edit** button (pencil icon) on any requisition
6. **Expected:** URL should change to `/user/my-requisitions/:id` and page should load

### Step 3: Test Role-Based Actions

#### If User Has Reviewer Role:
1. Find a pending requisition
2. Enter a name in "Reviewed By" field
3. Click "Sign Review" button
4. Draw signature and save
5. **Expected:** Signature appears in the review section

#### If User Has Approver Role:
1. Find a requisition that has been reviewed
2. Enter a name in "Approved By" field
3. Click "Sign Approval" button
4. Draw signature and save
5. **Expected:** Signature appears in the approval section

#### If User Has Authorizer Role:
1. Find a requisition that has been approved
2. Enter a name in "Authorized By" field
3. Click "Sign Authorization" button
4. Draw signature and save
5. **Expected:** Signature appears in the authorization section

### Step 4: Test Rejection
1. Find any pending requisition (not completed)
2. Scroll to bottom of the page
3. Click "Reject Requisition" button (red button)
4. **Expected:** Rejection modal appears
5. Enter a rejection reason (e.g., "Missing information")
6. Click "Reject"
7. **Expected:** 
   - Success message appears
   - Modal closes
   - Redirected back to requisition list
   - Requester receives email notification

### Step 5: Test Access Control
1. Create another standard user WITHOUT any requisition roles
2. Login as this user
3. Go to "My Requisitions" → "View My Requests"
4. Try to click edit on a requisition
5. **Expected:** 
   - No "Sign Review", "Sign Approval", or "Sign Authorization" buttons visible
   - No "Reject Requisition" button visible
   - Can only view details

## Expected URLs

| Page | URL Pattern | Example |
|------|-------------|---------|
| My Requisitions List | `/user/my-requisitions/list` | `http://localhost:3000/user/my-requisitions/list` |
| Create Requisition | `/user/my-requisitions/create` | `http://localhost:3000/user/my-requisitions/create` |
| View/Edit Requisition | `/user/my-requisitions/:id` | `http://localhost:3000/user/my-requisitions/87` |

## Common Issues & Solutions

### Issue: Page shows "Access Denied"
**Cause:** User doesn't have requisition roles
**Solution:** Admin needs to assign requisition roles to the user

### Issue: Can't see reject button
**Possible Causes:**
1. User doesn't have requisition role → Assign role
2. Requisition is already completed (all signatures) → Can't reject completed requisitions
3. User is the requester → Requesters can't reject their own requisitions

### Issue: Can't see signature buttons
**Possible Causes:**
1. User doesn't have the specific role → Check role assignment
2. Field is empty (e.g., "Reviewed By") → Enter name first
3. Requisition is completed → Already fully signed

### Issue: Edit button doesn't work
**Cause:** Missing navigation handler
**Solution:** Verify StandardUserLayout.js has onEditRequisition prop

## Success Criteria

✅ Standard users with requisition roles can:
- View individual requisition pages
- See signature buttons based on their roles
- Sign requisitions they have permission for
- Reject pending requisitions
- Receive confirmation messages

✅ Standard users without requisition roles can:
- View their own requisitions
- Cannot sign or reject requisitions
- See appropriate access denied messages

✅ All actions are role-based and secure

## Troubleshooting Commands

### Check User Roles (Backend Console)
```sql
-- Check if user has requisition roles
SELECT u.email, u.full_name, rr.role_type, rr.is_active
FROM users u
LEFT JOIN requisition_roles rr ON u.id = rr.user_id
WHERE u.email = 'test@example.com';
```

### Check Requisition Status (Database)
```sql
-- Check requisition status and signatures
SELECT id, requestor_name, status, reviewed_signature, 
       approved_signature, authorized_signature, created_at
FROM requisitions
WHERE id = 87;
```

### Test API Endpoint (Browser Console)
```javascript
// Check your requisition roles
fetch('http://localhost:5000/api/user/requisition-roles?email=your@email.com')
  .then(r => r.json())
  .then(console.log);
```

## Next Steps After Testing

If everything works:
1. ✅ Mark as complete
2. ✅ Document any additional features needed
3. ✅ Deploy to production (if testing in dev environment)

If issues found:
1. ❌ Note the specific issue
2. ❌ Check browser console for errors
3. ❌ Check backend logs for errors
4. ❌ Report issue with screenshots

---

**Testing Date:** _______________  
**Tested By:** _______________  
**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________________________________
