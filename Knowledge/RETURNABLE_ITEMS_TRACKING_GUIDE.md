# Returnable Items Tracking System - Complete Guide

## Overview
The Returnable Items Tracking System allows you to track when returnable items are checked out, who has them, when they're due back, and automatically updates inventory when items are returned.

---

## 🎯 Key Features

### 1. **Checkout System**
- Track who borrowed the item (name, email, department)
- Record checkout date and expected return date
- Document item condition at checkout
- Add notes for special circumstances

### 2. **Return System**
- Easy one-click return process
- Record item condition upon return
- Automatic inventory quantity update
- Transaction history tracking

### 3. **Automatic Inventory Management**
- When an item is checked out → inventory quantity decreases
- When an item is returned → inventory quantity increases automatically
- No manual stock adjustments needed!

### 4. **Tracking & Reporting**
- View all currently checked out items
- See complete transaction history
- Search by item name, borrower name, or email
- Filter by status (checked out, returned, overdue)

---

## 🗄️ Database Changes

### New Table: `returnable_transactions`

```sql
CREATE TABLE returnable_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_id INT NOT NULL,              -- Links to inventory item
    user_id INT,                            -- User who checked out (if logged in)
    borrower_name VARCHAR(255) NOT NULL,    -- Name of person borrowing
    borrower_email VARCHAR(255),            -- Email of borrower
    borrower_department VARCHAR(100),       -- Department
    quantity INT NOT NULL DEFAULT 1,        -- How many items
    status ENUM('checked_out', 'returned', 'overdue'),
    checkout_date DATETIME NOT NULL,        -- When checked out
    expected_return_date DATE,              -- When due back
    actual_return_date DATETIME NULL,       -- When actually returned
    condition_at_checkout TEXT,             -- Item condition notes
    condition_at_return TEXT,               -- Condition on return
    notes TEXT,                             -- Additional notes
    created_by INT,                         -- Who processed checkout
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Triggers for Automatic Updates

**Trigger 1: After Checkout**
```sql
-- Automatically decreases inventory quantity when item is checked out
UPDATE inventory SET quantity = quantity - NEW.quantity WHERE id = NEW.inventory_id;
```

**Trigger 2: After Return**
```sql
-- Automatically increases inventory quantity when item is returned
UPDATE inventory SET quantity = quantity + NEW.quantity WHERE id = NEW.inventory_id;
```

---

## 🔧 Installation Steps

### Step 1: Run Database Migration

**Option A: Using Batch File (Windows)**
```cmd
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
ADD_RETURNABLE_TRACKING.bat
```

**Option B: Using MySQL Command Line**
```bash
mysql -u root -p sokapptest < add_returnable_tracking.sql
```

**Option C: Using phpMyAdmin**
1. Open phpMyAdmin
2. Select `sokapptest` database
3. Go to SQL tab
4. Copy and paste contents of `add_returnable_tracking.sql`
5. Click "Go"

### Step 2: Restart Backend Server
```cmd
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### Step 3: Access the Feature
1. Navigate to **Inventory** → **Returnable Items**
2. Or go directly to: `http://localhost:3000/inventory/returnable`

---

## 📋 How to Use

### Checkout an Item

1. **Navigate to Returnable Items**
   - Click **Inventory** in sidebar
   - Click **Returnable Items** from submenu
   - OR click the **Checkout Item** button

2. **Fill Out Checkout Form**
   - **Select Item**: Choose from dropdown of returnable items with available stock
   - **Borrower Name**: Auto-filled with your name (editable)
   - **Borrower Email**: Auto-filled with your email (editable)
   - **Department**: Your department (optional)
   - **Quantity**: Number of items to checkout
   - **Expected Return Date**: When should it be returned? (optional)
   - **Condition at Checkout**: Describe item condition (optional)
   - **Notes**: Any additional information (optional)

3. **Submit**
   - Click **Checkout Item**
   - Success message appears
   - Inventory quantity automatically decreases
   - Item appears in "Currently Checked Out" list

### Return an Item

1. **Find the Item**
   - Go to **Inventory** → **Returnable Items**
   - Stay on **Currently Checked Out** tab
   - Find the item you want to return

2. **Click Return Button**
   - Click the **Return** button next to the item
   - Return modal opens

3. **Complete Return Form**
   - **Condition at Return**: Describe item condition (required)
   - **Additional Notes**: Any comments (optional)
   - Click **Confirm Return**

