# 🔍 Troubleshooting: Can't Edit Request Fields

## Quick Diagnostic Test

### Step 1: Open Browser Console (F12)
Go to the request form page and press **F12**, then click the **Console** tab.

### Step 2: Check for Errors
Do you see any of these errors?

```
❌ "Cannot read property 'map' of undefined"
❌ "items is not defined"
❌ "Network Error"
❌ Red error messages about CORS
```

**If YES** → That's the problem! The inventory data isn't loading.

---

## Common Issues & Fixes

### Issue 1: Backend Server Not Running
**Symptoms:**
- Dropdown shows only "-- Select an available item --" but no items
- Console shows "Network Error" or "Failed to fetch"

**Solution:**
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

Make sure you see: `Server running on port 5000`

---

### Issue 2: No Items in Inventory
**Symptoms:**
- Dropdown is empty or shows message "No items currently in stock"
- Console shows: `items.length === 0`

**Check Database:**
```sql
SELECT id, name, quantity FROM inventory WHERE quantity > 0;
```

**If no results** → Add test items:
```sql
INSERT INTO inventory (name, category, quantity, unit, location) VALUES
('A4 Paper', 'Office Supplies', 100, 'reams', 'Storage A'),
('Ballpoint Pens', 'Office Supplies', 500, 'pieces', 'Storage B');
```

Then restart backend and refresh page.

---

### Issue 3: CSS Blocking Interaction
**Symptoms:**
- Can see the form but can't click anything
- Fields look normal but don't respond to clicks
- Console has no errors

**Temporary Fix:**
1. Press F12 (Developer Tools)
2. Click the element selector icon (top-left corner of dev tools)
3. Click on the dropdown field
4. In the Elements tab, look for inline styles like `pointer-events: none` or `disabled`
5. Uncheck them if found

---

### Issue 4: Form State Not Updating
**Symptoms:**
- Can click fields but nothing happens when typing/selecting
- Console shows no errors
- Network tab shows successful API calls

**Debug Test:**
Add this to check if state is updating:

Open browser console and type:
```javascript
console.log('Form Data:', requestFormData);
```

If it doesn't update when you type → React state issue.

---

## Manual Test Checklist

### Test 1: Dropdown Opens
- [ ] Click the "Select Item" dropdown
- [ ] Does it expand to show options?
- [ ] Do you see items listed?

### Test 2: Can Select Item
- [ ] Click on an item in the dropdown
- [ ] Does the dropdown close?
- [ ] Is the selected item shown in the field?

### Test 3: Quantity Field Works
- [ ] Click in "Quantity Needed" field
- [ ] Can you type numbers?
- [ ] Does the cursor appear?

### Test 4: Reason Field Works
- [ ] Click in "Reason" textarea
- [ ] Can you type text?
- [ ] Does the cursor blink?

### Test 5: Submit Button Works
- [ ] Fill out all fields
- [ ] Click "Submit Request"
- [ ] Do you see an alert or console log?

---

## Quick Fix: Force Re-render

Sometimes React components need a force refresh:

1. Navigate away from the page (go to Dashboard)
2. Clear browser cache (Ctrl+Shift+Delete → Cached images)
3. Hard refresh (Ctrl+F5)
4. Navigate back to Inventory → Request Item

---

## Alternative: Test with Direct URL

Try accessing the request form directly:

```
http://localhost:3000/inventory/request
```

If this works but clicking the menu doesn't → Routing issue.

---

## Console Debug Commands

Paste these in browser console to check data:

```javascript
// Check if items are loaded
console.log('Inventory Items:', items);

// Check form data
console.log('Form Data:', requestFormData);

// Check if backend is responding
fetch('http://localhost:5000/api/inventory')
  .then(res => res.json())
  .then(data => console.log('Backend Response:', data));
```

---

## Expected Behavior

When everything works correctly:

1. ✅ Page loads with form visible
2. ✅ Dropdown shows list of items when clicked
3. ✅ Each option shows: "Item Name - Category (Available: Qty Unit)"
4. ✅ Clicking an item fills the field
5. ✅ Can type in Quantity field
6. ✅ Can select Urgency from dropdown
7. ✅ Can type in Reason textarea
8. ✅ Submit button is clickable

---

## If Nothing Works

Take a screenshot and share:
1. What the page looks like
2. Any errors in console
3. Network tab showing API calls

This will help diagnose the exact issue!

---

**Most Common Fix:** Restart both frontend AND backend servers, then clear browser cache!
