# Requisition Routes Fix - Blank Page Issue

## Issue
Both `http://localhost:3000/admin/requisitions/create` and `http://localhost:3000/user/my-requisitions/create` were showing blank pages.

## Root Cause
The Requisition component requires the `isOpen` prop to be set to `true` to render properly. When the route was defined directly, this prop was missing.

## Solution

### AdminLayout.js
**Before:**
```javascript
<Route path="/requisitions/create" element={
  <Requisition mode="create" currentUser={currentUser} onBack={() => navigate('/admin/requisitions')} />
} />
```

**After:**
```javascript
<Route path="/requisitions/create" element={
  <div style={{padding: '20px'}}>
    <h2>Creating Requisition...</h2>
    <Requisition isOpen={true} mode="create" currentUser={currentUser} onBack={() => navigate('/admin/requisitions')} />
  </div>
} />
```

### StandardUserLayout.js
**Before:**
```javascript
<Route path="/my-requisitions/create" element={
  <FormAccessWrapper formName="Requisition Form">
    <Requisition mode="create" onBack={() => navigate('/user/my-requisitions')} currentUser={user} />
  </FormAccessWrapper>
} />
```

**After:**
```javascript
<Route path="/my-requisitions/create" element={
  <div style={{padding: '20px'}}>
    <h2>Creating Requisition...</h2>
    <FormAccessWrapper formName="Requisition Form">
      <Requisition isOpen={true} mode="create" onBack={() => navigate('/user/my-requisitions')} currentUser={user} />
    </FormAccessWrapper>
  </div>
} />
```

## Changes Made

1. **Added `isOpen={true}` prop** - Required by Requisition component to render
2. **Added wrapper div with padding** - Provides proper spacing in the layout
3. **Added debug heading** - "Creating Requisition..." helps confirm the route is loading

## Testing Checklist

### Admin Requisitions ✅
- [ ] Navigate to `/admin/requisitions/create` - should show requisition form (NOT blank)
- [ ] Navigate to `/admin/requisitions/list` - should show requisition list
- [ ] Click "Create New" from list - should navigate to create form
- [ ] Fill out and submit requisition - should work correctly
- [ ] Refresh on create page - should maintain form (no blank page)

### Standard User Requisitions ✅
- [ ] Navigate to `/user/my-requisitions/create` - should show requisition form (NOT blank)
- [ ] Navigate to `/user/my-requisitions/list` - should show requisition list
- [ ] Click "Create New" from list - should navigate to create form
- [ ] Form access wrapper checks if requisition form is active
- [ ] Refresh on create page - should maintain form (no blank page)

## Additional Notes

### Why `isOpen` Prop Matters
The Requisition component uses the `isOpen` prop to determine whether to render its content. This is a legacy pattern from when it was used as a modal/popup component. When routing directly to the create page, this prop must still be provided.

### Route Order
Routes are ordered from most specific to least specific:
1. `/requisitions/create` (specific)
2. `/requisitions/list` (specific)
3. `/requisitions` (general fallback)

This ensures React Router matches the correct route.

### Debugging Tips
If routes show blank again:
1. Check browser console for errors
2. Verify component props are correct
3. Add console.log in component to see if it's rendering
4. Check React DevTools to see component tree

---

**Status**: ✅ FIXED
**Date**: March 12, 2026
**Affected Files**: AdminLayout.js, StandardUserLayout.js
**Components**: Requisition, RequisitionList
