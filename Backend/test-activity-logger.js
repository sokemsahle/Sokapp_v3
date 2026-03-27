/**
 * Test script for Activity Logger
 * This tests if the activity logger can successfully log activities to the database
 */

const { logUserActivity } = require('./utils/activityLogger');

async function testActivityLogger() {
    console.log('=== TESTING ACTIVITY LOGGER ===\n');
    
    try {
        // Test 1: Log a successful login
        console.log('Test 1: Logging successful login...');
        const result1 = await logUserActivity({
            userId: 1,
            userEmail: 'test@example.com',
            userName: 'Test User',
            roleId: 1,
            roleName: 'Administrator',
            activityType: 'login',
            module: 'Authentication',
            actionDescription: 'Test login successful',
            status: 'success'
        });
        console.log(`✅ Success! Activity ID: ${result1}\n`);
        
        // Test 2: Log a failed login attempt
        console.log('Test 2: Logging failed login attempt...');
        const result2 = await logUserActivity({
            userId: null,
            userEmail: 'unknown@example.com',
            userName: 'Unknown',
            roleId: null,
            roleName: null,
            activityType: 'login_failed',
            module: 'Authentication',
            actionDescription: 'Test failed login - user not found',
            status: 'failed',
            failureReason: 'User not found'
        });
        console.log(`✅ Success! Activity ID: ${result2}\n`);
        
        // Test 3: Log a create action
        console.log('Test 3: Logging create action...');
        const result3 = await logUserActivity({
            userId: 2,
            userEmail: 'user2@example.com',
            userName: 'Another User',
            roleId: 2,
            roleName: 'Standard User',
            activityType: 'create',
            module: 'Children',
            actionDescription: 'Created new child profile',
            tableName: 'children',
            recordId: 123,
            newValues: { name: 'John Doe' },
            status: 'success'
        });
        console.log(`✅ Success! Activity ID: ${result3}\n`);
        
        // Test 4: Log without optional parameters
        console.log('Test 4: Logging minimal activity...');
        const result4 = await logUserActivity({
            userId: 1,
            userEmail: 'admin@sokapp.com',
            userName: 'Admin User',
            roleId: 1,
            roleName: 'Admin',
            activityType: 'view',
            module: 'Dashboard',
            actionDescription: 'Viewed dashboard',
            status: 'success'
        });
        console.log(`✅ Success! Activity ID: ${result4}\n`);
        
        console.log('=================================');
        console.log('✅ ALL TESTS PASSED!');
        console.log('=================================\n');
        
        console.log('Check your database with this query:');
        console.log('SELECT * FROM user_activity_log ORDER BY activity_timestamp DESC LIMIT 10;\n');
        
    } catch (error) {
        console.error('=================================');
        console.error('❌ TEST FAILED!');
        console.error('=================================');
        console.error('Error:', error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
    }
}

// Run the test
testActivityLogger();
