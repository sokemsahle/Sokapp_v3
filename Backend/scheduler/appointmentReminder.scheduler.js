/**
 * Appointment Reminder Scheduler
 * Sends email notifications to attendees 1 minute before their appointment starts
 */

const cron = require('node-cron');
const mysql = require('mysql2/promise');
const axios = require('axios');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapp_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

/**
 * Send email notification via Brevo API
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML content
 */
const sendEmailNotification = async (toEmail, subject, htmlContent) => {
    console.log(`\n=== Appointment Reminder Email ===`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        console.error('❌ Brevo API key not configured');
        return { success: false, message: 'Email service not configured' };
    }
    
    try {
        const emailData = {
            sender: {
                email: process.env.EMAIL_FROM || 'noreply@sokapp.com',
                name: 'SOKAPP System'
            },
            to: [{ email: toEmail }],
            subject: subject,
            htmlContent: htmlContent
        };
        
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            emailData,
            {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': apiKey
                },
                timeout: 10000
            }
        );
        
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', response.data.messageId);
        
        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Get appointments with reminders due in the next minute
 * @returns {Promise<Array>} Array of appointment objects
 */
const getUpcomingAppointments = async () => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Calculate the current time window
        const now = new Date();
        
        console.log('\n📅 Checking for appointments with reminders due now...');
        console.log('   Current time:', now.toISOString());
        
        const sql = `
            SELECT 
                a.id,
                a.title,
                a.description,
                a.start_datetime,
                a.end_datetime,
                a.location,
                a.status,
                a.reminder_minutes_before,
                u_creator.email as creator_email,
                u_creator.full_name as creator_name,
                GROUP_CONCAT(DISTINCT u_attendee.email ORDER BY u_attendee.email SEPARATOR ',') as attendee_emails,
                GROUP_CONCAT(DISTINCT u_attendee.full_name ORDER BY u_attendee.full_name SEPARATOR ', ') as attendee_names
            FROM appointments a
            JOIN users u_creator ON a.creator_user_id = u_creator.id
            LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
            LEFT JOIN users u_attendee ON aa.user_id = u_attendee.id
            WHERE a.status = 'scheduled'
            GROUP BY a.id
            ORDER BY a.start_datetime ASC
        `;
        
        const [results] = await connection.execute(sql);
        
        // Filter appointments where reminder should be sent now
        const appointmentsWithDueReminders = results.filter(appointment => {
            const startTime = new Date(appointment.start_datetime);
            const reminderMinutes = appointment.reminder_minutes_before || 1;
            const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60000));
            
            // Check if reminder time is within the last minute (between now-1min and now)
            const oneMinuteAgo = new Date(now.getTime() - 60000);
            
            return reminderTime >= oneMinuteAgo && reminderTime <= now;
        });
        
        console.log(`✅ Found ${appointmentsWithDueReminders.length} appointment(s) with reminders due now`);
        
        return appointmentsWithDueReminders;
    } catch (error) {
        console.error('❌ Error fetching appointments:', error.message);
        return [];
    } finally {
        await connection.end();
    }
};

/**
 * Convert minutes to human-readable text
 * @param {number} minutes - Minutes before appointment
 * @returns {string} Human-readable time description
 */
