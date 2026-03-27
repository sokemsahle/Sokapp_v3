# Fixed: Duplicate localhost:3000 Configuration Issue

## Problem Identified

There were **two different services trying to use the same port (3000)**:

1. **Frontend (React)** - Runs on `http://localhost:3000` by default
2. **Backend API** - Was configured to run on `http://localhost:3000` but should use `http://localhost:5000`

## Root Cause

In `.env` file, line 10 had:
```env
PORT=3000  ❌ WRONG - This is for the backend API server
```

This conflicted with:
- React's default port (3000)
- Proxy configuration in `package.json`: `"proxy": "http://localhost:5000"`
- API URLs in `.env`: `REACT_APP_API_URL=http://localhost:5000`

## Solution Applied

Changed `.env` file to:
```env
// Server configuration for Backend API
PORT=5000  ✅ CORRECT
NODE_ENV=development
```

## Correct Port Configuration

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend (React)** | 3000 | http://localhost:3000 | User interface |
| **Backend API** | 5000 | http://localhost:5000 | API endpoints |

## How It Works

### Development Mode:
1. Start backend: `node Backend/server.js` → Runs on **port 5000**
2. Start frontend: `npm start` → Runs on **port 3000**
3. Frontend proxies API requests to backend automatically via `package.json` proxy setting

### Production Mode:
- Both frontend and backend are unified
- Backend serves static React files from `/build` folder
- Only one server runs on **port 5000**

## Files Updated

✅ `.env` - Changed PORT from 3000 to 5000

## Verification Steps

1. Check backend starts on port 5000:
   ```bash
   node Backend/server.js
   # Should show: Server running on port 5000
   ```

2. Check frontend starts on port 3000:
   ```bash
   npm start
   # Should open browser to http://localhost:3000
   ```

3. Test API connection:
   - Open browser: http://localhost:3000
   - Login should work without CORS errors
   - Check browser console for any connection issues

## Related Configuration Files

### `package.json` (Line 6)
```json
"proxy": "http://localhost:5000"
```

### `src/config/api.js` (Lines 8-15)
```javascript
BASE_URL: process.env.NODE_ENV === 'development' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:5000')
```

### `.env` (Lines 23-24)
```env
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
```

### `Backend/server.js` (Line 11)
```javascript
const PORT = process.env.PORT || 5000;
```

## Common Issues If Not Fixed

❌ **Port conflict errors** when starting both servers
❌ **CORS errors** in browser console
❌ **API connection failures** (cannot connect to backend)
❌ **Blank pages** on refresh
❌ **Login not working** despite correct credentials

## Next Steps

1. **Restart both servers** to apply the fix:
   ```bash
   # Stop any running servers first
   
   # Start backend
   node Backend/server.js
   
   # In another terminal, start frontend
   npm start
   ```

2. **Test the application**:
   - Navigate to http://localhost:3000
   - Try logging in
   - Check that all features work (child profiles, employees, requisitions, etc.)

3. **Verify no port conflicts**:
   - Backend should log: "Server running on port 5000"
   - Frontend should open on port 3000
   - No "EADDRINUSE" errors

---

**Status**: ✅ FIXED - Backend now correctly uses port 5000, Frontend uses port 3000
