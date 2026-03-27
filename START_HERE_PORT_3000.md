# 🚀 START HERE - Frontend Port 3000 Quick Setup

## ⚡ QUICK START (3 Simple Steps)

### Step 1: Start Backend (Terminal 1)
```bash
start-backend.bat
```
Wait for: `✓ Server running on port 5000`

---

### Step 2: Start Frontend (Terminal 2) - **USE THIS NEW FILE!**
```bash
start-frontend-3000.bat
```
Wait for: `✓ Compiled successfully!` + browser opens to `http://localhost:3000`

---

### Step 3: Verify It Works
✅ Browser shows: `http://localhost:3000`  
✅ Press F12 → Console shows: `[API_CONFIG] BASE_URL: http://localhost:5000`  
✅ Login works

---

## 📋 Alternative Methods

If the batch file doesn't work, try these:

**Option 1: npm command**
```bash
npm start
```

**Option 2: Explicit port**
```bash
npm run start:3000
```

---

## ❗ Common Issues

### Problem: Still starts on port 5000
**Solution:** Use `start-frontend-3000.bat` (not the old `start-frontend.bat`)

### Problem: Port 3000 already in use
**Solution:** 
```bash
netstat -ano | findstr :3000
taskkill /PID <NUMBER> /F
```

### Problem: Can't login or API errors
**Solution:** Make sure backend is running on port 5000 first!

---

## 📚 Need More Help?

1. **Detailed Guide:** Read `QUICK_START_FRONTEND_3000.md`
2. **Troubleshooting:** Read `TROUBLESHOOTING_PORT_3000.md`
3. **Complete Info:** Read `PORT_3000_SOLUTION_SUMMARY.md`

---

## ✅ What Changed?

- ✅ `package.json` now forces port 3000
- ✅ Created `.env.development` with PORT=3000
- ✅ New `start-frontend-3000.bat` script (use this!)
- ✅ Frontend ALWAYS uses port 3000 now

---

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:5000  
**Status:** ✅ Strictly Enforced