const getReminderTimeText = (minutes) => {
    if (minutes >= 10080) {
        const weeks = minutes / 10080;
        return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else if (minutes >= 1440) {
        const days = minutes / 1440;
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (minutes >= 60) {
        const hours = minutes / 60;
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
};

/**
 * Send reminder email for a single appointment to all attendees
 * @param {Object} appointment - Appointment data
 */
const sendAppointmentReminder = async (appointment) => {
    try {
        const startDate = new Date(appointment.start_datetime);
        const startTime = startDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        const startDateFormatted = startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const reminderMinutes = appointment.reminder_minutes_before || 1;
        const reminderText = getReminderTimeText(reminderMinutes);
        
        const subject = `Reminder: ${appointment.title} starts in ${reminderText}`;
        
        // Parse attendee emails and names from comma-separated strings
        const attendeeEmails = appointment.attendee_emails ? appointment.attendee_emails.split(',') : [];
        const attendeeNames = appointment.attendee_names ? appointment.attendee_names.split(', ') : [];
        
        // Send email to each attendee
        for (let i = 0; i < attendeeEmails.length; i++) {
            const attendeeEmail = attendeeEmails[i].trim();
            const attendeeName = attendeeNames[i] ? attendeeNames[i].trim() : 'Attendee';
            
            if (!attendeeEmail) continue;
            
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                        .header { background-color: #2c3e50; color: white; padding: 25px 30px; text-align: left; border-bottom: 3px solid #3498db; }
                        .header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px; }
                        .content { padding: 30px; background: #ffffff; }
                        .greeting { margin-bottom: 20px; font-size: 16px; color: #2c3e50; }
                        .intro-text { margin-bottom: 25px; color: #555; }
                        .appointment-box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 25px; margin: 20px 0; border-radius: 6px; }
                        .detail-row { margin: 12px 0; display: flex; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
                        .detail-row:last-child { border-bottom: none; }
                        .detail-label { font-weight: 600; color: #2c3e50; min-width: 130px; font-size: 14px; }
                        .detail-value { color: #555; font-size: 14px; }
                        .reminder-banner { background: #d9534f; color: white; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #999; font-size: 12px; background: #f8f9fa; padding: 20px; }
                        .important-note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .important-note p { margin: 0; font-size: 13px; color: #856404; }
                        .other-attendees { background: #e7f3ff; padding: 10px 15px; border-radius: 4px; margin: 15px 0; font-size: 13px; color: #2c3e50; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Appointment Reminder</h1>
                        </div>
                        <div class="content">
                            <p class="greeting">Hello ${attendeeName},</p>
                            
                            <p class="intro-text">This is a reminder that you have an upcoming appointment:</p>
                            
                            <div class="appointment-box">
                                <div class="reminder-banner">Starts in ${reminderText}</div>
                                
                                <div class="detail-row">
                                    <span class="detail-label">Title:</span>
                                    <span class="detail-value"><strong>${appointment.title}</strong></span>
                                </div>
                                
                                <div class="detail-row">
                                    <span class="detail-label">Date:</span>
                                    <span class="detail-value">${startDateFormatted}</span>
                                </div>
                                
                                <div class="detail-row">
                                    <span class="detail-label">Time:</span>
                                    <span class="detail-value">${startTime}</span>
                                </div>
                                
                                ${appointment.location ? `
                                <div class="detail-row">
                                    <span class="detail-label">Location:</span>
                                    <span class="detail-value">${appointment.location}</span>
                                </div>
                                ` : ''}
                                
                                <div class="detail-row">
                                    <span class="detail-label">Meeting With:</span>
                                    <span class="detail-value">${appointment.creator_name}</span>
                                </div>
                                
                                ${appointment.description ? `
                                <div class="detail-row" style="display: block;">
                                    <span class="detail-label">Description:</span>
                                    <span class="detail-value" style="display: block; margin-top: 5px;">${appointment.description}</span>
                                </div>
                                ` : ''}
                                
                                ${attendeeEmails.length > 1 ? `
                                <div class="other-attendees">
                                    <strong>Other Attendees:</strong> ${attendeeNames.filter(n => n !== attendeeName).join(', ')}
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="important-note">
                                <p><strong>Important:</strong> Please be ready and on time for your appointment.</p>
                            </div>
                            
                            <div class="footer">
                                <p>This is an automated message from SOKAPP System</p>
                                <p>&copy; ${new Date().getFullYear()} SOKAPP. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            console.log(`\n📧 Sending reminder to ${attendeeName} (${attendeeEmail})`);
            console.log(`   Appointment: ${appointment.title}`);
            console.log(`   Start Time: ${startTime}`);
            
            const result = await sendEmailNotification(
                attendeeEmail,
                subject,
                htmlContent
            );
            
            if (result.success) {
                console.log(`✅ Reminder sent successfully to ${attendeeName}`);
            } else {
                console.error(`❌ Failed to send reminder to ${attendeeName}: ${result.message}`);
            }
        }
        
        // Also send a copy to the creator
        console.log(`📧 Sending copy to creator: ${appointment.creator_name}`);
        const creatorSubject = `Reminder: Your appointment "${appointment.title}" starts in ${reminderText}`;
        const creatorHtmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                    .header { background-color: #2c3e50; color: white; padding: 25px 30px; text-align: left; border-bottom: 3px solid #3498db; }
                    .header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px; }
                    .content { padding: 30px; background: #ffffff; }
                    .greeting { margin-bottom: 20px; font-size: 16px; color: #2c3e50; }
                    .intro-text { margin-bottom: 25px; color: #555; }
                    .appointment-box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 25px; margin: 20px 0; border-radius: 6px; }
                    .detail-row { margin: 12px 0; display: flex; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
                    .detail-row:last-child { border-bottom: none; }
                    .detail-label { font-weight: 600; color: #2c3e50; min-width: 130px; font-size: 14px; }
                    .detail-value { color: #555; font-size: 14px; }
                    .reminder-banner { background: #d9534f; color: white; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #999; font-size: 12px; background: #f8f9fa; padding: 20px; }
                    .important-note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .important-note p { margin: 0; font-size: 13px; color: #856404; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Appointment Reminder</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Hello ${appointment.creator_name},</p>
                        
                        <p class="intro-text">This is a reminder that you have an upcoming appointment:</p>
                        
                        <div class="appointment-box">
                            <div class="reminder-banner">Starts in ${reminderText}</div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Title:</span>
                                <span class="detail-value"><strong>${appointment.title}</strong></span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${startDateFormatted}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${startTime}</span>
                            </div>
                            
                            ${appointment.location ? `
                            <div class="detail-row">
                                <span class="detail-label">Location:</span>
                                <span class="detail-value">${appointment.location}</span>
                            </div>
                            ` : ''}
                            
                            <div class="detail-row">
                                <span class="detail-label">Attendees:</span>
                                <span class="detail-value">${appointment.attendee_names || 'Multiple attendees'}</span>
                            </div>
                            
                            ${appointment.description ? `
                            <div class="detail-row" style="display: block;">
                                <span class="detail-label">Description:</span>
                                <span class="detail-value" style="display: block; margin-top: 5px;">${appointment.description}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="important-note">
                            <p><strong>Important:</strong> Please be ready and on time for your appointment.</p>
                        </div>
                        
                        <div class="footer">
                            <p>This is an automated message from SOKAPP System</p>
                            <p>&copy; ${new Date().getFullYear()} SOKAPP. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await sendEmailNotification(
            appointment.creator_email,
            creatorSubject,
            creatorHtmlContent
        );
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending appointment reminder:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Main scheduler task - runs every minute
 */
const checkAndSendReminders = async () => {
    console.log('\n===========================================');
    console.log('⏰ Running appointment reminder check...');
    console.log('Current time:', new Date().toLocaleString());
    console.log('===========================================');
    
    try {
        const appointments = await getUpcomingAppointments();
        
        if (appointments.length === 0) {
            console.log('✅ No appointments starting in the next 1-2 minutes');
            return;
        }
        
        console.log(`\n📅 Found ${appointments.length} appointment(s) to remind:`);
        
        for (const appointment of appointments) {
            await sendAppointmentReminder(appointment);
        }
        
        console.log('\n✅ Reminder check completed successfully!');
    } catch (error) {
        console.error('❌ Error in reminder scheduler:', error.message);
    }
};

/**
 * Initialize the appointment reminder scheduler
 */
const initAppointmentScheduler = () => {
    console.log('\n🚀 Initializing Appointment Reminder Scheduler...');
    console.log('===========================================');
    
    // Schedule task to run every minute at the start of the minute
    // Cron pattern: '* * * * *' = Every minute
    const scheduler = cron.schedule('* * * * *', () => {
        checkAndSendReminders();
    }, {
        scheduled: true,
        timezone: 'UTC' // You can change this to your local timezone, e.g., 'America/New_York'
    });
    
    console.log('✅ Scheduler initialized successfully!');
    console.log('📅 Reminders will be sent based on user preference (configured per appointment)');
    console.log('⏰ Scheduler runs every minute to check for upcoming appointments');
    console.log('===========================================\n');
    
    return scheduler;
};

module.exports = {
    initAppointmentScheduler,
    checkAndSendReminders,
    sendAppointmentReminder
};
