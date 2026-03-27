// Check if appointments table exists
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
});

console.log('Checking database connection and appointments table...\n');

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        db.end();
        return;
    }
    
    console.log('✅ Connected to database successfully!\n');
    
    // Check if appointments table exists
    const checkTableSQL = `SHOW TABLES LIKE 'appointments'`;
    
    db.query(checkTableSQL, (err, results) => {
        if (err) {
            console.error('❌ Error checking table:', err.message);
            db.end();
            return;
        }
        
        if (results.length > 0) {
            console.log('✅ Table "appointments" exists!\n');
            
            // Show table structure
            const describeSQL = `DESCRIBE appointments`;
            
            db.query(describeSQL, (err, columns) => {
                if (err) {
                    console.error('❌ Error describing table:', err.message);
                } else {
                    console.log('📋 Table Structure:');
                    console.table(columns);
                    
                    // Check if there's any data
                    db.query('SELECT COUNT(*) as count FROM appointments', (err, result) => {
                        if (!err) {
                            console.log(`\n📊 Appointments in database: ${result[0].count}`);
                        }
                        
                        db.end();
                    });
                }
            });
        } else {
            console.log('❌ Table "appointments" does NOT exist!\n');
            console.log('💡 Solution: Run the migration script:');
            console.log('   mysql -u root -p sokapp_db < database/migrations/create_appointments_table.sql\n');
            db.end();
        }
    });
});
