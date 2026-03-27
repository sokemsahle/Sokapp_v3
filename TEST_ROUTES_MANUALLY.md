# Manual Route Testing Guide

## Test if Routes are Working

### Method 1: Using Browser DevTools

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Try to upload a legal document**
4. **Check the request URL** - should be exactly:
   ```
   http://localhost:5000/api/children/8/legal-documents/upload
   ```

### Method 2: Using curl (Command Line)

Open Command Prompt and run:

```bash
curl -X POST http://localhost:5000/api/children/8/legal-documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "documentFile=@C:\path\to\your\test.pdf"
```

If you get:
- ✅ `{"success": true, ...}` - Routes are working!
- ❌ `404 Not Found` - Backend needs restart or routes are wrong

### Method 3: Check Backend Console

When backend starts, you should see routes being registered. Look for any errors.

---

## Common Issues & Solutions

### Issue 1: Backend Not Restarted

**Symptom**: Still getting 404 after code changes

**Solution**: 
1. Stop backend server (Ctrl+C in terminal)
2. Run: `cd Backend && npm start`
3. Wait for "Server running on port 5000" message

### Issue 2: Wrong API URL in Frontend

**Symptom**: Request goes to wrong port

**Check**: In browser console, type:
```javascript
process.env.REACT_APP_API_URL
```

Should return: `"http://localhost:5000"`

**Fix**: Create `.env` file in frontend root with:
```
REACT_APP_API_URL=http://localhost:5000
```

Then restart frontend: `npm start`

### Issue 3: Port Conflict

**Symptom**: Backend won't start on port 5000

**Check**: Run in Command Prompt:
```bash
netstat -ano | findstr :5000
```

**Fix**: Kill the process using port 5000:
```bash
taskkill /PID <PID_NUMBER> /F
```

Or change backend port in `Backend/.env`:
```
PORT=5001
```

Then update frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5001
```

### Issue 4: Multer Not Loading

**Symptom**: Error about multer not being a function

**Check**: In `Backend/routes/children.routes.js`, line 4 should be:
```javascript
const upload = require('../middleware/upload.middleware');
```

**Fix**: Make sure file exists at `Backend/middleware/upload.middleware.js`

---

## Quick Backend Restart (Windows)

### Option 1: Using Script
Double-click: `RESTART_BACKEND.bat`

### Option 2: Manual
```bash
# In Backend folder
# Press Ctrl+C to stop
# Then run:
npm start
```

---

## Verify Server is Running

After starting backend, you should see:
```
Server running on port 5000...
Database connected successfully
```

If you don't see this, backend didn't start properly!

---

## Test Upload Manually

Create a test file `test-upload.js` in Backend folder:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('documentFile', fs.createReadStream('./test.pdf'));

axios.post('http://localhost:5000/api/children/8/legal-documents/upload', form, {
  headers: form.getHeaders()
})
.then(response => console.log('Success:', response.data))
.catch(error => console.error('Error:', error.response?.data || error.message));
```

Run it:
```bash
cd Backend
node test-upload.js
```

---

## Expected Response

Success response should be:
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentFile": "/uploads/1772013157367-3614466.pdf",
    "originalName": "test.pdf",
    "size": 12345
  }
}
```

---

## Still Getting 404?

1. **Check backend is actually running** on port 5000
2. **Check exact URL** in browser network tab
3. **Restart BOTH frontend and backend**
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Check for typos** in route paths

Last resort - delete `node_modules` and reinstall:
```bash
cd Backend
rmdir /s /q node_modules
npm install
npm start
```
