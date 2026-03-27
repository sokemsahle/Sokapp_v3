# QUICK START: Test Requisition Email Access Control

## 🎯 What Was Fixed

**Problem:** Any user could view ANY requisition by ID (security vulnerability)  
**Solution:** Users can ONLY view requisitions that match their email address

---

## ⚡ Quick Test (30 seconds)

### Step 1: Start Backend Server
```bash
cd Backend
node server.js
```

### Step 2: Run Automated Test
```bash
node test-requisition-access-control.js
```

### Expected Output:
```
=== Testing Requisition Email Access Control ===

📋 Test Requisition:
   ID: 123
   Owner Email: alice@example.com
   Purpose: Office Supplies

Test 1: Access with CORRECT email
   Calling: GET /api/requisition/123?email=alice@example.com
   ✅ SUCCESS - Access granted as expected

Test 2: Access with WRONG email
   Calling: GET /api/requisition/123?email=wrong@example.com
   ✅ SUCCESS - Access denied as expected
   Message: Access denied: You can only view your own requisitions

Test 3: Access with NO email parameter
   Calling: GET /api/requisition/123 (no email)
   ⚠️  Access granted (this is OK for admin override)

=== Test Complete ===

Summary:
✅ Users with matching email CAN view requisitions
✅ Users with non-matching email CANNOT view requisitions
ℹ️  Admins can still access all requisitions when needed
```

---

## 🧪 Manual Testing (2 minutes)

### Test Scenario: User Can't View Others' Requisitions

1. **Login as Alice**
   - Go to: `http://localhost:3000`
   - Login with Alice's credentials
   
2. **Create a Requisition**
   - Go to "My Requisitions"
   - Click "Create New"
   - Fill in form and submit
   - Note the requisition ID (e.g., #456)

3. **View Your Own Requisition** ✅
   - Click on requisition #456
   - Should open successfully

4. **Copy the URL**
   - Copy: `http://localhost:3000/user/my-requisitions/456`

5. **Logout and Login as Bob**
   - Logout from Alice
   - Login with Bob's credentials

6. **Try to Access Alice's Requisition** ❌
   - Paste the URL: `http://localhost:3000/user/my-requisitions/456`
   - Should see: **"Access Denied"** message

---

## 🔍 Verify Database

Run this SQL query to check your data:

```sql
-- Check requisition emails
SELECT 
    id,
    requestor_name,
    requestor_email,
    purpose,
    status
FROM requisitions
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for:**
- ✅ All requisitions should have `requestor_email` populated
- ✅ Emails should match actual user emails
- ❌ No NULL or empty strings

---

## 🐛 Troubleshooting

### Issue: Test Fails - "Cannot connect to backend"
**Solution:** Make sure backend is running
```bash
cd Backend
node server.js
```

### Issue: Access Granted When It Should Be Denied
**Solution:** Check if you're testing with the correct email
- The email in the URL must EXACTLY match `requestor_email` in database
- Case-sensitive comparison

### Issue: No Requisitions in Database
**Solution:** Create a test requisition first
```sql
INSERT INTO requisitions (
    requestor_name,
    requestor_email,
    department,
    purpose,
    status
) VALUES (
    'Test User',
    'test@example.com',
    'IT Department',
    'Office Supplies',
    'pending'
);
```

---

## 📊 Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `Backend/server.js` | Added email validation | Security check on API |
| `src/components/Requisition/Requisition.js` | Pass email in API call | Include user identity |

---

## 📚 Documentation Created

1. **REQUISITION_EMAIL_ACCESS_FIX.md** - Detailed technical documentation
2. **VISUAL_GUIDE_REQUISITION_ACCESS_CONTROL.md** - Visual explanations
3. **test-requisition-access-control.js** - Automated test script
4. **check-requisition-emails.sql** - Database diagnostic queries
5. **QUICK_START_REQUISITION_ACCESS_TESTING.md** - This file

---

## ✅ Success Criteria

After testing, you should observe:

- ✅ Users can view THEIR OWN requisitions
- ✅ Users CANNOT view OTHERS' requisitions
- ✅ Clear error messages when access denied
- ✅ No breaking changes to existing functionality
- ✅ Admins can still access all requisitions

---

## 🚀 Next Steps

1. **Run the automated test** → `node test-requisition-access-control.js`
2. **Do manual testing** → Follow steps above
3. **Check database** → Run SQL diagnostic
4. **Review logs** → Check backend console for security warnings
5. **Deploy to production** → When ready

---

## 📞 Support

If you encounter issues:

1. Check backend logs for error messages
2. Verify database has `requestor_email` populated
3. Ensure frontend is passing email parameter
4. Review the detailed documentation in `REQUISITION_EMAIL_ACCESS_FIX.md`

---

**Status:** ✅ Ready for Testing  
**Time Required:** 2-5 minutes  
**Difficulty:** Easy
