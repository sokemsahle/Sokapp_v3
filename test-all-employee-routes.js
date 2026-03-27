// Test script to verify all employee API endpoints are working
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testEmployeeEndpoints() {
  console.log('=== TESTING EMPLOYEE API ENDPOINTS ===\n');
  
  try {
    // Test 1: GET all employees
    console.log('1. Testing GET /api/employees');
    const allResponse = await axios.get(`${API_URL}/api/employees`);
    console.log('   ✅ SUCCESS - Found', allResponse.data.employees.length, 'employees\n');
    
    // Test 2: GET employee by ID
    if (allResponse.data.employees.length > 0) {
      const firstEmployeeId = allResponse.data.employees[0].id;
      console.log(`2. Testing GET /api/employees/${firstEmployeeId}`);
      const byIdResponse = await axios.get(`${API_URL}/api/employees/${firstEmployeeId}`);
      console.log('   ✅ SUCCESS - Employee:', byIdResponse.data.employee.full_name, '\n');
      
      // Test 3: GET employee by email
      const email = allResponse.data.employees[0].email;
      console.log(`3. Testing GET /api/employees/by-email/${encodeURIComponent(email)}`);
      const byEmailResponse = await axios.get(`${API_URL}/api/employees/by-email/${encodeURIComponent(email)}`);
      console.log('   ✅ SUCCESS - Employee:', byEmailResponse.data.employee.full_name, '\n');
      
      // Test 4: PUT update employee
      console.log(`4. Testing PUT /api/employees/${firstEmployeeId}`);
      const updateResponse = await axios.put(
        `${API_URL}/api/employees/${firstEmployeeId}`,
        { 
          fullName: byIdResponse.data.employee.full_name, // Preserve name
          email: byIdResponse.data.employee.email,
          is_active: true
        }
      );
      console.log('   ✅ SUCCESS - Employee updated\n');
      
      console.log('🎉 ALL TESTS PASSED! The employee API is working correctly.');
      console.log('✅ You can now update employees from the frontend without HTML errors.');
      
    } else {
      console.log('⚠️  No employees found in database. Please add an employee first.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      // Check if it's HTML
      if (typeof error.response.data === 'string' && 
          (error.response.data.trim().startsWith('<!DOCTYPE') || 
           error.response.data.trim().startsWith('<html'))) {
        console.error('\n⚠️  Server returned HTML instead of JSON!');
        console.error('This means the catch-all route intercepted the request.');
        console.error('Make sure the backend server is running and has the latest code.');
      }
    }
  }
}

testEmployeeEndpoints();
