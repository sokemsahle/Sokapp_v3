/**
 * Debug Requisition Email Workflow
 * Simulates the exact workflow that happens when a signature is added
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');

async function debugWorkflow() {
    console.log('🔍 Debugging Requisition Email Workflow\n');
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
        // Pick a requisition that has all signatures (like #97 or #96)
        const testRequisitionId = 97;
        
        console.log(`📋 Testing with Requisition #${testRequisitionId}\n`);
        
        const [rows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [testRequisitionId]
        );
        
        if (rows.length === 0) {
            console.error('❌ Requisition not found!');
            await connection.end();
            return;
        }
        
        const req = rows[0];
        
        console.log('Requisition Details:');
        console.log(`   ID: ${req.id}`);
        console.log(`   Requestor: ${req.requestor_name} (${req.requestor_email})`);
        console.log(`   Department: ${req.department}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Reviewed Signature: ${req.reviewed_signature ? 'EXISTS' : 'NULL'}`);
        console.log(`   Approved Signature: ${req.approved_signature ? 'EXISTS' : 'NULL'}`);
        console.log(`   Authorized Signature: ${req.authorized_signature ? 'EXISTS' : 'NULL'}`);
        console.log(`   Grand Total: ${req.grand_total} Birr`);
        console.log('');
        
        // Test sending email to requestor (Stage 3 of workflow)
        console.log('📧 TEST 1: Sending email to REQUESTOR (as if authorization just happened)...');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        const requesterHtmlContent = `
            <html>
            <head><style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background-color: #28a745; color: white; padding: 10px; border-radius: 5px; }
                .content { margin: 20px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
                .button { background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                .success-badge { background-color: #28a745; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            </style></head>
            <body>
                <div class="header">
                    <h2>✓ Your Requisition Has Been Authorized!</h2>
                </div>
                <div class="content">
                    <p>Hello ${req.requestor_name || 'Requestor'},</p>
                    <p>Great news! Your requisition has been fully approved and all required signatures have been obtained.</p>
                    <span class="success-badge">AUTHORIZED</span>
                    <p><strong>Requisition ID:</strong> #${req.id}</p>
                    <p><strong>Department:</strong> ${req.department || 'N/A'}</p>
                    <p><strong>Purpose:</strong> ${req.purpose || 'N/A'}</p>
                    <p><strong>Total Amount:</strong> ${req.grand_total || '0.00'} Birr</p>
                    <p>The finance team has been notified and will proceed with payment processing.</p>
                    <a href="${frontendUrl}/requisitions/${req.id}" class="button">View Your Requisition</a>
                </div>
                <div class="footer">
                    <p>This is an automated notification from SOKAPP Requisition System.</p>
                    <p>Congratulations on your authorized requisition!</p>
                </div>
            </body>
            </html>
        `;
        
        const apiKey = process.env.BREVO_API_KEY;
        const emailFrom = process.env.EMAIL_FROM;
        
        const emailData = {
            sender: {
                email: emailFrom,
                name: 'SOKAPP System'
            },
            to: [{ email: req.requestor_email }],
            subject: `✓ Your Requisition Has Been Authorized - #${req.id}`,
            htmlContent: requesterHtmlContent
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
            
            console.log('✅ Email sent successfully to requestor!');
            console.log(`   Message ID: ${response.data.messageId}`);
            console.log(`   Sent to: ${req.requestor_email}`);
            
        } catch (error) {
            console.error('❌ Failed to send email to requestor');
            if (error.response) {
                console.error(`   HTTP Status: ${error.response.status}`);
                console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.error(`   Error: ${error.message}`);
            }
        }
        
        console.log('');
        
        // Test sending email to finance team
        console.log('📧 TEST 2: Sending email to FINANCE TEAM...');
        
        const [finance] = await connection.execute(
            'SELECT u.email, u.full_name FROM requisition_roles rr ' +
            'JOIN users u ON rr.user_id = u.id ' +
            'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
            ['finance', true, true]
        );
        
        console.log(`Found ${finance.length} finance member(s)`);
        
        for (const financeMember of finance) {
            const financeHtmlContent = `
                <html>
                <head><style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #007bff; color: white; padding: 10px; border-radius: 5px; }
                    .content { margin: 20px 0; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                    .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                    .priority-badge { background-color: #dc3545; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                </style></head>
                <body>
                    <div class="header">
                        <h2>🏦 Payment Processing Required - Requisition Authorized</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${financeMember.full_name || 'Finance Team Member'},</p>
                        <p>A requisition has been fully approved and requires immediate payment processing:</p>
                        <span class="priority-badge">ACTION REQUIRED</span>
                        <p><strong>Requisition ID:</strong> #${req.id}</p>
                        <p><strong>Requestor:</strong> ${req.requestor_name || 'N/A'}</p>
                        <p><strong>Requestor Email:</strong> ${req.requestor_email || 'N/A'}</p>
                        <p><strong>Department:</strong> ${req.department || 'N/A'}</p>
                        <p><strong>Purpose:</strong> ${req.purpose || 'N/A'}</p>
                        <p><strong>Total Amount:</strong> ${req.grand_total || '0.00'} Birr</p>
                        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">AUTHORIZED</span></p>
                        <p>All required signatures have been obtained. Please proceed with payment processing and coordinate with the requestor.</p>
                        <a href="${frontendUrl}/requisitions/${req.id}" class="button">View Requisition Details</a>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from SOKAPP Requisition System.</p>
                        <p>Please process this payment at your earliest convenience.</p>
                    </div>
                </body>
                </html>
            `;
            
            const financeEmailData = {
                sender: {
                    email: emailFrom,
                    name: 'SOKAPP System'
                },
                to: [{ email: financeMember.email }],
                subject: `🏦 Payment Processing Required - Requisition #${req.id} Approved`,
                htmlContent: financeHtmlContent
            };
            
            try {
                const response = await axios.post(
                    'https://api.brevo.com/v3/smtp/email',
                    financeEmailData,
                    {
                        headers: {
                            'accept': 'application/json',
                            'content-type': 'application/json',
                            'api-key': apiKey
                        },
                        timeout: 10000
                    }
                );
                
                console.log(`✅ Email sent successfully to finance: ${financeMember.email}`);
                console.log(`   Message ID: ${response.data.messageId}`);
                
            } catch (error) {
                console.error(`❌ Failed to send email to finance: ${financeMember.email}`);
                if (error.response) {
                    console.error(`   HTTP Status: ${error.response.status}`);
                    console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
                } else {
                    console.error(`   Error: ${error.message}`);
                }
            }
        }
        
        console.log('\n================================================');
        console.log('WORKFLOW SIMULATION COMPLETE');
        console.log('================================================\n');
        
        console.log('💡 ANALYSIS:');
        console.log('If emails were sent successfully above, then the Brevo API and configuration are working.');
        console.log('If emails are NOT being sent during actual signature workflow, check:');
        console.log('1. Server logs when signing a requisition');
        console.log('2. Look for "STAGE 3: NEW authorization signature detected" message');
        console.log('3. Check if isNewAuthorization is being set correctly');
        console.log('4. Verify sendEmailNotification function is being called');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

debugWorkflow();
