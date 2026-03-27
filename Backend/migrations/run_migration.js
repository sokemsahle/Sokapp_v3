const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'sokapptest'
};

async function runMigration() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Read the SQL migration file
        const migrationPath = path.join(__dirname, 'add_employee_status_column.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('\n📝 Running migration...\n');
        
        // Split SQL into individual statements and execute them
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.substring(0, 100)}...`);
                await connection.execute(statement);
                console.log('✅ Executed successfully\n');
            }
        }

        console.log('✅ Migration completed successfully!');
        console.log('\n✨ The "status" column has been added to the employees table');
        console.log('   Status values: Active, Inactive, Former Employee');
        
    } catch (error) {
        console.error('❌ Error running migration:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n⚠️  The status column already exists in the employees table');
        } else if (error.code === 'ENOENT') {
            console.log('\n⚠️  Migration file not found');
        }
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

// Run the migration
runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
