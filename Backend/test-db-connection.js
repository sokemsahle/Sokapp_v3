require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '(empty)');
console.log('DB_NAME:', process.env.DB_NAME);

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest'
};

console.log('\nDB Config:', {
    ...dbConfig,
    password: dbConfig.password ? '***SET***' : '(empty)'
});

async function testConnection() {
    try {
        console.log('\nAttempting connection...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connection successful!');
        
        const [rows] = await connection.execute('SELECT DATABASE() as db');
        console.log('Connected to database:', rows[0].db);
        
        await connection.end();
        console.log('Connection closed.');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();
