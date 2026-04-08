# Returnable Items Management - Quick Reference Card

## 🎯 Quick Access

**URL:** `http://localhost:3000/admin/inventory/returnable`

**Navigation:** Inventory → Returnable Items

---

## 📋 Quick Workflow

### 1️⃣ Mark Item as Returnable
```
Inventory → View Inventory → Add/Edit Item
→ Set "Returnable?" to YES → Save
```

### 2️⃣ Checkout Item
```
Returnable Items → [Checkout Item] button
→ Fill form → Submit
✅ Inventory automatically decreases
```

### 3️⃣ Return Item
```
Returnable Items → Find item → [Return] button
→ Document condition → Submit
✅ Inventory automatically increases
```

---

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────────┐
│  [← Back]              [Checkout Item]              │
│  Returnable Items Tracking                          │
│  Inventory / Returnable Items                       │
├─────────────────────────────────────────────────────┤
│  [Currently Checked Out (5)]  [Transaction History] │
├─────────────────────────────────────────────────────┤
│  Search: [_________________________________]        │
├─────────────────────────────────────────────────────┤
│  Item      │ Borrower   │ Qty │ Due Date │ Action  │
│  Projector │ John Doe   │  1  │ Mar 30   │[Return] │
│  Camera    │ Jane Smith │  2  │ Apr 05   │[Return] │
│  Laptop    │ Bob Wilson │  1  │ OVERDUE  │[Return] │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Auto Stock Update** | Inventory updates automatically on checkout/return |
| **Borrower Tracking** | Know who has what item |
| **Due Date Alerts** | Overdue items highlighted in red |
| **Condition Tracking** | Document item condition before & after |
| **Search** | Find items by name, borrower, or email |
| **History** | Complete transaction log |

---

## ✅ Checklist for First Use

- [ ] Run database migration
- [ ] Restart backend server
- [ ] Mark items as returnable
- [ ] Test checkout process
- [ ] Test return process
- [ ] Verify inventory updates

---

## 💡 Pro Tips

1. **Set return dates** - Makes tracking easier
2. **Document condition** - Avoids disputes
3. **Add notes** - Special handling instructions
4. **Check overdue** - Follow up on late returns
5. **Review history** - Analyze usage patterns

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Menu not showing | Refresh page / Clear cache |
| Can't checkout | Check item is marked returnable |
| Stock not updating | Verify database triggers exist |
| No items in dropdown | Ensure items have quantity > 0 |

---

## 📊 Database Quick Check

```sql
-- Check returnable transactions table
DESCRIBE returnable_transactions;

-- Check triggers
SHOW TRIGGERS;

-- View checked out items
SELECT * FROM returnable_transactions WHERE status = 'checked_out';

-- Check inventory quantities
SELECT id, name, quantity, is_returnable FROM inventory WHERE is_returnable = 1;
```

---

**Need Help?** See `RETURNABLE_ITEMS_MANAGEMENT_SUMMARY.md` for full documentation.
