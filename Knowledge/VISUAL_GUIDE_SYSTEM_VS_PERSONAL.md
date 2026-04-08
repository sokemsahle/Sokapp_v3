# 📅 System Calendar vs My Appointments - Visual Guide

## 🎯 Quick Comparison

| Feature | System Calendar | My Appointments |
|---------|----------------|-----------------|
| **Purpose** | See ALL organization appointments | See YOUR personal appointments |
| **Location** | Organization → System Calendar | Organization → My Appointments |
| **Shows** | Everyone's appointments | Currently all, later just yours |
| **Best For** | Managers, oversight, coordination | Individual schedule management |
| **Header** | "System Calendar - All Appointments" | "Appointments" |

---

## 🖼️ Sidebar Navigation

```
┌─────────────────────────────────┐
│ Organization ⬇️ (expanded)      │
├─────────────────────────────────┤
│ • Shamida News                  │
│ • Resources                     │
│ • System Calendar ← NEW!        │  ← Click for shared calendar
│ • My Appointments ← Renamed     │  ← Click for personal calendar
└─────────────────────────────────┘
```

---

## 📆 System Calendar View

### Month View Header:
```
┌─────────────────────────────────────────────────────────┐
│ System Calendar - All Appointments                      │
│                              [Month][Day] [Today] [+]   │
└─────────────────────────────────────────────────────────┘
```

### Day Cell Shows:
```
┌──────────────────┐
│ 20 ●             │
│ ──────────────── │
│ [Team Meeting]   │ ← Any user's appointment
│ [Client Call]    │ ← Visible to everyone
│ [Project Rev..]  │
└──────────────────┘
```

### Agenda View Details:
```
┌─────────────────────────────────────────────────────────┐
│ 20/03/2026 - System Calendar                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 10:00    Team Meeting                                   │
│          Created by: John Doe (john@sokapp.com)         │  ← Shows creator
│          With: Jane Smith (jane@sokapp.com)             │  ← Shows attendee
│          Discuss Q1 milestones                          │
│          📍 Conference Room A                           │
│          [Scheduled]                                    │
│                                                         │
│ 14:00    Budget Review                                  │
│          Created by: Sarah Johnson (sarah@sokapp.com)   │
│          With: Mike Brown (mike@sokapp.com)             │
│          Q1 budget planning                             │
│          📍 Virtual - Zoom                              │
│          [Scheduled]                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 My Appointments View

### Month View Header:
```
┌─────────────────────────────────────────────────────────┐
│ Appointments                                            │
│                              [Month][Day] [Today] [+]   │
└─────────────────────────────────────────────────────────┘
```

### Day Cell Shows:
```
┌──────────────────┐
│ 20 ●             │
│ ──────────────── │
│ [My Meeting]     │ ← Your appointments (when auth added)
│ [Lunch w/Bob]    │ ← Appointments involving you
└──────────────────┘
```

### Agenda View Details:
```
┌─────────────────────────────────────────────────────────┐
│ 20/03/2026                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 10:00    My Team Meeting                                │
│          With: Jane Smith (jane@sokapp.com)             │
│          Our weekly sync                                │
│          📍 Office                                      │
│          [Scheduled]                                    │
│                                                         │
│ 15:00    Client Presentation                            │
│          With: Bob Wilson (bob@sokapp.com)              │
│          Product demo                                   │
│          📍 Client Site                                 │
│          [Scheduled]                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Side-by-Side Comparison

### Same Appointment Shown Differently:

#### System Calendar Shows:
```
Meeting: "Project Alpha Kickoff"
Created by: John Doe (john@sokapp.com)
With: Jane Smith (jane@sokapp.com)
Date: 20/03/2026 09:00 - 10:00
Location: Conference Room B
```

#### My Appointments Shows (when auth added):
```
If you're John Doe (creator):
Meeting: "Project Alpha Kickoff"
With: Jane Smith (jane@sokapp.com)
Date: 20/03/2026 09:00 - 10:00
Location: Conference Room B

If you're Jane Smith (attendee):
Meeting: "Project Alpha Kickoff"
With: John Doe (john@sokapp.com)
Date: 20/03/2026 09:00 - 10:00
Location: Conference Room B

If you're neither:
(Not visible in My Appointments)
```

---

## 🎨 Color Coding & Visual Indicators

### Appointment Badges (Month View):
```
🔵 Blue Badge  = Scheduled appointment
🟢 Green Badge = Completed appointment
🔴 Red Badge   = Cancelled appointment
```

