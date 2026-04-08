# 📧 Appointment Email Reminder - Visual Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ server.js                                                 │ │
│  │                                                           │ │
│  │  Startup:                                                 │ │
│  │  1. Load environment variables                            │ │
│  │  2. Initialize database connection                        │ │
│  │  3. 🔔 Initialize appointment scheduler ← NEW             │ │
│  │  4. Start Express server                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ scheduler/appointmentReminder.scheduler.js                │ │
│  │                                                           │ │
│  │  Cron Job: * * * * * (Every minute)                       │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │ checkAndSendReminders()                            │   │ │
│  │  │   ↓                                                │   │ │
│  │  │ getUpcomingAppointments()                          │   │ │
│  │  │   ↓                                                │   │ │
│  │  │ Query MySQL for appointments starting in 1-2 min   │   │ │
│  │  │   ↓                                                │   │ │
│  │  │ For each appointment:                              │   │ │
│  │  │   → sendAppointmentReminder()                      │   │ │
│  │  │      ↓                                             │   │ │
│  │  │      Send to attendee via Brevo API                │   │ │
│  │  │      ↓                                             │   │ │
│  │  │      Send to creator via Brevo API                 │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ↓                        ↓                        ↓
    ┌────────┐              ┌──────────┐            ┌──────────┐
    │ MySQL  │              │  Brevo   │            │  Users   │
    │Database│              │Email API │            │(Attendee │
    │        │              │          │            │ Creator) │
    └────────┘              └──────────┘            └──────────┘
```

---

## Timeline Flow: How It Works

### Scenario: Meeting scheduled for 10:16 AM

```
TIME          ACTION                                    WHO
─────────────────────────────────────────────────────────────────

10:00 AM      User creates appointment                  Creator
              "Team Meeting" at 10:16 AM
              
              Database stores:
              - start_datetime: 2026-03-19 10:16:00
              - attendee_user_id: 2 (Jane)
              - creator_user_id: 1 (John)

10:15:00 AM   Cron job triggers                         Scheduler
              checkAndSendReminders() runs
              
10:15:01 AM   Query database                            Scheduler
              SELECT appointments WHERE 
              start_datetime BETWEEN 
                '2026-03-19 10:16:00' AND 
                '2026-03-19 10:17:00'
              
              Found: "Team Meeting" ✅

10:15:02 AM   Format email template                     Scheduler
              - Calculate formatted date
              - Insert appointment details
              - Generate HTML

10:15:03 AM   Send to Attendee (Jane)                   Brevo API
              POST https://api.brevo.com/v3/smtp/email
              
              {
                "to": [{ "email": "jane@example.com" }],
                "subject": "Reminder: Team Meeting starts in 1 minute",
                "htmlContent": "<html>...</html>"
              }
              
              ✅ Email sent! Message ID: abc123

10:15:04 AM   Send to Creator (John)                    Brevo API
              POST https://api.brevo.com/v3/smtp/email
              
              {
                "to": [{ "email": "john@example.com" }],
                "subject": "Reminder: Your appointment \"Team Meeting\" starts in 1 minute",
                "htmlContent": "<html>...</html>"
              }
              
              ✅ Email sent! Message ID: def456

10:15:05 AM   Log success                               Scheduler
              Console: "✅ Reminder sent successfully!"

10:15:06 AM   Scheduler completes                       Scheduler
              Waits until next minute to run again

10:16:00 AM   ⏰ APPOINTMENT STARTS NOW!                Everyone
              Jane and John should be in the meeting!
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: User Creates Appointment                             │
└──────────────────────────────────────────────────────────────┘
                           ↓
                    ┌─────────────┐
                    │  Frontend   │
                    │  (React)    │
                    └─────────────┘
                           ↓ POST /api/appointments
                    ┌─────────────┐
                    │  Backend    │
                    │  (server.js)│
                    └─────────────┘
                           ↓ INSERT INTO appointments
                    ┌─────────────┐
                    │   MySQL     │
                    │  Database   │
                    └─────────────┘
                           │
                           │ Appointment saved with:
                           │ - start_datetime
                           │ - attendee_user_id
                           │ - creator_user_id
                           │
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Scheduler Runs Every Minute                          │
└──────────────────────────────────────────────────────────────┘
                           ↓
                    ┌─────────────────┐
                    │ Cron Schedule   │
                    │ (* * * * *)     │
                    └─────────────────┘
                           ↓ Triggers
                    ┌─────────────────────────────┐
                    │ checkAndSendReminders()     │
                    │                             │
                    │ 1. Get upcoming appts       │
                    │ 2. For each, send emails    │
                    └─────────────────────────────┘
                           ↓ SELECT query
                    ┌─────────────┐
                    │   MySQL     │
                    │  Database   │
                    └─────────────┘
                           ↓ Returns appointments
                    ┌─────────────────────────────┐
                    │ Process each appointment    │
                    └─────────────────────────────┘
                           ↓ POST request
                    ┌─────────────┐
                    │  Brevo API  │
                    │ (Email Svc) │
                    └─────────────┘
                           ↓ Delivers email
                    ┌─────────────┐
                    │  Attendee   │
                    │   Inbox     │
                    └─────────────┘
