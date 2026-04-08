# Quick Start: Expiry Date & Returnable Features

## ✅ What Was Added

Two new features to your inventory system:

1. **Expiry Date Tracking** - Mark items that expire and track their expiry dates
2. **Returnable Items** - Mark items that can be returned after use (not consumed)

---

## 🚀 How to Install (3 Steps)

### Step 1: Update Database
**Easiest Method** - Double-click this file:
```
database\ADD_EXPIRY_AND_RETURNABLE.bat
```

**Alternative** - Run in phpMyAdmin:
1. Open phpMyAdmin → Select `sokapptest` database
2. Go to SQL tab
3. Copy contents from `database\add_expiry_and_returnable_to_inventory.sql`
4. Click "Go"

### Step 2: Restart Backend
```cmd
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### Step 3: Test It!
1. Open your app in browser
2. Go to **Inventory** → **Add New Item**
3. Scroll down to see the new fields:
   - **Has Expiry Date?** (Yes/No)
   - **Expiry Date** (appears when you select Yes)
   - **Returnable?** (Yes/No)

---

## 📋 Files Changed

### Backend
- ✅ `Backend/routes/inventory.routes.js` - Added support for new fields in POST/PUT endpoints

### Frontend  
- ✅ `src/components/inventory.js` - Added form fields and display columns

### Database
- ✅ `database/add_expiry_and_returnable_to_inventory.sql` - Migration script
- ✅ `database/ADD_EXPIRY_AND_RETURNABLE.bat` - Windows batch file

### Documentation
- ✅ `INVENTORY_EXPIRY_AND_RETURNABLE_FEATURE.md` - Full documentation
- ✅ `QUICK_START_EXPIRY_AND_RETURNABLE.md` - This file

---

## 🎯 What It Looks Like

### In Add/Edit Form:
```
Program:          [School Feeding ▼]
Has Expiry Date?: [Yes ▼]           ← NEW
Expiry Date:      [2025-12-31 📅]   ← NEW (appears when Yes selected)
Returnable?:      [No ▼]            ← NEW
```

### In Inventory List:
```
| Item Name | Category | Quantity | Location | Expiry      | Returnable | Status    |
|-----------|----------|----------|----------|-------------|------------|-----------|
| Rice      | Food     | 50 Bags  | Storage A | 2025-12-31  | No         | In Stock  |
| Projector | Equipment| 2 Units  | Office   | —           | Yes        | In Stock  |
```

---

## 💡 Example Use Cases

### Perishable Items (Food, Medicine)
- **Item**: Canned Beans
- **Has Expiry Date**: Yes
- **Expiry Date**: 2025-06-15
- **Is Returnable**: No
- **Why**: Track food that must be used before expiration

### Returnable Equipment (Tools, Devices)
- **Item**: Digital Camera
- **Has Expiry Date**: No
- **Expiry Date**: (hidden)
- **Is Returnable**: Yes
- **Why**: Equipment gets borrowed and returned, not consumed

### Both Features (Medical Equipment)
- **Item**: Blood Pressure Monitor
- **Has Expiry Date**: Yes (warranty/calibration expires)
- **Expiry Date**: 2026-03-20
- **Is Returnable**: Yes
- **Why**: Must be returned AND has expiry date

---

## 🔍 Quick Tests

### Test 1: Add Item with Expiry
1. Inventory → Add New Item
2. Fill in: Name="Test Food", Category="Food & Nutrition"
3. Set "Has Expiry Date?" = **Yes**
4. Pick an expiry date
5. Set "Returnable?" = **No**
6. Click "Create Item"
7. ✅ Should see red expiry date in list

### Test 2: Add Returnable Item
1. Inventory → Add New Item
2. Fill in: Name="Test Equipment", Category="Other"
3. Set "Has Expiry Date?" = **No**
4. Set "Returnable?" = **Yes**
5. Click "Create Item"
6. ✅ Should see green "Yes" in Returnable column

### Test 3: Edit Existing Item
1. Find any item in the list
2. Click Edit (pencil icon)
3. Change expiry/returnable settings
4. Click "Update Item"
5. ✅ Changes should appear in list

---

## 🛠️ Troubleshooting

**Problem**: New fields don't show up
- **Fix**: Clear browser cache (Ctrl+Shift+Delete) and refresh (Ctrl+F5)

**Problem**: Database error when adding item
- **Fix**: Make sure you ran the SQL migration script first

**Problem**: Columns already exist error
- **Fix**: That's okay! Means migration was already run. Skip to Step 2

**Problem**: Can't see Expiry Date field
- **Fix**: Make sure "Has Expiry Date?" is set to "Yes" first

---

## 📊 Database Schema

New columns added to `inventory` table:
```sql
has_expiry_date  TINYINT(1) DEFAULT 0    -- 0=No, 1=Yes
expiry_date      DATE         DEFAULT NULL
is_returnable    TINYINT(1) DEFAULT 0    -- 0=No, 1=Yes
```

---

## 📖 Next Steps

Now you can:
1. ✅ Mark perishable items with expiry dates
2. ✅ Track returnable equipment
3. ✅ Filter items by expiry status
4. ✅ See at-a-glance what's returnable

Future enhancements could include:
- Automatic alerts for items expiring soon
- Reports on expired items
- Checkout system for returnable items

---

## 📞 Need Help?

1. Check full documentation: `INVENTORY_EXPIRY_AND_RETURNABLE_FEATURE.md`
2. Review SQL script: `database/add_expiry_and_returnable_to_inventory.sql`
3. Check browser console (F12) for errors
4. Verify backend logs

---

**That's it! You're ready to use the new features!** 🎉

**Version**: 1.0 | **Date**: March 26, 2026
