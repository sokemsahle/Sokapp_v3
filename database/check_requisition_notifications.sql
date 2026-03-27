-- ============================================
-- DIAGNOSE REQUISITION NOTIFICATIONS
-- ============================================
-- This shows you ALL requisitions that appear as notifications

-- 1. Check how many total requisitions exist
SELECT 
    'Total Requisitions' as description,
    COUNT(*) as count
FROM requisitions;

-- 2. Check unsigned/pending requisitions (need action)
SELECT 
    'Pending/Unsigned Requisitions' as description,
    COUNT(*) as count
FROM requisitions 
WHERE signature_data IS NULL 
   OR reviewed_signature IS NULL 
   OR approved_signature IS NULL 
   OR authorized_signature IS NULL;

-- 3. Check authorized requisitions (for requester notifications)
SELECT 
    'Authorized/Finalized Requisitions' as description,
    COUNT(*) as count
FROM requisitions 
WHERE status = 'authorized';

-- 4. See ALL requisitions with their details
SELECT 
    r.id,
    r.requestor_name,
    r.department,
    r.purpose,
    r.status,
    r.created_at,
    CASE 
        WHEN r.signature_data IS NULL THEN 'Unsigned by Requestor'
        WHEN r.reviewed_signature IS NULL THEN 'Pending Review'
        WHEN r.approved_signature IS NULL THEN 'Pending Approval'
        WHEN r.authorized_signature IS NULL THEN 'Pending Authorization'
        ELSE 'Complete'
    END as current_stage,
    CASE 
        WHEN uns.is_seen = TRUE THEN 'Seen'
        WHEN uns.is_seen = FALSE THEN 'Unseen'
        ELSE 'Unseen (No record)'
    END as seen_status
FROM requisitions r
LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = 1
WHERE r.signature_data IS NULL 
   OR r.reviewed_signature IS NULL 
   OR r.approved_signature IS NULL 
   OR r.authorized_signature IS NULL
   OR r.status = 'authorized'
ORDER BY r.created_at DESC;

-- 5. Check if user_notification_seen table has any records
SELECT 
    'Seen Tracking Records' as description,
    COUNT(*) as count
FROM user_notification_seen;

-- ============================================
-- WHAT TO DO WITH THIS INFO
-- ============================================
-- 
-- If you see requisitions in #4, these are the notifications appearing in your bell icon
-- 
-- OPTIONS:
-- 
-- 1. KEEP THEM - These are valid requisitions that need attention
-- 2. DELETE SPECIFIC ONES - Remove problem requisitions individually
-- 3. DELETE ALL REQUISITIONS - Complete reset (use with caution!)
-- 
-- ============================================
