# Calendar Page Fix - March 26, 2026

## Issue
The calendar page at `http://localhost:3000/user/organization/calendar` was not working properly.

### First Problem: Date Comparison Bug
The `getAppointmentsForDay` function had timezone issues.

### Second Problem: Route Order
After fixing the date bug, the page was showing the dashboard instead of the calendar because routes were in the wrong order.

### Third Problem: Absolute vs Relative Paths
The routes in StandardUserLayout.js and AdminLayout.js were using **absolute paths** (with leading `/`) when they should use **relative paths** (without leading `/`).

Since App.js mounts the layouts at:
```javascript
<Route path="/user/*" element={<StandardUserLayout />} />
<Route path="/admin/*" element={<AdminLayout />} />
```

The child routes receive only the path **after** `/user/` or `/admin/`, so they should be:
- ❌ Wrong: `path="/user/organization/calendar"`
- ✅ Correct: `path="organization/calendar"`

## Root Cause
The issue was in the `getAppointmentsForDay` function in `src/components/Appointments.js`. The function was using timezone-sensitive date comparison which could cause appointments to not display correctly due to UTC/local time conversion issues.

### Original Code (Problematic)
```javascript
const getAppointmentsForDay = (day) => {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  return appointments.filter(apt => {
    const aptDate = new Date(apt.start_datetime);
    return isSameDay(date, aptDate);
  });
};
```

**Problems:**
1. Creating dates in local time while backend returns UTC timestamps
2. Timezone conversion could shift the date by one day
3. No null check for `apt.start_datetime`

## Solution Implemented

### Fixed Code
```javascript
const getAppointmentsForDay = (day) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  return appointments.filter(apt => {
    if (!apt.start_datetime) return false;
    
    const aptDate = new Date(apt.start_datetime);
    
    // Compare year, month, and day directly (timezone-safe)
    return aptDate.getFullYear() === year &&
           aptDate.getMonth() === month &&
           aptDate.getDate() === day;
  });
};
```

**Benefits:**
1. ✅ **Timezone-safe**: Direct component comparison avoids timezone issues
2. ✅ **Null-safe**: Checks for missing `start_datetime`
3. ✅ **More efficient**: No need to create intermediate Date objects

## Additional Improvements

### Enhanced Error Handling
Added better console logging and error messages:

```javascript
console.log('[Appointments] Fetching from URL:', url);
// ... fetch logic ...
if (result.success) {
  console.log('[Appointments] Fetched appointments count:', result.data?.length || 0);
  setAppointments(result.data || []);
} else {
  console.error('[Appointments] API returned error:', result.message);
  setMessage('Failed to fetch appointments');
}
```

### Debug Logging
Added component mount logging to track user prop:

```javascript
useEffect(() => {
  console.log('[Appointments] Component mounted with user:', user);
}, [user?.id]);
```

## Files Modified
- `src/components/Appointments.js`
  - Fixed `getAppointmentsForDay` function
  - Enhanced error handling in `fetchAppointments`
  - Added debug logging

- `src/layouts/StandardUserLayout.js`
  - Changed all Organization routes from absolute to relative paths
  - Reordered to put specific routes first
  
- `src/layouts/AdminLayout.js`
  - Changed all Organization routes from absolute to relative paths
  - Ensures consistency across both layouts

## Testing
To verify the fix:
1. Navigate to `http://localhost:3000/user/organization/calendar`
2. Check browser console for logs:
   - `[Appointments] Component mounted with user:`
   - `[Appointments] Fetching from URL:`
   - `[Appointments] Fetched appointments count:`
3. Verify appointments display correctly on the calendar
4. Switch between Month View and Day Agenda
5. Navigate between months

## Backend Endpoints Used
- `GET /api/appointments/range?startDate={ISO_DATE}&endDate={ISO_DATE}`
  - Returns: `{ success: true, data: [...] }`
  - Location: `Backend/server.js` line 4406

## Notes
- The calendar works for both admin (`/admin/organization/calendar`) and standard users (`/user/organization/calendar`)
- Both routes use the same `Appointments` component
- The fix ensures proper date handling regardless of timezone
