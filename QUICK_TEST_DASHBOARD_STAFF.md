# Quick Test Guide - Dashboard Staff Display & Search

## ⚡ Quick Start (3 Steps)

### Step 1: Update Database
```bash
# Double-click this file or run in terminal:
UPDATE_EMPLOYEES_PROGRAM_ID.bat
```

**What it does:**
- Adds `program_id` column to employees table
- Creates index for fast queries
- Shows verification output

**Expected Output:**
```
SUCCESS! Database updated successfully
The employees table now has a program_id column
```

---

### Step 2: Restart Backend Server
```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd Backend
npm start
```

**Look for:**
```
Server running on port 5000
✓ MySQL connected
```

---

### Step 3: Test Frontend
1. Open browser to `http://localhost:3000` (or `http://localhost:5000`)
2. Login with your admin account
3. Go to **Dashboard**

---

## ✅ What to Check

### ✓ Test 1: All Staff Visible
**Look at the Staff Members table:**
- Do you see MORE than 6 staff members? ✅ GOOD!
- Is there a count showing "Showing X of Y staff members"? ✅ GOOD!

**Example:**
```
Staff Members
[Search staff...🔍] [X]
Showing 15 of 15 staff members  ← Should show total count

Name          | Role      | Contact        | Status
John Doe      | Director  | john@email.com | Active
Jane Smith    | HR        | jane@email.com | Active
... (all staff visible, not just 6)
```

---

### ✓ Test 2: Search by Name
**In the search box, type a name:**
```
Type: "John"
```

**Expected Result:**
- Table filters to show only staff with "John" in their name
- Counter updates: "Showing 2 of 15 staff members"
- Clear button (X) appears

---

### ✓ Test 3: Search by Role/Position
**Type a position:**
```
Type: "HR"
```

**Expected Result:**
- Shows all HR staff
- Updates counter
- Real-time filtering as you type

---

### ✓ Test 4: Search by Email
**Type part of an email:**
```
Type: "@gmail.com"
```

**Expected Result:**
- Shows all staff with Gmail addresses
- Filters instantly

---

### ✓ Test 5: Search by Status
**Type:**
```
Type: "Inactive"
```

**Expected Result:**
- Shows only inactive staff members
- Useful for finding archived employees

---

### ✓ Test 6: Clear Search
**After searching, click the X button:**
```
[Search: "John"] [X]  ← Click the X
```

**Expected Result:**
- Search box clears
- All staff reappear
- Counter resets to "Showing 15 of 15 staff members"

---

### ✓ Test 7: Empty Search Results
**Type something that doesn't exist:**
```
Type: "XYZ123Nobody"
```

**Expected Result:**
```
Table shows: "No staff members matching your search."
```

---

## 🐛 Troubleshooting

### Problem: "Column 'program_id' doesn't exist"
**Fix:**
```sql
-- Run in MySQL Workbench:
ALTER TABLE employees ADD COLUMN program_id INT DEFAULT NULL;
```

Or re-run:
```bash
UPDATE_EMPLOYEES_PROGRAM_ID.bat
```

---

### Problem: Still only seeing 6 staff
**Fix:**
1. Hard refresh browser: `Ctrl + F5`
2. Clear cache: `Ctrl + Shift + Delete`
3. Check browser console (F12) for errors

---

### Problem: Search not filtering
**Check:**
1. Open browser console (F12)
2. Look for errors in Console tab
3. Verify search box is updating (type and watch console)

**Debug:**
Add this to Dashboard.js line 106:
```javascript
console.log('Search query:', searchQuery);
console.log('Filtered results:', filteredStaff.length);
```

---

## 📊 Before vs After Comparison

### BEFORE (Broken):
```
┌─────────────────────────────────────┐
│ Staff Members          🔍 -filter-│
├─────────────────────────────────────┤
│ Only 6 staff shown (hard limit)    │
│ No search functionality            │
│ Can't find specific staff quickly  │
└─────────────────────────────────────┘
```

### AFTER (Fixed):
```
┌─────────────────────────────────────────────────┐
│ Staff Members  [Search staff...🔍] [X] -filter-│
│                Showing 15 of 15 staff members   │
├─────────────────────────────────────────────────┤
│ Type to filter by:                              │
│ • Name                                          │
│ • Role/Position                                 │
│ • Email/Phone                                   │
│ • Active/Inactive status                        │
│ All staff visible (no arbitrary limit)          │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Success Checklist

- [ ] Database migration ran successfully
- [ ] Backend server restarted
- [ ] Dashboard shows ALL staff (not just 6)
- [ ] Staff count displays correctly
- [ ] Search box appears in header
- [ ] Typing filters results in real-time
- [ ] Clear button (X) works
- [ ] Results counter updates
- [ ] Empty state messages show correctly
- [ ] No console errors

---

## 💡 Quick Manual Test (MySQL)

If the batch file doesn't work, run manually:

```sql
-- 1. Check if column exists
USE sokapptest;
DESCRIBE employees;

-- 2. If program_id is missing, add it:
ALTER TABLE employees ADD COLUMN program_id INT DEFAULT NULL;
ALTER TABLE employees ADD INDEX idx_employees_program_id (program_id);

-- 3. Verify:
SELECT COUNT(*) FROM employees WHERE program_id IS NOT NULL;
```

---

## 🚀 Next Steps After Testing

Once confirmed working:

1. **Test with Program Filter:**
   - Select different programs from dropdown
   - Verify staff list filters correctly

2. **Test Performance:**
   - Works smoothly with 50+ staff members
   - Search is instant (no lag)

3. **Test on Different Browsers:**
   - Chrome, Firefox, Edge
   - Mobile responsive view

---

**Need Help?**

Check the full documentation:
- `DASHBOARD_STAFF_DISPLAY_SEARCH_FIX.md` - Complete guide
- `database/add_program_id_to_employees.sql` - SQL migration script

**Last Updated:** March 16, 2026  
**Status:** ✅ Ready for Testing
