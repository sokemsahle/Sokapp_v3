# REQUISITION EMAIL TROUBLESHOOTING GUIDE

## Problem
Requisition emails are not being sent when creating new requisitions.

## Diagnosis Results

### ✅ What's Working:
1. **Brevo API Configuration**: API key is valid and working
2. **Active Reviewers**: Found 2 active reviewers in database:
   - System Administrator (sahlesokem@gmail.com)
   - Sok (sahlesokem15@gmail.com)
3. **Email Service**: Test emails send successfully via Brevo
4. **Backend Code**: Email sending logic is implemented correctly

### ❌ Likely Causes:

## SOLUTION 1: Restart Backend Server (MOST COMMON FIX)

The backend server needs to be restarted to ensure all code changes are loaded.

**Steps:**
1. Stop the current backend server (Ctrl+C in terminal)
2. Run: `cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"`
3. Run: `node server.js`
4. Watch for the startup logs to confirm it's running

**What to look for:**
```
Server running on http://localhost:5000
✓ Database connection successful
```

## SOLUTION 2: Check Console Logs When Creating Requisition

When you create a requisition, you should see these exact logs in the backend terminal:

```
=== POST /api/requisition called ===
Database connection established
POST /api/requisition received: { ... }
=== SENDING EMAIL TO REVIEWERS ===
Attempting to fetch active reviewers from database...
✓ requisition_roles table exists
Query result: Found 2 active reviewers
✓ Found 2 active reviewers:
  1. System Administrator (sahlesokem@gmail.com)
  2. Sok (sahlesokem15@gmail.com)

=== Processing Reviewer Email ===
Recipient: sahlesokem@gmail.com (System Administrator)
Requisition ID: XX
Unique Identifier: XX
Frontend URL: http://localhost:3000
Calling sendEmailNotification function...
Subject: New Requisition Requires Review - #XX

=== sendEmailNotification CALLED ===
To Email: sahlesokem@gmail.com
Subject: New Requisition Requires Review - #XX
✓ Brevo API key found (length: XX)
Sending email via Brevo API...
✅ Email sent successfully to sahlesokem@gmail.com
Message ID: <XXXX@smtp-relay.mailin.fr>
```

**If you DON'T see these logs:**
- The email sending code is not being reached
- Check for errors earlier in the process

**If you see errors instead:**
- Copy the error message and check the specific issue

## SOLUTION 3: Verify Reviewer Roles in Database

Run this SQL query to check if reviewers are properly configured:

```sql
SELECT 
    rr.user_id,
    rr.role_type,
    rr.is_active,
    u.email,
    u.full_name,
    u.is_active as user_is_active
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'reviewer';
```

**Expected Result:**
At least one row with:
- `role_type` = 'reviewer'
- `rr.is_active` = 1
- `u.is_active` = 1
- Valid email address

**If no results:**
1. Go to User Control page in the app
2. Edit a user (e.g., Admin)
3. Scroll to "Requisition Roles"
4. Check "Reviewer" role and set "Is Active" to Yes
5. Save the user

## SOLUTION 4: Test Email Sending Manually

Use the test script to verify email sending:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
node test-requisition-email.js
```

**Expected Output:**
```
STEP 1: Checking for active reviewers...
Found 2 active reviewer(s):
  1. System Administrator (sahlesokem@gmail.com)
  2. Sok (sahlesokem15@gmail.com)

STEP 3: Sending test requisition email...
✅ Test email sent successfully!
```

**Check your email inbox** (and spam folder) within 1-2 minutes.

## SOLUTION 5: Check .env File Configuration

Verify your `.env` file has these values:

```env
# Email configurations
BREVO_API_KEY=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
EMAIL_FROM=noreply@sokapp.online
BREVO_SENDER_EMAIL=noreply@sokapp.online

# API Configuration
FRONTEND_URL=http://localhost:3000
```

**Important:**
- The sender email (`noreply@sokapp.online`) must be verified in your Brevo account
- Go to: https://app.brevo.com/settings/senders

## SOLUTION 6: Check Backend Logs for Errors

After creating a requisition, check the backend log file:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
Get-Content backend.log -Tail 50
```

Look for any errors related to:
- Email sending failures
- Database connection issues
- API errors

## Common Error Messages and Fixes

### Error: "No active reviewers found"
**Fix:** Add active reviewers via User Control page

### Error: "Brevo API key not configured"
**Fix:** Check .env file has BREVO_API_KEY

### Error: "Request timeout"
**Fix:** Check internet connection and firewall settings

### Error: "Sender email not verified"
**Fix:** Verify noreply@sokapp.online in Brevo dashboard

### No errors but no emails received
**Fix:** 
1. Check spam/junk folder
2. Wait 2-3 minutes for delivery
3. Check Brevo dashboard for delivery status

## Quick Test Procedure

1. **Restart backend server**
2. **Open browser DevTools** (F12) → Network tab
3. **Create a new requisition** with your email as requestor
4. **Check Network tab** for POST to `/api/requisition`
5. **Check backend console** for email sending logs
6. **Check your email** (and spam folder)

## Expected Email Flow

```
User creates requisition
    ↓
Backend saves to database
    ↓
Backend fetches active reviewers
    ↓
Backend calls sendEmailNotification()
    ↓
Brevo API sends email
    ↓
Email delivered to reviewer's inbox
```

## Contact Support

If none of these solutions work, provide:
1. Backend console logs when creating requisition
2. Result of `node test-requisition-email.js`
3. Screenshot of User Control showing active reviewers
4. Your email address (to check Brevo delivery logs)
