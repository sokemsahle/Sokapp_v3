-- ============================================
-- RETURNABLE ITEMS - ESSENTIAL SQL QUERIES
-- ============================================
-- Quick reference for daily operations
-- ============================================

USE sokapptest;

-- ============================================
-- 1. SETUP (Run once)
-- ============================================

-- Add return date column to inventory_requests
ALTER TABLE inventory_requests
ADD COLUMN IF NOT EXISTS expected_return_date DATE NULL 
COMMENT 'Expected return date for returnable items' AFTER urgency;

-- ============================================
-- 2. CHECK CURRENT STATUS
-- ============================================

-- View all currently checked out items
SELECT 
    rt.id as transaction_id,
    i.name as item_name,
    i.category,
    rt.borrower_name,
    rt.borrower_email,
    rt.quantity,
    rt.checkout_date,
    rt.expected_return_date,
    DATEDIFF(rt.expected_return_date, CURDATE()) as days_until_due,
    CASE 
        WHEN rt.expected_return_date < CURDATE() THEN '⚠️ OVERDUE'
        WHEN rt.expected_return_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN '⏰ DUE SOON'
        ELSE '✅ ON TRACK'
    END as status
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.status = 'checked_out'
ORDER BY rt.expected_return_date ASC;

-- ============================================
-- 3. OVERDUE ITEMS
-- ============================================

-- Get all overdue items (past return date)
SELECT 
    rt.id,
    i.name as item_name,
    rt.borrower_name,
    rt.borrower_email,
    rt.borrower_department,
    rt.quantity,
    rt.checkout_date,
    rt.expected_return_date,
    DATEDIFF(CURDATE(), rt.expected_return_date) as days_overdue,
    rt.notes
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.status = 'checked_out' 
AND rt.expected_return_date < CURDATE()
ORDER BY days_overdue DESC;

-- ============================================
-- 4. BORROWER HISTORY
-- ============================================

-- Get complete history for a specific borrower
SELECT 
    i.name as item_name,
    i.category,
    rt.quantity,
    rt.status,
    rt.checkout_date,
    rt.expected_return_date,
    rt.actual_return_date,
    rt.condition_at_checkout,
    rt.condition_at_return,
    CASE 
        WHEN rt.status = 'returned' THEN DATEDIFF(rt.actual_return_date, rt.checkout_date)
        WHEN rt.status = 'checked_out' THEN DATEDIFF(CURDATE(), rt.checkout_date)
        ELSE NULL
    END as days_borrowed,
    rt.notes
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
WHERE rt.borrower_email = 'user@example.com'  -- Change email here
ORDER BY rt.checkout_date DESC;

-- ============================================
-- 5. ITEM AVAILABILITY
-- ============================================

-- Show all returnable items and their availability
SELECT 
    i.id,
    i.name as item_name,
    i.category,
    i.quantity as available_stock,
    i.unit,
    i.location,
    (SELECT COUNT(*) FROM returnable_transactions rt 
     WHERE rt.inventory_id = i.id AND rt.status = 'checked_out') as checked_out_count,
    (SELECT SUM(rt.quantity) FROM returnable_transactions rt 
     WHERE rt.inventory_id = i.id AND rt.status = 'checked_out') as total_checked_out
FROM inventory i
WHERE i.is_returnable = 1
ORDER BY i.name;

-- ============================================
-- 6. RETURN AN ITEM
-- ============================================

-- Update transaction to mark as returned
UPDATE returnable_transactions 
SET 
    status = 'returned',
    actual_return_date = NOW(),
    condition_at_return = 'Good condition, no damage',  -- Update as needed
    notes = CONCAT(notes, ' | Returned on time')
WHERE id = 1;  -- Change transaction ID here

-- Note: Inventory quantity will automatically increase via trigger

-- ============================================
-- 7. MANUAL CHECKOUT (If needed)
-- ============================================

-- Manually checkout an item
INSERT INTO returnable_transactions (
    inventory_id, user_id, borrower_name, borrower_email,
    borrower_department, quantity, status, checkout_date,
    expected_return_date, condition_at_checkout, notes, created_by
) VALUES (
    1,  -- inventory_id
    NULL,  -- user_id (optional)
    'John Doe',  -- borrower_name
    'john@example.com',  -- borrower_email
    'Marketing',  -- borrower_department
    1,  -- quantity
    'checked_out',  -- status
    NOW(),  -- checkout_date
    '2026-04-15',  -- expected_return_date
    'Good condition',  -- condition_at_checkout
    'Manual checkout',  -- notes
    1  -- created_by user_id
);

