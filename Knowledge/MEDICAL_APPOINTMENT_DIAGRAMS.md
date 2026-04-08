# Medical Appointment Auto-Creation - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                                 │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Child Profile → Medical Tab                                    │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Add Medical Record Form                                  │  │    │
│  │  │  ├─ Note Type: ○ Home Health  ○ Ongoing Health           │  │    │
│  │  │  ├─ Diagnosis: [________________________]                │  │    │
│  │  │  ├─ Visit Reason: [_______________________]              │  │    │
│  │  │  ├─ Next Appointment: [📅 2026-04-15 10:00] ← KEY FIELD! │  │    │
│  │  │  └─ [Add Record]                                          │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ POST /api/children/:id/medical-records
                             │ { nextAppointmentDate: "2026-04-15 10:00:00" }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  routes/children.routes.js                                      │    │
│  │  POST /:id/medical-records                                      │    │
│  └────────────────────┬───────────────────────────────────────────┘    │
│                       │                                                  │
│                       ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  models/Child.js                                                │    │
│  │  async addMedicalRecord(childId, data)                          │    │
│  │  ├─ Inserts into child_medical_records table                   │    │
│  │  └─ Includes next_appointment_date field                       │    │
│  └────────────────────┬───────────────────────────────────────────┘    │
│                       │                                                  │
│                       │ INSERT INTO child_medical_records ...          │
│                       │ VALUES (..., next_appointment_date, ...)       │
│                       │                                                  │
│                       ▼                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             │ MySQL Database
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (MySQL)                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  child_medical_records table                                    │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │ id | child_id | note_type | next_appointment_date | ...  │  │    │
│  │  │ 123|    5    | ongoing   | 2026-04-15 10:00:00  | ...  │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────┬───────────────────────────────────────────┘    │
│                       │ AFTER INSERT TRIGGER FIRES                     │
│                       │                                                │
│                       ▼                                                │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  TRIGGER: after_medical_record_insert                           │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │ IF NEW.next_appointment_date IS NOT NULL THEN            │  │    │
│  │  │   1. Get Nurse role ID                                   │  │    │
│  │  │   2. Get all active nurses                               │  │    │
│  │  │   3. Get child name                                      │  │    │
│  │  │   4. FOR EACH nurse:                                     │  │    │
│  │  │      INSERT INTO appointments (                          │  │    │
│  │  │        creator_user_id,                                  │  │    │
│  │  │        attendee_user_id,  ← Each nurse                   │  │    │
│  │  │        title = "Medical Appointment - [Name]",           │  │    │
│  │  │        start_datetime = next_appointment_date,           │  │    │
│  │  │        reminder_minutes_before = 1440  ← 24 hours        │  │    │
│  │  │      )                                                   │  │    │
│  │  │ END IF;                                                  │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────┬───────────────────────────────────────────┘    │
│                       │                                                  │
│                       ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  appointments table                                             │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │ id | creator_id | attendee_id | title | start | reminder │  │    │
│  │  │ 45 |     7      |     7      | Med Appt - John | ...    │  │    │
│  │  │ 46 |     7      |     12     | Med Appt - John | ...    │  │    │
│  │  │ 47 |     7      |     15     | Med Appt - John | ...    │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Scheduler runs every minute
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT REMINDER SCHEDULER                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  scheduler/appointmentReminder.scheduler.js                     │    │
│  │  cron.schedule('* * * * *', checkAndSendReminders)              │    │
│  │                                                                  │    │
│  │  Every minute:                                                   │    │
│  │  1. Query: SELECT appointments WHERE                            │    │
│  │     start_time - reminder_minutes = now()                       │    │
│  │  2. For each appointment due:                                   │    │
│  │     - Send email via Brevo API                                  │    │
│  │     - To: All nurse attendees                                   │    │
│  │     - Subject: "Reminder: [Title] starts in 24 hours"           │    │
│  └────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Email Notification
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EMAIL RECIPIENTS (Nurses)                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  📧 Nurse Jane (jane@sokapp.com)                                │    │
│  │  📧 Nurse Bob (bob@sokapp.com)                                  │    │
│  │  📧 Nurse Alice (alice@sokapp.com)                              │    │
│  │                                                                  │    │
│  │  Email Content:                                                  │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Subject: Reminder: Medical Appointment - John Doe        │  │    │
│  │  │  starts in 1 day                                          │  │    │
│  │  │  ───────────────────────────────────────────────────────  │  │    │
│  │  │  Hello Jane,                                              │  │    │
│  │  │                                                           │  │    │
│  │  │  This is a reminder that you have an upcoming             │  │    │
│  │  │  appointment:                                             │  │    │
│  │  │                                                           │  │    │
│  │  │  Title: Medical Appointment - John Doe                    │  │    │
│  │  │  Date: Wednesday, April 15, 2026                          │  │    │
│  │  │  Time: 10:00 AM                                           │  │    │
│  │  │  Location: Medical Center                                 │  │    │
│  │  │                                                           │  │    │
│  │  │  STARTS IN 1 DAY                                          │  │    │
│  │  │                                                           │  │    │
│  │  │  [Beautiful HTML email with full details]                 │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sequence Diagram

