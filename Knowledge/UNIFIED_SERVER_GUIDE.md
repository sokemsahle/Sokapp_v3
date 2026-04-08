# Unified Server Architecture Guide

## Problem Solved ✅
Previously, the application had **two separate servers**:
- Frontend (React) on `http://localhost:3000`
- Backend (API) on `http://localhost:5000`

This created complexity with CORS, proxy configurations, and managing two running processes.

## Solution: Single Server Architecture

Now the application runs on **ONE server only**:
- **Backend + Frontend unified** on `http://localhost:5000`

### How It Works

The backend server (`Backend/server.js`) is configured to:
1. Serve all API endpoints at `/api/*`
2. Serve static React build files from `/build` directory
3. Handle React SPA routing with catch-all handler

---

## Quick Start Guide

### Step 1: Build the React App
```bash
npm run build
```
This creates optimized static files in the `build/` directory.

### Step 2: Start the Backend Server
```bash
cd Backend
npm start
```

### Step 3: Access the Application
Open your browser and go to:
```
http://localhost:5000
```

**That's it!** The React app and API are now both served from the same origin.

---

## Configuration Changes

### Updated `.env` Files

**Root `.env`:**
```env
// API Configuration (now unified - same origin)
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000

// Other configurations
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
```

**Backend `.env`:**
```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
```

---

## Benefits

✅ **Simplified Architecture**
- Only one server to manage
- No need to run multiple processes
- Cleaner deployment

✅ **No CORS Issues**
- Frontend and backend share the same origin
- No cross-origin requests
- No CORS middleware configuration needed

✅ **Easier Development**
- One URL to access everything: `http://localhost:5000`
- No proxy configuration in package.json
- Simpler debugging

✅ **Better for Production**
- Reduced infrastructure complexity
- Lower resource consumption (one Node.js process)
- Simplified hosting requirements

---

## File Structure

```
SOKAPP project/
├── Backend/
│   ├── server.js          # Main server (API + Static file serving)
│   ├── .env               # Backend configuration
│   └── uploads/           # User uploaded files
├── build/                  # React build output (static files)
│   ├── index.html
│   ├── static/
│   └── ...
├── src/                    # React source code
└── package.json            # Frontend dependencies
```

---

## How Routing Works

### API Routes
All API requests go to:
```
http://localhost:5000/api/*
Examples:
- http://localhost:5000/api/employees
- http://localhost:5000/api/children
- http://localhost:5000/api/requisitions
```

### Frontend Routes
All other routes serve the React app:
```
http://localhost:5000/              → Dashboard
http://localhost:5000/admin         → Admin panel
http://localhost:5000/children      → Child profiles list
http://localhost:5000/inventory     → Inventory management
```

The backend serves `index.html` for all non-API routes, and React Router handles client-side routing.

---

## Development Workflow

### For Development Changes:

**Frontend changes:**
1. Edit files in `src/`
2. Run `npm run build` to rebuild
3. Refresh browser to see changes

**Backend changes:**
1. Edit files in `Backend/`
2. Restart the backend server
3. Refresh browser

### Note on Hot Reload
Since we're using static builds, you'll need to:
- Rebuild after frontend changes (`npm run build`)
- This is different from Create React App's hot reload, but ensures production-ready builds

---

## Testing the Setup

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   cd Backend
   npm start
   ```

3. **Verify it's working:**
   - Open `http://localhost:5000` → Should show login/dashboard
   - Open `http://localhost:5000/api/employees` → Should return JSON data
   - Both work from the same server!

---

## Troubleshooting

### Issue: "Cannot GET /" or blank page
**Solution:** Make sure you ran `npm run build` before starting the server

### Issue: API calls failing
**Solution:** Check that your API calls use the correct base URL:
```javascript
// In your services, use:
const API_BASE = 'http://localhost:5000';
// Or rely on the proxy/relative URLs
```

### Issue: Old files being served
**Solution:** Clear browser cache or do a hard refresh (Ctrl+Shift+R)

---

## Migration Notes

### What Changed:
- ❌ No more running `npm start` from root (React dev server)
- ✅ Only run backend server after building
- ✅ Updated ALLOWED_ORIGINS to port 5000

### What Stayed the Same:
- ✅ All API endpoints work identically
- ✅ React components unchanged
- ✅ Database connections unchanged
- ✅ Authentication flow unchanged

---

## Summary

You now have a **unified, simpler architecture** where:
- **One server** handles everything (port 5000)
- **One URL** for users to access (`http://localhost:5000`)
- **No complexity** from dual-server setup

This is the standard way to deploy React + Express applications in production!
