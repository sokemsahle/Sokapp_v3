const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

/**
 * Log user activity to the database
 * @param {Object} params - Activity parameters
 * @param {number} params.userId - User ID
 * @param {string} params.userEmail - User email
 * @param {string} params.userName - User full name
 * @param {number} params.roleId - Role ID
 * @param {string} params.roleName - Role name
 * @param {string} params.activityType - Type of activity (login, logout, create, update, delete, view, login_failed)
 * @param {string} params.module - Module name (e.g., Authentication, Children, Inventory)
 * @param {string} params.actionDescription - Description of the action
 * @param {string} [params.tableName] - Table name affected (optional)
 * @param {number} [params.recordId] - Record ID affected (optional)
 * @param {Object} [params.oldValues] - Old values before change (optional)
 * @param {Object} [params.newValues] - New values after change (optional)
 * @param {string} [params.ipAddress] - IP address (optional)
 * @param {string} [params.userAgent] - User agent string (optional)
 * @param {string} [params.deviceType] - Device type (Desktop, Mobile, Tablet)
 * @param {string} [params.status] - Status (success, failed, pending)
 * @param {string} [params.failureReason] - Reason for failure (optional)
 * @param {number} [params.sessionDuration] - Session duration in seconds (for logout)
 * @returns {Promise<number>} - Inserted activity ID
 */
async function logUserActivity(params) {
    const connection = await mysql.createConnection(dbConfig.dbConfig);
    
    try {
        const {
            userId,
            userEmail,
            userName,
            roleId,
            roleName,
            activityType,
            module,
            actionDescription,
            tableName = null,
            recordId = null,
            oldValues = null,
            newValues = null,
            ipAddress = null,
            userAgent = null,
            deviceType = null,
            status = 'success',
            failureReason = null,
            sessionDuration = null
        } = params;

        // Generate session ID if not provided
        const sessionId = require('uuid').v4();

        const query = `
            INSERT INTO user_activity_log (
                user_id,
                user_email,
                user_name,
                role_id,
                role_name,
                activity_type,
                module,
                action_description,
                table_name,
                record_id,
                old_values,
                new_values,
                session_id,
                ip_address,
                user_agent,
                device_type,
                status,
                failure_reason,
                activity_timestamp,
                session_duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;

        const values = [
            userId,
            userEmail,
            userName,
            roleId,
            roleName,
            activityType,
            module,
            actionDescription,
            tableName,
            recordId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            sessionId,
            ipAddress,
            userAgent,
            deviceType,
            status,
            failureReason,
            sessionDuration
        ];

        const [result] = await connection.execute(query, values);
        
        console.log(`✅ User activity logged: ${userName} - ${activityType} - ${module} - ${status}`);
        
        return result[0];
    } catch (error) {
        console.error('❌ Error logging user activity:', error.message);
        // Don't throw error - logging should not break the main functionality
        return null;
    } finally {
        await connection.end();
    }
}

module.exports = {
    logUserActivity
};
