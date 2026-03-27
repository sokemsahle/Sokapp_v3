// Execute SQL file to create appointment_attendees table
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function executeSQLFile() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapptest',
    };

    console.log('📋 Database Configuration:');
    console.log('   Host:', dbConfig.host);
    console.log('   Port:', dbConfig.port);
    console.log('   Database:', dbConfig.database);
    console.log('   User:', dbConfig.user);
    console.log('');

    let connection;
    try {
        // Read the SQL file
        const sqlFilePath = __dirname + '\\create-appointment-attendees-table.sql';
        console.log('📄 Reading SQL file:', sqlFilePath);
        
        if (!fs.existsSync(sqlFilePath)) {
            console.error('❌ SQL file not found! Make sure create-appointment-attendees-table.sql exists in Backend folder.');
            return;
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('✅ SQL file loaded successfully\n');

        // Connect to database
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully\n');

        // Split SQL into individual statements and execute them
        console.log('⚙️  Executing SQL statements...\n');
        
        // Remove comments and split by semicolon
        let statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .filter(stmt => stmt.trim().length > 0);
        
        // Skip USE statement - we already connected to the database in dbConfig
        statements = statements.filter(stmt => !stmt.toUpperCase().trim().startsWith('USE '));
        
        console.log(`Found ${statements.length} statements to execute (skipped USE statement)\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            
            if (statement.length === 0) continue;
            
            try {
                console.log(`[${i + 1}/${statements.length}] Executing...`);
                
                // Skip SHOW TABLES as it doesn't work well with execute
                if (statement.toUpperCase().includes('SHOW TABLES')) {
                    const [rows] = await connection.query(statement);
                    console.log('✅ Table exists check passed');
                    if (rows.length > 0) {
                        console.log('   → appointment_attendees table found!');
                    } else {
                        console.warn('   ⚠️  Table not found after creation attempt');
                    }
                } else if (statement.toUpperCase().includes('DESCRIBE')) {
                    const [rows] = await connection.query(statement);
                    console.log('✅ Table structure:');
                    console.table(rows.map(row => ({
                        Field: row.Field,
                        Type: row.Type,
                        Null: row.Null,
                        Key: row.Key
                    })));
                } else if (statement.toUpperCase().includes('SELECT')) {
                    const [rows] = await connection.query(statement);
                    if (rows.length > 0) {
                        console.log('✅ Sample data:');
                        console.table(rows);
                    } else {
                        console.log('ℹ️  No data to display');
                    }
                } else {
                    await connection.execute(statement);
                    console.log('✅ Statement executed successfully');
                }
                
                console.log('');
                
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠️  Table already exists, skipping creation...');
                } else if (error.code === 'ER_DUP_ENTRY') {
                    console.log('⚠️  Duplicate entry, skipping...');
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('⚠️  Key already exists, skipping...');
                } else {
                    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                    throw error;
                }
            }
        }

        console.log('\n===========================================');
        console.log('✅ SQL execution completed successfully!\n');
        
        // Final verification
        console.log('🔍 Final Verification:\n');
        
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointment_attendees'
        `, [dbConfig.database]);
        
        if (tables.length > 0) {
            console.log('✅ SUCCESS! appointment_attendees table exists in database!\n');
            
            const [count] = await connection.query(`
                SELECT COUNT(*) as count FROM appointment_attendees
            `);
            
            console.log(`📊 Records in appointment_attendees: ${count[0].count}\n`);
            
            console.log('💡 NEXT STEPS:');
            console.log('1. Restart your backend server (Ctrl+C, then node server.js)');
            console.log('2. Create a NEW appointment with attendees');
            console.log('3. Attendees should now save and display correctly!\n');
            
        } else {
            console.error('❌ ERROR: Table was NOT created!');
            console.error('Please check the error messages above.\n');
        }

    } catch (error) {
        console.error('\n❌ Execution failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

executeSQLFile();
