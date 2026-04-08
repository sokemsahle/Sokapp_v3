# Deployment URL Configuration Guide

## Summary of Changes

All hard-coded API/host URLs in the frontend runtime code have been externalized to use environment variables through the centralized `API_CONFIG` system.

## What Was Changed

### 1. Centralized API Configuration
**File:** `src/config/api.js`
- ✅ Added production safety check: throws error if `REACT_APP_API_URL` is not set in production
- ✅ Maintains localhost fallback for development only
- ✅ All API calls should use `API_CONFIG.getUrl(endpoint)` or `API_CONFIG.BASE_URL`

### 2. Frontend Components Fixed

#### Requisition Module
- ✅ `src/components/Requisition/Requisition.js` - 8 API calls updated
- ✅ `src/components/Requisition/ViewRequisitionPage.js` - 1 API call updated
- ✅ `src/components/Requisition/RequisitionList.jsx` - 2 API calls updated
- ✅ `src/components/Requisition/RequisitionNotifications.jsx` - 2 API calls updated

#### Layout Files
- ✅ `src/layouts/AdminLayout.js` - 3 API calls updated
- ✅ `src/layouts/StandardUserLayout.js` - 5 API calls updated (including FormAccessWrapper)

#### Employee Management
- ✅ `src/components/EmployeeForm/EmployeeForm.js` - 2 API calls updated
- ✅ `src/components/EmployeeForm/EmployeeManagement.js` - 1 API call updated

#### Authentication
- ✅ `src/login_page.js` - 2 API calls updated (news-notices & forgot-password)

#### Services
- ✅ `src/services/childService.js` - 13 API calls updated (all child-related endpoints)

### 3. Configuration Files Updated

#### package.json
- ✅ Added clarifying comment that `"proxy"` is for DEVELOPMENT ONLY
- ✅ Noted that production requires `REACT_APP_API_URL` environment variable

#### .env.example
- ✅ Added prominent warnings about updating URLs for production
- ✅ Highlighted `REACT_APP_API_URL` as the most critical variable for frontend deployment
- ✅ Clarified the purpose of each URL variable

## How It Works Now

### Development (Local)
```bash
# .env file (already configured)
REACT_APP_API_URL=http://localhost:5000
```
The app will use `http://localhost:5000` as the API base URL.

### Production (Deployment)
```bash
# .env file (MUST be configured for your environment)
REACT_APP_API_URL=https://api.yourdomain.com
```
The app will use your production API URL. If this variable is missing in production, the app will throw a clear error instead of silently failing with localhost.

## Deployment Checklist

### Frontend Deployment
1. ✅ Set `REACT_APP_API_URL` environment variable to your backend API URL
2. ✅ Build the React app: `npm run build`
3. ✅ Deploy the `build/` directory to your hosting service
4. ⚠️ **IMPORTANT:** Environment variables must be set BEFORE building (they're baked into the build)

### Backend Deployment
1. ✅ Set `FRONTEND_URL` to your frontend URL (used for redirects and email links)
2. ✅ Set `CORS_ORIGIN` and `ALLOWED_ORIGINS` to your frontend domain(s)
3. ✅ Update `BACKEND_URL` and `API_BASE_URL` if used by your infrastructure
4. ✅ Start the backend server

### Example Production .env
```env
# Frontend
FRONTEND_URL=https://yourapp.yourdomain.com

# Backend
BACKEND_URL=https://api.yourdomain.com
API_BASE_URL=https://api.yourdomain.com
REACT_APP_API_URL=https://api.yourdomain.com

# CORS
CORS_ORIGIN=https://yourapp.yourdomain.com
ALLOWED_ORIGINS=https://yourapp.yourdomain.com,https://www.yourapp.yourdomain.com
```

## Verification

### Check for Remaining Hardcoded URLs
Run this command to verify no hardcoded localhost URLs remain in runtime code:
```bash
grep -r "http://localhost:5000" src/ --include="*.js" --include="*.jsx"
```

Expected result: Only `src/config/api.js` should appear (the centralized fallback).

### Test in Development
```bash
# Make sure .env has REACT_APP_API_URL=http://localhost:5000
npm start
```

### Test Production Build
```bash
# Temporarily change REACT_APP_API_URL to test
REACT_APP_API_URL=https://test-api.example.com npm run build
# Check that the build succeeds and uses the correct URL
```

## Files NOT Changed (Intentionally)

### Backend Files
- `Backend/server.js` - Still has `process.env.FRONTEND_URL || 'http://localhost:3000'` fallbacks
  - This is acceptable as it's backend code with proper environment variable support
  - The fallback only applies if the environment variable is missing

### Test/Diagnostic Files
- `test-reject-diagnostic.html` - Standalone test file, not part of production app

### Documentation
- `Knowledge/*.md` files - Documentation only, not runtime code

## Benefits of These Changes

1. ✅ **Deployment Safety**: App will fail loudly if `REACT_APP_API_URL` is missing in production
2. ✅ **Centralized Configuration**: All API URLs managed through `API_CONFIG`
3. ✅ **Environment Flexibility**: Easy to switch between dev, staging, and production
4. ✅ **Maintainability**: Single source of truth for API base URL
5. ✅ **Clear Documentation**: `.env.example` now has explicit warnings and production examples

## Troubleshooting

### App shows "REACT_APP_API_URL environment variable must be set" error
**Solution:** Set the `REACT_APP_API_URL` environment variable before building the app.

### API calls fail in production
**Check:**
1. `REACT_APP_API_URL` is set correctly in your build environment
2. The URL is accessible from the browser (CORS configured correctly)
3. Backend is running and accessible at that URL

### App works locally but not after deployment
**Common causes:**
1. Forgot to set `REACT_APP_API_URL` before building
2. Built locally and uploaded the build (environment variables are baked in at build time)
3. CORS not configured for production domain

## Next Steps

1. Update your deployment pipeline to set environment variables before building
2. Test the build process with different `REACT_APP_API_URL` values
3. Configure CI/CD to inject the correct URL for each environment
4. Consider adding the same production safety checks to the backend `FRONTEND_URL` usage