-- Note: Inventory quantity will automatically decrease via trigger

-- ============================================
-- 8. STATISTICS & REPORTS
-- ============================================

-- Monthly checkout statistics
SELECT 
    DATE_FORMAT(checkout_date, '%Y-%m') as month,
    COUNT(*) as total_checkouts,
    COUNT(DISTINCT borrower_email) as unique_borrowers,
    COUNT(DISTINCT inventory_id) as unique_items,
    SUM(quantity) as total_items_checked_out
FROM returnable_transactions
WHERE YEAR(checkout_date) = YEAR(CURDATE())
GROUP BY DATE_FORMAT(checkout_date, '%Y-%m')
ORDER BY month DESC;

-- Most frequently borrowed items
SELECT 
    i.name as item_name,
    i.category,
    COUNT(rt.id) as times_borrowed,
    SUM(rt.quantity) as total_quantity_borrowed,
    COUNT(DISTINCT rt.borrower_email) as unique_borrowers
FROM returnable_transactions rt
JOIN inventory i ON rt.inventory_id = i.id
GROUP BY i.id, i.name, i.category
ORDER BY times_borrowed DESC
LIMIT 10;

-- Most active borrowers
SELECT 
    rt.borrower_name,
    rt.borrower_email,
    rt.borrower_department,
    COUNT(rt.id) as total_checkouts,
    SUM(rt.quantity) as total_items,
    SUM(CASE WHEN rt.status = 'checked_out' THEN 1 ELSE 0 END) as currently_checked_out,
    SUM(CASE WHEN rt.status = 'returned' THEN 1 ELSE 0 END) as completed_returns
FROM returnable_transactions rt
GROUP BY rt.borrower_name, rt.borrower_email, rt.borrower_department
ORDER BY total_checkouts DESC
LIMIT 10;

-- Return compliance rate
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned,
    SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as still_out,
    SUM(CASE WHEN status = 'returned' AND actual_return_date <= expected_return_date THEN 1 ELSE 0 END) as returned_on_time,
    ROUND(
        SUM(CASE WHEN status = 'returned' AND actual_return_date <= expected_return_date THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END), 0), 
        2
    ) as on_time_percentage
FROM returnable_transactions;

-- ============================================
-- 9. CLEANUP & MAINTENANCE
-- ============================================

-- Archive old returned transactions (optional)
-- Create archive table first
CREATE TABLE IF NOT EXISTS returnable_transactions_archive LIKE returnable_transactions;

-- Move transactions older than 1 year
INSERT INTO returnable_transactions_archive
SELECT * FROM returnable_transactions
WHERE status = 'returned' 
AND actual_return_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

-- Delete archived transactions
DELETE FROM returnable_transactions
WHERE status = 'returned' 
AND actual_return_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

-- ============================================
-- 10. TROUBLESHOOTING
-- ============================================

-- Check if triggers exist
SHOW TRIGGERS WHERE `Table` = 'returnable_transactions';

-- Check trigger details
SHOW CREATE TRIGGER after_returnable_checkout;
SHOW CREATE TRIGGER after_returnable_return;

-- Verify inventory matches transactions
SELECT 
    i.id,
    i.name,
    i.quantity as current_stock,
    (SELECT COALESCE(SUM(rt.quantity), 0) 
     FROM returnable_transactions rt 
     WHERE rt.inventory_id = i.id AND rt.status = 'checked_out') as checked_out
FROM inventory i
WHERE i.is_returnable = 1
HAVING checked_out > 0;

-- Fix inventory quantity (if out of sync)
-- WARNING: Use with caution!
-- UPDATE inventory i
-- SET i.quantity = i.quantity + X
-- WHERE i.id = Y;

-- ============================================
-- QUICK REFERENCE TABLES
-- ============================================

-- Transaction statuses:
-- 'checked_out' - Item is currently with borrower
-- 'returned' - Item has been returned
-- 'overdue' - Item is past expected return date

-- Common conditions:
-- 'Excellent condition' - Like new
-- 'Good condition' - Minor wear
-- 'Fair condition' - Noticeable wear but functional
-- 'Poor condition' - Needs repair
-- 'Damaged' - Requires attention

-- ============================================
-- END OF QUICK REFERENCE
-- ============================================
