const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

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
 * GET /api/admin/organization/ips
 * Get all allowed IP addresses
 */
router.get('/ips', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Get user ID from headers
        const userId = req.headers['x-user-id'];
        
        console.log('[GET /api/admin/organization/ips] Received request');
        console.log('[GET /api/admin/organization/ips] Headers:', req.headers);
        console.log('[GET /api/admin/organization/ips] User ID from header:', userId);
        
        if (!userId) {
            console.log('[GET /api/admin/organization/ips] No user ID provided');
            return res.status(401).json({
                success: false,
                message: 'User ID required'
            });
        }
        
        // Check if user is admin
        const [userRows] = await connection.execute(
            `SELECT is_admin FROM users WHERE id = ?`,
            [userId]
        );
        
        console.log('[GET /api/admin/organization/ips] User rows:', userRows);
        
        if (!userRows[0] || !userRows[0].is_admin) {
            console.log('[GET /api/admin/organization/ips] User is not admin');
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const [ips] = await connection.execute(
            `SELECT ai.*, u.full_name as added_by_name
             FROM allowed_ips ai
             LEFT JOIN users u ON ai.created_by = u.id
             ORDER BY ai.created_at DESC`
        );
        
        res.json({
            success: true,
            count: ips.length,
            data: ips
        });
        
    } catch (error) {
        console.error('[Get-IPs] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch allowed IPs',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * POST /api/admin/organization/ips
 * Add a new allowed IP address
 */
router.post('/ips', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Get user ID from headers
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID required'
            });
        }
        
        // Check if user is admin
        const [userRows] = await connection.execute(
            `SELECT is_admin FROM users WHERE id = ?`,
            [userId]
        );
        
        if (!userRows[0] || !userRows[0].is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const { ip_address, description } = req.body;
        
        // Validate input
        if (!ip_address || !ip_address.trim()) {
            return res.status(400).json({
                success: false,
                message: 'IP address is required'
            });
        }
        
        const trimmedIP = ip_address.trim();
        
        // Basic IP validation (supports IPv4 and IPv6)
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
        
        if (!ipv4Pattern.test(trimmedIP) && !ipv6Pattern.test(trimmedIP)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid IP address format. Please provide a valid IPv4 or IPv6 address.'
            });
        }
        
        // Check if IP already exists
        const [existing] = await connection.execute(
            `SELECT id FROM allowed_ips WHERE ip_address = ?`,
            [trimmedIP]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This IP address is already in the allowed list'
            });
        }
        
        // Insert new IP
        const [result] = await connection.execute(
            `INSERT INTO allowed_ips (ip_address, description, created_by) 
             VALUES (?, ?, ?)`,
            [trimmedIP, description?.trim() || null, userId]
        );
        
        // Fetch the newly created IP
        const [newIP] = await connection.execute(
            `SELECT ai.*, u.full_name as added_by_name
             FROM allowed_ips ai
             LEFT JOIN users u ON ai.created_by = u.id
             WHERE ai.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'IP address added successfully',
            data: newIP[0]
        });
        
    } catch (error) {
        console.error('[Add-IP] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add IP address',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * PUT /api/admin/organization/ips/:id
 * Update an existing IP address description
 */
router.put('/ips/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Get user ID from headers
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID required'
            });
        }
        
        // Check if user is admin
        const [userRows] = await connection.execute(
            `SELECT is_admin FROM users WHERE id = ?`,
            [userId]
        );
        
        if (!userRows[0] || !userRows[0].is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const ipId = parseInt(req.params.id);
        const { description } = req.body;
        
        // Check if IP exists
        const [existing] = await connection.execute(
            `SELECT * FROM allowed_ips WHERE id = ?`,
            [ipId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'IP address not found'
            });
        }
        
        // Update description only (don't allow changing IP address)
        await connection.execute(
            `UPDATE allowed_ips SET description = ? WHERE id = ?`,
            [description?.trim() || null, ipId]
        );
        
        // Fetch updated IP
        const [updated] = await connection.execute(
            `SELECT ai.*, u.full_name as added_by_name
             FROM allowed_ips ai
             LEFT JOIN users u ON ai.created_by = u.id
             WHERE ai.id = ?`,
            [ipId]
        );
        
        res.json({
            success: true,
            message: 'IP address updated successfully',
            data: updated[0]
        });
        
    } catch (error) {
        console.error('[Update-IP] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update IP address',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

/**
 * DELETE /api/admin/organization/ips/:id
 * Remove an allowed IP address
 */
router.delete('/ips/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Get user ID from headers
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID required'
            });
        }
        
        // Check if user is admin
        const [userRows] = await connection.execute(
            `SELECT is_admin FROM users WHERE id = ?`,
            [userId]
        );
        
        if (!userRows[0] || !userRows[0].is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const ipId = parseInt(req.params.id);
        
        // Check if IP exists
        const [existing] = await connection.execute(
            `SELECT * FROM allowed_ips WHERE id = ?`,
            [ipId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'IP address not found'
            });
        }
        
        // Delete the IP
        await connection.execute(
            `DELETE FROM allowed_ips WHERE id = ?`,
            [ipId]
        );
        
        res.json({
            success: true,
            message: 'IP address removed successfully'
        });
        
    } catch (error) {
        console.error('[Delete-IP] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove IP address',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;
