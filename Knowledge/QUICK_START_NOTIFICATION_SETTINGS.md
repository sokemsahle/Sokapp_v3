# 🚀 Quick Start Guide - Notification Settings

## ⚡ 3-Minute Setup

### Step 1: Database Setup (1 minute)

1. Open **phpMyAdmin** in your browser
2. Select your database (usually `sokapptest`)
3. Click on the **SQL** tab
4. Copy and paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    welfare_alerts BOOLEAN DEFAULT TRUE,
    task_reminders BOOLEAN DEFAULT TRUE,
    system_announcements BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_user_insert 
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
    VALUES (NEW.id, TRUE, TRUE, TRUE)
    ON DUPLICATE KEY UPDATE
        welfare_alerts = VALUES(welfare_alerts),
        task_reminders = VALUES(task_reminders),
        system_announcements = VALUES(system_announcements);
END$$
DELIMITER ;

INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
SELECT id, TRUE, TRUE, TRUE 
FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_settings)
ON DUPLICATE KEY UPDATE
    welfare_alerts = VALUES(welfare_alerts),
    task_reminders = VALUES(task_reminders),
    system_announcements = VALUES(system_announcements);
```

5. Click **Go** to execute
6. ✅ You should see "Query executed successfully"

---

### Step 2: Restart Backend (30 seconds)

Open a new terminal and run:

```bash
cd "Backend"
npm start
```

Or if already running, press `Ctrl+C` then restart.

---

### Step 3: Test the Feature (1.5 minutes)

#### Option A: Automated Test (Recommended)

```bash
cd "Backend"
node test-notification-settings.js
```

You should see:
```
✓ Login successful! Token received.
✓ GET successful!
✓ PATCH successful!
✓ PUT successful!
✓ Correctly rejected unauthorized request (401)
```

#### Option B: Manual Testing

1. **Open your app**: `http://localhost:3000`
2. **Login** with your credentials
3. **Look for the gear icon** (⚙️) in the navbar
   - Located between the admin switch and notification bell 🔔
4. **Click the gear icon** - Modal opens
5. **Toggle any setting** - Should update instantly
6. **See success message** - "Notification settings updated successfully!"
7. **Refresh the page** - Settings persist!

---

## 🎯 What You Can Do Now

### Toggle Three Notification Categories:

1. **❤️ Child Welfare Alerts**
   - Medical alerts
   - Dietary requirements
   - Incident reports

2. **⏰ Task & Shift Reminders**
   - Daily chores assigned
   - Shift handovers
   - Staff meetings

3. **🔔 General System Announcements**
   - Facility updates
   - Policy changes
   - Emergency drills

---

## ✨ Features

- ✅ **Instant Feedback**: Toggles respond immediately (optimistic UI)
- ✅ **Auto-Save**: Changes sync with database automatically
- ✅ **Error Recovery**: Rolls back if save fails
- ✅ **Persistent**: Settings survive page refreshes
- ✅ **Works Offline**: UI updates even without network
- ✅ **Mobile Friendly**: Responsive design
- ✅ **Secure**: JWT authentication required

---

## 🐛 Troubleshooting

### Issue: Gear icon not visible
**Solution:** Hard refresh the browser (`Ctrl+F5` or `Cmd+Shift+R`)

### Issue: Modal doesn't open
**Solution:** Check browser console for errors, ensure backend is running

### Issue: "Failed to save settings"
**Solution:** 
1. Verify backend is running on port 5000
2. Check if database table exists
3. Ensure you're logged in

### Issue: Settings don't persist
**Solution:**
1. Run the migration SQL script again
2. Check if trigger is working
3. Verify JWT token is valid

---

## 📊 Verify Database

Run this SQL query to see all user settings:

```sql
SELECT 
    ns.user_id,
    u.email,
    u.full_name,
    ns.welfare_alerts,
    ns.task_reminders,
    ns.system_announcements,
    ns.updated_at
FROM notification_settings ns
JOIN users u ON ns.user_id = u.id;
```

---

## 🎨 UI Preview

```
Navbar Layout:
┌─────────────────────────────────────────────────────┐
│ ☰  [Program Dropdown]    ⚙️  🔔(3)  👤 Profile     │
│                              ↑                      │
│                    Click this gear!                 │
└─────────────────────────────────────────────────────┘

Modal View:
┌───────────────────────────────────────────┐
│ ⚙️ Notification Settings            ✕    │
├───────────────────────────────────────────┤
│                                           │
│ ❤️  Child Welfare Alerts           [ON]  │
│     Medical alerts, incidents             │
│                                           │
│ ⏰  Task & Shift Reminders         [OFF] │
│     Daily chores, meetings                │
│                                           │
│ 🔔  System Announcements           [ON]  │
│     Updates, policy changes               │
│                                           │
│ ℹ️ Changes saved automatically            │
└───────────────────────────────────────────┘
```

---

## 📝 API Endpoints

For developers who want to integrate:

```javascript
// Get settings
GET /api/notification-settings
Headers: { Authorization: 'Bearer TOKEN' }

// Update single setting
PATCH /api/notification-settings
Body: { welfare_alerts: false }

// Update all settings
PUT /api/notification-settings
Body: { 
  welfare_alerts: true,
  task_reminders: false,
  system_announcements: true 
}
```

---

## ✅ Success Indicators

You know it's working when:

- ✅ Gear icon visible in navbar
- ✅ Modal opens smoothly
- ✅ Toggles click instantly
- ✅ Success message appears
- ✅ Settings persist after refresh
- ✅ Works for both admin and standard users

---

## 🎉 That's It!

You now have a fully functional notification settings system with:
- Professional UI/UX
- Optimistic updates
- Error handling
- Mobile responsive design
- Secure authentication

**Total Setup Time:** ~3 minutes  
**Files Created:** 8 files  
**Code Quality:** Production-ready  

---

Need more details? See: `NOTIFICATION_SETTINGS_IMPLEMENTATION.md`
