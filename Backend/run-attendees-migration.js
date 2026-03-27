// Run the appointment_attendees table migration
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapp_db',
    };

    console.log('Connecting to database:', dbConfig.database);
    console.log('Host:', dbConfig.host);
    console.log('Port:', dbConfig.port);
    console.log('User:', dbConfig.user);
    console.log('');

    let connection;
    try {
        console.log('🔧 Running appointment_attendees table migration...\n');
        
        connection = await mysql.createConnection(dbConfig);
        
        // Read and execute the migration SQL
        const fs = require('fs');
        const path = require('path');
        const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'add_appointment_attendees_table.sql');
        
        console.log(`📄 Reading migration file: ${sqlPath}\n`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement.length > 0 && !statement.startsWith('--')) {
                try {
                    await connection.execute(statement);
                    console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
                } catch (err) {
                    // Ignore "table already exists" errors
                    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`⚠️  Statement ${i + 1}: Table already exists, skipping...`);
                    } else if (err.code === 'ER_DUP_ENTRY') {
                        console.log(`⚠️  Statement ${i + 1}: Duplicate entry, skipping...`);
                    } else {
                        throw err;
                    }
                }
            }
        }
        
        console.log('\n✅ Migration completed successfully!\n');
        
        // Verify the table was created
        console.log('🔍 Verifying appointment_attendees table...\n');
        const [tables] = await connection.query(`
            SHOW TABLES LIKE 'appointment_attendees'
        `);
        
        if (tables.length > 0) {
            console.log('✅ Table appointment_attendees exists!\n');
            
            // Show table structure
            const [columns] = await connection.query('DESCRIBE appointment_attendees');
            console.log('Table Structure:');
            console.table(columns.map(col => ({
                Field: col.Field,
                Type: col.Type,
                Null: col.Null,
                Key: col.Key
            })));
        } else {
            console.error('❌ Table appointment_attendees was NOT created!\n');
        }
        
        // Check if data was migrated
        console.log('\n📊 Checking existing appointments data...\n');
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.title,
                a.attendee_user_id,
                u.full_name as attendee_name,
                (SELECT COUNT(*) FROM appointment_attendees aa WHERE aa.appointment_id = a.id) as junction_count
            FROM appointments a
            LEFT JOIN users u ON a.attendee_user_id = u.id
            ORDER BY a.id DESC
            LIMIT 10
        `);
        
        if (appointments.length > 0) {
            console.log('Recent Appointments:');
            console.table(appointments.map(apt => ({
                ID: apt.id,
                Title: apt.title,
                AttendeeUserID: apt.attendee_user_id,
                AttendeeName: apt.attendee_name || 'N/A',
                JunctionRecords: apt.junction_count
            })));
        } else {
            console.log('No existing appointments found.');
        }
        
        console.log('\n===========================================');
        console.log('✅ Migration verification complete!');
        console.log('\n💡 Next Steps:');
        console.log('1. Restart the backend server');
        console.log('2. Create a new appointment');
        console.log('3. Attendees should now be saved correctly');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
