const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'sokapptest'
};

async function checkStatusColumn() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check if status column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'sokapptest' 
            AND TABLE_NAME = 'employees' 
            AND COLUMN_NAME = 'status'
        `);

        if (columns.length > 0) {
            console.log('✅ Status column found!');
            console.table(columns);
        } else {
            console.log('❌ Status column NOT found in employees table');
        }

        // Get sample employee data
        console.log('\n📋 Sample employee data:');
        const [employees] = await connection.execute(`
            SELECT id, employee_id, full_name, is_active, status 
            FROM employees 
            LIMIT 5
        `);
        
        if (employees.length > 0) {
            console.table(employees);
        } else {
            console.log('No employees found in database');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

checkStatusColumn();
