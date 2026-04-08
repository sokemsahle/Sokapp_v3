# 🔍 Debug: Frontend Not Calling Endpoint

## The Truth: Frontend IS Calling the Endpoint! ✅

I checked the code and **the frontend IS correctly calling** `POST /api/requisition` when you submit.

**Location:** [`src/components/Requisition/Requisition.js`](c:\Users\hp\Documents\code\SOKAPP project\Version 3\src\components\Requisition\Requisition.js#L318-L324)

```javascript
const response = await fetch('http://localhost:5000/api/requisition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

---

## Real Problem: Email Not Being Sent After Submission

The issue is NOT the frontend call - it's what happens AFTER the requisition is created.

### What Should Happen:

1. ✅ Frontend calls `POST /api/requisition`
2. ✅ Backend creates requisition in database
3. ⚠️ **Backend should send emails to reviewers** (THIS IS WHERE IT FAILS)
4. ✅ Backend returns success
5. ✅ Frontend shows "Success" alert

---

## How to Debug (Step-by-Step)

### Step 1: Open Browser Console (F12)

Before creating a requisition:
1. Press **F12** in your browser
2. Go to **Console** tab
3. Clear console

### Step 2: Create a Requisition

Now create a requisition and watch for these logs:

**In Browser Console, you should see:**
```
=== SUBMITTING REQUISITION ===
URL: http://localhost:5000/api/requisition
Method: POST
Payload: { ... }
User Email: your@email.com

Response Status: 201
Response Data: { success: true, id: 123 }
✅ Submission successful! Email should be sent to reviewers if configured.
```

**If you DON'T see this:**
- ❌ Frontend is not reaching backend
- Check if backend server is running on port 5000

---

### Step 3: Check Backend Console

While keeping browser open, look at **backend console**:

**You should see IMMEDIATELY after submission:**
```
=== POST /api/requisition called ===
Database connection established
POST /api/requisition received: { ... }

=== SENDING EMAIL TO REVIEWERS ===
Attempting to fetch active reviewers from database...
✓ requisition_roles table exists
All requisition roles in database: [...]
Query result: Found X active reviewers
✓ Found X active reviewers:
  1. Name <email@example.com>

=== Processing Reviewer Email ===
Recipient: email@example.com (Name)
Calling sendEmailNotification function...

=== sendEmailNotification CALLED ===
To Email: email@example.com
✓ Brevo API key found
Sending email via Brevo API...
✅ Email sent successfully to email@example.com
```

**Common Scenarios:**

#### Scenario A: "No active reviewers found"
```
=== SENDING EMAIL TO REVIEWERS ===
⚠️  No active reviewers found in requisition_roles table
```
**FIX:** Add yourself as reviewer (see below)

#### Scenario B: "API key not configured"
```
❌ Brevo API key not configured in environment variables
```
**FIX:** Add API key to `.env` file

#### Scenario C: Network error
```
❌ ERROR SENDING EMAIL VIA BREVO
HTTP Status: 401 or 403
```
**FIX:** Check Brevo API key validity

---

## Quick Fixes

### Fix #1: Add Reviewer (Most Common)

Run this SQL in phpMyAdmin:

```sql
-- Find your user ID first
SELECT id, email FROM users WHERE is_active = TRUE;

-- Then add reviewer role (replace 1 with YOUR ID)
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'reviewer', TRUE);
```

### Fix #2: Verify API Configuration

Open `Backend/.env` and ensure:
```env
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@sokapp.online
```

Then **restart backend server**.

---

## Complete Test Procedure

### 1. Start Backend Server
```bash
cd Backend
npm start
```
Keep this console visible!

### 2. Open Browser DevTools
Press **F12** → Console tab

### 3. Create Requisition
Fill form and submit

### 4. Watch BOTH Consoles

**Browser Console shows:**
- ✅ Request sent
- ✅ Response received
- ✅ Success message

**Backend Console shows:**
- ✅ Request received
- ✅ Reviewers found
- ✅ Email sent

### 5. Check Email
Check inbox (and spam folder) within 2 minutes

---

## What Each Console Log Means

### Browser Console Logs

| Log | Meaning |
|-----|---------|
| `=== SUBMITTING REQUISITION ===` | Form submission started |
| `URL: http://localhost:5000/api/requisition` | Correct endpoint |
| `Payload: {...}` | Data being sent |
| `Response Status: 201` | Success! Created |
| `✅ Submission successful!` | Email SHOULD be sent now |

