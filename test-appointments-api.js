// Test Appointments API Endpoint
const fetch = require('node-fetch');

async function testAppointmentsAPI() {
  console.log('Testing Appointments API...\n');
  
  try {
    // Test 1: Get all appointments
    console.log('Test 1: GET /api/appointments/all');
    const response1 = await fetch('http://localhost:5000/api/appointments/all');
    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (result1.success) {
      console.log(`✅ Success! Found ${result1.data.length} appointments\n`);
    } else {
      console.log('❌ Failed:', result1.message, '\n');
    }
    
    // Test 2: Get appointments by range (current month)
    console.log('Test 2: GET /api/appointments/range (current month)');
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const response2 = await fetch(`http://localhost:5000/api/appointments/range?startDate=${startDate}&endDate=${endDate}`);
    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (result2.success) {
      console.log(`✅ Success! Found ${result2.data.length} appointments in current month\n`);
    } else {
      console.log('❌ Failed:', result2.message, '\n');
    }
    
    // Test 3: Get users list
    console.log('Test 3: GET /api/users/list');
    const response3 = await fetch('http://localhost:5000/api/users/list');
    const result3 = await response3.json();
    console.log('Response:', JSON.stringify(result3, null, 2));
    
    if (result3.success) {
      console.log(`✅ Success! Found ${result3.data.length} users\n`);
      console.log('Users:', result3.data.map(u => `${u.first_name} ${u.last_name} (${u.email})`).join(', '));
    } else {
      console.log('❌ Failed:', result3.message, '\n');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAppointmentsAPI();
