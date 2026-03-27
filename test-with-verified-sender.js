// Test email with YOUR VERIFIED GMAIL as sender
const axios = require('axios');
require('dotenv').config();

async function testWithVerifiedSender() {
    console.log('=== TESTING WITH VERIFIED SENDER (Gmail) ===\n');
    
    const apiKey = process.env.BREVO_API_KEY;
    
    // Use your verified Gmail instead of noreply@sokapp.online
    const verifiedSenderEmail = 'sahlesokem@gmail.com'; // Your account email
    const recipientEmail = 'sahlesokem@gmail.com';
    
    console.log('Sender:', verifiedSenderEmail, '(VERIFIED in Brevo)');
    console.log('Recipient:', recipientEmail);
    console.log();
    
    const emailData = {
        sender: {
            email: verifiedSenderEmail,
            name: 'SOKAPP System (Test)'
        },
        to: [
            { email: recipientEmail }
        ],
        subject: '✅ TEST - Requisition Email (Using Verified Sender)',
        htmlContent: `
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
                    <h2 style="color: #333;">📧 Requisition Email Test</h2>
                </div>
                
                <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #4CAF50;">
                    <p><strong>Hello,</strong></p>
                    <p>This is a TEST email from the SOKAPP requisition system.</p>
                    <p>We're testing if emails are being delivered successfully.</p>
                    
                    <h3 style="margin-top: 20px;">Requisition Details:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="padding: 8px; background-color: #f9f9f9;"><strong>Requisition ID:</strong></td>
                            <td style="padding: 8px;">#TEST-123</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; background-color: #f9f9f9;"><strong>Requestor:</strong></td>
                            <td style="padding: 8px;">Test User</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; background-color: #f9f9f9;"><strong>Department:</strong></td>
                            <td style="padding: 8px;">IT Department</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; background-color: #f9f9f9;"><strong>Purpose:</strong></td>
                            <td style="padding: 8px;">Testing email delivery with verified sender</td>
                        </tr>
                    </table>
                    
                    <div style="margin: 20px 0;">
                        <a href="http://localhost:3000/requisitions/TEST-123" 
                           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Requisition
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you received this email, it means using a verified sender email works correctly.
                    </p>
                </div>
                
                <div style="margin-top: 20px; padding: 10px; background-color: #fff3cd; border-radius: 5px;">
                    <p style="margin: 0; font-size: 12px; color: #856404;">
                        <strong>⚠️ Important:</strong> This email was sent using <code>sahlesokem@gmail.com</code> 
                        as the sender because it's verified in Brevo. The domain <code>noreply@sokapp.online</code> 
                        may not be verified.
                    </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;"/>
                <p style="font-size: 12px; color: #666;">
                    This is an automated test from SOKAPP Requisition System.
                </p>
            </body>
            </html>
        `
    };
    
    try {
        console.log('Sending email via Brevo...');
        
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
        
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', response.data.messageId);
        console.log();
        console.log('═══════════════════════════════════════════════');
        console.log('📧 CHECK YOUR INBOX NOW!');
        console.log('⏰ Wait up to 5 minutes');
        console.log('🗑️  Check SPAM/JUNK folder');
        console.log('📬 Check Gmail Promotions/Social tabs');
        console.log('═══════════════════════════════════════════════');
        console.log();
        console.log('IF YOU RECEIVE THIS EMAIL:');
        console.log('✓ The problem is SOLVED - just need to change EMAIL_FROM setting');
        console.log('✓ Edit .env file and change EMAIL_FROM=sahlesokem@gmail.com');
        console.log('✓ Restart backend server');
        console.log();
        console.log('IF YOU DON\'T RECEIVE IT:');
        console.log('✗ Check Brevo dashboard: https://app.brevo.com/campaigns/smtp');
        console.log('✗ Look for failed/bounced emails');
        console.log('✗ Check if your email is blocked');
        
    } catch (error) {
        console.error('❌ Failed to send email');
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Brevo Error:', error.response.data?.message);
            
            if (error.response.status === 400 && error.response.data?.message?.includes('sender')) {
                console.error();
                console.error('⚠️  SENDER EMAIL ISSUE DETECTED!');
                console.error('Fix: Verify the sender email in Brevo dashboard');
                console.error('OR use sahlesokem@gmail.com as sender (already verified)');
            }
        } else {
            console.error('Error:', error.message);
        }
    }
}

testWithVerifiedSender().catch(console.error);
