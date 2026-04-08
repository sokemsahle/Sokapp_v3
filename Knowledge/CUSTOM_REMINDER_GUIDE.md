# Customizable Email Reminder - Implementation Complete ✅

## Overview
Users can now choose when they want to receive email reminders before their appointments. Available options:
- 1 minute before (default)
- 5 minutes before
- 10 minutes before
- 30 minutes before
- 1 hour before
- 24 hours before
- 1 week before

## Changes Made

### 1. Database Schema
**File**: `Backend/add_reminder_column.sql`

Run this SQL to add the new column:
```sql
ALTER TABLE appointments 
ADD COLUMN reminder_minutes_before INT DEFAULT 1 
COMMENT 'Minutes before appointment start time to send email reminder';

UPDATE appointments SET reminder_minutes_before = 1 WHERE reminder_minutes_before IS NULL;
```

### 2. Backend Updates

#### server.js
- **POST /api/appointments**: Now accepts `reminder_minutes_before` in request body
- **PUT /api/appointments/:id**: Accepts and updates `reminder_minutes_before`
- **GET routes**: Automatically include `reminder_minutes_before` in responses (SELECT *)

#### scheduler/appointmentReminder.scheduler.js
- Added `getReminderTimeText()` helper function to convert minutes to human-readable format
- Updated `getUpcomingAppointments()` to fetch all scheduled appointments and filter by reminder time
- Changed logic from "appointments starting in 1-2 minutes" to "reminders due now based on user preference"
- Email templates now display custom reminder time instead of hardcoded "1 minute"

**Key Logic Change**:
```javascript
// Old: Check appointments starting in next 1-2 minutes
WHERE start_datetime BETWEEN ? AND ?

// New: Get all appointments, filter by calculated reminder time
const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60000));
const oneMinuteAgo = new Date(now.getTime() - 60000);
return reminderTime >= oneMinuteAgo && reminderTime <= now;
```

### 3. Frontend Updates

#### AppointmentModal.js
- Added `reminder_minutes_before` to formData state (default: 1)
- Added dropdown select field with 7 reminder time options
- Field appears in both Create and Edit modes
- Help text explains the purpose of the field
- Value included in API payload for both POST and PUT requests

**UI Location**: After Location field, before Status field

## How It Works

### Scheduler Algorithm
1. **Runs every minute** via cron job
2. **Fetches all scheduled appointments** from database
3. **For each appointment**:
   - Reads `reminder_minutes_before` value
   - Calculates when reminder should be sent: `startTime - reminderMinutes`
   - Checks if calculated time is within last minute
4. **Sends emails** only for appointments where reminder is due NOW

### Example Scenarios

**Scenario A: 1-minute reminder (default)**
- Appointment starts at 10:00 AM
- Reminder sends at 9:59 AM

**Scenario B: 30-minute reminder**
- Appointment starts at 10:00 AM  
- Reminder sends at 9:30 AM

**Scenario C: 24-hour reminder**
- Appointment starts at 10:00 AM tomorrow
- Reminder sends at 10:00 AM today

## Testing Instructions

### Step 1: Update Database
Run the SQL migration script:
```bash
cd Backend
mysql -u root -p sokapp_db < add_reminder_column.sql
```

Or manually execute in MySQL:
```sql
ALTER TABLE appointments 
ADD COLUMN reminder_minutes_before INT DEFAULT 1;

UPDATE appointments SET reminder_minutes_before = 1;
```

### Step 2: Restart Server
```bash
# Stop current server (Ctrl+C)
node server.js
```

Look for scheduler initialization message:
```
🔔 Setting up appointment reminder scheduler...
🚀 Initializing Appointment Reminder Scheduler...
✅ Scheduler initialized successfully!
📅 Reminders will be sent based on user preference
⏰ Scheduler runs every minute to check for upcoming appointments
```

### Step 3: Test Different Reminder Times

#### Test 1: Create Appointment with 5-Minute Reminder
1. Open calendar app
2. Click "New Appointment"
3. Fill in details:
   - Title: "Test Meeting"
   - Attendee: Select any user
   - Date: Today or tomorrow
   - Time: Set start time 10 minutes from now
   - **Email Reminder: Choose "5 minutes before"**
