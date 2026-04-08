# Returnable Items Request System - Update Summary

## 🎯 What Changed

I've updated the inventory request system to intelligently handle returnable items differently from consumable items.

---

## ✨ New Features

### 1. **Smart Request Form**
When a user selects a returnable item in the request form:
- ✅ The item is marked with **[RETURNABLE]** in the dropdown
- ✅ An **"Expected Return Date"** field appears (optional)
- ✅ Helpful hint text explains the item needs to be returned
- ✅ When a different item is selected, the return date field clears

### 2. **Different Processing for Returnable Items**
When a request is approved:

**For Regular (Consumable) Items:**
- Stock is reduced permanently
- Item is considered "used up"
- Standard approval flow

**For Returnable Items:**
- Creates a **checkout transaction** automatically
- Stock is reduced (item is checked out)
- Item appears in "Currently Checked Out" list
- Borrower can be tracked
- When returned, stock increases automatically

### 3. **Enhanced Notifications**
Approval emails now differentiate between item types:
- Returnable items: "Checkout Ready" messaging
- Shows expected return date in email
- Reminder to return on time

---

## 📋 User Experience Flow

### Requesting a Returnable Item

```
1. User goes to Inventory → Request Item
2. Selects item marked [RETURNABLE]
3. Form shows "Expected Return Date" field (optional)
4. Submits request with return date
5. Manager approves request
6. ✅ System automatically:
   - Creates checkout transaction
   - Reduces inventory
   - Sends approval email with return date reminder
7. Item appears in Returnable Items → Currently Checked Out
8. User returns item when done
9. ✅ System automatically:
   - Increases inventory
   - Marks transaction as returned
   - Records return date and condition
```

---

## 🔧 Technical Changes

### Frontend Changes

**File:** `src/components/inventory.js`

1. **Added return date field to state:**
```javascript
const [requestFormData, setRequestFormData] = useState({
  inventory_id: '',
  quantity_needed: '',
  reason: '',
  urgency: 'normal',
  expected_return_date: ''  // NEW
});
```

2. **Updated handleRequestItem function:**
- Detects if selected item is returnable
- Includes `is_returnable` and `expected_return_date` in request data
- Shows appropriate success message

3. **Enhanced request form UI:**
- Shows [RETURNABLE] tag in item dropdown
- Conditionally displays return date field
- Clears return date when item changes
- Adds helpful hint text

### Backend Changes

**File:** `Backend/routes/inventory.routes.js`

**Updated `/api/inventory/request/:id/approve` endpoint:**

```javascript
if (request.is_returnable) {
  // Create checkout transaction instead of just reducing stock
  INSERT INTO returnable_transactions (...)
} else {
  // Standard approval (stock reduction via trigger)
  UPDATE inventory_requests SET status = 'approved'...
}
```

**Key Differences:**
- Returnable items create a `returnable_transactions` record
- Automatic checkout transaction creation
- Includes expected return date from request
- Links to original request via notes field

---

## 🗄️ Database Changes

### New SQL File Created

**File:** `database/setup_returnable_items_complete.sql`

This comprehensive SQL script includes:

1. **Table Modifications:**
   - Adds `is_returnable` column to inventory (if not exists)
   - Adds `expected_return_date` to inventory_requests
   - Creates `returnable_transactions` table

2. **Automatic Triggers:**
   - `after_returnable_checkout` - Decreases stock on checkout
   - `after_returnable_return` - Increases stock on return

3. **Useful Views:**
   - `v_checked_out_items` - All current checkouts with status
   - `v_returnable_items_summary` - Summary statistics
   - `v_returnable_transaction_history` - Complete history

4. **Stored Procedures:**
   - `sp_get_overdue_items()` - Get all overdue items
   - `sp_get_borrower_history(email)` - Get borrower's history

5. **Sample Queries:**
   - 10 useful queries for daily operations
   - Reporting and analytics queries

---

## 🚀 Installation Steps

### Step 1: Run Database Migration

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
mysql -u root -p sokapptest < setup_returnable_items_complete.sql
```

**Or using phpMyAdmin:**
1. Open phpMyAdmin
2. Select `sokapptest` database
3. Go to SQL tab
4. Copy and paste contents of `setup_returnable_items_complete.sql`
5. Click "Go"

### Step 2: Restart Backend Server

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
# Stop current server (Ctrl+C)
node server.js
```

### Step 3: Test the Feature

1. **Mark an item as returnable:**
   - Go to Inventory → View Inventory
   - Edit an item or add new
   - Set "Returnable?" to Yes
   - Save

2. **Request the item:**
   - Go to Inventory → Request Item
   - Select the returnable item
   - Notice the [RETURNABLE] tag
   - Fill in Expected Return Date (optional)
   - Submit request

3. **Approve the request:**
   - Go to Inventory → Request Approvals
   - Find the pending request
   - Click Approve
   - Set approval quantity
   - Submit

4. **Verify checkout:**
   - Go to Inventory → Returnable Items
   - Check "Currently Checked Out" tab
   - Item should be listed with borrower info

---

## 📊 Database Schema Updates

### inventory_requests Table

**New Column:**
```sql
expected_return_date DATE NULL 
COMMENT 'Expected return date for returnable items'
```

### returnable_transactions Table

**Complete table creation included in SQL file:**
- Tracks all checkout/return transactions
- Links to inventory and users
- Stores condition and notes
- Automatic timestamps

---

## 🎨 UI/UX Improvements

