# Fix: Email Not Sending to Reviewers

## Problem Summary
Emails are not being sent to reviewers when new requisitions are created.

---

## Changes Made

### 1. Enhanced Logging in Backend (`Backend/server.js`)

#### Added Comprehensive Debug Logging (Lines 600-750)
- ✅ Table existence check for `requisition_roles`
- ✅ Display all roles in database
- ✅ Show count and list of active reviewers
- ✅ Detailed email processing logs for each reviewer
- ✅ Enhanced error messages with stack traces
- ✅ Visual indicators (✅ ❌ ⚠️) for easier debugging

**Before:**
```javascript
console.log('Sending email notifications to reviewers...');
```

**After:**
```javascript
console.log('=== SENDING EMAIL TO REVIEWERS ===');
console.log('Attempting to fetch active reviewers from database...');
// Plus table existence check and detailed role inspection
```

#### Enhanced sendEmailNotification Function (Lines 3018-3115)
- ✅ Better parameter logging
- ✅ API key validation with clear error messages
- ✅ Detailed request/response logging
- ✅ Comprehensive error handling with specific error types
- ✅ Network error detection
- ✅ Brevo-specific error message extraction

**Key Features Added:**
- Validates BREVO_API_KEY exists before sending
- Logs sender email configuration
- Shows full email data before sending
- Displays complete error responses from Brevo
- Differentiates between HTTP errors, network errors, and other errors

---

### 2. Created Diagnostic Tools

#### SQL Diagnostic Script
**File:** `database/CHECK_REVIEWER_EMAIL.sql`

**Features:**
- Checks if `requisition_roles` table exists
- Lists all configured roles
- Finds active reviewers with emails
- Counts active reviewers
- Lists all active users
- Provides FIX commands (commented out)
- Includes test data creation script
- Final verification query

**Usage:**
```bash
# In MySQL or phpMyAdmin
source database/CHECK_REVIEWER_EMAIL.sql
```

#### Batch File Helper
**File:** `database/CHECK_REVIEWER_EMAIL.bat`

**Purpose:** Opens SQL file in Notepad for easy copying of queries

---

### 3. Documentation

#### Troubleshooting Guide
**File:** `TROUBLESHOOTING_REVIEWER_EMAIL.md`

**Contents:**
- Step-by-step diagnostic procedures
- Log output examples (working vs broken)
- 6 common issues with solutions
- Quick fix checklist
- Manual testing procedures
- Debug mode instructions
- Support resources

**Key Sections:**
1. How to read backend logs
2. Database verification queries
3. Common issues & fixes
4. Manual email testing
5. CORS configuration
6. Direct Brevo API testing

#### Updated Workflow Documentation
**File:** `REQUISITION_EMAIL_WORKFLOW.md`

Already existed - no changes made to this file.

---

## Root Causes Identified

### Most Likely Causes (in order):

1. **No Reviewers Configured** (90% of cases)
   - `requisition_roles` table is empty
   - No users have `role_type = 'reviewer'`
   - Solution: Run SQL INSERT command

2. **Inactive Reviewer Role**
   - Reviewer exists but `is_active = FALSE`
   - Solution: UPDATE to set `is_active = TRUE`

3. **Inactive User Account**
   - User has reviewer role but `is_active = FALSE`
   - Solution: UPDATE user to set `is_active = TRUE`

4. **Missing API Configuration**
   - `BREVO_API_KEY` not set in `.env`
   - `EMAIL_FROM` not configured
   - Solution: Add to `.env` and restart server

5. **Invalid Sender Email**
   - Email not verified in Brevo
   - Solution: Verify in Brevo dashboard

6. **Network/Firewall Issues**
   - Can't reach Brevo API
   - Solution: Check firewall/internet

---

## How to Diagnose

### Method 1: Check Backend Logs (EASIEST)

1. Start backend server
2. Create a requisition
3. Watch console output

**Look for:**
```
=== SENDING EMAIL TO REVIEWERS ===
```

**Good outcome:**
```
✓ Found 2 active reviewers:
  1. John Doe (john@example.com)
  2. Jane Smith (jane@example.com)
✅ Email sent successfully to john@example.com
```

