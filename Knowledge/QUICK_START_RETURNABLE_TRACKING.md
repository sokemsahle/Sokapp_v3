# Quick Start: Returnable Items Tracking

## 🚀 Get Started in 3 Steps

### Step 1: Install Database
**Double-click this file:**
```
database\ADD_RETURNABLE_TRACKING.bat
```

### Step 2: Restart Backend
```cmd
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### Step 3: Open the App
1. Go to **Inventory** → **Returnable Items**
2. Click **Checkout Item** to try it out!

---

## ✅ What Was Added

### New Features:
- ✅ Checkout system for returnable items
- ✅ Track who borrowed items
- ✅ Track when items are due back
- ✅ Automatic inventory updates on return
- ✅ Transaction history tracking
- ✅ Search and filter capabilities

### New Pages:
- ✅ `/inventory/returnable` - Main tracking page
- ✅ Two tabs: "Currently Checked Out" and "Transaction History"

### New Menu:
- ✅ **Inventory** submenu now includes:
  - View Inventory
  - Add New Item
  - **Returnable Items** ← NEW!
  - Approvals

---

## 🎯 How It Works

### Checkout Flow:
```
1. Click "Checkout Item"
2. Select item from dropdown
3. Fill in borrower details (auto-filled for you)
4. Set expected return date (optional)
5. Submit
→ Inventory quantity decreases automatically
```

### Return Flow:
```
1. Find item in "Currently Checked Out" tab
2. Click "Return" button
3. Describe condition on return
4. Submit
→ Inventory quantity increases automatically
```

---

## 📋 Example: Checkout a Projector

**Scenario**: John needs a projector for presentation tomorrow

1. Navigate: **Inventory** → **Returnable Items**
2. Click **Checkout Item**
3. Form appears:
   - **Select Item**: "Epson Projector"
   - **Borrower Name**: "John Doe" (auto-filled)
   - **Borrower Email**: "john@company.com" (auto-filled)
   - **Department**: "Sales"
   - **Quantity**: 1
   - **Expected Return**: Tomorrow's date
   - **Condition**: "Good working order"
   - **Notes**: "For client presentation"
4. Click **Checkout Item**
5. ✅ Success! Projector shows in "Currently Checked Out"

**Next Day - Return:**
1. Go back to Returnable Items page
2. Find "Epson Projector - John Doe"
3. Click **Return**
4. Form appears:
   - **Condition at Return**: "Returned in good condition"
   - **Notes**: "Everything works perfectly"
5. Click **Confirm Return**
6. ✅ Success! Projector quantity restored in inventory

---

## 🔧 Mark Items as Returnable

To make an item appear in the checkout dropdown:

1. Go to **Inventory** → **Add New Item** (or edit existing)
2. Fill in item details
3. Set **Returnable?** = **Yes**
4. Save

**Examples of returnable items:**
- Projectors
- Cameras
- Laptops
- Tools
- Equipment
- Furniture
- Vehicles

---

## 📊 What Gets Tracked

### Checkout Information:
- ✅ Who borrowed it (name, email, department)
- ✅ When they borrowed it (checkout date)
- ✅ When it's due back (expected return date)
- ✅ How many items (quantity)
- ✅ Condition when borrowed
- ✅ Any notes

### Return Information:
- ✅ When it was returned (actual return date)
- ✅ Condition on return
- ✅ Additional notes
- ✅ Automatic inventory update

---

## 🎨 User Interface

### Main Page:
```
┌─────────────────────────────────────────────┐
│ [← Back]            [Checkout Item]         │
│ Returnable Items Tracking                   │
├─────────────────────────────────────────────┤
│ [Currently Checked Out] [History]           │
├─────────────────────────────────────────────┤
│ Search: [_______________]                   │
├─────────────────────────────────────────────┤
│ Item     │ Borrower │ Due    │ Action      │
├─────────────────────────────────────────────┤
│ Projector│ John Doe │ Mar 30 │ [Return]    │
│ Camera   │ Jane S.  │ Apr 05 │ [Return]    │
└─────────────────────────────────────────────┘
```

### Tabs:
- **Currently Checked Out**: All active checkouts
- **Transaction History**: All past transactions

---

## 💡 Quick Tips

✅ **Tip 1**: Use expected return dates to track overdue items
✅ **Tip 2**: Document condition carefully to avoid disputes
✅ **Tip 3**: Add notes for special handling instructions
✅ **Tip 4**: Search by borrower name to see all their checkouts
✅ **Tip 5**: Check history tab to see usage patterns

---

## 🛠️ Common Tasks

### View All Checked Out Items
1. Go to Returnable Items page
2. Stay on "Currently Checked Out" tab
3. See complete list with borrower info

### Find Specific Transaction
1. Use search bar at top
2. Type: item name, borrower name, or email
3. Results filter instantly

### Check Transaction History
1. Click "History" tab
2. See all past checkouts and returns
3. Status shows: CHECKED OUT or RETURNED

### Mark Item as Returned
1. Find in "Currently Checked Out"
2. Click "Return" button
3. Fill condition form
4. Submit - done!

---

## ❓ FAQ

**Q: Can I checkout multiple quantities?**  
A: Yes! Enter any number in the Quantity field.

**Q: Do I have to set a return date?**  
A: No, it's optional but recommended for tracking.

**Q: Can non-returnable items be checked out?**  
A: No, only items marked "Returnable = Yes" appear in dropdown.

**Q: What happens if I don't return an item?**  
A: It stays in "Currently Checked Out" until returned.

**Q: Can I edit a checkout after submitting?**  
A: Not yet. Contact admin if changes needed.

**Q: Who can checkout items?**  
A: Users with manage permission (admins, inventory managers).

**Q: Does inventory update automatically?**  
A: Yes! Decreases on checkout, increases on return.

---

## 🔍 Quick SQL Queries

### See what's checked out:
```sql
SELECT i.name, rt.borrower_name, rt.checkout_date, rt.expected_return_date
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.status = 'checked_out';
```

### See overdue items:
```sql
SELECT i.name, rt.borrower_name, rt.expected_return_date
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.status = 'checked_out' 
  AND rt.expected_return_date < CURDATE();
```

### See return history:
```sql
SELECT i.name, rt.borrower_name, rt.checkout_date, rt.actual_return_date, rt.status
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
ORDER BY rt.checkout_date DESC;
```

---

## 🆘 Troubleshooting

**Problem**: No items in checkout dropdown  
**Fix**: Mark items as returnable in Inventory → Edit Item → Returnable? = Yes

**Problem**: Table doesn't exist error  
**Fix**: Run the database migration script first

**Problem**: Can't see Return button  
**Fix**: Make sure you have manage permission (admin/inventory manager)

**Problem**: Inventory not updating  
**Fix**: Check if database triggers were created successfully

---

## 📞 Need Help?

1. Check full documentation: `RETURNABLE_ITEMS_TRACKING_GUIDE.md`
2. Review SQL script: `add_returnable_tracking.sql`
3. Check browser console (F12) for errors
4. Verify backend is running

---

**That's it! You're ready to track returnable items!** 🎉

**Version**: 1.0 | **Date**: March 26, 2026
