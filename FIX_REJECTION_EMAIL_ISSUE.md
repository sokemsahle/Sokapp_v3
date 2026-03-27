# 🔧 FIX: Requester Not Getting Rejection Email

## Problem
When a requisition is rejected, the requester is not receiving the rejection email notification.

## Root Cause Analysis

The issue could be caused by several factors:

1. **Missing `requestor_email` column in database** - The requisitions table may not have the `requestor_email` column
2. **Email not being saved** - The requestor_email might not be saved when creating requisitions
3. **Brevo API issues** - Email service might not be configured properly or API key invalid
4. **Database schema mismatch** - Database structure doesn't match what the code expects

## Solution Steps

### Step 1: Check Database Structure

First, verify if your database has the required columns:

```sql
DESCRIBE requisitions;
```

**Required columns:**
- `requestor_name` (VARCHAR)
- `requestor_email` (VARCHAR) ← **This is critical!**
- `user_id` (INT)
- `program_id` (INT)
- `unique_id` (VARCHAR)
- `status` (ENUM with 'rejected')
- `rejection_note` (TEXT)
- `rejected_by` (VARCHAR)
- `rejected_at` (TIMESTAMP)

### Step 2: Fix Missing Columns

If `requestor_email` or other columns are missing, run the fix script:

#### Option A: Using Batch File (Easiest)
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
.\FIX_REQUESTOR_EMAIL.bat
```

#### Option B: Using phpMyAdmin
1. Open phpMyAdmin
2. Select your database (e.g., `sokapptest`)
3. Click on "SQL" tab
4. Copy and paste the contents of `fix_requestor_email.sql`
5. Click "Go"

#### Option C: Manual SQL Commands
Run these commands one by one:

```sql
-- Add requestor_email if missing
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS requestor_email VARCHAR(255) NULL AFTER requestor_name;

-- Add user_id if missing
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER requestor_email;

-- Add program_id if missing
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS program_id INT NULL AFTER user_id;

-- Add unique_id if missing
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS unique_id VARCHAR(100) NULL AFTER program_id;

-- Update status enum to include 'rejected'
ALTER TABLE requisitions 
MODIFY COLUMN status ENUM('pending', 'reviewed', 'approved', 'authorized', 'rejected') DEFAULT 'pending';

-- Verify changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'requisitions' 
ORDER BY ORDINAL_POSITION;
```

### Step 3: Verify Brevo Email Configuration

Check your `.env` file in the Backend folder:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
type .env | findstr /i "brevo"
```

You should see:
```
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@sokapp.online
```

**If missing:**
1. Edit the `.env` file
2. Add your Brevo API key
3. Restart the backend server

### Step 4: Test Email Service

The backend has debug logging enabled. When you reject a requisition, check the console for:

```
DEBUG: Updated requisition data: { ... }
DEBUG: requestor_email value: someone@example.com
Sending rejection notification to requester: someone@example.com
=== sendEmailNotification called ===
toEmail: someone@example.com
subject: ✗ Your Requisition Has Been Rejected - #123
Sending email via Brevo...
✓ Rejection notification sent successfully to requester: someone@example.com
```

**Common error messages:**
- `Brevo API key not configured` → Check .env file
- `Failed to send rejection notification` → Check API key validity
- `No requestor email found` → Database column missing or empty

### Step 5: Test the Rejection Flow

1. **Create a test requisition:**
   - Login as a regular user
   - Create a new requisition with your email
   - Submit it

2. **Reject the requisition:**
   - Login as admin/reviewer
   - Open the requisition
   - Click "Reject"
   - Enter a rejection reason
   - Submit

3. **Check the logs:**
   - Look at the backend console
   - Check for any errors
   - Verify the email was sent

4. **Check spam folder:**
   - Sometimes automated emails go to spam
   - Check junk/spam folder

## Verification Checklist

- [ ] Database has `requestor_email` column
- [ ] Existing requisitions have `requestor_email` populated
- [ ] Brevo API key is configured in `.env`
- [ ] Backend server is restarted after changes
- [ ] No errors in backend console when rejecting
- [ ] Email logs show "sent successfully" message

## Testing Email Delivery

To manually test if email sending works:

```javascript
// In server.js, temporarily add this test endpoint
app.post('/api/test-email', async (req, res) => {
    const result = await sendEmailNotification(
        'your-email@example.com',
        'Test Email',
        '<h1>Test</h1><p>This is a test email</p>'
    );
    res.json(result);
});
```

Then call: `POST http://localhost:5000/api/test-email`

## Common Issues & Solutions

### Issue 1: "Column 'requestor_email' doesn't exist"
**Solution:** Run the `fix_requestor_email.sql` script

### Issue 2: "requestor_email is NULL"
**Solution:** The requisition was created before adding the column. You need to either:
- Update existing records: 
  ```sql
  UPDATE requisitions 
  SET requestor_email = 'default@example.com' 
  WHERE requestor_email IS NULL;
  ```
- Or recreate the requisitions

### Issue 3: "Brevo API key invalid"
**Solution:** 
1. Login to Brevo (https://www.brevo.com/)
2. Go to Settings → API Keys
3. Generate a new key
4. Update `.env` file
5. Restart backend

### Issue 4: "Email sent but not received"
**Solution:**
1. Check spam folder
2. Verify sender email domain is authenticated
3. Check Brevo dashboard for delivery status
4. Verify recipient email address is correct

## Debug Mode

The backend now includes enhanced logging for rejection emails:

```javascript
console.log('DEBUG: Updated requisition data:', JSON.stringify(updatedRequisition, null, 2));
console.log('DEBUG: requestor_email value:', updatedRequisition?.requestor_email);
```

Watch for these logs when testing.

## Success Indicators

When everything works correctly, you'll see:

```
✓ Rejection notification sent successfully to requester: user@example.com
```

And the requester will receive an email with:
- Subject: `✗ Your Requisition Has Been Rejected - #123`
- Reason for rejection
- Requisition details
- Link to view the requisition

## Additional Resources

- Brevo Documentation: https://developers.brevo.com/
- MySQL ALTER TABLE: https://dev.mysql.com/doc/refman/8.0/en/alter-table.html
- Backend logs: Check `backend.log` file

---

**Last Updated:** March 9, 2026  
**Status:** Fix applied with enhanced logging
