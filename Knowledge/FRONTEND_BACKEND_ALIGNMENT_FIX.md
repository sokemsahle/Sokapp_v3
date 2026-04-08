# Frontend-Backend Field Alignment Fix

## Problem Identified

The frontend was sending **incorrect field names** to the backend API, causing appointment creation to fail silently.

### Field Name Mismatch

| Frontend Sent | Backend Expected | Status |
|--------------|------------------|--------|
| `start_time` | `start_datetime` | ❌ MISMATCH |
| `end_time` | `end_datetime` | ❌ MISMATCH |
| `reminder_time` | `reminder_minutes_before` | ❌ MISMATCH |
| `category` | (not used) | ❌ UNNECESSARY |
| `attendee_user_ids` | `attendee_user_ids` | ✅ CORRECT |

## What Was Fixed

### File: `src/components/AppointmentModal.js` (Lines 193-203)

**Before:**
```javascript
const payload = {
  title: formData.title,
  description: formData.description,
  start_time: start_datetime,      // WRONG
  end_time: end_datetime,          // WRONG
  location: formData.location,
  category: 'meeting',             // UNNECESSARY
  reminder_time: reminderDateTime.toISOString(), // WRONG
  attendee_user_ids: attendeeIds
};
```

**After:**
```javascript
const payload = {
  title: formData.title,
  description: formData.description,
  start_datetime: start_datetime,              // ✅ CORRECTED
  end_datetime: end_datetime,                  // ✅ CORRECTED
  location: formData.location,
  reminder_minutes_before: parseInt(formData.reminder_minutes_before), // ✅ CORRECTED
  attendee_user_ids: attendeeIds               // ✅ KEPT
};
```

## Backend Field Names (server.js)

The backend expects these exact field names in the POST/PUT requests:

```javascript
const { 
  title, 
  description, 
  attendee_user_ids, 
  start_datetime,    // NOT start_time
  end_datetime,      // NOT end_time
  location, 
  reminder_minutes_before  // NOT reminder_time
} = req.body;
```

## Steps to Apply This Fix

### 1. Restart BOTH Servers

You need to restart both the backend AND frontend servers for changes to take effect.

**Stop Current Servers:**
- Press `Ctrl+C` in each terminal running the servers
- Or close the terminal windows

**Restart Backend:**
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

Expected output:
```
Server running on http://localhost:5000
Database connected successfully
```

**Restart Frontend:**
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
npm start
```

Expected output:
```
Compiled successfully!
App running at http://localhost:3000
```

### 2. Test Appointment Creation

1. Open browser to `http://localhost:3000`
2. Navigate to **Organization** → **System Calendar** or **My Appointments**
3. Click **"+ New Appointment"** button
4. Fill in the form:
   - **Title**: "Test Meeting"
   - **Attendee**: Select any user from dropdown
   - **Date**: Choose tomorrow's date
   - **Start Time**: 10:00
   - **End Time**: 11:00
   - **Location**: "Conference Room" (optional)
5. Click **"Save"**

### 3. Verify Success

**Check Console Logs:**
- Open browser DevTools (F12)
- Go to Console tab
- You should see:
  ```
  [AppointmentModal] Sending payload: {title: "...", start_datetime: "...", end_datetime: "...", ...}
  [AppointmentModal] Response status: 200
  [AppointmentModal] Response data: {success: true, message: "Appointment created successfully", id: X}
  ```

**Check Backend Logs:**
- In the terminal running the backend server
- Should show successful creation (no error messages)

**Verify in Database:**
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node test-appointment-debug.js
```

Should show your newly created appointment with attendees.

**Check Calendar View:**
- The appointment should appear on the selected date in the calendar
- Click on it to see details including attendee information

## Testing Multiple Attendees

If you want to test with multiple attendees:

1. Create an appointment
2. Select **multiple users** from the attendee dropdown (if multi-select is enabled)
3. Save
4. Verify all attendees are saved in the database

## Troubleshooting

### If Still Not Working:

**1. Check Browser Console for Errors:**
```javascript
// Look for errors like:
❌ Failed to create appointment
❌ Network error
❌ 404 Not Found
```

**2. Verify Payload Being Sent:**
In browser console, look for the logged payload:
```javascript
[AppointmentModal] Sending payload: {...}
```

Make sure it contains:
- ✅ `start_datetime` (NOT `start_time`)
- ✅ `end_datetime` (NOT `end_time`)
- ✅ `reminder_minutes_before` (NOT `reminder_time`)
- ✅ `attendee_user_ids` array

**3. Test API Directly:**
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node test-appointment-api-create.js
```

This bypasses the frontend and tests the backend directly.

**4. Check Server Status:**
Make sure both servers are actually running:
```bash
# Check if port 5000 is listening (backend)
netstat -ano | findstr :5000

# Check if port 3000 is listening (frontend)
netstat -ano | findstr :3000
```

## Summary of All Fixes Applied

### Backend (server.js):
1. ✅ Added `attendee_user_id` to INSERT statement (backward compatibility)
2. ✅ Explicitly set `status` to 'scheduled'
3. ✅ Enhanced error logging

### Frontend (AppointmentModal.js):
1. ✅ Changed `start_time` → `start_datetime`
2. ✅ Changed `end_time` → `end_datetime`
3. ✅ Changed `reminder_time` → `reminder_minutes_before`
4. ✅ Removed unnecessary `category` field
5. ✅ Simplified payload structure

## Expected Behavior After Fix

✅ Appointments save successfully  
✅ Attendees save to both columns:
   - `attendee_user_id` (primary attendee)
   - `appointment_attendees` junction table (all attendees)

✅ Monthly calendar view shows appointments  
✅ No console errors  
✅ Success message appears after creation  

---

**Fix Applied:** 2026-03-21  
**Files Modified:** 
- `src/components/AppointmentModal.js`
- `Backend/server.js`
