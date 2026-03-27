// Test script to diagnose why approvers aren't receiving emails
const mysql = require('mysql2/promise');

require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest'
};

async function testApproverEmail() {
    let connection;
    
    try {
        console.log('=== Testing Approver Email Notification ===\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to database\n');
        
        // Check 1: Find all active approvers
        console.log('📋 Checking for active approvers in requisition_roles...');
        const [approvers] = await connection.execute(
            'SELECT u.id, u.email, u.full_name, u.is_active, rr.role_type, rr.is_active as role_is_active ' +
            'FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['approver', true, true]
        );
        
        console.log(`Found ${approvers.length} active approver(s):\n`);
        
        if (approvers.length === 0) {
            console.log('❌ NO ACTIVE APPROVERS FOUND!\n');
            console.log('Possible reasons:');
            console.log('  1. No users have been assigned the "approver" role');
            console.log('  2. The requisition_roles record has is_active = FALSE');
            console.log('  3. The user account has is_active = FALSE\n');
            
            // Check if there are ANY approver roles (even inactive)
            console.log('Checking for ANY approver roles (including inactive)...');
            const [allApprovers] = await connection.execute(
                'SELECT u.email, u.full_name, rr.is_active as role_active, u.is_active as user_active ' +
                'FROM requisition_roles rr ' +
                'JOIN users u ON rr.user_id = u.id ' +
                'WHERE rr.role_type = ?',
                ['approver']
            );
            
            if (allApprovers.length > 0) {
                console.log(`Found ${allApprovers.length} total approver role(s):`);
                allApprovers.forEach((a, i) => {
                    console.log(`  ${i + 1}. ${a.full_name} (${a.email}) - Role Active: ${a.role_active}, User Active: ${a.user_active}`);
                });
                
                console.log('\n💡 Solution: Activate the approver role(s) by running:');
                console.log('   UPDATE requisition_roles SET is_active = TRUE WHERE role_type = \'approver\';\n');
            } else {
                console.log('No approver roles exist at all.\n');
                console.log('💡 Solution: Add an approver role by running:');
                console.log('   INSERT INTO requisition_roles (user_id, role_type, is_active)');
                console.log('   SELECT id, \'approver\', TRUE FROM users WHERE email = \'your-email@example.com\';\n');
            }
            return;
        }
        
        approvers.forEach((a, i) => {
            console.log(`  ${i + 1}. ${a.full_name} (${a.email})`);
        });
        console.log('');
        
        // Check 2: Verify Brevo API key
        console.log('🔑 Checking Brevo API configuration...');
        const apiKey = process.env.BREVO_API_KEY;
        
        if (!apiKey) {
            console.log('❌ BREVO_API_KEY not found in .env file!\n');
            console.log('💡 Solution: Add BREVO_API_KEY=your-api-key to Backend/.env\n');
            return;
        }
        
        console.log(`✓ Brevo API key found (length: ${apiKey.length})`);
        console.log(`  Key starts with: ${apiKey.substring(0, 15)}...\n`);
        
        // Check 3: Test sending email
        console.log('📧 Testing email send to each approver...\n');
        
        for (const approver of approvers) {
            console.log(`Testing email to: ${approver.email} (${approver.full_name})`);
            
            const emailData = {
                sender: {
                    email: process.env.EMAIL_FROM || 'noreply@yoursite.com',
                    name: 'SOKAPP System'
                },
                to: [{ email: approver.email }],
                subject: 'Test: Approver Email Notification',
                htmlContent: `
                    <html>
                    <body>
                        <h2>Test Email</h2>
                        <p>Hello ${approver.full_name || 'Approver'},</p>
                        <p>This is a test email to verify that approver notifications are working.</p>
                        <p>If you receive this, the email system is functioning correctly!</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    </body>
                    </html>
                `
            };
            
            try {
                const axios = require('axios');
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
                
                console.log(`  ✓ Email sent successfully! Message ID: ${response.data.messageId}\n`);
            } catch (error) {
                console.log(`  ❌ Failed to send email:`);
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
            }
        }
        
        console.log('=== Test Complete ===\n');
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
        if (error.code) {
            console.error('Error Code:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the test
testApproverEmail();
