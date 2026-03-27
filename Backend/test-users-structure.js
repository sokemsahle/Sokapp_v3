require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db'
};

async function checkUsersTable() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('📋 Checking users table structure...\n');
        const [columns] = await connection.query('DESCRIBE users');
        console.table(columns);
        
        // Get sample users
        console.log('\n👥 Sample users:\n');
        const [users] = await connection.query('SELECT * FROM users LIMIT 5');
        console.table(users);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkUsersTable();
