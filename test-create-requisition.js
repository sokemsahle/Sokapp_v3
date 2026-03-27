// Manual test for requisition email sending
const axios = require('axios');

async function testCreateRequisition() {
    console.log('=== CREATING TEST REQUISITION ===\n');
    
    const testData = {
        requestor: 'Test User',
        userEmail: 'sahlesokem@gmail.com', // Your email
        department: 'IT Department',
        date: new Date().toISOString().substr(0, 10),
        description: 'Testing requisition email notifications',
        requestedBy: 'Test Requester',
        reviewedBy: '',
        approvedBy: '',
        authorizedBy: '',
        program_id: null,
        items: [
            {
                description: 'Test Item 1',
                quantity: 2,
                price: 50.00,
                total: 100.00
            },
            {
                description: 'Test Item 2',
                quantity: 1,
                price: 75.00,
                total: 75.00
            }
        ],
        signature: 'data:image/png;base64,test_signature_data',
        approvedSignature: null,
        authorizedSignature: null,
        reviewedSignature: null
    };
    
    try {
        console.log('Sending POST request to http://localhost:5000/api/requisition');
        console.log('Payload:', JSON.stringify(testData, null, 2));
        
        const response = await axios.post(
            'http://localhost:5000/api/requisition',
            testData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('\n✅ Response received:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        
        console.log('\n📧 CHECK BACKEND CONSOLE for email sending logs');
        console.log('📧 CHECK YOUR EMAIL (sahlesokem@gmail.com) within 1-2 minutes');
        
    } catch (error) {
        console.error('\n❌ Error creating requisition:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testCreateRequisition().catch(console.error);
