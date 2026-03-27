const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// No auth middleware - consistent with other routes in this app

/**
 * GET /api/fixed-assets
 * Get all fixed assets
 */
router.get('/', async (req, res) => {
    try {
        const { category, status, condition } = req.query;
        
        let queryStr = `
            SELECT 
                fa.*,
                u.name as organization_name
            FROM fixed_assets fa
            LEFT JOIN users u ON fa.organization_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (category) {
            queryStr += ' AND fa.asset_category = ?';
            params.push(category);
        }
        
        if (status) {
            queryStr += ' AND fa.availability_status = ?';
            params.push(status);
        }
        
        if (condition) {
            queryStr += ' AND fa.condition_status = ?';
            params.push(condition);
        }
        
        queryStr += ' ORDER BY fa.asset_category ASC, fa.asset_name ASC';
        
        const [assets] = await query(queryStr, params);
        
        res.status(200).json({
            success: true,
            count: assets.length,
            data: assets
        });
    } catch (error) {
        console.error('Error fetching fixed assets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fixed assets',
            error: error.message
        });
    }
});

/**
 * GET /api/fixed-assets/categories
 * Get asset categories from lookup
 */
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await query(`
            SELECT item_name as value, item_name as label
            FROM lookup_lists
            WHERE category = 'Asset Category' AND is_active = 1
            ORDER BY sort_order
        `);
        
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
});

/**
 * GET /api/fixed-assets/:id
 * Get fixed asset by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const [assets] = await query(`
            SELECT 
                fa.*,
                u.name as organization_name
            FROM fixed_assets fa
            LEFT JOIN users u ON fa.organization_id = u.id
            WHERE fa.id = ?
        `, [req.params.id]);
        
        if (assets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fixed asset not found'
            });
        }
        
        // Get maintenance history
        const [maintenanceLog] = await query(`
            SELECT * FROM asset_maintenance_log
            WHERE asset_id = ?
            ORDER BY maintenance_date DESC
        `, [req.params.id]);
        
        const assetData = assets[0];
        assetData.maintenance_history = maintenanceLog;
        
        res.status(200).json({
            success: true,
            data: assetData
        });
    } catch (error) {
        console.error('Error fetching fixed asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fixed asset',
            error: error.message
        });
    }
});

/**
 * POST /api/fixed-assets
 * Create new fixed asset
 */
router.post('/', async (req, res) => {
    try {
        const {
            organization_id,
            asset_name,
            asset_category,
            asset_code,
            serial_number,
            manufacturer,
            model,
            purchase_date,
            purchase_price,
            supplier,
            warranty_period_months,
            location,
            condition_status,
            availability_status,
            assigned_to,
            notes,
            depreciation_rate,
            current_value,
            last_maintenance_date,
            next_maintenance_date
        } = req.body;
        
        if (!organization_id || !asset_name || !asset_category) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID, asset name, and category are required'
            });
        }
        
        // Calculate warranty expiry if warranty period provided
        let warranty_expiry = null;
        if (purchase_date && warranty_period_months) {
            const purchase = new Date(purchase_date);
            purchase.setMonth(purchase.getMonth() + warranty_period_months);
            warranty_expiry = purchase.toISOString().split('T')[0];
        }
        
        const [result] = await query(`
            INSERT INTO fixed_assets (
                organization_id, asset_name, asset_category, asset_code, serial_number,
                manufacturer, model, purchase_date, purchase_price, supplier,
                warranty_period_months, warranty_expiry_date, location, condition_status,
                availability_status, assigned_to, notes, depreciation_rate, current_value,
                last_maintenance_date, next_maintenance_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            organization_id,
            asset_name,
            asset_category,
            asset_code || null,
            serial_number || null,
            manufacturer || null,
            model || null,
            purchase_date || null,
            purchase_price || null,
            supplier || null,
            warranty_period_months || null,
            warranty_expiry,
            location || null,
            condition_status || 'good',
            availability_status || 'available',
            assigned_to || null,
            notes || null,
            depreciation_rate || 0.00,
            current_value || purchase_price || null,
            last_maintenance_date || null,
            next_maintenance_date || null
        ]);
        
        const [newAsset] = await query(`
            SELECT * FROM fixed_assets WHERE id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Fixed asset created successfully',
            data: newAsset[0]
        });
    } catch (error) {
        console.error('Error creating fixed asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create fixed asset',
            error: error.message
        });
    }
});

/**
 * PUT /api/fixed-assets/:id
 * Update fixed asset
 */
router.put('/:id', async (req, res) => {
    try {
        const {
            asset_name,
            asset_category,
            asset_code,
            serial_number,
            manufacturer,
            model,
            purchase_date,
            purchase_price,
            supplier,
            warranty_period_months,
            location,
            condition_status,
            availability_status,
            assigned_to,
            notes,
            depreciation_rate,
            current_value,
            last_maintenance_date,
            next_maintenance_date
        } = req.body;
        
        // Calculate warranty expiry if warranty period provided
        let warranty_expiry = null;
        if (purchase_date && warranty_period_months) {
            const purchase = new Date(purchase_date);
            purchase.setMonth(purchase.getMonth() + warranty_period_months);
            warranty_expiry = purchase.toISOString().split('T')[0];
        }
        
        await query(`
            UPDATE fixed_assets SET
                asset_name = ?,
                asset_category = ?,
                asset_code = ?,
                serial_number = ?,
                manufacturer = ?,
                model = ?,
                purchase_date = ?,
                purchase_price = ?,
                supplier = ?,
                warranty_period_months = ?,
                warranty_expiry_date = ?,
                location = ?,
                condition_status = ?,
                availability_status = ?,
                assigned_to = ?,
                notes = ?,
                depreciation_rate = ?,
                current_value = ?,
                last_maintenance_date = ?,
                next_maintenance_date = ?
            WHERE id = ?
        `, [
            asset_name,
            asset_category,
            asset_code,
            serial_number,
            manufacturer,
            model,
            purchase_date,
            purchase_price,
            supplier,
            warranty_period_months,
            warranty_expiry,
            location,
            condition_status,
            availability_status,
            assigned_to,
            notes,
            depreciation_rate,
            current_value,
            last_maintenance_date,
            next_maintenance_date,
            req.params.id
        ]);
        
        const [updatedAsset] = await query(`
            SELECT * FROM fixed_assets WHERE id = ?
        `, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Fixed asset updated successfully',
            data: updatedAsset[0]
        });
    } catch (error) {
        console.error('Error updating fixed asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update fixed asset',
            error: error.message
        });
    }
});

/**
 * DELETE /api/fixed-assets/:id
 * Delete fixed asset
 */
router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM asset_maintenance_log WHERE asset_id = ?`, [req.params.id]);
        await query(`DELETE FROM fixed_assets WHERE id = ?`, [req.params.id]);
        
        res.status(200).json({
            success: true,
            message: 'Fixed asset deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting fixed asset:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete fixed asset',
            error: error.message
        });
    }
});

