# Edit and Delete Functionality in View Inventory

## 📋 Overview

The **View Inventory** page now includes **Edit** and **Delete** action buttons for users with inventory management permissions. These buttons appear in the **Actions** column of the inventory table.

**Status:** ✅ Complete  
**Date:** March 16, 2026

---

## ✨ What's Available

### Action Buttons (For Users with `inventory_manage` Permission)

When viewing the inventory list (`/inventory`), users with management permissions will see three action buttons:

1. **📦 Stock Adjust** (Up/Down Arrow Icon)
   - Add or remove stock from current quantity
   - Prompts for quantity change and reason
   - Creates transaction log entry

2. **✏️ Edit** (Pencil Icon)
   - Opens modal to edit item details
   - All fields can be modified
   - Updates item in database

3. **🗑️ Delete** (Trash Icon)
   - Permanently removes item from inventory
   - Requires confirmation dialog
   - Deletes item from database

### For Users WITHOUT Management Permission

Users without `inventory_manage` permission will see:
- **"View Only"** text instead of action buttons
- Cannot modify inventory items
- Can only view item details

---

## 🎨 Visual Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Item Name    │ Category │ Quantity │ Location │ Actions     │
├──────────────────────────────────────────────────────────────┤
│ Rice Bags    │ Food     │ 50 Bags  │ Storage A│ [📦][✏️][🗑️]│
│ Soap Bars    │ Hygiene  │ 100 Pcs  │ Pantry B │ [📦][✏️][🗑️]│
│ Notebooks    │ Education│ 200 Each │ Room 101 │ [📦][✏️][🗑️]│
└──────────────────────────────────────────────────────────────┘

For users without permission:
┌──────────────────────────────────────────────────────────────┐
│ Item Name    │ Category │ Quantity │ Location │ Actions     │
├──────────────────────────────────────────────────────────────┤
│ Rice Bags    │ Food     │ 50 Bags  │ Storage A│ View Only   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 How to Use Each Feature

### 1. Edit an Item

**Steps:**
1. Navigate to **Inventory → View Inventory**
2. Find the item you want to edit
3. Click the **✏️ Edit** button (pencil icon)
4. Modal opens with current item data pre-filled
5. Modify any fields as needed
6. Click **"Update Item"**
7. Success message appears
8. Table refreshes with updated data

**Fields You Can Edit:**
- Item Name
- Category
- Quantity
- Unit
- Location
- Min Stock Level
- Description
- Supplier
- Cost Per Unit
- Program Association

**Example Use Case:**
```
Item: "Rice Bags"
Current Quantity: 50 bags
New Quantity: 75 bags (after receiving new shipment)
Action: Edit → Change Quantity → Update Item
```

---

### 2. Delete an Item

**Steps:**
1. Navigate to **Inventory → View Inventory**
2. Find the item you want to delete
3. Click the **🗑️ Delete** button (trash icon)
4. Confirmation dialog appears: "Are you sure you want to delete this item?"
5. Click "OK" to confirm or "Cancel" to abort
6. Success message appears if confirmed
7. Item is removed from the table

**⚠️ Warning:**
- Deletion is permanent and cannot be undone
- Make sure the item is not referenced in pending requests
- Consider setting quantity to 0 instead of deleting if you want to keep history

**Example Use Case:**
```
Item: "Expired Food Items"
Reason: Items are no longer usable
Action: Delete → Confirm → Item removed
```

---

### 3. Adjust Stock (Stock In/Out)

**Steps:**
1. Navigate to **Inventory → View Inventory**
2. Find the item you want to adjust
3. Click the **📦 Stock Adjust** button (up/down arrow)
4. Prompt appears asking for reason
5. Enter quantity change:
   - Positive number (e.g., 10) = Stock IN
   - Negative number (e.g., -5) = Stock OUT
6. Press Enter or click OK
7. Stock is adjusted immediately
8. Transaction is logged

**Examples:**

**Stock IN (Adding Items):**
```
Current Quantity: 50
Enter: 20
New Quantity: 70
Reason: "Received new shipment"
```

**Stock OUT (Removing Items):**
```
Current Quantity: 100
Enter: -15
New Quantity: 85
Reason: "Distributed to programs"
```

---

## 👥 Permission Requirements

| User Type | Has `inventory_manage` | Can Edit? | Can Delete? | Can Adjust Stock? |
|-----------|------------------------|-----------|-------------|-------------------|
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Finance** (After DB Update) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Inventory Manager** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Standard User** | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 🔍 Technical Implementation

### Files Modified:

#### 1. `src/components/inventory.js`

**Edit Button (Lines 759-765):**
```javascript
<button 
    className="action-btn-edit" 
    title="Edit"
    onClick={() => openEditModal(item)}
>
    <Edit size={16} />
</button>
```

**Delete Button (Lines 766-772):**
```javascript
<button 
    className="action-btn-delete" 
    title="Delete"
    onClick={() => handleDeleteItem(item.id)}
>
    <Trash2 size={16} />
</button>
```

