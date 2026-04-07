# Medical Appointment Email Reminder Fix

## Problem Identified

Medical appointments created automatically from medical records (via database trigger) were **not sending email reminders**.

### Root Cause
1. **Blank Status Issue**: Some appointments had `status = ''` (empty string) instead of `status = 'scheduled'`
2. **Scheduler Filter**: The appointment reminder scheduler only queries appointments with `status = 'scheduled'`
3. **Update Bug**: When updating appointments via API, if status wasn't provided in the request, it could be set to empty string or overwritten incorrectly

## Solutions Applied

### 1. Fixed Backend Update Logic (server.js line ~4900)
**Before:**
```javascript
const safeStatus = status || 'pending'; // Could set to 'pending' even if existing was 'scheduled'
```

**After:**
```javascript
// Get current appointment to preserve existing values for missing fields
const [currentRows] = await connection.execute('SELECT * FROM appointments WHERE id = ?', [id]);
const currentAppointment = currentRows.length > 0 ? currentRows[0] : null;

// Preserve existing status if not provided in request
const safeStatus = status !== undefined ? (status || 'pending') : (currentAppointment?.status || 'scheduled');
```

**Benefits:**
- Preserves existing database values when fields are not provided in update request
- Defaults to 'scheduled' for existing appointments (more appropriate than 'pending')
- Prevents accidental status overwrites

### 2. Fixed Existing Appointments with Blank Status
Created `fix-appointment-blank-status.js` to update all appointments with blank/null status to 'scheduled'.

**Result:** All appointments now have proper status values.

### 3. Database Trigger Verification
The trigger `after_medical_record_insert` is correctly:
- Creating appointments with `status = 'scheduled'` ✅
- Setting `reminder_minutes_before = 1440` (24 hours before) ✅
- Adding nurses as attendees via junction table ✅

## How It Works Now

### Appointment Creation Flow
1. **Medical Record Created** → Database trigger automatically creates appointment
   - Status: 'scheduled'
   - Reminder: 1440 minutes (24 hours) before
   - Attendees: All active nurses

2. **Manual Calendar Appointment** → User creates via UI
   - Status: 'scheduled' (default)
   - Reminder: User-selected minutes before
   - Attendees: Selected users

### Email Reminder Scheduler
- **Runs every minute** checking for appointments starting in next 1-2 minutes
- **Filters by status = 'scheduled'** (critical!)
- **Sends emails to all attendees** via Brevo API
- **Logs activity** to console for monitoring

## Testing

### Test Script: `test-medical-appointment-email.js`
Run this to verify medical appointments are configured correctly:
```bash
cd Backend
node test-medical-appointment-email.js
```

**What it checks:**
- ✅ Trigger exists and is active
- ✅ Appointments have status = 'scheduled'
- ✅ reminder_minutes_before is set correctly
- ✅ attendee_user_id is populated
- ✅ Scheduler can find and will send emails at appropriate time

### Expected Output
```
✅ Status is correct: "scheduled"
✅ reminder_minutes_before is set: 1440 minutes
✅ attendee_user_id is set: [nurse_id]
✅ No more appointments with blank status found.
```

## Monitoring

### Check Scheduler Logs
When server is running, watch for:
```
⏰ Running appointment reminder check...
Current time: 4/1/2026, 10:14:00 AM
📅 Checking for appointments with reminders due now...
✅ Found 1 appointment(s) with reminders due now
📧 Sending reminder to Nurse Name (nurse@example.com)
   Appointment: Medical Appointment - Child Name
   Start Time: 10:15 AM
✅ Email sent successfully!
```

### Verify Email Delivery
1. Create a medical record with `next_appointment_date` set to 2 minutes from now
2. Keep server running
3. Watch console logs for scheduler activity
4. Check nurse's email inbox for reminder

## Files Modified

### Backend
- ✅ `Backend/server.js` - Fixed UPDATE logic to preserve existing status
- ✅ `Backend/fix-appointment-blank-status.js` - One-time fix script for existing data
- ✅ `Backend/test-medical-appointment-email.js` - Diagnostic test tool

### Database
- ✅ Trigger `after_medical_record_insert` - Already correct (no changes needed)
- ✅ SQL script `database/fix_blank_appointment_status.sql` - Alternative fix method

## Important Notes

1. **Scheduler Must Be Running**: Server must be running for emails to be sent
   - Scheduler initializes automatically when `node server.js` starts
   - Runs every minute on UTC timezone (can be adjusted in scheduler config)

2. **Status Field is Critical**: Only appointments with `status = 'scheduled'` receive reminders
   - 'pending', 'cancelled', 'completed', or empty string = NO emails

3. **Reminder Timing**: Medical appointments use 1440 minutes (24 hours) by default
   - Email will be sent 24 hours before appointment start time
   - Can be customized in trigger if needed

4. **Timezone Consideration**: Scheduler uses UTC by default
   - If appointments are in local time, adjust scheduler timezone:
   ```javascript
   // In scheduler/appointmentReminder.scheduler.js line 441
   timezone: 'UTC' // Change to your timezone, e.g., 'Africa/Addis_Ababa'
   ```

## Troubleshooting

### Emails Still Not Sending?

1. **Check appointment status:**
   ```sql
   SELECT id, title, status, start_datetime, reminder_minutes_before
   FROM appointments
   WHERE title LIKE '%Medical Appointment%';
   ```

2. **Verify scheduler is running:**
   - Look for "⏰ Running appointment reminder check..." in console every minute
   - If not seen, restart server: `node server.js`

3. **Check Brevo API configuration:**
   - Ensure `.env` has `BREVO_API_KEY` set
   - Ensure `.env` has `EMAIL_FROM` set

4. **Test email service:**
   ```bash
   cd Backend
   node test-email-quick.js
   ```

### Manual Status Fix
If any appointments still have blank status:
```sql
UPDATE appointments 
SET status = 'scheduled' 
WHERE status = '' OR status IS NULL;
```

## Success Criteria

✅ Medical appointments created from records have status = 'scheduled'
✅ Scheduler runs every minute without errors
✅ Email reminders sent 24 hours before appointment time
✅ Both creator (nurse) and other nurses receive emails
✅ Console logs show successful email delivery

---

**Status: RESOLVED** ✅
**Date: April 1, 2026**
