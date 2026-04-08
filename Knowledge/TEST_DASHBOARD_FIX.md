# Testing Guide: Dashboard & Requisition Fixes

## Quick Test Checklist

### ✅ Test 1: Create Requisition → Dashboard Navigation
**Steps:**
1. Login as admin
2. Click "Requisition" in sidebar (should expand submenu)
3. Click "Create New"
4. **Expected**: Requisition form appears
5. Fill in minimal required fields:
   - Requestor Name: "Test User"
   - Department: Select any
   - Requested By: "Test"
   - Add one item with description
6. Click "Submit Requisition"
7. **Expected**: Success message appears
8. After submit, you're back at Requisition List
9. **NOW CLICK "DASHBOARD"**
10. **Expected**: Dashboard loads immediately and shows stats

**What This Tests:**
- Requisition creation flow
- State cleanup after submission
- Dashboard navigation after state-based pages

---

### ✅ Test 2: Edit Requisition → Dashboard Navigation
**Steps:**
1. From Dashboard, click "Requisition" → "Edit Existing"
2. Click the edit button (pencil icon) on any requisition
3. **Expected**: Edit form opens with data pre-filled
4. Make a small change (e.g., add text to description)
5. Click "Update Requisition"
6. **Expected**: Success message appears
7. You're back at Requisition List
8. **Click "DASHBOARD"**
9. **Expected**: Dashboard loads without issues

**What This Tests:**
- Requisition editing flow
- State cleanup with editingRequisitionId
- Dashboard responsiveness after edit operations

---

### ✅ Test 3: Multiple Navigation Cycles
**Steps:**
1. Start on Dashboard
2. Click "Inventory" → Navigate to Inventory
3. Click "Requisition" → "Create New"
4. Go back to list (don't create, just click back)
5. Click "Child Profiles" → View child list
6. Click "Dashboard"
7. **Expected**: Dashboard loads correctly
8. Repeat steps 2-7 three times
9. **Expected**: Dashboard works every single time

**What This Tests:**
- State consistency across multiple navigation cycles
- Memory leaks or stale state accumulation
- URL vs state-based navigation interop

---

### ✅ Test 4: Direct URL Access
**Steps:**
1. While on any page, type `http://localhost:3000/` in browser address bar
2. **Expected**: Dashboard loads directly
3. Navigate to "Requisition" → "Create New"
4. Copy the URL (should still be `/` since requisition uses state)
5. Open new tab and paste URL
6. **Expected**: New tab also shows Dashboard (not requisition page)

**What This Tests:**
- Direct URL access works
- State doesn't leak across tabs
- URL reflects actual page state

---

### ✅ Test 5: Browser Back Button
**Steps:**
1. Start on Dashboard
2. Click "Inventory"
3. Click "Requisition" → "Create New"
4. Press browser back button
5. **Expected**: Goes back to Inventory
6. Press back again
7. **Expected**: Goes back to Dashboard
8. Click "Dashboard" in sidebar
9. **Expected**: Stays on Dashboard (no errors)

**What This Tests:**
- Browser history integration
- State management with browser navigation
- Sidebar click handling after browser back

---

## Console Debug Output

When testing, open browser console (F12) and look for these logs:

### When Clicking Dashboard:
```
Sidebar menu clicked: Dashboard
Navigating to route: /
=== ADMIN USEFFECT: Path changed ===
Current pathname: /
Dashboard route detected, setting activeItem to Dashboard
```

### When Creating Requisition:
```
Sidebar menu clicked: Requisition
DEBUG: Using userRoles from parent: {...}
DEBUG: Fetching requisition data...
```

### When Submitting:
```
Requisition Submitted Successfully! ID: X
```

If you don't see these logs, there might be an issue with the fix.

---

## Common Issues & Solutions

### Issue: Dashboard Still Not Working After Fix
**Possible Causes:**
1. Browser cache - Clear cache and reload (Ctrl+Shift+R)
2. Old JavaScript bundle - Run `npm run build` again
3. Backend not running - Check if server is on port 5000

**Solution:**
```bash
# Stop backend
# In backend folder, restart:
node server.js

# In frontend, clear cache and reload
# Or restart dev server
```

---

### Issue: Requisition Form Not Showing
**Possible Causes:**
1. `activeItem` not set to 'Requisition-Create'
2. Component not rendering

**Debug:**
```javascript
// Add this to Admin.js main content area
console.log('Current activeItem:', activeItem);
```

**Check:**
- Click "Requisition" in sidebar (should expand)
- Click "Create New"
- Console should show: `Current activeItem: Requisition-Create`

---

### Issue: Getting Stuck on Requisition List
**Symptoms:**
- Can create requisition
- After submit, stuck on list
- Dashboard doesn't respond

**Cause:** Missing `onBack` handler or state not updating

**Fix Verification:**
Check Admin.js lines 252-258:
```javascript
{activeItem === 'Requisition-Create' && (
  <Requisition 
    isOpen={true} 
    mode="create" 
    currentUser={currentUser}
    onBack={() => setActiveItem('Requisition-List')}  // ← This line
  />
)}
```

---

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Click Dashboard from any page | Dashboard loads immediately |
| Create requisition → Dashboard | Dashboard works |
| Edit requisition → Dashboard | Dashboard works |
| Multiple navigation cycles | Dashboard always works |
| Direct URL `/` access | Shows Dashboard |
| Browser back to Dashboard | Dashboard displays correctly |

---

## Performance Benchmarks

- **Dashboard load time**: < 200ms after click
- **Requisition form open**: < 300ms after click
- **Navigation between sections**: Instant, no lag
- **Console errors**: Zero errors during normal usage

---

## Regression Testing

After applying fixes, also test these previously working features:

- ✅ Child Profiles navigation still works
- ✅ Inventory page accessible
- ✅ Form Management opens correctly
- ✅ Employee section functional
- ✅ User Access Control navigates properly
- ✅ Settings page opens
- ✅ Logout works

---

## Reporting Issues

If you find any problems during testing, note:

1. **Steps to reproduce**: Exact clicks and sequence
2. **Browser console output**: Any errors or warnings
3. **Current URL**: What's in address bar
4. **activeItem value**: Check in React DevTools or console
5. **Screenshot**: Visual evidence of the issue

---

## Success Criteria

✅ All tests pass without errors
✅ Dashboard clickable from any page
✅ Requisition create/edit flows work smoothly  
✅ No console errors
✅ Navigation feels instant and responsive
✅ Browser back/forward buttons work correctly
✅ Direct URL access works for all routed pages
