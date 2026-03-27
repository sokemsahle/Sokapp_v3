/**
 * Quick Email Test
 * Sends a test email immediately to verify Brevo API is working
 */

require('dotenv').config();
const { sendAppointmentReminder } = require('./scheduler/appointmentReminder.scheduler');

async function quickEmailTest() {
    try {
        console.log('🧪 Quick Email Test\n');
        console.log('===========================================\n');
        
        // Create a mock appointment object
        const mockAppointment = {
            id: 999,
            title: 'Test Meeting',
            description: 'This is a test appointment to verify email functionality',
            start_datetime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            end_datetime: new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '),
            location: 'Conference Room A',
            status: 'scheduled',
            attendee_email: 'sahlesokem@gmail.com',
            attendee_name: 'System Administrator',
            creator_email: 'sokem@shamidaethiopia.com',
            creator_name: 'yilkal sahle'
        };
        
        console.log('📧 Sending test email...\n');
        const result = await sendAppointmentReminder(mockAppointment);
        
        console.log('\n===========================================');
        if (result.success) {
            console.log('✅ Test email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.log('❌ Failed to send test email');
            console.log('Error:', result.message);
        }
        console.log('===========================================\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

quickEmailTest();
