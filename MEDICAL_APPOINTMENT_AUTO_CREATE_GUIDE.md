# Medical Appointment Auto-Creation Feature

## 📋 Overview

This feature automatically creates calendar appointments when new medical records are created with a next appointment date. All users with the **Nurse** role will be added as attendees, and reminders will be set for **24 hours before** the appointment time.

---

## ✨ Features

### What It Does:
1. **Creates Nurse Role** - Adds a "Nurse" role to the system (if it doesn't exist)
2. **Auto-Create Appointments** - When a medical record is saved with `next_appointment_date`, an appointment is automatically created
3. **Add All Nurses** - All active users with Nurse role are added as attendees
4. **24-Hour Reminder** - Email reminders are sent 24 hours (1440 minutes) before the appointment
5. **Smart Fallback** - If no Nurse exists, uses Admin user as creator

### Benefits:
- ✅ No manual appointment creation needed
- ✅ All nurses are automatically notified
- ✅ Timely reminders prevent missed appointments
- ✅ Streamlined workflow for medical staff
- ✅ Better child healthcare management

---

## 🚀 Installation Steps

### Step 1: Run Database Script

Execute the SQL script to add the Nurse role and automatic trigger:

```bash
# Option 1: Using MySQL command line
mysql -u root -p sokapptest < database/add_nurse_role_and_auto_appointments.sql

# Option 2: Using phpMyAdmin
# 1. Open phpMyAdmin
# 2. Select 'sokapptest' database
# 3. Go to SQL tab
# 4. Copy and paste contents of add_nurse_role_and_auto_appointments.sql
# 5. Click "Go"

# Option 3: Using MySQL Workbench
# 1. Open MySQL Workbench
# 2. Connect to your database
# 3. File > Open Script > select add_nurse_role_and_auto_appointments.sql
# 4. Click Execute (⚡)
```

### Step 2: Verify Installation

After running the script, verify everything was created:

```sql
-- Check if Nurse role exists
SELECT * FROM roles WHERE name = 'Nurse';

-- Check Nurse role permissions
SELECT p.name, p.category
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'Nurse';

-- Check if trigger exists
SHOW TRIGGERS LIKE 'child_medical_records';

-- Count active nurses
SELECT COUNT(*) as active_nurses 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE r.name = 'Nurse' AND u.is_active = 1;
```

Expected output:
- ✅ Nurse role should appear in roles table
- ✅ Permissions: `medical_manage` and `child_view`
- ✅ Trigger `after_medical_record_insert` should exist
- ✅ At least 1 active nurse user (or admin fallback)

---

## 👥 Adding Nurse Users

### Create a New Nurse User:

```sql
-- Example: Create a nurse user
INSERT INTO users (full_name, email, password, role_id, department, is_active)
SELECT 
    'Jane Smith',
    'jane.nurse@sokapp.com',
    '$2b$12$[hashed_password_here]',  -- Replace with actual bcrypt hash
    r.id,
    'Medical Department',
    1
FROM roles r
WHERE r.name = 'Nurse';
```

### Or via Backend API:

```javascript
// POST /api/users
{
  "full_name": "Jane Smith",
  "email": "jane.nurse@sokapp.com",
  "role_id": [NURSE_ROLE_ID],  // Get from roles table
  "department": "Medical",
  "phone": "+1234567890"
}
```

---

## 📝 How It Works

### Flow Diagram:

```
User Creates Medical Record
         ↓
Save with next_appointment_date
         ↓
Trigger Fires (after_medical_record_insert)
         ↓
Get Child Name & Details
         ↓
Get All Active Nurses
         ↓
Create Appointment(s)
   ├─ Title: "Medical Appointment - [Child Name]"
   ├─ Start: next_appointment_date
   ├─ End: next_appointment_date + 1 hour
   ├─ Location: medical_center_name or hospital_name
   ├─ Status: scheduled
   └─ Reminder: 1440 minutes (24 hours)
         ↓
Appointment Added to Calendar
         ↓
Scheduler Sends Email 24h Before
```

### Technical Details:

**Trigger Logic:**
```sql
AFTER INSERT ON child_medical_records
FOR EACH ROW
BEGIN
    IF NEW.next_appointment_date IS NOT NULL THEN
        -- Create appointments for all nurses
        INSERT INTO appointments (...)
        SELECT ... FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Nurse');
    END IF;
END
```

**Reminder Configuration:**
- `reminder_minutes_before = 1440` (24 hours × 60 minutes)
- Scheduler runs every minute checking for due reminders
- Email sent exactly 24 hours before start time

---

## 🧪 Testing the Feature

### Test Scenario 1: Create Medical Record with Appointment

```sql
-- Create a test medical record with next appointment
INSERT INTO child_medical_records (
    child_id,
    note_type,
    medical_condition,
    next_appointment_date,
    diagnosis,
    visit_reason
) VALUES (
    1,  -- Replace with actual child ID
    'ongoing_health',
    'Routine checkup needed',
    '2026-04-15 10:00:00',  -- Future date
    'Annual physical examination',
    'Follow-up growth monitoring'
);

-- Check if appointment was created
SELECT * FROM appointments 
WHERE title LIKE '%Medical Appointment%'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
- ✅ Appointment created with title "Medical Appointment - [Child Name]"
- ✅ Start datetime: `2026-04-15 10:00:00`
- ✅ End datetime: `2026-04-15 11:00:00`
- ✅ `reminder_minutes_before = 1440`
- ✅ Attendees: All nurse users

### Test Scenario 2: Verify Email Reminder

1. Create appointment with `next_appointment_date` = tomorrow
2. Wait for scheduler to run (every minute)
3. Check server logs for reminder emails
4. Verify nurses receive email 24 hours before

```javascript
// Server logs should show:
⏰ Running appointment reminder check...
Current time: 2026-04-14 10:00:00
📅 Found 1 appointment(s) with reminders due now
📧 Sending reminder to Nurse Jane (jane.nurse@sokapp.com)
✅ Reminder sent successfully
```

### Test Scenario 3: Frontend Integration

1. **Login as Nurse** - Use nurse credentials
2. **Navigate to Child Profile** - Select any child
3. **Go to Medical Tab** - Click "Add Record"
4. **Fill Form:**
   - Select "Ongoing Health Note"
   - Fill required fields
   - Set **Next Appointment Date** to future date/time
5. **Save Record** - Click "Add Record"
6. **Check Calendar** - Go to `/appointments` or `/system-calendar`
7. **Verify:**
   - Appointment appears on correct date
   - Title includes child's name
   - All nurses are listed as attendees
   - Reminder set to 24 hours

---

## 🔧 Customization Options

### Change Reminder Time

Edit the trigger to use different reminder interval:

```sql
-- In the trigger, change:
1440  -- Current: 24 hours (24 × 60)

-- To:
720   -- 12 hours before
2880  -- 48 hours before (2 days)
10080 -- 1 week before (7 × 24 × 60)
```

**Re-run trigger creation:**
```bash
mysql -u root -p sokapptest < database/add_nurse_role_and_auto_appointments.sql
```

### Add Other Roles as Attendees

Modify trigger to include other roles (e.g., Doctors):

```sql
-- In the trigger's INSERT statement, change WHERE clause:
FROM users u
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name IN ('Nurse', 'Doctor', 'Medical Staff')
)
AND u.is_active = 1;
```

### Custom Appointment Duration

Change from default 1 hour to other duration:

```sql
-- In trigger, change:
DATE_ADD(NEW.next_appointment_date, INTERVAL 1 HOUR)

