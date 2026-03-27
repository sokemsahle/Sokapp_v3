# 🚀 Quick Start Guide - Frontend on Port 3000

## ⚡ Fastest Way to Get Started

### Step 1: Start Backend API (Terminal 1)
```bash
start-backend.bat
```
✅ Wait for: "Server running on port 5000"

### Step 2: Start Frontend (Terminal 2) - CHOOSE ONE METHOD

**Method A: Use the Batch File (Recommended)**
```bash
start-frontend-3000.bat
```

**Method B: Use npm directly**
```bash
npm start
```
or
```bash
npm run start:3000
```

✅ Wait for: "Compiled successfully!" and browser opens to `http://localhost:3000`

### Step 3: Verify
- Browser should open to: `http://localhost:3000`
- Login and test the application

---

## 📋 What Changed?

| Before | After |
|--------|-------|
| ❌ Confusing proxy setup | ✅ Clear port separation |
| ❌ Conditional API URLs | ✅ Always uses localhost:5000 for API |
| ❌ Manual port configuration | ✅ Automated with batch files |

---

## 🎯 Port Assignment

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `http://localhost:3000` | React development server |
| **Backend API** | `http://localhost:5000` | REST API endpoints |

---

## 🔧 Common Commands

### Start Both Services (Development)
```bash
# Terminal 1
start-backend.bat

# Terminal 2
start-frontend.bat
```

### Stop Services
Press `Ctrl+C` in each terminal

### Restart Frontend Only
```bash
# Option 1: Batch file (recommended)
start-frontend-3000.bat

# Option 2: npm command
npm start
```

### Check What's Running on Ports
```bash
# Windows PowerShell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

---

## ✅ Success Indicators

### Backend Started Successfully
```
✓ Server running on port 5000
✓ Database connected
✓ CORS enabled
```

### Frontend Started Successfully
```
✓ Compiled successfully!
✓ Ready in Xms
✓ http://localhost:3000
```

### Browser Console (F12)
Should see:
```
[API_CONFIG] BASE_URL: http://localhost:5000
```

---

## 🐛 Quick Fixes

### Port 3000 Already in Use
```bash
# Kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Then restart
start-frontend.bat
```

### API Calls Failing
1. Check backend is running on port 5000
2. Check browser console for `[API_CONFIG]` message
3. Verify `.env` has correct URLs

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Restart (choose one method)
start-frontend-3000.bat
# OR
npm start
```

---

## 📖 Full Documentation

For detailed information, see:
- `FRONTEND_PORT_3000_CONFIG.md` - Complete configuration guide
- `.env` - Environment variables
- `src/config/api.js` - API endpoint configuration

---

**Need Help?** Check the troubleshooting section in `FRONTEND_PORT_3000_CONFIG.md`
