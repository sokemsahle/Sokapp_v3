// Test the notification seen endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_REQUISITION_ID = 90; // Change this to an actual requisition ID from your database
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token from localStorage

async function testNotificationSeen() {
  try {
    console.log(`Testing POST /api/notifications/${TEST_REQUISITION_ID}/seen`);
    console.log('Using token:', TOKEN ? 'Token provided' : '❌ NO TOKEN!');
    
    const response = await axios.post(
      `${BASE_URL}/api/notifications/${TEST_REQUISITION_ID}/seen`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ FAILED!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
      
      if (error.response.status === 404) {
        console.error('\n⚠️  404 NOT FOUND');
        console.error('This means the route /api/notifications/:id/seen doesn\'t exist in server.js');
        console.error('\nSOLUTION:');
        console.error('1. Check if server.js has this line: app.post(\'/api/notifications/:id/seen\', ...)');
        console.error('2. Make sure backend server is running: cd Backend; npm start');
        console.error('3. Check for typos in the route path');
      }
      
      if (error.response.status === 401) {
        console.error('\n⚠️  401 UNAUTHORIZED');
        console.error('Token is invalid or expired');
        console.error('\nSOLUTION:');
        console.error('1. Get fresh token from localStorage.getItem(\'token\') in browser console');
        console.error('2. Replace YOUR_JWT_TOKEN_HERE with actual token');
        console.error('3. Or logout and login again');
      }
    } else if (error.request) {
      console.error('No response received - backend server might not be running!');
      console.error('\nSOLUTION:');
      console.error('cd "Backend"');
      console.error('npm start');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testNotificationSeen();
