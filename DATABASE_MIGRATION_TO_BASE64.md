# Database Storage Migration - File Uploads to Base64

## Overview
The system has been migrated from **file system storage** to **database storage**. All uploaded files (images, documents) are now stored as Base64-encoded strings directly in the database instead of physical files in the `Backend/uploads/` folder.

---

## What Changed

### Before (Old System)
- Files saved to: `Backend/uploads/filename.ext`
- Database stored: `/uploads/filename.ext` (file path only)
- Required static route: `app.use('/uploads', express.static(...))`
- Files accessed via HTTP: `http://localhost:5000/uploads/filename.ext`

### After (New System)
- **NO files saved to disk**
- Database stores: Complete Base64-encoded file data
- Format: `data:mimeType;base64,base64EncodedString...`
- No static file serving needed
- Files embedded directly in frontend using data URLs

---

## Technical Details

### Modified Files

#### 1. Backend Middleware
**File:** `Backend/middleware/upload.middleware.js`
- Changed from `multer.diskStorage()` to `multer.memoryStorage()`
- Files now stored in memory buffer instead of disk
- Buffer converted to Base64 in route handlers

#### 2. Backend Server
**File:** `Backend/server.js`
- Removed static file serving: `app.use('/uploads', express.static(...))` 
- Updated employee photo upload to store Base64

#### 3. Children Routes
**File:** `Backend/routes/children.routes.js`
- Updated all upload routes to convert files to Base64:
  - Profile photo upload (`/:id/upload-photo`)
  - Legal documents (`/:id/legal-documents/upload`)
  - Medical records (`/:id/medical-records/upload`)
  - Education records (`/:id/education-records/upload`)

#### 4. Database Schema
**SQL Script:** `database/UPDATE_TO_BASE64_STORAGE.sql`
- Changed column types from `VARCHAR(500)` to `LONGTEXT`
- Updated columns:
  - `children.profile_photo`
  - `child_legal_documents.document_file`
  - `child_medical_records.medical_report_file`
  - `child_education_records.certificate_file`
  - `employees.profile_image`

---

## Migration Steps

### Step 1: Update Database Schema
Run the migration script in phpMyAdmin or MySQL:

```bash
# Option 1: Using the batch file (Windows)
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
database\UPDATE_TO_BASE64_STORAGE.bat

# Option 2: Manually in phpMyAdmin
# 1. Open phpMyAdmin
# 2. Select 'sokapptest' database
# 3. Go to SQL tab
# 4. Copy and paste contents of: database/UPDATE_TO_BASE64_STORAGE.sql
# 5. Click "Go"
```

### Step 2: Verify Database Changes
Check that columns are now LONGTEXT:

```sql
DESCRIBE children;
DESCRIBE child_legal_documents;
DESCRIBE child_medical_records;
DESCRIBE child_education_records;
DESCRIBE employees;
```

### Step 3: Restart Backend Server
```bash
cd Backend
npm start
```

You should see:
```
Server running on port 5000...
Database connected successfully
```

### Step 4: Test File Uploads
1. Open your application
2. Navigate to Child Management
3. Upload a profile photo for a child
4. Check browser console - should show Base64 data being sent
5. Verify in database - should see Base64 string in `profile_photo` column

---

## Base64 Data Format

### Example Stored Values

