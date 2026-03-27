// Test requisition email sending
const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

async function testRequisitionEmail() {
    console.log('=== TESTING REQUISITION EMAIL SENDING ===\n');
    
    // Database config
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapptest'
    };
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Step 1: Check if requisition_roles table has active reviewers
        console.log('STEP 1: Checking for active reviewers...');
        const [reviewers] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['reviewer', true, true]
        );
        
        console.log(`Found ${reviewers.length} active reviewer(s):`);
        if (reviewers.length === 0) {
            console.warn('⚠️  NO ACTIVE REVIEWERS FOUND!');
            console.warn('This is likely why emails are not being sent.');
            console.warn('\nTo fix this, you need to:');
            console.warn('1. Go to User Control page');
            console.warn('2. Edit a user (e.g., Admin)');
            console.warn('3. Scroll to "Requisition Roles"');
            console.warn('4. Check "Reviewer" role and set "Is Active" to Yes');
            console.warn('5. Save the user');
        } else {
            reviewers.forEach((r, i) => {
                console.log(`  ${i+1}. ${r.full_name} (${r.email})`);
            });
        }
        
        // Step 2: Check Brevo API key
        console.log('\nSTEP 2: Checking Brevo API configuration...');
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            console.error('❌ BREVO_API_KEY not found in .env file');
            return;
        }
        console.log('✓ Brevo API key found');
        
        // Step 3: Send test email to first reviewer (if exists)
        if (reviewers.length > 0) {
            console.log('\nSTEP 3: Sending test requisition email...');
            const testReviewer = reviewers[0];
            
            const htmlContent = `
                <html>
                <head><style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
                    .content { margin: 20px 0; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                    .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                </style></head>
                <body>
                    <div class="header">
                        <h2>🧪 TEST - New Requisition Created</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${testReviewer.full_name || 'Reviewer'},</p>
                        <p>This is a TEST email to verify the requisition notification system.</p>
                        <p><strong>Test Requisition ID:</strong> #999</p>
                        <p><strong>Requestor:</strong> Test User</p>
                        <p><strong>Department:</strong> IT</p>
                        <p><strong>Purpose:</strong> Testing email notifications</p>
                        <p>Please click the button below to review this requisition:</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/requisitions/999" class="button">Review Requisition</a>
                    </div>
                    <div class="footer">
                        <p>This is a test notification from SOKAPP Requisition System.</p>
                    </div>
                </body>
                </html>
            `;
            
            const emailData = {
                sender: {
                    email: process.env.EMAIL_FROM || 'noreply@sokapp.online',
                    name: 'SOKAPP System'
                },
                to: [{ email: testReviewer.email }],
                subject: `🧪 TEST - New Requisition Requires Review - #999`,
                htmlContent: htmlContent
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
                        timeout: 15000
                    }
                );
                
                console.log('✅ Test email sent successfully!');
                console.log(`Message ID: ${response.data.messageId}`);
                console.log(`\n📧 CHECK INBOX: ${testReviewer.email}`);
                console.log('(Also check spam/junk folder)\n');
                
            } catch (error) {
                console.error('❌ Failed to send test email');
                if (error.response) {
                    console.error('HTTP Status:', error.response.status);
                    console.error('Brevo Error:', error.response.data?.message);
                } else {
                    console.error('Error:', error.message);
                }
            }
        }
        
        // Step 4: Check recent requisitions
        console.log('\nSTEP 4: Checking recent requisitions...');
        const [requisitions] = await connection.execute(
            'SELECT id, requestor_name, requestor_email, department, status, created_at FROM requisitions ORDER BY created_at DESC LIMIT 5'
        );
        
        if (requisitions.length === 0) {
            console.log('No requisitions found in database');
        } else {
            console.log(`Found ${requisitions.length} recent requisition(s):`);
            requisitions.forEach(r => {
                console.log(`  - ID: ${r.id}, Requestor: ${r.requestor_name} (${r.requestor_email}), Status: ${r.status}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
        console.log('\n=== TEST COMPLETE ===\n');
    }
}

testRequisitionEmail().catch(console.error);
