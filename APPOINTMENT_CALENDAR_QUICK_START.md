# Appointment Calendar Implementation - Quick Start Guide

## ✅ Implementation Complete

The appointment calendar system has been successfully implemented with all requested features:
- **UI Placement**: Added to Organization sub-menu in sidebar
- **Date Format**: Strict DD/MM/YYYY for all displays and inputs
- **Views**: Month view and Day Agenda list view
- **CRUD Operations**: Create, Read, Update, Delete via modal only
- **No Drag-and-Drop**: All changes through modal interface
- **Current Day Highlight**: Visual distinction in month grid

---

## 📋 Setup Steps

### Step 1: Run Database Migration

Execute the SQL migration script to create the appointments table:

```bash
# Option 1: Using MySQL CLI
mysql -u root -p sokapp_db < database/migrations/add_appointments_table.sql

# Option 2: Using MySQL Workbench or phpMyAdmin
# Open and run: database/migrations/add_appointments_table.sql
```

**Optional:** Uncomment the sample data section in the migration script to insert test appointments.

### Step 2: Restart Backend Server

```bash
cd Backend
npm start
```

The new appointment routes are now available at:
- `GET /api/appointments` - Get all user appointments
- `GET /api/appointments/range` - Get appointments by date range
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/users/list` - Get users list for dropdown

### Step 3: Rebuild Frontend

```bash
npm run build
```

### Step 4: Access the Application

1. Open browser: `http://localhost:5000` (or your configured URL)
2. Login with your credentials
3. Navigate to **Organization → Appointments** in the sidebar

---

## 🎯 Features Overview

### Month View
- **Grid Layout**: 7-column calendar showing full month
- **Current Day Highlight**: Blue background with indicator dot
- **Appointment Badges**: Show up to 3 appointments per day
- **More Indicator**: "+X more" for days with 4+ appointments
- **Click to Create**: Click any date cell to create appointment
- **Navigation**: Previous/Next month buttons + Today button

### Day Agenda View
- **List Format**: Chronological list of appointments for selected day
- **Detailed Information**: Time, title, participants, description, location, status
- **Status Badges**: Color-coded (Scheduled=Blue, Completed=Green, Cancelled=Red)
- **Click to Edit**: Click any appointment to open edit modal
- **Navigation**: Previous/Next day buttons + Today button

### Create/Edit Modal
- **Form Fields**:
  - Title (required)
  - Attendee selection dropdown (required) - shows all users
  - Description (optional)
  - Date picker in DD/MM/YYYY format (required)
  - Start time picker (required)
  - End time picker (required)
  - Location (optional)
  - Status (edit mode only): Scheduled/Completed/Cancelled

- **Validation**:
  - Required field checking
  - End time must be after start time
  - Inline error messages

- **Actions**:
  - Save: Creates or updates appointment
  - Delete: Removes appointment (edit mode only, with confirmation)
  - Cancel: Closes modal without saving

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Appointments appears in Organization submenu
- [ ] Clicking "Appointments" opens the calendar page
- [ ] Organization parent menu stays expanded
- [ ] URL is `/appointments`

### Month View
- [ ] Current month displays correctly
- [ ] Current day is highlighted with blue background
- [ ] Navigation buttons work (Previous/Next month, Today)
- [ ] Clicking a date opens create modal with date pre-selected
- [ ] Appointments show as blue badges on correct dates
- [ ] "+X more" appears for days with 4+ appointments

### Day Agenda View
- [ ] Toggle to Day view works
- [ ] Shows appointments for selected day
- [ ] Displays "No appointments" message when empty
- [ ] Shows "Schedule Appointment" button when empty
- [ ] Navigation buttons work (Previous/Next day, Today)
- [ ] Appointment details display correctly

### Create Appointment
- [ ] "New Appointment" button opens modal
- [ ] Form validation prevents empty required fields
- [ ] End time validation works (must be after start time)
- [ ] User dropdown populates with all users
- [ ] Date displays in DD/MM/YYYY format
- [ ] Creating appointment saves to database
- [ ] Success message appears
- [ ] Calendar refreshes to show new appointment

### Edit Appointment
- [ ] Clicking appointment badge opens edit modal
- [ ] All fields populate with existing data
- [ ] Changes save correctly
- [ ] Calendar updates immediately
- [ ] Status can be changed (Scheduled/Completed/Cancelled)

### Delete Appointment
- [ ] Delete button appears in edit mode
- [ ] Confirmation dialog shows before deleting
- [ ] Deleting removes from calendar
- [ ] Success message appears

### Date Formatting
- [ ] All dates display in DD/MM/YYYY format
- [ ] Time displays in HH:mm format
- [ ] Datetime shows as "DD/MM/YYYY HH:mm"
- [ ] Selected date shows in helper text under date input

