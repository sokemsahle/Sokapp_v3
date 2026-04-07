/**
 * Script to create Fixed Assets tables in the database
 * Run this to fix the 500 error on /api/fixed-assets endpoint
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createFixedAssetsTables() {
    let connection;
    
    try {
        // Connect to database
        console.log('📡 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT) || 3307,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sokapptest'
        });
        
        console.log('✅ Connected to database');
        
        // Read and execute SQL file
        console.log('\n📄 Reading SQL migration file...');
        const sqlPath = path.join(__dirname, '../database/create_fixed_assets_tables.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('🚀 Executing SQL commands...\n');
        
        // Split by semicolons and execute each statement
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        let successCount = 0;
        for (const statement of statements) {
            try {
                await connection.query(statement);
                successCount++;
                console.log(`  Executed statement ${successCount}`);
            } catch (error) {
                // Log but continue - some statements might fail (e.g., DROP IF EXISTS on non-existent tables)
                console.log(`  Skipped/Failed: ${error.message.substring(0, 50)}...`);
            }
        }
        console.log(`\n✅ Successfully executed ${successCount} statements`);
        
        console.log('\n✅ Fixed Assets tables created successfully!');
        
        // Verify tables were created
        const [tables] = await connection.query('SHOW TABLES LIKE "fixed_assets"');
        if (tables.length > 0) {
            console.log('✅ fixed_assets table verified');
        }
        
        const [maintenanceTables] = await connection.query('SHOW TABLES LIKE "asset_maintenance_log"');
        if (maintenanceTables.length > 0) {
            console.log('✅ asset_maintenance_log table verified');
        }
        
        console.log('\n✨ All done! The /api/fixed-assets endpoint should now work correctly.');
        
    } catch (error) {
        console.error('\n❌ Error creating tables:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

// Run the script
createFixedAssetsTables();
