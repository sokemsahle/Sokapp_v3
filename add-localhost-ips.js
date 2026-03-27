const mysql = require('mysql2/promise');

const dbConfig = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'sokapptest'
};

(async () => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Add localhost IPs for development
        await connection.execute(`
            INSERT INTO allowed_ips (ip_address, description, created_by) 
            VALUES 
                ('127.0.0.1', 'Localhost IPv4 - Development', 1),
                ('::1', 'Localhost IPv6 - Development', 1),
                ('192.168.8.74', 'Office WiFi - Main Network', 1)
            ON DUPLICATE KEY UPDATE ip_address = ip_address
        `);
        
        console.log('✅ IPs added/updated successfully!');
        
        // Verify
        const [rows] = await connection.execute('SELECT * FROM allowed_ips ORDER BY created_at DESC');
        console.log('\n📋 Current allowed IPs:');
        rows.forEach(row => {
            console.log(`  - ${row.ip_address}: ${row.description}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
})();