**Image (JPEG):**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL...
```

**Document (PDF):**
```
data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1hPYmplY3QvU3VidHlwZS9JbWFnZS9XaWR0aCAyMDAvSGVpZ2h
```

### Using Base64 Images in Frontend

**Directly in `<img>` tag:**
```jsx
<img src={child.profile_photo} alt="Profile" />
```

**In CSS background:**
```css
div {
  background-image: url(data:image/jpeg;base64,/9j/4AAQSkZJRg...);
}
```

**No conversion needed!** The data URL format works directly in HTML/CSS.

---

## Benefits of Database Storage

### ✅ Advantages

1. **Simplified Deployment**
   - No need to manage file system permissions
   - No backup strategy for separate files
   - Everything in one place (database)

2. **Data Integrity**
   - Files always stay with their records
   - No orphaned files
   - Transaction support (files included in DB transactions)

3. **Security**
   - Files protected by database security
   - No direct file access URLs
   - Access controlled through application logic

4. **Portability**
   - Easy to migrate/copy database
   - No external file dependencies
   - Cloud-friendly (no file system mounting)

5. **Consistency**
   - No broken links to missing files
   - Files automatically deleted with parent record
   - Referential integrity maintained

### ⚠️ Considerations

1. **Database Size**
   - Database will grow faster
   - Need adequate storage space
   - Regular archiving may be needed

2. **Performance**
   - Larger database = slower backups
   - More memory usage for queries
   - Consider pagination for large datasets

3. **File Size Limits**
   - Current limit: 5MB per file (configured in multer)
   - Adjust `max_allowed_packet` in MySQL if needed
   - Already configured in: `database/increase_packet_size.sql`

---

## Configuration

### File Size Limits
**File:** `Backend/middleware/upload.middleware.js`
```javascript
limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
}
```

### MySQL Packet Size
If uploading files > 16MB, increase packet size:
```bash
# Run this SQL script
database/increase_packet_size.sql

# Or manually in MySQL
SET GLOBAL max_allowed_packet=67108864; -- 64MB
```

---

## Troubleshooting

### Issue: "Packet too large" error
**Solution:** Increase MySQL `max_allowed_packet`:
```sql
SET GLOBAL max_allowed_packet=67108864;
```

### Issue: Files not showing after upload
**Check:**
1. Verify database columns are LONGTEXT (run DESCRIBE)
2. Check browser console for errors
3. Verify backend received Base64 data
4. Check database for stored Base64 string

### Issue: Images not displaying
**Check:**
1. Ensure Base64 string includes mime type prefix
2. Format should be: `data:image/jpeg;base64,...`
3. Verify complete Base64 string in database
4. Check for truncation (should be LONGTEXT, not VARCHAR)

### Issue: Cannot upload large files
**Solution:** 
1. Increase file size limit in `upload.middleware.js`
2. Increase `max_allowed_packet` in MySQL
3. Both changes required!

---

## Rollback Instructions

If you need to revert to file system storage:

### 1. Revert Database Schema
```sql
-- Change columns back to VARCHAR(500)
ALTER TABLE children MODIFY COLUMN profile_photo VARCHAR(500) NULL;
ALTER TABLE child_legal_documents MODIFY COLUMN document_file VARCHAR(500) NOT NULL;
ALTER TABLE child_medical_records MODIFY COLUMN medical_report_file VARCHAR(500) NULL;
ALTER TABLE child_education_records MODIFY COLUMN certificate_file VARCHAR(500) NULL;
ALTER TABLE employees MODIFY COLUMN profile_image VARCHAR(500) NULL;
```

### 2. Restore Old Code
Restore these files from git backup:
- `Backend/middleware/upload.middleware.js`
- `Backend/routes/children.routes.js`
- `Backend/server.js`

### 3. Re-enable Static File Serving
In `Backend/server.js`:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

---

## Testing Checklist

After migration, verify:

- [ ] Database schema updated (all columns are LONGTEXT)
- [ ] Backend server starts without errors
- [ ] Can upload child profile photo
- [ ] Can upload legal documents
- [ ] Can upload medical records
- [ ] Can upload education certificates
- [ ] Can upload employee photos
- [ ] Images display correctly in frontend
- [ ] Documents can be downloaded/viewed
- [ ] No files created in `Backend/uploads/` folder
- [ ] Database contains Base64 strings (check with SELECT query)

---

## Future Enhancements

### Potential Improvements

1. **Image Compression**
   - Auto-compress images before storing
   - Reduce database storage requirements

2. **File Cleanup**
   - Endpoint to delete old/unused files
   - Database optimization queries

3. **Progress Tracking**
   - Upload progress indicator
   - Better UX for large files

4. **Multiple File Support**
   - Allow multiple documents per category
   - Array of Base64 strings

5. **Cloud Storage Option**
   - Hybrid approach (optional cloud storage)
   - AWS S3, Azure Blob, etc.

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error logs in browser console
3. Check backend server logs
4. Verify database configuration
5. Test with small files first

---

**Migration Date:** March 22, 2026  
**Version:** 3.0  
**Status:** ✅ Ready for Production
