# Troubleshooting: Email Not Sending to Reviewers

## Problem
Emails are not being sent to reviewers when a new requisition is created.

---

## Solution Steps

### Step 1: Check Backend Logs
When you create a requisition, check the backend console for these specific messages:

**✅ Expected (Working):**
```
=== SENDING EMAIL TO REVIEWERS ===
Attempting to fetch active reviewers from database...
✓ requisition_roles table exists
Query result: Found 2 active reviewers
✓ Found 2 active reviewers:
  1. John Doe (john@example.com)
  2. Jane Smith (jane@example.com)

=== Processing Reviewer Email ===
Recipient: john@example.com (John Doe)
Calling sendEmailNotification function...
=== sendEmailNotification CALLED ===
✓ Brevo API key found
Sending email via Brevo API...
✅ Brevo API Response Status: 200
✅ Email sent successfully to john@example.com
```

**❌ Problem - No Reviewers:**
```
=== SENDING EMAIL TO REVIEWERS ===
⚠️  No active reviewers found in requisition_roles table
All requisition roles in database: []
```

**❌ Problem - API Key Missing:**
```
=== sendEmailNotification CALLED ===
❌ Brevo API key not configured in environment variables
Check .env file for BREVO_API_KEY
```

**❌ Problem - Brevo API Error:**
```
✅ Brevo API Response Status: 400
❌ ERROR SENDING EMAIL VIA BREVO
Brevo Error Message: Invalid sender email
```

---

### Step 2: Verify Database Setup

Run the SQL diagnostic script:
```bash
# In MySQL or phpMyAdmin, run:
source database/CHECK_REVIEWER_EMAIL.sql
```

Or manually run these queries:

#### Query 1: Check if requisition_roles table exists
```sql
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sokapptest' AND TABLE_NAME = 'requisition_roles';
```
**Expected:** Should return `requisition_roles`

#### Query 2: Check all requisition roles
```sql
SELECT rr.id, rr.user_id, rr.role_type, rr.is_active, u.email, u.full_name
FROM requisition_roles rr
LEFT JOIN users u ON rr.user_id = u.id
ORDER BY rr.role_type;
```
**Expected:** Should show at least one row with `role_type = 'reviewer'`

#### Query 3: Check active reviewers specifically
```sql
SELECT u.email, u.full_name
FROM requisition_roles rr
JOIN users u ON rr.user_id = u.id
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE AND u.is_active = TRUE;
```
**Expected:** Should return at least one reviewer with valid email

---

### Step 3: Common Issues & Fixes

#### Issue 1: No Reviewers in Database

**Symptoms:**
- Log shows: "No active reviewers found"
- SQL query returns 0 rows

**Solution:**
You need to add reviewer role to a user. Find your user ID first:
```sql
SELECT id, email, full_name FROM users WHERE is_active = TRUE;
```

Then assign reviewer role (replace `1` with your actual user ID):
```sql
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'reviewer', TRUE);
```

---

#### Issue 2: Reviewer Role Exists But Inactive

**Symptoms:**
- Reviewer exists but `is_active = FALSE`

**Solution:**
Activate the reviewer role:
```sql
UPDATE requisition_roles 
SET is_active = TRUE 
WHERE role_type = 'reviewer';
```

---

#### Issue 3: User Account Inactive

**Symptoms:**
- Reviewer role exists but user `is_active = FALSE`

**Solution:**
Activate the user account (replace `YOUR_USER_ID` with actual ID):
```sql
UPDATE users 
SET is_active = TRUE 
WHERE id = YOUR_USER_ID;
```

---

#### Issue 4: Brevo API Key Not Configured

**Symptoms:**
- Log shows: "Brevo API key not configured"

**Solution:**
1. Open `Backend/.env`
2. Add or verify:
```env
BREVO_API_KEY=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
EMAIL_FROM=noreply@sokapp.online
```
3. Restart the backend server

---

#### Issue 5: Invalid Sender Email

**Symptoms:**
- Brevo returns error: "Invalid sender email"
- Log shows HTTP 400 or 401 error

**Solution:**
1. Verify `EMAIL_FROM` in `.env` matches your Brevo verified sender
2. Check Brevo dashboard at https://app.brevo.com/settings/senders
3. Ensure the domain/email is verified in Brevo

---

#### Issue 6: Network/Firewall Blocking Brevo

**Symptoms:**
- Log shows: "No Response Received - Network Error?"
- Timeout errors

