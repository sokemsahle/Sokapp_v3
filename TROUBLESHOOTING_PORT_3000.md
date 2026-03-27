# 🔧 Frontend Port 3000 - Troubleshooting Guide

## Issue: Frontend Starts on Port 5000 Instead of 3000

### ✅ Solution 1: Use the Dedicated Batch File (RECOMMENDED)
```bash
start-frontend-3000.bat
```
This script explicitly forces port 3000 with multiple safeguards.

### ✅ Solution 2: Use npm with Explicit Port
```bash
npm start --port 3000
```
or
```bash
npm run start:3000
```

### ✅ Solution 3: Check .env.development File
Make sure `.env.development` exists and contains:
```env
PORT=3000
REACT_APP_API_URL=http://localhost:5000
```

---

## Issue: Port 3000 Already in Use

### Step 1: Find What's Using Port 3000
```bash
netstat -ano | findstr :3000
```

You'll see output like:
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTEN    12345
```

### Step 2: Kill the Process
```bash
taskkill /PID 12345 /F
```
(Replace `12345` with the actual PID number from the output)

### Step 3: Restart Frontend
```bash
start-frontend-3000.bat
```

---

## Issue: Wrong API URL Being Used

### Check Browser Console
1. Open browser (F12)
2. Go to Console tab
3. Look for: `[API_CONFIG] BASE_URL: http://localhost:5000`

If you see something different, check these files:

### Verify `.env` File (Root Directory)
```env
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Verify `src/config/api.js`
Should have:
```javascript
BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
```

---

## Issue: React Scripts Ignores PORT Variable

### Windows-Specific Fix
The `set PORT=3000` command in batch files sometimes doesn't work reliably. Try these alternatives:

**Method 1: Inline Environment Variable**
```bash
set PORT=3000 && npm start
```

**Method 2: Use npm Script**
```bash
npm run start:3000
```

**Method 3: Create .env.development**
Create a file named `.env.development` in the root folder:
```env
PORT=3000
```

React Scripts automatically reads this file!

---

## Issue: CORS Errors When Making API Calls

### Cause
Frontend on port 3000 trying to call backend on port 5000.

### Solution
Ensure backend has CORS enabled. Check `Backend/server.js`:
```javascript
app.use(cors());
```

Should be present and uncommented.

---

## Issue: Build Errors After Port Change

### Clean Rebuild
```bash
# Remove old build artifacts
rmdir /s /q build
rmdir /s /q node_modules

# Reinstall dependencies
npm install

# Start fresh
start-frontend-3000.bat
```

---

## Verification Checklist

After starting the frontend, verify these points:

### ✅ Port Check
- [ ] Browser URL shows: `http://localhost:3000` (NOT 5000!)
- [ ] Terminal shows: "Compiled successfully!" 
- [ ] No errors about port conflicts

### ✅ API Configuration Check
- [ ] Open browser console (F12)
- [ ] See log: `[API_CONFIG] BASE_URL: http://localhost:5000`
- [ ] Network tab shows API calls going to `http://localhost:5000/api/...`

### ✅ Backend Connection Check
- [ ] Backend is running on port 5000
- [ ] Can access: `http://localhost:5000/api/login` (should return JSON, not 404)
- [ ] Login functionality works

---

## Quick Reference: Starting Services

### Correct Way (Choose ONE Method)

**For Frontend (Port 3000):**
```bash
# Method 1: Batch file (BEST)
start-frontend-3000.bat

# Method 2: npm script
npm start

# Method 3: Explicit port
npm run start:3000
```

**For Backend (Port 5000):**
```bash
start-backend.bat
```

---

## Common Mistakes to Avoid

❌ **Mistake**: Running `npm start` without setting PORT first
✅ **Fix**: Use `start-frontend-3000.bat` instead

❌ **Mistake**: Using old `start-frontend.bat` script
✅ **Fix**: Use `start-frontend-3000.bat` (new version with port enforcement)

❌ **Mistake**: Not having `.env.development` file
✅ **Fix**: Create it with `PORT=3000`

❌ **Mistake**: Running both frontend and unified server
✅ **Fix**: Only run ONE backend (either unified OR separate backend) + frontend

---

## Still Having Issues?

### Nuclear Option: Complete Reset
```bash
# 1. Stop all Node processes
taskkill /F /IM node.exe

# 2. Clean everything
rmdir /s /q node_modules
rmdir /s /q build
del package-lock.json

# 3. Reinstall
npm install

# 4. Start services
start-backend.bat     # Terminal 1
start-frontend-3000.bat  # Terminal 2
```

### Check These Files
1. `.env` - Should have correct URLs
2. `.env.development` - Should have `PORT=3000`
3. `package.json` - Should have `start:3000` script
4. `src/config/api.js` - Should use localhost:5000

### Verify No Conflicting Services
```bash
# Check port 3000
netstat -ano | findstr :3000

# Check port 5000
netstat -ano | findstr :5000
```

Only backend should be on 5000, only frontend on 3000!

---

## Success Indicators

When everything is working correctly, you should see:

**Terminal 1 (Backend):**
```
✓ Server running on port 5000
✓ Database connected
```

**Terminal 2 (Frontend):**
```
✓ Compiled successfully!
✓ Ready in XXXms
✓ http://localhost:3000
```

**Browser:**
- Opens automatically to `http://localhost:3000`
- Application loads without errors
- Login works
- Console shows correct API URL

---

**Last Updated:** March 12, 2026
**Target:** Frontend on localhost:3000 | Backend on localhost:5000
