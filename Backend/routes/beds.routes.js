const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// No auth middleware - consistent with other routes in this app

/**
 * GET /api/beds
 * Get all beds
 */
router.get('/', async (req, res) => {
    try {
        const [beds] = await query(`
            SELECT 
                b.*,
                r.room_name,
                r.capacity as room_capacity
            FROM beds b
            INNER JOIN rooms r ON b.room_id = r.id
            ORDER BY r.room_name ASC, b.bed_number ASC
        `);
        
        res.status(200).json({
            success: true,
            count: beds.length,
            data: beds
        });
    } catch (error) {
        console.error('Error fetching beds:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch beds',
            error: error.message
        });
    }
});

/**
 * GET /api/beds/available
 * Get only available beds
 */
router.get('/available', async (req, res) => {
    try {
        const [beds] = await query(`
            SELECT 
                b.*,
                r.room_name,
                r.capacity as room_capacity
            FROM beds b
            INNER JOIN rooms r ON b.room_id = r.id
            WHERE b.status = 'available'
            ORDER BY r.room_name ASC, b.bed_number ASC
        `);
        
        res.status(200).json({
            success: true,
            count: beds.length,
            data: beds
        });
    } catch (error) {
        console.error('Error fetching available beds:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available beds',
            error: error.message
        });
    }
});

/**
 * GET /api/beds/room/:roomId
 * Get beds by room
 */
router.get('/room/:roomId', async (req, res) => {
    try {
        const { status } = req.query;
        console.log('=== GET /api/beds/room/:roomId ===');
        console.log('Room ID:', req.params.roomId);
        console.log('Status filter:', status);
        
        let queryStr = `
            SELECT 
                b.*,
                r.room_name
            FROM beds b
            INNER JOIN rooms r ON b.room_id = r.id
            WHERE b.room_id = ?
        `;
        const params = [req.params.roomId];
        
        if (status) {
            queryStr += ' AND b.status = ?';
            params.push(status);
        }
        
        queryStr += ' ORDER BY b.bed_number ASC';
        
        console.log('Executing query with params:', params);
        
        const [beds] = await query(queryStr, params);
        
        console.log('Beds found:', beds.length);
        
        res.status(200).json({
            success: true,
            count: beds.length,
            data: beds
        });
    } catch (error) {
        console.error('Error fetching beds by room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch beds',
            error: error.message
        });
    }
});

/**
 * POST /api/beds
 * Create new bed
 */
router.post('/', async (req, res) => {
    try {
        const { room_id, bed_number, status } = req.body;
        
        if (!room_id || !bed_number) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and bed number are required'
            });
        }
        
        const bedStatus = status || 'available';
        
        const [result] = await query(`
            INSERT INTO beds (room_id, bed_number, status)
            VALUES (?, ?, ?)
        `, [room_id, bed_number, bedStatus]);
        
        const [newBed] = await query(`
            SELECT 
                b.*,
                r.room_name
            FROM beds b
            INNER JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Bed created successfully',
            data: newBed[0]
        });
    } catch (error) {
        console.error('Error creating bed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bed',
            error: error.message
        });
    }
});

/**
 * PUT /api/beds/:id
 * Update bed
 */
router.put('/:id', async (req, res) => {
    try {
        const { bed_number, status } = req.body;
        
        if (!bed_number) {
            return res.status(400).json({
                success: false,
                message: 'Bed number is required'
            });
        }
        
        await query(`
            UPDATE beds 
            SET bed_number = ?, status = ?
            WHERE id = ?
        `, [bed_number, status || 'available', req.params.id]);
        
        const [updatedBed] = await query(`
            SELECT 
                b.*,
                r.room_name
            FROM beds b
            INNER JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
        `, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Bed updated successfully',
            data: updatedBed[0]
        });
    } catch (error) {
        console.error('Error updating bed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bed',
            error: error.message
        });
    }
});

/**
 * DELETE /api/beds/:id
 * Delete bed
 */
router.delete('/:id', async (req, res) => {
    try {
        // Check if bed is occupied
        const [beds] = await query(`
            SELECT * FROM beds WHERE id = ? AND status = 'occupied'
        `, [req.params.id]);
        
        if (beds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete occupied bed. Please reassign child first.'
            });
        }
        
        await query(`DELETE FROM beds WHERE id = ?`, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Bed deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting bed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bed',
            error: error.message
        });
    }
});

/**
 * PUT /api/beds/:id/assign
 * Assign bed to child (mark as occupied)
 */
router.put('/:id/assign', async (req, res) => {
    try {
        const { child_id } = req.body;
        
        if (!child_id) {
            return res.status(400).json({
                success: false,
                message: 'Child ID is required'
            });
        }
        
        // Check if bed is already occupied
        const [currentBeds] = await query(`
            SELECT * FROM beds WHERE id = ?
        `, [req.params.id]);
        
        if (currentBeds.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bed not found'
            });
        }
        
        if (currentBeds[0].status === 'occupied') {
            return res.status(400).json({
                success: false,
                message: 'Bed is already occupied'
            });
        }
        
        // Update bed status to occupied
        await query(`
            UPDATE beds SET status = 'occupied' WHERE id = ?
        `, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Bed assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning bed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign bed',
            error: error.message
        });
    }
});

/**
 * PUT /api/beds/:id/release
 * Release bed (mark as available)
 */
router.put('/:id/release', async (req, res) => {
    try {
        // Update bed status to available
        await query(`
            UPDATE beds SET status = 'available' WHERE id = ?
        `, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Bed released successfully'
        });
    } catch (error) {
        console.error('Error releasing bed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to release bed',
            error: error.message
        });
    }
});

module.exports = router;
