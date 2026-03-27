# Quick Start Guide - WiFi IP Attendance System

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration (1 minute)

**Option A: Using phpMyAdmin**
1. Open phpMyAdmin (http://localhost:8080 or your configured URL)
2. Select `sokapptest` database
3. Click "SQL" tab
4. Copy entire content from `database/add_attendance_clock_in_system.sql`
5. Paste and click "Go"
6. ✅ You should see "Query executed successfully"

**Option B: Using Command Line**
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
mysql -u root -P 3307 sokapptest < database\add_attendance_clock_in_system.sql
```

---

### Step 2: Add Your First Allowed IP (1 minute)

**Quick Test Method - Via SQL:**
```sql
-- Find out your current IP first by visiting whatismyip.com
-- Then add it to allowed_ips table
INSERT INTO allowed_ips (ip_address, description, created_by) 
VALUES ('192.168.1.1', 'Test Office WiFi', 1);
```
Replace `192.168.1.1` with your actual office/laptop IP address.

**To find your local IP:**
- Windows: Open CMD → type `ipconfig` → look for IPv4 Address
- Usually looks like: `192.168.x.x` or `10.x.x.x`

---

### Step 3: Restart Backend Server (30 seconds)

**If backend is already running, STOP it first (Ctrl+C), then:**

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
npm start
```

Or simply run:
```bash
start-backend.bat
```

✅ You should see: "Server running on port 5000"

---

### Step 4: Test Employee Dashboard (2 minutes)

1. **Open browser** → http://localhost:3000
   - If frontend not running, open new terminal:
   ```bash
   cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
   npm start
   ```

2. **Log in** as a standard user (not admin)

3. **Look for Attendance Widget** on dashboard
   - Should appear below your profile header
   - Shows live clock updating every second
   - Has "Clock In" button (green)

4. **Test Clock-In:**
   - Click "Clock In" button
   - ✅ **Success:** Green message "Successfully clocked in!"
   - ❌ **Error:** Red message "Must be on company WiFi"
     - This means your IP is NOT in allowed_ips table
     - Go back to Step 2 and add your correct IP

5. **Test Clock-Out:**
   - Button changes to "Clock Out" (red)
   - Shows elapsed time (e.g., "0h 5m 23s")
   - Click "Clock Out"
   - ✅ Success message appears

---

## 🎯 What Should You See?

### ✅ Working Correctly:
- Live clock ticking every second ✓
- Date displayed correctly ✓
- "Clock In" button visible ✓
- Can clock in successfully ✓
- Shows work duration timer ✓
- Can clock out successfully ✓

### ❌ Not Working:
- Widget doesn't appear → Check StandardUser.js has import
- 404 error on clock-in → Backend not running or routes not mounted
- Always shows "Must be on company WiFi" → IP not in allowed_ips table
- Widget shows errors → Check browser console (F12)

---

## 🔧 Troubleshooting Common Issues

### Issue: "Table 'allowed_ips' doesn't exist"
**Fix:** You didn't run the SQL migration. Go to Step 1.

### Issue: "Cannot connect to server"
**Fix:** Backend not running. Start it with `npm start` in Backend folder.

### Issue: Widget not appearing
**Fix:** 
1. Check if you're logged in as standard user (not admin)
2. Refresh page (Ctrl+R)
3. Check browser console for errors (F12)

### Issue: Always says "Must be on company WiFi"
**Fix:** Your IP is not authorized. Either:
1. Add your current IP to allowed_ips via SQL
2. OR connect to your office WiFi network
3. OR temporarily disable IP check for testing (see below)

---

## 🧪 Testing Mode (Disable IP Check Temporarily)

For development/testing, you can bypass IP validation:

**Edit:** `Backend/middleware/verifyOfficeIP.middleware.js`

**Find this line:**
```javascript
if (rows.length === 0) {
    return res.status(403).json({
        success: false,
        message: 'Must be on company WiFi to perform this action',
        error: 'IP_NOT_AUTHORIZED'
    });
}
```

**Temporarily replace with:**
```javascript
// TESTING MODE - Allow all IPs (REMOVE THIS IN PRODUCTION)
console.log('[TESTING] Allowing IP:', clientIP);
req.authorizedIP = { ip_address: clientIP, description: 'Testing Mode' };
```

⚠️ **WARNING:** This disables security! Only use for local testing!

---

## 📊 Verify Database Entries

Check that attendance is being recorded:

```sql
-- View all attendance logs
SELECT al.*, u.full_name 
FROM attendance_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;

-- View today's logs only
SELECT al.*, u.full_name 
FROM attendance_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.date = CURDATE()
ORDER BY al.clock_in DESC;

-- View all allowed IPs
SELECT * FROM allowed_ips;
```

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Widget appears on standard user dashboard
2. ✅ Live clock updates every second
3. ✅ Can clock in without "company WiFi" error
4. ✅ Work duration timer counts up
5. ✅ Can clock out successfully
6. ✅ Attendance logs saved to database

---

## ➕ Next: Add Admin Panel Integration

Once basic testing works, add ManageOfficeIPs to admin sidebar:

**Edit:** `src/Admin.js`

**Add import at top:**
```javascript
import ManageOfficeIPs from './components/admin/ManageOfficeIPs';
```

**Add to Organization submenu items:**
```javascript
{ text: 'WiFi IPs', action: 'Organization-WiFi-IPs', route: '/organization/wifi-ips' }
```

**Add route handler** (before closing main tag):
```jsx
{activeItem === 'Organization-WiFi-IPs' && location.pathname.startsWith('/organization/wifi-ips') && (
  <ManageOfficeIPs user={user} />
)}
```

Now admins can manage IPs through the UI instead of SQL!

---

## 📞 Need Help?

Check the full documentation:
- `WIFI_IP_ATTENDANCE_SYSTEM_SUMMARY.md` - Complete implementation details
- `database/add_attendance_clock_in_system.sql` - Table structure
- Browser console (F12) - For frontend errors
- Backend terminal - For API errors

---

**That's it! Your WiFi IP-restricted attendance system is ready to use! 🎊**