-- To:
DATE_ADD(NEW.next_appointment_date, INTERVAL 30 MINUTE)  -- 30 min
DATE_ADD(NEW.next_appointment_date, INTERVAL 2 HOUR)     -- 2 hours
```

---

## 🐛 Troubleshooting

### Issue 1: Appointments Not Being Created

**Symptoms:** Medical record saved but no appointment appears

**Solution:**
1. Check if trigger exists:
   ```sql
   SHOW TRIGGERS LIKE 'child_medical_records';
   ```
2. Verify `next_appointment_date` is not NULL
3. Check trigger syntax in MySQL:
   ```sql
   SHOW CREATE TRIGGER after_medical_record_insert;
   ```

### Issue 2: No Nurses Receiving Emails

**Symptoms:** Appointment created but no emails sent

**Solution:**
1. Verify nurse users exist and are active:
   ```sql
   SELECT u.id, u.full_name, u.email, u.is_active
   FROM users u
   JOIN roles r ON u.role_id = r.id
   WHERE r.name = 'Nurse';
   ```
2. Check scheduler is running in backend:
   ```javascript
   // In server.js, should have:
   const { initAppointmentScheduler } = require('./scheduler/appointmentReminder.scheduler');
   initAppointmentScheduler();
   ```
3. Verify Brevo API key is configured in `.env`:
   ```
   BREVO_API_KEY=your_api_key_here
   ```

### Issue 3: Wrong Reminder Time

**Symptoms:** Email sent at wrong time (not 24h before)

**Solution:**
1. Check appointment data:
   ```sql
   SELECT id, title, start_datetime, reminder_minutes_before 
   FROM appointments 
   WHERE title LIKE '%Medical Appointment%';
   ```
2. Should show `reminder_minutes_before = 1440`
3. If incorrect, update trigger and recreate

### Issue 4: Duplicate Appointments

**Symptoms:** Multiple appointments created for same medical record

**Solution:**
The current trigger is `AFTER INSERT`, so it only fires once per new record. If you're seeing duplicates:
1. Check for multiple triggers:
   ```sql
   SHOW TRIGGERS LIKE 'child_medical_records';
   ```
2. Should only show one trigger
3. Remove duplicates:
   ```sql
   DROP TRIGGER IF EXISTS after_medical_record_insert;
   -- Then re-run the SQL script
   ```

---

## 📊 Monitoring & Reporting

### View All Medical Appointments

```sql
SELECT 
    a.id,
    a.title,
    a.start_datetime,
    a.reminder_minutes_before,
    u.full_name as attendee_name,
    u.email as attendee_email,
    c.first_name,
    c.last_name
