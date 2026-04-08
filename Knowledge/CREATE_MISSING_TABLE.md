# URGENT: Missing Database Table Fix

## 🚨 Problem Identified

The `appointment_attendees` table **DOES NOT EXIST** in your database!

This is why attendees show "No attendees" even though appointments are being created.

### Why This Happens:
- The backend code tries to INSERT attendees into `appointment_attendees` table
- But that table was never created in the database
- The INSERT fails silently (or gets caught by try-catch)
- Appointments are saved, but attendees are NOT

---

## ✅ Solution: Create the Missing Table

### Option 1: Using MySQL Workbench or phpMyAdmin (RECOMMENDED - Easiest!)

**Step 1:** Open MySQL Workbench or phpMyAdmin

**Step 2:** Connect to your database:
- Host: `127.0.0.1` or `localhost`
- Port: `3307`
- Username: `root`
- Password: (your MySQL password, often empty '')
- Database/Schema: `sokapptest`

**Step 3:** Run this SQL query:

```sql
USE sokapptest;

-- Create appointment_attendees junction table
CREATE TABLE IF NOT EXISTS appointment_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL COMMENT 'Reference to appointment',
    user_id INT NOT NULL COMMENT 'Reference to user (attendee)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    
    -- Foreign key constraints
    CONSTRAINT fk_appt_attendee_appointment 
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_appt_attendee_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate attendees
    UNIQUE KEY unique_attendee_per_appointment (appointment_id, user_id),
    
    -- Index for performance
    INDEX idx_user_id (user_id),
    INDEX idx_appointment_id (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Junction table for multiple attendees per appointment';

-- Migrate existing attendee data to the new table
INSERT INTO appointment_attendees (appointment_id, user_id)
SELECT id, attendee_user_id 
FROM appointments 
WHERE attendee_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE user_id = user_id;

-- Verify it was created
SHOW TABLES LIKE 'appointment_attendees';

-- Show table structure
DESCRIBE appointment_attendees;
```

**Step 4:** You should see:
- ✅ "Query OK" or "Success" message
- ✅ `appointment_attendees` listed in tables
- ✅ Existing appointments migrated to the new table

---

### Option 2: Using Command Line (If MySQL is installed)

Find your MySQL installation path and run:

```bash
# Navigate to MySQL bin folder (adjust path based on your installation)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Execute the SQL file
mysql -u root -h 127.0.0.1 -P 3307 sokapptest < "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend\create-appointment-attendees-table.sql"
```

---

## 🔍 Verify the Table Was Created

After running the SQL, verify by checking in your database tool:

```sql
USE sokapptest;
SHOW TABLES;
```

You should see `appointment_attendees` in the list.

Also check:
```sql
DESCRIBE appointment_attendees;
```

Should show columns:
- `id` (INT, PRI, auto_increment)
- `appointment_id` (INT, NO, MUL)
- `user_id` (INT, NO, MUL)
- `created_at` (TIMESTAMP)

---

## 📋 After Creating the Table

### Step 1: Restart Backend Server

Stop the current backend server (`Ctrl+C`) and restart:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### Step 2: Test Appointment Creation

1. Open app at `http://localhost:3000`
2. Go to Organization → System Calendar
3. Click "+ New Appointment"
4. Fill in form with attendee
5. Save

### Step 3: Verify Attendees Are Saved

**Check in Browser:**
- Edit the appointment you just created
- Should now show the attendee name (NOT "No attendees")

**Check Database:**
```sql
SELECT 
    a.id,
    a.title,
    a.attendee_user_id,
    u.full_name as old_attendee,
    aa.user_id as new_attendee_id,
    u2.full_name as new_attendee_name
FROM appointments a
LEFT JOIN users u ON a.attendee_user_id = u.id
LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
LEFT JOIN users u2 ON aa.user_id = u2.id
ORDER BY a.id DESC
LIMIT 5;
```

Should show attendees in BOTH:
- `attendee_user_id` column (old way)
- `appointment_attendees` table (new way)

---

## 🎯 What This Fixes

### Before Fix:
```
Create Appointment
    ↓
Save to appointments table ✅
    ↓
Try to save to appointment_attendees ❌ FAILS (table doesn't exist)
    ↓
Frontend shows: "With: No attendees" ❌
```

### After Fix:
```
Create Appointment
    ↓
Save to appointments table ✅
    ↓
Save to appointment_attendees table ✅
    ↓
Frontend shows: "With: John Doe" ✅
```

---

## 📊 Complete Fix Summary

### All Issues Found & Fixed:

1. ✅ **API Endpoint Mismatch**: Changed `/api/events` → `/api/appointments`
2. ✅ **Field Name Mismatch**: Fixed `start_time` → `start_datetime`, etc.
3. ✅ **Database Schema**: Added `attendee_user_id` to INSERT for backward compatibility
4. ⏳ **Missing Table**: `appointment_attendees` needs to be created ← **YOU NEED TO DO THIS!**

### Files Modified:
- `src/config/api.js` - Endpoint alignment
- `src/components/AppointmentModal.js` - Field alignment
- `Backend/server.js` - Backward compatible INSERT

### Still Needed:
- **YOUR ACTION**: Run the SQL migration to create `appointment_attendees` table

---

## 🆘 Troubleshooting

### If Table Creation Fails:

**Error: "Table already exists"**
- That's good! Means it already exists
- Skip to "Restart Backend Server" section

**Error: "Foreign key constraint failed"**
- Make sure `appointments` and `users` tables exist first
- Check database name is correct: `sokapptest`

**Error: "Access denied"**
- Use correct MySQL username/password
- Try with admin privileges

### If Attendees Still Don't Show After Table Creation:

1. **Verify table exists:**
   ```sql
   USE sokapptest;
   SHOW TABLES LIKE 'appointment_attendees';
   ```

2. **Check backend logs** for any SQL errors when creating appointments

3. **Test with a NEW appointment** (don't edit old ones)

4. **Clear browser cache** and hard refresh (`Ctrl+Shift+R`)

---

## 📝 Quick Reference

**Database:** `sokapptest`  
**Port:** `3307`  
**Host:** `127.0.0.1` or `localhost`  
**Table to create:** `appointment_attendees`  

**SQL File Location:**  
`c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend\create-appointment-attendees-table.sql`

---

**Created:** 2026-03-21  
**Priority:** HIGH - Must do this before attendees will save!  
**Estimated Time:** 5 minutes
