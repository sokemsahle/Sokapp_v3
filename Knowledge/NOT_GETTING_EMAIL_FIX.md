# 🚨 NOT GETTING EMAILS? - STEP-BY-STEP FIX

## Quick Diagnosis (2 minutes)

### Step 1: Run the Email Test

**Option A: Use the batch file (Easiest)**
```bash
test-email.bat
```

**Option B: Run manually**
```bash
node test-email-setup.js
```

This will tell you EXACTLY what's wrong.

---

## Most Likely Problem (95% of cases)

### ❌ NO REVIEWERS IN DATABASE

When you run the test, if you see:
```
❌ FAIL: No active reviewers found!
```

**FIX IT NOW:**

1. **Find your user ID:**
```sql
SELECT id, email, full_name FROM users WHERE is_active = TRUE;
```

2. **Add yourself as reviewer** (replace `1` with YOUR ID):
```sql
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'reviewer', TRUE);
```

3. **Verify it worked:**
```sql
SELECT u.email, u.full_name 
FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE;
```

4. **Test again:** Run `test-email.bat` or create a requisition

---

## Other Common Issues

### Issue 2: API Key Missing

**Symptom:** Test shows "BREVO_API_KEY not configured"

**Fix:**
1. Open `Backend/.env`
2. Verify these lines exist:
```env
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@sokapp.online
```
3. Restart backend server

---

### Issue 3: Brevo Sender Not Verified

**Symptom:** Test email fails with "Invalid sender" error

**Fix:**
1. Go to https://app.brevo.com/settings/senders
2. Verify `noreply@sokapp.online` is added and verified
3. Or change `EMAIL_FROM` in `.env` to your verified email

---

### Issue 4: Emails Going to Spam

**Symptom:** Test says success but no email received

**Fix:**
1. Check spam/junk folder
2. Add Brevo to safe senders list
3. Check with your IT admin about email filtering

---

## Manual Testing Method

### Method 1: Test Endpoint

1. **Start backend server** (if not running)
2. **Open browser:** http://localhost:5000/api/test/send-reviewer-email
3. **Check result:** Should show success message
4. **Check email:** Within 1-2 minutes

### Method 2: Create Requisition + Watch Logs

1. **Open backend console** (keep it visible)
2. **Create a requisition** in the app
3. **Watch for these logs:**

**GOOD (Working):**
```
=== SENDING EMAIL TO REVIEWERS ===
✓ Found 1 active reviewers
  1. Your Name <your@email.com>
✅ Email sent successfully to your@email.com
```

**BAD (Not Working):**
```
=== SENDING EMAIL TO REVIEWERS ===
⚠️  No active reviewers found in requisition_roles table
```

---

## Complete Fix Checklist

Run through this checklist systematically:

- [ ] **Step 1:** Run `test-email.bat`
- [ ] **Step 2:** Check for any ❌ FAIL messages
- [ ] **Step 3:** If "no reviewers", run SQL INSERT
- [ ] **Step 4:** If "API key missing", add to .env
- [ ] **Step 5:** Run test again - should all pass ✓
- [ ] **Step 6:** Check email inbox (and spam folder)
- [ ] **Step 7:** If still no email, check Brevo dashboard

---

## Emergency Contact Info

If STILL not working after trying everything:

### Collect This Info:
1. **Test output:** Copy entire output from `test-email.bat`
2. **Backend logs:** When creating requisition
3. **Database state:**
   ```sql
   SELECT * FROM requisition_roles;
   SELECT id, email FROM users WHERE is_active = TRUE;
   ```
4. **Brevo status:** Check https://status.brevo.com/

### Where to Look for Help:
- Brevo documentation: https://developers.brevo.com/
- Check Brevo account credits/balance
- Verify domain authentication in Brevo

---

## Expected Timeline

| Step | Time | Result |
|------|------|--------|
| Run test | 10 seconds | See PASS/FAIL |
| Add reviewer (if needed) | 1 minute | SQL runs successfully |
| Re-run test | 10 seconds | All tests PASS |
| Receive email | 1-2 minutes | Email in inbox |
| **TOTAL** | **~3 minutes** | ✅ WORKING |

---

## Success Indicators

You'll know it's working when:

1. ✓ Test script shows all PASS
2. ✓ Backend logs show "Found X active reviewers"
3. ✓ Backend logs show "Email sent successfully"
4. ✓ You receive test email within 2 minutes
5. ✓ Creating requisition triggers email automatically

---

## Quick Reference Commands

### SQL Commands
```sql
-- Check reviewers
SELECT u.email, u.full_name 
FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE;

-- Add reviewer (replace 1 with your ID)
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (1, 'reviewer', TRUE);

-- Check all roles
SELECT * FROM requisition_roles;
```

### Test Commands
```bash
# Run full test
test-email.bat

# Or
node test-email-setup.js

# Or visit in browser
http://localhost:5000/api/test/send-reviewer-email
```

---

## DON'T FORGET

After fixing:
1. ✅ Restart backend server
2. ✅ Run test again to confirm
3. ✅ Create a real requisition to test end-to-end
4. ✅ Check that reviewer receives email

---

**Still stuck?** The detailed logs in `test-email-setup.js` will show you EXACTLY where it's failing. Copy those errors and search for the specific error message! 🔍
