// Insert Test Appointments Data
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
});

console.log('Inserting test appointments...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    }
    
    // First get some user IDs
    db.query('SELECT id, full_name FROM users LIMIT 5', (err, users) => {
        if (err) {
            console.error('❌ Error fetching users:', err.message);
            db.end();
            return;
        }
        
        console.log('👥 Available users:');
        users.forEach(u => console.log(`   ID ${u.id}: ${u.full_name}`));
        
        if (users.length < 2) {
            console.log('\n❌ Need at least 2 users to create appointments');
            db.end();
            return;
        }
        
        const userId1 = users[0]?.id || 1;
        const userId2 = users[1]?.id || 2;
        const userId3 = users[2]?.id || userId1;
        
        // Insert test appointments
        const insertSQL = `
            INSERT INTO appointments 
            (creator_user_id, attendee_user_id, title, description, start_datetime, end_datetime, location, status) 
            VALUES 
            (?, ?, 'Team Meeting', 'Weekly team sync-up', NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'Conference Room A', 'scheduled'),
            (?, ?, 'Project Review', 'Q1 project milestones discussion', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), 'Virtual - Zoom', 'scheduled'),
            (?, ?, 'One-on-One Check-in', 'Weekly team sync-up', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 30 MINUTE), 'Office', 'scheduled')
        `;
        
        const params = [userId1, userId2, userId1, userId3, userId2, userId1];
        
        db.query(insertSQL, params, (err, result) => {
            if (err) {
                console.error('❌ Error inserting appointments:', err.message);
                console.error('SQL State:', err.sqlState);
                db.end();
                return;
            }
            
            console.log(`\n✅ Successfully inserted ${result.affectedRows} appointments!\n`);
            
            // Verify by fetching them back
            db.query(`
                SELECT a.*, 
                       creator.full_name as creator_full_name,
                       attendee.full_name as attendee_full_name,
                       creator.email as creator_email, attendee.email as attendee_email
                FROM appointments a
                JOIN users creator ON a.creator_user_id = creator.id
                JOIN users attendee ON a.attendee_user_id = attendee.id
                ORDER BY a.start_datetime DESC
            `, (err, results) => {
                if (err) {
                    console.error('❌ Error fetching appointments:', err.message);
                } else {
                    console.log('📋 Current appointments in database:\n');
                    results.forEach((apt, i) => {
                        console.log(`${i+1}. ${apt.title}`);
                        console.log(`   Creator: ${apt.creator_full_name} (${apt.creator_email})`);
                        console.log(`   Attendee: ${apt.attendee_full_name} (${apt.attendee_email})`);
                        console.log(`   Date: ${apt.start_datetime}`);
                        console.log(`   Status: ${apt.status}\n`);
                    });
                }
                
                console.log('\n✅ Test data insertion complete!');
                console.log('💡 You can now see appointments in the System Calendar!');
                db.end();
            });
        });
    });
});
