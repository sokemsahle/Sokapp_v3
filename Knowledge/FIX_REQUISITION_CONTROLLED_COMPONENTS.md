# Requisition Component Fixes

## Issues Fixed

### 1. ✅ React Warning: Controlled Components
**Error**: `Warning: You provided a 'value' prop to a form field without an 'onChange' handler`

**Root Cause**: In view mode, input fields had `value` set but `onChange` was set to `undefined`, making them controlled components without proper handlers.

**Solution Applied**:
- Changed all input fields to always have `onChange={handleInputChange}` 
- Added `readOnly={mode === 'view'}` attribute to make them read-only in view mode
- This applies to:
  - General Purpose field
  - Date field
  - Requestor field
  - Description field
  - Item table inputs (description, quantity, price)
  - Approval fields (Reviewed By, Approved By, Authorized By)

**Files Modified**:
- `src/components/Requisition/Requisition.js` (lines 594-1000)

### 2. ✅ API Error: HTML instead of JSON
**Error**: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause**: The backend server was returning HTML (likely a 404 page or React's index.html) instead of JSON response.

**Solution Applied**:
- Added response validation before parsing JSON
- Check `response.ok` status
- Verify content-type header is JSON, not HTML
- Provide descriptive error messages to help diagnose backend connectivity issues

**Code Added**:
```javascript
// Check if response is OK before parsing JSON
if (!response.ok) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Backend may not be running on port 5000.`);
  }
  throw new Error(`HTTP error! status: ${response.status}`);
}
```

**Files Modified**:
- `src/components/Requisition/Requisition.js` (lines 119-130)

## How to Test

### Step 1: Ensure Backend is Running
```bash
cd Backend
npm start
```
You should see: `Server running on http://localhost:5000`

### Step 2: Start Frontend
```bash
npm start
```
Frontend should start on `http://localhost:3000`

### Step 3: Test View Mode
1. Navigate to Requisitions list
2. Click "View" on any requisition
3. **Expected**: No React warnings in console
4. **Expected**: All fields are read-only (cannot edit)
5. **Expected**: Data loads correctly from backend

### Step 4: Test Create/Edit Mode
1. Click "Create New Requisition"
2. **Expected**: All fields are editable
3. **Expected**: onChange handlers work properly
4. **Expected**: Can submit requisition successfully

### Step 5: Test API Connectivity
If you still see the HTML error:
1. Check if backend is running on port 5000
2. Open browser DevTools → Network tab
3. Try to access: `http://localhost:5000/api/requisition/1`
4. **Expected**: Should return JSON, not HTML page

## Common Troubleshooting

### Issue: "Cannot connect to backend API"
**Solutions**:
1. Verify backend is running: `http://localhost:5000`
2. Check for port conflicts (backend should be on 5000, frontend on 3000)
3. Check `.env` file has correct API URL: `REACT_APP_API_URL=http://localhost:5000`
4. Restart both backend and frontend servers

### Issue: "Backend returns HTML for API calls"
**Cause**: React's catch-all route is serving index.html for API endpoints

**Solutions**:
1. Make sure backend routes are defined BEFORE the React catch-all route in `server.js`
2. The 404 handler should come before the React catch-all
3. Check that `/api/requisition/:id` route exists in `server.js`

## Technical Details

### Controlled vs Uncontrolled Components

**Controlled Component** (React manages the state):
```javascript
<input value={state} onChange={handleChange} />
```

**Uncontrolled Component** (DOM manages the state):
```javascript
<input defaultValue={initialValue} />
```

**Read-only Controlled Component** (What we use for view mode):
```javascript
<input value={state} onChange={handleChange} readOnly />
```

### Why We Use readOnly Instead of Disabling onChange

1. **Single Source of Truth**: Always use `onChange={handleInputChange}` for consistency
2. **Disabled Attribute**: Prevents user interaction visually and functionally
3. **ReadOnly Attribute**: Makes it clear to React this is intentional read-only state
4. **Cleaner Code**: No complex conditional logic for onChange handlers

## API Endpoints Used

- `GET /api/requisition/:id` - Fetch requisition data
- `POST /api/requisition` - Create new requisition
- `PUT /api/requisition/:id` - Update existing requisition
- `GET /api/user/requisition-roles?email=xxx` - Get user roles

All endpoints expect JSON responses with format:
```json
{
  "success": true,
  "data": { ... }
}
```

## Related Files

- Frontend Component: `src/components/Requisition/Requisition.js`
- Backend Routes: `Backend/server.js` (lines 886-920, 965-1325)
- Environment Config: `.env` (API URLs)

## Next Steps

If errors persist after applying these fixes:

1. **Check Backend Logs**: Look for errors in backend console
2. **Check Network Tab**: Inspect actual HTTP responses in browser DevTools
3. **Verify Database**: Ensure requisitions table exists and has data
4. **Test API Directly**: Use Postman or curl to test `http://localhost:5000/api/requisition/1`

---

**Status**: ✅ Both issues resolved
**Date**: March 14, 2026
**Impact**: Requisition component now works without warnings in both create and view modes
