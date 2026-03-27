# Troubleshooting: Approver Still Not Getting Email

## Current Status
- ✅ Backend code updated with fix
- ✅ Server restarted  
- ⚠️ Testing in progress

## Step-by-Step Diagnosis

### Step 1: Verify Backend is Running Updated Code

```bash
# Check backend console output
# Should see this when server starts:
[dotenv@17.3.1] injecting env (18) from .env
Server running on http://localhost:5000
```

**If you DON'T see this:**
```bash
# Kill all node processes and restart
taskkill /F /IM node.exe
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

---

### Step 2: Create Test Requisition

1. Open app: http://localhost:3000
2. Go to Requisitions → Create New
3. Fill in:
   - Requestor: "Test User"
   - Department: "Program"
   - Purpose: "Testing approver email"
   - Add 1 item with price
   - Sign as requestor
4. Submit
5. Note the requisition ID (e.g., #97)

---

### Step 3: Run Live Test

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
node test-reviewer-signature-live.js
```

**Expected Output:**
```
=== Testing Reviewer Signature & Email Notification ===

✓ Found requisition #97
  Requestor: Test User
  Department: Program
  Status: pending

Found 2 active approver(s):
  1. yilkal sahle (sokem@shamidaethiopia.com)
  2. System Administrator (sahlesokem@gmail.com)

📋 Step 3: Sending reviewer signature to backend...

Payload being sent:
{
  "reviewedSignature": "data:image/png;base64,...",
  "reviewedBy": "Test Reviewer"
}

✅ Backend Response:
Status: 200
Data: "SUCCESS"

📋 Step 4: Verifying signature was saved...
Reviewed signature: ✓ SAVED
Reviewed by: Test Reviewer
Requestor name preserved: Test User
Department preserved: Program

📋 Step 5: Check Backend Console Output
Look for these messages in the backend server log:

  ✓ "DEBUG: Will trigger approver notification? true"
  ✓ "STAGE 1: NEW reviewer signature detected"
  ✓ "Fetching active approvers from database..."
  ✓ "Found 2 active approvers"
  ✓ "Approval notification sent successfully"
```

---

## What to Check in Backend Console

### ✅ SUCCESS Indicators

When you sign as reviewer, backend console MUST show:

```
DEBUG: Checking signatures BEFORE database update...
DEBUG: Original reviewed_signature = NULL
DEBUG: New review signature in request? true
DEBUG: Will trigger approver notification? true
DEBUG: Update data prepared - preserving existing values
DEBUG: Requisition data preserved successfully
DEBUG: requestor_name = Test User
DEBUG: department = Program
DEBUG: purpose = Testing approver email
✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
Fetching active approvers from database...
Found 2 active approvers
Processing approver: yilkal sahle (sokem@shamidaethiopia.com)
Attempting to send approval notification to: sokem@shamidaethiopia.com (yilkal sahle)
✓ Approval notification sent successfully to sokem@shamidaethiopia.com (yilkal sahle)
Processing approver: System Administrator (sahlesokem@gmail.com)
✓ Approval notification sent successfully to sahlesokem@gmail.com (System Administrator)
```

---

### ❌ FAILURE Scenarios

#### Scenario A: No Debug Messages Appear

**Problem:** Backend is not running the updated code

**Solution:**
```bash
# Kill ALL node processes
taskkill /F /IM node.exe

# Wait 3 seconds
Start-Sleep -Seconds 3

# Restart backend
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

#### Scenario B: Shows "Will trigger approver notification? false"

**Problem:** Signature detection logic not working

**Possible Causes:**
1. `reviewedSignature` not being sent in request
2. Original requisition already has signature
3. Variable name mismatch

**Debug:**
```sql
-- Check if signature already exists
SELECT id, reviewed_signature 
FROM requisitions 
WHERE id = [your_id];
```

#### Scenario C: Shows "No active approvers found"

**Problem:** Approvers not configured correctly

**Solution:**
```sql
-- Check approver roles
SELECT u.email, u.full_name, rr.is_active as role_active, u.is_active as user_active
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'approver';

-- Activate if needed
UPDATE requisition_roles SET is_active = TRUE WHERE role_type = 'approver';
```

#### Scenario D: Email Send Fails

**Problem:** Brevo API error or network issue

**Check Backend Console For:**
```
❌ ERROR SENDING EMAIL VIA BREVO
HTTP 401: Unauthorized
Error: Invalid API key
```

**Solution:**
1. Verify BREVO_API_KEY in Backend/.env
2. Check Brevo account is active
3. Verify sender email is verified in Brevo

---

### Step 4: Check Email Inbox

After backend shows "Approval notification sent successfully":

1. **Check immediately** (within 1-2 minutes)
2. **Check spam/junk folder**
3. **Check both approvers:**
   - sokem@shamidaethiopia.com
   - sahlesokem@gmail.com

**Email Subject:**
```
Requisition Awaiting Approval - #97
```

---

### Step 5: Run Diagnostic Test

If still no email received:

```bash
node test-approver-email-diagnostic.js 97
```

This will:
- Check requisition details
- Verify approver configuration
- Test Brevo API directly
- Send test email

---

## Common Issues & Solutions

### Issue 1: Multiple Node Processes Running

**Symptom:** Changes don't take effect

**Solution:**
```bash
# Windows PowerShell
Get-Process node
taskkill /F /IM node.exe

# Verify only ONE instance starts
# Look for: "Server running on http://localhost:5000"
```

### Issue 2: Old Code Cached

**Symptom:** Debug messages don't appear

**Solution:**
```bash
# Complete restart
taskkill /F /IM node.exe
Start-Sleep -Seconds 5
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### Issue 3: Frontend Sends Wrong Field Names

**Symptom:** Backend receives undefined

**Check Frontend Code:**
- Should send: `reviewedSignature`, `reviewedBy`
- NOT: `reviewed_signature`, `reviewed_by`

**Verify in Browser DevTools:**
1. Open DevTools → Network tab
2. Click Save Signature
3. Check request payload
4. Verify field names match backend expectations

### Issue 4: Database Connection Issues

**Symptom:** Can't fetch approvers

**Solution:**
```bash
# Test database connection
node -e "const mysql = require('mysql2/promise'); require('dotenv').config(); (async () => { const c = await mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME}); await c.execute('SELECT 1'); console.log('DB Connected OK'); await c.end(); })()"
```

---

## Quick Fix Checklist

Run through these IN ORDER:

- [ ] 1. Backend server restarted (killed all old instances)
- [ ] 2. Backend console shows debug messages
- [ ] 3. Active approvers exist in database
- [ ] 4. Brevo API key configured
- [ ] 5. Test requisition created
- [ ] 6. Reviewer signature added via frontend
- [ ] 7. Backend logs show "Will trigger approver notification? true"
- [ ] 8. Backend logs show "Approval notification sent successfully"
- [ ] 9. Email inbox checked (including spam)
- [ ] 10. Diagnostic test passes

---

## Escalation Path

If STILL not working after all steps:

1. **Save backend console output** to file
2. **Run diagnostic tests** and save output
3. **Check exact error messages** in backend log
4. **Verify database state** with SQL queries

Then we can investigate the specific error.

---

**Last Updated:** March 16, 2026  
**Status:** Debugging in progress  
**Next Action:** Run live test and check backend console
