# 🔍 Debug: Notification Count Shows Only After Opening Panel

## Problem Description

- ❌ **Before clicking bell:** Badge shows 0 or no badge
- ✅ **After opening notification panel:** Badge appears with correct count
- ❌ **If you don't click the bell:** Never see the notification count

---

## Root Cause Analysis

The issue is likely one of these:

1. **currentUser not loaded yet** when useEffect runs
2. **API call failing silently** on initial page load
3. **State update timing issue** - Nav component renders before count is fetched

---

## How to Debug (Step-by-Step)

### Step 1: Open Browser Console

1. Press `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Clear console (trash icon)
4. Refresh the page (F5)

### Step 2: Look for These Logs

You should see:

```
[AdminLayout] Fetching notification count... currentUser: {id: 1, email: "...", ...}
[AdminLayout] Fetching with user_id: 1 email: "user@example.com"
[AdminLayout] Unsigned response: {success: true, requisitions: Array(3)}
[AdminLayout] Finalized response: {success: true, requisitions: Array(0)}
[AdminLayout] Setting notification count to: 3
```

### Step 3: Check What You See

#### ✅ If you see ALL logs and count STILL doesn't show:

**Problem:** State update or Nav rendering issue

**Check:**
1. Is `notificationCount` prop being passed to Nav?
2. Is Nav rendering the badge correctly?
3. Any React state update warnings in console?

**Solution:**
```javascript
// In AdminLayout.js line ~241
console.log('[AdminLayout] Passing to Nav - notificationCount:', newRequisitionCount);
```

Add this log right before the `<Nav>` component render.

---

#### ❌ If you see "No user ID yet, skipping fetch":

**Problem:** currentUser is not loaded when useEffect runs

**Solutions:**

**Option A:** Add currentUser as dependency
```javascript
// Change the dependency array to include full currentUser object
}, [currentUser]); // Instead of [currentUser?.id, currentUser?.email]
```

**Option B:** Force re-fetch when currentUser updates
```javascript
useEffect(() => {
  if (currentUser?.id) {
    fetchNotificationCount();
  }
}, [currentUser?.id]); // Separate effect just for user changes
```

---

#### ❌ If you see NO logs at all:

**Problem:** useEffect not running

**Check:**
1. Is AdminLayout component mounting?
2. Are there any JavaScript errors blocking execution?
3. Is the useEffect dependency array correct?

**Solution:**
Add a log at the top of useEffect:
```javascript
useEffect(() => {
  console.log('[AdminLayout] Notification count useEffect triggered');
  // ... rest of code
}, [currentUser?.id, currentUser?.email]);
```

---

#### ❌ If API returns empty arrays:

**Problem:** Backend issue (user has no roles or no notifications exist)

**Check:**
```sql
-- Check if you have requisition roles
SELECT rr.role_type, rr.is_active, u.email 
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE u.email = 'your-email@example.com';

-- Check if there are any unsigned requisitions
SELECT id, requestor_name, purpose, 
       signature_data IS NOT NULL as has_signature,
       reviewed_signature IS NULL as needs_review
FROM requisitions
ORDER BY created_at DESC;
```

**Solution:** Run the SQL fix from [`FIX_NOTIFICATION_COUNT_ZERO.sql`](./database/FIX_NOTIFICATION_COUNT_ZERO.sql)

---

## Quick Fixes to Try

### Fix 1: Force Re-fetch When User Loads

**File:** `src/layouts/AdminLayout.js`  
**After line 135** (after the first useEffect):

```javascript
// Additional effect to refetch when currentUser fully loads
useEffect(() => {
  if (currentUser?.id && currentUser?.email) {
    console.log('[AdminLayout] User fully loaded, fetching notifications...');
    const fetchNotificationCount = async () => {
      // ... copy the fetch logic from above
    };
    fetchNotificationCount();
  }
}, [currentUser?.id, currentUser?.email]);
```

---

### Fix 2: Add Logging to Nav Component

**File:** `src/components/Nav.js`  
**Line ~5** (after component declaration):

```javascript
const Nav = ({ ... }) => {
  console.log('[Nav] Received notificationCount prop:', notificationCount);
  // ... rest of component
```

This shows if Nav is receiving the count.

---

### Fix 3: Check Nav Rendering

**File:** `src/components/Nav.js`  
**Line ~120** (where badge renders):

```javascript
{notificationCount > 0 && (
  <span className="num">{notificationCount}</span>
)}
{/* Debug: Remove after testing */}
{console.log('[Nav Badge] Rendering with count:', notificationCount)}
```

---

## Expected Console Output (Working Correctly)

When everything works, you should see:

```
[AdminLayout] Fetching notification count... currentUser: {id: 1, email: "admin@example.com"}
[AdminLayout] Fetching with user_id: 1 email: admin@example.com
[AdminLayout] Unsigned response: {success: true, requisitions: Array(3)}
[AdminLayout] Finalized response: {success: true, requisitions: Array(0)}
[AdminLayout] Setting notification count to: 3
[Nav] Received notificationCount prop: 3
[Nav] Rendering badge with count: 3
```

Then when you click the bell:
```
[Nav] Notification bell clicked, count: 3
```

---

## Testing Checklist

- [ ] Console shows fetch attempts
- [ ] API returns successful responses
- [ ] Count is set (see "Setting notification count to: X")
- [ ] Nav receives count prop
- [ ] Badge renders with count > 0
- [ ] Badge visible BEFORE clicking bell
- [ ] Count updates when notifications are clicked

---

## Common Issues & Solutions

### Issue 1: "currentUser is undefined"

**Cause:** User authentication hasn't completed when layout mounts

**Solution:** Wait for user to load before rendering layout
```javascript
if (!currentUser) {
  return <div>Loading...</div>;
}
```

---

### Issue 2: "API returns 0 requisitions" but database has data

**Cause:** User lacks requisition roles OR wrong query logic

**Solution:** Run SQL fix to add roles (see previous section)

---

### Issue 3: "Badge shows after opening panel"

**Cause:** NotificationCenter's `onCountChange` is what actually updates the count, not the initial fetch

**Solution:** Ensure initial fetch is working AND calling `setNewRequisitionCount`

---

### Issue 4: "Console shows count but badge doesn't render"

**Cause:** Nav component not receiving updated prop

**Solution:** Check parent-child component communication
```javascript
// In AdminLayout.js - verify this line exists:
onCountChange={(count) => {
  setNewRequisitionCount(count);
}}
```

---

## Nuclear Option: Force Update Pattern

If nothing else works, force a re-render:

```javascript
const [, forceUpdate] = useState(0);

useEffect(() => {
  const fetchNotificationCount = async () => {
    // ... fetch logic
    setNewRequisitionCount(totalCount);
    forceUpdate(n => n + 1); // Force React to re-render
  };
  fetchNotificationCount();
}, [currentUser?.id, currentUser?.email]);
```

---

## Related Files

- **Layout:** `src/layouts/AdminLayout.js` (lines 98-135)
- **Nav:** `src/components/Nav.js` (lines 108-123)
- **NotificationCenter:** `src/components/NotificationCenter.js` (lines 20-24)

---

## Next Steps

1. **Open browser console** and refresh page
2. **Copy the console output** 
3. **Compare with expected output** above
4. **Identify which step is failing**
5. **Apply the corresponding fix**

If still stuck, share the console output and we can diagnose further!

---

**Debug Date:** March 24, 2026  
**Status:** Debugging in Progress  
**Next Action:** Check browser console logs
