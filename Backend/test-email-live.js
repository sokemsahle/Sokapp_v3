/**
 * Test Email with Real Database Appointment
 * Creates a real appointment 2 minutes from now and waits for the scheduler to send email
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testWithRealAppointment() {
    try {
        console.log('🧪 Testing Email with Real Database Appointment\n');
        console.log('================================================\n');
        
        const dbConfig = {
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT) || 3307,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sokapp_db',
        };
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Create an appointment 2 minutes from now
        const now = new Date();
        const twoMinutesFromNow = new Date(now.getTime() + 120000); // +2 minutes
        const threeMinutesFromNow = new Date(now.getTime() + 180000); // +3 minutes
        
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        console.log('📅 Creating appointment:');
        console.log(`   Start: ${formatDateTime(twoMinutesFromNow)}`);
        console.log(`   End: ${formatDateTime(threeMinutesFromNow)}`);
        console.log('');
        
        // Get a test user (attendee)
        const [users] = await connection.execute(
            'SELECT id, email, full_name FROM users WHERE is_active = TRUE LIMIT 2'
        );
        
        if (users.length < 2) {
            console.error('❌ Need at least 2 active users in the database');
            await connection.end();
            return;
        }
        
        const attendee = users[0];
        const creator = users[1];
        
        console.log('👥 Users:');
        console.log(`   Attendee: ${attendee.full_name} (${attendee.email})`);
        console.log(`   Creator: ${creator.full_name} (${creator.email})`);
        console.log('');
        
        // Insert the appointment
        const [result] = await connection.execute(
            `INSERT INTO appointments (
                title, description, start_datetime, end_datetime, 
                location, status, attendee_user_id, creator_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Test Email Appointment',
                'This appointment was created to test if the email scheduler is working automatically.',
                formatDateTime(twoMinutesFromNow),
                formatDateTime(threeMinutesFromNow),
                'Virtual Meeting',
                'scheduled',
                attendee.id,
                creator.id
            ]
        );
        
        console.log(`✅ Appointment created with ID: ${result.insertId}`);
        console.log('');
        console.log('⏰ Waiting for scheduler to send email...');
        console.log('   The scheduler runs every minute.');
        console.log('   Email should be sent when current time is within 1-2 minutes of appointment start.');
        console.log('');
        console.log('📊 Monitor the server logs for:');
        console.log('   "⏰ Running appointment reminder check..."');
        console.log('   "📧 Sending reminder to..."');
        console.log('');
        console.log('💡 Tip: Keep this server running and watch for the email!');
        console.log('');
        console.log('Current time:', now.toLocaleTimeString());
        console.log('Appointment starts at:', twoMinutesFromNow.toLocaleTimeString());
        console.log('');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testWithRealAppointment();
