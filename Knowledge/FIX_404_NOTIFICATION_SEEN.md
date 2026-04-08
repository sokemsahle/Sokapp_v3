# 🔧 Fix: 404 Error on /api/notifications/:id/seen

## Problem
```
POST http://localhost:5000/api/notifications/90/seen 404 (Not Found)
```

This means the backend route exists in code but **the server isn't using it**.

---

## ✅ Solution (3 Steps)

### Step 1: Verify Route Exists in server.js

Open `Backend/server.js` and check line 59. You should see:

```javascript
// Notification seen tracking route (mark notifications as seen)
app.post('/api/notifications/:id/seen', async (req, res) => {
    const { authMiddleware } = require('./middleware/auth.middleware');
    
    // Wrap in middleware to get user ID
    authMiddleware(req, res, async () => {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const { id: requisitionId } = req.params;
            const userId = req.user.id;
            
            // Insert or update the seen status
            await connection.execute(
                `INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
                 VALUES (?, ?, TRUE, NOW())
                 ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW()`,
                [userId, requisitionId]
            );
            
            res.json({
                success: true,
                message: 'Notification marked as seen'
            });
        } catch (error) {
            console.error('Error marking notification as seen:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as seen',
                error: error.message
            });
        } finally {
            await connection.end();
        }
    });
});
```

✅ **If you see this code** → Route exists, proceed to Step 2  
❌ **If you DON'T see this code** → Route is missing! Copy/paste the code above into server.js at line 59

---

### Step 2: Restart Backend Server

The route won't work until you restart the backend!

**In your terminal:**

```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd "Backend"
npm start
```

You should see:
```
Server running on port 5000
Connected to MySQL database
```

---

### Step 3: Test Again

1. **Refresh your frontend** (F5 or Ctrl+R)
2. **Open DevTools Console** (F12)
3. **Click bell icon**
4. **Click a notification**
5. **Check console** - Should now see:
   ```
   Notification clicked: 90
   Token found: true
   API Response status: 200
   API Response: {success: true, message: "Notification marked as seen"}
   ✓ Notification marked as seen in database
   ✓ Removed from UI successfully
   ```

---

## 🐛 Still Getting 404?

### Possibility 1: Wrong Port

Check if backend is actually running on port 5000:

```bash
# In terminal, check what's running on port 5000
netstat -ano | findstr :5000
```

Should show:
```
TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    [PID]
```

If nothing shows → Backend not running!

---

### Possibility 2: Route Defined After Catch-All

Check if there's a wildcard route catching all requests. Look for:

```javascript
app.get('*', ...)
app.get('/api/*', ...)
```

If these exist BEFORE the `/api/notifications/:id/seen` route, they'll intercept it!

**Fix:** Move the notification route to the TOP of server.js, before any wildcards.

---

### Possibility 3: Middleware Interference

Check if any middleware is blocking POST requests. Look for:

```javascript
app.use((req, res, next) => {
  // Something that might block POST
})
```

---

## 🧪 Manual Test with cURL

If still having issues, test manually:

```bash
# Get your token from browser console first:
# localStorage.getItem('token')

# Then run in terminal:
curl -X POST http://localhost:5000/api/notifications/90/seen ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Notification marked as seen"
}
```

---

## 📊 Expected Flow After Fix

```
Frontend: Click notification #90
    ↓
Console: "Notification clicked: 90"
    ↓
API Call: POST /api/notifications/90/seen
    ↓
Backend: Receives request, extracts user_id from token
    ↓
Database: INSERT INTO user_notification_seen (user_id=1, requisition_id=90, is_seen=TRUE)
    ↓
Backend: Returns {success: true}
    ↓
Frontend: Receives success
    ↓
Console: "✓ Notification marked as seen in database"
    ↓
Frontend: Removes #90 from arrays
    ↓
Console: "✓ Removed from UI successfully"
    ↓
UI: Notification disappears ✨
```

---

## ⚠️ About the Foreign Key Error

You also saw this SQL error:
```
#1452 - Cannot add or update a child row: a foreign key constraint fails
```

This means:
- Requisition ID #123 doesn't exist in your database
- Or you're trying to mark a non-existent requisition as seen

**Fix:** Use an actual requisition ID from your database:

```sql
-- Get real requisition IDs
SELECT id, requestor_name FROM requisitions ORDER BY created_at DESC LIMIT 5;

-- Then use one of those IDs (e.g., 90)
INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
VALUES (1, 90, TRUE, NOW());
```

---

## ✅ Success Checklist

After following steps above, verify:

- [ ] Backend server restarted (`npm start`)
- [ ] Frontend refreshed (F5)
- [ ] Console shows "API Response status: 200"
- [ ] Console shows "✓ Notification marked as seen"
- [ ] Notification disappears from list
- [ ] Badge count decreases
- [ ] Database has record: `SELECT * FROM user_notification_seen WHERE requisition_id = 90`

---

## 🎯 Quick Restart Commands

**Windows PowerShell:**
```powershell
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
npm start
```

**Or use the batch file:**
```powershell
.\RESTART_BACKEND.bat
```

---

**Most Likely Issue:** Backend server wasn't restarted after adding the route!

**Solution:** Stop backend (Ctrl+C), then `npm start` again.

Let me know if restarting fixes it! 🚀
