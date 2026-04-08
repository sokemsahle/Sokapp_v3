# 🚀 Quick Start: Returnable Items Request System

## What's New?

When requesting **returnable items**, users can now specify when they'll return the item!

---

## 📋 3-Step Setup

### Step 1: Run SQL Migration

```bash
mysql -u root -p sokapptest < database/setup_returnable_items_complete.sql
```

### Step 2: Restart Backend

```bash
cd Backend
node server.js
```

### Step 3: Test It!

Done! The system is ready to use.

---

## 🎯 How It Works

### For Users (Requesting Items)

```
1. Go to Inventory → Request Item
2. Select item (returnable items show [RETURNABLE] tag)
3. If returnable → "Expected Return Date" field appears
4. Fill in return date (optional)
5. Submit request
```

### For Managers (Approving Requests)

```
1. Go to Inventory → Request Approvals
2. Find pending request
3. Click Approve
4. Set quantity
5. Submit

✅ Returnable items: Checkout transaction created automatically
✅ Regular items: Stock reduced permanently
```

---

## 📊 Quick SQL Queries

### Check Current Checkouts
```sql
SELECT * FROM v_checked_out_items;
```

### Find Overdue Items
```sql
SELECT * FROM v_checked_out_items 
WHERE return_status = 'OVERDUE';
```

### Return an Item
```sql
UPDATE returnable_transactions 
SET status = 'returned',
    actual_return_date = NOW(),
    condition_at_return = 'Good condition'
WHERE id = TRANSACTION_ID;
```

### View Borrower History
```sql
CALL sp_get_borrower_history('user@email.com');
```

---

## 🎨 What Changed

### Request Form

**Before:**
- Standard form for all items

**After:**
- Returnable items show **[RETURNABLE]** tag
- Return date field appears (optional)
- Helpful hint text displayed

### Approval Process

**Before:**
- All items: Stock reduced permanently

**After:**
- Returnable items: Creates checkout transaction
- Regular items: Stock reduced permanently

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `database/setup_returnable_items_complete.sql` | Complete database setup |
| `database/returnable_items_queries.sql` | Essential queries |
| `RETURNABLE_ITEMS_REQUEST_UPDATE.md` | Full documentation |
| `RETURNABLE_ITEMS_IMPLEMENTATION_SUMMARY.md` | Implementation summary |

---

## ✅ Verification Checklist

- [ ] Run database migration
- [ ] Restart backend server
- [ ] Mark item as returnable
- [ ] Submit request with return date
- [ ] Approve request
- [ ] Check Returnable Items page
- [ ] Verify checkout transaction created
- [ ] Test return process

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Return date field not showing | Check item has `is_returnable = 1` |
| Checkout not created | Verify triggers: `SHOW TRIGGERS;` |
| Stock not updating | Check trigger exists |

---

## 📚 More Info

- **Full Guide:** `RETURNABLE_ITEMS_REQUEST_UPDATE.md`
- **SQL Reference:** `database/returnable_items_queries.sql`
- **Complete Setup:** `database/setup_returnable_items_complete.sql`

---

**Ready to use!** 🎉
