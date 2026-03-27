// Test with detailed error logging
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
});

console.log('Testing query with new column names...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    }
    
    const testSQL = `
        SELECT a.*, 
               creator.full_name as creator_full_name,
               attendee.full_name as attendee_full_name,
               creator.email as creator_email, attendee.email as attendee_email
        FROM appointments a
        JOIN users creator ON a.creator_user_id = creator.id
        JOIN users attendee ON a.attendee_user_id = attendee.id
        ORDER BY a.start_datetime DESC
    `;
    
    console.log('Executing SQL...');
    db.query(testSQL, (err, results) => {
        if (err) {
            console.error('❌ Query ERROR:');
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('Stack:', err.stack);
            db.end();
            return;
        }
        
        console.log('✅ SUCCESS!');
        console.log(`Found ${results.length} appointments`);
        results.forEach((apt, i) => {
            console.log(`\n${i+1}. ${apt.title}`);
            console.log(`   Creator: ${apt.creator_full_name} (${apt.creator_email})`);
            console.log(`   Attendee: ${apt.attendee_full_name} (${apt.attendee_email})`);
            console.log(`   Date: ${apt.start_datetime}`);
        });
        
        db.end();
    });
});
