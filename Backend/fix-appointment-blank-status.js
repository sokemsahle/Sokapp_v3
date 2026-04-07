/**
 * Fix blank appointment statuses
 * Updates appointments with empty string status to 'scheduled'
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

async function fixBlankStatuses() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('🔧 Fixing blank appointment statuses...\n');
        
        // Update appointments with blank status
        const [result] = await connection.execute(`
            UPDATE appointments 
            SET status = 'scheduled' 
            WHERE status = '' OR status IS NULL
        `);
        
        console.log(`✅ Updated ${result.affectedRows} appointment(s) with blank status to 'scheduled'\n`);
        
        // Verify appointment ID 41
        const [rows] = await connection.execute(`
            SELECT id, title, status, start_datetime, reminder_minutes_before
            FROM appointments
            WHERE id = 41
        `);
        
        if (rows.length > 0) {
            console.log('Appointment #41 details:');
            console.table([{
                ID: rows[0].id,
                Title: rows[0].title,
                Status: rows[0].status,
                Start: new Date(rows[0].start_datetime).toLocaleString(),
                Reminder: `${rows[0].reminder_minutes_before} min`
            }]);
            
            if (rows[0].status === 'scheduled') {
                console.log('✅ Status is now correct!\n');
            } else {
                console.error(`❌ Status is still '${rows[0].status}'\n`);
            }
        }
        
        // Check all appointments for blank statuses
        const [blankStatusAppointments] = await connection.execute(`
            SELECT id, title, status
            FROM appointments
            WHERE status = '' OR status IS NULL
        `);
        
        if (blankStatusAppointments.length > 0) {
            console.error(`⚠️  Warning: ${blankStatusAppointments.length} appointment(s) still have blank status!`);
        } else {
            console.log('✅ No more appointments with blank status found.\n');
        }
        
        console.log('===========================================');
        console.log('✅ Fix complete!\n');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await connection.end();
    }
}

fixBlankStatuses();
