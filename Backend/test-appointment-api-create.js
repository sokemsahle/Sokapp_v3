// Test creating an appointment via API
const fetch = require('node-fetch');

async function testAppointmentCreation() {
    console.log('🧪 Testing Appointment Creation via API\n');
    console.log('===========================================\n');

    try {
        // Get users first
        console.log('📋 Step 1: Fetching users list...\n');
        const usersResponse = await fetch('http://localhost:5000/api/users/list');
        const usersResult = await usersResponse.json();
        
        if (!usersResult.success || usersResult.data.length === 0) {
            console.error('❌ No users found in database');
            return;
        }
        
        console.table(usersResult.data.map(u => ({ ID: u.id, Name: u.full_name, Email: u.email })));
        
        const creatorId = usersResult.data[0].id;
        const attendeeId = usersResult.data.length > 1 ? usersResult.data[1].id : creatorId;
        
        console.log(`\n✅ Using Creator ID: ${creatorId}`);
        console.log(`✅ Using Attendee ID: ${attendeeId}\n`);

        // Create appointment
        console.log('📝 Step 2: Creating appointment via POST /api/appointments...\n');
        
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000); // +1 day
        
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:00`;
        };
        
        const startDateTime = formatDateTime(tomorrow);
        const endDateTime = formatDateTime(new Date(tomorrow.getTime() + 3600000)); // +1 hour
        
        const payload = {
            title: 'API Test Appointment',
            description: 'Testing if attendees are saved correctly via API',
            attendee_user_ids: [attendeeId],
            start_datetime: startDateTime,
            end_datetime: endDateTime,
            location: 'Virtual Meeting',
            reminder_minutes_before: 1
        };
        
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('');
        
        const createResponse = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const createResult = await createResponse.json();
        
        console.log('Create Response:', JSON.stringify(createResult, null, 2));
        
        if (!createResult.success) {
            console.error('\n❌ Failed to create appointment:', createResult.message);
            return;
        }
        
        const appointmentId = createResult.id;
        console.log(`\n✅ Created appointment with ID: ${appointmentId}\n`);

        // Verify it was saved correctly
        console.log('🔍 Step 3: Verifying appointment and attendees were saved...\n');
        
        const getResponse = await fetch(`http://localhost:5000/api/appointments/all`);
        const getResult = await getResponse.json();
        
        if (!getResult.success) {
            console.error('❌ Failed to fetch appointments');
            return;
        }
        
        const appointment = getResult.data.find(a => a.id === appointmentId);
        
        if (!appointment) {
            console.error(`❌ Appointment ${appointmentId} not found in database!`);
            return;
        }
        
        console.log('Appointment Details:');
        const displayData = {
            ID: appointment.id,
            Title: appointment.title,
            Creator: appointment.creator_full_name,
            Attendees: appointment.attendee_names || 'NONE',
            'Attendee Emails': appointment.attendee_emails || 'NONE',
            Start: appointment.start_datetime,
            End: appointment.end_datetime,
            Status: appointment.status,
            Location: appointment.location
        };
        console.table(displayData);
        
        console.log('\n===========================================');
        console.log('✅ Test completed!');
        
        if (appointment.attendee_names && appointment.attendee_names.trim() !== '') {
            console.log('\n🎉 SUCCESS: Attendees ARE being saved correctly!');
            console.log(`   Attendee names: ${appointment.attendee_names}`);
        } else {
            console.log('\n❌ FAILURE: Attendees are NOT being saved!');
            console.log('   The attendee_names field is empty.');
            console.log('   Check the appointment_attendees table insertion logic.');
        }
        
        // Cleanup - delete the test appointment
        console.log('\n🗑️  Step 4: Cleaning up test data...\n');
        const deleteResponse = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
        
        const deleteResult = await deleteResponse.json();
        console.log('Delete response:', deleteResult.message);
        
    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        console.error(error.stack);
    }
}

testAppointmentCreation();
