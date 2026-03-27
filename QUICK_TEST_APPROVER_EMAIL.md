# Quick Test Guide: Approver Email Fix ✅

## What Was Fixed

The approver email notification was broken because the code was checking for signature changes **AFTER** updating the database, when all signatures were already saved. Now it checks the request data **BEFORE** updating the database.

## How to Test (3 Minutes)

### Step 1: Create a Test Requisition (1 min)

1. Open your app: http://localhost:3000
2. Go to **Requisitions** → **Create New**
3. Fill in:
   - Requestor: Your name
   - Department: Any department
   - Purpose: "Test requisition for approver email"
   - Date: Today's date
   - Add 1-2 items with amounts
4. Click **Submit** (don't add any signatures yet)
5. Note the requisition ID (e.g., #123)

### Step 2: Sign as Reviewer (30 sec)

1. Open the requisition you just created
2. Find the **Reviewer Signature** section
3. Add your signature (draw or upload)
4. Enter reviewer name
5. Click **Save** or **Update**

### Step 3: Check Approver Email (1 min)

**Immediately after saving:**

1. ✓ Check backend console output (should see debug messages)
2. ✓ Check approver email inbox: `sokem@shamidaethiopia.com`
3. ✓ Check spam folder if not in inbox
4. ✓ Also check: `sahlesokem@gmail.com`

**Expected Email Subject:**
```
Requisition Awaiting Approval - #123
```

**Expected Email Content:**
```
Hello [Approver Name],

A requisition has been reviewed and is awaiting your approval:

Requisition ID: #123
Requestor: [Your Name]
Department: [Department]
Purpose: Test requisition for approver email

[Approve Requisition Button]
```

## Expected Backend Console Output

When you sign as reviewer, you should see:

```
DEBUG: Checking signatures BEFORE database update...
DEBUG: Original reviewed_signature = NULL
DEBUG: New review signature in request? true
DEBUG: Will trigger approver notification? true
DEBUG: Original approved_signature = NULL
DEBUG: New approval signature in request? false
✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
Fetching active approvers from database...
Found 2 active approvers
Processing approver: yilkal sahle (sokem@shamidaethiopia.com)
Attempting to send approval notification to: sokem@shamidaethiopia.com (yilkal sahle)
✓ Approval notification sent successfully to sokem@shamidaethiopia.com (yilkal sahle)
Processing approver: System Administrator (sahlesokem@gmail.com)
Attempting to send approval notification to: sahlesokem@gmail.com (System Administrator)
✓ Approval notification sent successfully to sahlesokem@gmail.com (System Administrator)
```

## If Email Not Received

### Check 1: Verify Active Approvers
Run this SQL query:
```sql
SELECT u.email, u.full_name 
FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'approver' 
  AND rr.is_active = TRUE 
  AND u.is_active = TRUE;
```

**Expected:** 2 rows
- yilkal sahle (sokem@shamidaethiopia.com)
- System Administrator (sahlesokem@gmail.com)

### Check 2: Run Diagnostic Test
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
node test-approver-email.js
```

**Expected Output:**
```
=== Testing Approver Email Notification ===
✓ Connected to database
📋 Checking for active approvers...
Found 2 active approver(s):
  1. yilkal sahle (sokem@shamidaethiopia.com)
  2. System Administrator (sahlesokem@gmail.com)
🔑 Checking Brevo API configuration...
✓ Brevo API key found
📧 Testing email send to each approver...
✓ Email sent successfully! Message ID: <xxx>
✓ Email sent successfully! Message ID: <yyy>
=== Test Complete ===
```

### Check 3: Verify Brevo API Key
Open `Backend/.env` and confirm:
```
BREVO_API_KEY=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
EMAIL_FROM=sahlesokem@gmail.com
```

## Full Workflow Test (Optional)

To test the complete chain:

1. **Reviewer signs** → Approvers get email ✓
2. **Approver signs** → Authorizers get email ✓
3. **Authorizer signs** → Requester & Finance get email ✓

Each stage should trigger emails automatically.

## Success Indicators

✅ Backend shows "STAGE 1: NEW reviewer signature detected"  
✅ Backend shows "Found 2 active approvers"  
✅ Backend shows "Approval notification sent successfully" (×2)  
✅ Both approvers receive email within 1-2 minutes  
✅ Email subject includes requisition ID  
✅ Email content shows correct requisition details  

## Troubleshooting

### Problem: "No active approvers found" in logs
**Fix:** Activate approver roles
```sql
UPDATE requisition_roles 
SET is_active = TRUE 
WHERE role_type = 'approver';
```

### Problem: Emails going to spam
**Fix:** 
1. Add sender to contacts
2. Mark as "Not Spam"
3. Check Brevo sender reputation

### Problem: Only one approver receives email
**Fix:** Check both users are active
```sql
SELECT id, email, is_active 
FROM users 
WHERE id IN (
    SELECT user_id FROM requisition_roles WHERE role_type = 'approver'
);
```

### Problem: Backend shows "Will trigger approver notification? false"
**Possible causes:**
1. Reviewer signature already exists (can only trigger once)
2. Signature data not being sent in request
3. Database column mismatch

**Solution:** Create a NEW requisition and try again.

## Files Changed

- ✅ `Backend/server.js` - Fixed signature detection timing (Lines 1213-1252)
- ✅ `test-approver-email.js` - Created diagnostic test
- ✅ `FIX_APPROVER_EMAIL_NOTIFICATION.md` - Full documentation

## Next Steps After Testing

1. ✅ Test with a real requisition
2. ✅ Confirm both approvers receive email
3. ✅ Test full workflow (reviewer → approver → authorizer)
4. ✅ Monitor backend logs for any errors
5. ✅ Update documentation if needed

---

**Quick Start Command:**
```bash
# Restart backend and test
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

**Status:** ✅ Ready for testing  
**Backend:** Running on http://localhost:5000  
**Frontend:** Should be running on http://localhost:3000
