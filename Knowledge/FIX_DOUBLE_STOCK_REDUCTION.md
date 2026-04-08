# 🔧 Fix: Double Stock Reduction for Returnable Items

## 🐛 Problem Identified

When a **returnable item** request was approved, the stock was being reduced **TWICE**:

1. **First reduction:** By the `after_inventory_request_approved` trigger (on inventory_requests table)
2. **Second reduction:** By the `after_returnable_checkout` trigger (on returnable_transactions table)

This caused inventory to decrease by **2x the approved quantity** instead of just 1x.

---

## ✅ Solution

Modified the `after_inventory_request_approved` trigger to **check if the item is returnable**:

- **If returnable (is_returnable = 1):** Skip stock reduction in this trigger (let the checkout trigger handle it)
- **If not returnable (is_returnable = 0):** Reduce stock as before

---

## 🚀 How to Apply the Fix

### Option 1: Run Fix Script (Recommended)

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
mysql -u root -p sokapptest < FIX_DOUBLE_STOCK_REDUCTION.sql
```

**Or using phpMyAdmin:**
1. Open phpMyAdmin
2. Select `sokapptest` database
3. Go to SQL tab
4. Copy contents of `FIX_DOUBLE_STOCK_REDUCTION.sql`
5. Click "Go"

### Option 2: Manual SQL Execution

Run this SQL in your database:

```sql
-- Drop old trigger
DROP TRIGGER IF EXISTS `after_inventory_request_approved`;

-- Create fixed trigger
DELIMITER //

CREATE TRIGGER `after_inventory_request_approved` 
AFTER UPDATE ON `inventory_requests`
FOR EACH ROW 
BEGIN
  IF NEW.status IN ('approved', 'partially_approved') AND OLD.status = 'pending' THEN
    
    -- Only reduce stock for NON-returnable items
    IF (SELECT is_returnable FROM inventory WHERE id = NEW.inventory_id) = 0 THEN
      
      UPDATE inventory 
      SET quantity = quantity - COALESCE(NEW.quantity_approved, NEW.quantity_requested),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.inventory_id;
      
      INSERT INTO inventory_transactions (
        inventory_id, transaction_type, quantity_change,
        previous_quantity, new_quantity, reason, notes, created_by
      ) VALUES (
        NEW.inventory_id, 'OUT',
        -COALESCE(NEW.quantity_approved, NEW.quantity_requested),
        (SELECT quantity FROM inventory WHERE id = NEW.inventory_id) + COALESCE(NEW.quantity_approved, NEW.quantity_requested),
        (SELECT quantity FROM inventory WHERE id = NEW.inventory_id),
        CONCAT('Request #', NEW.id, ' - ', NEW.requestor_name),
        CONCAT('Approved by: ', IFNULL(NEW.approved_by_name, 'System')),
        NEW.approved_by
      );
    END IF;
  END IF;
END//

DELIMITER ;
```

---

## 🧪 Testing the Fix

### Test 1: Regular (Consumable) Item

1. Request a **non-returnable** item (is_returnable = 0)
2. Note the current stock quantity
3. Approve the request
4. **Expected:** Stock reduced by approved quantity (ONCE)
5. **Verify:** Transaction log entry created

```sql
-- Check inventory
SELECT id, name, quantity FROM inventory WHERE id = YOUR_ITEM_ID;

-- Check transactions
SELECT * FROM inventory_transactions 
WHERE inventory_id = YOUR_ITEM_ID 
ORDER BY created_at DESC LIMIT 5;
```

### Test 2: Returnable Item

1. Request a **returnable** item (is_returnable = 1)
2. Note the current stock quantity
3. Approve the request
4. **Expected:** Stock reduced by approved quantity (ONCE via checkout trigger)
5. **Verify:** returnable_transactions record created

```sql
-- Check inventory
SELECT id, name, quantity, is_returnable FROM inventory WHERE id = YOUR_ITEM_ID;

-- Check checkout transaction
SELECT * FROM returnable_transactions 
WHERE inventory_id = YOUR_ITEM_ID 
ORDER BY checkout_date DESC LIMIT 5;
```

---

## 📊 How It Works Now

### Regular Item Approval Flow

```
Request approved
    ↓
Trigger checks: is_returnable?
    ↓
NO (is_returnable = 0)
    ↓
Reduce stock (Trigger 1)
    ↓
Create transaction log
    ↓
✅ Stock reduced ONCE
```

### Returnable Item Approval Flow

```
Request approved
    ↓
Trigger checks: is_returnable?
    ↓
YES (is_returnable = 1)
    ↓
Skip stock reduction in request trigger
    ↓
Create returnable_transaction (checkout)
    ↓
Checkout trigger reduces stock (Trigger 2)
    ↓
✅ Stock reduced ONCE
```

---

## 🔍 Verification Queries

### Check if Fix is Applied

```sql
-- Verify trigger exists
SHOW TRIGGERS LIKE 'inventory_requests';

-- Check trigger code
SHOW CREATE TRIGGER after_inventory_request_approved;
```

### Monitor Stock Changes

```sql
-- Recent inventory changes
SELECT 
    i.name,
    i.is_returnable,
    it.transaction_type,
    it.quantity_change,
    it.reason,
    it.created_at
FROM inventory_transactions it
JOIN inventory i ON it.inventory_id = i.id
ORDER BY it.created_at DESC
LIMIT 20;
```

### Find Any Double Reductions

```sql
-- Look for duplicate transactions in the last hour
SELECT 
    inventory_id,
    reason,
    COUNT(*) as count,
    GROUP_CONCAT(id) as transaction_ids
FROM inventory_transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY inventory_id, reason
HAVING count > 1;
```

---

## 📝 Files Modified

| File | Change |
|------|--------|
| `database/enhanced_inventory_request_system.sql` | Updated trigger definition |
| `database/FIX_DOUBLE_STOCK_REDUCTION.sql` | Created fix script (NEW) |
| `FIX_DOUBLE_STOCK_REDUCTION.md` | This documentation (NEW) |

---

## ✅ Checklist

After applying the fix:

- [ ] Trigger updated in database
- [ ] Test with regular item (stock reduces once)
- [ ] Test with returnable item (stock reduces once)
- [ ] Verify no duplicate transactions
- [ ] Check inventory accuracy

---

## 🎯 Expected Behavior

### Before Fix ❌

| Item Type | Stock Reduction | Problem |
|-----------|----------------|---------|
| Regular | 1x | ✅ Correct |
| Returnable | 2x | ❌ Double reduction |

### After Fix ✅

| Item Type | Stock Reduction | Status |
|-----------|----------------|--------|
| Regular | 1x | ✅ Correct |
| Returnable | 1x | ✅ Correct |

---

## 🐛 Troubleshooting

### Issue: Still seeing double reduction

**Solution:**
1. Verify trigger was updated: `SHOW CREATE TRIGGER after_inventory_request_approved;`
2. Check if old trigger still exists: `SHOW TRIGGERS;`
3. Manually drop and recreate trigger if needed

### Issue: Stock not reducing for regular items

**Solution:**
1. Check if `is_returnable` is set to 0: `SELECT is_returnable FROM inventory WHERE id = X;`
2. Verify trigger condition is working
3. Check for errors in database logs

---

## 📞 Support

If you need help:

1. Run verification queries above
2. Check database logs for trigger errors
3. Review trigger code: `SHOW CREATE TRIGGER after_inventory_request_approved;`
4. Test with sample data first

---

**Fix Status:** ✅ Ready to Apply  
**Priority:** High (affects inventory accuracy)  
**Risk:** Low (only affects returnable item approvals)
