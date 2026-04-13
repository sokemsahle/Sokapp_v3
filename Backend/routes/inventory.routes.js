const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const axios = require('axios');
const { logUserActivity } = require('../utils/activityLogger');

// No auth middleware - consistent with other routes in this app

/**
 * POST /api/inventory/request
 * Create a new inventory request
 */
router.post('/request', async (req, res) => {
    console.log('POST /api/inventory/request received');
    console.log('Request body:', req.body);
    
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { 
            inventory_id, 
            requestor_name, 
            requestor_email, 
            requestor_department,
            quantity_requested, 
            reason, 
            urgency,
            user_id,
            userId, userEmail, userName, roleId, roleName
        } = req.body;
        
        console.log('Parsed fields:', { inventory_id, requestor_name, requestor_email, quantity_requested });
        
        // Validate required fields
        if (!inventory_id || !requestor_name || !requestor_email || !quantity_requested) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: inventory_id, requestor_name, requestor_email, quantity_requested' 
            });
        }
        
        // Check if inventory item exists and has sufficient stock
        const [inventoryItems] = await connection.execute(
            'SELECT id, name, quantity, min_stock_level, unit FROM inventory WHERE id = ?',
            [inventory_id]
        );
        
        if (inventoryItems.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }
        
        const inventoryItem = inventoryItems[0];
        
        // Check if enough stock is available
        if (inventoryItem.quantity < quantity_requested) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock. Only ${inventoryItem.quantity} ${inventoryItem.unit} available.`,
                available_quantity: inventoryItem.quantity
            });
        }
        
        // Insert the request into database
        const [result] = await connection.execute(
            `INSERT INTO inventory_requests (
                inventory_id, requestor_user_id, requestor_name, requestor_email, 
                requestor_department, quantity_requested, reason, urgency
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                inventory_id,
                user_id || null,
                requestor_name,
                requestor_email,
                requestor_department || null,
                quantity_requested,
                reason || null,
                urgency || 'normal'
            ]
        );
        
        const requestId = result.insertId;
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'create',
                module: 'Inventory Management',
                actionDescription: `Created inventory request #${requestId}`,
                tableName: 'inventory_requests',
                recordId: requestId,
                newValues: {
                    inventory_id: inventory_id,
                    item_name: inventoryItem.name,
                    quantity_requested,
                    reason,
                    urgency
                },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log inventory request activity:', logError);
        }
        
        // Get inventory managers to notify them
        console.log('Querying for inventory managers...');
        const [managers] = await connection.execute(`
            SELECT DISTINCT u.email, u.full_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name = 'inventory_manage' AND u.is_active = 1
        `);
        
        console.log(`Found ${managers.length} inventory manager(s):`, managers);
        
        // Send email notifications to inventory managers
        if (managers.length > 0 && process.env.BREVO_API_KEY) {
            console.log('Brevo API key present:', !!process.env.BREVO_API_KEY);
            console.log('Sending emails to managers...');
            const emailPromises = managers.map(manager => {
                const emailData = {
                    sender: { 
                        name: "Inventory System", 
                        email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "noreply@sokapp.online" 
                    },
                    to: [{ email: manager.email, name: manager.full_name }],
                    subject: `📦 New Inventory Request #${requestId} - ${urgency.toUpperCase()}`,
                    htmlContent: `
                        <h2>New Inventory Request Submitted</h2>
                        <p><strong>Request ID:</strong> #${requestId}</p>
                        <p><strong>Requested by:</strong> ${requestor_name}</p>
                        <p><strong>Department:</strong> ${requestor_department || 'N/A'}</p>
                        <p><strong>Email:</strong> ${requestor_email}</p>
                        <hr>
                        <h3>Item Details:</h3>
                        <p><strong>Item:</strong> ${inventoryItem.name}</p>
                        <p><strong>Quantity Requested:</strong> ${quantity_requested}</p>
                        <p><strong>Current Stock:</strong> ${inventoryItem.quantity}</p>
                        <p><strong>Urgency:</strong> <span style="color: ${urgency === 'urgent' ? 'red' : 'orange'}">${urgency.toUpperCase()}</span></p>
                        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">Please log in to the system to approve or reject this request.</p>
                    `
                };
                
                console.log(`\n📧 Sending email to ${manager.email}:`);
                console.log('   Subject:', emailData.subject);
                console.log('   Sender:', emailData.sender.email);
                
                return axios.post(
                    'https://api.brevo.com/v3/smtp/email',
                    emailData,
                    {
                        headers: {
                            'api-key': process.env.BREVO_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    }
                ).then(response => {
                    console.log(`✅ Email sent successfully to ${manager.email}`);
                    return response;
                }).catch(err => {
                    console.error(`❌ Email send failed to ${manager.email}:`, err.message);
                    if (err.response) {
                        console.error('Brevo API error response:', JSON.stringify(err.response.data, null, 2));
                    } else if (err.request) {
                        console.error('No response received from Brevo');
                    }
                    return err;
                });
            });
            
            const results = await Promise.allSettled(emailPromises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`✅ Email notification results: ${successful} succeeded, ${failed} failed`);
        } else if (managers.length === 0) {
            console.warn('⚠️ No inventory managers found to notify');
        } else if (!process.env.BREVO_API_KEY) {
            console.warn('⚠️ Brevo API key not configured');
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Request submitted successfully. Inventory manager will be notified.',
            request_id: requestId
        });
    } catch (error) {
        console.error('Error submitting request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit request', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/inventory/requests/pending
 * Get all pending requests (for inventory managers)
 */
router.get('/requests/pending', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { status = 'pending' } = req.query;
        
        const [requests] = await connection.execute(`
            SELECT 
                ir.*,
                i.name as item_name,
                i.category,
                i.quantity as current_stock,
                i.unit,
                i.min_stock_level
            FROM inventory_requests ir
            JOIN inventory i ON ir.inventory_id = i.id
            WHERE ir.status = ?
            ORDER BY 
                FIELD(ir.urgency, 'urgent', 'high', 'normal', 'low'),
                ir.created_at DESC
        `, [status]);
        
        res.status(200).json({ 
            success: true, 
            requests,
            count: requests.length 
        });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch pending requests', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/inventory/requests/my
 * Get all requests for a specific user
 */
router.get('/requests/my', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email parameter required' 
            });
        }
        
        const [requests] = await connection.execute(`
            SELECT 
                ir.*,
                i.name as item_name,
                i.category,
                i.quantity as current_stock,
                i.unit
            FROM inventory_requests ir
            JOIN inventory i ON ir.inventory_id = i.id
            WHERE ir.requestor_email = ?
            ORDER BY ir.created_at DESC
        `, [email]);
        
        res.status(200).json({ 
            success: true, 
            requests,
            count: requests.length 
        });
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch requests', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * PUT /api/inventory/request/:id/approve
 * Approve an inventory request
 */
router.put('/request/:id/approve', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { 
            approved_by, 
            approved_by_name, 
            quantity_approved 
        } = req.body;
        
        // Get the request details with item information
        const [requests] = await connection.execute(`
            SELECT 
                ir.*,
                i.name as item_name,
                i.category,
                i.quantity as current_stock,
                i.unit,
                i.is_returnable
            FROM inventory_requests ir
            JOIN inventory i ON ir.inventory_id = i.id
            WHERE ir.id = ? AND ir.status = 'pending'
        `, [id]);
        
        if (requests.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pending request not found' 
            });
        }
        
        const request = requests[0];
        
        // Determine final approval status
        const finalStatus = quantity_approved && quantity_approved < request.quantity_requested
            ? 'partially_approved'
            : 'approved';
        
        const finalQuantity = quantity_approved || request.quantity_requested;
        
        // Check if this is a returnable item request
        if (request.is_returnable) {
            // For returnable items, create a checkout transaction instead of reducing stock
            await connection.execute(`
                UPDATE inventory_requests 
                SET 
                    status = ?,
                    quantity_approved = ?,
                    approved_by = ?,
                    approved_by_name = ?,
                    approval_date = CURRENT_TIMESTAMP,
                    notified = 1
                WHERE id = ?
            `, [finalStatus, finalQuantity, approved_by || null, approved_by_name || null, id]);
            
            // Create a returnable transaction (checkout)
            const [transactionResult] = await connection.execute(`
                INSERT INTO returnable_transactions (
                    inventory_id, user_id, borrower_name, borrower_email,
                    borrower_department, quantity, status, checkout_date,
                    expected_return_date, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, 'checked_out', NOW(), ?, ?, ?)
            `, [
                request.inventory_id,
                request.requestor_user_id || null,
                request.requestor_name,
                request.requestor_email,
                request.requestor_department || null,
                finalQuantity,
                request.expected_return_date || null,
                `Approved via request #${id}`,
                approved_by || null
            ]);
            
            // Trigger will automatically update inventory quantity
            
            res.status(200).json({ 
                success: true, 
                message: `Request ${finalStatus.replace('_', ' ')} successfully. Item checked out automatically.`,
                status: finalStatus,
                quantity_approved: finalQuantity,
                transaction_id: transactionResult.insertId
            });
        } else {
            // For regular items, update the request (trigger will handle stock reduction)
            await connection.execute(`
                UPDATE inventory_requests 
                SET 
                    status = ?,
                    quantity_approved = ?,
                    approved_by = ?,
                    approved_by_name = ?,
                    approval_date = CURRENT_TIMESTAMP,
                    notified = 1
                WHERE id = ?
            `, [finalStatus, finalQuantity, approved_by || null, approved_by_name || null, id]);
            
            res.status(200).json({ 
                success: true, 
                message: `Request ${finalStatus.replace('_', ' ')} successfully. Stock updated automatically.`,
                status: finalStatus,
                quantity_approved: finalQuantity
            });
        }
        
        // Send approval confirmation email to requestor
        if (process.env.BREVO_API_KEY) {
            const isReturnable = request.is_returnable;
            await axios.post(
                'https://api.brevo.com/v3/smtp/email',
                {
                    sender: { 
                        name: "Inventory System", 
                        email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "noreply@sokapp.online" 
                    },
                    to: [{ email: request.requestor_email, name: request.requestor_name }],
                    subject: isReturnable 
                        ? `✅ Returnable Item Request #${id} Approved - Checkout Ready`
                        : `✅ Inventory Request #${id} Approved`,
                    htmlContent: `
                        <h2>Your Inventory Request Has Been Approved!</h2>
                        <p><strong>Request ID:</strong> #${id}</p>
                        <p><strong>Status:</strong> <span style="color: green">${finalStatus.replace('_', ' ').toUpperCase()}</span></p>
                        <hr>
                        <h3>Approved Items:</h3>
                        <p><strong>Item:</strong> ${request.item_name || 'Inventory Item'} ${request.category ? '(' + request.category + ')' : ''}</p>
                        <p><strong>Quantity Approved:</strong> ${finalQuantity} ${request.unit || 'units'}</p>
                        ${isReturnable ? '<p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;"><strong>📦 Returnable Item:</strong> This item has been checked out to you. Please return it by the expected return date.</p>' : ''}
                        ${request.expected_return_date ? `<p><strong>Expected Return Date:</strong> ${new Date(request.expected_return_date).toLocaleDateString()}</p>` : ''}
                        ${finalStatus === 'partially_approved' ? `<p style="color: orange;"><em>Note: You requested ${request.quantity_requested}, but only ${finalQuantity} were approved due to stock availability.</em></p>` : ''}
                        <hr>
                        <p><strong>Approved by:</strong> ${approved_by_name || 'Inventory Manager'}</p>
                        <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">${isReturnable ? 'You can collect your item from the inventory location. Remember to return it on time!' : 'You can collect your items from the inventory location.'}</p>
                    `
                },
                {
                    headers: {
                        'api-key': process.env.BREVO_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            ).catch(err => {
                console.error('Approval email send failed:', err.message);
                if (err.response) {
                    console.error('Brevo API error:', JSON.stringify(err.response.data, null, 2));
                }
            });
        }
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve request', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * PUT /api/inventory/request/:id/reject
 * Reject an inventory request
 */
router.put('/request/:id/reject', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { 
            rejected_by, 
            rejected_by_name, 
            rejection_reason 
        } = req.body;
        
        console.log(`\n🔴 REJECT REQUEST #${id}`);
        console.log('Request body:', req.body);
        console.log('BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY);
        
        // Get the request details with item information
        const [requests] = await connection.execute(`
            SELECT 
                ir.*,
                i.name as item_name,
                i.category,
                i.quantity as current_stock,
                i.unit
            FROM inventory_requests ir
            JOIN inventory i ON ir.inventory_id = i.id
            WHERE ir.id = ? AND ir.status = 'pending'
        `, [id]);
        
        console.log('Query result count:', requests.length);
        
        if (requests.length === 0) {
            console.log(`❌ Pending request #${id} not found. It may already be approved/rejected.`);
            return res.status(404).json({ 
                success: false, 
                message: `Pending request #${id} not found. Check if it has already been processed.` 
            });
        }
        
        const request = requests[0];
        console.log(`✅ Found request #${id}:`, {
            status: request.status,
            item_name: request.item_name,
            requestor: request.requestor_name,
            quantity: request.quantity_requested
        });
        
        // Update the request
        console.log('Updating request status to rejected...');
        const [updateResult] = await connection.execute(`
            UPDATE inventory_requests 
            SET 
                status = 'rejected',
                rejected_by = ?,
                rejected_by_name = ?,
                rejection_reason = ?,
                rejected_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [rejected_by || null, rejected_by_name || null, rejection_reason || null, id]);
        
        console.log('Update result:', updateResult);
        console.log('✅ Request updated successfully');
        
        // Send rejection email to requestor
        if (process.env.BREVO_API_KEY) {
            console.log('📧 Sending rejection email to:', request.requestor_email);
            
            const emailData = {
                sender: { 
                    name: "Inventory System", 
                    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "noreply@sokapp.online" 
                },
                to: [{ email: request.requestor_email, name: request.requestor_name }],
                subject: `❌ Inventory Request #${id} Rejected`,
                htmlContent: `
                    <h2>Your Inventory Request Was Rejected</h2>
                    <p><strong>Request ID:</strong> #${id}</p>
                    <p><strong>Status:</strong> <span style="color: red">REJECTED</span></p>
                    <hr>
                    <h3>Request Details:</h3>
                    <p><strong>Item:</strong> ${request.item_name || 'Inventory Item'} ${request.category ? '(' + request.category + ')' : ''}</p>
                    <p><strong>Quantity Requested:</strong> ${request.quantity_requested} ${request.unit || 'units'}</p>
                    <hr>
                    <p><strong>Rejection Reason:</strong></p>
                    <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545;">
                        ${rejection_reason || 'No reason provided'}
                    </blockquote>
                    <p><strong>Rejected by:</strong> ${rejected_by_name || 'Inventory Manager'}</p>
                    <p><strong>Rejection Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">If you have questions, please contact the inventory manager.</p>
                `
            };
            
            await axios.post(
                'https://api.brevo.com/v3/smtp/email',
                emailData,
                {
                    headers: {
                        'api-key': process.env.BREVO_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            ).then(() => {
                console.log('✅ Rejection email sent successfully');
            }).catch(err => {
                console.error('❌ Rejection email send failed:', err.message);
                if (err.response) {
                    console.error('Brevo API error response:', JSON.stringify(err.response.data, null, 2));
                } else if (err.request) {
                    console.error('No response received from Brevo server');
                } else {
                    console.error('Error setting up request:', err.message);
                }
            });
        } else {
            console.log('⚠️ BREVO_API_KEY not configured, skipping email');
        }
        
        console.log('✅ Request rejected successfully\n');
        
        res.status(200).json({ 
            success: true, 
            message: 'Request rejected successfully. Rejection email sent to requestor.' 
        });
    } catch (error) {
        console.error('❌ ERROR rejecting request:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reject request', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/inventory/requests
 * Get all inventory requests with filters
 */
router.get('/requests', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { status, inventory_id, requestor_email, start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                ir.*,
                i.name as item_name,
                i.category,
                i.quantity as current_stock,
                i.unit,
                i.location
            FROM inventory_requests ir
            JOIN inventory i ON ir.inventory_id = i.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND ir.status = ?';
            params.push(status);
        }
        
        if (inventory_id) {
            query += ' AND ir.inventory_id = ?';
            params.push(inventory_id);
        }
        
        if (requestor_email) {
            query += ' AND ir.requestor_email = ?';
            params.push(requestor_email);
        }
        
        if (start_date) {
            query += ' AND DATE(ir.created_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(ir.created_at) <= ?';
            params.push(end_date);
        }
        
        query += ' ORDER BY ir.created_at DESC';
        
        const [requests] = await connection.execute(query, params);
        
        res.status(200).json({ 
            success: true, 
            requests,
            count: requests.length 
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch requests', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// ========== INVENTORY ITEM CRUD ENDPOINTS ==========

// ========== RETURNABLE ITEMS TRACKING ENDPOINTS ==========

/**
 * GET /api/inventory/returnable/checked-out
 * Get all checked out returnable items
 */
router.get('/returnable/checked-out', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { status = 'checked_out' } = req.query;
        
        const [transactions] = await connection.execute(`
            SELECT 
                rt.*,
                i.name as item_name,
                i.category,
                i.unit,
                u.full_name as user_full_name,
                u.email as user_email
            FROM returnable_transactions rt
            JOIN inventory i ON rt.inventory_id = i.id
            LEFT JOIN users u ON rt.user_id = u.id
            WHERE rt.status = ?
            ORDER BY rt.checkout_date DESC
        `, [status]);
        
        res.status(200).json({ 
            success: true, 
            transactions,
            count: transactions.length 
        });
    } catch (error) {
        console.error('Error fetching checked out items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch checked out items', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * GET /api/inventory/returnable/history
 * Get returnable transaction history with filters
 */
router.get('/returnable/history', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { inventory_id, borrower_email, start_date, end_date, status } = req.query;
        
        let query = `
            SELECT 
                rt.*,
                i.name as item_name,
                i.category,
                i.unit,
                u.full_name as user_full_name,
                u.email as user_email
            FROM returnable_transactions rt
            JOIN inventory i ON rt.inventory_id = i.id
            LEFT JOIN users u ON rt.user_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND rt.status = ?';
            params.push(status);
        }
        
        if (inventory_id) {
            query += ' AND rt.inventory_id = ?';
            params.push(inventory_id);
        }
        
        if (borrower_email) {
            query += ' AND rt.borrower_email = ?';
            params.push(borrower_email);
        }
        
        if (start_date) {
            query += ' AND DATE(rt.checkout_date) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(rt.checkout_date) <= ?';
            params.push(end_date);
        }
        
        query += ' ORDER BY rt.checkout_date DESC';
        
        const [transactions] = await connection.execute(query, params);
        
        res.status(200).json({ 
            success: true, 
            transactions,
            count: transactions.length 
        });
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch transaction history', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * POST /api/inventory/returnable/checkout
 * Checkout a returnable item
 */
router.post('/returnable/checkout', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { 
            inventory_id, 
            borrower_name, 
            borrower_email, 
            borrower_department,
            quantity,
            expected_return_date,
            condition_at_checkout,
            notes,
            userId, userEmail, userName, roleId, roleName
        } = req.body;
        
        // Validate required fields
        if (!inventory_id || !borrower_name || !borrower_email || !quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: inventory_id, borrower_name, borrower_email, quantity' 
            });
        }
        
        // Check if inventory item exists and is returnable
        const [inventoryItems] = await connection.execute(
            'SELECT id, name, quantity, is_returnable FROM inventory WHERE id = ?',
            [inventory_id]
        );
        
        if (inventoryItems.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }
        
        const item = inventoryItems[0];
        
        if (!item.is_returnable) {
            return res.status(400).json({ 
                success: false, 
                message: 'This item is not marked as returnable' 
            });
        }
        
        if (item.quantity < quantity) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock. Only ${item.quantity} available.`,
                available_quantity: item.quantity
            });
        }
        
        // Insert checkout transaction
        const [result] = await connection.execute(
            `INSERT INTO returnable_transactions (
                inventory_id, user_id, borrower_name, borrower_email, 
                borrower_department, quantity, status, checkout_date, 
                expected_return_date, condition_at_checkout, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, 'checked_out', NOW(), ?, ?, ?, ?)`,
            [
                inventory_id,
                userId || null,
                borrower_name,
                borrower_email,
                borrower_department || null,
                quantity,
                expected_return_date || null,
                condition_at_checkout || null,
                notes || null,
                userId || null
            ]
        );
        
        // Trigger will automatically update inventory quantity
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'create',
                module: 'Returnable Items',
                actionDescription: `Checked out ${quantity}x ${item.name}`,
                tableName: 'returnable_transactions',
                recordId: result.insertId,
                newValues: {
                    inventory_id: inventory_id,
                    item_name: item.name,
                    quantity,
                    borrower_name,
                    borrower_email
                },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log activity:', logError);
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Item checked out successfully',
            transaction_id: result.insertId
        });
    } catch (error) {
        console.error('Error checking out item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to checkout item', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * PUT /api/inventory/returnable/:id/return
 * Return a checked out item
 */
router.put('/returnable/:id/return', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { 
            condition_at_return,
            notes,
            userId, userEmail, userName, roleId, roleName
        } = req.body;
        
        // Get the transaction details
        const [transactions] = await connection.execute(
            'SELECT * FROM returnable_transactions WHERE id = ? AND status = "checked_out"',
            [id]
        );
        
        if (transactions.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Active checkout transaction not found' 
            });
        }
        
        const transaction = transactions[0];
        
        // Update transaction to returned status
        await connection.execute(
            `UPDATE returnable_transactions 
            SET 
                status = 'returned',
                actual_return_date = NOW(),
                condition_at_return = ?,
                notes = ?
            WHERE id = ?`,
            [
                condition_at_return || null,
                notes || null,
                id
            ]
        );
        
        // Trigger will automatically update inventory quantity
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'update',
                module: 'Returnable Items',
                actionDescription: `Returned ${transaction.quantity}x ${transaction.borrower_name}`,
                tableName: 'returnable_transactions',
                recordId: parseInt(id),
                oldValues: { status: 'checked_out' },
                newValues: { status: 'returned' },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log activity:', logError);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Item returned successfully. Inventory updated automatically.'
        });
    } catch (error) {
        console.error('Error returning item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to return item', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// ========== INVENTORY ITEM CRUD ENDPOINTS ==========

/**
 * GET /api/inventory - Get all inventory items
 */
router.get('/', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { program_id, category, status } = req.query;
        
        let query = 'SELECT * FROM inventory WHERE 1=1';
        const params = [];
        
        if (program_id) {
            query += ' AND program_id = ?';
            params.push(program_id);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [items] = await connection.execute(query, params);
        
        res.status(200).json({ 
            success: true, 
            items,
            count: items.length 
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch inventory', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * POST /api/inventory - Create new inventory item
 */
router.post('/', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { 
            name, category, quantity, unit, location, status,
            min_stock_level, description, supplier, cost_per_unit, program_id,
            has_expiry_date, expiry_date, is_returnable,
            userId, userEmail, userName, roleId, roleName
        } = req.body;
        
        const [result] = await connection.execute(
            `INSERT INTO inventory (
                name, category, quantity, unit, location, status,
                min_stock_level, description, supplier, cost_per_unit, program_id,
                has_expiry_date, expiry_date, is_returnable
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                category || null,
                quantity || 0,
                unit || 'pcs',
                location || null,
                status || 'active',
                min_stock_level || 10,
                description || null,
                supplier || null,
                cost_per_unit || null,
                // Convert empty string or 'null' string to null for foreign key
                (program_id && program_id !== '' && program_id !== 'null') ? program_id : null,
                has_expiry_date ? 1 : 0,
                expiry_date || null,
                is_returnable ? 1 : 0
            ]
        );
        
        const [newItem] = await connection.execute(
            'SELECT * FROM inventory WHERE id = ?',
            [result.insertId]
        );
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'create',
                module: 'Inventory Management',
                actionDescription: `Created inventory item: ${name}`,
                tableName: 'inventory',
                recordId: result.insertId,
                newValues: newItem[0],
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log inventory creation activity:', logError);
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Inventory item created successfully',
            item: newItem[0]
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create inventory item', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * PUT /api/inventory/:id - Update inventory item
 */
router.put('/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { 
            name, category, quantity, unit, location, status,
            min_stock_level, description, supplier, cost_per_unit, program_id,
            has_expiry_date, expiry_date, is_returnable,
            userId, userEmail, userName, roleId, roleName
        } = req.body;
        
        // Get current item data
        const [currentItem] = await connection.execute(
            'SELECT * FROM inventory WHERE id = ?',
            [id]
        );
        
        if (currentItem.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }
        
        await connection.execute(
            `UPDATE inventory SET
                name = ?, category = ?, quantity = ?, unit = ?, location = ?, 
                status = ?, min_stock_level = ?, description = ?, 
                supplier = ?, cost_per_unit = ?, program_id = ?,
                has_expiry_date = ?, expiry_date = ?, is_returnable = ?
            WHERE id = ?`,
            [
                name !== undefined ? name : currentItem[0].name,
                category !== undefined ? category : currentItem[0].category,
                quantity !== undefined ? quantity : currentItem[0].quantity,
                unit !== undefined ? unit : currentItem[0].unit,
                location !== undefined ? location : currentItem[0].location,
                status !== undefined ? status : currentItem[0].status,
                min_stock_level !== undefined ? min_stock_level : currentItem[0].min_stock_level,
                description !== undefined ? description : currentItem[0].description,
                supplier !== undefined ? supplier : currentItem[0].supplier,
                cost_per_unit !== undefined ? cost_per_unit : currentItem[0].cost_per_unit,
                // Convert empty string or null to null for foreign key
                (program_id !== undefined && program_id !== '' && program_id !== 'null') ? program_id : null,
                has_expiry_date !== undefined ? (has_expiry_date ? 1 : 0) : currentItem[0].has_expiry_date,
                expiry_date !== undefined ? (expiry_date || null) : currentItem[0].expiry_date,
                is_returnable !== undefined ? (is_returnable ? 1 : 0) : currentItem[0].is_returnable,
                id
            ]
        );
        
        const [updatedItem] = await connection.execute(
            'SELECT * FROM inventory WHERE id = ?',
            [id]
        );
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'update',
                module: 'Inventory Management',
                actionDescription: `Updated inventory item: ${name || currentItem[0].name}`,
                tableName: 'inventory',
                recordId: parseInt(id),
                oldValues: currentItem[0],
                newValues: updatedItem[0],
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log inventory update activity:', logError);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Inventory item updated successfully',
            item: updatedItem[0]
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update inventory item', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

/**
 * DELETE /api/inventory/:id - Delete inventory item
 */
router.delete('/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        
        // Get item data before deletion
        const [itemToDelete] = await connection.execute(
            'SELECT * FROM inventory WHERE id = ?',
            [id]
        );
        
        if (itemToDelete.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Inventory item not found' 
            });
        }
        
        await connection.execute('DELETE FROM inventory WHERE id = ?', [id]);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'delete',
                module: 'Inventory Management',
                actionDescription: `Deleted inventory item: ${itemToDelete[0].name}`,
                tableName: 'inventory',
                recordId: parseInt(id),
                oldValues: itemToDelete[0],
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log inventory deletion activity:', logError);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Inventory item deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete inventory item', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;
