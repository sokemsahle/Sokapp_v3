# Fix: Attendees Not Populated in Edit Modal

## 🐛 Problem Identified

When clicking to edit an appointment:
- ✅ Day Agenda **shows** attendee names correctly (e.g., "With: John Doe, Jane Smith")
- ❌ Edit modal **doesn't mark** the attendees in the dropdown

### Root Cause:
The backend was returning `attendee_names` and `attendee_emails` but NOT `attendee_user_ids`. The frontend needs the user IDs to pre-select them in the dropdown.

---

## ✅ Solution Applied

### Backend Fix: Added `attendee_user_ids` to API Response

**Files Modified:** `Backend/server.js` (3 endpoints)

#### Endpoints Updated:
1. `GET /api/appointments/all`
2. `GET /api/appointments/range`
3. `GET /api/appointments`

**Before:**
```sql
SELECT 
  GROUP_CONCAT(DISTINCT attendee.full_name ...) as attendee_names,
  GROUP_CONCAT(DISTINCT attendee.email ...) as attendee_emails
FROM appointments ...
```

**After:**
```sql
SELECT 
  GROUP_CONCAT(DISTINCT attendee.full_name ...) as attendee_names,
  GROUP_CONCAT(DISTINCT attendee.email ...) as attendee_emails,
  GROUP_CONCAT(DISTINCT aa.user_id ...) as attendee_user_ids  -- ✅ ADDED
FROM appointments ...
LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
...
```

Now the API returns:
```javascript
{
  success: true,
  data: [
    {
      id: 1,
      title: "Meeting",
      attendee_names: "John Doe, Jane Smith",
      attendee_emails: "john@example.com, jane@example.com",
      attendee_user_ids: "1,2,3"  // ✅ NEW - comma-separated IDs
    }
  ]
}
```

---

### Frontend Fix: Parse Comma-Separated IDs

**File Modified:** `src/components/AppointmentModal.js` (Lines 36-62)

**Before:**
```javascript
if (appointment.attendee_user_ids) {
  attendeeIds = Array.isArray(appointment.attendee_user_ids) 
    ? appointment.attendee_user_ids.map(id => id.toString())
    : [appointment.attendee_user_ids.toString()];
}
```

**After:**
```javascript
if (appointment.attendee_user_ids) {
  // Backend returns comma-separated string like "1,2,3"
  const idsString = typeof appointment.attendee_user_ids === 'string' 
    ? appointment.attendee_user_ids 
    : String(appointment.attendee_user_ids);
  attendeeIds = idsString.split(',').map(id => id.trim()).filter(id => id !== '');
}
```

Also fixed `reminder_minutes_before` to parse as integer:
```javascript
reminder_minutes_before: parseInt(appointment.reminder_minutes_before) || 1
```

---

## 🔍 Why This Happened

The backend query was using `GROUP_CONCAT()` to combine attendee information, but only for names and emails. The frontend needs the actual user IDs to pre-select options in the multi-select dropdown.

**Data Flow:**
```
Database (appointment_attendees table)
    ↓
Backend SQL Query with GROUP_CONCAT(aa.user_id)
    ↓
API Response: { attendee_user_ids: "1,2,3" }  ← comma-separated string
    ↓
Frontend parses to array: ["1", "2", "3"]
    ↓
Dropdown pre-selects users with IDs 1, 2, 3
```

---

## 📋 Testing Steps

### 1. Restart Backend Server
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### 2. Hard Refresh Browser
Press `Ctrl + Shift + R`

### 3. Test Edit Functionality

1. Navigate to Organization → System Calendar or My Appointments
2. Switch to **Day Agenda** view
3. Find an appointment with attendees
4. Click on the appointment to open edit modal
5. **Expected Result:**
   - Modal opens with all fields populated
   - Attendee dropdown shows selected attendees highlighted/marked
   - Names match what was shown in Day Agenda

### 4. Verify Console Logs

Open DevTools (F12) → Console tab

Should see:
```javascript
[AppointmentModal] Fetched users: [...]
[AppointmentModal] Populated form with attendee IDs: ["1", "2", "3"]
```

---

## 🎯 Expected Behavior After Fix

### When Editing Appointment:

✅ **Title** field populated  
✅ **Description** field populated  
✅ **Attendee dropdown** shows selected users marked/checked  
✅ **Date** field populated in DD/MM/YYYY format  
✅ **Time fields** populated in HH:mm format  
✅ **Location** field populated  
✅ **Status** dropdown shows current status  

### Example Scenario:

**Original Appointment:**
- Title: "Project Review"
- Attendees: John Doe, Jane Smith, Bob Wilson

**Edit Modal Shows:**
- Title: "Project Review" ✅
- Attendees: [x] John Doe, [x] Jane Smith, [x] Bob Wilson ✅
- All other fields populated ✅

---

## 🐛 Troubleshooting

### If Attendees Still Not Selected:

**1. Check API Response:**
In browser console Network tab, find the GET request for appointments:
```
GET /api/appointments/range?startDate=...&endDate=...
Response: {
  success: true,
  data: [{
    id: 1,
    title: "Meeting",
    attendee_user_ids: "1,2",  ← Should be present
    attendee_names: "John, Jane"
  }]
}
```

**2. Check Form Data Population:**
In browser console, look for:
```javascript
[AppointmentModal] Populated form with attendee IDs: [...]
```

**3. Verify Database:**
Check if attendees exist in `appointment_attendees` table:
```sql
SELECT * FROM appointment_attendees WHERE appointment_id = YOUR_APPOINTMENT_ID;
```

Should show rows with `user_id` values.

**4. Check Dropdown Component:**
Make sure the dropdown component supports multi-select and displays selected values correctly.

---

## 📊 Complete Fix Summary

All appointment issues have been resolved:

1. ✅ **API Endpoint**: `/api/events` → `/api/appointments`
2. ✅ **Field Names**: `start_time` → `start_datetime`, etc.
3. ✅ **Database Table**: Created `appointment_attendees`
4. ✅ **SQL Syntax**: Fixed multi-row INSERT
5. ✅ **Data Structure**: `result.data.events` → `result.data`
6. ✅ **Attendee IDs**: Added `attendee_user_ids` to API response
7. ✅ **ID Parsing**: Comma-separated string → array conversion

---

## ✅ Success Checklist

After restarting backend and refreshing browser:

- [ ] Day Agenda shows attendee names
- [ ] Click appointment to edit
- [ ] Edit modal opens with all fields populated
- [ ] Attendee dropdown shows selected users marked
- [ ] Can modify and save appointment
- [ ] Changes persist after save
- [ ] No console errors

---

**Created:** 2026-03-21  
**Files Modified:**
- `Backend/server.js` (3 endpoints)
- `src/components/AppointmentModal.js`

**Action Required:** Restart backend server, then hard refresh browser
