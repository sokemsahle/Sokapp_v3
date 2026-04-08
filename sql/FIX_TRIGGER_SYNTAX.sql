-- ============================================
-- QUICK FIX: Trigger Syntax for MariaDB
-- ============================================
-- Run this separately if the main SQL file fails
-- This is the corrected trigger syntax for MariaDB

-- Drop trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS `after_inventory_request_approved`//

-- Create the trigger with correct MariaDB syntax
DELIMITER //

CREATE TRIGGER `after_inventory_request_approved` 
AFTER UPDATE ON `inventory_requests`
FOR EACH ROW 
BEGIN
  -- Only process if status changed to approved or partially_approved
  IF NEW.status IN ('approved', 'partially_approved') AND OLD.status = 'pending' THEN
    
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
END//

DELIMITER ;

-- Verify trigger was created
SHOW TRIGGERS LIKE 'inventory_requests';
