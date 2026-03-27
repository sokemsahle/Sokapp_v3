# Inventory Expiry Date & Returnable Feature

## Overview
This document describes the new features added to the inventory management system:
1. **Expiry Date Tracking** - Mark items that have expiry dates and track when they expire
2. **Returnable Items** - Mark items that can be returned after use (e.g., equipment, tools)

---

## 📋 Features Added

### 1. Has Expiry Date (Boolean Field)
- **Purpose**: Identify perishable or time-sensitive items
- **Database Column**: `has_expiry_date` (TINYINT)
- **UI Control**: Yes/No dropdown
- **Behavior**: 
  - When set to "Yes", an additional "Expiry Date" field appears
  - When set to "No", the expiry date field is hidden
  - Default value: No (most items don't expire)

### 2. Expiry Date (Date Field)
- **Purpose**: Store the actual expiry date for perishable items
- **Database Column**: `expiry_date` (DATE)
- **UI Control**: Date picker
- **Behavior**: 
  - Only visible when "Has Expiry Date" is set to "Yes"
  - Optional field (can be null even if has_expiry_date is true)
  - Displayed in the inventory list as a formatted date

### 3. Is Returnable (Boolean Field)
- **Purpose**: Identify items that should be returned after use (not consumed)
- **Database Column**: `is_returnable` (TINYINT)
- **UI Control**: Yes/No dropdown
- **Behavior**: 
  - Helps distinguish between consumables and reusable items
  - Examples: Equipment, tools, furniture, vehicles
  - Default value: No (most items are consumed)

---

## 🗄️ Database Changes

### New Columns Added to `inventory` Table

```sql
-- Add expiry tracking columns
ALTER TABLE inventory 
ADD COLUMN has_expiry_date TINYINT(1) DEFAULT 0 AFTER cost_per_unit,
ADD COLUMN expiry_date DATE DEFAULT NULL AFTER has_expiry_date;

-- Add returnable column
ALTER TABLE inventory 
ADD COLUMN is_returnable TINYINT(1) DEFAULT 0 AFTER expiry_date;
```

### Indexes Created
```sql
CREATE INDEX idx_inventory_has_expiry_date ON inventory(has_expiry_date);
CREATE INDEX idx_inventory_is_returnable ON inventory(is_returnable);
CREATE INDEX idx_inventory_expiry_date ON inventory(expiry_date);
```

---

## 🎨 User Interface Changes

### Add/Edit Item Form
The form now includes three additional fields at the bottom:

1. **Has Expiry Date?**
   - Dropdown with options: "No" | "Yes"
   - Located after the Program field

2. **Expiry Date** (conditional)
   - Date picker input
   - Only appears when "Has Expiry Date?" is set to "Yes"
   - Located between "Has Expiry Date?" and "Returnable?" fields

3. **Returnable?**
   - Dropdown with options: "No" | "Yes"
   - Always visible
   - Located at the bottom of the form

### Inventory List View
Two new columns added to the table:

1. **Expiry Column**
   - Shows formatted date if item has expiry date
   - Shows "—" (dash) if item doesn't have expiry date
   - Red color (#e74c3c) for easy identification

2. **Returnable Column**
   - Shows "Yes" in green (#27ae60) if returnable
   - Shows "No" in gray (#95a5a6) if not returnable

---

## 🔧 Technical Implementation

### Backend Changes (`Backend/routes/inventory.routes.js`)

#### POST /api/inventory (Create Item)
```javascript
const { 
    name, category, quantity, unit, location, status,
    min_stock_level, description, supplier, cost_per_unit, program_id,
    has_expiry_date, expiry_date, is_returnable,
    userId, userEmail, userName, roleId, roleName
} = req.body;

// Convert boolean values to 0/1 for database
await connection.execute(
    `INSERT INTO inventory (
        name, category, quantity, unit, location, status,
        min_stock_level, description, supplier, cost_per_unit, program_id,
        has_expiry_date, expiry_date, is_returnable
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
        name, category, quantity, unit, location, status,
        min_stock_level, description, supplier, cost_per_unit, program_id,
        has_expiry_date ? 1 : 0,  // Convert to 0/1
        expiry_date || null,      // Allow null
        is_returnable ? 1 : 0     // Convert to 0/1
    ]
);
```

#### PUT /api/inventory/:id (Update Item)
```javascript
// Similar conversion logic for updates
await connection.execute(
    `UPDATE inventory SET
        name = ?, category = ?, ...,
        has_expiry_date = ?, expiry_date = ?, is_returnable = ?
    WHERE id = ?`,
    [
        // ... other fields
        has_expiry_date !== undefined ? (has_expiry_date ? 1 : 0) : currentItem[0].has_expiry_date,
        expiry_date !== undefined ? expiry_date : currentItem[0].expiry_date,
        is_returnable !== undefined ? (is_returnable ? 1 : 0) : currentItem[0].is_returnable,
        id
    ]
);
```

### Frontend Changes (`src/components/inventory.js`)

#### State Management
```javascript
const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    location: '',
    min_stock_level: 10,
    description: '',
    supplier: '',
    cost_per_unit: '',
    program_id: '',
    has_expiry_date: false,      // NEW
    expiry_date: '',             // NEW
    is_returnable: false         // NEW
});
```

#### Form Submission Handler
```javascript
const handleCreateItem = async (e) => {
    e.preventDefault();
    
    // Convert UI values to proper types
    const itemData = {
        ...formData,
        has_expiry_date: formData.has_expiry_date === 'yes' || formData.has_expiry_date === true,
        is_returnable: formData.is_returnable === 'yes' || formData.is_returnable === true,
        expiry_date: formData.expiry_date || null
    };
    
    // Send to backend
    const response = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
};
```

#### Edit Modal Population
```javascript
const openEditModal = (item) => {
    setFormData({
        // ... existing fields
        program_id: item.program_id || '',
        has_expiry_date: item.has_expiry_date ? 'yes' : 'no',  // Convert to UI value
        expiry_date: item.expiry_date || '',
        is_returnable: item.is_returnable ? 'yes' : 'no'       // Convert to UI value
    });
};
```

---

## 📊 Use Cases

### Perishable Items Example
**Item**: Canned Food
- **Has Expiry Date**: Yes
- **Expiry Date**: 2025-12-31
- **Is Returnable**: No
- **Use Case**: Track food items that need to be used before expiration

### Returnable Equipment Example
**Item**: Projector
- **Has Expiry Date**: No
- **Expiry Date**: (hidden/null)
- **Is Returnable**: Yes
- **Use Case**: Track equipment that gets borrowed and returned

### Both Features Example
**Item**: Medical Supplies (e.g., Thermometer)
- **Has Expiry Date**: Yes (battery/warranty expiry)
- **Expiry Date**: 2026-06-30
- **Is Returnable**: Yes
- **Use Case**: Items that both expire and need to be returned

---

## 🚀 Installation Instructions

### Step 1: Run Database Migration

**Option A: Using Batch File (Windows)**
```cmd
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
ADD_EXPIRY_AND_RETURNABLE.bat
```

**Option B: Using MySQL Command Line**
```bash
mysql -u root -p sokapptest < add_expiry_and_returnable_to_inventory.sql
```

**Option C: Using phpMyAdmin**
1. Open phpMyAdmin
2. Select `sokapptest` database
3. Go to SQL tab
4. Copy and paste contents of `add_expiry_and_returnable_to_inventory.sql`
5. Click "Go"

### Step 2: Restart Backend Server
```cmd
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```

### Step 3: Refresh Frontend
- Refresh your browser (Ctrl + F5 for hard refresh)
- Navigate to Inventory section
- Click "Add New Item" to see the new fields

---

## ✅ Verification

### Check Database Schema
```sql
DESCRIBE inventory;
```
You should see:
- `has_expiry_date` TINYINT(1)
- `expiry_date` DATE
- `is_returnable` TINYINT(1)

### Test Adding New Item
1. Go to Inventory → Add New Item
2. Fill in basic details
3. Set "Has Expiry Date?" to "Yes"
4. Notice the "Expiry Date" field appears
5. Select a date
6. Set "Returnable?" to "Yes" or "No"
7. Submit the form
8. Verify the item appears in the list with correct values

### Test Editing Existing Item
1. Find an item in the inventory list
2. Click Edit (pencil icon)
3. Change the expiry/returnable settings
4. Save changes
5. Verify updates are reflected

### Check New Columns in List
- Look for "Expiry" and "Returnable" columns in the inventory table
- Verify colors: Red for expiry dates, Green for returnable items

---

## 🔍 Query Examples

### Find All Perishable Items
```sql
SELECT id, name, category, expiry_date
FROM inventory
WHERE has_expiry_date = 1
ORDER BY expiry_date ASC;
```

### Find Items Expiring Soon (Next 30 Days)
```sql
SELECT id, name, category, expiry_date,
       DATEDIFF(expiry_date, CURDATE()) as days_until_expiry
FROM inventory
WHERE has_expiry_date = 1 
  AND expiry_date IS NOT NULL
  AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY expiry_date ASC;
```

### Find All Returnable Items
```sql
SELECT id, name, category, location
FROM inventory
WHERE is_returnable = 1
ORDER BY category, name;
```

### Find Expired Items
```sql
SELECT id, name, category, expiry_date
FROM inventory
WHERE has_expiry_date = 1 
  AND expiry_date < CURDATE()
ORDER BY expiry_date ASC;
```

---

## 📝 Notes

1. **Backward Compatibility**: Existing items will have default values (has_expiry_date=0, is_returnable=0), so they'll appear as non-expiring and non-returnable.

2. **Null Handling**: The `expiry_date` field can be NULL even if `has_expiry_date` is true, allowing you to mark an item as having an expiry date without specifying the exact date yet.

3. **Display Logic**: The UI shows conditional rendering - expiry date field only appears when needed, keeping the form clean.

4. **Data Types**: Boolean values are stored as TINYINT(1) in MySQL (0 = false, 1 = true) but displayed as Yes/No in the UI.

5. **Future Enhancements**: Consider adding:
   - Automatic alerts for items expiring soon
   - Filter options for perishable/returnable items
   - Reports on expiry trends
   - Barcode scanning for expiry tracking

---

## 🆘 Troubleshooting

### Issue: Columns already exist error
**Solution**: The migration may have been run before. Check if columns exist:
```sql
DESCRIBE inventory;
```
If columns exist, no action needed.

### Issue: New fields not showing in form
**Solution**: 
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Check browser console for errors (F12)

### Issue: Can't save expiry date
**Solution**: 
1. Ensure "Has Expiry Date?" is set to "Yes"
2. Check that the date format is valid
3. Verify backend server is running

### Issue: Columns show NULL in database
**Solution**: This is normal for optional fields. NULL means the feature is not applicable or not yet set.

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review the database migration script
3. Inspect browser console for frontend errors
4. Check backend logs for API errors

---

**Version**: 1.0  
**Last Updated**: March 26, 2026  
**Author**: SOKAPP Development Team
