# 🎨 Visual Guide - Notification Settings Feature

## 📍 Where to Find It

### Navbar Layout (Top Bar)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ☰   Program: [All Programs ▼]    ⚙️     🔔     👤                │
│                             ↑       ↑      ↑                        │
│                    Click this gear icon here                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Icon Legend:
☰ = Menu toggle
⚙️ = Notification Settings (NEW!)
🔔 = Requisition notifications
👤 = Profile dropdown
```

---

## 🖼️ Modal Interface

### Full Modal View

```
╔═══════════════════════════════════════════════════════════════╗
║ ⚙️ Notification Settings                              ✕      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   ┌─────────────────────────────────────────────────────┐   ║
║   │                                                     │   ║
║   │  ❤️                                                  │   ║
║   │                                                     │   ║
║   │  Child Welfare Alerts                               │   ║
║   │  Medical alerts, dietary requirements, incidents   ║
║   │                                              [✓]   │   ║
║   │                                                     │   ║
║   └─────────────────────────────────────────────────────┘   ║
║                                                               ║
║   ┌─────────────────────────────────────────────────────┐   ║
║   │                                                     │   ║
║   │  ⏰                                                  │   ║
║   │                                                     │   ║
║   │  Task & Shift Reminders                             │   ║
║   │  Daily chores, shift handovers, staff meetings     ║
║   │                                              [ ]   │   ║
║   │                                                     │   ║
║   └─────────────────────────────────────────────────────┘   ║
║                                                               ║
║   ┌─────────────────────────────────────────────────────┐   ║
║   │                                                     │   ║
║   │  🔔                                                  │   ║
║   │                                                     │   ║
║   │  General System Announcements                       │   ║
║   │  Facility updates, policy changes, emergency drills║
║   │                                              [✓]   │   ║
║   │                                                     │   ║
║   └─────────────────────────────────────────────────────┘   ║
║                                                               ║
║   ───────────────────────────────────────────────────────     ║
║                                                               ║
║   ℹ️  Changes are saved automatically and synced with server ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Toggle States:
[✓] = Enabled (Primary color background)
[ ] = Disabled (Grey background)
```

---

## 🎯 Interaction Flow

### Step-by-Step User Journey

```
STEP 1: User clicks gear icon
        ↓
STEP 2: Modal fades in with smooth animation
        ↓
STEP 3: Settings load from database (shows spinner briefly)
        ↓
STEP 4: User sees current preferences
        ↓
STEP 5: User clicks a toggle
        ↓
STEP 6: UI updates INSTANTLY (optimistic update)
        ↓
STEP 7: Background sync with database
        ↓
STEP 8: Success message appears for 3 seconds
        ↓
STEP 9: User can close modal or toggle more settings
```

---

## 🎨 Color Scheme

### Toggle Switch Colors

**Enabled State:**
```
Background: #474fa8 (Primary purple)
Circle: #ffffff (White)
```

**Disabled State:**
```
Background: #acacac (Grey)
Circle: #ffffff (White)
```

**Hover Effect:**
```
Transform: scale(1.1)
Color: #474fa8 (Primary purple)
```

**Focus Ring:**
```
Box-shadow: 0 0 0 3px rgba(71, 79, 168, 0.3)
```

---

## 📱 Responsive Breakpoints

### Desktop View (>768px)

```
┌─────────────────────────────────────────────┐
│ Modal Width: 600px max                      │
│                                             │
│ Icon | Label + Description | Toggle        │
│      |                     |                │
│ 48px | Flex layout        | 56px width     │
└─────────────────────────────────────────────┘
```

### Mobile View (≤768px)

```
┌─────────────────────┐
│ Modal Width: 95%    │
│                     │
│ Icon | Label        │
│      | Description  │
│             Toggle  │
│                     │
│ Stacked vertically  │
└─────────────────────┘
```

---

## 🔄 State Management Diagram

```
Component Mounts
       ↓
useEffect triggers
       ↓
fetchSettings() called
       ↓
GET /api/notification-settings
       ↓
Backend validates JWT token
       ↓
Returns user preferences
       ↓
setState(settings)
       ↓
UI renders toggles
       ↓
User clicks toggle
       ↓
handleToggle('welfare_alerts')
       ↓
