/**
 * Test Requisition Email Functionality
 * Tests the requisition email sending workflow
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');

async function testRequisitionEmails() {
    console.log('🧪 Testing Requisition Email Functionality\n');
    console.log('================================================\n');
    
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapp_db',
    };
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Test 1: Check Brevo API Key
        console.log('TEST 1: Checking Brevo API configuration...');
        const apiKey = process.env.BREVO_API_KEY;
        const emailFrom = process.env.EMAIL_FROM;
        
        if (!apiKey) {
            console.error('❌ FAIL: BREVO_API_KEY not configured in .env file');
            return;
        }
        
        if (!emailFrom) {
            console.error('❌ FAIL: EMAIL_FROM not configured in .env file');
            return;
        }
        
        console.log('✅ PASS: Brevo API key and sender email configured');
        console.log(`   API Key length: ${apiKey.length}`);
        console.log(`   Sender email: ${emailFrom}\n`);
        
        // Test 2: Check requisition_roles table
        console.log('TEST 2: Checking requisition_roles table...');
        
        const [reviewers] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['reviewer', true, true]
        );
        
        const [approvers] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['approver', true, true]
        );
        
        const [authorizers] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['authorizer', true, true]
        );
        
        const [finance] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['finance', true, true]
        );
        
        console.log('\n📊 Role Distribution:');
        console.log(`   Reviewers: ${reviewers.length}`);
        reviewers.forEach(r => console.log(`      - ${r.full_name} (${r.email})`));
        
        console.log(`\n   Approvers: ${approvers.length}`);
        approvers.forEach(a => console.log(`      - ${a.full_name} (${a.email})`));
        
        console.log(`\n   Authorizers: ${authorizers.length}`);
        authorizers.forEach(a => console.log(`      - ${a.full_name} (${a.email})`));
        
        console.log(`\n   Finance: ${finance.length}`);
        finance.forEach(f => console.log(`      - ${f.full_name} (${f.email})`));
        
        if (reviewers.length === 0 && approvers.length === 0 && authorizers.length === 0 && finance.length === 0) {
            console.error('\n❌ FAIL: No active users found in requisition_roles!');
            console.log('\nFIX: Run these SQL queries (replace USER_ID with actual user IDs):');
            console.log("INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (1, 'reviewer', TRUE);");
            console.log("INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (2, 'approver', TRUE);");
            console.log("INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (3, 'authorizer', TRUE);");
            console.log("INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (4, 'finance', TRUE);");
            await connection.end();
            return;
        }
        
        console.log('\n✅ PASS: requisition_roles table has active users\n');
        
        // Test 3: Check recent requisitions
        console.log('TEST 3: Checking recent requisitions...');
        const [requisitions] = await connection.execute(
            `SELECT id, requestor_name, requestor_email, department, status, 
                    reviewed_signature IS NOT NULL as has_review,
                    approved_signature IS NOT NULL as has_approval,
                    authorized_signature IS NOT NULL as has_authorization,
                    created_at 
             FROM requisitions 
             ORDER BY id DESC 
             LIMIT 5`
        );
        
        if (requisitions.length === 0) {
            console.warn('⚠️  No requisitions found in database. Create one first.');
        } else {
            console.log(`\n📋 Recent Requisitions (${requisitions.length}):`);
            requisitions.forEach(req => {
                console.log(`\n   Requisition #${req.id}:`);
                console.log(`      Requestor: ${req.requestor_name} (${req.requestor_email})`);
                console.log(`      Department: ${req.department}`);
                console.log(`      Status: ${req.status}`);
                console.log(`      Signatures: Review=${req.has_review ? '✓' : '✗'}, Approval=${req.has_approval ? '✓' : '✗'}, Authorization=${req.has_authorization ? '✓' : '✗'}`);
            });
        }
        
        // Test 4: Send test email to first reviewer
        console.log('\n\n===========================================');
        console.log('TEST 4: Sending test requisition email...');
        console.log('===========================================\n');
        
        if (reviewers.length === 0) {
            console.warn('⚠️  No reviewers to send test email to. Skipping...');
        } else {
            const testRecipient = reviewers[0];
            console.log(`📧 Sending test email to: ${testRecipient.email}`);
            
            const emailData = {
                sender: {
                    email: emailFrom,
                    name: 'SOKAPP System'
                },
                to: [{ email: testRecipient.email }],
                subject: 'Test Email - Requisition System',
                htmlContent: `
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { background-color: #28a745; color: white; padding: 15px; border-radius: 5px; }
                            .content { margin: 20px 0; padding: 20px; background-color: #f9f9f9; }
                            .footer { margin-top: 20px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>✅ Test Email - Requisition System Working!</h2>
                        </div>
                        <div class="content">
                            <p>Hello ${testRecipient.full_name},</p>
                            <p>This is a test email to verify that the requisition email system is working correctly.</p>
                            <p><strong>If you received this email, the system is functional!</strong></p>
                            <p>Sent to: ${testRecipient.email}</p>
                            <p>Time: ${new Date().toLocaleString()}</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated test message from SOKAPP Requisition System.</p>
                        </div>
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
                
                console.log('✅ Test email sent successfully!');
                console.log(`   Message ID: ${response.data.messageId}`);
                console.log(`   Sent to: ${testRecipient.email}`);
                console.log('\n📧 CHECK YOUR EMAIL INBOX (and spam folder)!');
                
            } catch (error) {
                console.error('❌ FAIL: Error sending test email via Brevo');
                if (error.response) {
                    console.error(`   HTTP Status: ${error.response.status}`);
                    console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
                } else {
                    console.error(`   Error: ${error.message}`);
                }
            }
        }
        
        console.log('\n================================================');
        console.log('TEST COMPLETE');
        console.log('================================================\n');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

testRequisitionEmails();
