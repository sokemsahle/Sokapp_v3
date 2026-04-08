-- ============================================
-- QUICK REFERENCE: Common Inventory Request Queries
-- ============================================

-- 1. View all pending requests
SELECT 
    ir.id as request_id,
    ir.requestor_name,
    ir.requestor_email,
    i.name as item_name,
    ir.quantity_requested,
    i.quantity as current_stock,
    ir.urgency,
    ir.reason,
    ir.created_at
FROM inventory_requests ir
JOIN inventory i ON ir.inventory_id = i.id
WHERE ir.status = 'pending'
ORDER BY FIELD(ir.urgency, 'urgent', 'high', 'normal', 'low'), ir.created_at DESC;

-- 2. View my requests (for a specific user)
SELECT * FROM inventory_requests 
WHERE requestor_email = 'john@example.com'
ORDER BY created_at DESC;

-- 3. Approve a request manually (bypassing API)
UPDATE inventory_requests 
SET 
    status = 'approved',
    quantity_approved = quantity_requested,
    approved_by = 1,
    approved_by_name = 'Admin User',
    approval_date = CURRENT_TIMESTAMP,
    notified = 1
WHERE id = 1 AND status = 'pending';

-- 4. Reject a request manually
UPDATE inventory_requests 
SET 
    status = 'rejected',
    rejected_by = 1,
    rejected_by_name = 'Admin User',
    rejection_reason = 'Manual rejection test',
    rejected_at = CURRENT_TIMESTAMP
WHERE id = 1 AND status = 'pending';

-- 5. Check stock levels before approval
SELECT 
    ir.id as request_id,
    i.name as item_name,
    i.quantity as current_stock,
    ir.quantity_requested,
    CASE 
        WHEN i.quantity >= ir.quantity_requested THEN '✅ Can approve'
        ELSE '❌ Insufficient stock'
    END as approval_status
FROM inventory_requests ir
JOIN inventory i ON ir.inventory_id = i.id
WHERE ir.status = 'pending';

-- 6. View request statistics
SELECT 
    status,
    COUNT(*) as count,
    SUM(quantity_requested) as total_requested,
    SUM(quantity_approved) as total_approved
FROM inventory_requests
GROUP BY status;

-- 7. Requests by urgency
SELECT 
    urgency,
    COUNT(*) as count,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM inventory_requests
GROUP BY urgency;

-- 8. Recent requests (last 7 days)
SELECT * FROM inventory_requests
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- 9. Check if trigger exists
SHOW TRIGGERS LIKE 'inventory_requests';

-- 10. Manually add transaction log entry (if trigger didn't fire)
INSERT INTO inventory_transactions (
    inventory_id,
    transaction_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    notes
) VALUES (
    1,                              -- inventory_id
    'OUT',                          -- transaction type
    -10,                            -- quantity change (negative for out)
    500,                            -- previous quantity
    490,                            -- new quantity
    'Request #123 - John Doe',     -- reason
    'Approved by Admin'             -- notes
);

-- 11. View transaction history for an item
SELECT 
    t.*,
    i.name as item_name
FROM inventory_transactions t
JOIN inventory i ON t.inventory_id = i.id
WHERE i.id = 1
ORDER BY t.created_at DESC;

-- 12. Find users with inventory_manage permission
SELECT DISTINCT u.email, u.full_name
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'inventory_manage' AND u.is_active = 1;

-- 13. Low stock alerts (items below min_stock_level)
SELECT 
    id,
    name,
    quantity,
    min_stock_level,
    (quantity - min_stock_level) as difference
FROM inventory
WHERE quantity < min_stock_level
ORDER BY difference ASC;

-- 14. Delete old rejected requests (cleanup)
DELETE FROM inventory_requests 
WHERE status = 'rejected' 
AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 15. Export all requests for reporting
SELECT 
    ir.id,
    ir.created_at,
    ir.requestor_name,
    ir.requestor_email,
    ir.requestor_department,
    i.name as item_name,
    i.category,
    ir.quantity_requested,
    ir.quantity_approved,
    ir.urgency,
    ir.status,
    ir.approved_by_name,
    ir.rejection_reason
FROM inventory_requests ir
JOIN inventory i ON ir.inventory_id = i.id
ORDER BY ir.created_at DESC;
