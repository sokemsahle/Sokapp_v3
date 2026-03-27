// Test script to diagnose reject endpoint issue
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRejectEndpoint() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sokapptest'
    });

    try {
        console.log('\n=== DIAGNOSTIC TEST FOR REJECT ENDPOINT ===\n');

        // Check if request #3 exists
        console.log('1. Checking if request #3 exists...');
        const [requests] = await connection.execute(
            'SELECT * FROM inventory_requests WHERE id = 3'
        );
        
        if (requests.length === 0) {
            console.log('❌ Request #3 does not exist!');
        } else {
            console.log('✅ Request #3 found:');
            console.log(JSON.stringify(requests[0], null, 2));
            
            const request = requests[0];
            console.log(`\n   Status: ${request.status}`);
            console.log(`   Is pending? ${request.status === 'pending' ? 'YES' : 'NO - THIS IS THE PROBLEM!'}`);
        }

        // Check all pending requests
        console.log('\n2. All pending requests:');
        const [pendingRequests] = await connection.execute(`
            SELECT 
                ir.id,
                ir.status,
                ir.requestor_name,
                ir.requestor_email,
                ir.quantity_requested,
                i.name as item_name
            FROM inventory_requests ir
            JOIN inventory i ON ir.inventory_id = i.id
            WHERE ir.status = 'pending'
        `);
        
        if (pendingRequests.length === 0) {
            console.log('   No pending requests found!');
        } else {
            console.log(`   Found ${pendingRequests.length} pending request(s):`);
            pendingRequests.forEach((req, idx) => {
                console.log(`   ${idx + 1}. Request #${req.id} - ${req.item_name} - ${req.requestor_name}`);
            });
        }

        // Check inventory table
        console.log('\n3. Checking inventory items:');
        const [inventoryItems] = await connection.execute(
            'SELECT id, name, quantity FROM inventory LIMIT 5'
        );
        console.log('   First 5 inventory items:');
        inventoryItems.forEach(item => {
            console.log(`   - ID ${item.id}: ${item.name} (${item.quantity} in stock)`);
        });

        // Test the actual query from the endpoint
        console.log('\n4. Testing endpoint query for request #3:');
        try {
            const [testRequests] = await connection.execute(`
                SELECT 
                    ir.*,
                    i.name as item_name,
                    i.category,
                    i.quantity as current_stock,
                    i.unit
                FROM inventory_requests ir
                JOIN inventory i ON ir.inventory_id = i.id
                WHERE ir.id = ? AND ir.status = 'pending'
            `, [3]);
            
            if (testRequests.length === 0) {
                console.log('   ❌ Query returned no results!');
                console.log('   Possible reasons:');
                console.log('      - Request #3 is not in "pending" status');
                console.log('      - Request #3 does not exist');
                console.log('      - Foreign key join failed (inventory_id invalid)');
            } else {
                console.log('   ✅ Query successful!');
                console.log('   Result:', JSON.stringify(testRequests[0], null, 2));
            }
        } catch (error) {
            console.log('   ❌ Query failed with error:');
            console.log('   ', error.message);
        }

        console.log('\n=== RECOMMENDATION ===');
        console.log('If request #3 status is not "pending", you cannot reject it again.');
        console.log('Use a different request ID that has status = "pending"');
        console.log('\nTo update a rejected request back to pending for testing:');
        console.log('UPDATE inventory_requests SET status = "pending" WHERE id = 3;');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testRejectEndpoint();
