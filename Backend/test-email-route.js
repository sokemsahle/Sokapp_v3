// Quick test endpoint to manually send reviewer email
// Run this after starting the backend server
// GET http://localhost:5000/api/test/send-reviewer-email

const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest',
};

// Simple email sending function
async function sendTestEmail(toEmail, subject, html) {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        return { success: false, message: 'BREVO_API_KEY not configured' };
    }
    
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    email: process.env.EMAIL_FROM || 'noreply@sokapp.online',
                    name: 'SOKAPP System'
                },
                to: [{ email: toEmail }],
                subject: subject,
                htmlContent: html
            },
            {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': apiKey
                }
            }
        );
        
        return { 
            success: true, 
            messageId: response.data.messageId 
        };
    } catch (error) {
        return { 
            success: false, 
            message: error.response?.data?.message || error.message 
        };
    }
}

// Test endpoint
router.get('/send-reviewer-email', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('\n=== MANUAL REVIEWER EMAIL TEST ===');
        
        // Get most recent requisition
        const [requisitions] = await connection.execute(
            'SELECT * FROM requisitions ORDER BY created_at DESC LIMIT 1'
        );
        
        if (requisitions.length === 0) {
            return res.json({ 
                success: false, 
                message: 'No requisitions found. Create one first!',
                action: 'Create a requisition in the app first'
            });
        }
        
        const requisition = requisitions[0];
        console.log(`Testing with requisition #${requisition.id}`);
        
        // Fetch active reviewers
        const [reviewers] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['reviewer', true, true]
        );
        
        if (!reviewers || reviewers.length === 0) {
            return res.json({ 
                success: false, 
                message: 'No active reviewers found',
                action: 'Run SQL: INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (YOUR_ID, "reviewer", TRUE)',
                available_users: await connection.execute('SELECT id, email, full_name FROM users WHERE is_active = TRUE')
                    .then(([rows]) => rows)
                    .catch(() => [])
            });
        }
        
        console.log(`Found ${reviewers.length} reviewer(s)`);
        
        // Send test emails
        const results = [];
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        for (const reviewer of reviewers) {
            const html = `
                <html>
                <body style="font-family: Arial; margin: 20px;">
                    <div style="background: #28a745; color: white; padding: 10px; border-radius: 5px;">
                        <h2>🧪 TEST EMAIL</h2>
                    </div>
                    <div style="margin: 20px 0;">
                        <p>Hello ${reviewer.full_name || 'Reviewer'},</p>
                        <p><strong>This is a TEST email</strong> to verify the system works.</p>
                        <p>Requisition #${requisition.id}</p>
                        <p>Requestor: ${requisition.requestor_name}</p>
                        <p>Department: ${requisition.department}</p>
                        <p>If you received this, email is working! ✅</p>
                        <a href="${frontendUrl}/requisitions/${requisition.id}" 
                           style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
                           View Requisition
                        </a>
                    </div>
                    <div style="margin-top: 20px; font-size: 12px; color: #666;">
                        Sent: ${new Date().toLocaleString()}
                    </div>
                </body>
                </html>
            `;
            
            const result = await sendTestEmail(
                reviewer.email,
                `🧪 TEST - Requisition Review - #${requisition.id}`,
                html
            );
            
            results.push({
                email: reviewer.email,
                name: reviewer.full_name,
                ...result
            });
            
            console.log(`${result.success ? '✅' : '❌'} ${reviewer.email}`);
        }
        
        res.json({
            success: true,
            message: `Sent to ${results.length} reviewer(s)`,
            requisition_id: requisition.id,
            results: results,
            instructions: 'Check email inbox (and spam folder) within 1-2 minutes'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.json({ 
            success: false, 
            message: error.message,
            stack: error.stack 
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;