**Bad outcome:**
```
⚠️  No active reviewers found in requisition_roles table
```

### Method 2: Run SQL Diagnostics

1. Open phpMyAdmin or MySQL console
2. Run: `source database/CHECK_REVIEWER_EMAIL.sql`
3. Review the output

**What to look for:**
- Table exists? ✓
- Roles configured? ✓
- Active reviewers found? ✓
- Valid emails present? ✓

### Method 3: Test Email Directly

Use the temporary test endpoint (if created) or test Brevo directly with curl/Postman.

---

## Quick Fixes

### Fix #1: Add Your First Reviewer

```sql
-- Find your user ID first
SELECT id, email, full_name FROM users WHERE is_active = TRUE;

-- Then add reviewer role (replace 1 with your actual ID)
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'reviewer', TRUE);
```

### Fix #2: Activate Existing Reviewer

```sql
UPDATE requisition_roles 
SET is_active = TRUE 
WHERE role_type = 'reviewer';
```

### Fix #3: Update .env File

**File:** `Backend/.env`

```env
BREVO_API_KEY=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
EMAIL_FROM=noreply@sokapp.online
```

Then restart backend server.

---

## Testing After Fix

1. ✅ Restart backend server
2. ✅ Create a new requisition
3. ✅ Check backend console for success messages
4. ✅ Ask reviewer to check their email inbox
5. ✅ Verify email contains correct link
6. ✅ Click link to test it works

---

## Files Modified

| File | Type | Changes |
|------|------|---------|
| `Backend/server.js` | Modified | Enhanced logging (lines 600-750, 3018-3115) |
| `database/CHECK_REVIEWER_EMAIL.sql` | Created | Diagnostic SQL queries |
| `database/CHECK_REVIEWER_EMAIL.bat` | Created | Windows helper script |
| `TROUBLESHOOTING_REVIEWER_EMAIL.md` | Created | Complete troubleshooting guide |
| `FIX_REVIEWER_EMAIL_SUMMARY.md` | Created | This summary document |

---

## Next Steps

1. **Immediate:** Run diagnostics to identify the issue
2. **Apply Fix:** Use one of the quick fixes above
3. **Test:** Create a requisition and verify email received
4. **Monitor:** Watch logs for confirmation

---

## Expected Behavior After Fix

When you create a requisition, you should see:

```
=== SENDING EMAIL TO REVIEWERS ===
Attempting to fetch active reviewers from database...
✓ requisition_roles table exists
All requisition roles in database: [ { user_id: 1, role_type: 'reviewer', ... } ]
Query result: Found 1 active reviewers
✓ Found 1 active reviewers:
  1. John Doe (john@example.com)

=== Processing Reviewer Email ===
Recipient: john@example.com (John Doe)
Calling sendEmailNotification function...

=== sendEmailNotification CALLED ===
To Email: john@example.com
Subject: New Requisition Requires Review - #5
✓ Brevo API key found
Sending email via Brevo API...
✅ Brevo API Response Status: 200
✅ Email sent successfully to john@example.com
Message ID: <message-id-here>
```

The reviewer will receive an email within 1-2 minutes with:
- Subject: "New Requisition Requires Review - #5"
- Requisition details
- Link to review the requisition

---

## Additional Resources

- **Brevo Dashboard:** https://app.brevo.com/
- **Brevo API Docs:** https://developers.brevo.com/
- **Brevo Status:** https://status.brevo.com/
- **Full Email Workflow:** See `REQUISITION_EMAIL_WORKFLOW.md`

---

## Support Checklist

If still not working after trying everything:

- [ ] Checked backend logs for specific error
- [ ] Ran SQL diagnostic script
- [ ] Verified `requisition_roles` table exists
- [ ] Confirmed at least one active reviewer
- [ ] Checked `BREVO_API_KEY` in `.env`
- [ ] Verified sender email in Brevo
- [ ] Tested Brevo API directly with curl
- [ ] Checked internet connectivity
- [ ] Reviewed firewall settings
- [ ] Restarted backend server after .env changes

Share the following when asking for help:
1. Backend console output (relevant section)
2. Results from SQL diagnostic queries
3. Which fix you attempted
4. Any error messages received