### Current Day Indicator:
```
Regular Day:     White background
Current Day:     Light blue background + blue dot (●)
```

### Status Badges (Day View):
```
[Scheduled]  = Light blue background, blue text
[Completed]  = Light green background, green text
[Cancelled]  = Light red background, red text
```

---

## 📊 Data Flow Diagram

### Creating an Appointment:

```
User Creates Appointment
        ↓
Saved to Database with:
- creator_user_id (currently = 1)
- attendee_user_id (selected user)
- title, description, etc.
        ↓
═══════════════════════════
        ↓
System Calendar Shows:      ✅ Appears immediately
- ALL appointments
- Creator name & email
- Attendee name & email
        ↓
My Appointments Shows:      ⚠️ Currently shows all
- Will filter when auth added
- Only your created appointments
- Only appointments where you're attendee
```

---

## 🔍 Tooltip Information

### System Calendar - Appointment Badge Hover:
```
Mouse over appointment badge shows:

"Project Review - John Doe with Jane Smith"
```

### My Appointments - Appointment Badge Hover:
```
Mouse over appointment badge shows:

"Project Review - 10:00-11:00"
```

---

## 🎯 Use Case Scenarios

### Scenario 1: Manager Oversight
**User:** Department Manager  
**Goal:** See all team meetings across organization  
**Solution:** Use **System Calendar**
- Navigate to Organization → System Calendar
- See all meetings scheduled by all team members
- Identify potential conflicts
- Check resource usage (meeting rooms)

### Scenario 2: Personal Schedule
**User:** Regular Employee  
**Goal:** See my daily appointments  
**Solution:** Use **My Appointments**
- Navigate to Organization → My Appointments
- See only meetings involving me
- Create new personal appointments
- Edit my own appointments

### Scenario 3: Cross-Team Coordination
**User:** Project Coordinator  
**Goal:** Schedule meeting between teams  
**Solution:** Use **System Calendar**
- Check System Calendar for availability
- See existing meetings across teams
- Find common time slots
- Create new cross-team appointment

### Scenario 4: Resource Planning
**User:** Office Administrator  
**Goal:** Manage meeting room bookings  
**Solution:** Use **System Calendar**
- View all meetings with locations
- Identify room conflicts
- Track room utilization
- Plan future allocations

---

## 📱 Mobile Responsive Behavior

### Desktop (>768px):
```
System Calendar
┌─────────────────────────────────────┐
│ Full month grid                     │
│ Detailed agenda with all info       │
│ Side-by-side time inputs            │
│ Wide modal (600px)                  │
└─────────────────────────────────────┘
```

### Mobile (≤768px):
```
System Calendar
┌──────────────┐
│ Compact grid │
│ Stacked info │
│ Full-width   │
│ modal        │
└──────────────┘
```

Both calendars adapt responsively!

---

## 🚀 Quick Access Tips

### Keyboard Shortcuts (Future Enhancement):
- `Ctrl+Shift+S` - Open System Calendar
- `Ctrl+Shift+M` - Open My Appointments
- `T` - Jump to Today
- `M` - Switch to Month view
- `D` - Switch to Day view

### URL Direct Access:
- System Calendar: `http://localhost:5000/system-calendar`
- My Appointments: `http://localhost:5000/appointments`

---

## 💡 Pro Tips

1. **Use System Calendar for:**
   - Organization-wide visibility
   - Finding available time slots
   - Seeing who's meeting with whom
   - Avoiding scheduling conflicts

2. **Use My Appointments for:**
   - Daily personal schedule
   - Quick view of your commitments
   - Creating your own meetings
   - Managing your appointments

3. **Best Practice:**
   - Check System Calendar before scheduling
   - Use descriptive titles
   - Always add location (physical or virtual)
   - Update status when meetings complete

---

## 📊 Current vs Future State

### Current State (No Authentication):
```
System Calendar:    Shows ALL appointments ✅
My Appointments:    Shows ALL appointments ⚠️
Creator:            Always user ID 1 ⚠️
Editing:            Anyone can edit any ⚠️
```

### Future State (With Authentication):
```
System Calendar:    Shows ALL appointments ✅
My Appointments:    Shows YOUR appointments ✅
Creator:            Logged-in user ✅
Editing:            Only your own ✅
```

---

This guide helps you understand the difference between the two calendar views and when to use each one!
