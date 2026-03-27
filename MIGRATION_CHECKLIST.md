# ✅ Migration Checklist - Database File Storage

## Pre-Migration
- [ ] Read `MIGRATION_README.md` for overview
- [ ] Backup your database (important!)
- [ ] Stop backend server if running

---

## Migration Steps

### Step 1: Database Schema Update
- [ ] Run `database/UPDATE_TO_BASE64_STORAGE.sql` in phpMyAdmin
   - OR run `database/UPDATE_TO_BASE64_STORAGE.bat`
- [ ] Verify migration succeeded (check output)
- [ ] Confirm columns are now LONGTEXT:
   ```sql
   DESCRIBE children;
   DESCRIBE child_legal_documents;
   DESCRIBE child_medical_records;
   DESCRIBE child_education_records;
   DESCRIBE employees;
   ```

### Step 2: Backend Code
- [ ] Backend code already updated (no action needed)
- [ ] Restart backend server: `cd Backend; npm start`
- [ ] Verify server starts without errors

### Step 3: Test Uploads
- [ ] Upload child profile photo
- [ ] Check database for Base64 string
- [ ] Verify image displays in frontend
- [ ] Upload legal document
- [ ] Upload medical record
- [ ] Upload education certificate
- [ ] Upload employee photo

---

## Verification Checklist

### Database Checks
- [ ] `children.profile_photo` is LONGTEXT
- [ ] `child_legal_documents.document_file` is LONGTEXT
- [ ] `child_medical_records.medical_report_file` is LONGTEXT
- [ ] `child_education_records.certificate_file` is LONGTEXT
- [ ] `employees.profile_image` is LONGTEXT

### Functional Checks
- [ ] Can upload files successfully
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Images display correctly
- [ ] Documents can be viewed/downloaded
- [ ] Database contains Base64 strings (not file paths)

### Cleanup Checks
- [ ] No new files in `Backend/uploads/` folder
- [ ] Backend not serving static files from `/uploads`
- [ ] All uploads going to database only

---

## Post-Migration

### Optional Cleanup
- [ ] Delete old test files from `Backend/uploads/`
- [ ] Remove folder entirely: `Backend/uploads/`
- [ ] Update deployment documentation
- [ ] Update backup procedures (database only now)

### Documentation Review
- [ ] Read `DATABASE_MIGRATION_TO_BASE64.md` for complete details
- [ ] Review `BEFORE_AFTER_COMPARISON.md` for understanding
- [ ] Check `CHANGES_SUMMARY.md` for what changed

---

## Troubleshooting (If Needed)

If uploads fail:
- [ ] Check database migration completed
- [ ] Verify columns are LONGTEXT (not VARCHAR)
- [ ] Restart backend server
- [ ] Check browser console for errors
- [ ] Check backend logs

If images don't display:
- [ ] Verify Base64 string in database
- [ ] Check string starts with `data:image/`
- [ ] Ensure no truncation (should be very long)
- [ ] Test with different image

If "packet too large" error:
- [ ] Run `database/increase_packet_size.sql`
- [ ] Or manually set: `SET GLOBAL max_allowed_packet=67108864;`
- [ ] Restart MySQL service

---

## Success Criteria

✅ **Migration Complete When:**
- All 5 database columns are LONGTEXT
- Can upload all file types successfully
- Database stores Base64 strings (not paths)
- Images display in frontend without errors
- NO files created in `Backend/uploads/`
- Backend serves everything from database

---

## Rollback Plan (If Needed)

If you need to revert:
1. Restore database from backup
2. Revert code changes using git
3. Re-enable static file serving in server.js
4. Recreate `Backend/uploads/` folder

See `DATABASE_MIGRATION_TO_BASE64.md` for detailed rollback instructions.

---

## Final Sign-Off

- [ ] Database migrated
- [ ] Backend restarted
- [ ] All uploads tested
- [ ] Everything working
- [ ] Documentation read
- [ ] Old files cleaned up (optional)

**Date Completed:** _______________  
**Completed By:** _______________  

---

## Need Help?

Refer to:
1. `QUICK_START_DATABASE_MIGRATION.md` - Quick guide
2. `DATABASE_MIGRATION_TO_BASE64.md` - Full documentation
3. `BEFORE_AFTER_COMPARISON.md` - Visual explanation

**Good luck with your migration! 🚀**
