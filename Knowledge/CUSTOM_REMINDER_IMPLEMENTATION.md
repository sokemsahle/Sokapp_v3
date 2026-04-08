# Customizable Appointment Reminder Implementation Plan

## Overview
Add a feature allowing users to choose when they receive email reminders before appointments (1 min, 5 min, 10 min, 30 min, 1 hr, 24 hr, 1 week).

## Implementation Steps

### 1. Database Schema Change
**File**: Database migration SQL
- Add `reminder_minutes_before` column to `appointments` table
- Type: INT, Default: 1 (for backward compatibility)
- Values: 1, 5, 10, 30, 60, 1440 (24 hours), 10080 (1 week)

### 2. Backend Updates

#### 2.1 server.js - Appointment Routes
**Changes**:
- POST `/api/appointments`: Accept `reminder_minutes_before` in request body
- PUT `/api/appointments/:id`: Accept and update `reminder_minutes_before`
- GET routes: Include `reminder_minutes_before` in response

#### 2.2 scheduler/appointmentReminder.scheduler.js
**Changes**:
- Update SQL query to fetch `reminder_minutes_before`
- Modify time calculation logic to use custom reminder time instead of hardcoded 1 minute
- Adjust cron job or query logic to check multiple time windows

### 3. Frontend Updates

#### 3.1 AppointmentModal.js
**Changes**:
- Add `reminder_minutes_before` to formData state
- Add dropdown/select input for reminder time selection
- Include reminder field in validation and payload
- Display reminder time in edit mode

#### 3.2 Appointments.css (optional)
**Changes**:
- Style the new reminder select field

## Technical Considerations

### Scheduler Logic Update
Current logic checks appointments starting in 1-2 minutes. New logic needs to:
- Check appointments at multiple intervals based on user preferences
- OR run every minute and calculate if `now === appointment_start - reminder_minutes`
- Recommended: Calculate exact trigger time for each appointment

### Backward Compatibility
- Existing appointments without the field should default to 1 minute
- Database migration should set default value for existing records

### Testing
- Test each reminder interval (1, 5, 10, 30, 60, 1440, 10080 minutes)
- Verify emails sent at correct times
- Test appointment creation and editing with reminder changes

## Files to Modify
1. Database: ALTER TABLE appointments ADD COLUMN
2. Backend/server.js: Lines ~4144, ~4177, ~4068, ~4094, ~4121
3. Backend/scheduler/appointmentReminder.scheduler.js: Lines ~93-112, ~76-128
4. Frontend/src/components/AppointmentModal.js: Lines ~12-21, ~38-47, ~145-153, render method
5. Optional: Create database migration script

## User Experience
- Dropdown with clear labels: "1 minute before", "5 minutes before", etc.
- Default value: 1 minute (or user's last choice if implementing persistence)
- Visible in both create and edit modes
- Clear indication that this controls EMAIL reminder timing
