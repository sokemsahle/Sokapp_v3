# 📋 Employee Document Management - Complete Setup & Test Guide

## 🗑️ Step 1: Clear All Existing Documents

### Option A: Using MySQL Workbench
1. Open **MySQL Workbench**
2. Connect to your database
3. Run this query:
```sql
USE sokapptest;
TRUNCATE TABLE employee_documents;
SELECT * FROM employee_documents; -- Should show 0 rows
```

### Option B: Using SQL File
1. Open **MySQL Workbench**
2. Go to **File > Open SQL Script**
3. Select `CLEAR_DOCUMENTS.sql` in your project root
4. Click **Execute** (⚡ button)

---

## ✅ Step 2: Verify Database Table Structure

Run this to check your table has the right columns:
```sql
DESCRIBE employee_documents;
```

**Expected columns:**
- `id` (int, primary key)
- `employee_id` (int)
- `name` (varchar)
- `type` (varchar)
- `file_path` (varchar) ← **Stores Base64 content**
- `file_name` (varchar)
- `file_size` (int)
- `mime_type` (varchar)
- `issue_date` (date)
- `expiry_date` (date)
- `notes` (text)
- `upload_date` (timestamp)
- `uploaded_by` (int)
- `is_active` (tinyint)

---

## 🔧 Step 3: Backend Verification

The backend is already configured with these endpoints:

### 1. **POST** `/api/employees/:id/documents`
- Uploads document with file
- Converts file to Base64
- Stores in database

### 2. **GET** `/api/employees/:id/documents`
- Fetches all documents for an employee
- Returns Base64 data in `file_path`

### 3. **DELETE** `/api/employees/:employeeId/documents/:documentId`
- Soft deletes (sets `is_active = FALSE`)

---

## 🧪 Step 4: Test the Complete Workflow

### Test 1: Upload a Document
1. Open your app in browser
2. Navigate to **Employee Management**
3. Click **Edit** on any employee (or create new one)
4. Go to **Documents** section (Tier 3)
5. Fill in:
   - Document Name: "Test Passport"
   - Document Type: "passport"
   - Issue Date: Any date
   - Upload a file (PDF, JPG, or PNG)
6. Click **Add Document**
7. You should see it in the document list

### Test 2: Save Employee with Documents
1. After adding documents, click **Submit**
2. Watch console logs (F12)
3. Look for successful upload messages
4. Check for any errors

### Test 3: Fetch Documents
1. Re-open the same employee
2. Documents should load automatically
3. Check if all documents appear with:
   - ✅ Document name
   - ✅ Type badge
   - ✅ Dates
   - ✅ Download button

### Test 4: Download Document
1. Click the **Download** button (📥 icon) on any document
2. File should download immediately
3. Open the downloaded file
4. Verify it's the same file you uploaded

### Test 5: Delete Document
1. Click the **Trash** icon (🗑️) on a document
2. Confirm deletion
3. Document should disappear from list
4. Re-open employee to verify it's gone

---

## 🔍 Step 5: Debug Common Issues

### Issue 1: "Document file path not available"
**Cause:** Trying to download a document without file_path

**Solution:** 
- Check browser console (F12)
- Look at the document object
- Ensure `file_path` starts with `data:`

### Issue 2: "Unexpected field" error
**Cause:** Multer fieldname mismatch

**Solution:**
- Verify frontend uses `formData.append('file', ...)`
- Backend uses `upload.single('file')`
- Both should match

### Issue 3: File too large
**Cause:** Exceeds 5MB limit

**Solution:**
- Use smaller files (< 5MB)
- Or increase limit in `upload.middleware.js`

### Issue 4: Documents don't save after upload
**Cause:** Employee ID missing during upload

**Solution:**
- Make sure employee is created first
- Check console for employee ID
- Verify API call includes correct ID

---

## 📊 Step 6: Verify Database Storage

Check what's actually stored:
```sql
USE sokapptest;
SELECT 
    id,
    employee_id,
    name,
    type,
    file_name,
    file_size,
    mime_type,
    LEFT(file_path, 50) as file_path_preview,
    upload_date
FROM employee_documents
ORDER BY upload_date DESC;
```

**What to look for:**
- `file_path` should start with `data:image/jpeg;base64,` or similar
- `file_name` should match original filename
- `file_size` should be reasonable (> 0)
- `mime_type` should be correct (e.g., `image/jpeg`, `application/pdf`)

---

## 🎯 Success Criteria

✅ **Upload Works:**
- Can add documents with files
- No console errors
- Server returns success

✅ **Fetch Works:**
- Documents load when opening employee
- All fields populated correctly
- `file_path` contains Base64 data

✅ **Download Works:**
- Click download button
- File downloads immediately
- Downloaded file opens correctly

✅ **Delete Works:**
- Click trash icon
- Document removed from UI
- Soft delete in database (`is_active = FALSE`)

---

## 🚀 Quick Start Commands

### Clear and restart:
```sql
TRUNCATE TABLE employee_documents;
```

### Check storage:
```sql
SELECT COUNT(*) as total_docs FROM employee_documents;
SELECT SUM(file_size) as total_size_bytes FROM employee_documents;
```

### View recent uploads:
```sql
SELECT * FROM employee_documents 
ORDER BY upload_date DESC 
LIMIT 10;
```

---

## 📝 Notes

1. **Files are stored as Base64** in the `file_path` column
2. **Soft delete** is used - documents aren't permanently removed
3. **5MB limit** per file (configured in multer middleware)
4. **Allowed formats:** PDF, DOC, DOCX, JPG, JPEG, PNG

---

## 🆘 If Something Goes Wrong

1. **Restart backend server**
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Check console logs** for specific errors
4. **Verify database connection**
5. **Run the CLEAR_DOCUMENTS.sql script again**

Good luck! 🎉
