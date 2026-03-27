# 📅 Appointment Calendar - Visual Guide

## 🎯 What You'll See

This visual guide shows exactly what the appointment calendar looks like and how to use it.

---

## 📍 Navigation

### Sidebar Menu Structure
```
├── Dashboard
├── Inventory
├── Child Profiles
├── Organization ⬇️ (expanded)
│   ├── Shamida News
│   ├── Resources
│   └── Appointments ← NEW!
└── Settings
```

**What happens:**
1. Click "Organization" in sidebar → Submenu expands
2. Click "Appointments" → Calendar page opens
3. URL changes to: `http://localhost:5000/appointments`

---

## 🖼️ Page Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ Appointments                    [Month View][Day Agenda]    │
│                                 [Today] [+ New Appointment] │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Title**: "Appointments" heading
- **View Toggle**: Switch between Month and Day views
- **Today Button**: Jump to current date
- **New Appointment Button**: Create new appointment

---

## 📆 Month View

### Calendar Grid Layout
```
     March 2026
← [Previous]           [Next] →

Sun  Mon  Tue  Wed  Thu  Fri  Sat
                                     1
 2    3    4    5    6    7    8
 9   10   11   12   13   14   15
16   17  [18]  19   20   21   22   ← Current day highlighted
23   24   25   26   27   28   29
30   31
```

### Day Cell with Appointments
```
┌─────────────────┐
│ 18 ●            │ ← Day number + today indicator
│ ─────────────── │
│ [Team Meeting]  │ ← Appointment badge (blue)
│ [Lunch w/John]  │ ← Second appointment
│ [Project Rev..] │ ← Third appointment (truncated)
│ +2 more         │ ← More appointments indicator
└─────────────────┘
```

**Visual Features:**
- **Blue Background**: Current day (March 18)
- **Blue Dot (●)**: Today indicator
- **Blue Badges**: Appointments (click to edit)
- **Hover Effect**: Cell background changes on hover

