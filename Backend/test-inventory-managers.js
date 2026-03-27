const mysql = require('mysql2/promise');

async function testInventoryManagers() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '',
        database: 'sokapptest'
    });

    try {
        console.log('\n=== Testing Inventory Managers Query ===\n');
        
        // Test 1: Check if inventory_manage permission exists
        console.log('1. Checking for inventory_manage permission...');
        const [permissions] = await connection.execute(
            "SELECT * FROM permissions WHERE name = 'inventory_manage'"
        );
        console.log('Permission found:', permissions);

        // Test 2: Check roles with this permission
        console.log('\n2. Roles with inventory_manage permission:');
        const [roles] = await connection.execute(`
            SELECT DISTINCT r.id, r.name
            FROM roles r
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name = 'inventory_manage'
        `);
        console.log('Roles:', roles);

        // Test 3: Check active users with these roles
        console.log('\n3. Active users with inventory_manage permission:');
        const [managers] = await connection.execute(`
            SELECT DISTINCT u.id, u.email, u.full_name, u.is_active, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name = 'inventory_manage' AND u.is_active = 1
        `);
        console.log('Inventory Managers:', managers);
        console.log(`Total managers found: ${managers.length}`);

        // Test 4: Check all active users and their roles
        console.log('\n4. All active users and their roles:');
        const [allUsers] = await connection.execute(`
            SELECT u.id, u.email, u.full_name, u.is_active, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.is_active = 1
        `);
        console.log('All active users:', allUsers);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

testInventoryManagers();
