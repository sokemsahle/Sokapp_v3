# 🔧 Troubleshooting: Appointments Not Being Created

## Problem
After adding a medical record with `next_appointment_date`, no appointment appears in the calendar.

---

## 🚀 Quick Fix (Choose One Method)

### Method 1: Using Batch Files (Easiest - Windows)

**Step 1: Run Diagnosis**
```bash
# Double-click this file or run in terminal:
RUN_DIAGNOSIS.bat
```

This will check:
- ✅ Is Nurse role created?
- ✅ Are there active nurses?
- ✅ Is trigger installed?
- ✅ Are appointments being created?

**Step 2: Install Feature (if needed)**
```bash
# Double-click this file:
INSTALL_MEDICAL_APPOINTMENTS.bat
```

**Step 3: Test It Works**
```bash
# Double-click this file:
RUN_TEST_APPOINTMENT.bat
```

---

### Method 2: Using MySQL Commands

**Step 1: Check Current Status**

Open MySQL command line or phpMyAdmin and run:

```sql
USE sokapptest;

-- Check 1: Does Nurse role exist?
SELECT id, name FROM roles WHERE name = 'Nurse';

-- Check 2: Are there active nurses?
SELECT u.id, u.full_name, u.email 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE r.name = 'Nurse' AND u.is_active = 1;

-- Check 3: Does trigger exist?
SHOW TRIGGERS LIKE 'child_medical_records';

-- Check 4: Recent medical records with appointments
SELECT cmr.id, c.first_name, c.last_name, cmr.next_appointment_date
FROM child_medical_records cmr
JOIN children c ON cmr.child_id = c.id
WHERE cmr.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

**Expected Results:**
- ✅ Check 1: Should show Nurse role (id typically 8)
- ✅ Check 2: Should show at least 1 nurse user
- ✅ Check 3: Should show trigger `after_medical_record_insert`
- ❌ If any check fails, proceed to Step 2

**Step 2: Install/Reinstall the Feature**

Run the main SQL script:

```bash
# Option A: Command line
mysql -u root -p sokapptest < database/add_nurse_role_and_auto_appointments.sql

# Option B: phpMyAdmin
# 1. Select sokapptest database
# 2. Go to SQL tab
# 3. Copy content from: database/add_nurse_role_and_auto_appointments.sql
# 4. Paste and click "Go"
```

**Step 3: Verify Installation**

```sql
-- Should all return results now:
SELECT COUNT(*) as has_nurse_role FROM roles WHERE name = 'Nurse';
SELECT COUNT(*) as has_nurses FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Nurse' AND u.is_active = 1;
SHOW TRIGGERS LIKE 'child_medical_records';
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Table 'appointments' doesn't exist"

**Symptoms:** Error when creating medical record

**Solution:**
```sql
-- Create appointments table first
USE sokapptest;

CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creator_user_id INT NOT NULL,
    attendee_user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    location VARCHAR(255),
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    reminder_minutes_before INT DEFAULT 1440,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (attendee_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_start_datetime (start_datetime),
    INDEX idx_attendee_user_id (attendee_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Then run the installation script again.

---

### Issue 2: Trigger Already Exists Error

**Symptoms:** Error message about duplicate trigger

**Solution:**
```sql
-- Drop old trigger first
DROP TRIGGER IF EXISTS after_medical_record_insert;

-- Then run installation script
mysql -u root -p sokapptest < database/add_nurse_role_and_auto_appointments.sql
```

---

### Issue 3: No Nurses in System

**Symptoms:** Appointment created but no attendees

**Solution A: Via Frontend**
1. Login as admin
2. Go to User Control
3. Create new user with Role = "Nurse"
4. Make sure user is Active

**Solution B: Via SQL**
```sql
-- First get Nurse role ID
SELECT id FROM roles WHERE name = 'Nurse';

