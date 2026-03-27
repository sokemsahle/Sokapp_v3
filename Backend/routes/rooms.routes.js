const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// No auth middleware - consistent with other routes in this app

/**
 * GET /api/rooms
 * Get all rooms
 */
router.get('/', async (req, res) => {
    try {
        const [rooms] = await query(`
            SELECT 
                r.*,
                COUNT(b.id) as bed_count,
                SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_beds
            FROM rooms r
            LEFT JOIN beds b ON r.id = b.room_id
            GROUP BY r.id
            ORDER BY r.room_name ASC
        `);
        
        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rooms',
            error: error.message
        });
    }
});

/**
 * GET /api/rooms/:id
 * Get room by ID with beds
 */
router.get('/:id', async (req, res) => {
    try {
        const [rooms] = await query(`
            SELECT 
                r.*,
                COUNT(b.id) as bed_count,
                SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_beds
            FROM rooms r
            LEFT JOIN beds b ON r.id = b.room_id
            WHERE r.id = ?
            GROUP BY r.id
        `, [req.params.id]);
        
        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        // Get beds for this room
        const [beds] = await query(`
            SELECT * FROM beds WHERE room_id = ? ORDER BY bed_number ASC
        `, [req.params.id]);
        
        const roomData = {
            ...rooms[0],
            beds: beds
        };
        
        res.status(200).json({
            success: true,
            data: roomData
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room',
            error: error.message
        });
    }
});

/**
 * POST /api/rooms
 * Create new room
 */
router.post('/', async (req, res) => {
    try {
        const { organization_id, room_name, capacity } = req.body;
        
        if (!organization_id || !room_name || !capacity) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID, room name, and capacity are required'
            });
        }
        
        const [result] = await query(`
            INSERT INTO rooms (organization_id, room_name, capacity)
            VALUES (?, ?, ?)
        `, [organization_id, room_name, parseInt(capacity)]);
        
        const [newRoom] = await query(`
            SELECT * FROM rooms WHERE id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: newRoom[0]
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: error.message
        });
    }
});

/**
 * PUT /api/rooms/:id
 * Update room
 */
router.put('/:id', async (req, res) => {
    try {
        const { room_name, capacity } = req.body;
        
        if (!room_name || !capacity) {
            return res.status(400).json({
                success: false,
                message: 'Room name and capacity are required'
            });
        }
        
        await query(`
            UPDATE rooms 
            SET room_name = ?, capacity = ?
            WHERE id = ?
        `, [room_name, parseInt(capacity), req.params.id]);
        
        const [updatedRoom] = await query(`
            SELECT * FROM rooms WHERE id = ?
        `, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: updatedRoom[0]
        });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update room',
            error: error.message
        });
    }
});

/**
 * DELETE /api/rooms/:id
 * Delete room (cascades to beds)
 */
router.delete('/:id', async (req, res) => {
    try {
        // Check if room has occupied beds
        const [beds] = await query(`
            SELECT * FROM beds WHERE room_id = ? AND status = 'occupied'
        `, [req.params.id]);
        
        if (beds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete room with occupied beds. Please reassign children first.'
            });
        }
        
        await query(`DELETE FROM rooms WHERE id = ?`, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: error.message
        });
    }
});

module.exports = router;
