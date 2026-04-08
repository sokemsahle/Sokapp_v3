-- ============================================
-- VERIFY INSTALLATION - User Activity Reporting System
-- ============================================
-- Run this script to verify that the system was installed correctly
-- This will help troubleshoot issues like "procedure does not exist" errors

USE sokapptest;

SELECT '============================================' AS '';
SELECT 'INSTALLATION VERIFICATION CHECKLIST' AS '';
SELECT '============================================' AS '';
SELECT '' AS '';

-- 1. Check if main table exists
SELECT 'Step 1: Checking user_activity_log table...' AS Step;
SELECT COUNT(*) AS 'Table Exists (should be 1)' 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user_activity_log';

-- Expected: 1 (table exists)

-- 2. Check if summary table exists
SELECT 'Step 2: Checking user_activity_summary table...' AS Step;
SELECT COUNT(*) AS 'Table Exists (should be 1)' 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user_activity_summary';

-- Expected: 1 (table exists)

-- 3. Check if views exist
SELECT 'Step 3: Checking views...' AS Step;
SELECT TABLE_NAME, 'View Created Successfully' AS Status
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_TYPE = 'VIEW'
  AND TABLE_NAME IN ('v_today_activity', 'v_weekly_activity_summary', 'v_security_alerts');

-- Expected: 3 rows (all views created)

-- 4. Check if stored procedure exists
SELECT 'Step 4: Checking stored procedures...' AS Step;
SELECT ROUTINE_NAME, ROUTINE_TYPE, 'Procedure Created Successfully' AS Status
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME IN ('sp_cleanup_old_activity_logs', 'sp_log_user_login', 'sp_log_user_logout', 'sp_log_failed_login');

-- Expected: 4 rows (all procedures created)

-- 5. Check if triggers exist
SELECT 'Step 5: Checking triggers...' AS Step;
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, 'Trigger Created Successfully' AS Status
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND TRIGGER_NAME LIKE '%employee_activity%';

-- Expected: 3 rows (insert, update, delete triggers)

-- 6. Check sample data
SELECT 'Step 6: Checking sample data...' AS Step;
SELECT COUNT(*) AS 'Sample Records (should be > 0)' 
FROM user_activity_log;

-- Expected: 8 or more records

-- 7. Test view query
SELECT 'Step 7: Testing v_today_activity view...' AS Step;
SELECT COUNT(*) AS 'Today''s Activities (view working)' 
FROM v_today_activity;

-- Expected: Count of today's activities (may be 0 if no activities today)

-- 8. Test stored procedure
SELECT 'Step 8: Testing sp_cleanup_old_activity_logs procedure...' AS Step;
CALL sp_cleanup_old_activity_logs();

-- Expected: Message showing cleanup completed

-- ============================================
-- FINAL SUMMARY
-- ============================================

SELECT '============================================' AS '';
SELECT 'VERIFICATION COMPLETE' AS '';
SELECT '============================================' AS '';
SELECT '' AS '';

-- Count successful checks
SELECT 
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_activity_log') = 1
            AND (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_activity_summary') = 1
            AND (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'VIEW' AND TABLE_NAME IN ('v_today_activity', 'v_weekly_activity_summary', 'v_security_alerts')) = 3
            AND (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME IN ('sp_cleanup_old_activity_logs', 'sp_log_user_login', 'sp_log_user_logout', 'sp_log_failed_login')) = 4
            AND (SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME LIKE '%employee_activity%') = 3
        )
        THEN '✅ INSTALLATION SUCCESSFUL - All components verified!'
        ELSE '❌ INSTALLATION INCOMPLETE - Some components missing. Re-run add_user_activity_reporting.sql'
    END AS Installation_Status;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

SELECT '============================================' AS '';
SELECT 'TROUBLESHOOTING GUIDE' AS '';
SELECT '============================================' AS '';
SELECT '' AS '';

SELECT 'If any checks failed:' AS Issue;
SELECT '1. Ensure you ran: mysql -u root -p sokapptest < add_user_activity_reporting.sql' AS Solution;
SELECT '2. Check for SQL errors during installation' AS Solution;
SELECT '3. Verify you have proper permissions' AS Solution;
SELECT '4. Make sure the sokapptest database exists' AS Solution;
SELECT '5. Re-run the installation script if needed' AS Solution;
SELECT '' AS '';
SELECT 'Common errors and solutions:' AS '';
SELECT '- "Table doesn''t exist": Run add_user_activity_reporting.sql first' AS '';
SELECT '- "Procedure does not exist": DELIMITER statements may have failed. Re-run installation.' AS '';
SELECT '- "View not found": Views weren''t created. Check for SQL syntax errors during install.' AS '';
SELECT '' AS '';
