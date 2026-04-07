const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/lookup - Fetch all lookup data
router.get('/', async (req, res) => {
    try {
        // Fetch departments
        const [departments] = await db.query(`
            SELECT li.value 
            FROM lookup_items li
            INNER JOIN lookup_categories lc ON li.category_id = lc.id
            WHERE lc.name = 'departments' AND li.is_active = TRUE
            ORDER BY li.display_order, li.value
        `);

        // Fetch positions
        const [positions] = await db.query(`
            SELECT li.value 
            FROM lookup_items li
            INNER JOIN lookup_categories lc ON li.category_id = lc.id
            WHERE lc.name = 'positions' AND li.is_active = TRUE
            ORDER BY li.display_order, li.value
        `);

        // Fetch employee statuses
        const [employeeStatuses] = await db.query(`
            SELECT li.value 
            FROM lookup_items li
            INNER JOIN lookup_categories lc ON li.category_id = lc.id
            WHERE lc.name = 'employee_statuses' AND li.is_active = TRUE
            ORDER BY li.display_order, li.value
        `);

        // Fetch inventory categories
        const [inventoryCategories] = await db.query(`
            SELECT li.value 
            FROM lookup_items li
            INNER JOIN lookup_categories lc ON li.category_id = lc.id
            WHERE lc.name = 'inventory_categories' AND li.is_active = TRUE
            ORDER BY li.display_order, li.value
        `);

        // Fetch asset categories
        const [assetCategories] = await db.query(`
            SELECT li.value 
            FROM lookup_items li
            INNER JOIN lookup_categories lc ON li.category_id = lc.id
            WHERE lc.name = 'asset_categories' AND li.is_active = TRUE
            ORDER BY li.display_order, li.value
        `);

        res.json({
            success: true,
            departments: departments.map(d => d.value),
            positions: positions.map(p => p.value),
            employeeStatuses: employeeStatuses.map(s => s.value),
            inventoryCategories: inventoryCategories.map(c => c.value),
            assetCategories: assetCategories.map(a => a.value)
        });
    } catch (error) {
        console.error('Error fetching lookup data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lookup data',
            error: error.message
        });
    }
});

// POST /api/lookup/add - Add new item to lookup list
router.post('/add', async (req, res) => {
    try {
        const { category, value } = req.body;

        if (!category || !value) {
            return res.status(400).json({
                success: false,
                message: 'Category and value are required'
            });
        }

        // Map frontend category names to database names
        const categoryMap = {
            'departments': 'departments',
            'positions': 'positions',
            'employeeStatuses': 'employee_statuses',
            'inventoryCategories': 'inventory_categories',
            'assetCategories': 'asset_categories'
        };

        const dbCategoryName = categoryMap[category];
        
        if (!dbCategoryName) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Get category ID
        const [categories] = await db.query(`
            SELECT id FROM lookup_categories WHERE name = ?
        `, [dbCategoryName]);

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const categoryId = categories[0].id;

        // Check if value already exists
        const [existing] = await db.query(`
            SELECT id FROM lookup_items 
            WHERE category_id = ? AND value = ?
        `, [categoryId, value]);

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Value already exists'
            });
        }

        // Insert new lookup item
        await db.query(`
            INSERT INTO lookup_items (category_id, value, display_order, is_active)
            VALUES (?, ?, 0, TRUE)
        `, [categoryId, value]);

        res.json({
            success: true,
            message: 'Item added successfully'
        });
    } catch (error) {
        console.error('Error adding lookup item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add lookup item',
            error: error.message
        });
    }
});

// DELETE /api/lookup/delete - Delete item from lookup list
router.delete('/delete', async (req, res) => {
    console.log('=== DELETE LOOKUP ITEM REQUEST ===');
    console.log('Request body:', req.body);
    
    try {
        const { category, value } = req.body;
        console.log('Extracted category:', category);
        console.log('Extracted value:', value);

        if (!category || !value) {
            console.log('Validation failed: missing category or value');
            return res.status(400).json({
                success: false,
                message: 'Category and value are required'
            });
        }

        // Map frontend category names to database names
        const categoryMap = {
            'departments': 'departments',
            'positions': 'positions',
            'employeeStatuses': 'employee_statuses',
            'inventoryCategories': 'inventory_categories',
            'assetCategories': 'asset_categories'
        };

        const dbCategoryName = categoryMap[category];
        
        if (!dbCategoryName) {
            console.log('Invalid category:', category);
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Get category ID
        console.log('Looking up category:', dbCategoryName);
        const [categories] = await db.query(`
            SELECT id FROM lookup_categories WHERE name = ?
        `, [dbCategoryName]);
        console.log('Category lookup result:', categories);

        if (categories.length === 0) {
            console.log('Category not found:', category);
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const categoryId = categories[0].id;
        console.log('Category ID:', categoryId);

        // Check if item is being used (for departments only)
        if (dbCategoryName === 'departments') {
            console.log('Checking department usage for:', value);
            // Get all employees to check department values
            const [allEmployees] = await db.query(`
                SELECT id, full_name, department 
                FROM employees
            `);
            console.log('Total employees in database:', allEmployees.length);

            // Find employees using this exact department (with normalized comparison)
            const normalizedLookupValue = value.trim().toLowerCase();
            const matchingEmployees = allEmployees.filter(emp => {
                const empDept = (emp.department || '').trim().toLowerCase();
                const matches = empDept === normalizedLookupValue;
                if (matches) {
                    console.log('MATCH FOUND:', {
                        employeeId: emp.id,
                        employeeName: emp.full_name,
                        employeeDept: emp.department,
                        lookupValue: value,
                        normalizedLookup: normalizedLookupValue,
                        empDeptNormalized: empDept
                    });
                }
                return matches;
            });

            console.log('Matching employees count:', matchingEmployees.length);

            if (matchingEmployees.length > 0) {
                console.log('Blocking deletion due to', matchingEmployees.length, 'employees');
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete: ${matchingEmployees.length} employee(s) still use this department`,
                    employees: matchingEmployees.map(emp => ({
                        id: emp.id,
                        name: emp.full_name,
                        department: emp.department
                    }))
                });
            }
        }

        console.log('Proceeding with deletion...');
        // Delete the lookup item
        const [deleteResult] = await db.query(`
            DELETE FROM lookup_items 
            WHERE category_id = ? AND value = ?
        `, [categoryId, value]);
        console.log('Delete result:', deleteResult);

        console.log('Item deleted successfully!');
        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lookup item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete lookup item',
            error: error.message
        });
    }
});

module.exports = router;
