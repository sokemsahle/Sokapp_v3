// Check Users Table Structure
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
});

console.log('Checking users table structure...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    
    // Get table structure
    db.query('DESCRIBE users', (err, columns) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.end();
            return;
        }
        
        console.log('📋 Users Table Structure:');
        console.table(columns);
        
        // Get sample data
        db.query('SELECT * FROM users LIMIT 3', (err, results) => {
            if (err) {
                console.error('❌ Error fetching users:', err.message);
                db.end();
                return;
            }
            
            console.log('\n👥 Sample Users:');
            console.table(results);
            
            db.end();
        });
    });
});
