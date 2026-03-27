# Quick Fix Guide - File Upload 404 Error

## Problem Fixed ✅

**Issue**: `Failed to add legal document: Request failed with status code 404`

**Root Cause**: Express route ordering issue. The upload routes were placed AFTER the generic routes, causing requests to be intercepted by the wrong route handler.

**Solution**: Moved upload routes BEFORE generic routes in the routes file.

---

## Steps to Fix

### 1. ✅ Backend Routes - FIXED
The upload routes have been moved to the correct position in:
- `Backend/routes/children.routes.js`

Upload routes now come BEFORE generic routes:
```javascript
// CORRECT ORDER
router.post('/:id/legal-documents/upload', ...);  // Upload route FIRST
router.get('/:id/legal-documents', ...);          // Generic route SECOND
router.post('/:id/legal-documents', ...);         // Generic route THIRD
```

### 2. ✅ Frontend Forms - UPDATED
Removed optional URL fields and made file uploads required:
- `src/components/childProfile/LegalTab.js`
- `src/components/childProfile/MedicalTab.js`
- `src/components/childProfile/EducationTab.js`

**Changes:**
- ❌ Removed "Or Enter File Location/URL (Optional)" field
- ✅ Made file upload REQUIRED with asterisk (*)
- ✅ Added `required` attribute to file inputs

### 3. ✅ Database Update - SQL PROVIDED
Run the SQL script to ensure database columns are properly configured:

**File**: `database/ADD_FILE_UPLOAD_SUPPORT.sql`

**What it does:**
- Updates column sizes to VARCHAR(500)
- Adds proper comments
- Makes `document_file` NOT NULL (required)
- Keeps other file fields NULL (optional for now)

**How to run:**
1. Open phpMyAdmin
2. Select `sokapptest` database
3. Go to SQL tab
4. Copy and paste contents from `ADD_FILE_UPLOAD_SUPPORT.sql`
5. Click "Go"

---

## Testing After Fix

### Test Legal Document Upload

1. **Start Backend Server**
   ```bash
   cd Backend
   npm start
   ```

2. **Start Frontend**
   ```bash
   npm start
   ```

3. **Test Upload**
   - Go to any child profile
   - Click "Legal Documents" tab
   - Click "Add Document"
   - Fill in form fields
   - **Select a file** (required - no manual URL option anymore)
   - Click "Add Document"
   - Should see success message ✅

### Expected Behavior

✅ **Success:**
- File uploads successfully
- Document appears in table
- "View Document" link works
- Opens document in new tab

❌ **If Still Getting 404:**
1. Check backend server is running on port 5000
2. Check console for exact error message
3. Verify upload routes are in correct order in `children.routes.js`
4. Restart backend server

---

## Changes Summary

### Backend Files Modified
1. ✅ `Backend/routes/children.routes.js` - Fixed route ordering
2. ✅ `Backend/middleware/upload.middleware.js` - Already exists
3. ✅ `Backend/server.js` - Static file serving configured

### Frontend Files Modified
1. ✅ `src/components/childProfile/LegalTab.js` - Required file upload
2. ✅ `src/components/childProfile/MedicalTab.js` - Required file upload
3. ✅ `src/components/childProfile/EducationTab.js` - Required file upload
4. ✅ `src/components/childProfile/ChildForm.js` - Profile photo upload
5. ✅ `src/components/childProfile/ChildProfile.css` - Upload styles

### Database Files Created
1. ✅ `database/ADD_FILE_UPLOAD_SUPPORT.sql` - Database update script

---

## No More Optional URLs

**Before:**
- Upload file OR enter URL manually
- Two input fields per form

**After:**
- **Must upload file** (required)
- No manual URL field
- Cleaner UI
- Better data consistency

---

## Important Notes

### File Requirements
- **Max Size**: 5MB
- **Types**: PDF, DOC, DOCX, JPEG, JPG, PNG
- **Storage**: `Backend/uploads/` folder
- **Access**: Via `http://localhost:5000/uploads/filename.ext`

### Validation
- ✅ Client-side validation (HTML5 `required` attribute)
- ✅ Server-side validation (multer middleware)
- ✅ File type validation
- ✅ File size validation

### Backward Compatibility
⚠️ **Breaking Change**: Manual URL entry is NO LONGER SUPPORTED
- Existing records with manual URLs will still work
- New records MUST upload files
- This is intentional for data consistency

---

## Troubleshooting

### Issue: "No file uploaded" error
**Solution**: Make sure you're selecting a file before clicking submit

### Issue: "File type not allowed"
**Solution**: Only use supported file types (PDF, DOC, DOCX, JPEG, PNG)

### Issue: "File too large"
**Solution**: Compress file to under 5MB

### Issue: Can't view uploaded file
**Solution**: 
1. Check backend server is running
2. Verify file exists in `Backend/uploads/` folder
3. Check `/uploads` static route is configured in `server.js`

---

## Next Steps

1. ✅ **Run Database Update**
   - Execute `ADD_FILE_UPLOAD_SUPPORT.sql` in phpMyAdmin

2. ✅ **Restart Backend Server**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm start
   ```

3. ✅ **Test All Upload Types**
   - Legal documents
   - Medical reports
   - Education certificates
   - Profile photos

4. ✅ **Verify Files Are Accessible**
   - Upload a test document
   - Click "View Document" link
   - Should open in new tab

---

**Status**: ✅ Ready to Test  
**Last Updated**: March 5, 2026  
**Breaking Changes**: Yes (manual URLs no longer accepted)