### Request Form Changes

**Before:**
```
┌─────────────────────────────────┐
│ Select Item: [Projector       ] │
│ Quantity: [2                  ] │
│ Urgency: [Normal              ] │
│ Reason: [                     ] │
│                                 │
│ [Submit Request]                │
└─────────────────────────────────┘
```

**After (for returnable items):**
```
┌─────────────────────────────────────────────┐
│ Select Item: [Projector [RETURNABLE]      ] │
│ Quantity: [2                              ] │
│ Urgency: [Normal                          ] │
│                                             │
│ Expected Return Date (Optional):           │
│ [2026-04-15                              ] │
│ ℹ️ This item is returnable. Please         │
│    indicate when you plan to return it.    │
│                                             │
│ Reason: [                                 ] │
│                                             │
│ [Submit Request]                            │
└─────────────────────────────────────────────┘
```

---

## 📧 Email Notification Changes

### Regular Item Approval Email
```
Subject: ✅ Inventory Request #123 Approved
Content: You can collect your items from the inventory location.
```

### Returnable Item Approval Email
```
Subject: ✅ Returnable Item Request #123 Approved - Checkout Ready
Content: 
📦 Returnable Item: This item has been checked out to you. 
   Please return it by the expected return date.
Expected Return Date: April 15, 2026
You can collect your item from the inventory location. 
Remember to return it on time!
```

---

## 🔍 How It Works

### Request Submission Flow

```javascript
User selects item
    ↓
System checks: is item returnable?
    ↓
YES: Show return date field
NO: Standard form
    ↓
User submits request
    ↓
Request saved with is_returnable flag
    ↓
Manager approves
    ↓
System checks: is_returnable?
    ↓
YES: Create checkout transaction
NO: Reduce stock permanently
```

### Approval Processing Flow

```javascript
Manager approves request
    ↓
Check if item is returnable
    ↓
┌─────────────┬──────────────┐
│ RETURNABLE  │ CONSUMABLE   │
├─────────────┼──────────────┤
│ Create      │ Update       │
│ checkout    │ request      │
│ transaction │ status only  │
│             │              │
│ Stock       │ Stock        │
│ reduced     │ reduced      │
│ via trigger │ via trigger  │
│             │              │
│ Item        │ No further   │
│ tracked     │ tracking     │
└─────────────┴──────────────┘
```

---

## 💡 Use Cases

### Perfect for:

1. **Equipment Checkout**
   - Projectors for presentations
   - Cameras for events
   - Laptops for remote work

2. **Tool Lending**
   - Power tools
   - Hand tools
   - Specialized equipment

3. **Resource Sharing**
   - Books/materials
   - Training equipment
   - Sports equipment

### Not for:

- Consumable supplies (paper, pens)
- Food and beverages
- Items that get used up

---

## 📝 API Changes

### Request Body (POST /api/inventory/request)

**New Fields:**
```json
{
  "inventory_id": 1,
  "quantity_requested": 2,
  "reason": "Need for presentation",
  "urgency": "normal",
  "requestor_name": "John Doe",
  "requestor_email": "john@example.com",
  "is_returnable": true,
  "expected_return_date": "2026-04-15"
}
```

### Approval Response

**For Returnable Items:**
```json
{
  "success": true,
  "message": "Request approved successfully. Item checked out automatically.",
  "status": "approved",
  "quantity_approved": 2,
  "transaction_id": 45
}
```

**For Regular Items:**
```json
{
  "success": true,
  "message": "Request approved successfully. Stock updated automatically.",
  "status": "approved",
  "quantity_approved": 2
}
```

---

## 🐛 Troubleshooting

### Issue: Return date field not showing
**Solution:** 
- Verify item has `is_returnable = 1` in database
- Refresh the page
- Check browser console for errors

### Issue: Checkout transaction not created on approval
**Solution:**
- Check backend logs for errors
- Verify `returnable_transactions` table exists
- Ensure triggers are created: `SHOW TRIGGERS;`

### Issue: Stock not updating
**Solution:**
- Verify triggers exist and are active
- Check trigger code: `SHOW CREATE TRIGGER after_returnable_checkout;`
- Manual test: Insert test transaction and check inventory

---

## 📈 Benefits

### For Users:
✅ Clear indication which items are returnable  
✅ Easy to request and track borrowed items  
✅ Automatic reminders via due dates  
✅ Simple return process  

### For Managers:
✅ Automated checkout process  
✅ Complete tracking of who has what  
✅ Overdue item identification  
✅ Usage analytics and reporting  

### For Organization:
✅ Accountability for assets  
✅ Reduced loss of equipment  
✅ Better resource utilization  
✅ Historical usage data  

---

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Restart backend server
3. ✅ Test with a returnable item
4. ✅ Train users on new feature
5. ✅ Monitor usage via reports

---

## 📞 Support

**Documentation Files:**
- `RETURNABLE_ITEMS_MANAGEMENT_SUMMARY.md` - Complete guide
- `RETURNABLE_ITEMS_QUICK_REFERENCE.md` - Quick reference
- `database/setup_returnable_items_complete.sql` - Database setup

**Useful Queries:**
```sql
-- Check current checkouts
SELECT * FROM v_checked_out_items;

-- Get overdue items
CALL sp_get_overdue_items();

-- View borrower history
CALL sp_get_borrower_history('user@example.com');
```

---

**Version**: 2.0  
**Last Updated**: April 7, 2026  
**Status**: Production Ready ✅