-- Then create nurse user (replace ROLE_ID with actual number)
INSERT INTO users (full_name, email, password, role_id, department, is_active)
VALUES (
    'Jane Nurse',
    'jane.nurse@sokapp.com',
    '$2b$12$[hashed_password]',  -- Use bcrypt hashed password
    ROLE_ID,  -- e.g., 8
    'Medical Department',
    1
);
```

---

### Issue 4: Medical Record Created Without Date

**Symptoms:** No appointment created even though feature installed

**Check:** Did you fill in `next_appointment_date` field?

**Solution:**
When creating medical record, ensure you:
1. Select "Ongoing Health Note" type
2. Fill in **Next Appointment Date** field with future date/time
3. The trigger ONLY fires if this field has a value

**Test it:**
```sql
-- Check your recent medical records
SELECT id, next_appointment_date, created_at
FROM child_medical_records
ORDER BY created_at DESC
LIMIT 5;

-- If next_appointment_date is NULL, that's why no appointment was created
```

---

### Issue 5: Calendar Not Showing Appointments

**Symptoms:** Appointment exists in database but not visible in UI

**Solution:**

**Check 1: Verify appointment was created**
```sql
SELECT * FROM appointments 
WHERE title LIKE '%Medical Appointment%'
ORDER BY created_at DESC
LIMIT 5;
```

**Check 2: Refresh calendar page**
- Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Restart frontend server

**Check 3: Check calendar filters**
- Ensure calendar is set to show correct date range
- Check if filters are hiding medical appointments
- Try different calendar views (day/week/month)

---

### Issue 6: Trigger Not Firing

**Symptoms:** Medical record saved, no errors, but no appointment

**Diagnosis:**
```sql
-- Check if trigger exists
SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'sokapptest'
AND TRIGGER_NAME = 'after_medical_record_insert';

-- Check trigger code
SHOW CREATE TRIGGER after_medical_record_insert;
```

**Solution:**
If trigger missing or corrupted, reinstall:
```sql
DROP TRIGGER IF EXISTS after_medical_record_insert;
-- Then run full installation script
```

---

## 📊 Manual Test Procedure

### Test 1: Basic Functionality

1. **Create Test Medical Record:**
```sql
USE sokapptest;

-- Get a child ID
SELECT id, first_name, last_name FROM children LIMIT 1;
-- Let's say child_id = 1

-- Create medical record with appointment
INSERT INTO child_medical_records (
    child_id, note_type, medical_condition, 
    next_appointment_date, diagnosis, visit_reason
) VALUES (
    1, 
    'ongoing_health',
    'Test - Auto appointment',
    DATE_ADD(NOW(), INTERVAL 2 DAY),  -- 2 days from now
    'Test diagnosis',
    'Testing automatic appointment creation'
);
```

2. **Check if Appointment Created:**
```sql
SELECT * FROM appointments 
WHERE title LIKE '%Medical Appointment%'
AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
ORDER BY created_at DESC;
```

**Expected Result:** At least one appointment row

---

### Test 2: Multiple Nurses

1. **Create 2-3 test nurses:**
```sql
-- Get Nurse role ID first
SET @nurse_role_id = (SELECT id FROM roles WHERE name = 'Nurse');

