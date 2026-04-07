-- ============================================
-- COMPLETE RETURNABLE ITEMS MANAGEMENT SYSTEM
-- ============================================
-- Description: Complete SQL setup for returnable items tracking
-- including tables, triggers, and useful queries
-- 
-- Usage: Run this script in phpMyAdmin or via MySQL command line
-- Database: sokapptest
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: ENSURE INVENTORY TABLE HAS RETURNABLE COLUMN
-- ============================================

-- Add is_returnable column if it doesn't exist
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS is_returnable TINYINT(1) DEFAULT 0 COMMENT 'Whether item is returnable (1=Yes, 0=No)';

-- Add expiry tracking columns if they don't exist
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS has_expiry_date TINYINT(1) DEFAULT 0 COMMENT 'Whether item has expiry date',
ADD COLUMN IF NOT EXISTS expiry_date DATE NULL COMMENT 'Expiry date for perishable items';

-- ============================================
-- STEP 2: CREATE RETURNABLE_TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS returnable_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_id INT NOT NULL,
    user_id INT,
    borrower_name VARCHAR(255) NOT NULL,
    borrower_email VARCHAR(255),
    borrower_department VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('checked_out', 'returned', 'overdue') DEFAULT 'checked_out',
    checkout_date DATETIME NOT NULL,
    expected_return_date DATE COMMENT 'When borrower expects to return',
    actual_return_date DATETIME NULL COMMENT 'When item was actually returned',
    condition_at_checkout TEXT COMMENT 'Item condition when checked out',
    condition_at_return TEXT COMMENT 'Item condition when returned',
    notes TEXT COMMENT 'Additional notes or comments',
    created_by INT COMMENT 'User who created this transaction',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_inventory (inventory_id),
    INDEX idx_borrower (borrower_email),
    INDEX idx_checkout_date (checkout_date),
    INDEX idx_expected_return (expected_return_date),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Tracks checkout and return of returnable inventory items';

-- ============================================
-- STEP 3: ADD RETURN DATE TO INVENTORY REQUESTS
-- ============================================

-- Add expected_return_date column to inventory_requests for returnable items
ALTER TABLE inventory_requests
ADD COLUMN IF NOT EXISTS expected_return_date DATE NULL COMMENT 'Expected return date for returnable items' AFTER urgency;

-- ============================================
-- STEP 4: DROP OLD TRIGGERS IF THEY EXIST
-- ============================================

DROP TRIGGER IF EXISTS after_returnable_checkout;
DROP TRIGGER IF EXISTS after_returnable_return;

-- ============================================
-- STEP 5: CREATE TRIGGERS FOR AUTOMATIC INVENTORY UPDATES
-- ============================================

DELIMITER $$

-- Trigger: Decrease inventory when item is checked out
CREATE TRIGGER after_returnable_checkout
AFTER INSERT ON returnable_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'checked_out' THEN
        -- Decrease quantity when item is checked out
        UPDATE inventory 
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.inventory_id;
    END IF;
END$$

-- Trigger: Increase inventory when item is returned
CREATE TRIGGER after_returnable_return
AFTER UPDATE ON returnable_transactions
FOR EACH ROW
BEGIN
    IF OLD.status = 'checked_out' AND NEW.status = 'returned' THEN
        -- Increase quantity when item is returned
        UPDATE inventory 
        SET quantity = quantity + NEW.quantity
        WHERE id = NEW.inventory_id;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- STEP 6: CREATE USEFUL VIEWS
-- ============================================

-- View: Currently checked out items with details
CREATE OR REPLACE VIEW v_checked_out_items AS
SELECT 
    rt.id as transaction_id,
    rt.inventory_id,
    i.name as item_name,
    i.category,
    i.unit,
    i.location,
    rt.borrower_name,
    rt.borrower_email,
    rt.borrower_department,
    rt.quantity,
    rt.checkout_date,
    rt.expected_return_date,
    rt.condition_at_checkout,
    rt.notes,
    rt.user_id,
    u.full_name as processed_by,
    DATEDIFF(rt.expected_return_date, CURDATE()) as days_until_due,
    CASE 
        WHEN rt.expected_return_date < CURDATE() THEN 'OVERDUE'
        WHEN rt.expected_return_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 'DUE SOON'
        ELSE 'ON TRACK'
    END as return_status
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
LEFT JOIN users u ON rt.created_by = u.id
WHERE rt.status = 'checked_out'
ORDER BY rt.expected_return_date ASC;

