# 🔧 MariaDB Trigger Syntax Fix

## The Problem

MariaDB requires using `//` instead of `$$` as the delimiter when creating triggers.

## ✅ Solution - Run This Instead

### Option 1: Use the Fixed SQL File (Recommended)

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
mysql -u root -p sokapptest < FIX_TRIGGER_SYNTAX.sql
```

### Option 2: Copy-Paste in phpMyAdmin

1. Open phpMyAdmin → Select `sokapptest` database
2. Click "SQL" tab
3. **Copy this corrected code:**

```sql
DELIMITER //

DROP TRIGGER IF EXISTS `after_inventory_request_approved`//

CREATE TRIGGER `after_inventory_request_approved` 
AFTER UPDATE ON `inventory_requests`
FOR EACH ROW 
BEGIN
  IF NEW.status IN ('approved', 'partially_approved') AND OLD.status = 'pending' THEN
    
    UPDATE inventory 
    SET quantity = quantity - COALESCE(NEW.quantity_approved, NEW.quantity_requested),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.inventory_id;
    
    INSERT INTO inventory_transactions (
      inventory_id,
      transaction_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      notes,
      created_by
    ) VALUES (
      NEW.inventory_id,
      'OUT',
      -COALESCE(NEW.quantity_approved, NEW.quantity_requested),
      (SELECT quantity FROM inventory WHERE id = NEW.inventory_id) + COALESCE(NEW.quantity_approved, NEW.quantity_requested),
      (SELECT quantity FROM inventory WHERE id = NEW.inventory_id),
      CONCAT('Request #', NEW.id, ' - ', NEW.requestor_name),
      CONCAT('Approved by: ', IFNULL(NEW.approved_by_name, 'System')),
      NEW.approved_by
    );
  END IF;
END//

DELIMITER ;
```

4. Click **"Go"** button
5. You should see: ✅ "Query executed successfully"

---

## Verify It Worked

Run this query to check if trigger exists:

```sql
SHOW TRIGGERS LIKE 'inventory_requests';
```

You should see:
```
Trigger: after_inventory_request_approved
Event: UPDATE
Table: inventory_requests
Timing: AFTER
```

---

## What Changed?

**Before (❌ Error):**
```sql
DELIMITER $$
...
END$$
```

**After (✅ Works):**
```sql
DELIMITER //
...
END//
```

Also simplified the logic by removing DECLARE and using `COALESCE()` function instead.

---

## Test the Trigger

After creating it, test with:

```sql
-- Update a request to approved
UPDATE inventory_requests 
SET status = 'approved', 
    quantity_approved = 5,
    approved_by = 1,
    approved_by_name = 'Test Admin',
    approval_date = NOW()
WHERE id = 1;

-- Check if stock was reduced
SELECT name, quantity FROM inventory WHERE id = 1;

-- Check if transaction was logged
SELECT * FROM inventory_transactions ORDER BY created_at DESC LIMIT 1;
```

---

**Status:** ✅ Fixed  
**Compatible with:** MariaDB 10.x, MySQL 5.7+
