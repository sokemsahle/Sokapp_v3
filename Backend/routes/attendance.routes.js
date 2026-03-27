const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { verifyOfficeIP } = require('../middleware/verifyOfficeIP.middleware');
const { logUserActivity } = require('../utils/activityLogger');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

/**
 * POST /api/attendance/clock-in
 * Clock in for the current day (requires office IP)
 */
router.post('/clock-in', verifyOfficeIP, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const ipAddress = req.authorizedIP.ip_address;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        console.log(`[Clock-In] User ${userId} attempting to clock in from ${ipAddress}`);
        
        // Check if user already has an active clock-in session today
        const [existingLogs] = await connection.execute(
            `SELECT * FROM attendance_logs 
             WHERE user_id = ? AND date = ? AND clock_in IS NOT NULL AND clock_out IS NULL`,
            [userId, today]
        );
        
        if (existingLogs.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already clocked in today. Please clock out first.',
                existingLog: existingLogs[0]
            });
        }
        
        // Create new attendance log
        const [result] = await connection.execute(
            `INSERT INTO attendance_logs (user_id, clock_in, ip_address, date) 
             VALUES (?, NOW(), ?, ?)`,
            [userId, ipAddress, today]
        );
        
        // Fetch the created log with full details
        const [newLog] = await connection.execute(
            `SELECT al.*, u.full_name as user_name 
             FROM attendance_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.id = ?`,
            [result.insertId]
        );
        
        console.log(`[Clock-In] User ${userId} successfully clocked in (Log ID: ${result.insertId})`);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail: userEmail || newLog[0]?.user_name,
                userName: userName || newLog[0]?.user_name,
                roleId,
                roleName,
                activityType: 'clock_in',
                module: 'Attendance Management',
                actionDescription: `User clocked in from IP: ${ipAddress}`,
                tableName: 'attendance_logs',
                recordId: result.insertId,
                newValues: { clock_in: new Date(), ip_address: ipAddress },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log clock-in activity:', logError);
        }
        
        res.status(201).json({
            success: true,
            message: 'Successfully clocked in',
            data: newLog[0]
        });
        
    } catch (error) {
        console.error('[Clock-In] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clock in',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * PUT /api/attendance/clock-out/:id
 * Clock out from work (requires office IP)
 */
router.put('/clock-out/:id', verifyOfficeIP, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        const logId = parseInt(req.params.id);
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const ipAddress = req.authorizedIP.ip_address;
        
        console.log(`[Clock-Out] User ${userId} attempting to clock out (Log ID: ${logId})`);
        
        // Verify the attendance log exists and belongs to this user
        const [existingLog] = await connection.execute(
            `SELECT * FROM attendance_logs WHERE id = ? AND user_id = ?`,
            [logId, userId]
        );
        
        if (existingLog.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attendance log not found'
            });
        }
        
        const log = existingLog[0];
        
        // Check if already clocked out
        if (log.clock_out) {
            return res.status(400).json({
                success: false,
                message: 'Already clocked out for this session'
            });
        }
        
        // Update the log with clock-out time
        await connection.execute(
            `UPDATE attendance_logs SET clock_out = NOW(), ip_address = ? WHERE id = ?`,
            [ipAddress, logId]
        );
        
        // Fetch updated log
        const [updatedLog] = await connection.execute(
            `SELECT al.*, u.full_name as user_name 
             FROM attendance_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.id = ?`,
            [logId]
        );
        
        console.log(`[Clock-Out] User ${userId} successfully clocked out (Log ID: ${logId})`);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail: userEmail || updatedLog[0]?.user_name,
                userName: userName || updatedLog[0]?.user_name,
                roleId,
                roleName,
                activityType: 'clock_out',
                module: 'Attendance Management',
                actionDescription: `User clocked out from IP: ${ipAddress}`,
                tableName: 'attendance_logs',
                recordId: logId,
                newValues: { clock_out: new Date(), ip_address: ipAddress },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log clock-out activity:', logError);
        }
        
        res.json({
            success: true,
            message: 'Successfully clocked out',
            data: updatedLog[0]
        });
        
    } catch (error) {
        console.error('[Clock-Out] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clock out',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/attendance/my-logs
 * Get current user's attendance logs (with optional filters)
 */
router.get('/my-logs', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { userId, startDate, endDate, limit = 30 } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Build query with optional date filters
        let query = `
            SELECT al.*, u.full_name as user_name 
            FROM attendance_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.user_id = ?
        `;
        const params = [userId];
        
        if (startDate) {
            query += ' AND al.date >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND al.date <= ?';
            params.push(endDate);
        }
        
        query += ' ORDER BY al.date DESC, al.clock_in DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [logs] = await connection.execute(query, params);
        
        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
        
    } catch (error) {
        console.error('[My-Logs] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance logs',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/attendance/today/status
 * Get today's attendance status for current user
 */
router.get('/today/status', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        const [logs] = await connection.execute(
            `SELECT * FROM attendance_logs 
             WHERE user_id = ? AND date = ? 
             ORDER BY clock_in DESC`,
            [userId, today]
        );
        
        const isClockedIn = logs.length > 0 && logs[0].clock_in && !logs[0].clock_out;
        const currentLog = logs[0] || null;
        
        res.json({
            success: true,
            data: {
                isClockedIn,
                currentLog,
                todayLogs: logs
            }
        });
        
    } catch (error) {
        console.error('[Today-Status] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s status',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/attendance/report/users
 * Get all users with their attendance summary (for admin report)
 */
router.get('/report/users', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { startDate, endDate } = req.query;
        
        // Try with role column first
        let query = `
            SELECT 
                u.id,
                u.full_name,
                u.email,
                COALESCE(u.role, 'user') as role,
                COUNT(al.id) as total_days_present,
                MAX(al.date) as last_attendance_date,
                SUM(CASE WHEN al.clock_out IS NOT NULL THEN 1 ELSE 0 END) as complete_days,
                AVG(CASE 
                    WHEN al.clock_in IS NOT NULL AND al.clock_out IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, al.clock_in, al.clock_out)
                    ELSE NULL 
                END) as avg_minutes_per_day
            FROM users u
            LEFT JOIN attendance_logs al ON u.id = al.user_id
        `;
        
        const conditions = [];
        const params = [];
        
        if (startDate) {
            conditions.push('al.date >= ?');
            params.push(startDate);
        }
        
        if (endDate) {
            conditions.push('al.date <= ?');
            params.push(endDate);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += `
            GROUP BY u.id, u.full_name, u.email, u.role
            ORDER BY last_attendance_date DESC, u.full_name ASC
        `;
        
        console.log('[Report-Users] Executing query:', query);
        console.log('[Report-Users] With params:', params);
        
        const [users] = await connection.execute(query, params);
        
        console.log('[Report-Users] Success! Found', users.length, 'users');
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
        
    } catch (error) {
        console.error('[Report-Users] Initial Error:', error);
        console.error('[Report-Users] Error code:', error.code);
        console.error('[Report-Users] Error message:', error.message);
        
        // If role column doesn't exist, try without it
        if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('role')) {
            console.log('[Report-Users] ✅ Role column not found, using fallback query...');
            
            try {
                const { startDate, endDate } = req.query;
                
                let query = `
                    SELECT 
                        u.id,
                        u.full_name,
                        u.email,
                        'user' as role,
                        COUNT(al.id) as total_days_present,
                        MAX(al.date) as last_attendance_date,
                        SUM(CASE WHEN al.clock_out IS NOT NULL THEN 1 ELSE 0 END) as complete_days,
                        AVG(CASE 
                            WHEN al.clock_in IS NOT NULL AND al.clock_out IS NOT NULL 
                            THEN TIMESTAMPDIFF(MINUTE, al.clock_in, al.clock_out)
                            ELSE NULL 
                        END) as avg_minutes_per_day
                    FROM users u
                    LEFT JOIN attendance_logs al ON u.id = al.user_id
                `;
                
                const conditions = [];
                const params = [];
                
                if (startDate) {
                    conditions.push('al.date >= ?');
                    params.push(startDate);
                }
                
                if (endDate) {
                    conditions.push('al.date <= ?');
                    params.push(endDate);
                }
                
                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
                
                query += `
                    GROUP BY u.id, u.full_name, u.email
                    ORDER BY last_attendance_date DESC, u.full_name ASC
                `;
                
                console.log('[Report-Users] Executing fallback query...');
                const [users] = await connection.execute(query, params);
                
                console.log('[Report-Users] ✅ Fallback query SUCCESS! Found', users.length, 'users');
                
                res.json({
                    success: true,
                    count: users.length,
                    data: users
                });
                
            } catch (fallbackError) {
                console.error('[Report-Users] ❌ Fallback query FAILED:', fallbackError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch attendance report',
                    error: fallbackError.message
                });
            } finally {
                await connection.end();
            }
        } else {
            console.error('[Report-Users] ❌ Non-role related error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch attendance report',
                error: error.message,
                details: error.sqlMessage || error.message
            });
            await connection.end();
        }
    }
});

/**
 * GET /api/attendance/report/user/:userId
 * Get detailed attendance logs for a specific user
 */
router.get('/report/user/:userId', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { userId } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Build query for detailed logs (without role to avoid errors)
        let query = `
            SELECT 
                al.*,
                u.full_name as user_name,
                u.email as user_email
            FROM attendance_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.user_id = ?
        `;
        const params = [userId];
        
        if (startDate) {
            query += ' AND al.date >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND al.date <= ?';
            params.push(endDate);
        }
        
        query += ' ORDER BY al.date DESC, al.clock_in DESC LIMIT ?';
        params.push(parseInt(limit));
        
        console.log('[Report-User-Detail] Fetching logs for user:', userId);
        const [logs] = await connection.execute(query, params);
        
        // Get user info separately (with fallback for missing role column)
        let userInfo;
        try {
            [userInfo] = await connection.execute(
                `SELECT id, full_name, email, COALESCE(role, 'user') as role 
                 FROM users
                 WHERE id = ?`,
                [userId]
            );
        } catch (roleError) {
            // Fallback if role column doesn't exist
            console.log('[Report-User-Detail] Role column not found, using fallback...');
            [userInfo] = await connection.execute(
                `SELECT id, full_name, email, 'user' as role 
                 FROM users
                 WHERE id = ?`,
                [userId]
            );
        }
        
        console.log('[Report-User-Detail] ✅ Success! Found', logs.length, 'attendance records');
        
        res.json({
            success: true,
            user: userInfo[0] || null,
            count: logs.length,
            data: logs
        });
        
    } catch (error) {
        console.error('[Report-User-Detail] Error:', error);
        console.error('[Report-User-Detail] Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user attendance details',
            error: error.message,
            details: error.sqlMessage || error.message
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;
