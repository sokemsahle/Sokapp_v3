// Direct database test for appointment creation with attendees
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDirectDB() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapp_db',
    };

    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log('🧪 Testing Direct Database Insertion\n');
        console.log('===========================================\n');

        // Get users
        console.log('📋 Step 1: Getting users...\n');
        const [users] = await connection.execute(
            'SELECT id, full_name FROM users LIMIT 2'
        );
        
        if (users.length < 2) {
            console.error('❌ Need at least 2 users');
            await connection.end();
            return;
        }

        console.table(users);
        const creatorId = users[0].id;
        const attendeeId = users[1].id;

        // Test appointment creation
        console.log('\n📝 Step 2: Creating appointment...\n');
        
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000);
        
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };

        const startDateTime = formatDateTime(tomorrow);
        const endDateTime = formatDateTime(new Date(tomorrow.getTime() + 3600000));

        console.log(`Creator ID: ${creatorId}`);
        console.log(`Attendee ID: ${attendeeId}`);
        console.log(`Start: ${startDateTime}`);
        console.log(`End: ${endDateTime}`);

        // Insert appointment
        const insertSql = `INSERT INTO appointments 
                     (creator_user_id, title, description, start_datetime, end_datetime, location, status, reminder_minutes_before) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        console.log('\nExecuting SQL:', insertSql);
        console.log('Parameters:', [creatorId, 'Direct DB Test', 'Testing direct insertion', startDateTime, endDateTime, 'Test Location', 'scheduled', 1]);

        const [result] = await connection.execute(insertSql, [creatorId, 'Direct DB Test', 'Testing direct insertion', startDateTime, endDateTime, 'Test Location', 'scheduled', 1]);
        
        const appointmentId = result.insertId;
        console.log(`\n✅ Created appointment with ID: ${appointmentId}`);

        // Test attendee insertion - METHOD 1: Multi-row insert
        console.log('\n👥 Step 3a: Testing multi-row attendee insert...\n');
        
        try {
            const attendeeSql = 'INSERT INTO appointment_attendees (appointment_id, user_id) VALUES ?';
            const attendeeValues = [[appointmentId, attendeeId]];
            
            console.log('Executing SQL:', attendeeSql);
            console.log('Values:', attendeeValues);
            
            await connection.execute(attendeeSql, [attendeeValues]);
            console.log('✅ Multi-row insert succeeded');
        } catch (error) {
            console.error('❌ Multi-row insert failed:', error.message);
            console.error('SQL State:', error.sqlState);
            console.error('SQL Message:', error.sqlMessage);
            console.error('Errno:', error.errno);
            
            // Try alternative method - single insert
            console.log('\n🔄 Trying alternative single-row insert method...\n');
            
            const singleInsertSql = 'INSERT INTO appointment_attendees (appointment_id, user_id) VALUES (?, ?)';
            await connection.execute(singleInsertSql, [appointmentId, attendeeId]);
            console.log('✅ Single-row insert succeeded');
        }

        // Verify
        console.log('\n🔍 Step 4: Verifying data...\n');
        
        const [appointments] = await connection.query(`
            SELECT a.*, 
                   creator.full_name as creator_name,
                   GROUP_CONCAT(DISTINCT attendee.full_name ORDER BY attendee.full_name SEPARATOR ', ') as attendee_names
            FROM appointments a
            JOIN users creator ON a.creator_user_id = creator.id
            LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
            LEFT JOIN users attendee ON aa.user_id = attendee.id
            WHERE a.id = ?
            GROUP BY a.id
        `, [appointmentId]);

        console.log('Appointment with Attendees:');
        console.table(appointments[0]);

        // Cleanup
        console.log('\n🗑️  Step 5: Cleaning up...\n');
        await connection.execute('DELETE FROM appointment_attendees WHERE appointment_id = ?', [appointmentId]);
        await connection.execute('DELETE FROM appointments WHERE id = ?', [appointmentId]);
        console.log('✅ Test data deleted');

        console.log('\n===========================================');
        console.log('✅ Test completed successfully!');
        console.log('Attendees CAN be saved using this method.');

    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

testDirectDB();
