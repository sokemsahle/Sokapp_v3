-- ============================================
-- ADD RETURNABLE ITEMS TRACKING SYSTEM
-- ============================================
-- Description: Creates tables to track when returnable items are checked out
-- and returned, including who took them and when.
-- 
-- Usage: Run this script in phpMyAdmin or via MySQL command line
-- ============================================

USE sokapptest;

-- ============================================
-- STEP 1: CREATE RETURNABLE_TRANSACTIONS TABLE
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
    expected_return_date DATE,
    actual_return_date DATETIME NULL,
    condition_at_checkout TEXT,
    condition_at_return TEXT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_inventory (inventory_id),
    INDEX idx_borrower (borrower_email),
    INDEX idx_checkout_date (checkout_date),
    INDEX idx_expected_return (expected_return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- STEP 2: ADD available_quantity COLUMN TO INVENTORY
-- ============================================
-- This tracks how many items are currently available (not checked out)

ALTER TABLE inventory 
ADD COLUMN available_quantity INT AS (quantity) STORED,
COMMENT = 'Tracks available quantity (updated automatically when items are checked out/returned)';

-- ============================================
-- STEP 3: CREATE TRIGGER TO UPDATE INVENTORY ON CHECKOUT
-- ============================================

DELIMITER $$

CREATE TRIGGER after_returnable_checkout
AFTER INSERT ON returnable_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'checked_out' THEN
        -- Decrease available quantity when item is checked out
        UPDATE inventory 
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.inventory_id;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- STEP 4: CREATE TRIGGER TO UPDATE INVENTORY ON RETURN
-- ============================================

DELIMITER $$

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
-- STEP 5: INSERT SAMPLE DATA (OPTIONAL)
-- ============================================

-- You can uncomment this section to add sample data for testing
/*
INSERT INTO returnable_transactions (
    inventory_id, user_id, borrower_name, borrower_email, 
    borrower_department, quantity, status, checkout_date, 
    expected_return_date, notes
) VALUES 
(1, 1, 'John Doe', 'john@example.com', 'IT Department', 1, 'checked_out', 
 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'Testing returnable system');
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

SELECT 'Returnable Transactions table created successfully!' AS '';

SELECT 'Table Structure:' AS '';
DESCRIBE returnable_transactions;

SELECT 'Current Returnable Items on Checkout:' AS '';
SELECT 
    rt.id,
    i.name as item_name,
    rt.borrower_name,
    rt.borrower_email,
    rt.borrower_department,
    rt.quantity,
    rt.status,
    rt.checkout_date,
    rt.expected_return_date
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.status = 'checked_out'
ORDER BY rt.checkout_date DESC;

SELECT 'Items Currently Checked Out (Summary):' AS '';
SELECT 
    i.name as item_name,
    i.category,
    COUNT(rt.id) as times_checked_out,
    SUM(CASE WHEN rt.status = 'checked_out' THEN rt.quantity ELSE 0 END) as currently_out
FROM inventory i
LEFT JOIN returnable_transactions rt ON i.id = rt.inventory_id
WHERE i.is_returnable = 1
GROUP BY i.id, i.name, i.category
ORDER BY currently_out DESC;
