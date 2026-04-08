-- Check requisitions with reviewer signature to see if approvers were notified
SELECT 
    id,
    requestor_name,
    department,
    status,
    reviewed_signature IS NOT NULL as has_reviewer_sig,
    approved_signature IS NOT NULL as has_approver_sig,
    grand_total
FROM requisitions 
WHERE reviewed_signature IS NOT NULL 
ORDER BY id DESC 
LIMIT 10;
