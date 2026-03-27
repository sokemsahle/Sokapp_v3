/**
 * Test Appointment Reminder Script
 * This script tests the appointment reminder scheduler by:
 * 1. Creating a test appointment 1 minute from now
 * 2. Running the scheduler manually
 * 3. Verifying the email was sent
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { checkAndSendReminders } = require('./scheduler/appointmentReminder.scheduler');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
};

async function testAppointmentReminder() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('🧪 Starting Appointment Reminder Test\n');
        console.log('===========================================\n');
        
        // Step 1: Create a test appointment 1 minute from now
        console.log('📝 Step 1: Creating test appointment...');
        const now = new Date();
        const oneMinuteFromNow = new Date(now.getTime() + 60000); // +1 minute
        const twoMinutesFromNow = new Date(now.getTime() + 120000); // +2 minutes
        
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        const insertSql = `
            INSERT INTO appointments (title, description, start_datetime, end_datetime, status, attendee_user_id, creator_user_id, location)
            VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
        `;
        
        const [result] = await connection.execute(insertSql, [
            'Test Appointment - Email Reminder',
            'This is a test appointment to verify email reminders are working correctly.',
            formatDateTime(oneMinuteFromNow),
            formatDateTime(twoMinutesFromNow),
            1, // attendee_user_id (System Administrator)
            2, // creator_user_id (yilkal sahle)
            'Virtual Meeting Room'
        ]);
        
        const testAppointmentId = result.insertId;
        console.log(`✅ Created test appointment with ID: ${testAppointmentId}`);
        console.log(`   Start Time: ${formatDateTime(oneMinuteFromNow)}`);
        console.log(`   End Time: ${formatDateTime(twoMinutesFromNow)}\n`);
        
        // Step 2: Wait a few seconds to ensure the appointment time is within range
        console.log('⏳ Waiting 50 seconds for the appointment time to be within range...\n');
        await new Promise(resolve => setTimeout(resolve, 50000));
        
        // Step 3: Run the scheduler manually
        console.log('🔔 Step 2: Running scheduler check...\n');
        await checkAndSendReminders();
        
        // Step 4: Verify the appointment still exists
        console.log('\n📋 Step 3: Verifying appointment...\n');
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.title,
                a.start_datetime,
                a.status,
                u_attendee.full_name as attendee_name,
                u_attendee.email as attendee_email
            FROM appointments a
            JOIN users u_attendee ON a.attendee_user_id = u_attendee.id
            WHERE a.id = ?
        `, [testAppointmentId]);
        
        if (appointments.length > 0) {
            console.table(appointments[0]);
        }
        
        console.log('\n===========================================');
        console.log('✅ Test completed!');
        console.log('Check the console output above for email sending status.');
        console.log('Also check the inbox of the attendee email address.');
        console.log('\n💡 To clean up the test appointment, run:');
        console.log(`   DELETE FROM appointments WHERE id = ${testAppointmentId};\n`);
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

// Run the test
testAppointmentReminder();
