# Troubleshooting Guide - Attendance Widget & Admin Panel

## Issues Fixed

### ✅ Issue 1: ManageOfficeIPs Not Showing in Admin Panel
**Status:** FIXED

**Changes Made:**
1. Added import to Admin.js:
   ```javascript
   import ManageOfficeIPs from './components/admin/ManageOfficeIPs';
   ```

2. Added menu item to Organization submenu:
   ```javascript
   { text: 'WiFi IPs', action: 'Organization-WiFi-IPs', route: '/organization/wifi-ips' }
   ```

3. Added route handler in main content area:
   ```jsx
   {activeItem === 'Organization-WiFi-IPs' && location.pathname.startsWith('/organization/wifi-ips') && (
     <ManageOfficeIPs user={currentUser} />
   )}
   ```

**How to Test:**
1. Log in as admin
2. Click "Organization" in sidebar
3. You should now see "WiFi IPs" submenu item
4. Click it to access the IP management panel

---

### 🔍 Issue 2: AttendanceWidget Not Showing in Dashboard
**Status:** DEBUGGING

The widget is embedded in StandardUser.js but might not be visible due to:
- API endpoint errors (backend routes not mounted)
- CSS/layout issues
- Component rendering errors

**Debug Steps Added:**
1. Console logging added to track component lifecycle
2. API call debugging
3. Render state logging

**How to Debug:**

#### Step 1: Check Browser Console
1. Open your browser DevTools (Press F12)
2. Go to Console tab
3. Refresh the page while on standard user dashboard
4. Look for these log messages:
   ```
   [AttendanceWidget] Component mounted, user: {...}
   [AttendanceWidget] Fetching attendance status...
   [AttendanceWidget] Response status: 200
   [AttendanceWidget] Rendering...
   ```

#### Step 2: Check for Errors
If you see errors like:
- `Cannot GET /api/attendance/today/status` → Backend routes not mounted
- `Network request failed` → Backend server not running
- `[AttendanceWidget] Error fetching attendance status` → API error

#### Step 3: Verify Backend Routes
Open browser console and test:
```javascript
fetch('http://localhost:5000/api/attendance/today/status')
  .then(res => console.log('Status:', res.status))
  .catch(err => console.error('Error:', err));
```

Expected: Should return 401 (unauthorized) or valid response  
NOT expected: 404 (not found) - means routes aren't mounted

#### Step 4: Check Component Visibility
The widget uses Tailwind CSS classes. If Tailwind isn't working:
- The widget might render but have no styling
- Check if other Tailwind-styled components work on your dashboard

#### Step 5: Inspect DOM
1. Right-click on dashboard area
2. Select "Inspect Element"
3. Look for `<div>` with class containing "AttendanceWidget" or "bg-white rounded-lg"
4. If found but hidden, might be CSS issue

---

## Quick Fixes to Try

### Fix A: Restart Servers
```bash
# Stop both servers (Ctrl+C)

# Start backend
cd Backend
npm start

# In new terminal, start frontend
cd ..
npm start
```

### Fix B: Clear Browser Cache
1. Press Ctrl+Shift+Delete
2. Clear cached images and files
3. Refresh page (Ctrl+R)

### Fix C: Check Database Tables
Run this SQL to verify tables exist:
```sql
SHOW TABLES LIKE 'allowed_ips';
SHOW TABLES LIKE 'attendance_logs';
```

Both should return 1 row each.

### Fix D: Verify Backend Routes are Mounted
Check `Backend/server.js` has these lines:
```javascript
const attendanceRoutes = require('./routes/attendance.routes');
app.use('/api/attendance', attendanceRoutes);

const adminOrganizationRoutes = require('./routes/adminOrganization.routes');
app.use('/api/admin/organization', adminOrganizationRoutes);
```

---

## Expected Behavior

### Admin Panel (ManageOfficeIPs):
✅ "WiFi IPs" appears in Organization submenu  
✅ Clicking it shows IP management interface  
✅ Can add/delete/edit allowed IPs  
✅ Shows success/error messages  

### Employee Dashboard (AttendanceWidget):
✅ Widget appears below user profile header  
✅ Live clock updates every second  
✅ Shows current date  
✅ "Clock In" button visible (green)  
✅ Can click to clock in (if on authorized IP)  
✅ Shows work duration when clocked in  
✅ "Clock Out" button appears when clocked in  

---

## Console Output Examples

### Successful Widget Load:
```
[AttendanceWidget] Component mounted, user: {id: 5, email: "...", ...}
[AttendanceWidget] Fetching attendance status...
[AttendanceWidget] Response status: 200
[AttendanceWidget] Response data: {success: true, data: {...}}
[AttendanceWidget] Rendering... {isClockedIn: false, loading: false, error: ''}
```

### Failed API Call (Backend Not Running):
```
[AttendanceWidget] Component mounted, user: {...}
[AttendanceWidget] Fetching attendance status...
[AttendanceWidget] Error fetching attendance status: TypeError: Failed to fetch
    at fetchTodayStatus (AttendanceWidget.jsx:26)
```

### Route Not Found (Routes Not Mounted):
```
[AttendanceWidget] Component mounted, user: {...}
[AttendanceWidget] Fetching attendance status...
[AttendanceWidget] Response status: 404
[AttendanceWidget] Response data: {error: "Cannot GET /api/attendance/today/status"}
```

---

## What to Report Back

After checking the console (F12), tell me:

1. **Do you see "[AttendanceWidget] Component mounted"?**
   - YES → Component is loading
   - NO → Component not rendering, check StandardUser.js

2. **Do you see "[AttendanceWidget] Fetching attendance status..."?**
   - YES → Trying to call API
   - Followed by error? → Copy the error message

3. **What is the Response status?**
   - 200 → API working, check response data
   - 404 → Backend routes not mounted
   - 500 → Backend error, check server logs
   - Network error → Backend not running

4. **Do you see "[AttendanceWidget] Rendering..."?**
   - YES → Component rendered successfully
   - If widget still not visible → CSS issue

5. **For Admin panel:**
   - Do you see "WiFi IPs" in Organization submenu? (YES/NO)
   - Can you click it? (YES/NO)
   - What happens when you click? (Describe)

---

## Files Modified

### Fixed Files:
1. ✅ `src/Admin.js` - Added ManageOfficeIPs integration
2. ✅ `src/components/dashboard/AttendanceWidget.jsx` - Added debug logging

### Key Files to Check:
- `Backend/server.js` - Verify routes are mounted
- `src/StandardUser.js` - Verify AttendanceWidget is embedded
- `Backend/routes/attendance.routes.js` - Verify routes exist
- `Backend/middleware/verifyOfficeIP.middleware.js` - Verify middleware exists

---

## Next Steps

1. **Open browser DevTools (F12)**
2. **Go to Console tab**
3. **Refresh dashboard page**
4. **Copy any error messages you see**
5. **Tell me what you see in the console**

This will help me identify the exact issue! 📋