4. Save appointment
5. Wait 5 minutes before start time
6. Check attendee email inbox

#### Test 2: Create Appointment with 1-Hour Reminder
1. Create appointment starting in 1 hour
2. Select "1 hour before" reminder
3. Check email after 59 minutes

#### Test 3: Edit Existing Appointment
1. Edit an existing appointment
2. Change reminder from "1 minute" to "30 minutes"
3. Save changes
4. Verify reminder sends 30 minutes before start time

### Step 4: Monitor Scheduler Logs
Watch server console for scheduler activity:
```
===========================================
⏰ Running appointment reminder check...
Current time: 3/20/2026, 9:29:00 AM
===========================================

📅 Checking for appointments with reminders due now...
   Current time: 2026-03-20T09:29:00.000Z
✅ Found 1 appointment(s) with reminders due now

📧 Sending reminder to User Name (email@example.com)
   Appointment: Test Meeting
   Start Time: 09:34 AM

=== Appointment Reminder Email ===
To: email@example.com
Subject: Reminder: Test Meeting starts in 5 minutes
✅ Email sent successfully!
```

## Verification Checklist

- [ ] Database column added successfully
- [ ] Server restarts without errors
- [ ] Scheduler initializes correctly
- [ ] Create form shows reminder dropdown
- [ ] Edit form loads saved reminder value
- [ ] 1-minute reminder works (default)
- [ ] 5-minute reminder works
- [ ] 10-minute reminder works
- [ ] 30-minute reminder works
- [ ] 1-hour reminder works
- [ ] 24-hour reminder works
- [ ] 1-week reminder works
- [ ] Email subject shows correct time (e.g., "starts in 5 minutes")
- [ ] Email body shows correct time in banner
- [ ] Both attendee and creator receive emails

## Files Modified

### Backend
- ✅ `Backend/server.js` - API routes updated
- ✅ `Backend/scheduler/appointmentReminder.scheduler.js` - Scheduler logic updated
- ✅ `Backend/add_reminder_column.sql` - Database migration script
- ✅ `Backend/CUSTOM_REMINDER_IMPLEMENTATION.md` - Implementation plan

### Frontend
- ✅ `src/components/AppointmentModal.js` - UI field added

## User Experience Improvements

### Before
- Fixed 1-minute reminder for all appointments
- No customization option
- Users might miss appointments if they prefer earlier notifications

### After
- **7 reminder time options** from 1 minute to 1 week
- **Clear UI** with dropdown and help text
- **Flexible scheduling** based on user preference
- **Professional emails** showing exact reminder time chosen

## Technical Notes

### Backward Compatibility
- Existing appointments default to 1-minute reminder
- No data loss during migration
- Graceful fallback if field is missing

### Performance Considerations
- Scheduler still runs every minute (no performance impact)
- In-memory filtering avoids complex SQL queries
- Efficient for hundreds/thousands of appointments

### Edge Cases Handled
- Missing `reminder_minutes_before` → defaults to 1
- Invalid values → parseInt() converts to number
- Timezone handling → uses server timezone consistently

## Troubleshooting

### Issue: Column doesn't exist error
**Solution**: Run the SQL migration script

### Issue: Reminder not sending at correct time
**Solution**: 
1. Check server timezone setting in scheduler
2. Verify appointment start_datetime is stored correctly
3. Check scheduler logs for errors

### Issue: Dropdown not showing in form
**Solution**: 
1. Clear browser cache
2. Check browser console for JavaScript errors
3. Verify AppointmentModal.js changes were saved

### Issue: Emails all say "1 minute"
**Solution**: 
1. Verify scheduler was restarted with new code
2. Check that `reminder_minutes_before` is being saved to database
3. Query database: `SELECT id, title, reminder_minutes_before FROM appointments`

## Future Enhancements (Optional)

1. **User Preferences**: Remember user's last chosen reminder time
2. **Multiple Reminders**: Allow users to set multiple reminder times per appointment
3. **SMS Reminders**: Extend to send SMS via Twilio
4. **Custom Times**: Allow custom minute values (e.g., 45 minutes, 2 hours)
5. **Admin Settings**: Configure available reminder options globally

---

**Status**: ✅ IMPLEMENTATION COMPLETE  
**Date**: March 20, 2026  
**Ready for**: Production deployment after testing
