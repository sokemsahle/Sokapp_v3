# ⚡ Quick Fix: Reviewer Emails Not Working

## 🚀 30-Second Diagnosis

### Check Backend Console When Creating Requisition

**Good (Working):**
```
✓ Found X active reviewers
✅ Email sent successfully to reviewer@example.com
```

**Bad (Not Working):**
```
⚠️  No active reviewers found in requisition_roles table
```

---

## 🔧 Most Common Fix (Works 90% of the time)

### Step 1: Find Your User ID
```sql
SELECT id, email FROM users WHERE is_active = TRUE;
```

### Step 2: Add Reviewer Role
```sql
INSERT INTO requisition_roles (user_id, role_type, is_active) 
VALUES (YOUR_ID_HERE, 'reviewer', TRUE);
```

### Step 3: Test
Create a requisition → Check your email!

---

## ✅ Quick Checklist

| Issue | How to Check | Fix |
|-------|--------------|-----|
| ❌ No reviewers | Log shows "No active reviewers" | Run SQL INSERT above |
| ❌ API key missing | Log shows "API key not configured" | Add to `.env` and restart |
| ❌ Inactive reviewer | SQL shows `is_active = FALSE` | `UPDATE requisition_roles SET is_active = TRUE WHERE role_type = 'reviewer'` |
| ❌ User inactive | SQL shows user `is_active = FALSE` | `UPDATE users SET is_active = TRUE WHERE id = YOUR_ID` |

---

## 📁 Files You Need

1. **Run Diagnostics:** `database/CHECK_REVIEWER_EMAIL.sql`
2. **Full Guide:** `TROUBLESHOOTING_REVIEWER_EMAIL.md`
3. **Details:** `FIX_REVIEWER_EMAIL_SUMMARY.md`

---

## 🎯 What Should Happen

```
Create Requisition 
  → Backend logs show reviewer found 
  → Email sent via Brevo 
  → Reviewer gets email in 1-2 minutes 
  → ✅ SUCCESS
```

---

## 🆘 Still Broken?

1. Check backend logs for exact error
2. Run full SQL diagnostic script
3. Verify Brevo API key is valid
4. Test Brevo directly: https://app.brevo.com/

---

## 💡 Pro Tips

- Always restart backend after editing `.env`
- Check spam folder when testing
- Use real email addresses (not fake ones)
- Keep backend console open while testing
- The enhanced logging shows EXACTLY where it fails

---

**TL;DR:** Run the SQL query to add yourself as a reviewer, then test! 📧