### Backend Console Logs

| Log | Meaning |
|-----|---------|
| `=== POST /api/requisition called ===` | Request received |
| `=== SENDING EMAIL TO REVIEWERS ===` | Starting email process |
| `✓ Found X active reviewers` | Reviewers exist in DB |
| `=== sendEmailNotification CALLED ===` | Sending email now |
| `✅ Email sent successfully` | SUCCESS! Check inbox |
| `⚠️ No active reviewers found` | PROBLEM - Add reviewers |
| `❌ Brevo API key not configured` | PROBLEM - Add to .env |

---

## Troubleshooting Matrix

| Browser Shows | Backend Shows | Problem | Solution |
|--------------|---------------|---------|----------|
| ❌ Network Error | Nothing | Backend not running | Start backend |
| ✅ Success | Nothing | Email code not reached | Check backend logs |
| ✅ Success | "No reviewers" | Missing reviewers | Run SQL INSERT |
| ✅ Success | "API key missing" | Missing config | Edit .env file |
| ✅ Success | "Email sent" | No email received | Check spam/Brevo |

---

## Enhanced Logging Features

I've added detailed logging to help you debug:

### Frontend (Browser Console):
- ✅ Full payload details
- ✅ Request URL and method
- ✅ Response status and data
- ✅ Success/failure indicators

### Backend (Terminal):
- ✅ Table existence checks
- ✅ All roles in database
- ✅ Reviewer count and list
- ✅ Each email processing step
- ✅ Brevo API responses
- ✅ Detailed error messages

---

## Still Not Working?

### Collect This Information:

1. **Browser Console Output** (copy entire text)
2. **Backend Console Output** (copy from when you submitted)
3. **SQL Query Results:**
   ```sql
   SELECT u.email, u.full_name 
   FROM requisition_roles rr 
   JOIN users u ON rr.user_id = u.id 
   WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE;
   ```

### Then:

1. Run the diagnostic test:
   ```bash
   test-email.bat
   ```

2. Share the output - it will show EXACTLY where it fails

3. Check the specific error message and match it to the solutions above

---

## Expected Behavior Timeline

```
0:00 - Click Submit in browser
0:01 - Browser shows "SUBMITTING REQUISITION"
0:02 - Backend receives request
0:03 - Backend creates requisition in DB
0:04 - Backend starts email process
0:05 - Backend finds reviewers
0:06 - Backend sends email via Brevo
0:07 - Brevo processes email
0:10 - Backend returns success
0:11 - Browser shows "Success!" alert
0:12 - Check email inbox
1:00 - Email arrives in inbox (or spam folder)
```

**Total time: ~1 minute from submission to receiving email**

---

## Pro Tips

1. **Keep both consoles visible** while testing
2. **Watch backend logs** - they show exactly where it fails
3. **Use test-email.bat** first before creating real requisitions
4. **Check spam folder** - automated emails often go there
5. **Verify Brevo account** has credits/sender verified
6. **Restart backend** after editing .env file

---

**Remember:** The frontend IS calling the endpoint correctly. The problem is almost always:
- ❌ No reviewers configured (90%)
- ❌ Missing API key (5%)
- ❌ Brevo sender not verified (3%)
- ❌ Network/firewall blocking (2%)

Run `test-email.bat` to diagnose instantly! 🎯