```
User (Frontend)          Backend API          Database            Scheduler           Nurse Email
     │                       │                    │                   │                    │
     │  POST medical record  │                    │                   │                    │
     │──────────────────────>│                    │                   │                    │
     │                       │  INSERT record     │                   │                    │
     │                       │───────────────────>│                   │                    │
     │                       │                    │                   │                    │
     │                       │                    │  Trigger fires    │                    │
     │                       │                    │  (AFTER INSERT)   │                    │
     │                       │                    │                   │                    │
     │                       │                    │  Get Nurse role   │                    │
     │                       │                    │───────────────┐   │                    │
     │                       │                    │               │   │                    │
     │                       │                    │<──────────────┘   │                    │
     │                       │                    │                   │                    │
     │                       │                    │  Get all nurses   │                    │
     │                       │                    │───────────────┐   │                    │
     │                       │                    │               │   │                    │
     │                       │                    │<──────────────┘   │                    │
     │                       │                    │                   │                    │
     │                       │                    │  CREATE appointment for each nurse     │
     │                       │                    │────────────────────────────────────>    │
     │                       │                    │                   │                    │
     │                       │                    │  Appointments created                  │
     │                       │<───────────────────┘                   │                    │
     │  Success response     │                    │                   │                    │
     │<──────────────────────┘                    │                   │                    │
     │                       │                    │                   │                    │
     │                       │                    │                   │  Run every minute  │
     │                       │                    │                   │────────────┐      │
     │                       │                    │                   │            │      │
     │                       │                    │                   │<───────────┘      │
     │                       │                    │                   │                   │
     │                       │                    │                   │  Check reminders  │
     │                       │                    │                   │───────────────┐   │
     │                       │                    │                   │               │   │
     │                       │                    │                   │<──────────────┘   │
     │                       │                    │                   │                   │
     │                       │                    │                   │  Query: appts due │
     │                       │                    │<──────────────────┤                   │
     │                       │                    │                   │                   │
     │                       │                    │>──────────────────┤                   │
     │                       │                    │                   │                   │
     │                       │                    │                   │  Send email       │
     │                       │                    │                   │───────────────┐   │
     │                       │                    │                   │               │   │
     │                       │                    │                   │<──────────────┘   │
     │                       │                    │                   │                   │
     │                       │                    │                   │  Email delivered  │
     │                       │                    │                   │──────────────────>│
     │                       │                    │                   │                   │
```

---

## Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
│   MedicalTab │
└──────┬───────┘
       │
       │ 1. User fills form with next_appointment_date
       │
       ▼
