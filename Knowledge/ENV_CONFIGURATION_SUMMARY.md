# Environment Configuration Summary

## What Was Changed

This document summarizes all the changes made to enable environment-based configuration for VPS deployment.

---

## Files Created

### 1. **`src/config/api.js`** - API Configuration Module
A centralized configuration module that manages all API endpoints and base URLs.

**Purpose:** 
- Centralizes API URL management
- Reads from environment variables
- Provides helper methods for building URLs
- Makes it easy to switch between development and production

**Usage:**
```javascript
import API_CONFIG from './config/api';

// Get full URL for an endpoint
const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.EMPLOYEES);
// Result: http://localhost:5000/api/employees (dev) or https://api.yourdomain.com/api/employees (prod)

// Get employee-specific URLs
const empUrl = API_CONFIG.getEmployeeUrl(employeeId, '/documents');
// Result: http://localhost:5000/api/employees/123/documents
```

### 2. **`.env.example`** - Environment Template
Template file with all required environment variables documented.

**Purpose:**
- Serves as a reference for required variables
- Provides examples for different deployment scenarios
- Safe to commit to Git (no sensitive data)
- Used as starting point for creating `.env` files

### 3. **`DEPLOYMENT.md`** - Complete Deployment Guide
Step-by-step guide for deploying to a VPS.

**Contents:**
- Environment configuration instructions
- Backend setup with PM2
- Frontend build and deployment
- Database setup
- Nginx configuration
- Docker setup (optional)
- Troubleshooting guide
- Production checklist

### 4. **`VPS_CONFIG_EXAMPLES.md`** - Configuration Scenarios
Ready-to-use configuration examples for different deployment scenarios.

**Scenarios covered:**
- Single VPS with domain (recommended)
- Single VPS with IP address only
- Separate servers (advanced)
- Local network testing
- Current development setup

---

## Files Modified

### 1. **`.env`** (Root Directory)
**Added:**
```env
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
```

These variables define the backend API URL used by the React frontend.

### 2. **`src/App.js`**
**Changes:**
- Added import: `import API_CONFIG from './config/api';`
- Updated login API call from hardcoded URL to use `API_CONFIG.getUrl()`

**Before:**
```javascript
const response = await fetch('http://localhost:5000/api/login', { ... });
```

**After:**
```javascript
const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGIN), { ... });
```

### 3. **`src/components/usercontrole.js`**
**Changes:**
- Added import: `import API_CONFIG from '../config/api';`
- Updated all API calls (users, roles, permissions) to use `API_CONFIG`

**Updated functions:**
- `fetchUsers()`
- `fetchRoles()`
- `fetchPermissions()`
- `handleCreateUser()`
- `handleEditUser()`
- `handleDeleteUser()`
- `toggleUserStatus()`
- `handleCreateRole()`
- `handleEditRole()`
- `handleDeleteRole()`

### 4. **`src/components/EmployeeForm/EmployeeManagement.js`**
**Changes:**
- Added import: `import API_CONFIG from '../../config/api';`
- Updated all employee-related API calls

**Updated functions:**
- `fetchEmployees()`
- `fetchEmployeeDocumentsFunc()`
- `handleCreateEmployee()`
- `handleEditEmployee()`
- `uploadEmployeeDocuments()`
- `fetchEmployeeDocuments()`
- `handleDeleteEmployee()`

### 5. **`src/components/Settings.js`**
**Changes:**
- Added import: `import API_CONFIG from '../config/api';`
- Updated news/notices and password change API calls

**Updated functions:**
- `fetchNewsNotices()`
- `postNews()`
- `postNotice()`
- `handleChangePassword()`

### 6. **`src/components/ResetPassword.js`**
**Changes:**
- Added import: `import API_CONFIG from '../config/api';`
- Updated password reset API call

**Updated function:**
- `handleSubmit()`

### 7. **`src/components/AcceptInvitation.js`**
**Changes:**
- Added import: `import API_CONFIG from '../config/api';`
- Updated invitation acceptance API call

**Updated function:**
- `handleSubmit()`

---

## How It Works

### Development (Current Setup)
```
Frontend (localhost:3000)
    ↓
REACT_APP_API_URL=http://localhost:5000
    ↓
Backend (localhost:5000)
    ↓
Database (localhost:3307)
```

### Production (VPS Setup)
```
Frontend (yourdomain.com or server IP)
    ↓
REACT_APP_API_URL=https://api.yourdomain.com
    ↓
Backend (localhost:5000 or api.yourdomain.com)
    ↓
Database (localhost:3306 or db-host.com)
```

---

## Benefits

### ✅ Before Changes
- Hardcoded `http://localhost:5000` in 25+ places
- Manual search-and-replace required for deployment
- Easy to miss instances
- Error-prone process
- Different configs for dev/prod required code changes

### ✅ After Changes
- Single source of truth in `.env` file
- Change one variable to switch environments
- No code changes needed for deployment
- Consistent API URL usage across entire app
- Easy to maintain and update
- Safe to commit code (sensitive data in .env which is gitignored)

---

## Migration Path

### To Deploy on VPS:

1. **Copy your VPS IP/domain to .env:**
   ```env
   REACT_APP_API_URL=http://YOUR_VPS_IP:5000
   # OR for domain:
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

2. **Update Backend .env:**
   ```env
   ALLOWED_ORIGINS=http://YOUR_VPS_IP:3000
   # OR for domain:
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Build frontend:**
   ```bash
   npm run build
   ```

4. **Deploy build folder to VPS**

5. **Start backend on VPS:**
   ```bash
   pm2 start server.js --name sokapp-backend
   ```

That's it! The app will now use the production URLs automatically.

---

## Testing Locally

The app still works exactly as before in development mode because:
- Default values fallback to `http://localhost:5000`
- Your current `.env` already has this configured
- No changes to development workflow

---

## Next Steps

1. **Review** the created files:
   - Read `DEPLOYMENT.md` for complete deployment guide
   - Check `VPS_CONFIG_EXAMPLES.md` for your specific scenario

2. **Prepare** for deployment:
   - Get your VPS IP address or domain name
   - Decide on deployment scenario (single server vs separate servers)
   - Set up database on VPS

3. **When ready to deploy:**
   - Update `.env` files with production values
   - Run `npm run build`
   - Deploy to VPS following the guide

---

## Files That Still Need Updates (Optional)

If you have additional components with hardcoded URLs, update them similarly:

**Pattern to follow:**
```javascript
// 1. Import API_CONFIG
import API_CONFIG from '../config/api'; // Adjust path as needed

// 2. Replace hardcoded URLs
// Before:
fetch('http://localhost:5000/api/something')

// After:
fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SOMETHING))
```

Check these files if they make API calls:
- Any other component files not yet updated
- Utility/helper files
- Service files

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify `.env` values are correct
3. Ensure backend is running on specified port
4. Review CORS settings in backend `.env`
5. Rebuild frontend after changing `.env`
6. Check `DEPLOYMENT.md` troubleshooting section
