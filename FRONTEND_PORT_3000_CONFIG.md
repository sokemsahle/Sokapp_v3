# Frontend Port Configuration - localhost:3000

## ✅ Configuration Complete

The frontend is now **strictly configured to run on http://localhost:3000**.

---

## 🏗️ Architecture

### Separated Services (Development Mode)
- **Frontend (React)**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

This separation allows for:
- Independent development and debugging
- Hot reload for React components
- Clear separation of concerns
- Easier troubleshooting

---

## 🚀 How to Start the Application

### Option 1: Start Both Services (Recommended for Development)

**Step 1 - Start Backend API:**
```bash
# Run in one terminal
start-backend.bat
```

**Step 2 - Start Frontend:**
```bash
# Run in another terminal
start-frontend.bat
```

### Option 2: Use Individual Scripts

**Start ONLY Frontend (port 3000):**
```bash
start-frontend.bat
```

**Start ONLY Backend (port 5000):**
```bash
start-backend.bat
```

### Option 3: Manual Startup

**Frontend:**
```bash
set PORT=3000
npm start
```

**Backend:**
```bash
cd Backend
npm start
```

---

## 📝 Changes Made

### 1. **package.json**
- ❌ Removed `"proxy": "http://localhost:3000"` (incorrect configuration)
- ✅ Frontend now runs independently on port 3000

### 2. **src/config/api.js**
- ❌ Removed conditional logic based on `NODE_ENV`
- ✅ Always uses `http://localhost:5000` for API calls
- ✅ Simplified configuration for clarity

### 3. **.env File**
- ✅ Updated comment to reflect separated architecture
- ✅ `REACT_APP_API_URL=http://localhost:5000` (backend API)
- ✅ `FRONTEND_URL=http://localhost:3000` (frontend dev server)

### 4. **New Startup Scripts**
- ✅ `start-frontend.bat` - Starts React dev server on port 3000
- ✅ `start-backend.bat` - Starts backend API on port 5000

---

## 🔧 Environment Variables

### Frontend (.env in root)
```env
# API Configuration (Frontend on 3000, Backend API on 5000)
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Backend (Backend/.env)
```env
PORT=5000
# ... other backend configurations
```

---

## 🌐 API Configuration

All API calls from the frontend will automatically go to `http://localhost:5000`:

```javascript
// Example from src/config/api.js
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000', // Always this URL
  ENDPOINTS: {
    LOGIN: '/api/login',
    EMPLOYEES: '/api/employees',
    // ... more endpoints
  }
};
```

When you make an API call:
```javascript
axios.get(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.EMPLOYEES))
// Results in: http://localhost:5000/api/employees
```

---

## ✅ Verification Steps

### 1. Start Both Services
```bash
# Terminal 1
start-backend.bat

# Terminal 2
start-frontend.bat
```

### 2. Check Frontend
- Open browser: `http://localhost:3000`
- Should see the SOKAPP application
- Press F12 → Network tab
- Login or perform any action

### 3. Verify API Calls
- In Network tab, filter by "XHR"
- All API requests should show:
  - Request URL: `http://localhost:5000/api/...`
  - NOT relative URLs like `/api/...`

### 4. Check Console Logs
- Open browser console (F12)
- Should see: `[API_CONFIG] BASE_URL: http://localhost:5000`
- This confirms the correct API URL is being used

---

## 🐛 Troubleshooting

### Issue: API calls going to wrong port
**Solution:** Check browser console for `[API_CONFIG] BASE_URL` log message

### Issue: CORS errors
**Solution:** Ensure backend has CORS enabled (already configured in server.js)

### Issue: Frontend not starting on port 3000
**Solution:** 
```bash
# Explicitly set the port
set PORT=3000
npm start
```

### Issue: Build errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 Production Deployment

For production, use the unified server approach:

```bash
# Build the React app
npm run build

# Start the unified server (serves both frontend and API)
cd Backend
npm start
```

In production:
- Everything runs on port 5000
- React static files served from `/build` folder
- API endpoints at `/api/*`

---

## 🎯 Key Benefits

✅ **Clear Port Assignment**
- Frontend: 3000 (development)
- Backend: 5000 (API)

✅ **Independent Development**
- Can develop frontend without backend running
- Hot reload works properly

✅ **Easy Debugging**
- Separate terminals for each service
- Clear error messages

✅ **Flexible Workflow**
- Start only what you need
- Restart services independently

---

## 📞 Need Help?

If you encounter issues:
1. Check both terminals for error messages
2. Verify both ports (3000 and 5000) are not in use by other apps
3. Ensure `.env` files are correctly configured
4. Review the troubleshooting section above

---

**Last Updated:** March 12, 2026
**Configuration:** Frontend on localhost:3000 | Backend on localhost:5000
