// Test network connectivity to Brevo API
const axios = require('axios');
require('dotenv').config();

async function testBrevoConnectivity() {
    console.log('=== TESTING BREVO API CONNECTIVITY ===\n');
    
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        console.error('❌ BREVO_API_KEY not found in .env file');
        return;
    }
    
    console.log('✓ API Key found (starts with:', apiKey.substring(0, 15) + '...)');
    console.log('Target URL: https://api.brevo.com/v3/smtp/email\n');
    
    // Test 1: DNS Resolution - SKIP IF FAILS BUT CONTINUE
    console.log('TEST 1: Checking DNS resolution...');
    try {
        const dns = require('dns').promises;
        const addresses = await dns.resolve('api.brevo.com');
        console.log('✓ DNS resolved api.brevo.com to:', addresses);
    } catch (error) {
        console.warn('⚠️  DNS resolution failed (this might be okay):', error.message);
        console.warn('This is often caused by Windows DNS cache or firewall.');
        console.warn('Continuing with direct connection test...\n');
        // Don't return - continue to next test
    }
    
    // Alternative: Try using Google DNS directly
    console.log('TEST 1b: Trying with Google DNS (8.8.8.8)...');
    try {
        const { Resolver } = require('dns').promises;
        const resolver = new Resolver();
        resolver.setServers(['8.8.8.8']);
        const addresses = await resolver.resolve('api.brevo.com');
        console.log('✓ Google DNS resolved api.brevo.com to:', addresses);
        console.log('Recommendation: Consider changing your system DNS to 8.8.8.8\n');
    } catch (error) {
        console.warn('⚠️  Google DNS also failed:', error.message);
        console.warn('But continuing to test direct HTTPS connection...\n');
    }
    
    // Test 2: Network Connectivity
    console.log('\nTEST 2: Testing network connectivity...');
    try {
        const https = require('https');
        
        await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'api.brevo.com',
                port: 443,
                path: '/v3/smtp/email',
                method: 'OPTIONS',
                timeout: 5000
            }, (res) => {
                console.log('✓ HTTPS connection successful');
                console.log('  Status:', res.statusCode);
                resolve();
            });
            
            req.on('error', (error) => {
                console.error('❌ HTTPS connection failed:', error.message);
                reject(error);
            });
            
            req.on('timeout', () => {
                console.error('❌ Connection timed out after 5 seconds');
                req.destroy();
                reject(new Error('Timeout'));
            });
            
            req.end();
        });
    } catch (error) {
        console.error('Network issue detected!');
        console.error('Possible fixes:');
        console.error('  1. Check internet connection');
        console.error('  2. Disable firewall temporarily');
        console.error('  3. Check proxy settings');
        console.error('  4. Try: ping api.brevo.com');
        return;
    }
    
    // Test 3: API Authentication
    console.log('\nTEST 3: Testing API authentication...');
    try {
        const response = await axios.get('https://api.brevo.com/v3/account', {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey
            },
            timeout: 10000
        });
        
        console.log('✅ API authentication successful!');
        console.log('Account info:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ API authentication failed');
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Error:', error.response.data?.message);
            
            if (error.response.status === 401) {
                console.error('\n⚠️  INVALID API KEY!');
                console.error('Fix: Check BREVO_API_KEY in .env file');
                console.error('Get your key from: https://app.brevo.com/settings/keys/api');
            } else if (error.response.status === 403) {
                console.error('\n⚠️  API KEY HAS NO PERMISSIONS');
                console.error('Fix: Enable SMTP in Brevo dashboard');
            }
        } else {
            console.error('Error:', error.message);
        }
        return;
    }
    
    // Test 4: Send Test Email
    console.log('\nTEST 4: Sending test email...');
    const testEmail = 'sahlesokem@gmail.com'; // Your email
    
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    email: process.env.EMAIL_FROM || 'noreply@sokapp.online',
                    name: 'SOKAPP Test'
                },
                to: [
                    { email: testEmail }
                ],
                subject: '🧪 Brevo API Test - SOKAPP',
                htmlContent: `
                    <html>
                    <body>
                        <h1>✅ SUCCESS!</h1>
                        <p>If you're reading this, Brevo API is working correctly.</p>
                        <p>Sent at: ${new Date().toLocaleString()}</p>
                        <p>Test from SOKAPP application</p>
                    </body>
                    </html>
                `
            },
            {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': apiKey
                },
                timeout: 15000
            }
        );
        
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', response.data.messageId);
        console.log(`\n📧 CHECK YOUR INBOX: ${testEmail}`);
        console.log('(Also check spam/junk folder)\n');
        
    } catch (error) {
        console.error('❌ Failed to send test email');
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Brevo Error:', error.response.data?.message);
            
            if (error.response.status === 400) {
                console.error('\n⚠️  SENDER EMAIL NOT VERIFIED!');
                console.error('Fix: Verify "noreply@sokapp.online" in Brevo dashboard');
                console.error('Go to: https://app.brevo.com/settings/senders');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('⚠️  REQUEST TIMED OUT');
            console.error('Fix: Check firewall/internet connection');
        } else {
            console.error('Error:', error.message);
        }
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
}

testBrevoConnectivity().catch(console.error);
