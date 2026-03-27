// Test script to check if employee update endpoint is working
const axios = require('axios');

const TEST_EMPLOYEE_ID = 1; // Change this to a valid employee ID from your database
const API_URL = 'http://localhost:5000';

async function testEmployeeUpdate() {
  try {
    console.log('Testing employee update endpoint...');
    console.log(`PUT ${API_URL}/api/employees/${TEST_EMPLOYEE_ID}`);
    
    const testData = {
      fullName: 'Test Employee Update',
      email: 'test@example.com',
      phone: '1234567890',
      department: 'IT',
      position: 'Developer',
      is_active: true
    };
    
    console.log('Sending request with data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.put(
      `${API_URL}/api/employees/${TEST_EMPLOYEE_ID}`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR!');
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    console.error('Data type received:', error.response?.headers?.['content-type']);
    
    if (error.response?.data) {
      const responseData = error.response.data;
      console.error('Response data (first 500 chars):', responseData.toString().substring(0, 500));
      
      // Check if it's HTML
      if (responseData.toString().trim().startsWith('<!DOCTYPE') || 
          responseData.toString().trim().startsWith('<html')) {
        console.error('\n⚠️  Server returned HTML instead of JSON!');
        console.error('This means the catch-all route intercepted the request.');
      }
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testEmployeeUpdate();
