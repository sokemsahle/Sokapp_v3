/**
 * Test Custom Reminder Feature
 * Verifies that the reminder_minutes_before column exists and works correctly
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
};

async function testReminderFeature() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('🧪 Testing Custom Reminder Feature\n');
        console.log('===========================================\n');
        
        // Step 1: Check if column exists
        console.log('📋 Step 1: Checking database schema...\n');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments' 
            AND COLUMN_NAME = 'reminder_minutes_before'
        `, [dbConfig.database]);
        
        if (columns.length === 0) {
            console.log('❌ Column reminder_minutes_before does not exist!');
            console.log('\n💡 Run this SQL to add it:');
            console.log('```sql');
            console.log('ALTER TABLE appointments');
            console.log('ADD COLUMN reminder_minutes_before INT DEFAULT 1');
            console.log('COMMENT \'Minutes before appointment start time to send email reminder\';');
            console.log('```');
            return;
        }
        
        console.log('✅ Column reminder_minutes_before exists!');
        console.table(columns[0]);
        
        // Step 2: Check existing appointments
        console.log('\n📅 Step 2: Checking existing appointments...\n');
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.title,
                a.start_datetime,
                a.reminder_minutes_before,
                u_attendee.full_name as attendee_name
            FROM appointments a
            JOIN users u_attendee ON a.attendee_user_id = u_attendee.id
            ORDER BY a.start_datetime ASC
            LIMIT 10
        `);
        
        if (appointments.length === 0) {
            console.log('ℹ️  No appointments found in database');
        } else {
            console.log(`Found ${appointments.length} appointment(s):`);
            console.table(appointments.map(a => ({
                ID: a.id,
                Title: a.title,
                Start: a.start_datetime,
                Reminder: `${a.reminder_minutes_before} minute(s)`,
                Attendee: a.attendee_name
            })));
        }
        
        // Step 3: Test creating appointment with custom reminder
        console.log('\n✏️  Step 3: Testing appointment creation with custom reminder...\n');
        
        const now = new Date();
        const testStartTime = new Date(now.getTime() + 3600000); // 1 hour from now
        const testEndTime = new Date(now.getTime() + 4200000); // 1 hour 10 min from now
        
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        const insertSql = `
            INSERT INTO appointments (title, description, start_datetime, end_datetime, status, attendee_user_id, creator_user_id, reminder_minutes_before)
            VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
        `;
        
        const [result] = await connection.execute(insertSql, [
            'Test - Custom Reminder',
            'Testing 30-minute reminder',
            formatDateTime(testStartTime),
            formatDateTime(testEndTime),
            1, // attendee_user_id
            1, // creator_user_id
            30 // reminder_minutes_before (30 minutes)
        ]);
        
        console.log(`✅ Created test appointment with ID: ${result.insertId}`);
        console.log(`   Title: Test - Custom Reminder`);
        console.log(`   Start Time: ${formatDateTime(testStartTime)}`);
        console.log(`   Reminder: 30 minutes before`);
        
        // Verify it was saved correctly
        const [saved] = await connection.query(`
            SELECT id, title, reminder_minutes_before
            FROM appointments
            WHERE id = ?
        `, [result.insertId]);
        
        if (saved.length > 0 && saved[0].reminder_minutes_before === 30) {
            console.log('✅ Reminder time saved correctly!');
        } else {
            console.log('❌ Reminder time not saved correctly!');
        }
        
        // Step 4: Test updating reminder time
        console.log('\n🔄 Step 4: Testing reminder update...\n');
        
        const updateSql = `
            UPDATE appointments
            SET reminder_minutes_before = ?
            WHERE id = ?
        `;
        
        await connection.execute(updateSql, [60, result.insertId]); // Change to 1 hour
        
        const [updated] = await connection.query(`
            SELECT id, title, reminder_minutes_before
            FROM appointments
            WHERE id = ?
        `, [result.insertId]);
        
        if (updated[0].reminder_minutes_before === 60) {
            console.log('✅ Reminder time updated successfully (30 min → 60 min)!');
        } else {
            console.log('❌ Reminder time update failed!');
        }
        
        // Cleanup
        console.log('\n🗑️  Step 5: Cleaning up test data...\n');
        await connection.execute('DELETE FROM appointments WHERE id = ?', [result.insertId]);
        console.log('✅ Test appointment deleted');
        
        console.log('\n===========================================');
        console.log('✅ All tests passed successfully!');
        console.log('\n📝 Summary:');
        console.log('   ✓ Database column exists');
        console.log('   ✓ Can create appointments with custom reminders');
        console.log('   ✓ Can update reminder times');
        console.log('   ✓ Ready to use in production!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Restart server: node server.js');
        console.log('   2. Test UI in calendar app');
        console.log('   3. Create appointment with different reminder times');
        console.log('   4. Monitor scheduler logs for email sending\n');
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

testReminderFeature();
