/**
 * Check Signature Values in Database
 * Examines if signatures are stored as NULL or empty strings
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSignatureValues() {
    console.log('🔍 Checking Signature Storage Format\n');
    console.log('================================================\n');
    
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapp_db',
    };
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Check recent requisitions
        const [requisitions] = await connection.execute(
            `SELECT id, status, 
                    reviewed_signature IS NULL as review_is_null,
                    reviewed_signature = '' as review_is_empty,
                    LENGTH(reviewed_signature) as review_length,
                    approved_signature IS NULL as approval_is_null,
                    approved_signature = '' as approval_is_empty,
                    LENGTH(approved_signature) as approval_length,
                    authorized_signature IS NULL as auth_is_null,
                    authorized_signature = '' as auth_is_empty,
                    LENGTH(authorized_signature) as auth_length
             FROM requisitions 
             ORDER BY id DESC 
             LIMIT 10`
        );
        
        console.log('📊 Signature Storage Analysis:\n');
        
        requisitions.forEach(req => {
            console.log(`Requisition #${req.id} (${req.status}):`);
            console.log(`   Reviewed: NULL=${req.review_is_null ? 'YES' : 'NO'}, Empty=${req.review_is_empty ? 'YES' : 'NO'}, Length=${req.review_length}`);
            console.log(`   Approved: NULL=${req.approval_is_null ? 'YES' : 'NO'}, Empty=${req.approval_is_empty ? 'YES' : 'NO'}, Length=${req.approval_length}`);
            console.log(`   Authorized: NULL=${req.auth_is_null ? 'YES' : 'NO'}, Empty=${req.auth_is_empty ? 'YES' : 'NO'}, Length=${req.auth_length}`);
            console.log('');
        });
        
        // Check table schema
        const [columns] = await connection.execute(
            `SHOW COLUMNS FROM requisitions WHERE Field LIKE '%signature%'`
        );
        
        console.log('\n📋 Table Schema:\n');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}, Null=${col.Null}, Default=${col.Default}`);
        });
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await connection.end();
    }
}

checkSignatureValues();
