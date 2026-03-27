# Code Snippets - WiFi IP Attendance System

## 📝 Copy-Paste Ready Code Snippets

This document provides exact code snippets for integrating the WiFi IP-restricted Clock-In/Clock-Out system into your application.

---

## 🔧 Backend Integration

### 1. Add to server.js (Route Mounting)

**Location:** `Backend/server.js` - Near top with other route imports

```javascript
// Attendance routes (WiFi IP-restricted clock-in/clock-out)
const attendanceRoutes = require('./routes/attendance.routes');
app.use('/api/attendance', attendanceRoutes);

// Admin organization routes (IP management)
const adminOrganizationRoutes = require('./routes/adminOrganization.routes');
app.use('/api/admin/organization', adminOrganizationRoutes);
```

---

## 🎨 Frontend - Standard User Dashboard

### 2. Import AttendanceWidget in StandardUser.js

**Location:** `src/StandardUser.js` - Line ~21 (after Child Profile imports)

```javascript
// Attendance Widget
import AttendanceWidget from './components/dashboard/AttendanceWidget';
```

---

### 3. Embed AttendanceWidget in Dashboard

**Location:** `src/StandardUser.js` - Inside StandardDashboard component, after user-profile-header div (around line 415)

**Current structure:**
```jsx
<div className="dashboard-header">
  <div className="user-profile-header">
    {/* ... profile content ... */}
  </div>
</div>
```

**Replace with:**
```jsx
<div className="dashboard-header">
  <div className="user-profile-header">
    {/* ... existing profile content ... */}
  </div>
  
  {/* ATTENDANCE WIDGET - WiFi IP-Restricted Clock In/Out */}
  <AttendanceWidget user={user} employeeData={employeeData} />
</div>
```

**Full context example:**
```jsx
return (
  <div className="dashboard-container">
    <div className="dashboard-header">
      <div className="user-profile-header">
        {employeeData?.profile_image ? (
          <img 
            src={employeeData.profile_image} 
            alt="Profile" 
            className="dashboard-profile-image"
          />
        ) : (
          <div className="dashboard-profile-placeholder">
            <i className='bx bx-user'></i>
          </div>
        )}
        <div className="user-info">
          <h1>Welcome, {employeeData?.full_name || user?.full_name || user?.username || 'User'}</h1>
          <p>Standard User Dashboard</p>
        </div>
      </div>
      
      {/* ATTENDANCE WIDGET - WiFi IP-Restricted Clock In/Out */}
      <AttendanceWidget user={user} employeeData={employeeData} />
    </div>
    
    <div className="dashboard-stats">
      {/* ... existing stats cards ... */}
    </div>
  </div>
);
```

---

## 👨‍💼 Frontend - Admin Panel

### 4. Import ManageOfficeIPs in Admin.js

**Location:** `src/Admin.js` - Top of file with other imports (around line 18)

```javascript
import ManageOfficeIPs from './components/admin/ManageOfficeIPs';
```

---

### 5. Add WiFi IPs to Organization Menu

**Location:** `src/Admin.js` - In getMenuItems() function, find Organization submenu

**Find this:**
```javascript
items.push({ 
  icon: 'bx bx-buildings', 
  text: 'Organization',
  route: '/organization',
  submenu: [
    { text: 'Shamida News', action: 'Organization-News', route: '/shamida-news' },
    { text: 'Resources', action: 'Organization-Resources', route: '/resources' }
  ]
});
```

**Replace with:**
```javascript
items.push({ 
  icon: 'bx bx-buildings', 
  text: 'Organization',
  route: '/organization',
  submenu: [
    { text: 'Shamida News', action: 'Organization-News', route: '/shamida-news' },
    { text: 'Resources', action: 'Organization-Resources', route: '/resources' },
    { text: 'WiFi IPs', action: 'Organization-WiFi-IPs', route: '/organization/wifi-ips' }  // ← NEW
  ]
});
```

---

### 6. Add Route Handler for WiFi IPs

**Location:** `src/Admin.js` - In main return statement, inside `<main>` tag

**Find existing Organization routes:**
```jsx
{/* Organization Menu Items */}
{activeItem === 'Organization-News' && location.pathname.startsWith('/shamida-news') && (
  <Organization user={user} />
)}
{activeItem === 'Organization-Resources' && location.pathname.startsWith('/resources') && (
  <ResourcesPage user={user} />
)}
```

**Add after:**
```jsx
{/* WiFi IP Management */}
{activeItem === 'Organization-WiFi-IPs' && location.pathname.startsWith('/organization/wifi-ips') && (
  <ManageOfficeIPs user={user} />
)}
```

---

## 🗄️ Database Setup

### 7. SQL Migration Script

**Run this in phpMyAdmin or MySQL CLI:**