**Solution:**
1. Check firewall settings
2. Verify internet connection
3. Test Brevo API manually:
```bash
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "api-key: YOUR_API_KEY" \
  -d "{\"sender\":{\"email\":\"noreply@sokapp.online\"},\"to\":[{\"email\":\"test@example.com\"}],\"subject\":\"Test\",\"htmlContent\":\"<html><body>Test</body></html>}"
```

---

### Step 4: Test Email Manually

Create a test endpoint to verify Brevo is working:

**File:** `Backend/server.js` (add this temporary endpoint)

```javascript
// TEST ENDPOINT - Remove after testing
app.get('/api/test-email', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const result = await sendEmailNotification(
            'your-email@example.com', // Replace with your email
            'Test Email from SOKAPP',
            '<html><body><h1>Test Successful!</h1><p>If you see this, email is working.</p></body></html>'
        );
        
        res.json({
            success: result.success,
            message: result.success ? 'Email sent!' : 'Failed to send',
            details: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await connection.end();
    }
});
```

**Test it:**
```
GET http://localhost:5000/api/test-email
```

Check your inbox. If you receive the email, Brevo is working correctly.

---

### Step 5: Verify Frontend is Calling Correct Endpoint

Check that the frontend is calling the correct API endpoint:

**File:** `src/config/api.js`
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

**File:** `.env` (in root directory)
```env
REACT_APP_API_URL=http://localhost:5000
```

---

### Step 6: Check CORS Settings

If you're getting CORS errors, verify in `Backend/server.js`:

```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
```

---

## Quick Fix Checklist

- [ ] Backend server is running on port 5000
- [ ] Database has `requisition_roles` table
- [ ] At least one user has `reviewer` role in `requisition_roles`
- [ ] Reviewer role has `is_active = TRUE`
- [ ] User account has `is_active = TRUE`
- [ ] `BREVO_API_KEY` is set in `.env`
- [ ] `EMAIL_FROM` is set in `.env`
- [ ] Sender email is verified in Brevo dashboard
- [ ] Internet connection is working
- [ ] Firewall allows outbound HTTPS to api.brevo.com

---

## Debug Mode: Enable Verbose Logging

The code already includes enhanced logging. When you create a requisition, you should see:

1. ✅ Table existence check
2. ✅ All roles in database
3. ✅ Number of reviewers found
4. ✅ Each reviewer's details
5. ✅ Email sending attempt
6. ✅ Brevo API response
7. ✅ Success/failure status

If any of these steps are missing, that's where the problem is!

---

## Still Not Working?

### Collect Debug Information

Run this and share the output:

```sql
-- Copy the results of these queries:
SELECT 'TABLE EXISTS:' as check_type;
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'sokapptest' AND TABLE_NAME = 'requisition_roles';

SELECT 'ALL ROLES:' as check_type;
SELECT * FROM requisition_roles;

SELECT 'ACTIVE USERS:' as check_type;
SELECT id, email, full_name, is_active FROM users WHERE is_active = TRUE;

SELECT 'ACTIVE REVIEWERS:' as check_type;
SELECT u.email, u.full_name 
FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE AND u.is_active = TRUE;
```

### Check Backend Console Output

Copy the entire console output from when you create a requisition and look for:
- ❌ Error messages (red text)
- ⚠️ Warnings (yellow text)
- The exact point where it fails

### Test Brevo API Directly

Use Postman or curl to test Brevo directly:

```bash
curl -X POST \
  https://api.brevo.com/v3/smtp/email \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  -H 'api-key: YOUR_BREVO_API_KEY' \
  -d '{
  "sender": {"email": "noreply@sokapp.online"},
  "to": [{"email": "your-personal-email@gmail.com"}],
  "subject": "Direct Brevo Test",
  "htmlContent": "<html><body><h1>Direct API Test</h1></body></html>"
}'
```

If this works but the app doesn't, the issue is in the Node.js code.
If this fails, the issue is with Brevo or your API key.

---

## Related Files

- **Main Code:** `Backend/server.js` (lines 600-750, 3018-3115)
- **Environment:** `Backend/.env`
- **SQL Script:** `database/CHECK_REVIEWER_EMAIL.sql`
- **Documentation:** `REQUISITION_EMAIL_WORKFLOW.md`

---

## Next Steps After Fix

Once you've fixed the issue:

1. ✅ Create a test requisition
2. ✅ Check reviewer receives email
3. ✅ Verify email contains correct link
4. ✅ Click link to ensure it works
5. ✅ Monitor backend logs for confirmation

---

## Contact Support

If none of these steps work, check:
- Brevo service status: https://status.brevo.com/
- Brevo documentation: https://developers.brevo.com/
- Your Brevo account dashboard for any alerts or restrictions
