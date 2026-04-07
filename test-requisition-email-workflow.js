// Test script to verify requisition email workflow
const mysql = require('mysql2/promise');
const axios = require('axios');

// Database configuration - matching Backend/.env
const dbConfig = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'sokapptest'
};

async function testEmailWorkflow() {
  console.log('🧪 Testing Requisition Email Workflow...\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Test 1: Check if requisition_roles table has approvers
    console.log('=== Test 1: Checking for active approvers ===');
    const [approvers] = await connection.execute(
      'SELECT u.id, u.email, u.full_name FROM requisition_roles rr ' +
      'JOIN users u ON rr.user_id = u.id ' +
      'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
      ['approver', true, true]
    );
    
    console.log(`Found ${approvers.length} active approvers:`);
    approvers.forEach(approver => {
      console.log(`  - ${approver.full_name} (${approver.email})`);
    });
    
    if (approvers.length === 0) {
      console.log('\n⚠️  WARNING: No active approvers found in database!');
      console.log('Please add approvers via: Settings → Requisition Roles');
    }
    
    // Test 2: Check a specific requisition
    console.log('\n=== Test 2: Checking requisition #91 ===');
    const [requisitions] = await connection.execute(
      'SELECT id, requestor_name, status, reviewed_signature, approved_signature, authorized_signature ' +
      'FROM requisitions WHERE id = 91'
    );
    
    if (requisitions.length === 0) {
      console.log('❌ Requisition #91 not found!');
      await connection.end();
      return;
    }
    
    const req = requisitions[0];
    console.log(`Requisition #91:`);
    console.log(`  Requestor: ${req.requestor_name}`);
    console.log(`  Status: ${req.status}`);
    console.log(`  Reviewed Signature: ${req.reviewed_signature ? 'EXISTS ✓' : 'NULL ✗'}`);
    console.log(`  Approved Signature: ${req.approved_signature ? 'EXISTS ✓' : 'NULL ✗'}`);
    console.log(`  Authorized Signature: ${req.authorized_signature ? 'EXISTS ✓' : 'NULL ✗'}`);
    
    // Test 3: Simulate adding a review signature
    console.log('\n=== Test 3: Testing signature update simulation ===');
    console.log('This simulates what happens when you add a review signature...');
    
    // First, clear the review signature to test fresh
    await connection.execute(
      'UPDATE requisitions SET reviewed_signature = NULL WHERE id = 91'
    );
    console.log('✓ Cleared reviewed_signature for testing');
    
    // Verify it was cleared
    const [checkClear] = await connection.execute(
      'SELECT reviewed_signature FROM requisitions WHERE id = 91'
    );
    console.log(`After clear: reviewed_signature = ${checkClear[0].reviewed_signature ? 'EXISTS' : 'NULL'}`);
    
    // Test 4: Check Brevo API connectivity
    console.log('\n=== Test 4: Testing Brevo API ===');
    const brevoApiKey = process.env.BREVO_API_KEY || 'your_brevo_api_key_here';
    
    try {
      const testEmailData = {
        sender: {
          email: 'sahlesokem@gmail.com',
          name: 'SOKAPP System'
        },
        to: [
          { email: 'sahlesokem@gmail.com' }
        ],
        subject: 'Test Email - Requisition Workflow',
        htmlContent: '<html><body><h1>Test Email</h1><p>This is a test from the requisition system.</p></body></html>'
      };
      
      console.log('Attempting to send test email via Brevo...');
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        testEmailData,
        {
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Brevo API test successful!');
      console.log('Message ID:', response.data.messageId);
    } catch (error) {
      console.error('❌ Brevo API test failed!');
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Brevo API Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✓ Approvers configured: ${approvers.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✓ Requisition #91 exists: YES`);
    console.log(`✓ Database connection: OK`);
    console.log(`✓ Brevo API test: See above`);
    
    console.log('\nNext Steps:');
    console.log('1. Go to http://localhost:3000/requisitions/91');
    console.log('2. Click "Edit" button');
    console.log('3. Add a review signature (if you are a reviewer)');
    console.log('4. Click "Update Requisition"');
    console.log('5. Watch the backend console for email workflow logs');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEmailWorkflow();