-- View: Returnable items summary
CREATE OR REPLACE VIEW v_returnable_items_summary AS
SELECT 
    i.id as item_id,
    i.name as item_name,
    i.category,
    i.quantity as current_stock,
    i.location,
    i.unit,
    COUNT(rt.id) as total_checkouts,
    SUM(CASE WHEN rt.status = 'checked_out' THEN 1 ELSE 0 END) as currently_checked_out,
    SUM(CASE WHEN rt.status = 'returned' THEN 1 ELSE 0 END) as total_returns,
    MAX(rt.checkout_date) as last_checkout_date,
    MIN(CASE WHEN rt.status = 'checked_out' THEN rt.expected_return_date END) as earliest_due_date
FROM inventory i
LEFT JOIN returnable_transactions rt ON i.id = rt.inventory_id
WHERE i.is_returnable = 1
GROUP BY i.id, i.name, i.category, i.quantity, i.location, i.unit
ORDER BY currently_checked_out DESC;

-- View: Transaction history with full details
CREATE OR REPLACE VIEW v_returnable_transaction_history AS
SELECT 
    rt.id as transaction_id,
    i.name as item_name,
    i.category,
    rt.borrower_name,
    rt.borrower_email,
    rt.borrower_department,
    rt.quantity,
    rt.status,
    rt.checkout_date,
    rt.expected_return_date,
    rt.actual_return_date,
    rt.condition_at_checkout,
    rt.condition_at_return,
    rt.notes,
    u.full_name as processed_by,
    CASE 
        WHEN rt.status = 'checked_out' AND rt.expected_return_date < CURDATE() THEN 'OVERDUE'
        WHEN rt.status = 'checked_out' THEN 'CHECKED OUT'
        WHEN rt.status = 'returned' THEN 'RETURNED'
        ELSE rt.status
    END as display_status,
    CASE 
        WHEN rt.status = 'returned' AND rt.actual_return_date IS NOT NULL 
        THEN DATEDIFF(rt.actual_return_date, rt.checkout_date)
        ELSE NULL
    END as days_borrowed
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
LEFT JOIN users u ON rt.created_by = u.id
ORDER BY rt.checkout_date DESC;

-- ============================================
-- STEP 7: CREATE STORED PROCEDURES (OPTIONAL)
-- ============================================

DELIMITER $$

-- Procedure: Get overdue items
CREATE PROCEDURE IF NOT EXISTS sp_get_overdue_items()
BEGIN
    SELECT 
        rt.id as transaction_id,
        i.name as item_name,
        i.category,
        rt.borrower_name,
        rt.borrower_email,
        rt.borrower_department,
        rt.quantity,
        rt.checkout_date,
        rt.expected_return_date,
        DATEDIFF(CURDATE(), rt.expected_return_date) as days_overdue,
        rt.condition_at_checkout,
        rt.notes
    FROM returnable_transactions rt
    JOIN inventory i ON rt.inventory_id = i.id
    WHERE rt.status = 'checked_out' 
    AND rt.expected_return_date < CURDATE()
    ORDER BY rt.expected_return_date ASC;
END$$

-- Procedure: Get borrower history
CREATE PROCEDURE IF NOT EXISTS sp_get_borrower_history(IN borrower_email_param VARCHAR(255))
BEGIN
    SELECT 
        rt.id as transaction_id,
        i.name as item_name,
        i.category,
        rt.quantity,
        rt.status,
        rt.checkout_date,
        rt.expected_return_date,
        rt.actual_return_date,
        rt.condition_at_checkout,
        rt.condition_at_return,
        rt.notes,
        CASE 
            WHEN rt.status = 'returned' THEN DATEDIFF(rt.actual_return_date, rt.checkout_date)
            WHEN rt.status = 'checked_out' THEN DATEDIFF(CURDATE(), rt.checkout_date)
            ELSE NULL
        END as days_borrowed
    FROM returnable_transactions rt
    JOIN inventory i ON rt.inventory_id = i.id
    WHERE rt.borrower_email = borrower_email_param
    ORDER BY rt.checkout_date DESC;