**Permission Check (Line 750):**
```javascript
{hasManagePermission ? (
  <>
    {/* Show all action buttons */}
  </>
) : (
  <span style={{ color: '#666', fontSize: '0.85rem' }}>View Only</span>
)}
```

#### 2. `src/layouts/StandardUserLayout.js`

**Updated Route (Line 495):**
```javascript
<Route path="/inventory" 
  element={
    <Inventory 
      Inventoryopen={true} 
      user={user} 
      hasManagePermission={hasPermission('inventory_manage')} 
      viewMode="view" 
    />
  } 
/>
```

Now checks actual permission instead of hardcoded `false`.

---

## 📊 API Endpoints Used

### Edit Item:
```
PUT /api/inventory/:id
```
**Request Body:**
```json
{
  "name": "Updated Item Name",
  "category": "Food & Nutrition",
  "quantity": 100,
  "unit": "Bags",
  "location": "Storage A",
  "min_stock_level": 20,
  "description": "Updated description",
  "supplier": "New Supplier",
  "cost_per_unit": 30.00,
  "program_id": null
}
```

### Delete Item:
```
DELETE /api/inventory/:id
```
**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

### Adjust Stock:
```
POST /api/inventory/:id/adjust
```
**Request Body:**
```json
{
  "quantity_change": 25,
  "reason": "Received new shipment",
  "notes": ""
}
```

---

## ✅ Testing Checklist

### Test Edit Functionality:
- [ ] Login as admin or finance user
- [ ] Navigate to View Inventory
- [ ] Verify edit button (pencil icon) appears
- [ ] Click edit button
- [ ] Modal opens with pre-filled data
- [ ] Modify at least one field
- [ ] Click "Update Item"
- [ ] Success message appears
- [ ] Table shows updated data

### Test Delete Functionality:
- [ ] Login as admin or finance user
- [ ] Navigate to View Inventory
- [ ] Verify delete button (trash icon) appears
- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Click "OK"
- [ ] Success message appears
- [ ] Item is removed from table

### Test Stock Adjustment:
- [ ] Login as admin or finance user
- [ ] Navigate to View Inventory
- [ ] Verify stock adjust button appears
- [ ] Click stock adjust button
- [ ] Enter positive number for stock in
- [ ] Enter reason
- [ ] Submit
- [ ] Quantity increases
- [ ] Test with negative number for stock out
- [ ] Quantity decreases

### Test Permission Denial:
- [ ] Login as standard user (no inventory_manage)
- [ ] Navigate to View Inventory
- [ ] Verify "View Only" text appears instead of buttons
- [ ] Try to access edit/delete via URL manipulation
- [ ] Verify access is denied

---

## 🚨 Troubleshooting

### Issue: Edit/Delete buttons not showing

**Check:**
1. Does user have `inventory_manage` permission?
   ```javascript
   console.log(currentUser.permissions);
   ```
2. Is finance user? Run database script:
   ```bash
   cd database
   ADD_INVENTORY_MANAGE_TO_FINANCE.bat
   ```
3. Restart backend server

### Issue: Edit modal not closing after save

**Solution:**
1. Check browser console for errors
2. Verify API response is successful
3. Ensure `fetchInventory()` is called after update
4. Check that `setShowModal(false)` is executed

### Issue: Delete confirmation not working

**Solution:**
1. Verify `window.confirm()` is not blocked
2. Check browser settings for confirm dialogs
3. Test in different browser

---

## 💡 Best Practices

### When to Edit vs Delete:

**Edit When:**
- Item details changed (name, location, etc.)
- Quantity needs manual correction
- Supplier information updated
- Minor adjustments needed

**Delete When:**
- Item is obsolete/discontinued
- Data was entered by mistake
- Item is no longer tracked
- No historical significance

**Alternative to Deletion:**
Consider setting quantity to 0 and status to "Out of Stock" if you want to maintain historical records.

### Stock Adjustment Tips:
- Always provide clear reasons for adjustments
- Use positive numbers for stock IN
- Use negative numbers for stock OUT
- Keep transaction descriptions professional
- Regular audits help maintain accuracy

---

## 📝 Notes

### Button Styling:
- **Stock Adjust**: Blue background, up/down arrow icon
- **Edit**: Green background, pencil icon
- **Delete**: Red background, trash icon

### Confirmation Dialogs:
- **Delete**: Browser native confirm dialog
- **Stock Adjust**: Browser prompt for reason
- **Edit**: No confirmation (direct save)

### Transaction Logging:
- Stock adjustments automatically create transaction logs
- Edits do NOT create transaction logs
- Deletions do NOT create transaction logs (item is gone)

---

## ✅ Summary

The View Inventory page now includes full CRUD operations:

✅ **Edit** - Modify item details via modal  
✅ **Delete** - Remove items with confirmation  
✅ **Stock Adjust** - Add/remove quantities  
✅ **Permission-based** - Only visible to authorized users  
✅ **User-friendly** - Clear icons and tooltips  

**All features are ready to use!** 🎉
