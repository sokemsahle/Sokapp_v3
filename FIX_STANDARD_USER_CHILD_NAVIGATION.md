# Standard User Child Navigation Fix

## Issue
When clicking on a child in the standard user interface (`http://localhost:3000/user/children`), it was redirecting to dashboard instead of opening the child detail page.

## Root Cause
Child components (ChildList, ChildLayout) were hardcoded to navigate to `/admin/children/*` paths, even when used in the StandardUserLayout which uses `/user/children/*` paths.

## Solution
Added a `basePath` prop to child components to make navigation dynamic based on which layout is using them.

---

## Changes Made

### 1. ChildList.js
**Added basePath prop:**
```javascript
const ChildList = ({ user, basePath = '/admin' }) => {
```

**Updated all navigation calls:**
```javascript
// Create button
navigate(`${basePath}/children/new`);

// Row click handler
navigate(`${basePath}/children/${child.id}`);

// View button
navigate(`${basePath}/children/${child.id}`);
```

### 2. ChildLayout.js
**Added basePath prop:**
```javascript
const ChildLayout = ({ user, childId, onBack, basePath = '/admin' }) => {
```

**Updated all navigation calls:**
```javascript
// Fallback when no ID
navigate(`${basePath}/children`);

// After delete
navigate(`${basePath}/children`);

// Error back button
navigate(`${basePath}/children`);

// Back arrow button
navigate(`${basePath}/children`);

// Dashboard button
navigate(`${basePath}/dashboard`);

// Edit profile button
navigate(`${basePath}/children/${effectiveChildId}/edit`);
```

### 3. AdminLayout.js
**Pass basePath="/admin" to child components:**
```javascript
<Route path="/children" element={<ChildList user={currentUser} basePath="/admin" />} />
<Route path="/children/:id" element={<ChildLayout user={currentUser} basePath="/admin" />} />
```

### 4. StandardUserLayout.js
**Pass basePath="/user" to child components:**
```javascript
<Route path="/children" element={<ChildList user={user} basePath="/user" />} />
<Route path="/children/:id" element={<ChildLayout user={user} basePath="/user" />} />
```

---

## Route Structure (Both Working)

### Admin Routes
```
/admin/children → Child list
/admin/children/:id → Child detail
/admin/children/:id/edit → Edit child
/admin/children/new → Create child
```

### Standard User Routes
```
/user/children → Child list
/user/children/:id → Child detail
/user/children/:id/edit → Edit child
/user/children/new → Create child
```

---

## Testing Checklist

### Standard User Child Profiles ✅
- [ ] Navigate to `/user/children` - shows child list
- [ ] Click on any child row - navigates to `/user/children/:id` and shows details (NOT dashboard!)
- [ ] Click "Add New Child" button - navigates to `/user/children/new` (if permitted)
- [ ] Click edit button on child view - navigates to `/user/children/:id/edit` (if permitted)
- [ ] Click back arrow from child view - returns to `/user/children`
- [ ] Click dashboard button - goes to `/user/dashboard`
- [ ] Delete a child - redirects to `/user/children`
- [ ] Refresh on any child page - maintains state (no blank page)
- [ ] Direct URL access (e.g., `/user/children/1`) - works correctly

### Admin Child Profiles ✅
- [ ] Navigate to `/admin/children` - shows child list
- [ ] Click on any child row - navigates to `/admin/children/:id` and shows details
- [ ] All admin child navigation still works as before
- [ ] No regression in admin functionality

---

## Benefits of This Approach

### 1. Reusable Components
- Same ChildList and ChildLayout components work for both admin and standard users
- No need to duplicate components for different user types
- Easy to maintain - fix once, works everywhere

### 2. Flexible Navigation
- basePath prop allows dynamic path construction
- Default value ensures backward compatibility
- Easy to add new user types in the future

### 3. Clean Architecture
- Layouts control the routing context
- Child components are agnostic of which layout uses them
- Follows React best practices for prop-based configuration

---

## Additional Notes

### Permission Checks Still Apply
Standard users can only access child profiles if they have the `child_view` permission. The menu items are filtered based on permissions in the layout's `getMenuItems()` function.

### Default BasePath
The default value `basePath = '/admin'` ensures that if the prop is accidentally omitted, the component will still work in admin context (backward compatibility).

### Future Enhancements
If needed, you could also add:
- `onBack` callback prop for custom back behavior
- Different feature availability based on basePath
- Custom styling based on user type

---

**Status**: ✅ FIXED
**Date**: March 12, 2026
**Affected Files**: ChildList.js, ChildLayout.js, AdminLayout.js, StandardUserLayout.js
**Pattern**: Prop-based path configuration for reusable components
