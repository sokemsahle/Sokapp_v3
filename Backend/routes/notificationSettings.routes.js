const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authMiddleware } = require('../middleware/auth.middleware');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

// All routes are protected with auth middleware
router.use(authMiddleware);

/**
 * GET /api/notification-settings
 * Fetch notification settings for the authenticated user
 */
router.get('/', async (req, res) => {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Fetch settings for the authenticated user
        const [rows] = await connection.execute(
            `SELECT welfare_alerts, task_reminders, system_announcements 
             FROM notification_settings 
             WHERE user_id = ?`,
            [req.user.id]
        );
        
        if (rows.length === 0) {
            // If no settings exist, create default ones
            await connection.execute(
                `INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
                 VALUES (?, TRUE, TRUE, TRUE)
                 ON DUPLICATE KEY UPDATE user_id = user_id`,
                [req.user.id]
            );
            
            return res.json({
                success: true,
                data: {
                    welfare_alerts: true,
                    task_reminders: true,
                    system_announcements: true
                },
                message: 'Default settings created'
            });
        }
        
        const settings = rows[0];
        
        res.json({
            success: true,
            data: {
                welfare_alerts: !!settings.welfare_alerts,
                task_reminders: !!settings.task_reminders,
                system_announcements: !!settings.system_announcements
            }
        });
        
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification settings',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

/**
 * PATCH /api/notification-settings
 * Update specific notification settings for the authenticated user
 */
router.patch('/', async (req, res) => {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const { welfare_alerts, task_reminders, system_announcements } = req.body;
        
        // Build dynamic update query based on provided fields
        const updates = [];
        const values = [];
        
        if (welfare_alerts !== undefined) {
            updates.push('welfare_alerts = ?');
            values.push(welfare_alerts);
        }
        
        if (task_reminders !== undefined) {
            updates.push('task_reminders = ?');
            values.push(task_reminders);
        }
        
        if (system_announcements !== undefined) {
            updates.push('system_announcements = ?');
            values.push(system_announcements);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No settings provided to update'
            });
        }
        
        // Add user_id to values
        values.push(req.user.id);
        
        // Perform upsert (insert or update)
        const query = `
            INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
            VALUES (?, TRUE, TRUE, TRUE)
            ON DUPLICATE KEY UPDATE ${updates.join(', ')}
        `;
        
        // For upsert, we need to include default values in the VALUES clause
        const upsertValues = [req.user.id, true, true, true, ...values];
        const upsertQuery = `
            INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ${updates.join(', ')}
        `;
        
        await connection.execute(upsertQuery, upsertValues);
        
        // Fetch updated settings
        const [updatedRows] = await connection.execute(
            `SELECT welfare_alerts, task_reminders, system_announcements 
             FROM notification_settings 
             WHERE user_id = ?`,
            [req.user.id]
        );
        
        const settings = updatedRows[0];
        
        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                welfare_alerts: !!settings.welfare_alerts,
                task_reminders: !!settings.task_reminders,
                system_announcements: !!settings.system_announcements
            }
        });
        
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

/**
 * PUT /api/notification-settings
 * Full update of all notification settings for the authenticated user
 */
router.put('/', async (req, res) => {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const { welfare_alerts, task_reminders, system_announcements } = req.body;
        
        // Validate that all required fields are provided
        if (welfare_alerts === undefined || task_reminders === undefined || system_announcements === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All notification settings must be provided (welfare_alerts, task_reminders, system_announcements)'
            });
        }
        
        // Perform upsert (insert or update)
        await connection.execute(
            `INSERT INTO notification_settings (user_id, welfare_alerts, task_reminders, system_announcements)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                 welfare_alerts = VALUES(welfare_alerts),
                 task_reminders = VALUES(task_reminders),
                 system_announcements = VALUES(system_announcements)`,
            [req.user.id, welfare_alerts, task_reminders, system_announcements]
        );
        
        // Fetch updated settings
        const [updatedRows] = await connection.execute(
            `SELECT welfare_alerts, task_reminders, system_announcements 
             FROM notification_settings 
             WHERE user_id = ?`,
            [req.user.id]
        );
        
        const settings = updatedRows[0];
        
        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                welfare_alerts: !!settings.welfare_alerts,
                task_reminders: !!settings.task_reminders,
                system_announcements: !!settings.system_announcements
            }
        });
        
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;
