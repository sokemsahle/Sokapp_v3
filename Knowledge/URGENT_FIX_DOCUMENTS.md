# 🚨 URGENT FIXES - Document Upload/Download Issues

## ⚠️ Current Errors

1. **`document.createElement is not a function`**
2. **`document.file.startsWith is not a function`**  
3. **Upload fails with 500 error**

---

## 🔧 Solution Steps (DO IN ORDER)

### STEP 1: Rename Database Column (REQUIRED FIRST!)

The backend is trying to insert into `file` column but it doesn't exist yet!

**Run this SQL in phpMyAdmin or MySQL Workbench:**

```sql
USE sokapptest;

-- Check current structure
DESCRIBE employee_documents;

-- Rename the column
ALTER TABLE employee_documents 
CHANGE COLUMN file_path file VARCHAR(500) DEFAULT NULL;

-- Verify it worked
DESCRIBE employee_documents;
```

**OR** execute the file: `RENAME_COLUMN_TO_FILE.sql`

---

### STEP 2: Delete Invalid Documents

Your database has documents with NULL file that will cause download errors:

```sql
-- Delete documents without files
DELETE FROM employee_documents WHERE file IS NULL OR file = '';

-- Keep only valid Base64 documents
SELECT id, name, type, LEFT(file, 30) as preview
FROM employee_documents
WHERE file LIKE 'data:%';
```

---

### STEP 3: Restart Backend Server

```bash
cd Backend
# Stop the server (Ctrl+C)
npm start
```

---

### STEP 4: Hard Refresh Browser

Press **Ctrl+Shift+R** to clear cached JavaScript files.

---

## ✅ Test After Each Step

### After Step 1 (Database Rename):
Check backend console for errors when uploading.

### After Step 2 (Delete Invalid):
Download button should only show for valid documents.

### After Step 3 (Restart Backend):
Upload should work without 500 error.

### After Step 4 (Refresh Browser):
Download should work with better error messages.

---

## 🐛 What Each Error Means

### "document.createElement is not a function"
**Cause:** Code running in wrong context or document is undefined  
**Fix:** Already fixed - added type checking

### "document.file.startsWith is not a function"  
**Cause:** file field is an object instead of string  
**Fix:** Already fixed - added instanceof File check

### "Failed to load resource: 500 (Internal Server Error)"
**Cause:** Database column `file` doesn't exist yet  
**Fix:** RUN STEP 1 FIRST!

### "AbortError: The play() request was interrupted"
**Cause:** Unrelated audio notification issue  
**Fix:** Ignore - not related to documents

---

## 📊 Expected Flow After Fix

1. **Upload:**
   ```
   Select file → FormData → POST /api/employees/:id/documents
   → Multer captures → Convert to Base64 → INSERT into `file` column
   → Success! ✅
   ```

2. **Fetch:**
   ```
   Open employee → GET /api/employees/:id/documents
   → Database returns rows with `file` column
   → Map to document.file property
   → Display in UI ✅
   ```

3. **Download:**
   ```
   Click download → Check if file is string (Base64) or object (File)
   → If Base64: Create <a> with href=document.file
   → If File object: Create blob URL
   → Download starts ✅
   ```

---

## 🎯 Critical: DO STEP 1 FIRST!

The backend code already uses `file` column (not `file_path`).
If you haven't renamed the column yet, ALL uploads will fail with 500 error!

### Quick Check:
Run this to see if column exists:
```sql
DESCRIBE employee_documents;
```

If you don't see `file` in the list, RUN THE ALTER TABLE command!

---

## 🆘 If Still Not Working

1. **Check backend console** - Look for specific SQL error
2. **Check browser console** - Look at the full document object
3. **Verify column exists:**
   ```sql
   SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'employee_documents' AND COLUMN_NAME = 'file';
   ```
4. **Test upload again** - Watch backend console logs

---

**Status:** Code updated, waiting for database column rename! 🎯
