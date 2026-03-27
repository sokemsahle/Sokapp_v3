require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

async function checkAppointments() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Check table structure
        console.log('📋 Checking appointments table structure...\n');
        const [columns] = await connection.query('DESCRIBE appointments');
        console.table(columns);
        
        // Get all appointments
        console.log('\n📅 All appointments in database:\n');
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.title,
                a.start_datetime,
                a.end_datetime,
                a.status,
                u_attendee.email as attendee_email,
                u_attendee.full_name as attendee_name,
                u_creator.email as creator_email,
                u_creator.full_name as creator_name
            FROM appointments a
            JOIN users u_attendee ON a.attendee_user_id = u_attendee.id
            JOIN users u_creator ON a.creator_user_id = u_creator.id
            ORDER BY a.start_datetime ASC
        `);
        
        console.table(appointments.map(a => ({
            ID: a.id,
            Title: a.title,
            Start: a.start_datetime,
            Status: a.status,
            Attendee: a.attendee_name,
            Creator: a.creator_name
        })));
        
        // Test the scheduler query
        console.log('\n⏰ Testing scheduler query (appointments starting in 1-2 minutes)...\n');
        const now = new Date();
        const oneMinuteFromNow = new Date(now.getTime() + 60000);
        const twoMinutesFromNow = new Date(now.getTime() + 120000);
        
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        console.log('Current time:', formatDateTime(now));
        console.log('Query range:', formatDateTime(oneMinuteFromNow), 'to', formatDateTime(twoMinutesFromNow));
        
        const [upcoming] = await connection.query(`
            SELECT 
                a.id,
                a.title,
                a.start_datetime,
                a.status,
                u_attendee.email as attendee_email,
                u_attendee.full_name as attendee_name
            FROM appointments a
            JOIN users u_attendee ON a.attendee_user_id = u_attendee.id
            WHERE a.start_datetime BETWEEN ? AND ?
                AND a.status = 'scheduled'
        `, [formatDateTime(oneMinuteFromNow), formatDateTime(twoMinutesFromNow)]);
        
        if (upcoming.length === 0) {
            console.log('❌ No appointments found starting in the next 1-2 minutes');
            console.log('\n💡 To test, create an appointment with start_datetime 1 minute from now:');
            console.log('Example SQL:');
            console.log(`INSERT INTO appointments (title, start_datetime, end_datetime, status, attendee_user_id, creator_user_id) 
VALUES ('Test Appointment', '${formatDateTime(new Date(now.getTime() + 60000))}', '${formatDateTime(new Date(now.getTime() + 120000))}', 'scheduled', 1, 2);`);
        } else {
            console.log('✅ Found upcoming appointments:');
            console.table(upcoming);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkAppointments();
