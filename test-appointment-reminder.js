/**
 * Test Appointment Reminder Scheduler
 * This script tests the appointment reminder functionality
 */

require('dotenv').config();
const { checkAndSendReminders, sendAppointmentReminder } = require('./Backend/scheduler/appointmentReminder.scheduler');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db',
    connectionLimit: 10
};

async function testScheduler() {
    console.log('🧪 Testing Appointment Reminder Scheduler\n');
    console.log('===========================================');
    
    // Test 1: Check upcoming appointments
    console.log('\n📋 TEST 1: Check for upcoming appointments');
    console.log('-------------------------------------------');
    
    const connection = await mysql.createConnection(dbConfig);
    try {
        // First, let's see what appointments exist
        const [allAppointments] = await connection.execute(`
            SELECT 
                a.id,
                a.title,
                a.start_datetime,
                u_attendee.email as attendee_email,
                CONCAT(u_attendee.first_name, ' ', u_attendee.last_name) as attendee_name
            FROM appointments a
            JOIN users u_attendee ON a.attendee_user_id = u_attendee.id
            ORDER BY a.start_datetime ASC
            LIMIT 5
        `);
        
        console.log('\n📅 Next 5 appointments in database:');
        if (allAppointments.length === 0) {
            console.log('⚠️  No appointments found in database!');
            console.log('\n💡 TIP: Create an appointment first using the calendar UI');
        } else {
            allAppointments.forEach((apt, i) => {
                const startDate = new Date(apt.start_datetime);
                console.log(`\n${i+1}. ${apt.title}`);
                console.log(`   Start: ${startDate.toLocaleString()}`);
                console.log(`   Attendee: ${apt.attendee_name} (${apt.attendee_email})`);
            });
            
            // Test 2: Send a manual reminder for the first appointment
            console.log('\n\n📋 TEST 2: Send manual reminder email');
            console.log('-------------------------------------------');
            
            if (allAppointments.length > 0) {
                const testAppointment = allAppointments[0];
                console.log(`\n📧 Sending test reminder for: ${testAppointment.title}`);
                
                const result = await sendAppointmentReminder(testAppointment);
                
                if (result.success) {
                    console.log('\n✅ SUCCESS! Email sent successfully');
                } else {
                    console.log('\n❌ FAILED! Email not sent:', result.message);
                }
            }
        }
        
        // Test 3: Run the full scheduler check
        console.log('\n\n📋 TEST 3: Run full scheduler check');
        console.log('-------------------------------------------');
        await checkAndSendReminders();
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
    
    console.log('\n===========================================');
    console.log('✅ Testing complete!\n');
}

// Run the test
testScheduler().catch(console.error);
