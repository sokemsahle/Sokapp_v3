const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// Debug: Log database configuration
console.log('=== USER ACTIVITY ROUTES LOADED ===');
console.log('dbConfig:', {
    host: dbConfig.dbConfig?.host,
    port: dbConfig.dbConfig?.port,
    user: dbConfig.dbConfig?.user ? dbConfig.dbConfig.user : '(empty)',
    password: dbConfig.dbConfig?.password ? '***SET***' : '(empty)',
    database: dbConfig.dbConfig?.database
});
console.log('=====================================');

// GET /api/user-activity/summary - Get activity summary statistics
router.get('/summary', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig.dbConfig);
    try {
        // Get today's activities
        const [todayActivities] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM user_activity_log 
            WHERE DATE(activity_timestamp) = CURDATE()
        `);

        // Get active users today (with detailed list)
        const [activeUsersList] = await connection.execute(`
            SELECT DISTINCT 
                user_id,
                user_name,
                user_email,
                role_name,
                COUNT(*) as activity_count,
                MIN(activity_timestamp) as first_activity,
                MAX(activity_timestamp) as last_activity
            FROM user_activity_log 
            WHERE DATE(activity_timestamp) = CURDATE()
            AND user_id IS NOT NULL
            GROUP BY user_id, user_name, user_email, role_name
            ORDER BY activity_count DESC
        `);

        const activeUsersCount = activeUsersList.length;

        // Get login count today
        const [loginCount] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM user_activity_log 
            WHERE DATE(activity_timestamp) = CURDATE() 
            AND activity_type = 'login'
        `);

        // Get failed login attempts today
        const [failedLogins] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM user_activity_log 
            WHERE DATE(activity_timestamp) = CURDATE() 
            AND activity_type = 'login_failed'
        `);

        // Get total activities this week
        const [weeklyActivities] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM user_activity_log 
            WHERE activity_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        // Get recent activities (last 10)
        const [recentActivities] = await connection.execute(`
            SELECT 
                id,
                user_name,
                user_email,
                role_name,
                activity_type,
                module,
                action_description,
                ip_address,
                device_type,
                status,
                activity_timestamp
            FROM user_activity_log 
            ORDER BY activity_timestamp DESC 
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                todayActivities: todayActivities[0].count,
                activeUsers: activeUsersCount,
                activeUsersList: activeUsersList,
                loginCount: loginCount[0].count,
                failedLogins: failedLogins[0].count,
                weeklyActivities: weeklyActivities[0].count,
                recentActivities: recentActivities
            }
        });
    } catch (error) {
        console.error('Error fetching activity summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity summary',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// GET /api/user-activity/security - Get security-related activities
router.get('/security', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig.dbConfig);
    try {
        // Get failed login attempts with details
        const [failedLogins] = await connection.execute(`
            SELECT 
                id,
                user_name,
                user_email,
                ip_address,
                user_agent,
                failure_reason,
                activity_timestamp
            FROM user_activity_log 
            WHERE activity_type = 'login_failed'
            ORDER BY activity_timestamp DESC 
            LIMIT 50
        `);

        // Get suspicious activities (multiple failed attempts from same IP)
        const [suspiciousIPs] = await connection.execute(`
            SELECT 
                ip_address,
                COUNT(*) as attempt_count,
                MIN(activity_timestamp) as first_attempt,
                MAX(activity_timestamp) as last_attempt,
                GROUP_CONCAT(DISTINCT user_email SEPARATOR ', ') as targeted_emails
            FROM user_activity_log 
            WHERE activity_type = 'login_failed'
            AND activity_timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY ip_address
            HAVING attempt_count > 3
            ORDER BY attempt_count DESC
        `);

        // Get logout events
        const [logoutEvents] = await connection.execute(`
            SELECT 
                id,
                user_name,
                user_email,
                session_duration,
                ip_address,
                activity_timestamp
            FROM user_activity_log 
            WHERE activity_type = 'logout'
            ORDER BY activity_timestamp DESC 
            LIMIT 50
        `);

        res.json({
            success: true,
            data: {
                failedLogins: failedLogins,
                suspiciousIPs: suspiciousIPs,
                logoutEvents: logoutEvents
            }
        });
    } catch (error) {
        console.error('Error fetching security data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch security data',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// GET /api/user-activity/users - Get user activity metrics
router.get('/users', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig.dbConfig);
    try {
        // Get user performance metrics
        const [userMetrics] = await connection.execute(`
            SELECT 
                u.id as user_id,
                u.full_name as user_name,
                u.email as user_email,
                r.name as role_name,
                COUNT(DISTINCT DATE(ual.activity_timestamp)) as active_days,
                COUNT(ual.id) as total_activities,
                SUM(CASE WHEN ual.activity_type = 'login' THEN 1 ELSE 0 END) as login_count,
                SUM(CASE WHEN ual.activity_type = 'logout' THEN 1 ELSE 0 END) as logout_count,
                SUM(CASE WHEN ual.activity_type LIKE '%create%' THEN 1 ELSE 0 END) as create_count,
                SUM(CASE WHEN ual.activity_type LIKE '%update%' THEN 1 ELSE 0 END) as update_count,
                SUM(CASE WHEN ual.activity_type LIKE '%delete%' THEN 1 ELSE 0 END) as delete_count,
                SUM(CASE WHEN ual.status = 'failed' THEN 1 ELSE 0 END) as failed_actions,
                MAX(ual.activity_timestamp) as last_activity
            FROM users u
            LEFT JOIN user_activity_log ual ON u.id = ual.user_id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE ual.activity_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY u.id, u.full_name, u.email, r.name
            HAVING total_activities > 0
            ORDER BY total_activities DESC
            LIMIT 100
        `);

        // Get department/module breakdown
        const [moduleBreakdown] = await connection.execute(`
            SELECT 
                module,
                COUNT(*) as activity_count,
                COUNT(DISTINCT user_id) as unique_users
            FROM user_activity_log 
            WHERE activity_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY module
            ORDER BY activity_count DESC
        `);

        res.json({
            success: true,
            data: {
                userMetrics: userMetrics,
                moduleBreakdown: moduleBreakdown
            }
        });
    } catch (error) {
        console.error('Error fetching user metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user metrics',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// GET /api/user-activity/export - Get exportable activity data
router.get('/export', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig.dbConfig);
    try {
        const { startDate, endDate, activityType, sortBy, sortOrder } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (startDate) {
            whereClause += ' AND DATE(activity_timestamp) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND DATE(activity_timestamp) <= ?';
            params.push(endDate);
        }

        if (activityType && activityType !== 'all') {
            whereClause += ' AND activity_type = ?';
            params.push(activityType);
        }

        // Add sorting - default to activity_timestamp DESC
        let orderByClause = 'ORDER BY activity_timestamp DESC';
        if (sortBy) {
            const validSortFields = ['user_name', 'user_email', 'activity_type', 'module', 'activity_timestamp', 'status'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'activity_timestamp';
            const order = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            orderByClause = `ORDER BY ${sortField} ${order}`;
        }

        const [activities] = await connection.execute(`
            SELECT 
                id,
                user_name,
                user_email,
                role_name,
                activity_type,
                module,
                action_description,
                table_name,
                record_id,
                ip_address,
                device_type,
                status,
                failure_reason,
                activity_timestamp
            FROM user_activity_log 
            ${whereClause}
            ${orderByClause}
            LIMIT 1000
        `, params);

        res.json({
            success: true,
            data: {
                activities: activities,
                count: activities.length,
                filters: { startDate, endDate, activityType, sortBy, sortOrder }
            }
        });
    } catch (error) {
        console.error('Error fetching export data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch export data',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// GET /api/user-activity/detail - Get detailed activity log with filters
router.get('/detail', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig.dbConfig);
    try {
        const { userId, userEmail, activityType, module, startDate, endDate, sortBy, sortOrder, limit = 100 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (userId) {
            whereClause += ' AND user_id = ?';
            params.push(userId);
        }

        if (userEmail) {
            whereClause += ' AND user_email = ?';
            params.push(userEmail);
        }

        if (activityType) {
            whereClause += ' AND activity_type = ?';
            params.push(activityType);
        }

        if (module) {
            whereClause += ' AND module = ?';
            params.push(module);
        }

        if (startDate) {
            whereClause += ' AND DATE(activity_timestamp) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND DATE(activity_timestamp) <= ?';
            params.push(endDate);
        }

        // Add sorting - default to activity_timestamp DESC
        let orderByClause = 'ORDER BY activity_timestamp DESC';
        if (sortBy) {
            const validSortFields = ['user_name', 'user_email', 'activity_type', 'module', 'activity_timestamp', 'status'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'activity_timestamp';
            const order = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            orderByClause = `ORDER BY ${sortField} ${order}`;
        }

        const [activities] = await connection.execute(`
            SELECT 
                id,
                user_id,
                user_name,
                user_email,
                role_name,
                activity_type,
                module,
                action_description,
                table_name,
                record_id,
                old_values,
                new_values,
                ip_address,
                device_type,
                status,
                failure_reason,
                activity_timestamp
            FROM user_activity_log 
            ${whereClause}
            ${orderByClause}
            LIMIT ?
        `, [...params, parseInt(limit)]);

        const [totalCount] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM user_activity_log 
            ${whereClause}
        `, params);

        res.json({
            success: true,
            data: {
                activities: activities,
                totalCount: totalCount[0].count,
                limit: parseInt(limit),
                filters: { userId, userEmail, activityType, module, startDate, endDate, sortBy, sortOrder }
            }
        });
    } catch (error) {
        console.error('Error fetching detail data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch detail data',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;
