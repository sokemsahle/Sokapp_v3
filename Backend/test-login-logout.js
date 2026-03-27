/**
 * Test script to verify login and logout activity logging
 * This simulates a user login and logout to test if activities are saved to the database
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testLoginLogout() {
    console.log('=== TESTING LOGIN/LOGOUT ACTIVITY LOGGING ===\n');
    
    // Test credentials - replace with actual test user credentials
    const testEmail = 'admin@sokapp.com';
    const testPassword = 'password123'; // Replace with actual password
    
    try {
        // Step 1: Login
        console.log('Step 1: Testing login...');
        const loginResponse = await axios.post(`${API_URL}/api/login`, {
            email: testEmail,
            password: testPassword
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful!');
            const user = loginResponse.data.user;
            console.log(`   User: ${user.full_name} (${user.email})`);
            console.log(`   Role: ${user.role_name}`);
            console.log(`   ID: ${user.id}\n`);
            
            // Wait a few seconds to simulate user activity
            console.log('Waiting 5 seconds to simulate user session...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Step 2: Logout
            console.log('\nStep 2: Testing logout...');
            const logoutResponse = await axios.post(`${API_URL}/api/logout`, {
                userId: user.id,
                userEmail: user.email,
                userName: user.full_name,
                roleId: user.role_id,
                roleName: user.role_name,
                sessionDuration: 5 // seconds
            });
            
            if (logoutResponse.data.success) {
                console.log('✅ Logout successful!');
                console.log('   Activity should be logged to database\n');
            } else {
                console.log('❌ Logout failed:', logoutResponse.data.message);
            }
            
            console.log('\n=== TEST COMPLETE ===');
            console.log('Check your database with this query:');
            console.log(`SELECT * FROM user_activity_log WHERE user_email = '${testEmail}' ORDER BY activity_timestamp DESC LIMIT 10;`);
            
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
            console.log('\nNote: If user does not exist, create a test user first or use existing credentials');
        }
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        console.log('\nMake sure the backend server is running on http://localhost:5000');
    }
}

// Run the test
testLoginLogout();
