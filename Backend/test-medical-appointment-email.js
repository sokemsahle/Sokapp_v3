/**
 * Test Medical Appointment Auto-Creation from Medical Records
 * This script verifies that:
 * 1. Trigger creates appointments when medical records are added
 * 2. Appointments have correct reminder_minutes_before value
 * 3. Scheduler can find and send emails for these appointments
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest'
};

async function testMedicalAppointments() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('🧪 Testing Medical Appointment Auto-Creation\n');
        console.log('===========================================\n');
        
        // Step 1: Check if trigger exists
        console.log('📋 Step 1: Checking trigger...\n');
        const [triggers] = await connection.execute("SHOW TRIGGERS LIKE 'child_medical_records'");
        
        if (triggers.length === 0) {
            console.error('❌ Trigger not found! Run fix_trigger_for_nurse_attendees.sql first.');
            return;
        }
        console.log('✅ Trigger exists:', triggers[0].Trigger);
        console.log('   Event:', triggers[0].Event);
        console.log('   Timing:', triggers[0].Timing);
        console.log('');
        
        // Step 2: Check existing medical appointments
        console.log('📋 Step 2: Checking existing medical appointments...\n');
        const [appointments] = await connection.execute(`
            SELECT 
                a.id,
                a.title,
                a.description,
                a.start_datetime,
                a.end_datetime,
                a.location,
                a.status,
                a.reminder_minutes_before,
                a.creator_user_id,
                a.attendee_user_id,
                DATE_FORMAT(a.start_datetime, '%Y-%m-%d %H:%i') as formatted_start,
                TIMESTAMPDIFF(MINUTE, NOW(), a.start_datetime) as minutes_from_now
            FROM appointments a
            WHERE a.title LIKE '%Medical Appointment%'
            ORDER BY a.start_datetime DESC
            LIMIT 10
        `);
        
        if (appointments.length === 0) {
            console.log('⚠️  No medical appointments found in database.');
            console.log('');
            console.log('💡 To create a test appointment:');
            console.log('   1. Create a medical record with next_appointment_date set');
            console.log('   2. Trigger will automatically create an appointment');
            console.log('');
        } else {
            console.log(`✅ Found ${appointments.length} medical appointment(s):\n`);
            console.table(appointments.map(a => ({
                ID: a.id,
                Title: a.title.substring(0, 40),
                Start: a.formatted_start,
                Status: a.status,
                Reminder: `${a.reminder_minutes_before} min`,
                'Minutes From Now': a.minutes_from_now
            })));
            
            // Check specific issues
            console.log('\n🔍 Checking appointment configuration:\n');
            
            const appt = appointments[0]; // Check most recent
            
            if (appt.status !== 'scheduled') {
                console.error(`❌ Status is '${appt.status}' instead of 'scheduled'`);
                console.error('   Scheduler only sends emails for status = "scheduled"');
            } else {
                console.log('✅ Status is correct: "scheduled"');
            }
            
            if (!appt.reminder_minutes_before || appt.reminder_minutes_before <= 0) {
                console.error(`❌ reminder_minutes_before is ${appt.reminder_minutes_before}`);
                console.error('   Must be a positive number for scheduler to work');
            } else {
                console.log(`✅ reminder_minutes_before is set: ${appt.reminder_minutes_before} minutes`);
            }
            
            if (!appt.attendee_user_id) {
                console.error('❌ attendee_user_id is NULL');
                console.error('   Appointment needs at least one attendee');
            } else {
                console.log(`✅ attendee_user_id is set: ${appt.attendee_user_id}`);
            }
            
            console.log('');
            
            // Step 3: Test scheduler query
            console.log('📋 Step 3: Testing scheduler query...\n');
            
            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 60000);
            
            console.log('Current time:', now.toISOString());
            console.log('Checking window:', oneMinuteAgo.toISOString(), 'to', now.toISOString());
            console.log('');
            
            // Get ALL scheduled appointments (like scheduler does)
            const [allScheduled] = await connection.execute(`
                SELECT 
                    a.id,
                    a.title,
                    a.start_datetime,
                    a.reminder_minutes_before,
                    u_creator.email as creator_email,
                    u_creator.full_name as creator_name,
                    GROUP_CONCAT(DISTINCT u_attendee.email ORDER BY u_attendee.email SEPARATOR ',') as attendee_emails,
                    GROUP_CONCAT(DISTINCT u_attendee.full_name ORDER BY u_attendee.full_name SEPARATOR ', ') as attendee_names
                FROM appointments a
                JOIN users u_creator ON a.creator_user_id = u_creator.id
                LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
                LEFT JOIN users u_attendee ON aa.user_id = u_attendee.id
                WHERE a.status = 'scheduled'
                AND a.title LIKE '%Medical Appointment%'
                GROUP BY a.id
                ORDER BY a.start_datetime ASC
            `);
            
            console.log(`Found ${allScheduled.length} scheduled medical appointment(s)`);
            
            // Filter appointments where reminder should be sent now
            const dueReminders = allScheduled.filter(appt => {
                const startTime = new Date(appt.start_datetime);
                const reminderMinutes = appt.reminder_minutes_before || 1;
                const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60000));
                
                return reminderTime >= oneMinuteAgo && reminderTime <= now;
            });
            
            if (dueReminders.length > 0) {
                console.log(`\n✅ ${dueReminders.length} appointment(s) have reminders due NOW!`);
                console.log('These should receive emails within the next minute.\n');
                console.table(dueReminders.map(a => ({
                    ID: a.id,
                    Title: a.title.substring(0, 30),
                    Start: new Date(a.start_datetime).toLocaleString(),
                    Reminder: `${a.reminder_minutes_before} min before`,
                    'Attendee Emails': a.attendee_emails
                })));
            } else {
                console.log('\nℹ️  No reminders due right now.');
                console.log('Scheduler will send emails when appointment time approaches.');
                console.log('');
                
                // Show when reminders will be due
                console.log('When will reminders be sent?');
                allScheduled.forEach(appt => {
                    const startTime = new Date(appt.start_datetime);
                    const reminderMinutes = appt.reminder_minutes_before || 1;
                    const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60000));
                    
                    console.log(`- ${appt.title.substring(0, 30)}...`);
                    console.log(`  Starts: ${startTime.toLocaleString()}`);
                    console.log(`  Reminder will be sent at: ${reminderTime.toLocaleString()}`);
                    console.log(`  (${reminderMinutes} minutes before start)`);
                    console.log('');
                });
            }
        }
        
        console.log('\n===========================================');
        console.log('✅ Test complete!\n');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await connection.end();
    }
}

testMedicalAppointments();
