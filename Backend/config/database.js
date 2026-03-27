const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

// Create a simple query helper
async function query(sql, params = []) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(sql, params);
        return [rows, []]; // Return rows and empty fields array for consistency
    } finally {
        await connection.end();
    }
}

module.exports = {
    dbConfig,
    query
};