4. **Success!**
   - Item marked as returned
   - Inventory quantity automatically increases
   - Item moves from "Checked Out" to "History" tab

---

## 🖥️ User Interface

### Main Page Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Inventory        [Checkout Item]         │
│  Returnable Items Tracking                          │
│  Inventory / Returnable Items                       │
├─────────────────────────────────────────────────────┤
│  [Currently Checked Out (5)]  [Transaction History] │
├─────────────────────────────────────────────────────┤
│  Search: [_________________search_________________] │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │ Item Name │ Borrower │ Qty │ Due Date │ ... │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Projector │ John Doe │  1  │ Mar 30   │[Return]│ │
│  │ Camera    │ Jane Smith│ 2  │ Apr 05   │[Return]│ │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Tabs

**Currently Checked Out Tab**
- Shows all items with status = 'checked_out'
- Columns: Item Name, Borrower, Department, Quantity, Checkout Date, Expected Return, Actions
- Return button for each item (if you have manage permission)
- Empty state: "No items currently checked out"

**Transaction History Tab**
- Shows all transactions (both checked out and returned)
- Columns: Item Name, Borrower, Checkout Date, Return Date, Status, Condition
- Status badges: CHECKED OUT (orange), RETURNED (green), OVERDUE (red)
- Empty state: "No transaction history found"

---

## 🔍 Search & Filter

**Search Bar** searches across:
- Item name
- Borrower name
- Borrower email

**Examples:**
- Type "projector" → finds all projector checkouts
- Type "john" → finds all items borrowed by John
- Type "@gmail.com" → finds all items by that email domain

---

## 📊 API Endpoints

### GET `/api/inventory/returnable/checked-out`
Get all currently checked out items.

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "inventory_id": 5,
      "item_name": "Projector",
      "borrower_name": "John Doe",
      "borrower_email": "john@example.com",
      "quantity": 1,
      "status": "checked_out",
      "checkout_date": "2026-03-26T10:00:00.000Z",
      "expected_return_date": "2026-03-30"
    }
  ],
  "count": 1
}
```

### GET `/api/inventory/returnable/history`
Get transaction history with optional filters.

**Query Parameters:**
- `status`: Filter by status ('checked_out', 'returned')
- `inventory_id`: Filter by specific item
- `borrower_email`: Filter by borrower email
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)

### POST `/api/inventory/returnable/checkout`
Checkout a returnable item.

**Request Body:**
```json
{
  "inventory_id": 5,
  "borrower_name": "John Doe",
  "borrower_email": "john@example.com",
  "borrower_department": "IT Department",
  "quantity": 1,
  "expected_return_date": "2026-03-30",
  "condition_at_checkout": "Good condition, minor scratches",
  "notes": "For presentation on Monday"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item checked out successfully",
  "transaction_id": 123
}
```

### PUT `/api/inventory/returnable/:id/return`
Return a checked out item.

**Request Body:**
```json
{
  "condition_at_return": "Good condition, everything works",
  "notes": "Returned on time, no issues"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item returned successfully. Inventory updated automatically."
}
```

---

## 💡 Example Use Cases

### Scenario 1: Laptop Checkout
**Context**: Employee needs laptop for remote work

1. IT Manager goes to Returnable Items page
2. Clicks "Checkout Item"
3. Selects: "Dell Latitude Laptop"
4. Borrower: "Sarah Johnson" (auto-filled)
5. Email: "sarah@company.com" (auto-filled)
6. Department: "Marketing"
7. Quantity: 1
8. Expected Return: "2026-04-30" (when employee returns to office)
9. Condition: "New, sealed box"
10. Submit

**Result**: 
- Laptop marked as checked out
- Inventory shows 1 less laptop available
- Can track who has it and when it's due back

### Scenario 2: Tool Return
**Context**: Maintenance crew returns borrowed tools

1. Inventory manager sees "Power Drill" in Checked Out list
2. Clicks "Return" button
3. Staff confirms: "Drill returned, good working condition"
4. Adds note: "All accessories included"
5. Submits return

**Result**:
- Drill quantity automatically increases in inventory
- Transaction moved to history
- Available for next checkout

### Scenario 3: Event Equipment
**Context**: Checking out multiple chairs for company event

1. Select: "Folding Chairs"
2. Quantity: 20
3. Expected Return: Next day
4. Condition: "All chairs clean and undamaged"
5. Submit

**Result**:
- 20 chairs removed from available inventory
- Can track that event team has them
- When returned, all 20 added back automatically

---

## 🔒 Permissions

**Who can checkout items?**
- Users with `hasManagePermission = true`
- Typically: Admins, Inventory Managers, Finance users

**Who can return items?**
- Same as above
- The return button only shows if you have manage permission

**Who can view?**
- Anyone with access to the Returnable Items page
- View-only users can see but not checkout/return

---

## 📈 Reports & Queries

### Find Overdue Items
```sql
SELECT 
    rt.id,
    i.name as item_name,
    rt.borrower_name,
    rt.borrower_email,
    rt.checkout_date,
    rt.expected_return_date,
    DATEDIFF(CURDATE(), rt.expected_return_date) as days_overdue
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.status = 'checked_out'
  AND rt.expected_return_date < CURDATE()
