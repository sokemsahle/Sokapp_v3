// Test the actual reviewer signature endpoint to debug email notification
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest'
};

async function testReviewerSignature() {
    let connection;
    
    try {
        console.log('=== Testing Reviewer Signature & Email Notification ===\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        
        // Step 1: Find a pending requisition without reviewer signature
        console.log('📋 Step 1: Finding a test requisition...');
        const [requisitions] = await connection.execute(
            `SELECT id, requestor_name, department, purpose, status, 
                    reviewed_signature, approved_signature 
             FROM requisitions 
             WHERE status = 'pending' AND reviewed_signature IS NULL 
             ORDER BY id DESC LIMIT 1`
        );
        
        if (requisitions.length === 0) {
            console.log('❌ No pending requisitions found without reviewer signature!');
            console.log('\n💡 Solution: Create a new requisition first');
            return;
        }
        
        const req = requisitions[0];
        console.log(`✓ Found requisition #${req.id}`);
        console.log(`  Requestor: ${req.requestor_name}`);
        console.log(`  Department: ${req.department}`);
        console.log(`  Status: ${req.status}\n`);
        
        // Step 2: Check approvers
        console.log('📋 Step 2: Checking active approvers...');
        const [approvers] = await connection.execute(
            `SELECT u.email, u.full_name 
             FROM requisition_roles rr 
             JOIN users u ON rr.user_id = u.id 
             WHERE rr.role_type = 'approver' AND rr.is_active = TRUE AND u.is_active = TRUE`
        );
        
        console.log(`Found ${approvers.length} active approver(s):`);
        approvers.forEach((a, i) => {
            console.log(`  ${i + 1}. ${a.full_name} (${a.email})`);
        });
        
        if (approvers.length === 0) {
            console.log('\n❌ NO ACTIVE APPROVERS - Email test will fail!\n');
            return;
        }
        console.log('');
        
        // Step 3: Simulate reviewer signature
        console.log('📋 Step 3: Sending reviewer signature to backend...\n');
        
        const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testReviewerName = 'Test Reviewer';
        
        const payload = {
            reviewedSignature: testSignature,
            reviewedBy: testReviewerName
            // NOT sending other fields to test preservation
        };
        
        console.log('Payload being sent:');
        console.log(JSON.stringify(payload, null, 2));
        console.log('');
        
        try {
            const response = await axios.put(
                `http://localhost:5000/api/requisition/${req.id}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            
            console.log('✅ Backend Response:');
            console.log(`Status: ${response.status}`);
            console.log(`Data: ${JSON.stringify(response.data.success ? 'SUCCESS' : 'FAILED')}\n`);
            
            // Step 4: Verify signature was saved
            console.log('📋 Step 4: Verifying signature was saved...');
            const [updated] = await connection.execute(
                'SELECT reviewed_signature, reviewed_by, requestor_name, department FROM requisitions WHERE id = ?',
                [req.id]
            );
            
            const updatedReq = updated[0];
            console.log(`Reviewed signature: ${updatedReq.reviewed_signature ? '✓ SAVED' : '❌ NOT SAVED'}`);
            console.log(`Reviewed by: ${updatedReq.reviewed_by || 'NOT SET'}`);
            console.log(`Requestor name preserved: ${updatedReq.requestor_name || '❌ LOST'}`);
            console.log(`Department preserved: ${updatedReq.department || '❌ LOST'}`);
            console.log('');
            
            // Step 5: Check email logs
            console.log('📋 Step 5: Check Backend Console Output');
            console.log('Look for these messages in the backend server log:\n');
            console.log('  ✓ "DEBUG: Will trigger approver notification? true"');
            console.log('  ✓ "STAGE 1: NEW reviewer signature detected"');
            console.log('  ✓ "Fetching active approvers from database..."');
            console.log('  ✓ "Found X active approvers"');
            console.log('  ✓ "Approval notification sent successfully"\n');
            
            console.log('If you DON\'T see these messages, the issue is in the detection logic.');
            console.log('If you DO see them but no email received, check Brevo/spam folder.\n');
            
        } catch (error) {
            console.log('❌ Error calling backend API:');
            if (error.response) {
                console.log(`HTTP ${error.response.status}: ${error.response.statusText}`);
                console.log('Response:', JSON.stringify(error.response.data, null, 2));
            } else if (error.code) {
                console.log(`Network Error: ${error.code}`);
                console.log(error.message);
            } else {
                console.log(error.message);
            }
            console.log('');
        }
        
        console.log('=== Test Complete ===\n');
        console.log('NEXT STEPS:');
        console.log('1. Check backend console for email sending logs');
        console.log('2. Check approver email inbox (and spam folder)');
        console.log('3. If no logs appear, backend code may not be updated');
        console.log('4. Run diagnostic: node test-approver-email-diagnostic.js ' + req.id + '\n');
        
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
testReviewerSignature();