FROM appointments a
JOIN users u ON a.attendee_user_id = u.id
JOIN children c ON a.title LIKE CONCAT('%', c.first_name, '%')
WHERE a.title LIKE '%Medical Appointment%'
ORDER BY a.start_datetime DESC;
```

### Check Reminder Effectiveness

```sql
SELECT 
    COUNT(*) as total_appointments,
    AVG(reminder_minutes_before) as avg_reminder_minutes,
    MIN(start_datetime) as earliest,
    MAX(start_datetime) as latest
FROM appointments
WHERE title LIKE '%Medical Appointment%';
```

### Nurse Attendance Report

```sql
SELECT 
    u.full_name,
    u.email,
    COUNT(a.id) as appointments_assigned,
    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed
FROM users u
LEFT JOIN appointments a ON u.id = a.attendee_user_id
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'Nurse'
GROUP BY u.id, u.full_name, u.email
ORDER BY appointments_assigned DESC;
```

---

## 🔐 Security Considerations

### Access Control
- Only users with `medical_manage` permission can create medical records
- Nurse role automatically gets this permission
- Appointment visibility follows existing permission system

### Data Privacy
- Medical appointment details visible only to authorized staff
- Email reminders contain minimal necessary information
- Compliance with healthcare privacy regulations (adjust as needed)

---

## 📈 Future Enhancements

### Potential Improvements:
1. **Multiple Reminder Times** - Allow different reminder intervals per appointment type
2. **SMS Notifications** - Send text message reminders via Twilio
3. **Appointment Conflicts** - Check for scheduling conflicts before creating
4. **Recurring Appointments** - Support for regular follow-ups
5. **Appointment Types** - Different titles/locations based on medical condition
6. **Nurse Assignment** - Assign specific nurse based on child's program/room

### Implementation Notes:
These enhancements would require:
- Additional database columns
- Frontend UI changes
- Enhanced trigger logic or stored procedures
- Possibly moving from trigger to application-level logic

---

## 📞 Support

### Common Questions:

**Q: Can I disable auto-creation for certain medical records?**  
A: Yes, simply don't fill the `next_appointment_date` field when creating the record.

**Q: What if I need to change the appointment later?**  
A: Edit it directly in the calendar interface like any other appointment.

**Q: Can non-nurse users see these appointments?**  
A: Yes, appointment visibility follows the standard permission system.

**Q: How do I delete a Nurse user?**  
A: Either delete the user (deletes appointments via CASCADE) or set `is_active = 0`.

---

## ✅ Implementation Checklist

Before going live, verify:

- [ ] SQL script executed successfully
- [ ] Nurse role exists in database
- [ ] At least one active nurse user
- [ ] Trigger `after_medical_record_insert` exists
- [ ] Backend scheduler is running
- [ ] Brevo API configured for emails
- [ ] Test appointment created successfully
- [ ] Test email reminder received
- [ ] Frontend calendar shows appointments
- [ ] Staff trained on new workflow

---

**Implementation Date:** March 31, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Production  

**Enjoy your automated medical appointment system! 🏥📅**
