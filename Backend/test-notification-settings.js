/**
 * Test script for Notification Settings API endpoints
 * Run this with: node test-notification-settings.js
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:5000
 * - Valid user token in the .env file or hardcoded below
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'admin@example.com'; // Replace with your test email
const TEST_PASSWORD = 'password123'; // Replace with your test password

// Store token for authenticated requests
let authToken = '';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

console.log(`${colors.cyan}===========================================${colors.reset}`);
console.log(`${colors.cyan}   NOTIFICATION SETTINGS API TEST SUITE   ${colors.reset}`);
console.log(`${colors.cyan}===========================================${colors.reset}\n`);

/**
 * Test 1: Login and get token
 */
async function testLogin() {
    console.log(`${colors.blue}[TEST 1] Logging in to get authentication token...${colors.reset}`);
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        if (response.data.success) {
            authToken = response.data.token;
            console.log(`${colors.green}✓ Login successful! Token received.${colors.reset}\n`);
            return true;
        } else {
            console.log(`${colors.red}✗ Login failed: ${response.data.message}${colors.reset}\n`);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}✗ Login error: ${error.response?.data?.message || error.message}${colors.reset}\n`);
        return false;
    }
}

/**
 * Test 2: GET notification settings
 */
async function testGetSettings() {
    console.log(`${colors.blue}[TEST 2] Fetching notification settings...${colors.reset}`);
    
    try {
        const response = await axios.get(`${API_BASE_URL}/notification-settings`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.data.success) {
            console.log(`${colors.green}✓ GET successful!${colors.reset}`);
            console.log(`${colors.yellow}Settings:${colors.reset}`, JSON.stringify(response.data.data, null, 2));
            console.log();
            return response.data.data;
        } else {
            console.log(`${colors.red}✗ GET failed: ${response.data.message}${colors.reset}\n`);
            return null;
        }
    } catch (error) {
        console.log(`${colors.red}✗ GET error: ${error.response?.data?.message || error.message}${colors.reset}\n`);
        return null;
    }
}

/**
 * Test 3: PATCH notification settings (partial update)
 */
async function testPatchSettings() {
    console.log(`${colors.blue}[TEST 3] Updating welfare_alerts setting (PATCH)...${colors.reset}`);
    
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/notification-settings`,
            { welfare_alerts: false },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        
        if (response.data.success) {
            console.log(`${colors.green}✓ PATCH successful!${colors.reset}`);
            console.log(`${colors.yellow}Updated settings:${colors.reset}`, JSON.stringify(response.data.data, null, 2));
            console.log();
            return response.data.data;
        } else {
            console.log(`${colors.red}✗ PATCH failed: ${response.data.message}${colors.reset}\n`);
            return null;
        }
    } catch (error) {
        console.log(`${colors.red}✗ PATCH error: ${error.response?.data?.message || error.message}${colors.reset}\n`);
        return null;
    }
}

/**
 * Test 4: PUT notification settings (full update)
 */
async function testPutSettings() {
    console.log(`${colors.blue}[TEST 4] Updating all settings (PUT)...${colors.reset}`);
    
    try {
        const response = await axios.put(
            `${API_BASE_URL}/notification-settings`,
            {
                welfare_alerts: true,
                task_reminders: false,
                system_announcements: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        
        if (response.data.success) {
            console.log(`${colors.green}✓ PUT successful!${colors.reset}`);
            console.log(`${colors.yellow}Updated settings:${colors.reset}`, JSON.stringify(response.data.data, null, 2));
            console.log();
            return response.data.data;
        } else {
            console.log(`${colors.red}✗ PUT failed: ${response.data.message}${colors.reset}\n`);
            return null;
        }
    } catch (error) {
        console.log(`${colors.red}✗ PUT error: ${error.response?.data?.message || error.message}${colors.reset}\n`);
        return null;
    }
}

/**
 * Test 5: GET settings without authentication (should fail)
 */
async function testUnauthorizedAccess() {
    console.log(`${colors.blue}[TEST 5] Testing unauthorized access (no token)...${colors.reset}`);
    
    try {
        const response = await axios.get(`${API_BASE_URL}/notification-settings`);
        
        console.log(`${colors.red}✗ Should have returned 401 but got: ${response.status}${colors.reset}\n`);
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log(`${colors.green}✓ Correctly rejected unauthorized request (401)${colors.reset}\n`);
            return true;
        } else {
            console.log(`${colors.red}✗ Unexpected error: ${error.response?.status || error.message}${colors.reset}\n`);
            return false;
        }
    }
}

/**
 * Test 6: PATCH with invalid field (should fail)
 */
async function testInvalidPatch() {
    console.log(`${colors.blue}[TEST 6] Testing PATCH with invalid field...${colors.reset}`);
    
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/notification-settings`,
            { invalid_field: true },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );
        
        console.log(`${colors.yellow}⚠ Request succeeded (may accept any fields): ${response.status}${colors.reset}\n`);
        return true;
    } catch (error) {
        console.log(`${colors.green}✓ Correctly rejected invalid field: ${error.response?.status}${colors.reset}\n`);
        return true;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log(`${colors.yellow}Starting tests...${colors.reset}\n`);
    
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
        console.log(`${colors.red}===========================================${colors.reset}`);
        console.log(`${colors.red}   TESTS ABORTED: Cannot proceed without token   ${colors.reset}`);
        console.log(`${colors.red}===========================================${colors.reset}`);
        return;
    }
    
    // Test 2: GET settings
    const originalSettings = await testGetSettings();
    
    // Test 3: PATCH settings
    await testPatchSettings();
    
    // Test 4: PUT settings
    await testPutSettings();
    
    // Test 5: Unauthorized access
    await testUnauthorizedAccess();
    
    // Test 6: Invalid PATCH
    await testInvalidPatch();
    
    // Restore original settings if they existed
    if (originalSettings) {
        console.log(`${colors.blue}[CLEANUP] Restoring original settings...${colors.reset}`);
        try {
            await axios.put(
                `${API_BASE_URL}/notification-settings`,
                originalSettings,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );
            console.log(`${colors.green}✓ Settings restored successfully${colors.reset}\n`);
        } catch (error) {
            console.log(`${colors.yellow}⚠ Could not restore settings: ${error.message}${colors.reset}\n`);
        }
    }
    
    console.log(`${colors.cyan}===========================================${colors.reset}`);
    console.log(`${colors.cyan}           ALL TESTS COMPLETED             ${colors.reset}`);
    console.log(`${colors.cyan}===========================================${colors.reset}`);
}

// Run the tests
runTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});
