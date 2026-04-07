// Debug script to check requisition #105
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Update with your password if needed
  database: 'sokapp_db'
};

async function debugRequisition() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('=== DEBUGGING REQUISITION #105 ===\n');
    
    // Fetch requisition #105
    const [rows] = await connection.execute(
      'SELECT id, requestor_name, requestor_email, department, purpose, status FROM requisitions WHERE id = 105'
    );
    
    if (rows.length === 0) {
      console.log('❌ Requisition #105 NOT FOUND in database');
      return;
    }
    
    const req = rows[0];
    console.log('✅ Requisition #105 found:');
    console.log(`   Requestor Name: ${req.requestor_name}`);
    console.log(`   Requestor Email: ${req.requestor_email}`);
    console.log(`   Department: ${req.department}`);
    console.log(`   Purpose: ${req.purpose}`);
    console.log(`   Status: ${req.status}\n`);
    
    // Test email comparison
    const testEmail = 'sahlesokem@gmail.com';
    console.log('=== EMAIL COMPARISON TEST ===');
    console.log(`   Email from frontend: ${testEmail}`);
    console.log(`   Email from database: ${req.requestor_email}`);
    console.log(`   Are they equal? ${testEmail === req.requestor_email}`);
    console.log(`   Frontend email length: ${testEmail.length}`);
    console.log(`   Database email length: ${req.requestor_email ? req.requestor_email.length : 'N/A'}`);
    
    // Check for hidden characters or case differences
    if (testEmail !== req.requestor_email) {
      console.log('\n⚠️  EMAILS DO NOT MATCH! Possible reasons:');
      console.log('   1. Different email addresses entirely');
      console.log('   2. Case sensitivity (though emails should be lowercase)');
      console.log('   3. Hidden whitespace characters');
      console.log('   4. Typo in one of the emails');
      
      // Character-by-character comparison
      const dbEmail = req.requestor_email || '';
      console.log('\n   Character-by-character breakdown:');
      for (let i = 0; i < Math.max(testEmail.length, dbEmail.length); i++) {
        const char1 = testEmail[i];
        const char2 = dbEmail[i];
        const match = char1 === char2 ? '✓' : '✗';
        console.log(`   [${i}]: '${char1}' (code: ${char1?.charCodeAt(0)}) vs '${char2}' (code: ${char2?.charCodeAt(0)}) ${match}`);
      }
    } else {
      console.log('\n✅ Emails match - should have access!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

debugRequisition();
