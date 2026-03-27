# 📧 Quick Reference - Appointment Email Reminders

## ⚡ Quick Start (3 Steps)

### 1. Start Backend
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
npm start
```

Look for: `✅ Scheduler initialized successfully!`

### 2. Create Appointment
- Go to: `http://localhost:3000/appointments`
- Click "+ New Appointment"
- Set start time **2 minutes from now**
- Fill in title, attendee, details
- Click "Create"

### 3. Check Email
- Wait 1 minute
- Check attendee's email inbox
- Should receive reminder 1 minute before meeting

---

## 🔑 Key Information

| What | Value |
|------|-------|
| **When sent** | 1 minute before start |
| **Who receives** | Attendee + Creator |
| **How often** | Scheduler runs every minute |
| **Email service** | Brevo API |
| **Timezone** | UTC (configurable) |

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `Backend/scheduler/appointmentReminder.scheduler.js` | Main scheduler logic |
| `Backend/server.js` | Initializes scheduler |
| `test-appointment-reminder.js` | Test script |
| `package.json` | Has node-cron dependency |

---

## 🧪 Testing Commands

### Test Full Scheduler:
```bash
node test-appointment-reminder.js
```

### Watch Live Logs:
```bash
# Start backend and watch console for:
⏰ Running appointment reminder check...
📧 Sending reminder to...
✅ Email sent successfully!
```

---

## 🔍 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| No email received | Check Brevo API key in .env |
| Email in spam | Add sender to contacts |
| Wrong timezone | Edit scheduler file, change timezone |
| Scheduler not running | Restart backend server |
| API error | Check internet connection |

---

## ⚙️ Configuration (.env)

```env
# Required
BREVO_API_KEY=your_api_key_here
EMAIL_FROM=your_verified_email@example.com

# Database
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sokapp_db
```

---

## 📊 How It Works (Simple)

```
Every Minute → Check DB → Find Appts Starting Soon → Send Emails
```

### Timeline Example:
- **10:00** - User creates appointment for 10:16
- **10:15:00** - Scheduler runs
- **10:15:01** - Finds appointment starting at 10:16
- **10:15:02** - Sends emails via Brevo
- **10:16:00** - Meeting starts (recipient should be ready!)

---

## 🎯 Success Indicators

✅ Backend shows: `Scheduler initialized successfully!`  
✅ Scheduler logs run every minute  
✅ Email delivered to attendee  
✅ Email delivered to creator  
✅ Email shows correct time and details  

---

## 💡 Pro Tips

1. **Create appointments 2+ minutes in future** - Gives scheduler time to catch it
2. **Use real email addresses** - Don't test with fake emails
3. **Check Brevo dashboard** - See delivery statistics
4. **Keep backend running** - Scheduler only works when server is on
5. **Monitor console logs** - Easy to debug with detailed logging

---

## 🆘 Need Help?

### Detailed Guides:
- `APPOINTMENT_EMAIL_REMINDER_GUIDE.md` - Complete setup guide
- `APPOINTMENT_EMAIL_REMINDER_FLOW.md` - Visual diagrams
- `APPOINTMENT_EMAIL_REMINDER_SUMMARY.md` - Implementation summary

### Run Diagnostics:
```bash
node test-appointment-reminder.js
```

### Check Brevo:
Login to https://app.brevo.com to see email delivery logs

---

## 🎨 Email Preview

```
┌─────────────────────────────┐
│ 🔔 Appointment Reminder     │
├─────────────────────────────┤
│ STARTS IN 1 MINUTE          │
│                             │
│ 📋 Team Meeting             │
│ 📅 Thursday, March 19, 2026 │
│ ⏰ 10:16 AM                 │
│ 📍 Conference Room A        │
│ 👤 With: John Doe           │
└─────────────────────────────┘
```

---

## ✅ Checklist for Testing

- [ ] Backend server running
- [ ] Scheduler initialized message seen
- [ ] Test user has valid email
- [ ] Appointment created for 2+ minutes from now
- [ ] Attendee selected
- [ ] Waiting for scheduler to run
- [ ] Checked email inbox (and spam)
- [ ] Verified email content is correct

---

**Status:** ✅ COMPLETE  
**Last Updated:** March 19, 2026  
**Version:** 1.0  
