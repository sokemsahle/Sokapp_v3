# STEP-BY-STEP FIX FOR 404 ERROR

## ⚠️ CRITICAL: You MUST Restart Backend Server

After making changes to route files, the backend server **MUST** be restarted.

---

## Step 1: Stop Current Backend Server

In the terminal where backend is running:
- Press **Ctrl + C**
- Type `Y` and press Enter if asked

---

## Step 2: Start Backend Server Again

### Option A: Using Script (Easiest)
Double-click this file:
```
RESTART_BACKEND.bat
```

### Option B: Manual Command
Open new Command Prompt and run:
```bash
cd "C:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
npm start
```

---

## Step 3: Verify Backend Started Correctly

You should see these messages:
```
Server running on port 5000...
Database connected successfully
```

✅ If you see this - backend is ready!  
❌ If you see errors - check error message

---

## Step 4: Test Upload Again

1. **Refresh your browser page** (F5 or Ctrl+R)
2. Go to child profile
3. Click "Legal Documents" tab
4. Click "Add Document"
5. Fill form and select a file
6. Click "Add Document"

---

## Expected Result

✅ **Success Message**: "Legal document added successfully"  
✅ **Document appears in table**  
✅ **"View Document" link works**

---

## Still Getting 404?

### Check 1: Is Backend Actually Running?

Open browser and go to:
```
http://localhost:5000/api/children
```

✅ Should return JSON with children list  
❌ If page doesn't load - backend is not running

### Check 2: What Port is Backend On?

Look at backend terminal output. Should say:
```
Server running on port 5000...
```

If it says different port (e.g., 5001), use that port instead.

### Check 3: Frontend API URL

In browser console (F12), type:
```javascript
console.log(process.env.REACT_APP_API_URL)
```

Should print: `"http://localhost:5000"`

If wrong or undefined:
1. Create file `.env` in frontend root
2. Add this line:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```
3. Restart frontend:
   ```bash
   npm start
   ```

---

## Quick Fix Checklist

Run these steps IN ORDER:

- [ ] 1. Stopped backend server (Ctrl+C)
- [ ] 2. Started backend server again (`npm start` in Backend folder)
- [ ] 3. Verified backend shows "Server running on port 5000"
- [ ] 4. Refreshed browser page (F5)
- [ ] 5. Tried upload again

---

## Common Mistakes

❌ **Not restarting backend** after code changes  
✅ **FIX**: Always restart backend after changing route files

❌ **Not refreshing browser** after backend restart  
✅ **FIX**: Always refresh page (F5) after backend restarts

❌ **Wrong working directory** when starting backend  
✅ **FIX**: Make sure you're in `Backend` folder, not root

❌ **Port already in use**  
✅ **FIX**: Kill existing process or change port in `.env`

---

## Emergency Reset

If nothing works, do full reset:

```bash
# Stop all servers
taskkill /F /IM node.exe

# Go to Backend
cd "C:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"

# Reinstall dependencies (if needed)
rmdir /s /q node_modules
npm install

# Start server
npm start
```

---

## Need Help?

When asking for help, provide:

1. **Backend terminal output** (last 20 lines)
2. **Browser console error** (full error message)
3. **Network tab request details** (URL, status code)

---

## Success Indicators

You'll know it's working when:

✅ Backend terminal shows no errors  
✅ Browser console has no red errors  
✅ Upload shows success message  
✅ File appears in `Backend/uploads/` folder  
✅ Can view uploaded file via link

---

**Last Updated**: March 5, 2026  
**Status**: Requires backend restart to work
