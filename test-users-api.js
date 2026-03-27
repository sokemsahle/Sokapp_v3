const fetch = require('node-fetch');

async function testUsersAPI() {
    try {
        const res = await fetch('http://localhost:5000/api/users/list');
        const data = await res.json();
        
        console.log('Status:', res.status);
        console.log('Success:', data.success);
        
        if (data.data) {
            console.log('\n✅ Users found:', data.data.length);
            data.data.forEach((user, i) => {
                console.log(`${i+1}. ${user.full_name} (${user.email})`);
            });
        } else {
            console.log('Message:', data.message);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUsersAPI();
