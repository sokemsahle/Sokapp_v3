# 🔧 Fix: Notification Count Not Updating After Marking as Seen

## Problem Identified
When you click a notification and it's marked as seen, the **NotificationCenter component** updates its internal count correctly, but this **wasn't being communicated to the parent layout**. So the badge in the navbar wasn't updating.

---

## Root Cause

```
NotificationCenter.js (child)
    ↓ has own state: notificationCount
    ↓ updates when marking as seen
    ↓ BUT doesn't tell parent
    ↓
AdminLayout.js / StandardUserLayout.js (parent)
    ↓ has own state: newRequisitionCount
    ↓ passes to Nav component
    ↓ displays badge count
    ↓
Nav.js
    ↓ shows badge with parent's count
    ❌ Never gets updated!
```

The child component was managing its own count independently without syncing back to the parent.

---

## Solution Implemented

### 1. Added `onCountChange` Callback ✅

**File:** `src/components/NotificationCenter.js`

```javascript
const NotificationCenter = ({ 
  isOpen, 
  onClose, 
  onRequisitionClick, 
  currentUser, 
  onCountChange // ← NEW PROP
}) => {
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Notify parent whenever count changes
  useEffect(() => {
    if (onCountChange && typeof onCountChange === 'function') {
      onCountChange(notificationCount);
    }
  }, [notificationCount, onCountChange]);
  
  // When marking as seen...
  const handleRequisitionClick = async (reqId) => {
    // ...mark as seen, remove from UI...
    setNotificationCount(prev => Math.max(0, prev - 1));
    // ↑ This triggers the useEffect above
    // ↑ Which calls onCountChange(newCount)
    // ↑ Which updates parent's state!
  };
};
```

---

### 2. Updated AdminLayout ✅

**File:** `src/layouts/AdminLayout.js`

```javascript
<NotificationCenter 
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
  onRequisitionClick={(reqId) => {
    setEditingRequisitionId(reqId);
    navigate(`/admin/requisitions/${reqId}`);
  }}
  onCountChange={(count) => {
    setNewRequisitionCount(count); // ← Updates parent state!
  }}
  currentUser={currentUser}
/>
```

---

### 3. Updated StandardUserLayout ✅

**File:** `src/layouts/StandardUserLayout.js`

```javascript
<NotificationCenter 
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
  onRequisitionClick={(reqId) => {
    navigate(`/user/my-requisitions/${reqId}`);
    checkForFinalizedRequisitions();
  }}
  onCountChange={(count) => {
    setNewRequisitionCount(count); // ← Updates parent state!
  }}
  currentUser={user}
/>
```

---

## Data Flow Now

```
User clicks notification #123
    ↓
NotificationCenter.handleRequisitionClick()
    ↓
Marks as seen in database (API call)
    ↓
Removes from UI array
    ↓
setNotificationCount(count - 1)
    ↓
useEffect detects count change
    ↓
Calls onCountChange(newCount)
    ↓
Parent layout receives new count
    ↓
setNewRequisitionCount(newCount)
    ↓
Nav component re-renders
    ↓
Badge updates! ✅
```

---

## Complete Flow Example

### Before Fix:
1. User has 3 notifications → Badge shows "3"
2. Clicks notification #123
3. #123 disappears from list ✅
4. Internal count becomes 2 ✅
5. **Badge still shows "3"** ❌

### After Fix:
1. User has 3 notifications → Badge shows "3"
2. Clicks notification #123
3. #123 disappears from list ✅
4. Internal count becomes 2 ✅
5. Calls `onCountChange(2)` ✅
6. Parent updates state ✅
7. **Badge updates to "2"** ✅

---

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `NotificationCenter.js` | Added `onCountChange` prop + useEffect | Sync count to parent |
| `AdminLayout.js` | Added `onCountChange` callback | Receive count updates |
| `StandardUserLayout.js` | Added `onCountChange` callback | Receive count updates |

---

## Testing Steps

### Test 1: Single Notification Click
1. Login with 3 pending notifications
2. Bell badge shows "3"
3. Click bell icon
4. Click one notification
5. It disappears ✅
6. Badge updates to "2" ✅
7. Refresh page → Badge still shows correct count ✅

### Test 2: Multiple Notifications
1. Click 3 notifications in sequence
2. Each should disappear immediately
3. Badge should decrease: 3 → 2 → 1 → 0
4. After 3rd click → Badge gone completely ✅

### Test 3: Close and Reopen
1. Click notification → Badge updates
2. Close notification panel
3. Click bell again
4. Should see remaining unseen only
5. Badge count matches what's shown ✅

### Test 4: Show All Toggle
1. Click "Show All" button
2. Badge count reflects total (seen + unseen)
3. Click "Unseen Only"
4. Badge count filters back down ✅

---

## Key Technical Details

### Why useEffect?
We use `useEffect` to notify parent **after** state updates, not during. This prevents React state update loops.

```javascript
// ❌ WRONG - would cause infinite loop
setNotificationCount(newCount);
onCountChange(newCount); // Called during render!

// ✅ CORRECT - called after state settles
setNotificationCount(newCount);
useEffect(() => {
  onCountChange(notificationCount); // Called after render
}, [notificationCount]);
```

### Why Conditional Check?
```javascript
if (onCountChange && typeof onCountChange === 'function') {
  onCountChange(notificationCount);
}
```

This ensures:
- Parent actually provided the callback
- It's actually a function (not undefined or null)
- Prevents runtime errors

---

## Benefits

✅ **Accurate Badge**: Always reflects true unseen count  
✅ **Real-time Updates**: Updates immediately on click  
✅ **Persistent**: Survives page refreshes  
✅ **Consistent**: Same behavior for admin and standard users  
✅ **No Breaking Changes**: Backwards compatible (callback is optional)  

---

## Additional Notes

### What About Initial Load?
When NotificationCenter first loads:
1. `fetchAllNotifications()` runs
2. Fetches from API with `?unseen=true&user_id=X`
3. Sets initial count based on response
4. `useEffect` fires → updates parent immediately
5. Badge shows correct count from start ✅

### What About "Show All"?
When toggling "Show All":
1. `showAll` state flips
2. `fetchAllNotifications()` refetches
3. Count might increase (includes seen ones now)
4. Parent notified of new count via `onCountChange`
5. Badge reflects current view mode ✅

### What About Manual Refresh?
When user calls `fetchAllNotifications()` manually:
1. Clears old data
2. Fetches fresh from API
3. Sets new count
4. Parent notified automatically
5. Everything stays in sync ✅

---

## Success Criteria

You know it's working when:

✅ Click notification → Badge decreases immediately  
✅ Click all notifications → Badge disappears completely  
✅ Close and reopen → Badge still accurate  
✅ Refresh page → Badge persists correctly  
✅ Different users → Each has their own badge count  
✅ Show All toggle → Badge adjusts accordingly  

---

**Fix Date:** March 16, 2026  
**Status:** ✅ Complete  
**Breaking Changes:** None  
**Impact:** Major UX Improvement - Badge now accurately reflects real-time notification state
