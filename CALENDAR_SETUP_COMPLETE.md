# 🎉 Calendar/Events Feature - Complete Setup Guide

## ✅ What Was Fixed

### **Problem**
- Frontend was calling `/api/appointments` but backend didn't have this endpoint
- Changed to `/api/events` but route wasn't registered in main backend server
- 404 error: "API endpoint /api/events not found"

### **Solution**
Created complete events/calendar system in your main backend (Version 3/Backend):

1. **Created Route File**: `Backend/routes/events.routes.js`
2. **Created Controller**: `Backend/controllers/eventController.js`
3. **Created Validation Middleware**: `Backend/middleware/validationMiddleware.js`
4. **Registered Route**: Added to `server.js` at line 62
5. **Database Schema**: `Backend/database/create_events_table.sql`

---

## 🚀 SETUP STEPS

### **Step 1: Create Database Table**

Run this SQL command in your MySQL database:

```bash
# Option A: Using MySQL CLI
mysql -u root -p sokapptest < Backend/database/create_events_table.sql

# Option B: Copy paste into MySQL Workbench or phpMyAdmin
# Open: Backend/database/create_events_table.sql
# Copy all content and execute in your SQL client
```

**What this does:**
- Creates `events` table for storing appointments
- Creates `event_attendees` table for tracking multiple attendees
- Adds sample data for testing

---

### **Step 2: Install Required Dependencies**

Make sure you have these packages installed in your backend:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
npm install express-validator
```

---

### **Step 3: Restart Backend Server**

**CRITICAL**: You MUST restart your backend for changes to take effect!

```bash
# Stop current server (Ctrl + C)
# Then restart:
node server.js
```

You should see:
```
🔔 Setting up appointment reminder scheduler...
Server running on http://localhost:5000
✓ Events route registered at /api/events
```

---

### **Step 4: Test the API**

#### **Option A: Test Health Check**
Open browser: `http://localhost:5000/api/health`

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

#### **Option B: Test Events Endpoint**
Open browser: `http://localhost:5000/api/events`

Expected response:
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [...],
    "pagination": {...}
  }
}
```

#### **Option C: Test Creating Event via API**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Meeting",
    "description": "Testing the calendar feature",
    "start_time": "2026-03-22T10:00:00.000Z",
    "end_time": "2026-03-22T11:00:00.000Z",
    "location": "Test Room",
    "category": "meeting"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {...}
  }
}
```

---

### **Step 5: Test Frontend**

1. **Refresh your React app** (Ctrl + F5 to clear cache)
2. **Navigate to Organization Calendar**
3. **Click "+ New Appointment"**
4. **Fill in the form:**
   - Title: "Team Meeting"
   - Attendees: Select at least one person
   - Date: Pick any date
   - Start Time: 10:00 AM
   - End Time: 11:00 AM
5. **Click Create**

**Expected Result:**
- ✅ Success message appears
- ✅ Appointment shows on calendar
- ✅ Console shows: `[AppointmentModal] Response status: 201`

---

## 📋 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events (with pagination) |
| GET | `/api/events/upcoming` | Get upcoming events |
| GET | `/api/events/range?startDate=X&endDate=Y` | Get events in date range |
| GET | `/api/events/:id` | Get single event by ID |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/:id` | Update existing event |
| DELETE | `/api/events/:id` | Delete event |

---

## 🎯 Payload Format

### **Create/Update Event**
```json
{
  "title": "Team Meeting",           // Required
  "description": "Weekly sync",      // Optional
  "start_time": "2026-03-22T10:00:00.000Z",  // Required (ISO format)
  "end_time": "2026-03-22T11:00:00.000Z",    // Required (ISO format)
  "location": "Conference Room A",   // Optional
  "category": "meeting",             // Optional: general, meeting, deadline, holiday, training, other
  "reminder_time": "2026-03-22T09:30:00.000Z", // Optional (ISO format)
  "attendee_user_ids": [1, 2, 3]     // Optional (array of user IDs)
}
```

---

## 🐛 Troubleshooting

### **Still getting 404?**

1. **Check if backend is running:**
   ```bash
   # Look for this in terminal:
   Server running on http://localhost:5000
   ```

2. **Check console logs:**
   When creating appointment, you should see:
   ```
   [AppointmentModal] Sending payload: {...}
   [AppointmentModal] Response status: 201  ← Success!
   ```

3. **Verify route is registered:**
   Check `Backend/server.js` line ~62 for:
   ```javascript
   const eventRoutes = require('./routes/events.routes');
   app.use('/api/events', eventRoutes);
   ```

### **Database errors?**

1. **Check database connection:**
   Make sure your `.env` file has correct DB credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3307
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sokapptest
   ```

2. **Verify table exists:**
   Run in MySQL:
   ```sql
   USE sokapptest;
   SHOW TABLES LIKE 'events';
   ```

### **Validation errors?**

If you get "Title, start time, and end time are required":
- Make sure all required fields are filled
- Check that dates are in ISO 8601 format
- Verify `start_time` is before `end_time`

---

## 📝 Files Created/Modified

### **New Files:**
- ✅ `Backend/routes/events.routes.js` - Route definitions
- ✅ `Backend/controllers/eventController.js` - Business logic
- ✅ `Backend/middleware/validationMiddleware.js` - Validation
- ✅ `Backend/database/create_events_table.sql` - Database schema

### **Modified Files:**
- ✅ `Backend/server.js` - Added events route registration (line 62)
- ✅ `src/config/api.js` - Changed endpoints from `/appointments` to `/events`
- ✅ `src/components/AppointmentModal.js` - Updated payload field mapping

---

## 🎊 Success Indicators

You'll know it's working when:
1. ✅ Backend starts without errors
2. ✅ `/api/health` returns success
3. ✅ Creating appointment shows 201 status in console
4. ✅ Appointments appear on calendar after creation
5. ✅ No 404 errors in browser console

---

## 💡 Next Steps

After confirming everything works:
1. Test editing existing appointments
2. Test deleting appointments
3. Test viewing appointments by date range
4. Test email reminders (if configured)

---

**Need Help?**
Share the console output from both frontend (F12) and backend terminal if you encounter any issues!