OPTIMISTIC UPDATE:
setSettings(prev => !prev.welfare_alerts)
       ↓
UI updates instantly
       ↓
PATCH /api/notification-settings
       ↓
Backend updates database
       ↓
Success response
       ↓
Confirm with server data
       ↓
Show success message (3s)
       ↓
Auto-hide message

On Error:
       ↓
Catch error
       ↓
Rollback: setSettings(previousValue)
       ↓
Show error message
```

---

## 🎭 Animation Details

### Modal Entrance

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

Overlay: fadeIn (0.2s ease-in-out)
Modal: slideUp (0.3s ease-out)
```

### Toggle Animation

```css
Transition: 0.3s ease
Slider movement: translateX(28px)
Scale on hover: 1.1x
```

---

## 📊 Data Structure

### Database Schema

```sql
notification_settings
├── id (INT, PRIMARY KEY, AUTO_INCREMENT)
├── user_id (INT, UNIQUE, FOREIGN KEY → users.id)
├── welfare_alerts (BOOLEAN, DEFAULT TRUE)
├── task_reminders (BOOLEAN, DEFAULT TRUE)
├── system_announcements (BOOLEAN, DEFAULT TRUE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "welfare_alerts": true,
    "task_reminders": false,
    "system_announcements": true
  },
  "message": "Settings updated successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to update notification settings",
  "error": "Detailed error message"
}
```

---

## 🔐 Security Flow

```
User Action
    ↓
Frontend adds Bearer token
    ↓
Backend receives request
    ↓
authMiddleware extracts token
    ↓
JWT.verify() validates token
    ↓
Extracts user ID from payload
    ↓
req.user.id = decoded.id
    ↓
Database query uses req.user.id
    ↓
Only authenticated user's data accessed
```

---

## 🎪 Component Hierarchy

```
App.js
├── AdminLayout.js
│   ├── Nav.js
│   │   └── Notification Settings Icon (⚙️)
│   └── NotificationSettings.js (Modal)
│
└── StandardUserLayout.js
    ├── Nav.js
    │   └── Notification Settings Icon (⚙️)
    └── NotificationSettings.js (Modal)
```

---

## 🧩 Integration Points

### Frontend Files Modified

```
src/
├── components/
│   ├── Nav.js ← Added icon + state
│   └── NotificationSettings.js ← NEW COMPONENT
├── layouts/
│   ├── AdminLayout.js ← Added import + render
│   └── StandardUserLayout.js ← Added import + render
└── index.css ← Added styles
```

### Backend Files Modified

```
Backend/
├── routes/
│   └── notificationSettings.routes.js ← NEW ROUTES
└── server.js ← Added route registration
```

### Database Objects Created

```
Database:
├── notification_settings (TABLE)
└── after_user_insert (TRIGGER)
```

---

## 🎯 Testing Scenarios

### Manual Testing Checklist

```
□ Click gear icon → Modal opens
□ Check loading state → Spinner appears
□ Verify initial state → Toggles reflect database
□ Toggle welfare_alerts ON → Updates instantly
□ Toggle task_reminders OFF → Updates instantly
□ Toggle system_announcements ON → Updates instantly
□ See success message → Appears for 3 seconds
□ Refresh page → Settings persist
□ Close modal → Click outside or X button
□ Test mobile view → Responsive layout
□ Test without login → Should reject (401)
□ Test slow network → Rollback on error
```

---

## 🌟 Success Indicators

### Visual Feedback

✅ **Loading State:**
```
⟳ Spinning icon
"Loading your notification preferences..."
```

✅ **Success State:**
```
✓ Green banner
"Notification settings updated successfully!"
Auto-hides after 3 seconds
```

✅ **Error State:**
```
✗ Red banner
"Failed to save settings. Please try again."
Manual dismiss required
Rollback to previous state
```

---

## 🎪 User Experience Highlights

1. **Zero Loading Perception**: Optimistic UI makes it feel instant
2. **Forgiving**: Errors don't lose user input
3. **Clear Feedback**: Success/error states obvious
4. **Persistent**: Works across sessions
5. **Accessible**: Keyboard navigation supported
6. **Responsive**: Works on all screen sizes
7. **Secure**: Authentication required
8. **Polished**: Smooth animations throughout

---

This visual guide shows every aspect of the Notification Settings feature from multiple perspectives!