┌──────────────────────────┐
│  Child.addMedicalRecord()│
│  Backend Model           │
└──────┬───────────────────┘
       │
       │ 2. INSERT INTO child_medical_records
       │    Fields: child_id, note_type, next_appointment_date, ...
       │
       ▼
┌──────────────────────────┐
│  child_medical_records   │
│  Table                   │
└──────┬───────────────────┘
       │
       │ 3. AFTER INSERT trigger fires
       │
       ▼
┌──────────────────────────────────────┐
│  TRIGGER: after_medical_record_insert│
├──────────────────────────────────────┤
│  Condition:                          │
│  IF next_appointment_date IS NOT NULL│
│                                      │
│  Actions:                            │
│  1. SELECT role_id WHERE name='Nurse'│
│  2. SELECT * FROM users WHERE        │
│     role_id = [Nurse ID] AND         │
│     is_active = 1                    │
│  3. GET child_name FROM children     │
│  4. LOOP through nurses:             │
│     INSERT INTO appointments         │
└──────┬───────────────────────────────┘
       │
       │ 4. CREATE appointments
       │
       ▼
┌──────────────────────────┐
│   appointments table     │
│                          │
│ Per Nurse:               │
│ - creator_user_id        │
│ - attendee_user_id       │
│ - title                  │
│ - start_datetime         │
│ - reminder_minutes_before│
└──────┬───────────────────┘
       │
       │ 5. Scheduler checks every minute
       │
       ▼
┌──────────────────────────────────────┐
│  Scheduler Logic                     │
├──────────────────────────────────────┤
│  Calculate:                          │
│  reminderTime = startTime - 1440min  │
│                                      │
│  If reminderTime >= (now - 1min)     │
│  AND reminderTime <= now             │
│  THEN send email                     │
└──────┬───────────────────────────────┘
       │
       │ 6. SEND email via Brevo API
       │
       ▼
┌──────────────────────────┐
│   Nurse Email Inbox      │
│   Subject: Reminder:     │
│   Medical Appointment... │
└──────────────────────────┘
```

---

## Entity Relationship Diagram

```
┌─────────────┐
│   roles     │
├─────────────┤
│ id (PK)     │
│ name        │◄───────┐
│ description │        │
│ is_active   │        │
└──────┬──────┘        │
       │               │
       │ 1:N           │ 1:N
       │               │
┌──────▼──────┐        │
│   users     │        │
├─────────────┤        │
│ id (PK)     │        │
│ full_name   │        │
│ email       │        │
│ role_id (FK)│────────┘
│ is_active   │
└──────┬──────┘
       │
       │ 1:N (as creator)
       │
┌──────▼──────────────────────────┐
│      appointments               │
├─────────────────────────────────┤
│ id (PK)                         │
│ creator_user_id (FK) ───────────┤
│ attendee_user_id (FK) ────────┐ │
│ title                         │ │
│ description                   │ │
│ start_datetime                │ │
│ end_datetime                  │ │
│ location                      │ │
│ status                        │ │
│ reminder_minutes_before       │ │
│ created_at                    │ │
└──────┬──────────────────────────┘
       │
       │ N:1
       │
┌──────▼──────────────────────────┐
│   child_medical_records         │
├─────────────────────────────────┤
│ id (PK)                         │
│ child_id (FK)                   │
│ note_type                       │
│ next_appointment_date ────────┼─┐
│ medical_condition             │ │
│ diagnosis                     │ │
│ visit_reason                  │ │
│ medical_center_name           │ │
│ hospital_name                 │ │
│ created_at                    │ │
└──────┬──────────────────────────┘
       │
       │ N:1
       │