```

---

## Email Recipients Flow

```
Appointment Created
       │
       ├──→ Creator (User ID: 1)
       │    Name: John Doe
       │    Email: john@example.com
       │    ↓ Receives copy
       │
       └──→ Attendee (User ID: 2)
            Name: Jane Smith
            Email: jane@example.com
            ↓ Receives main reminder
```

Both receive emails, but with slightly different content:

**Attendee Email:**
- "Hello Jane Smith,"
- "You have an upcoming appointment"
- Shows: "With: John Doe"

**Creator Email:**
- "Hello John Doe,"
- "Your appointment is starting soon"
- Shows: "With: Jane Smith"

---

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│ File Structure & Responsibilities                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ package.json                                                │
│   └─→ Dependency: node-cron ^3.0.3                          │
│                                                             │
│ server.js                                                   │
│   └─→ Import & initialize scheduler on startup              │
│       const { initAppointmentScheduler } = require(...)     │
│       const scheduler = initAppointmentScheduler()          │
│                                                             │
│ scheduler/                                                  │
│   appointmentReminder.scheduler.js                          │
│     ├─→ sendEmailNotification() - Send via Brevo            │
│     ├─→ getUpcomingAppointments() - Query DB                │
│     ├─→ sendAppointmentReminder() - Format & send           │
│     ├─→ checkAndSendReminders() - Main orchestration        │
│     └─→ initAppointmentScheduler() - Setup cron job         │
│                                                             │
│ test-appointment-reminder.js                                │
│   └─→ Manual testing script                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Cron Schedule Explanation

```
Cron Pattern: * * * * *
               │ │ │ │ │
               │ │ │ │ └─ Day of Week (0-6, Sunday=0)
               │ │ │ └─── Month (1-12)
               │ │ └───── Day of Month (1-31)
               │ └─────── Hour (0-23)
               └───────── Minute (0-59)

Example Execution Times:
- 10:15:00 → Runs ✓
- 10:16:00 → Runs ✓
- 10:17:00 → Runs ✓
- 10:18:00 → Runs ✓

Runs at the start of EVERY minute, 24/7, while server is running.
```

---

## Database Query Logic

```sql
-- What the scheduler queries every minute:

SELECT 
    a.id,
    a.title,
    a.start_datetime,
    u_attendee.email as attendee_email,
    u_attendee.name as attendee_name,
    u_creator.email as creator_email,
    u_creator.name as creator_name
FROM appointments a
JOIN users u_attendee ON a.attendee_user_id = u_attendee.id
JOIN users u_creator ON a.creator_user_id = u_creator.id
WHERE 
    a.start_datetime BETWEEN 
        '2026-03-19 10:16:00' -- 1 min from now
        AND 
        '2026-03-19 10:17:00' -- 2 min from now
    AND a.status = 'scheduled'
ORDER BY a.start_datetime ASC;

-- Returns only appointments that:
-- 1. Are scheduled (not completed/cancelled)
-- 2. Start in the next 1-2 minutes
-- 3. Have valid attendee and creator
```

---

## Error Handling Flow

```
checkAndSendReminders()
    ↓
Try to get appointments
    ├─ Success → Continue
    └─ Error → Log error, return empty array
         ↓
For each appointment
    ├─ Success → Send email ✓
    └─ Error → Log error, continue to next
         ↓
Complete cycle
    ↓
Wait until next minute
```

The scheduler is resilient - if one email fails, it continues with the rest!

---

## Monitoring & Debugging

```
Backend Console Output (Successful Run):

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

=== Appointment Reminder Email ===
To: jane@example.com
Subject: Reminder: Team Meeting starts in 1 minute

✅ Email sent successfully!
Message ID: abc123xyz

📧 Sending copy to creator: John Doe
=== Appointment Reminder Email ===
To: john@example.com
Subject: Reminder: Your appointment "Team Meeting" starts in 1 minute

✅ Email sent successfully!
Message ID: def456uvw

✅ Reminder check completed successfully!
===========================================
```

---

## Complete User Journey

```
Day Before Meeting
┌──────────────────────────────────────────────────┐
│ John (Creator) creates appointment:              │
│ - Title: "Team Meeting"                          │
│ - Date: Tomorrow at 10:16 AM                     │
│ - Attendee: Jane Smith                           │
│ - Location: Conference Room A                    │
└──────────────────────────────────────────────────┘
                    ↓
Next Day - 10:15 AM
┌──────────────────────────────────────────────────┐
│ Scheduler runs automatically                     │
│ ↓                                                │
│ Finds appointment starting at 10:16 AM           │
│ ↓                                                │
│ Sends email to Jane (attendee)                   │
│ Sends email to John (creator)                    │
└──────────────────────────────────────────────────┘
                    ↓
Next Day - 10:15:30 AM
┌──────────────────────────────────────────────────┐
│ Jane checks email:                               │
│ Subject: "Reminder: Team Meeting starts in 1 min"│
│ ↓                                                │
│ Opens email, sees details                        │
│ ↓                                                │
│ Gets ready for meeting                           │
└──────────────────────────────────────────────────┘
                    ↓
Next Day - 10:16 AM
┌──────────────────────────────────────────────────┐
│ ⏰ Meeting Time!                                 │
│ Both John and Jane join the meeting              │
│ ✅ SUCCESS!                                      │
└──────────────────────────────────────────────────┘
```

---

**Implementation Status:** ✅ COMPLETE  
**Testing Status:** 🟢 READY  
**Documentation:** ✅ COMPREHENSIVE  
