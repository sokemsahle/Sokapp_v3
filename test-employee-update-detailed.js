// More detailed test to see what's happening with the employee update endpoint
const axios = require('axios');

const TEST_EMPLOYEE_ID = 1; // Change this to a valid employee ID
const API_URL = 'http://localhost:5000';

async function testEmployeeUpdateDetailed() {
  console.log('=== DETAILED EMPLOYEE UPDATE TEST ===\n');
  
  try {
    // First, try to GET the employee to see if they exist
    console.log('1. Testing GET employee first...');
    const getResponse = await axios.get(`${API_URL}/api/employees/${TEST_EMPLOYEE_ID}`);
    console.log('   ✅ GET succeeded');
    console.log('   Employee:', getResponse.data.employee?.full_name || 'N/A');
    
    // Now try PUT
    console.log('\n2. Testing PUT update...');
    const testData = {
      fullName: 'Test Update ' + new Date().toISOString(),
      email: 'test@example.com',
      phone: '1234567890',
      department: 'IT',
      position: 'Developer',
      is_active: true
    };
    
    console.log('   Sending PUT request...');
    const putResponse = await axios.put(
      `${API_URL}/api/employees/${TEST_EMPLOYEE_ID}`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Don't throw on any status code
      }
    );
    
    console.log('   Response Status:', putResponse.status);
    console.log('   Response Headers:', putResponse.headers);
    console.log('   Content-Type:', putResponse.headers['content-type']);
    
    // Check if response is HTML or JSON
    const responseData = putResponse.data;
    if (typeof responseData === 'string') {
      console.log('   ❌ Response is STRING (likely HTML)');
      console.log('   First 300 chars:', responseData.substring(0, 300));
      
      if (responseData.trim().startsWith('<!DOCTYPE') || responseData.trim().startsWith('<html')) {
        console.log('   ⚠️  CONFIRMED: Server returned React index.html!');
        console.log('   This means the catch-all route intercepted the request.');
      }
    } else if (typeof responseData === 'object') {
      console.log('   ✅ Response is JSON');
      console.log('   Response:', JSON.stringify(responseData, null, 2));
    }
    
  } catch (error) {
    console.error('   ❌ ERROR occurred:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Headers:', error.response?.headers);
    
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        console.error('   Response (first 300 chars):', data.substring(0, 300));
        if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
          console.error('   ⚠️  Server returned HTML!');
        }
      } else {
        console.error('   Response:', JSON.stringify(data, null, 2));
      }
    }
  }
}

testEmployeeUpdateDetailed();