```sql
-- Create allowed_ips table
CREATE TABLE IF NOT EXISTS allowed_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE COMMENT 'Supports IPv4 and IPv6',
    description VARCHAR(255) COMMENT 'Description of the location (e.g., Main Office WiFi)',
    created_by INT COMMENT 'User ID who added this IP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Employee user ID',
    clock_in TIMESTAMP NULL COMMENT 'Time when employee clocked in',
    clock_out TIMESTAMP NULL COMMENT 'Time when employee clocked out',
    ip_address VARCHAR(45) COMMENT 'IP address used for clock-in/out',
    date DATE NOT NULL COMMENT 'Date of attendance (for easy daily queries)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert first test IP (replace with your actual office IP)
INSERT INTO allowed_ips (ip_address, description, created_by) 
VALUES ('192.168.1.1', 'Main Office WiFi', 1);
```

---

## 🧪 Testing Endpoints

### 8. Test API Calls (Using Browser Console or Postman)

#### Check Today's Status
```javascript
fetch('http://localhost:5000/api/attendance/today/status', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data));
```

#### Clock In
```javascript
fetch('http://localhost:5000/api/attendance/clock-in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data));
```

#### Get Allowed IPs (Admin Only)
```javascript
fetch('http://localhost:5000/api/admin/organization/ips', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data));
```

#### Add New Allowed IP (Admin Only)
```javascript
fetch('http://localhost:5000/api/admin/organization/ips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ip_address: '192.168.1.100',
    description: 'Test Office IP'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🎯 Complete Integration Checklist

Mark each step as complete:

- [ ] Run SQL migration (Step 7)
- [ ] Add backend routes to server.js (Step 1)
- [ ] Restart backend server
- [ ] Import AttendanceWidget in StandardUser.js (Step 2)
- [ ] Embed AttendanceWidget in dashboard (Step 3)
- [ ] Restart frontend server
- [ ] Test clock-in/clock-out as standard user
- [ ] Import ManageOfficeIPs in Admin.js (Step 4)
- [ ] Add WiFi IPs menu item (Step 5)
- [ ] Add route handler (Step 6)
- [ ] Test admin panel IP management

---

## 🔍 Debugging Helpers

### Check if Routes are Mounted
```javascript
// In browser console
fetch('http://localhost:5000/api/attendance/today/status')
  .then(res => console.log('Status:', res.status))
  .catch(err => console.error('Error:', err));
```

Expected: Should return 401 (unauthorized) not 404 (not found)

### Check Component is Rendering
```javascript
// Add to AttendanceWidget.jsx temporarily
useEffect(() => {
  console.log('✅ AttendanceWidget mounted!');
  console.log('User:', user);
  console.log('Employee Data:', employeeData);
}, []);
```

### Verify IP Validation
```javascript
// Add to verifyOfficeIP.middleware.js temporarily
console.log('[DEBUG] Client IP:', clientIP);
console.log('[DEBUG] Authorized IP:', req.authorizedIP);
```

---

## 📋 Quick Reference

### File Locations
```
Backend/
├── middleware/
│   └── verifyOfficeIP.middleware.js          ← NEW
├── routes/
│   ├── attendance.routes.js                  ← NEW
│   └── adminOrganization.routes.js           ← NEW
└── server.js                                 ← MODIFIED

src/
├── components/
│   ├── admin/
│   │   └── ManageOfficeIPs.jsx               ← NEW
│   └── dashboard/
│       └── AttendanceWidget.jsx              ← NEW
└── StandardUser.js                           ← MODIFIED

database/
└── add_attendance_clock_in_system.sql        ← NEW
```

### API Endpoints
```
Employee:
  POST   /api/attendance/clock-in
  PUT    /api/attendance/clock-out/:id
  GET    /api/attendance/my-logs
  GET    /api/attendance/today/status

Admin:
  GET    /api/admin/organization/ips
  POST   /api/admin/organization/ips
  PUT    /api/admin/organization/ips/:id
  DELETE /api/admin/organization/ips/:id
```

### Component Props
```javascript
// AttendanceWidget
<AttendanceWidget 
  user={user}              // Current logged-in user
  employeeData={employeeData}  // Employee record data
/>

// ManageOfficeIPs
<ManageOfficeIPs 
  user={user}              // Admin user object
/>
```

---

## 🚀 Quick Start Commands

### Start Backend
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
npm start
```

### Start Frontend
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
npm start
```

### Run SQL via Command Line
```bash
mysql -u root -P 3307 sokapptest < database\add_attendance_clock_in_system.sql
```

---

## ✅ Verification Tests

### Test 1: Backend Routes Working
```bash
# Should return 401 (unauthorized) not 404
curl http://localhost:5000/api/attendance/today/status
```

### Test 2: Frontend Component Loaded
Open browser console (F12) and check:
- No "Module not found" errors
- AttendanceWidget renders without errors

### Test 3: Database Tables Exist
```sql
SHOW TABLES LIKE 'allowed_ips';
SHOW TABLES LIKE 'attendance_logs';
```

Both should return 1 row.

---

That's all you need! Copy-paste these snippets into your codebase and you're ready to go! 🎉
