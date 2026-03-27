const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUsersQuery() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapptest'
    };
    
    console.log('Connecting to database...');
    console.log('Config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
    });
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!');
        
        const sql = 'SELECT id, full_name, email FROM users ORDER BY full_name';
        console.log('\nExecuting SQL:', sql);
        
        const [results] = await connection.execute(sql);
        console.log('\n✅ Query executed successfully!');
        console.log(`Found ${results.length} users`);
        
        results.forEach((user, i) => {
            console.log(`${i+1}. ${user.full_name} (${user.email})`);
        });
        
        await connection.end();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
    }
}

testUsersQuery();
