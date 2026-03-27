# File Upload Testing Guide

## Quick Test Steps

### 1. Test Profile Photo Upload (ChildForm)

**Creating New Child with Photo:**
1. Navigate to Children → Add New Child
2. Fill in Step 1 (Basic Info) and Step 2 (Additional Info)
3. On Step 3 (Admission Info), you'll see "Profile Photo" section
4. Click "Choose File" and select an image (JPEG, PNG, or WebP)
5. Preview should appear below the input
6. Complete the form and click Save
7. Check that:
   - Success message appears
   - Child profile shows the uploaded photo
   - File exists in `Backend/uploads/` folder

**Editing Existing Child with Photo:**
1. Go to any child profile
2. Click "Edit Profile"
3. Go to Step 3
4. Upload a new photo
5. Save changes
6. Verify photo is updated

### 2. Test Legal Document Upload

1. Go to any child profile
2. Click on "Legal Documents" tab
3. Click "Add Document"
4. Fill in:
   - Document Type (e.g., Birth Certificate)
   - Document Number (optional)
   - Issue Date (optional)
   - Expiry Date (optional)
5. Under "Upload Document", click "Choose File"
6. Select a PDF or image file
7. Click "Add Document"
8. Verify:
   - Success message appears
   - Document appears in table
   - "View Document" link is clickable
   - Click opens document in new tab

### 3. Test Medical Record Upload

1. Go to any child profile
2. Click on "Medical Records" tab
3. Click "Add Record"
4. Fill in medical information
5. Under "Upload Medical Report", select a file
6. Click "Add Record"
7. Verify upload was successful

### 4. Test Education Certificate Upload

1. Go to any child profile
2. Click on "Education" tab
3. Click "Add Record"
4. Fill in school information
5. Under "Upload Certificate", select a file
6. Click "Add Record"
7. Verify upload was successful

## Validation Tests

### File Type Validation
Try uploading these files to test validation:

**Should Work:**
- ✅ .jpg, .jpeg images
- ✅ .png images
- ✅ .webp images
- ✅ .pdf documents
- ✅ .doc Word documents
- ✅ .docx Word documents

**Should Fail (Error Message):**
- ❌ .exe executables
- ❌ .zip archives
- ❌ .txt text files
- ❌ .mp4 videos

### File Size Validation
1. Try uploading a file larger than 5MB
2. Should see error message about file size

### Backward Compatibility Test

**Manual URL Entry (Still Works):**
1. In Legal Documents, add a document
2. Instead of uploading, type a URL in "Or Enter File Location/URL" field
   - Example: `/docs/test.pdf` or `https://example.com/doc.pdf`
3. Submit form
4. Should work without file upload

## Backend Verification

### Check Uploads Folder
After uploading files, verify they exist:
```bash
cd Backend
ls uploads/
```

You should see files named like:
- `1772013157367-3614466.png`
- `1772013157368-123456789.pdf`

### Check Database
Verify file paths are stored correctly:
```sql
-- Check child profile photos
SELECT id, first_name, last_name, profile_photo 
FROM children 
WHERE profile_photo IS NOT NULL;

-- Check legal documents
SELECT id, document_type, document_file 
FROM child_legal_documents 
WHERE document_file IS NOT NULL;

-- Check medical records
SELECT id, medical_condition, medical_report_file 
FROM child_medical_records 
WHERE medical_report_file IS NOT NULL;

-- Check education records
SELECT id, school_name, certificate_file 
FROM child_education_records 
WHERE certificate_file IS NOT NULL;
```

Expected format: `/uploads/filename.ext`

### Test API Directly

Using curl or Postman:

**Upload Profile Photo:**
```bash
curl -X POST http://localhost:5000/api/children/1/upload-photo \
  -F "profilePhoto=@/path/to/photo.jpg"
```

**Upload Legal Document:**
```bash
curl -X POST http://localhost:5000/api/children/1/legal-documents/upload \
  -F "documentFile=@/path/to/document.pdf"
```

## Browser Console Checks

While testing, open browser console (F12) and check for:
- ✅ No errors during upload
- ✅ Network requests show 200 status
- ✅ Response contains correct file path

## Common Issues & Solutions

### Issue: "No file uploaded" error
**Solution:** Make sure you're selecting a file before submitting

### Issue: File uploads but can't view
**Solution:** 
1. Check backend server is running
2. Verify `/uploads` route is configured in server.js
3. Check file exists in `Backend/uploads/` folder

### Issue: "File type not allowed"
**Solution:** Only use supported file types (JPEG, PNG, PDF, DOC, DOCX)

### Issue: Upload seems to work but no preview
**Solution:** This is normal for documents. Preview only shows for images.

## Performance Testing

### Multiple Files Test
1. Upload 10+ documents across different tabs
2. Check page load time doesn't degrade significantly
3. Verify all links still work

### Large File Test
1. Upload a file close to 5MB limit (e.g., 4.5MB)
2. Check upload completes successfully
3. Verify file can be viewed/downloaded

## Mobile/Browser Testing

Test on different browsers:
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (if available)

## Success Criteria

All tests pass if:
- ✅ Profile photos upload and display correctly
- ✅ Legal documents upload and are viewable
- ✅ Medical reports upload and are viewable
- ✅ Education certificates upload and are viewable
- ✅ File validation works (type and size)
- ✅ Manual URL entry still works (backward compatible)
- ✅ No console errors
- ✅ Files accessible via browser
- ✅ Database stores correct file paths

## Test Data Cleanup

After testing, clean up test data:
```sql
-- Delete test children (cascades to all related tables)
DELETE FROM children WHERE first_name = 'Test';
```

---

**Testing Status**: Ready for QA  
**Last Updated**: March 5, 2026
