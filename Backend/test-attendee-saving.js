// Test script to verify attendee saving in appointments
const mysql = require('mysql2');
require('dotenv').config();

async function testAttendeeSaving() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapp_db',
    };

    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log('🧪 Testing Attendee Saving in Appointments\n');
        console.log('===========================================\n');

        // Step 1: Check if we have users
        console.log('📋 Step 1: Checking available users...\n');
        const [users] = await connection.execute(
            'SELECT id, full_name, email FROM users WHERE is_active = TRUE LIMIT 5'
        );

        if (users.length < 2) {
            console.error('❌ Need at least 2 active users to test');
            await connection.end();
            return;
        }

        console.table(users.map(u => ({ ID: u.id, Name: u.full_name, Email: u.email })));

        const creatorId = users[0].id;
        const attendee1Id = users[1].id;
        const attendee2Id = users.length > 2 ? users[2].id : attendee1Id;

        console.log('\n✅ Users selected for test');
        console.log(`   Creator: ID ${creatorId}`);
        console.log(`   Attendee 1: ID ${attendee1Id}`);
        if (attendee2Id !== attendee1Id) {
            console.log(`   Attendee 2: ID ${attendee2Id}`);
        }

        // Step 2: Create appointment with attendees
        console.log('\n📝 Step 2: Creating appointment with attendees...\n');

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000); // +1 day
        const dayAfter = new Date(now.getTime() + 172800000); // +2 days

        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };

        const startTime = formatDateTime(tomorrow);
        const endTime = formatDateTime(dayAfter);

        // Insert appointment (without status - should default to 'scheduled')
        const insertSql = `
            INSERT INTO appointments 
            (creator_user_id, title, description, start_datetime, end_datetime, location, reminder_minutes_before) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(insertSql, [
            creatorId,
            'Test Appointment - Attendee Check',
            'Testing if attendees are saved correctly',
            startTime,
            endTime,
            'Virtual Meeting',
            1
        ]);

        const appointmentId = result.insertId;
        console.log(`✅ Created appointment with ID: ${appointmentId}`);
        console.log(`   Start: ${startTime}`);
        console.log(`   End: ${endTime}`);

        // Step 3: Insert attendees
        console.log('\n👥 Step 3: Inserting attendees into junction table...\n');

        const attendeeIds = [attendee1Id];
        if (attendee2Id && attendee2Id !== attendee1Id) {
            attendeeIds.push(attendee2Id);
        }

        const attendeeSql = 'INSERT INTO appointment_attendees (appointment_id, user_id) VALUES ?';
        const attendeeValues = attendeeIds.map(id => [appointmentId, id]);
        
        await connection.execute(attendeeSql, [attendeeValues]);
        console.log(`✅ Inserted ${attendeeIds.length} attendee(s)`);

        // Step 4: Verify the appointment was saved correctly
        console.log('\n🔍 Step 4: Verifying appointment data...\n');

        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.title,
                a.creator_user_id,
                a.status,
                a.start_datetime,
                a.end_datetime,
                u_creator.full_name as creator_name
            FROM appointments a
            LEFT JOIN users u_creator ON a.creator_user_id = u_creator.id
            WHERE a.id = ?
        `, [appointmentId]);

        console.log('Appointment Details:');
        console.table(appointments[0]);

        // Step 5: Verify attendees were saved
        console.log('\n👥 Step 5: Verifying attendees...\n');

        const [attendees] = await connection.query(`
            SELECT 
                aa.appointment_id,
                aa.user_id,
                u.full_name,
                u.email
            FROM appointment_attendees aa
            JOIN users u ON aa.user_id = u.id
            WHERE aa.appointment_id = ?
        `, [appointmentId]);

        if (attendees.length === 0) {
            console.error('❌ ERROR: No attendees found in database!');
            console.log('\n💡 This confirms the bug - attendees are not being saved.');
        } else {
            console.log('✅ Attendees saved successfully:');
            const formattedAttendees = attendees.map(a => ({
                AppointmentID: a.appointment_id,
                UserID: a.user_id,
                Name: a.full_name,
                Email: a.email
            }));
            console.table(formattedAttendees);
        }

        // Step 6: Test the full query (like the GET endpoint uses)
        console.log('\n📊 Step 6: Testing full appointment query with JOIN...\n');

        const [fullQuery] = await connection.query(`
            SELECT a.*, 
                   creator.full_name as creator_full_name,
                   creator.email as creator_email,
                   GROUP_CONCAT(DISTINCT attendee.full_name ORDER BY attendee.full_name SEPARATOR ', ') as attendee_names,
                   GROUP_CONCAT(DISTINCT attendee.email ORDER BY attendee.email SEPARATOR ', ') as attendee_emails
            FROM appointments a
            JOIN users creator ON a.creator_user_id = creator.id
            LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
            LEFT JOIN users attendee ON aa.user_id = attendee.id
            WHERE a.id = ?
            GROUP BY a.id
        `, [appointmentId]);

        console.log('Full Query Result:');
        console.table(fullQuery[0]);

        // Cleanup
        console.log('\n🗑️  Step 7: Cleaning up test data...\n');
        await connection.execute('DELETE FROM appointment_attendees WHERE appointment_id = ?', [appointmentId]);
        await connection.execute('DELETE FROM appointments WHERE id = ?', [appointmentId]);
        console.log('✅ Test data deleted');

        console.log('\n===========================================');
        console.log('✅ Test completed!');
        console.log('\n📝 Summary:');
        if (attendees.length > 0) {
            console.log('   ✓ Attendees ARE being saved correctly');
            console.log('   ✓ The issue might be elsewhere (frontend or API call)');
        } else {
            console.log('   ✗ Attendees are NOT being saved');
            console.log('   ✗ Check the API endpoint code and database permissions');
        }

    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

testAttendeeSaving();