### Responsive Design
- [ ] Layout adjusts for mobile screens
- [ ] Modal is usable on small screens
- [ ] Calendar grid remains functional

### Dark Mode (if enabled)
- [ ] Dark mode styles apply correctly
- [ ] Calendar cells have appropriate contrast
- [ ] Modal background is dark
- [ ] Text remains readable

---

## 🔧 Technical Details

### Files Created
1. `database/migrations/add_appointments_table.sql` - Database schema
2. `src/utils/dateUtils.js` - Date formatting utilities
3. `src/components/Appointments.js` - Main calendar component
4. `src/components/AppointmentModal.js` - CRUD modal form
5. `src/components/Appointments.css` - Styling

### Files Modified
1. `Backend/server.js` - Added 6 API endpoints
2. `src/config/api.js` - Added 4 endpoint constants
3. `src/components/Sidebar.js` - Added Appointments to Organization submenu
4. `src/layouts/AdminLayout.js` - Added appointments route
5. `src/layouts/StandardUserLayout.js` - Added appointments route

### Data Flow
```
User creates appointment via modal
    ↓
Frontend validates form (client-side)
    ↓
Convert local date/time to UTC ISO format
    ↓
POST /api/appointments
    ↓
Backend validates and saves to database
    ↓
Return success with ID
    ↓
Frontend refreshes appointment list
    ↓
Calendar displays new appointment
```

### Date Handling
- **Storage**: UTC datetime in database (DATETIME field)
- **Input**: Local date (YYYY-MM-DD) + time (HH:MM) from form inputs
- **Display**: DD/MM/YYYY HH:mm format (converted from UTC)
- **Conversion**: `localToUTC()` for storage, `formatDateTime()` for display

---

## 🐛 Troubleshooting

### Issue: Appointments not appearing
**Solution**: 
1. Check browser console for errors
2. Verify database table exists: `SHOW TABLES LIKE 'appointments';`
3. Test API endpoint directly: `GET http://localhost:5000/api/appointments`
4. Check authentication token is being sent

### Issue: Cannot create appointment
**Solution**:
1. Check form validation errors (red borders indicate missing fields)
2. Ensure end time is after start time
3. Check browser network tab for API response
4. Verify backend logs for errors

### Issue: Date format incorrect
**Solution**:
1. Clear browser cache and reload
2. Check that dateUtils.js functions are being imported correctly
3. Verify `formatDateToDDMMYYYY()` is called when displaying dates

### Issue: Users dropdown empty
**Solution**:
1. Test endpoint: `GET http://localhost:5000/api/users/list`
2. Check authentication/permissions
3. Verify users exist in database

### Issue: Calendar not refreshing after save
**Solution**:
1. Check that `fetchAppointments()` is called in `handleSaveAppointment()`
2. Verify API returns `{ success: true }`
3. Check for JavaScript errors in console

---

## 📝 Usage Examples

### Creating a Meeting
1. Click "New Appointment" button
2. Enter title: "Project Review"
3. Select attendee: "John Doe"
4. Add description: "Q1 milestones discussion"
5. Select date: 20/03/2026
6. Set time: 10:00 - 11:00
7. Add location: "Conference Room A"
8. Click "Create"

### Editing an Appointment
1. Click on appointment badge in calendar
2. Modal opens with existing data
3. Modify any fields (e.g., change time to 14:00 - 15:00)
4. Change status to "Completed" if done
5. Click "Save Changes"

### Deleting an Appointment
1. Click on appointment badge
2. Click "Delete" button
3. Confirm deletion in dialog
4. Appointment removed from calendar

---

## 🎨 Design Features

### Clean & Minimalist
- White background with subtle shadows
- Blue accent color matching dashboard theme
- Clear visual hierarchy
- Ample white space

### User-Friendly
- Hover effects on interactive elements
- Clear button labels and icons
- Inline validation feedback
- Success/error messages

### Responsive
- Mobile-friendly layout adjustments
- Touch-friendly buttons
- Scrollable modal content
- Flexible grid system

---

## 🔐 Permissions

- **All authenticated users** can create, view, edit, and delete their own appointments
- Both creator and attendee can modify appointments
- No special role-based permissions required
- Appointments are user-specific (filtered by current user ID)

---

## 📊 Future Enhancements (Not Implemented)

- Email notifications for new/updated appointments
- Recurring appointments
- Conflict detection (overlapping appointments)
- Calendar export (iCal/Google Calendar)
- Video conferencing integration
- Appointment reminders
- Bulk operations
- Calendar sharing

---

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check backend logs for API errors
3. Verify database connection and table structure
4. Review this guide's troubleshooting section
5. Test API endpoints directly using Postman or curl

---

**Implementation Date:** March 19, 2026  
**Status:** ✅ Complete and Ready for Testing
