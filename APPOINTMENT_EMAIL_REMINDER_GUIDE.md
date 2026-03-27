# 📧 Appointment Email Reminder System

## ✅ Implementation Complete

Email notifications are now automatically sent to attendees **1 minute before** their appointment starts!

---

## 🚀 How It Works

### Automatic Scheduler
- The system runs a check **every minute** using a cron job scheduler
- Looks for appointments starting in the next 1-2 minutes
- Sends email reminders to both the **attendee** and **creator**
- Uses Brevo API for reliable email delivery

### Who Receives Notifications?
✅ **Attendee** - Gets the main reminder email  
✅ **Creator** - Gets a copy of the reminder

---

## 📋 Features

### Email Content Includes:
- 📋 Appointment title
- 📅 Date and time (formatted nicely)
- ⏰ Start time with "STARTS IN 1 MINUTE" badge
- 📍 Location (if provided)
- 👤 Person they're meeting with
- 📝 Description (if provided)

### Beautiful Design:
- Professional gradient header
- Clean, modern layout
- Mobile-responsive HTML
- Color-coded sections
- Clear visual hierarchy

---

## 🔧 Setup Requirements

### 1. Install Dependencies
```bash
npm install node-cron
```

### 2. Configure Environment Variables
Make sure your `.env` file has:
```env
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=your_verified_email@example.com
```

### 3. Database Connection
Ensure your database config is correct in `.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sokapp_db
```

---

## 🎯 How to Test

### Option 1: Create an Appointment
1. Open the calendar at `http://localhost:3000/appointments` or `http://localhost:3000/system-calendar`
2. Create an appointment that starts **1-2 minutes from now**
3. Wait for the scheduler to run (at the start of the next minute)
4. Check the attendee's email inbox

### Option 2: Run Test Script
```bash
node test-appointment-reminder.js
```

This will:
- Show upcoming appointments
- Send a test reminder manually
- Run the full scheduler check

### Option 3: Watch Server Logs
When the backend server starts, you'll see:
```
🔔 Setting up appointment reminder scheduler...

🚀 Initializing Appointment Reminder Scheduler...
✅ Scheduler initialized successfully!
📅 Reminders will be sent 1 minute before each appointment starts
⏰ Scheduler runs every minute to check for upcoming appointments
```

Every minute, if there are appointments starting soon:
```
===========================================
⏰ Running appointment reminder check...
Current time: 3/19/2026, 10:15:00 AM
===========================================

📅 Checking for appointments between:
   From: 2026-03-19 10:16:00
   To: 2026-03-19 10:17:00
✅ Found 1 upcoming appointment(s)

📧 Sending reminder to Jane Smith (jane@example.com)
   Appointment: Team Meeting
   Start Time: 10:16 AM
✅ Email sent successfully!
```

---

## 📂 Files Created/Modified

### New Files:
- `Backend/scheduler/appointmentReminder.scheduler.js` - Main scheduler logic
- `test-appointment-reminder.js` - Test script

### Modified Files:
- `package.json` - Added node-cron dependency
- `Backend/server.js` - Initialize scheduler on startup

---

## 🔍 Troubleshooting

### Issue: Emails not sending
**Check:**
1. Brevo API key is set in `.env`
2. Sender email is verified in Brevo dashboard
3. Internet connection is working
4. Firewall allows HTTPS to api.brevo.com

### Issue: Scheduler not running
**Check:**
1. Backend server is running
2. Look for initialization message in console
3. Cron job is scheduled (check logs)

### Issue: Wrong timezone
**Fix:**
Edit `Backend/scheduler/appointmentReminder.scheduler.js`:
```javascript
const scheduler = cron.schedule('* * * * *', () => {
    checkAndSendReminders();
}, {
    scheduled: true,
    timezone: 'America/New_York' // Change to your timezone
});
```

### Issue: Appointments not found
**Check:**
1. Appointment `start_datetime` is stored correctly in database
2. Appointment status is 'scheduled'
3. Attendee has a valid email address

---

## 🎨 Customization Options

### Change Reminder Timing
Currently sends 1 minute before. To change:

Edit `Backend/scheduler/appointmentReminder.scheduler.js`:
```javascript
// In getUpcomingAppointments function
const oneMinuteFromNow = new Date(now.getTime() + 60000); // +1 minute
const twoMinutesFromNow = new Date(now.getTime() + 120000); // +2 minutes
```

Change to:
```javascript
const fiveMinutesFromNow = new Date(now.getTime() + 300000); // +5 minutes
const tenMinutesFromNow = new Date(now.getTime() + 600000); // +10 minutes
```

### Change Email Template
Edit the `htmlContent` variable in `sendAppointmentReminder()` function.

### Change Schedule Frequency
Default is every minute. To change:

Edit `Backend/scheduler/appointmentReminder.scheduler.js`:
```javascript
// Run every 5 minutes instead
const scheduler = cron.schedule('*/5 * * * *', () => {
    checkAndSendReminders();
}, {
    scheduled: true,
    timezone: 'UTC'
});
```

---

## 📊 Example Email Preview

```
┌─────────────────────────────────────────────┐
│  🔔 Appointment Reminder                    │
├─────────────────────────────────────────────┤
│                                             │
│ Hello Jane Smith,                           │
│                                             │
│ This is a friendly reminder that you have  │
│ an upcoming appointment:                    │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ STARTS IN 1 MINUTE                   │   │
│ │                                      │   │
│ │ 📋 Title: Team Meeting               │   │
│ │ 📅 Date: Thursday, March 19, 2026    │   │
│ │ ⏰ Time: 10:16 AM                    │   │
│ │ 📍 Location: Conference Room A       │   │
│ │ 👤 With: John Doe                    │   │
│ │ 📝 Description: Weekly team sync-up  │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ Please be ready and on time for your        │
│ appointment.                                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. ✅ **Test the scheduler** - Create an appointment 1-2 minutes from now
2. ✅ **Check email delivery** - Verify emails arrive in inbox (not spam)
3. ✅ **Customize if needed** - Adjust timing, design, or frequency
4. ✅ **Monitor logs** - Watch for any errors in console

---

## 💡 Pro Tips

- **Create test appointments** at least 2 minutes in the future
- **Check spam folder** if emails don't appear in inbox
- **Use real email addresses** for testing (not fake ones)
- **Monitor Brevo dashboard** for delivery statistics
- **Keep backend running** - scheduler only works when server is on

---

## 🆘 Support

If you encounter issues:
1. Check backend console for error messages
2. Verify Brevo API credentials
3. Run the test script: `node test-appointment-reminder.js`
4. Check Brevo dashboard for delivery logs

---

**Implementation Date:** March 19, 2026  
**Status:** ✅ Complete and Ready for Testing  
**Scheduler Status:** 🟢 Active and Running
