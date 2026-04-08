-- ============================================
-- VERIFY LOGIN/LOGOUT ACTIVITY LOGGING
-- ============================================
-- Use this script to verify that login and logout activities are being saved
-- Run this after testing login/logout in your application

USE sokapptest;

-- 1. Check ALL recent activities (most recent first)
SELECT 
    '=== ALL RECENT ACTIVITIES ===' as Section,
    id,
    user_name,
    user_email,
    activity_type,
    module,
    status,
    failure_reason,
    activity_timestamp
FROM user_activity_log 
ORDER BY activity_timestamp DESC 
LIMIT 20;

-- 2. Check ONLY login activities (successful)
SELECT 
    '=== SUCCESSFUL LOGINS ===' as Section,
    id,
    user_name,
    user_email,
    role_name,
    ip_address,
    device_type,
    activity_timestamp
FROM user_activity_log 
WHERE activity_type = 'login'
ORDER BY activity_timestamp DESC 
LIMIT 10;

-- 3. Check ONLY failed login attempts
SELECT 
    '=== FAILED LOGIN ATTEMPTS ===' as Section,
    id,
    user_name,
    user_email,
    failure_reason,
    ip_address,
    device_type,
    activity_timestamp
FROM user_activity_log 
WHERE activity_type = 'login_failed'
ORDER BY activity_timestamp DESC 
LIMIT 10;

-- 4. Check ONLY logout activities
SELECT 
    '=== LOGOUT ACTIVITIES ===' as Section,
    id,
    user_name,
    user_email,
    session_duration,
    ip_address,
    device_type,
    activity_timestamp
FROM user_activity_log 
WHERE activity_type = 'logout'
ORDER BY activity_timestamp DESC 
LIMIT 10;

-- 5. Check today's login/logout activities only
SELECT 
    '=== TODAY'S LOGIN/LOGOUT ACTIVITIES ===' as Section,
    id,
    user_name,
    user_email,
    activity_type,
    status,
    failure_reason,
    activity_timestamp
FROM user_activity_log 
WHERE DATE(activity_timestamp) = CURDATE()
AND activity_type IN ('login', 'logout', 'login_failed')
ORDER BY activity_timestamp DESC;

-- 6. Count activities by type for today
SELECT 
    '=== TODAY'S ACTIVITY COUNTS ===' as Section,
    activity_type,
    COUNT(*) as count
FROM user_activity_log 
WHERE DATE(activity_timestamp) = CURDATE()
GROUP BY activity_type
ORDER BY count DESC;

-- 7. View specific user's login/logout history
-- Replace 'admin@sokapp.com' with the email you want to check
SELECT 
    '=== SPECIFIC USER ACTIVITY ===' as Section,
    id,
    activity_type,
    status,
    failure_reason,
    ip_address,
    device_type,
    activity_timestamp
FROM user_activity_log 
WHERE user_email = 'admin@sokapp.com'
AND activity_type IN ('login', 'logout', 'login_failed')
ORDER BY activity_timestamp DESC
LIMIT 20;

-- 8. Check for suspicious activity (multiple failed logins from same user)
SELECT 
    '=== SUSPICIOUS ACTIVITY (Multiple Failed Logins) ===' as Section,
    user_name,
    user_email,
    ip_address,
    COUNT(*) as failed_attempts,
    MIN(activity_timestamp) as first_attempt,
    MAX(activity_timestamp) as last_attempt
FROM user_activity_log 
WHERE activity_type = 'login_failed'
GROUP BY user_email, ip_address
HAVING COUNT(*) > 2
ORDER BY failed_attempts DESC;

-- Quick stats
SELECT 
    '=== QUICK STATS ===' as Section,
    (SELECT COUNT(*) FROM user_activity_log WHERE activity_type = 'login' AND DATE(activity_timestamp) = CURDATE()) as 'Logins Today',
    (SELECT COUNT(*) FROM user_activity_log WHERE activity_type = 'logout' AND DATE(activity_timestamp) = CURDATE()) as 'Logouts Today',
    (SELECT COUNT(*) FROM user_activity_log WHERE activity_type = 'login_failed' AND DATE(activity_timestamp) = CURDATE()) as 'Failed Logins Today',
    (SELECT COUNT(*) FROM user_activity_log WHERE DATE(activity_timestamp) = CURDATE()) as 'Total Activities Today';
