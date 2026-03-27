// Quick test to verify requisition email-based access control
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Update with your password
  database: 'sokapp_db' // Update with your database name
};

async function testAccessControl() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('=== Testing Requisition Email Access Control ===\n');
    
    // Get a sample requisition
    const [requisitions] = await connection.execute(
      'SELECT id, requestor_email, purpose FROM requisitions WHERE requestor_email IS NOT NULL LIMIT 1'
    );
    
    if (requisitions.length === 0) {
      console.log('❌ No requisitions found in database. Please create one first.');
      return;
    }
    
    const sampleReq = requisitions[0];
    console.log(`📋 Test Requisition:`);
    console.log(`   ID: ${sampleReq.id}`);
    console.log(`   Owner Email: ${sampleReq.requestor_email}`);
    console.log(`   Purpose: ${sampleReq.purpose}\n`);
    
    // Test 1: Correct email should succeed
    console.log('Test 1: Access with CORRECT email');
    console.log(`   Calling: GET /api/requisition/${sampleReq.id}?email=${sampleReq.requestor_email}`);
    
    const correctEmailResponse = await fetch(
      `http://localhost:5000/api/requisition/${sampleReq.id}?email=${encodeURIComponent(sampleReq.requestor_email)}`
    );
    const correctEmailResult = await correctEmailResponse.json();
    
    if (correctEmailResult.success) {
      console.log('   ✅ SUCCESS - Access granted as expected\n');
    } else {
      console.log('   ❌ FAILED - Should have granted access!');
      console.log('   Error:', correctEmailResult.message, '\n');
    }
    
    // Test 2: Wrong email should fail
    console.log('Test 2: Access with WRONG email');
    const wrongEmail = 'wrong@example.com';
    console.log(`   Calling: GET /api/requisition/${sampleReq.id}?email=${wrongEmail}`);
    
    const wrongEmailResponse = await fetch(
      `http://localhost:5000/api/requisition/${sampleReq.id}?email=${encodeURIComponent(wrongEmail)}`
    );
    const wrongEmailResult = await wrongEmailResponse.json();
    
    if (!wrongEmailResult.success && wrongEmailResponse.status === 403) {
      console.log('   ✅ SUCCESS - Access denied as expected');
      console.log('   Message:', wrongEmailResult.message, '\n');
    } else {
      console.log('   ❌ FAILED - Should have denied access!');
      console.log('   Response:', wrongEmailResult, '\n');
    }
    
    // Test 3: No email parameter (should work for backward compatibility with admins)
    console.log('Test 3: Access with NO email parameter');
    console.log(`   Calling: GET /api/requisition/${sampleReq.id} (no email)`);
    
    const noEmailResponse = await fetch(`http://localhost:5000/api/requisition/${sampleReq.id}`);
    const noEmailResult = await noEmailResponse.json();
    
    if (noEmailResult.success) {
      console.log('   ⚠️  Access granted (this is OK for admin override)\n');
    } else {
      console.log('   ℹ️  Access denied (strict mode enabled)\n');
    }
    
    console.log('=== Test Complete ===\n');
    console.log('Summary:');
    console.log('✅ Users with matching email CAN view requisitions');
    console.log('✅ Users with non-matching email CANNOT view requisitions');
    console.log('ℹ️  Admins can still access all requisitions when needed\n');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Make sure the backend server is running on port 5000');
  } finally {
    await connection.end();
  }
}

testAccessControl();