END$$

DELIMITER ;

-- ============================================
-- STEP 8: SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Uncomment the following to insert sample data

/*
-- First, ensure you have some returnable items
INSERT INTO inventory (name, category, quantity, unit, location, status, is_returnable) VALUES
('Projector Epson', 'Electronics', 5, 'units', 'Storage Room A', 'In Stock', 1),
('Canon Camera', 'Electronics', 3, 'units', 'Storage Room B', 'In Stock', 1),
('Laptop Dell', 'Electronics', 10, 'units', 'IT Room', 'In Stock', 1),
('Drill Machine', 'Tools', 8, 'units', 'Tool Shed', 'In Stock', 1)
ON DUPLICATE KEY UPDATE is_returnable = 1;

-- Insert sample checkout transactions
INSERT INTO returnable_transactions (
    inventory_id, user_id, borrower_name, borrower_email, 
    borrower_department, quantity, status, checkout_date, 
    expected_return_date, condition_at_checkout, notes
) VALUES 
(1, 1, 'John Doe', 'john@example.com', 'Marketing', 1, 'checked_out', 
 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'Good condition, all cables included', 
 'Need for client presentation'),
(2, 2, 'Jane Smith', 'jane@example.com', 'Communications', 1, 'checked_out', 
 NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 'Excellent condition', 
 'Event photography'),
(3, NULL, 'Bob Wilson', 'bob@example.com', 'IT', 1, 'checked_out', 
 DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 
 'Minor scratches on body', 'Software development - OVERDUE');
*/

-- ============================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================

-- Check table structure
SELECT '✅ returnable_transactions table created' AS status;
DESCRIBE returnable_transactions;

-- Check triggers
SELECT '✅ Triggers created' AS status;
SHOW TRIGGERS WHERE `Table` = 'returnable_transactions';

-- Check views
SELECT '✅ Views created' AS status;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Check current returnable items
SELECT '📦 Current returnable items in inventory:' AS info;
SELECT id, name, category, quantity, unit, location, is_returnable 
FROM inventory 
WHERE is_returnable = 1;

-- Check current checkouts
SELECT '📋 Current checked out items:' AS info;
SELECT * FROM v_checked_out_items;

-- Check summary
SELECT '📊 Returnable items summary:' AS info;
SELECT * FROM v_returnable_items_summary;

-- ============================================
-- STEP 10: USEFUL QUERIES FOR DAILY USE
-- ============================================

/*
-- 1. View all currently checked out items
SELECT * FROM v_checked_out_items;

-- 2. View overdue items only
SELECT * FROM v_checked_out_items WHERE return_status = 'OVERDUE';

-- 3. View items due soon (within 3 days)
SELECT * FROM v_checked_out_items WHERE return_status = 'DUE SOON';

-- 4. Get borrower's complete history
CALL sp_get_borrower_history('john@example.com');

-- 5. Get all overdue items using stored procedure
CALL sp_get_overdue_items();

-- 6. View complete transaction history
SELECT * FROM v_returnable_transaction_history LIMIT 50;

-- 7. Count items by status
SELECT status, COUNT(*) as count 
FROM returnable_transactions 
GROUP BY status;

-- 8. Most frequently borrowed items
SELECT item_name, category, total_checkouts 
FROM v_returnable_items_summary 
ORDER BY total_checkouts DESC 
LIMIT 10;

-- 9. Items currently available (not checked out)
SELECT i.id, i.name, i.category, i.quantity, i.unit, i.location
FROM inventory i
WHERE i.is_returnable = 1 AND i.quantity > 0
ORDER BY i.name;

-- 10. Monthly checkout statistics
SELECT 
    DATE_FORMAT(checkout_date, '%Y-%m') as month,
    COUNT(*) as total_checkouts,
    COUNT(DISTINCT borrower_email) as unique_borrowers,
    COUNT(DISTINCT inventory_id) as unique_items
FROM returnable_transactions
GROUP BY DATE_FORMAT(checkout_date, '%Y-%m')
ORDER BY month DESC;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT '✅ Returnable Items Management System Setup Complete!' AS message;
SELECT 'Run the useful queries in Step 10 to verify everything is working.' AS next_steps;