┌──────▼──────┐
│  children   │
├─────────────┤
│ id (PK)     │
│ first_name  │
│ middle_name │
│ last_name   │
│ gender      │
│ ...         │
└─────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
1:N = One-to-Many relationship
```

---

## Timeline Example

```
Day 1 (March 31, 2026)
│
├─ 10:00 AM: User creates medical record
│  └─ next_appointment_date = April 15, 2026 at 10:00 AM
│
├─ 10:00:01 AM: Trigger fires
│  └─ Creates 3 appointments (one for each nurse)
│     - Nurse Jane: ID=101, start=Apr 15 10:00, reminder=1440
│     - Nurse Bob: ID=102, start=Apr 15 10:00, reminder=1440
│     - Nurse Alice: ID=103, start=Apr 15 10:00, reminder=1440
│
├─ Every minute: Scheduler runs
│  └─ Checks: Is there any appointment where
│     (start_time - 1440 minutes) is between
│     (now - 1 minute) and now?
│  └─ Not yet... (too early)
│
└─ ... time passes ...


Day 14 (April 14, 2026) - 24 HOURS BEFORE APPOINTMENT
│
├─ 09:59:00 AM: Scheduler runs
│  └─ No matches yet
│
├─ 10:00:00 AM: Scheduler runs
│  └─ CHECK: Is (Apr 15 10:00 - 1440 min) between
│            (Apr 14 09:59) and (Apr 14 10:00)?
│  └─ YES! All 3 appointments match!
│  └─ ACTION: Send emails to all 3 nurses
│
├─ 10:00:01 AM: Emails sent
│  ├─ ✅ jane@sokapp.com - "Reminder: Medical Appointment..."
│  ├─ ✅ bob@sokapp.com - "Reminder: Medical Appointment..."
│  └─ ✅ alice@sokapp.com - "Reminder: Medical Appointment..."
│
└─ Nurses receive notifications


Day 15 (April 15, 2026) - APPOINTMENT DAY
│
├─ 10:00 AM: Appointment starts
│  └─ Nurses attend the medical appointment
│
└─ Appointment completed
```

---

## Component Interaction Map

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Child      │  │ Medical    │  │ Calendar   │  │ Email      │ │
│  │ Profile    │  │ Records    │  │ View       │  │ Inbox      │ │
│  │ Component  │  │ Tab        │  │ Component  │  │ Client     │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         │ Navigate      │               │               │
         │──────────────>│               │               │
         │               │               │               │
         │               │ Submit Form   │               │
         │               │ with date     │               │
         │               │──────────────>│               │
         │               │               │               │
         │               │               │ Display       │
         │               │               │<──────────────┤
         │               │               │  Email        │
         │               │               │               │
┌────────┼───────────────┼───────────────┼───────────────┼────────┐
│        │               │               │               │        │
│        │               │               │               │        │
│  ┌─────▼───────────────▼───────────────▼───────────────▼─────┐  │
│  │                    API LAYER (Express)                     │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │  children.routes.js                                 │   │  │
│  │  │  POST /api/children/:id/medical-records             │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              BUSINESS LOGIC LAYER                          │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Child.addMedicalRecord()                          │   │ │
│  │  │  - Validates data                                   │   │ │
│  │  │  - Inserts into database                            │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 DATA ACCESS LAYER                          │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  MySQL INSERT                                       │   │ │
│  │  │  child_medical_records table                        │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  DATABASE TRIGGERS                         │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  after_medical_record_insert                       │   │ │
│  │  │  - Checks next_appointment_date                    │   │ │
│  │  │  - Creates appointments for nurses                 │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               BACKGROUND SERVICES                          │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  appointmentReminder.scheduler.js                  │   │ │
│  │  │  - Runs every minute (cron)                        │   │ │
│  │  │  - Queries due reminders                           │   │ │
│  │  │  - Sends emails via Brevo API                      │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               EXTERNAL SERVICES                            │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Brevo Email API                                    │   │ │
│  │  │  - Sends HTML emails                               │   │ │
│  │  │  - Delivers to nurse inboxes                       │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

These diagrams illustrate the complete flow from user action to email notification, showing how all components work together to deliver the automatic medical appointment feature.
