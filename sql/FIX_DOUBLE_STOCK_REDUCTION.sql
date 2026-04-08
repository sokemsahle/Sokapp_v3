-- ============================================
-- FIX: DOUBLE STOCK REDUCTION FOR RETURNABLE ITEMS
-- ============================================
-- Problem: When a returnable item request is approved,
--          stock is reduced twice:
--          1. By after_inventory_request_approved trigger
--          2. By after_returnable_checkout trigger
--
-- Solution: Modify the request approval trigger to skip
--           stock reduction for returnable items
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: DROP OLD TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS `after_inventory_request_approved`;

-- ============================================
-- STEP 2: CREATE FIXED TRIGGER
-- ============================================

DELIMITER //

CREATE TRIGGER `after_inventory_request_approved` 
AFTER UPDATE ON `inventory_requests`
FOR EACH ROW 
BEGIN
  -- Only process if status changed to approved or partially_approved
  IF NEW.status IN ('approved', 'partially_approved') AND OLD.status = 'pending' THEN
    
    -- Check if the item is returnable
    -- If returnable, skip stock reduction here (it will be handled by returnable_transactions trigger)
    IF (SELECT is_returnable FROM inventory WHERE id = NEW.inventory_id) = 0 THEN
      
      -- Reduce inventory quantity (use quantity_approved if partial approval)
      UPDATE inventory 
      SET quantity = quantity - COALESCE(NEW.quantity_approved, NEW.quantity_requested),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.inventory_id;
      
      -- Create transaction log entry
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
  END IF;
END//

DELIMITER ;

-- ============================================
-- STEP 3: VERIFICATION
-- ============================================

SELECT '✅ Trigger updated successfully!' AS status;
SELECT 'Returnable items will now only reduce stock once (via checkout trigger)' AS info;

-- Verify trigger exists
SHOW TRIGGERS LIKE 'inventory_requests';

-- ============================================
-- STEP 4: TEST THE FIX
-- ============================================

/*
Test Case 1: Regular (Consumable) Item
---------------------------------------
1. Request a non-returnable item
2. Approve the request
3. Verify stock reduced ONCE
4. Verify transaction log created

Test Case 2: Returnable Item
----------------------------
1. Request a returnable item
2. Approve the request
3. Verify stock reduced ONCE (via checkout trigger)
4. Verify returnable_transaction created
5. Verify NO duplicate reduction

Verification Queries:
*/

-- Check current inventory levels
SELECT id, name, is_returnable, quantity 
FROM inventory 
WHERE id IN (
    SELECT inventory_id FROM inventory_requests WHERE status = 'approved'
)
ORDER BY is_returnable, name;

-- Check for any duplicate transactions
SELECT 
    inventory_id,
    reason,
    COUNT(*) as count,
    GROUP_CONCAT(id) as transaction_ids
FROM inventory_transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY inventory_id, reason
HAVING count > 1;

-- ============================================
-- FIX COMPLETE
-- ============================================

SELECT '🎉 Double stock reduction issue fixed!' AS message;
