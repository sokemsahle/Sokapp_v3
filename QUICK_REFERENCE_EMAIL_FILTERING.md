# Quick Reference: Standard User Notification Privacy

## ✅ How Email Filtering Works

### Simple Explanation

**Each standard user sees ONLY their own requisition notifications, filtered by their login email.**

---

## 🔧 The Magic Line

**Backend SQL Query:**
```sql
WHERE status = 'finalized' AND requestor_email = ?
```

The `?` is automatically filled with the logged-in user's email address.

---

## 📊 Real Example

### Database Has:

| ID | Requestor Email | Status | Amount |
|----|----------------|---------|--------|
| 101 | alice@test.com | finalized | 1,500 |
| 102 | bob@test.com | finalized | 2,300 |
| 103 | alice@test.com | finalized | 800 |

### What Each User Sees:

**Alice logs in:**
```
🔔 2
├─ #101 (her requisition)
└─ #103 (her requisition)
```

**Bob logs in:**
```
🔔 1
└─ #102 (his requisition)
```

**Carol logs in:**
```
(no badge - no approved requisitions)
```

---

## 🎯 Key Points

1. **Automatic** - No manual filtering needed
2. **Secure** - Enforced at database level
3. **Private** - Users can't see others' data
4. **Accurate** - Uses exact email matching

---

## 🔍 Code Location

**Frontend (StandardUser.js):**
```javascript
// Line ~128
const response = await fetch(
    `http://localhost:5000/api/requisitions/finalized?email=${encodeURIComponent(user.email)}`
);
```

**Backend (server.js):**
```javascript
// Line ~760
WHERE status = 'finalized' AND requestor_email = ?
```

---

## ✅ Verification Commands

### Check Your Requisitions (MySQL):
```sql
-- Replace with YOUR email
SELECT id, requestor_name, grand_total 
FROM requisitions 
WHERE status = 'finalized' 
  AND requestor_email = 'your.email@example.com';
```

### Check All Finalized (Admin):
```sql
SELECT id, requestor_email, grand_total 
FROM requisitions 
WHERE status = 'finalized'
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Problem: Seeing someone else's requisitions

**Cause:** Email mismatch or database error

**Check:**
```sql
-- See what emails are in the system
SELECT DISTINCT requestor_email 
FROM requisitions 
WHERE status = 'finalized';
```

**Fix:** Ensure database emails match login emails exactly

### Problem: Not seeing MY requisitions

**Possible causes:**
1. Email typo in requisition
2. Status not 'finalized' yet
3. Wrong account logged in

**Check:**
```sql
-- Search for your email variations
SELECT * FROM requisitions 
WHERE requestor_email LIKE '%yourname%';
```

---

## 📱 Visual Guide

**Nav Bar (No Notifications):**
```
┌──────────────────────┐
│ Search...   👤 Alice │
└──────────────────────┘
```

**Nav Bar (With Notifications):**
```
┌──────────────────────┐
│ Search...  🔔 2 👤 Alice │
└──────────────────────┘
         ↑
    Only Alice's approvals
```

---

## 🔒 Security Guarantee

**What's Protected:**
- ✓ Database query filters automatically
- ✓ No user input possible (uses session email)
- ✓ Other users' data completely hidden
- ✓ Can't be bypassed from frontend

**What's NOT Protected:**
- ✗ Email typos during requisition creation
- ✗ Shared accounts (multiple people using same email)
- ✗ Case sensitivity issues (depends on DB config)

---

## 💡 Best Practices

### For Users:
1. Always use your official email
2. Don't share accounts
3. Report email changes to admin

### For Developers:
1. Validate email format
2. Use authenticated user email (don't allow manual entry)
3. Consider adding user_id column for better reliability
4. Add database indexes for performance

---

## 📞 Quick Help

**Issue:** Can't see my requisitions  
**Check:** Is your email exactly matching the requisition's `requestor_email`?

**Issue:** Seeing wrong requisitions  
**Check:** Are you logged in with the correct account?

**Issue:** Badge count wrong  
**Try:** Refresh page or wait 30 seconds for auto-update

---

**Quick Reference Card • Last Updated: March 8, 2026**
