-- Check recent user activities
USE sokapptest;

SELECT 
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
LIMIT 10;
