# 🎨 Visual Guide - Unified Notification Center

## 📍 What You'll See Now

### Navbar (Before vs After)

**BEFORE:**
```
┌─────────────────────────────────────────────────────┐
│ ☰  Program: [All Programs ▼]   ⚙️  🔔(3)  👤      │
│                              ↑   ↑                  │
│                    Two icons: Gear + Bell          │
└─────────────────────────────────────────────────────┘
```

**AFTER:**
```
┌─────────────────────────────────────────────────────┐
│ ☰  Program: [All Programs ▼]      🔔(3)  👤        │
│                                 ↑                   │
│                    Single bell icon only           │
└─────────────────────────────────────────────────────┘
```

---

## 🔔 Click the Bell Icon

### What Opens: Unified Notification Center

```
╔═══════════════════════════════════════════════════════╗
║  Notifications                                🔔 ⚙️ ✕ ║
║                                             ↑  ↑  ↑   ║
║                                    Tabs:     │  │  │   ║
║                                    Notif   Set Cls    ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Default View: Notifications Tab Active              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🔄 Two Tabs in the Header

### Tab 1: Notifications (🔔) - DEFAULT VIEW

Shows requisition notifications:

```
┌───────────────────────────────────────────────────┐
│ 🔔 Active (Purple background)                     │
├───────────────────────────────────────────────────┤
│                                                   │
│ ⏰ Pending Your Action                            │
│ ┌─────────────────────────────────────────────┐  │
│ │ #123  John Doe                              │  │
│ │ Finance • Office supplies for Q4            │  │
│ │ [Pending Approval] Oct 16, 2024 2:30 PM    │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ✓ Approved Requisitions                          │
│ ┌─────────────────────────────────────────────┐  │
│ │ #120  Jane Smith                            │  │
│ │ HR • Training materials                     │  │
│ │ [✓ Approved] 1,500 Birr Oct 15, 2024       │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Tab 2: Settings (⚙️) - CLICK TO SWITCH

Shows notification preferences:

```
┌───────────────────────────────────────────────────┐
│ ⚙️ Active (Purple background)                     │
├───────────────────────────────────────────────────┤
│                                                   │
│ ❤️  Child Welfare Alerts                 [ON]   │
│     Medical alerts, dietary requirements,        │
│     incident reports                             │
│                                                   │
│ ⏰  Task & Shift Reminders                [OFF]  │
│     Daily chores, shift handovers, staff         │
│     meetings                                     │
│                                                   │
│ 🔔  General System Announcements          [ON]   │
│     Facility updates, policy changes,            │
│     emergency drills                             │
│                                                   │
│ ─────────────────────────────────────────────    │
│ ℹ️  Changes are saved automatically              │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 🎯 User Flow

### Scenario 1: Check Notifications

```
Step 1: See bell icon with badge (3)
        ↓
Step 2: Click bell
        ↓
Step 3: See 3 pending requisition notifications
        ↓
Step 4: Click any notification to view details
```

### Scenario 2: Adjust Settings

```
Step 1: Click bell icon
        ↓
Step 2: Click gear tab (⚙️) in header
        ↓
Step 3: Toggle any notification category
        ↓
Step 4: See success message
        ↓
Step 5: Close modal or switch back to notifications tab
```

### Scenario 3: No Notifications

```
When no pending notifications:

┌───────────────────────────────────────────────────┐
│ ✓ No pending notifications                        │
│                                                   │
│ All requisitions are up to date                  │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ ⚙️ Manage Notification Preferences          │  │
│ └─────────────────────────────────────────────┘  │
│              ↑                                   │
│         Click this button to open settings      │
└───────────────────────────────────────────────────┘
```

---

## 🎨 Design Details

### Color Scheme

**Active Tab:**
- Background: `#474fa8` (Primary purple)
- Icon: `#ffffff` (White)

**Inactive Tab:**
- Background: Transparent
- Icon: `#aaaaaa` (Grey)
- Hover: Light purple background

**Badge (Notification Count):**
- Background: `#ff4b5c` (Red)
- Text: White
- Position: Top-right of bell icon

### Animations

**Tab Switch:**
- Smooth color transition (0.2s)
- Background fade
- Icon color change

**Modal Open:**
- Overlay: Fade-in (0.2s)
- Panel: Slide from right

**Toggle Switch:**
- Slider movement: 0.3s
- Color change: Instant

---

## 📱 Responsive Design

### Desktop (>768px)
```
┌─────────────────────────────────┐
│ 🔔 ⚙️ ✕                        │
│                                 │
│ [Notifications panel - 450px]  │
│                                 │
└─────────────────────────────────┘
```

### Mobile (≤768px)
```
┌───────────────────┐
│ 🔔 ⚙️ ✕          │
│                   │
│ [Full width -    │
│  95% screen]      │
│                   │
└───────────────────┘
```

---

## 🧩 Component Structure

```
NotificationCenter (Parent)
├── Header
│   ├── Title: "Notifications"
│   └── Actions
│       ├── Tab Button: 🔔 (Notifications)
│       ├── Tab Button: ⚙️ (Settings)
│       └── Close Button: ✕
│
├── Content Area
│   │
│   ├── IF Tab = 'notifications'
│   │   ├── Loading State
│   │   ├── Error State
│   │   ├── No Notifications State
│   │   └── Notification List
│   │       ├── Pending Section
│   │       └── Approved Section
│   │
│   └── IF Tab = 'settings'
│       └── NotificationSettings Component
│           ├── Welfare Alerts Toggle
│           ├── Task Reminders Toggle
│           └── System Announcements Toggle
```

---

## 💡 Key Improvements

### 1. Reduced Clutter
- **Before:** 2 icons in navbar
- **After:** 1 icon in navbar

### 2. Better Organization
- **Before:** Notifications and settings separate
- **After:** Both accessible from same place

### 3. Clearer Context
- **Before:** Gear icon purpose unclear
- **After:** Bell clearly indicates notifications + settings

### 4. Improved UX
- **Before:** Multiple clicks to find settings
- **After:** One click to bell, one click to settings tab

---

## 🎪 Interaction States

### Hover Effects

**Bell Icon:**
```css
color: var(--primary);
transform: scale(1.1);
```

**Tab Buttons:**
```css
background-color: var(--light);
color: var(--primary);
```

**Active Tab:**
```css
background-color: var(--primary);
color: var(--white);
```

### Focus States

**Keyboard Navigation:**
- Tab buttons get focus ring
- Visible outline for accessibility
- Tab key switches between tabs

---

## 📊 Data Flow

```
User clicks bell (🔔)
    ↓
NotificationCenter opens
    ↓
Default: Notifications tab active
    ↓
Fetches requisition data from API
    ↓
Displays pending + approved requisitions
    ↓
User clicks settings tab (⚙️)
    ↓
Switches to NotificationSettings component
    ↓
Fetches user preferences from API
    ↓
Displays three toggle switches
    ↓
User toggles setting
    ↓
Optimistic UI update (instant)
    ↓
Syncs with backend
    ↓
Success message appears
```

---

## ✅ Visual Indicators

### Success States
```
✓ Green banner at top
  "Notification settings updated successfully!"
  Auto-hides after 3 seconds
```

### Error States
```
✗ Red banner at top
  "Failed to save settings. Please try again."
  Manual dismiss required
  Rollback to previous state
```

### Loading States
```
⟳ Spinner icon
  "Loading notifications..."
  Centered in panel
```

### Empty States
```
✓ Check circle icon
  "No pending notifications"
  "All requisitions are up to date"
  [Manage Notification Preferences] button
```

---

This visual guide shows exactly how the unified notification center works!
