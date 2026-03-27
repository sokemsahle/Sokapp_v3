-- Quick SQL queries to diagnose the reject issue

-- Check request #3 status
SELECT id, status, requestor_name, requestor_email, quantity_requested, inventory_id 
FROM inventory_requests 
WHERE id = 3;

-- Check all pending requests
SELECT 
    ir.id,
    ir.status,
    ir.requestor_name,
    ir.requestor_email,
    ir.quantity_requested,
    i.name as item_name,
    i.quantity as current_stock
FROM inventory_requests ir
JOIN inventory i ON ir.inventory_id = i.id
WHERE ir.status = 'pending'
ORDER BY ir.created_at DESC;

-- Show all requests and their status
SELECT 
    id, 
    status, 
    requestor_name, 
    item_name,
    quantity_requested,
    created_at
FROM inventory_requests 
ORDER BY id DESC;

-- If request #3 is not pending, update it back to pending for testing
-- UNCOMMENT ONLY IF NEEDED:
-- UPDATE inventory_requests SET status = 'pending' WHERE id = 3;