ORDER BY days_overdue DESC;
```

### Most Popular Returnable Items
```sql
SELECT 
    i.name as item_name,
    COUNT(rt.id) as times_checked_out,
    SUM(rt.quantity) as total_quantity_checked_out
FROM inventory i
LEFT JOIN returnable_transactions rt ON i.id = rt.inventory_id
WHERE i.is_returnable = 1
GROUP BY i.id, i.name
ORDER BY times_checked_out DESC;
```

### Borrower History
```sql
SELECT 
    rt.borrower_name,
    rt.borrower_email,
    COUNT(*) as total_checkouts,
    SUM(CASE WHEN rt.status = 'returned' THEN 1 ELSE 0 END) as returned_count,
    SUM(CASE WHEN rt.status = 'checked_out' THEN 1 ELSE 0 END) as currently_have
FROM returnable_transactions rt
GROUP BY rt.borrower_name, rt.borrower_email
ORDER BY total_checkouts DESC;
```

---

## 🛠️ Troubleshooting

### Issue: "Table doesn't exist" error
**Solution**: Run the database migration script first
```bash
mysql -u root -p sokapptest < add_returnable_tracking.sql
```

### Issue: Inventory not updating on checkout/return
**Solution**: Check if triggers were created
```sql
SHOW TRIGGERS LIKE 'returnable_transactions';
```
If missing, re-run migration script.

### Issue: Can't see Return button
**Solution**: Check user permissions
- Make sure `hasManagePermission = true` in the component
- Verify user role has inventory management permissions

### Issue: No items in checkout dropdown
**Solution**: 
1. Make sure items are marked as `is_returnable = 1` in inventory
2. Ensure items have `quantity > 0`
3. Edit items to mark them as returnable

### Issue: "Insufficient stock" error
**Solution**: 
- Check current inventory quantity
- The system prevents checking out more than available
- Reduce quantity or wait for returns

---

## 🚀 Advanced Features (Future Enhancements)

### Potential Additions:
1. **Email Notifications**
   - Send reminder emails when items are due
   - Notify when items become overdue
   - Confirmation emails on checkout/return

2. **Overdue Tracking**
   - Automatic status change to "overdue"
   - Red highlighting in UI
   - Overdue reports

3. **Reservation System**
   - Reserve items for future dates
   - Calendar view of availability
   - Conflict detection

4. **Barcode/QR Scanning**
   - Quick checkout with scanner
   - Mobile-friendly interface
   - Batch checkout multiple items

5. **Approval Workflow**
   - Require manager approval for high-value items
   - Multi-level approvals
   - Audit trail

6. **Damage/Loss Tracking**
   - Report damaged items
   - Charge fees for loss/damage
   - Maintenance schedules

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review database triggers: `SHOW TRIGGERS;`
3. Check browser console (F12) for frontend errors
4. Review backend logs for API errors
5. Verify database schema: `DESCRIBE returnable_transactions;`

---

## 📝 Summary

✅ **What You Get:**
- Complete checkout/return tracking system
- Automatic inventory management
- Borrower tracking (who has what)
- Condition tracking (before/after)
- Transaction history
- Search and filter capabilities
- Two-tab interface (current vs history)

✅ **Benefits:**
- Never lose track of returnable items again
- Know exactly who has each item
- Automatic stock updates (no manual work)
- Accountability through tracking
- Historical data for decision making

✅ **Perfect For:**
- Equipment checkout (cameras, projectors, tools)
- Library-style systems
- Shared resources tracking
- Rental management
- Tool libraries

---

**Version**: 1.0  
**Last Updated**: March 26, 2026  
**Author**: SOKAPP Development Team
