// Test script to diagnose email issues
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testEmailSetup() {
    console.log('=== TESTING EMAIL SETUP ===\n');
    
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapptest',
    };
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Test 1: Check if requisition_roles table exists
        console.log('TEST 1: Checking if requisition_roles table exists...');
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'requisition_roles'",
            [dbConfig.database]
        );
        
        if (tables.length === 0) {
            console.error('❌ FAIL: requisition_roles table does not exist!');
            console.log('\nFIX: Run this SQL:');
            console.log(`CREATE TABLE requisition_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    role_type ENUM('reviewer', 'approver', 'authorizer', 'finance'),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);`);
            return;
        }
        console.log('✓ PASS: requisition_roles table exists\n');
        
        // Test 2: Check for active reviewers
        console.log('TEST 2: Checking for active reviewers...');
        const [reviewers] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['reviewer', true, true]
        );
        
        if (!reviewers || reviewers.length === 0) {
            console.error('❌ FAIL: No active reviewers found!');
            console.log('\nFIX: Run these SQL queries:');
            
            // First show available users
            const [users] = await connection.execute(
                'SELECT id, email, full_name FROM users WHERE is_active = TRUE'
            );
            
            console.log('\nAvailable active users:');
            users.forEach(u => console.log(`  ID ${u.id}: ${u.email} (${u.full_name})`));
            
            console.log('\nThen run (replace YOUR_USER_ID with your actual ID):');
            console.log("INSERT INTO requisition_roles (user_id, role_type, is_active) VALUES (YOUR_USER_ID, 'reviewer', TRUE);");
            return;
        }
        
        console.log(`✓ PASS: Found ${reviewers.length} active reviewer(s):`);
        reviewers.forEach(r => console.log(`  - ${r.full_name} <${r.email}>`));
        console.log('');
        
        // Test 3: Check Brevo API configuration
        console.log('TEST 3: Checking Brevo API configuration...');
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
        
        console.log('✓ PASS: Brevo API key and sender email configured');
        console.log(`  API Key length: ${apiKey.length}`);
        console.log(`  Sender email: ${emailFrom}\n`);
        
        // Test 4: Test Brevo API directly
        console.log('TEST 4: Testing Brevo API with a test email...');
        const axios = require('axios');
        
        const testEmail = reviewers[0].email; // Send to first reviewer
        
        try {
            const response = await axios.post(
                'https://api.brevo.com/v3/smtp/email',
                {
                    sender: {
                        email: emailFrom,
                        name: 'SOKAPP System'
                    },
                    to: [
                        { email: testEmail }
                    ],
                    subject: 'Test Email from SOKAPP',
                    htmlContent: `
                        <html>
                        <body>
                            <h1>✅ Email Test Successful!</h1>
                            <p>If you're reading this, the email system is working correctly.</p>
                            <p>Sent to: ${testEmail}</p>
                            <p>Time: ${new Date().toLocaleString()}</p>
                        </body>
                        </html>
                    `
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'api-key': apiKey
                    }
                }
            );
            
            console.log('✓ PASS: Test email sent successfully!');
            console.log(`  Message ID: ${response.data.messageId}`);
            console.log(`  Sent to: ${testEmail}`);
            console.log('\n📧 CHECK YOUR EMAIL INBOX (and spam folder)!');
            
        } catch (error) {
            console.error('❌ FAIL: Error sending test email via Brevo');
            if (error.response) {
                console.error(`  HTTP Status: ${error.response.status}`);
                console.error(`  Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.error(`  Error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the test
testEmailSetup().then(() => {
    console.log('\n=== TEST COMPLETE ===\n');
}).catch(err => {
    console.error('Test failed:', err);
});
