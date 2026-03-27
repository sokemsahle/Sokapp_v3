// Test script to verify requisition email workflow
const mysql = require('mysql2/promise');

// Database configuration - matching Backend/.env
const dbConfig = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '', // Empty password as per .env
  database: 'sokapptest'
};

async function testEmailWorkflow() {
  console.log('🧪 Testing Requisition Email Workflow...\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Test 1: Check if requisition_roles table has finance users
    console.log('Test 1: Checking for finance team members...');
    const [finance] = await connection.execute(
      'SELECT u.email, u.full_name FROM requisition_roles rr ' +
      'JOIN users u ON rr.user_id = u.id ' +
      'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
      ['finance', true, true]
    );
    
    console.log(`Found ${finance.length} finance team member(s):`);
    finance.forEach(f => console.log(`  - ${f.full_name} (${f.email})`));
    
    if (finance.length === 0) {
      console.log('⚠️  WARNING: No finance team members found!');
      console.log('   Run this SQL to add a finance user:\n');
      console.log('   INSERT INTO requisition_roles (user_id, role_type, is_active)');
      console.log('   VALUES (1, "finance", TRUE);  -- Replace 1 with actual user ID\n');
    }
    
    // Test 2: Check approvers
    console.log('\nTest 2: Checking for approvers...');
    const [approvers] = await connection.execute(
      'SELECT u.email, u.full_name FROM requisition_roles rr ' +
      'JOIN users u ON rr.user_id = u.id ' +
      'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
      ['approver', true, true]
    );
    
    console.log(`Found ${approvers.length} approver(s):`);
    approvers.forEach(a => console.log(`  - ${a.full_name} (${a.email})`));
    
    // Test 3: Check authorizers
    console.log('\nTest 3: Checking for authorizers...');
    const [authorizers] = await connection.execute(
      'SELECT u.email, u.full_name FROM requisition_roles rr ' +
      'JOIN users u ON rr.user_id = u.id ' +
      'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
      ['authorizer', true, true]
    );
    
    console.log(`Found ${authorizers.length} authorizer(s):`);
    authorizers.forEach(a => console.log(`  - ${a.full_name} (${a.email})`));
    
    // Test 4: Check a sample requisition
    console.log('\nTest 4: Checking recent requisitions...');
    const [requisitions] = await connection.execute(
      'SELECT id, requestor_name, requestor_email, department, status, ' +
      'reviewed_signature IS NOT NULL as has_review, ' +
      'approved_signature IS NOT NULL as has_approval, ' +
      'authorized_signature IS NOT NULL as has_authorization, ' +
      'created_at ' +
      'FROM requisitions ORDER BY id DESC LIMIT 5'
    );
    
    if (requisitions.length === 0) {
      console.log('No requisitions found. Create one first.');
    } else {
      requisitions.forEach(req => {
        console.log(`\n  Requisition #${req.id}:`);
        console.log(`    Requestor: ${req.requestor_name} (${req.requestor_email})`);
        console.log(`    Department: ${req.department}`);
        console.log(`    Status: ${req.status}`);
        console.log(`    Signatures: Review=${req.has_review ? '✓' : '✗'}, ` +
                    `Approval=${req.has_approval ? '✓' : '✗'}, ` +
                    `Authorization=${req.has_authorization ? '✓' : '✗'}`);
        console.log(`    Created: ${req.created_at}`);
      });
    }
    
    // Test 5: Check Brevo configuration
    console.log('\nTest 5: Checking environment variables...');
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const brevoKey = envContent.match(/BREVO_API_KEY=(.*)/);
      const brevoEmail = envContent.match(/BREVO_SENDER_EMAIL=(.*)/);
      
      if (brevoKey && brevoKey[1]) {
        console.log(`✓ BREVO_API_KEY: ${brevoKey[1].substring(0, 10)}...`);
      } else {
        console.log('✗ BREVO_API_KEY not found in .env');
      }
      
      if (brevoEmail && brevoEmail[1]) {
        console.log(`✓ BREVO_SENDER_EMAIL: ${brevoEmail[1]}`);
      } else {
        console.log('✗ BREVO_SENDER_EMAIL not found in .env');
      }
    } else {
      console.log('✗ .env file not found');
    }
    
    await connection.end();
    
    console.log('\n✅ Test complete!\n');
    console.log('Next steps:');
    console.log('1. Ensure at least 1 finance user exists');
    console.log('2. Ensure at least 1 approver exists');
    console.log('3. Ensure at least 1 authorizer exists');
    console.log('4. Create a test requisition');
    console.log('5. Add signatures and watch backend console for email workflow logs');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEmailWorkflow();
