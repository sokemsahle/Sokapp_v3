// Test script to verify requisition visibility by email
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Update with your password
  database: 'sokapp_db' // Update with your database name
};

async function testRequisitionVisibility() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('=== Testing Requisition Visibility ===\n');
    
    // Get all distinct emails from requisitions
    const [emails] = await connection.execute(
      'SELECT DISTINCT requestor_email FROM requisitions WHERE requestor_email IS NOT NULL AND requestor_email != ""'
    );
    
    console.log(`Found ${emails.length} unique emails with requisitions\n`);
    
    // For each email, test the /api/requisitions/my endpoint
    for (const row of emails) {
      const email = row.requestor_email;
      console.log(`\n--- Testing email: ${email} ---`);
      
      // Simulate the API call
      const response = await fetch(`http://localhost:5000/api/requisitions/my?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`✓ Found ${result.requisitions.length} requisitions for ${email}`);
        
        // Verify all returned requisitions belong to this email
        const mismatched = result.requisitions.filter(r => r.requestor_email !== email);
        if (mismatched.length > 0) {
          console.error(`❌ ERROR: Found ${mismatched.length} requisitions that don't belong to ${email}!`);
          mismatched.forEach(r => {
            console.error(`  - ID ${r.id}: belongs to ${r.requestor_email}`);
          });
        } else {
          console.log(`✓ All requisitions correctly belong to ${email}`);
        }
        
        // Show sample
        if (result.requisitions.length > 0) {
          const sample = result.requisitions[0];
          console.log(`  Sample: ID=${sample.id}, Purpose=${sample.purpose}, Status=${sample.status}`);
        }
      } else {
        console.error(`❌ API Error: ${result.message}`);
      }
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

testRequisitionVisibility();