### Appointment Badge Colors
- **Scheduled**: 🔵 Blue (#007bff)
- **Completed**: 🟢 Green (#388e3c)
- **Cancelled**: 🔴 Red (#d32f2f)

---

## 📋 Day Agenda View

### Agenda List Layout
```
┌─────────────────────────────────────────────────────────┐
│ ← [Previous Day]   20 March 2026   [Next Day] →        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 10:00     Team Meeting                                  │
│           With: John Doe, Jane Smith                   │
│           Discuss Q1 project milestones                │
│           📍 Conference Room A                         │
│           [Scheduled]                                   │
│                                                         │
│ 14:00     Client Call                                   │
│           With: Mike Johnson                           │
│           Product demo presentation                    │
│           📍 Zoom Link: zoom.us/j/123456789            │
│           [Scheduled]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Empty Day Example:**
```
┌─────────────────────────────────────────────────────────┐
│              No appointments scheduled for this day.    │
│                                                         │
│              [Schedule Appointment]                     │
└─────────────────────────────────────────────────────────┘
```

---

## ➕ Create/Edit Modal

### Create Mode
```
┌──────────────────────────────────────────────────┐
│ New Appointment                              ✕   │
├──────────────────────────────────────────────────┤
│                                                  │
│ Title *                                          │
│ [Enter appointment title                    ]    │
│                                                  │
│ Attendee *                                       │
│ [Select a user                              ▼]   │
│                                                  │
│ Description                                      │
│ [Enter appointment details                  ]    │
│ [                                              ] │
│                                                  │
│ Date (DD/MM/YYYY) *                              │
│ [20/03/2026                                ]     │
│ Selected: 20/03/2026                             │
│                                                  │
│ Start Time *          End Time *                 │
│ [10:00    ]          [11:00    ]                 │
│                                                  │
│ Location (Optional)                              │
│ [e.g., Conference Room A or Zoom link       ]    │
│                                                  │
├──────────────────────────────────────────────────┤
│          [Cancel]          [Create]              │
└──────────────────────────────────────────────────┘
```

### Edit Mode
```
┌──────────────────────────────────────────────────┐
│ Edit Appointment                             ✕   │
├──────────────────────────────────────────────────┤
│                                                  │
│ [Same fields as Create mode, populated]          │
│                                                  │
│ Status                                           │
│ [Scheduled                                  ▼]   │
│   - Scheduled                                    │
│   - Completed                                    │
│   - Cancelled                                    │
│                                                  │
├──────────────────────────────────────────────────┤
│    [Cancel]    [Delete]      [Save Changes]     │
└──────────────────────────────────────────────────┘
```

### Validation Errors
```
Title *
[                                         ] ❌
↑ Required field is required

End Time *
[09:00    ] ❌
↑ End time must be after start time
```

---

## 🎨 Color Scheme

### UI Elements
| Element | Color | Usage |
|---------|-------|-------|
| Primary Blue | #007bff | Buttons, current day, badges |
| Success Green | #28a745 | Save button, completed status |
| Danger Red | #dc3545 | Delete button, cancelled status |
| Secondary Gray | #6c757d | Cancel button |
| Light Gray | #f8f9fa | Calendar header, empty cells |
| Border Gray | #e0e0e0 | Cell borders, dividers |

### Status Indicators
```
Scheduled:  🟦 Blue badge   (default)
Completed:  🟩 Green badge  (appointment finished)
Cancelled:  🟥 Red badge    (appointment cancelled)
```

---

## 📱 Responsive Behavior

### Desktop (>768px)
```
┌─────────────────────────────────────────┐
│ Full calendar grid with 7 columns       │
│ Spacious cells (min-height: 100px)      │
│ Side-by-side time inputs in modal       │
│ Modal width: 600px                      │
└─────────────────────────────────────────┘
```

### Mobile (≤768px)
```
┌──────────────┐
│ Compact grid │
│ Smaller cells│
│ Stacked form │
│ Full-width   │
│ modal        │
└──────────────┘
```

---

## 🖱️ Interactive Elements

### Hover Effects
- **Calendar Cells**: Light gray background on hover
- **Appointment Badges**: Darker blue on hover
- **Buttons**: Color intensifies on hover
- **Navigation Buttons**: Arrow buttons change color

### Click Actions
- **Date Cell**: Opens create modal
- **Appointment Badge**: Opens edit modal
- **View Toggle**: Switches between month/day views
- **Navigation Arrows**: Previous/Next month/day
- **Today Button**: Jumps to current date

---

## 🔄 User Flow Examples

### Creating an Appointment
```
Step 1: Click "+ New Appointment" or click a date
        ↓
Step 2: Fill in form fields
        ↓
Step 3: Click "Create"
        ↓
Step 4: Success message appears
        ↓
Step 5: Calendar refreshes showing new appointment
```

### Editing an Appointment
```
Step 1: Click appointment badge in calendar
        ↓
Step 2: Modal opens with existing data
        ↓
Step 3: Modify fields (time, location, status)
        ↓
Step 4: Click "Save Changes"
        ↓
Step 5: Calendar updates immediately
```

### Deleting an Appointment
```
Step 1: Click appointment badge
        ↓
Step 2: Click "Delete" button
        ↓
Step 3: Confirm in dialog "Are you sure?"
        ↓
Step 4: Appointment removed from calendar
```

---

## 📊 Data Display Patterns

### Date Formats Used
```
Input Fields:     DD/MM/YYYY (display format)
                  HH:mm (24-hour time)

Calendar Display: DD/MM/YYYY
                  e.g., "20/03/2026"

Agenda Display:   DD/MM/YYYY HH:mm
                  e.g., "20/03/2026 10:00"

Helper Text:      "Selected: 20/03/2026"
```

### Appointment Information
```
Title:            "Team Meeting"
Attendee:         "John Doe (john@example.com)"
Time:             "20/03/2026 10:00 - 11:00"
Location:         "Conference Room A"
Description:      "Weekly team sync-up"
Status:           "Scheduled"
```

---

## 🎯 Key Visual Highlights

### Current Day Highlight
```
Regular Day:      White background
Current Day:      Light blue background (#e3f2fd)
                  Blue dot indicator (●)
                  Blue border accent
```

### Appointment Density
```
1-3 appointments: Show all as blue badges
4+ appointments:  Show 3 badges + "+X more" text
```

### Empty States
```
No appointments:  Centered text with icon
                  "Schedule Appointment" button
                  Light gray background
```

---

## 🔍 Accessibility Features

### Keyboard Navigation
- Tab through form fields
- Enter to submit
- Escape to close modal
- Arrow keys for calendar navigation (future enhancement)

### Visual Feedback
- Focus rings on interactive elements
- Clear error messages in red
- Success messages in green
- Loading states during API calls

---

## 📐 Dimensions & Spacing

### Calendar Grid
- **Cell Width**: calc(100% / 7)
- **Cell Height**: min-height: 100px
- **Padding**: 8px
- **Border**: 1px solid #e0e0e0

### Modal
- **Width**: 600px max, 90% on mobile
- **Max Height**: 90vh (scrollable)
- **Padding**: 20px
- **Border Radius**: 8px

### Buttons
- **Primary/Secondary**: padding: 10px 20px
- **Toggle Buttons**: padding: 8px 16px
- **Modal Actions**: padding: 10px 20px

---

This visual guide should help you understand exactly what the appointment calendar looks like and how it behaves!
