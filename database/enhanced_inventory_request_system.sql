-- ============================================
-- ENHANCED INVENTORY REQUEST MANAGEMENT SYSTEM
-- ============================================
-- This script creates the necessary tables and triggers for:
-- 1. Inventory request system with dropdown item selection
-- 2. Email notifications to inventory managers
-- 3. Auto-approval workflow
-- 4. Automatic stock reduction on approval
-- 5. Transaction logging

-- ========================================================
-- STEP 1: Create inventory_requests table
-- ========================================================

CREATE TABLE IF NOT EXISTS `inventory_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inventory_id` int(11) NOT NULL,
  `requestor_user_id` int(11) DEFAULT NULL,
  `requestor_name` varchar(255) NOT NULL,
  `requestor_email` varchar(255) NOT NULL,
  `requestor_department` varchar(100) DEFAULT NULL,
  `quantity_requested` int(11) NOT NULL DEFAULT 1,
  `quantity_approved` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `urgency` enum('low','normal','high','urgent') DEFAULT 'normal',
  `status` enum('pending','approved','rejected','partially_approved') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_by_name` varchar(255) DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `notified` tinyint(1) DEFAULT 0,
  `email_sent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_inventory_id` (`inventory_id`),
  KEY `idx_requestor_id` (`requestor_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================================
-- STEP 2: Add inventory_manage permission to Admin role if not exists
-- ========================================================

INSERT INTO role_permissions (role_id, permission_id) 
VALUES (1, 3)  -- Admin role gets inventory_manage
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- Verify Standard users still have inventory_view
INSERT INTO role_permissions (role_id, permission_id) 
VALUES (6, 2)  -- Standard role gets inventory_view
ON DUPLICATE KEY UPDATE permission_id = permission_id;

-- ========================================================
-- STEP 3: Create trigger to auto-reduce stock on approval
-- ========================================================

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

-- ========================================================
-- STEP 4: Insert sample data for testing (optional)
-- ========================================================

-- Add some test inventory items if you don't have any
INSERT INTO inventory (name, category, quantity, unit, location, status, min_stock_level, supplier) VALUES
('A4 Paper Reams', 'Office Supplies', 500, 'reams', 'Storage Room A', 'In Stock', 50, 'Office Depot'),
('Ballpoint Pens (Blue)', 'Office Supplies', 1000, 'pieces', 'Storage Room A', 'In Stock', 100, 'BIC'),
('Ballpoint Pens (Red)', 'Office Supplies', 800, 'pieces', 'Storage Room A', 'In Stock', 100, 'BIC'),
('Notebooks', 'Office Supplies', 300, 'pieces', 'Storage Room B', 'In Stock', 50, 'Moleskine'),
('Printer Ink Cartridges', 'Electronics', 50, 'pieces', 'Storage Room C', 'In Stock', 10, 'HP'),
('USB Flash Drives 16GB', 'Electronics', 100, 'pieces', 'Storage Room C', 'In Stock', 20, 'SanDisk'),
('Desk Lamps', 'Furniture', 75, 'pieces', 'Storage Room D', 'In Stock', 15, 'IKEA'),
('Office Chairs', 'Furniture', 30, 'pieces', 'Warehouse', 'In Stock', 5, 'IKEA'),
('Whiteboard Markers', 'Office Supplies', 400, 'pieces', 'Storage Room A', 'In Stock', 50, 'Expo'),
('Staplers', 'Office Supplies', 150, 'pieces', 'Storage Room A', 'In Stock', 25, 'Swingline');

-- ========================================================
-- STEP 5: Verification queries
-- ========================================================

-- Check if table was created successfully
SELECT 'inventory_requests table created:' AS info;
SHOW TABLES LIKE 'inventory_requests';

-- Check permissions
SELECT 'Role permissions updated:' AS info;
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name IN ('inventory_view', 'inventory_manage')
ORDER BY r.name, p.name;

-- Show current inventory items
SELECT 'Current inventory items:' AS info;
SELECT id, name, category, quantity, unit, location, status 
FROM inventory 
ORDER BY category, name;

-- ========================================================
-- USAGE EXAMPLES
-- ========================================================

/*
To create a request (frontend will call API):
POST /api/inventory/request
{
  "inventory_id": 1,
  "requestor_name": "John Doe",
  "requestor_email": "john@example.com",
  "requestor_department": "Finance",
  "quantity_requested": 10,
  "reason": "Need for monthly reports",
  "urgency": "normal"
}

To approve a request:
PUT /api/inventory/request/:id/approve
{
  "approved_by": 1,
  "approved_by_name": "Admin User",
  "quantity_approved": 10  // Can be less than requested for partial approval
}

To reject a request:
PUT /api/inventory/request/:id/reject
{
  "rejected_by": 1,
  "rejection_reason": "Insufficient stock"
}

To get pending requests for inventory managers:
GET /api/inventory/requests/pending
*/
