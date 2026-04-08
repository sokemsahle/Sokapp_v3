# Quick Start Guide: Inventory Management

## 🚀 What's New?

The **Inventory** tab has been added to the Standard User interface with smart permission controls!

---

## 📋 Menu Structure

```
Inventory
├── View Inventory (All users with inventory_view)
├── Request Item (All users with inventory_view)
└── Transaction Log (Only users with inventory_manage) ⭐
```

---

## 👥 User Roles & Permissions

### 🔒 Standard User (View Only - NO `inventory_manage`)
**What you CAN do:**
- ✅ View all inventory items
- ✅ See item details, quantities, locations
- ✅ Submit requests for items you need
- ✅ Filter and search items

**What you CANNOT do:**
- ❌ Add new items
- ❌ Edit existing items
- ❌ Delete items
- ❌ Adjust stock levels
- ❌ View transaction history

### ⭐ Inventory Manager (WITH `inventory_manage`)
**What you CAN do:**
- ✅ Everything a standard user can do, PLUS:
- ✅ Add new inventory items
- ✅ Edit existing items
- ✅ Delete items
- ✅ Adjust stock (stock in/out)
- ✅ View complete transaction log
- ✅ See who performed each transaction

---

## 🎯 How to Use

### For All Users: Viewing Inventory
1. Click **Inventory** in the sidebar
2. Browse the list of items
3. Use search and filters to find items
4. See real-time stats at the top

### For All Users: Requesting an Item
1. Click **Inventory** → **Request Item**
2. Fill out the form:
   - **Item Name**: What you need
   - **Quantity Needed**: How many
   - **Urgency**: Low / Normal / High / Urgent
   - **Reason**: Why you need it
3. Click **Submit Request**
4. You'll see a success message

### For Inventory Managers Only:

#### Adding a New Item
1. Click **Inventory** → **View Inventory**
2. Click the **Add New Item** button (top right)
3. Fill in all required fields:
   - Item Name ⭐
   - Category ⭐
   - Quantity ⭐
   - Unit ⭐
   - Location ⭐
   - Optional: Min Stock Level, Description, Supplier, Cost
4. Click **Create Item**

#### Editing an Item
1. Find the item in the list
2. Click the **Edit** button (pencil icon)
3. Modify the details
4. Click **Update Item**

#### Adjusting Stock
1. Find the item in the list
2. Click the **Stock Adjust** button (up/down arrow icon)
3. Enter the quantity change (positive for adding, negative for removing)
4. Provide a reason
5. Submit

#### Deleting an Item
1. Find the item in the list
2. Click the **Delete** button (trash icon)
3. Confirm deletion when prompted

#### Viewing Transaction Log
1. Click **Inventory** → **Transaction Log**
2. See complete history of all inventory movements:
   - Date & Time
   - Item Name
   - Transaction Type (IN/OUT)
   - Quantity Change
   - Previous vs New Quantity
   - Reason
   - Who performed it

---

## 🔧 Technical Setup (For Admins)

### Assigning Inventory Permissions

To give a user full inventory management access:

```sql
-- Find the user's role
SELECT * FROM roles WHERE role_name = 'HR';

-- Add inventory permissions to that role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'HR'
AND p.name IN ('inventory_view', 'inventory_manage');
```

### Verify Permissions
After assigning, the user should:
1. Log out and log back in
2. Check console for `currentUser.permissions` array
3. Look for `inventory_manage` in the list

---

## 🎨 UI Indicators

### Action Buttons (Managers)
- 📦 **Stock Adjust** (Up/Down Arrow) - Add or remove stock
- ✏️ **Edit** (Pencil) - Modify item details
- 🗑️ **Delete** (Trash) - Remove item

### View Only Label (Non-Managers)
- "View Only" text appears instead of action buttons

---

## 📊 API Endpoints

| Action | Endpoint | Permission |
|--------|----------|------------|
| View Items | `GET /api/inventory` | inventory_view |
| Create Item | `POST /api/inventory` | inventory_manage |
| Update Item | `PUT /api/inventory/:id` | inventory_manage |
| Delete Item | `DELETE /api/inventory/:id` | inventory_manage |
| Adjust Stock | `POST /api/inventory/:id/adjust` | inventory_manage |
| View Transactions | `GET /api/inventory/transactions/all` | inventory_manage |
| Request Item | `POST /api/inventory/request` | inventory_view |

---

## ✅ Testing Checklist

### Test as Non-Manager User:
- [ ] Can see Inventory tab in sidebar
- [ ] Can view all inventory items
- [ ] Cannot see "Add New Item" button
- [ ] Action buttons show "View Only"
- [ ] Can access "Request Item" submenu
- [ ] Cannot see "Transaction Log" submenu

### Test as Manager User:
- [ ] Can see Inventory tab in sidebar
- [ ] Can see "Add New Item" button
- [ ] Can add new items
- [ ] Can edit existing items
- [ ] Can delete items
- [ ] Can adjust stock
- [ ] Can access "Transaction Log" submenu
- [ ] Transaction log shows all movements

---

## 🐛 Troubleshooting

### Issue: Inventory tab not showing
**Solution:** Ensure user has `inventory_view` permission assigned

### Issue: Can't add/edit items
**Solution:** User needs `inventory_manage` permission

### Issue: Transaction Log gives error
**Solution:** 
1. Check user has `inventory_manage` permission
2. Verify `inventory_transactions` table exists
3. Restart backend server

### Issue: Request form doesn't work
**Solution:** 
1. Check browser console for errors
2. Verify backend is running on port 5000
3. Check network tab for failed API calls

---

## 📝 Notes

- The request feature currently logs to console (no persistent storage yet)
- Transaction log automatically tracks all stock adjustments
- Stats cards update in real-time as inventory changes
- Search works across item name, category, and location

---

## 🆘 Need Help?

Contact your system administrator if you:
- Don't see the Inventory tab
- Need inventory manager permissions
- Encounter any errors while using the feature

---

**Status:** ✅ Live and Ready to Use!
