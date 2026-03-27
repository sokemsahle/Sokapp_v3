// Direct Database Test - Run SQL Query Manually
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
});

console.log('Testing appointments query directly...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Connected to database\n');
    
    // Test the EXACT query from server.js
    const testSQL = `
        SELECT a.*, 
               creator.first_name as creator_first_name, creator.last_name as creator_last_name,
               attendee.first_name as attendee_first_name, attendee.last_name as attendee_last_name,
               creator.email as creator_email, attendee.email as attendee_email
        FROM appointments a
        JOIN users creator ON a.creator_user_id = creator.id
        JOIN users attendee ON a.attendee_user_id = attendee.id
        ORDER BY a.start_datetime DESC
    `;
    
    console.log('Executing query...');
    console.log('SQL:', testSQL.substring(0, 200) + '...\n');
    
    db.query(testSQL, (err, results) => {
        if (err) {
            console.error('❌ Query execution FAILED!');
            console.error('Error:', err.message);
            console.error('SQL State:', err.sqlState);
            console.error('Error Code:', err.code);
            console.error('Stack:', err.stack);
            db.end();
            return;
        }
        
        console.log('✅ Query executed SUCCESSFULLY!\n');
        console.log(`📊 Found ${results.length} appointments:\n`);
        
        results.forEach((apt, index) => {
            console.log(`${index + 1}. ${apt.title}`);
            console.log(`   Creator: ${apt.creator_first_name} ${apt.creator_last_name} (${apt.creator_email})`);
            console.log(`   Attendee: ${apt.attendee_first_name} ${apt.attendee_last_name} (${apt.attendee_email})`);
            console.log(`   Date: ${apt.start_datetime}`);
            console.log(`   Status: ${apt.status}\n`);
        });
        
        db.end();
    });
});