/**
 * POST /api/fixed-assets/:id/maintenance
 * Add maintenance log entry
 */
router.post('/:id/maintenance', async (req, res) => {
    try {
        const {
            maintenance_date,
            maintenance_type,
            description,
            performed_by,
            cost,
            next_scheduled_date
        } = req.body;
        
        if (!maintenance_date || !maintenance_type || !description) {
            return res.status(400).json({
                success: false,
                message: 'Maintenance date, type, and description are required'
            });
        }
        
        const [result] = await query(`
            INSERT INTO asset_maintenance_log (
                asset_id, maintenance_date, maintenance_type, description,
                performed_by, cost, next_scheduled_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            req.params.id,
            maintenance_date,
            maintenance_type,
            description,
            performed_by || null,
            cost || null,
            next_scheduled_date || null
        ]);
        
        // Update asset's last maintenance date
        await query(`
            UPDATE fixed_assets 
            SET last_maintenance_date = ?, next_maintenance_date = ?
            WHERE id = ?
        `, [maintenance_date, next_scheduled_date, req.params.id]);
        
        const [newLog] = await query(`
            SELECT * FROM asset_maintenance_log WHERE id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Maintenance log added successfully',
            data: newLog[0]
        });
    } catch (error) {
        console.error('Error adding maintenance log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add maintenance log',
            error: error.message
        });
    }
});

module.exports = router;
