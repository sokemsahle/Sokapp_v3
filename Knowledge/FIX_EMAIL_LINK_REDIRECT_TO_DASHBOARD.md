# Fix: Email Link Redirecting to Dashboard

## Problem
When clicking the requisition link from email notifications (e.g., `http://localhost:3000/requisitions/86`), users were redirected to the dashboard instead of viewing the requisition.

## Root Cause
The email links use the format `/requisitions/:id`, but the routes were only defined as:
- `/admin/requisitions/:id/edit` (for editing)
- No route existed for viewing a requisition at `/requisitions/:id`

When the URL didn't match any defined route, it fell through to the catch-all route which redirects to the dashboard.

## Solution

### 1. Added Universal Route Handler in App.js (PRIMARY FIX)
**File:** `src/App.js`

Added a top-level route that catches all `/requisitions/:id` URLs and redirects based on user type:

```javascript
// Redirect component for requisition email links
const RequisitionRedirect = ({ currentUser }) => {
  const { id } = useParams();
  const isAdmin = currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1';
  return <Navigate to={isAdmin ? `/admin/requisitions/${id}` : `/user/my-requisitions/${id}`} />;
};

// In the Routes section:
<Route 
  path="/requisitions/:id" 
  element={<RequisitionRedirect currentUser={currentUser} />} 
/>
```

This ensures that when users click email links like `http://localhost:3000/requisitions/86`:
- **Admin users** are redirected to `/admin/requisitions/86`
- **Standard users** are redirected to `/user/my-requisitions/86`

### 2. Added View Route to AdminLayout
**File:** `src/layouts/AdminLayout.js`

Added a new route for viewing requisitions (used after redirect):
```javascript
{/* View requisition route (for email links) - defaults to view mode */}
<Route path="/requisitions/:id" element={
  <RequisitionWithParams mode="view" currentUser={currentUser} onBack={() => navigate('/admin/requisitions')} />
} />
```

This route sits between `/requisitions/list` and `/requisitions/:id/edit` to ensure proper matching.

### 3. Updated Requisition Component to Support View Mode
**File:** `src/components/Requisition/Requisition.js`

**Change 1:** Fetch data in view mode
```javascript
// Fetch requisition data when in edit or view mode
useEffect(() => {
  if ((mode === 'edit' || mode === 'view') && requisitionId) {
    console.log('DEBUG: Edit/View mode detected, fetching requisition data for ID:', requisitionId);
    fetchRequisitionData(requisitionId);
  }
}, [mode, requisitionId]);
```

**Change 2:** Only enable editing in edit mode (not view mode)
```javascript
const [isEditing, setIsEditing] = useState(mode === 'edit'); // Only enable editing in edit mode
```

## How It Works Now

### Complete Flow:
1. **Email Link Clicked:** User clicks `http://localhost:3000/requisitions/86`
2. **App.js Catches Route:** The `/requisitions/:id` route in App.js matches
3. **User Type Detected:** RequisitionRedirect component checks if user is admin or standard
4. **Smart Redirect:**
   - Admin → `/admin/requisitions/86`
   - Standard → `/user/my-requisitions/86`
5. **View Mode Loaded:** Requisition component loads in "view" mode (read-only)
6. **Data Fetched:** Requisition data is fetched and displayed
7. **User Can View:** User can see all requisition details but cannot edit

## Testing Checklist

### For Admin Users
- [ ] Click email link: `http://localhost:3000/requisitions/86`
- [ ] Should redirect to `/admin/requisitions/86`
- [ ] Should show requisition in view mode (read-only)
- [ ] All fields should be visible but not editable
- [ ] Back button should navigate to `/admin/requisitions`
- [ ] Signature pads should be visible (if applicable based on user role)

### For Standard Users
- [ ] Click email link: `http://localhost:3000/requisitions/86`
- [ ] Should redirect to `/user/my-requisitions/86`
- [ ] Should show requisition in view mode (read-only)
- [ ] All fields should be visible but not editable
- [ ] Back button should navigate to standard user requisition list

## Future Improvements

### Option 1: Update Email Links (Recommended)
Update email templates to use the full path based on user type:
- For admins: `http://localhost:3000/admin/requisitions/86`
- For standard users: `http://localhost:3000/user/my-requisitions/86`

### Option 2: Add Universal Route Handler
Add a top-level route in App.js that detects user type and redirects:
```javascript
<Route path="/requisitions/:id" element={<RequisitionRedirect />} />
```

## Files Modified
1. `src/App.js` - Added universal requisition route handler (PRIMARY FIX)
2. `src/layouts/AdminLayout.js` - Added view route
3. `src/components/Requisition/Requisition.js` - Enabled view mode support

## Related Documentation
- `LOCALHOST_PORT_CONFIGURATION_SUMMARY.md` - Email URL configuration
- `REQUISITION_EMAIL_WORKFLOW.md` - Email notification workflow
- `FIX_REQUISITION_BLANK_PAGES.md` - Previous requisition routing fixes