-- Create test nurses
INSERT INTO users (full_name, email, password, role_id, is_active) VALUES
('Nurse Test 1', 'nurse1@test.com', '[hash]', @nurse_role_id, 1),
('Nurse Test 2', 'nurse2@test.com', '[hash]', @nurse_role_id, 1);
```

2. **Create medical record** (as above)

3. **Check appointments:**
```sql
SELECT a.id, a.title, u.full_name as attendee
FROM appointments a
JOIN users u ON a.attendee_user_id = u.id
WHERE a.title LIKE '%Medical Appointment%'
ORDER BY a.created_at DESC;
```

**Expected Result:** One appointment per nurse

---

## 🔍 Debug Checklist

Run through this checklist systematically:

- [ ] **Database Setup**
  - [ ] Nurse role exists (`SELECT * FROM roles WHERE name='Nurse'`)
  - [ ] At least 1 active nurse user
  - [ ] Trigger exists (`SHOW TRIGGERS LIKE 'child_medical_records'`)
  - [ ] Appointments table exists

- [ ] Medical Record Creation
  - [ ] `next_appointment_date` field filled (NOT NULL)
  - [ ] Future date selected
  - [ ] Record saved successfully (no errors)

- [ ] Appointment Creation
  - [ ] Appointment exists in database
  - [ ] Title contains "Medical Appointment - [Child Name]"
  - [ ] Start datetime matches `next_appointment_date`
  - [ ] `reminder_minutes_before = 1440`

- [ ] Calendar Display
  - [ ] Correct date range selected
  - [ ] No filters hiding appointments
  - [ ] Browser cache cleared
  - [ ] Frontend server restarted

- [ ] Email Reminders (Optional Check)
  - [ ] Backend scheduler running
  - [ ] Brevo API key configured
  - [ ] Nurse emails valid

---

## 🎯 Success Indicators

You'll know it's working when:

✅ **Immediately After Creating Medical Record:**
- Medical record saved without errors
- Appointment appears in database within same transaction
- Appointment title: "Medical Appointment - [Child Name]"
- Start time matches the `next_appointment_date` you entered
- Each nurse has their own appointment instance

✅ **In Calendar UI:**
- Appointment visible on correct date
- Shows all nurse attendees
- Location shows medical center/hospital name
- Can click to view/edit details

✅ **24 Hours Before Appointment:**
- All nurses receive email notification
- Email subject: "Reminder: Medical Appointment - [Child] starts in 1 day"
- Email contains all appointment details

---

## 📞 Still Having Issues?

If none of the above solutions work:

1. **Check Backend Logs:**
   - Look for SQL errors when creating medical record
   - Check for trigger execution errors
   - Monitor appointment creation queries

2. **Check Database Permissions:**
   - Ensure database user has TRIGGER privilege
   - Verify INSERT permissions on appointments table

3. **Manual Appointment Creation Test:**
   ```sql
   -- Try creating appointment manually to verify table works
   INSERT INTO appointments (
       creator_user_id, attendee_user_id, title,
       start_datetime, end_datetime, status,
       reminder_minutes_before
   ) VALUES (
       1,  -- Your user ID
       1,  -- Or nurse user ID
       'Test Appointment',
       DATE_ADD(NOW(), INTERVAL 1 DAY),
       DATE_ADD(NOW(), INTERVAL 2 HOUR),
       'scheduled',
       1440
   );
   ```
   - If this fails: appointments table issue
   - If this works: trigger issue

4. **Reinstall Complete Feature:**
   ```bash
   # Drop everything and reinstall
   DROP TRIGGER IF EXISTS after_medical_record_insert;
   DELETE FROM appointments WHERE title LIKE '%Medical Appointment%';
   DELETE FROM roles WHERE name = 'Nurse';
   
   # Then run fresh install
   mysql -u root -p sokapptest < database/add_nurse_role_and_auto_appointments.sql
   ```

---

## 🚀 Prevention Tips

To avoid this issue in the future:

1. **Always Run Full Installation Script**
   - Don't skip steps
   - Run scripts in order specified
   - Verify each step completes

2. **Test After Installation**
   - Use test script before going live
   - Create sample medical record
   - Verify appointment appears

3. **Train Staff Properly**
   - Show them how to fill `next_appointment_date`
   - Explain the automatic nature
   - Demonstrate calendar checking

4. **Monitor Regularly**
   - Check appointment creation weekly
   - Review nurse feedback on reminders
   - Audit medical records without appointments

---

**Last Updated:** March 31, 2026  
**Status:** Ready for troubleshooting  

**Start with RUN_DIAGNOSIS.bat for fastest resolution!** 🎯
