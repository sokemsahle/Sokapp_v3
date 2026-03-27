// Check Brevo email delivery logs
const axios = require('axios');
require('dotenv').config();

async function checkBrevoEmails() {
    console.log('=== CHECKING BREVO EMAIL DELIVERY ===\n');
    
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        console.error('❌ BREVO_API_KEY not found');
        return;
    }
    
    try {
        // Get account info first
        console.log('STEP 1: Checking Brevo account...');
        const accountResponse = await axios.get('https://api.brevo.com/v3/account', {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey
            }
        });
        
        console.log('Account Email:', accountResponse.data.email);
        console.log('Plan:', accountResponse.data.plan[0]?.type);
        console.log('Credits Remaining:', accountResponse.data.plan[0]?.credits);
        console.log();
        
        // Check sender status
        console.log('STEP 2: Checking sender emails...');
        const sendersResponse = await axios.get('https://api.brevo.com/v3/smtp/senders', {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey
            }
        });
        
        console.log('Configured Senders:');
        sendersResponse.data.senders.forEach(sender => {
            console.log(`  - ${sender.email} (Status: ${sender.status}, Verified: ${sender.isVerified})`);
        });
        console.log();
        
        // Try to get recent email events/logs
        console.log('STEP 3: Checking recent email activity...');
        console.log('Note: Brevo free plan may not have access to detailed logs via API');
        console.log('Check your Brevo dashboard at: https://app.brevo.com/campaigns/smtp');
        console.log();
        
        // Test sending another email with detailed logging
        console.log('STEP 4: Sending test email with detailed tracking...');
        const testEmail = 'sahlesokem@gmail.com';
        
        const emailData = {
            sender: {
                email: 'noreply@sokapp.online',
                name: 'SOKAPP System'
            },
            to: [
                { email: testEmail }
            ],
            subject: '🧪 URGENT TEST - Please Check If Received',
            htmlContent: `
                <html>
                <body>
                    <h1>🔔 Email Delivery Test</h1>
                    <p>If you receive this email, the system is working correctly.</p>
                    <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>To:</strong> ${testEmail}</p>
                    <p>Please check spam/junk folder if not in inbox.</p>
                    <hr/>
                    <p style="font-size: 10px; color: #666;">This is a test from SOKAPP requisition system.</p>
                </body>
                </html>
            `,
            headers: {
                'X-Mailer': 'SOKAPP-Test'
            }
        };
        
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            emailData,
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
        console.log();
        console.log('📧 CHECK YOUR INBOX NOW: sahlesokem@gmail.com');
        console.log('⏰ Wait up to 5 minutes for delivery');
        console.log('🗑️  Also check SPAM/JUNK folder');
        console.log();
        
        // Provide troubleshooting steps
        console.log('═══════════════════════════════════════════════');
        console.log('IF YOU DON\'T RECEIVE THE EMAIL:');
        console.log('═══════════════════════════════════════════════');
        console.log('1. Wait 2-5 minutes (email delivery can be delayed)');
        console.log('2. Check SPAM/JUNK folder thoroughly');
        console.log('3. Check Gmail Promotions/Social tabs (if using Gmail)');
        console.log('4. Search for "noreply@sokapp.online" in your email');
        console.log('5. Check Brevo dashboard: https://app.brevo.com/campaigns/smtp');
        console.log('   - Look for the email in "Sent" tab');
        console.log('   - Check if it shows as "Delivered", "Opened", or "Failed"');
        console.log();
        console.log('COMMON REASONS FOR NOT RECEIVING:');
        console.log('• Email went to SPAM (most common)');
        console.log('• Sender domain (sokapp.online) not verified in Brevo');
        console.log('• Email address blocked/bounced previously');
        console.log('• Gmail filtering to Promotions tab');
        console.log('• Corporate firewall blocking external emails');
        console.log('═══════════════════════════════════════════════');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Brevo Error:', error.response.data?.message);
        }
    }
}

checkBrevoEmails().catch(console.error);
