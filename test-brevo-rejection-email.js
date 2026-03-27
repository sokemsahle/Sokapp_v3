// Test Brevo Email Sending
require('dotenv').config();
const axios = require('axios');

async function testRejectionEmail() {
    console.log('\n=== TESTING BREVO REJECTION EMAIL ===\n');
    
    // Replace with actual requestor email from your test
    const requestorEmail = 'sahlesokem@gmail.com'; // Change this to your test email
    const requestId = 3;
    const requestorName = 'Test User';
    const itemName = 'Printer Ink Cartridges';
    const rejectionReason = 'Testing rejection email delivery';
    const rejectedByName = 'System Administrator';
    
    console.log('Configuration:');
    console.log('BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY);
    console.log('API Key starts with:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 20) + '...' : 'N/A');
    console.log('Sender email:', process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM);
    console.log('\nSending test rejection email...\n');
    
    const emailData = {
        sender: { 
            name: "Inventory System", 
            email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "noreply@sokapp.online" 
        },
        to: [{ email: requestorEmail, name: requestorName }],
        subject: `❌ Inventory Request #${requestId} Rejected`,
        htmlContent: `
            <h2>Your Inventory Request Was Rejected</h2>
            <p><strong>Request ID:</strong> #${requestId}</p>
            <p><strong>Status:</strong> <span style="color: red">REJECTED</span></p>
            <hr>
            <h3>Request Details:</h3>
            <p><strong>Item:</strong> ${itemName}</p>
            <p><strong>Quantity Requested:</strong> 22 units</p>
            <hr>
            <p><strong>Rejection Reason:</strong></p>
            <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545;">
                ${rejectionReason}
            </blockquote>
            <p><strong>Rejected by:</strong> ${rejectedByName}</p>
            <p><strong>Rejection Date:</strong> ${new Date().toLocaleDateString()}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">If you have questions, please contact the inventory manager.</p>
        `
    };
    
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            emailData,
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ SUCCESS! Email sent to:', requestorEmail);
        console.log('Brevo Response:', JSON.stringify(response.data, null, 2));
        console.log('\nCheck your inbox at:', requestorEmail);
        
    } catch (error) {
        console.error('❌ FAILED to send email!');
        console.error('Error message:', error.message);
        
        if (error.response) {
            console.error('\n🔴 Brevo API Error Response:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            
            // Common Brevo errors
            if (error.response.status === 401) {
                console.error('\n⚠️  401 Unauthorized - Check your BREVO_API_KEY');
            } else if (error.response.status === 400) {
                console.error('\n⚠️  400 Bad Request - Invalid email format or sender configuration');
            }
        } else if (error.request) {
            console.error('\n🔴 No response received from Brevo');
            console.error('Network error - check your internet connection');
        } else {
            console.error('\n🔴 Error setting up request:', error.message);
        }
    }
}

testRejectionEmail();
