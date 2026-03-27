# Requisition Email Troubleshooting Guide

## Summary

✅ **Email System Status: WORKING**

All tests confirm that the requisition email system is functional:
- ✅ Brevo API is configured and responding
- ✅ Email sender address is configured (`EMAIL_FROM`)
- ✅ Database has users in all roles (reviewers, approvers, authorizers, finance)
- ✅ `sendEmailNotification()` function works correctly
- ✅ Test emails are sent successfully

## Test Results

### 1. Basic Email Test
```bash
node test-requisition-email.js
```
**Result:** ✅ PASS - Test email sent successfully to reviewer

### 2. Workflow Simulation Test
```bash
node debug-requisition-workflow.js
```
**Result:** ✅ PASS - Emails sent to both requestor and finance team

### 3. Database Check
- Reviewers: 2 active users
- Approvers: 2 active users  
- Authorizers: 1 active user
- Finance: 1 active user
- Requisitions: Multiple with various statuses

## Email Workflow Logic

The system sends emails at 4 stages:

### Stage 1: Reviewer Signs → Notify Approvers
**Trigger:** `reviewed_signature` changes from NULL to base64 string
**Recipients:** All active users with `approver` role
**Code:** server.js lines 1325-1393

### Stage 2: Approver Signs → Notify Authorizers
**Trigger:** `approved_signature` changes from NULL to base64 string
**Recipients:** All active users with `authorizer` role
**Code:** server.js lines 1395-1465

### Stage 3: Authorizer Signs → Notify Requester + Finance
**Trigger:** `authorized_signature` changes from NULL to base64 string
**Recipients:** 
- Requester (`requestor_email`)
- All active users with `finance` role
**Code:** server.js lines 1467-1602

### Stage 4: Requisition Rejected → Notify Requester
**Trigger:** Requisition status changes to 'rejected'
**Recipient:** Requester (`requestor_email`)
**Code:** server.js lines 1266-1377

## Troubleshooting Steps

### If Emails Are NOT Being Sent:

#### 1. Check Server is Running
```bash
cd Backend
npm start
```
Look for: `Server running on http://localhost:5000`

#### 2. Enable Detailed Logging
When signing a requisition, watch the server console for:

```
=== RECEIVING REQUISITION UPDATE ===
Requisition ID: XX
DEBUG: Checking signatures BEFORE database update...
DEBUG: Original reviewed_signature = NULL
DEBUG: New review signature in request? EXISTS
DEBUG: Will trigger approver notification? true
✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
Found X active approvers
Attempting to send approval notification to: email@example.com
✅ Approval notification sent successfully to email@example.com
```

#### 3. Verify Frontend is Sending Data
In browser console (F12), look for:

```javascript
=== SAVING SIGNATURE CHANGES ===
Payload: {
  "reviewed_signature": "data:image/png;base64,...",
  "reviewed_by": "John Doe"
}
```

#### 4. Check Network Tab
In browser DevTools → Network tab:
- Look for PUT request to: `http://localhost:5000/api/requisition/XX`
- Check Status: Should be `200 OK`
- Check Response: Should contain `"success": true`

#### 5. Verify Signature Detection Logic
The backend detects new signatures with:

```javascript
const isNewReview = !originalRequisition.reviewed_signature && reviewedSignature;
```

This checks:
- Original value was NULL
- New value exists (not null/undefined)

If both conditions are true, email workflow triggers.

## Common Issues & Solutions

### Issue 1: No Console Logs Appearing
**Cause:** Server not running or crashed
**Solution:** Restart server: `npm start` in Backend folder

### Issue 2: "Brevo API key not configured" Error
**Cause:** Missing `.env` file or missing `BREVO_API_KEY`
**Solution:** 
1. Check `Backend/.env` exists
2. Verify `BREVO_API_KEY=your_api_key_here`
3. Restart server

### Issue 3: "No active approvers found" Warning
**Cause:** No users in `requisition_roles` table
**Solution:** Run SQL:
```sql
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'approver', TRUE);
```

### Issue 4: Email Not Received in Inbox
**Cause:** Email delivery delay or spam filter
**Solution:**
1. Check spam/junk folder
2. Wait up to 5 minutes
3. Verify recipient email address is correct
4. Check Brevo dashboard for delivery status

### Issue 5: Frontend Shows Success But No Email
**Possible Causes:**
- Email sending failed silently (check server logs)
- Wrong email address in database
- Brevo API rate limit reached

**Solution:** Check server console for error messages

## Manual Testing Procedure

### Test Stage 1 (Reviewer → Approvers)
1. Create a new requisition
2. Log in as reviewer
3. Add review signature and submit
4. Watch server logs for: `✓ STAGE 1: NEW reviewer signature detected`
5. Check approver email inbox

### Test Stage 2 (Approver → Authorizers)
1. Use requisition that has been reviewed
2. Log in as approver
3. Add approval signature and submit
4. Watch server logs for: `✓ STAGE 2: NEW approver signature detected`
5. Check authorizer email inbox

### Test Stage 3 (Authorizer → Requester + Finance)
1. Use requisition that has been approved
2. Log in as authorizer
3. Add authorization signature and submit
4. Watch server logs for: `✓ STAGE 3: NEW authorization signature detected`
5. Check requester AND finance team email inboxes

## Diagnostic Commands

Run these tests in order:

```bash
# Test 1: Basic email functionality
cd Backend
node test-requisition-email.js

# Test 2: Full workflow simulation
node debug-requisition-workflow.js

# Test 3: Check signature storage format
node check-signature-storage.js

# Test 4: Check role assignments
node -e "require('dotenv').config(); const mysql = require('mysql2/promise'); (async () => { const c = await mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME}); const [r] = await c.execute('SELECT role_type, COUNT(*) as count FROM requisition_roles WHERE is_active = TRUE GROUP BY role_type'); console.log(r); await c.end(); })()"
```

## Code Locations

### Main Files
- **Backend Email Function:** `server.js` lines 3403-3520
- **Workflow Stage 1:** `server.js` lines 1325-1393
- **Workflow Stage 2:** `server.js` lines 1395-1465
- **Workflow Stage 3:** `server.js` lines 1467-1602
- **Frontend Signature Handling:** `src/components/Requisition/Requisition.js` lines 316-365

### Environment Variables
Required in `Backend/.env`:
```env
BREVO_API_KEY=your_api_key_here
EMAIL_FROM=your_verified_email@example.com
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sokapp_db
```

## Support Checklist

If still experiencing issues, provide:
1. [ ] Server console output when signing requisition
2. [ ] Browser console output when submitting signature
3. [ ] Network tab screenshot showing request/response
4. [ ] Output from `node test-requisition-email.js`
5. [ ] List of active users in requisition_roles table
6. [ ] Status of most recent requisition with all signatures

---

**Last Updated:** March 20, 2026
**Status:** Email system functional - issue likely in workflow detection or server runtime
