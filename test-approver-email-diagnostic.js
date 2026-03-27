// Real-time diagnostic test for approver email notification
// Run this AFTER signing as reviewer to see what happened

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest'
};

async function diagnoseApproverEmail(requisitionId) {
    let connection;
    
    try {
        console.log('=== Approver Email Diagnostic Test ===\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to database\n');
        
        // Step 1: Check requisition details
        console.log('📋 Step 1: Checking Requisition Details...');
        const [requisitions] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        
        if (requisitions.length === 0) {
            console.log(`❌ Requisition #${requisitionId} not found!\n`);
            return;
        }
        
        const req = requisitions[0];
        console.log(`Requisition ID: #${req.id}`);
        console.log(`Requestor: ${req.requestor_name}`);
        console.log(`Department: ${req.department}`);
        console.log(`Purpose: ${req.purpose}`);
        console.log(`Status: ${req.status}`);
        console.log(`Grand Total: ${req.grand_total} Birr`);
        console.log(`\nSignatures:`);
        console.log(`  - Requestor signature: ${req.signature_data ? '✓ EXISTS' : '❌ MISSING'}`);
        console.log(`  - Reviewed signature: ${req.reviewed_signature ? '✓ EXISTS' : '❌ MISSING'}`);
        console.log(`  - Approved signature: ${req.approved_signature ? '✓ EXISTS' : '❌ MISSING'}`);
        console.log(`  - Authorized signature: ${req.authorized_signature ? '✓ EXISTS' : '❌ MISSING'}`);
        console.log('');
        
        // Step 2: Check if reviewer signature exists
        if (!req.reviewed_signature) {
            console.log('⚠️  WARNING: No reviewer signature found!');
            console.log('The reviewer has not signed yet. Please sign as reviewer first.\n');
            return;
        }
        
        // Step 3: Check approver roles
        console.log('📋 Step 2: Checking Approver Roles...');
        const [approvers] = await connection.execute(
            `SELECT u.id, u.email, u.full_name, u.is_active, rr.role_type, rr.is_active as role_is_active 
             FROM requisition_roles rr 
             JOIN users u ON rr.user_id = u.id 
             WHERE rr.role_type = 'approver' AND rr.is_active = TRUE AND u.is_active = TRUE`
        );
        
        console.log(`Found ${approvers.length} active approver(s):\n`);
        
        if (approvers.length === 0) {
            console.log('❌ NO ACTIVE APPROVERS FOUND!\n');
            
            // Check for inactive approvers
            const [allApprovers] = await connection.execute(
                `SELECT u.email, u.full_name, rr.is_active as role_active, u.is_active as user_active 
                 FROM requisition_roles rr 
                 JOIN users u ON rr.user_id = u.id 
                 WHERE rr.role_type = 'approver'`
            );
            
            if (allApprovers.length > 0) {
                console.log('Found inactive approver(s):');
                allApprovers.forEach((a, i) => {
                    console.log(`  ${i + 1}. ${a.full_name} (${a.email}) - Role Active: ${a.role_active}, User Active: ${a.user_active}`);
                });
                
                console.log('\n💡 Solution: Activate approver role(s)');
                console.log('Run this SQL:');
                console.log('UPDATE requisition_roles SET is_active = TRUE WHERE role_type = \'approver\';\n');
            } else {
                console.log('No approver roles exist at all.');
                console.log('\n💡 Solution: Add an approver role');
                console.log('Run this SQL:');
                console.log(`INSERT INTO requisition_roles (user_id, role_type, is_active) SELECT id, 'approver', TRUE FROM users WHERE email = 'your-email@example.com';\n`);
            }
            return;
        }
        
        approvers.forEach((a, i) => {
            console.log(`  ${i + 1}. ${a.full_name} (${a.email})`);
        });
        console.log('');
        
        // Step 4: Check Brevo API configuration
        console.log('📋 Step 3: Checking Email Configuration...');
        const apiKey = process.env.BREVO_API_KEY;
        
        if (!apiKey) {
            console.log('❌ BREVO_API_KEY not found in .env file!\n');
            console.log('💡 Solution: Add BREVO_API_KEY to Backend/.env\n');
            return;
        }
        
        console.log(`✓ Brevo API key configured (length: ${apiKey.length})`);
        console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}\n`);
        
        // Step 5: Test sending email
        console.log('📋 Step 4: Testing Email Send...\n');
        
        const axios = require('axios');
        let successCount = 0;
        let failCount = 0;
        
        for (const approver of approvers) {
            console.log(`Testing email to: ${approver.email}`);
            
            const emailData = {
                sender: {
                    email: process.env.EMAIL_FROM || 'noreply@yoursite.com',
                    name: 'SOKAPP System'
                },
                to: [{ email: approver.email }],
                subject: `Test: Requisition Awaiting Approval - #${requisitionId}`,
                htmlContent: `
                    <html>
                    <body>
                        <h2>Test Email - Approver Notification</h2>
                        <p>Hello ${approver.full_name || 'Approver'},</p>
                        <p>This is a TEST email to verify that approver notifications are working.</p>
                        <p><strong>Requisition #${requisitionId}</strong> has been reviewed and awaits your approval.</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <p>If you receive this, the email system is functioning correctly!</p>
                    </body>
                    </html>
                `
            };
            
            try {
                const response = await axios.post(
                    'https://api.brevo.com/v3/smtp/email',
                    emailData,
                    {
                        headers: {
                            'accept': 'application/json',
                            'content-type': 'application/json',
                            'api-key': apiKey
                        },
                        timeout: 10000
                    }
                );
                
                console.log(`  ✓ SUCCESS - Message ID: ${response.data.messageId}\n`);
                successCount++;
            } catch (error) {
                console.log(`  ❌ FAILED`);
                if (error.response) {
                    console.log(`     HTTP ${error.response.status}: ${error.response.statusText}`);
                    if (error.response.data && error.response.data.message) {
                        console.log(`     Error: ${error.response.data.message}`);
                    }
                } else if (error.code) {
                    console.log(`     Network Error: ${error.code}`);
                    console.log(`     ${error.message}`);
                } else {
                    console.log(`     ${error.message}`);
                }
                console.log('');
                failCount++;
            }
        }
        
        // Step 6: Summary
        console.log('=== Diagnostic Summary ===\n');
        console.log(`Requisition #${requisitionId}:`);
        console.log(`  - Reviewer signature: ${req.reviewed_signature ? '✓ Present' : '❌ Missing'}`);
        console.log(`  - Active approvers: ${approvers.length}`);
        console.log(`  - Brevo API: ${apiKey ? '✓ Configured' : '❌ Not configured'}`);
        console.log(`\nEmail Test Results:`);
        console.log(`  - Successful: ${successCount}`);
        console.log(`  - Failed: ${failCount}`);
        console.log('');
        
        if (successCount === approvers.length && approvers.length > 0) {
            console.log('✅ EMAIL SYSTEM IS WORKING!');
            console.log('\nIf approvers still didn\'t receive email when reviewer signed, check:');
            console.log('  1. Backend server logs for "STAGE 1: NEW reviewer signature detected"');
            console.log('  2. Backend server logs for "Approval notification sent successfully"');
            console.log('  3. Spam/junk folder in email inbox');
            console.log('  4. Whether the reviewer signature was actually saved');
        } else if (failCount > 0) {
            console.log('❌ EMAIL SYSTEM HAS ISSUES');
            console.log('\nSee error messages above for details.');
        }
        
        console.log('\n=== Test Complete ===\n');
        
    } catch (error) {
        console.error('❌ Error during diagnostic:', error.message);
        if (error.code) {
            console.error('Error Code:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Get requisition ID from command line or use most recent
const requisitionId = process.argv[2] || null;

if (!requisitionId) {
    console.log('Usage: node test-approver-email-diagnostic.js [requisition_id]');
    console.log('Example: node test-approver-email-diagnostic.js 123\n');
    console.log('If no requisition ID provided, will check the most recent one...\n');
}

// Find most recent requisition if ID not provided
async function findAndTestMostRecent() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT id FROM requisitions ORDER BY id DESC LIMIT 1'
        );
        
        if (rows.length > 0) {
            console.log(`Testing most recent requisition: #${rows[0].id}\n`);
            await diagnoseApproverEmail(rows[0].id);
        } else {
            console.log('No requisitions found in database.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

// Run the test
if (requisitionId) {
    diagnoseApproverEmail(parseInt(requisitionId));
} else {
    findAndTestMostRecent();
}
