require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Using promise version for async/await
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); // For making HTTP requests to Brevo API
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');
const { logUserActivity } = require('./utils/activityLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for Base64 images
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware (to debug issues)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize Appointment Reminder Scheduler
console.log('\n🔔 Setting up appointment reminder scheduler...');
const { initAppointmentScheduler } = require('./scheduler/appointmentReminder.scheduler');
const appointmentScheduler = initAppointmentScheduler();

// Upload middleware - now stores files in memory for database storage
const upload = require('./middleware/upload.middleware');
// Note: No longer serving static upload files since everything goes to database

// Serve React build files statically
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,          // Your specific port
    user: process.env.DB_USER || 'root',        // Replace with your database username
    password: process.env.DB_PASSWORD || '',        // Replace with your database password
    database: process.env.DB_NAME || 'sokapptest',  // Using new sokapptest database
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};
// Routes inventory
const inventoryRoutes = require('./routes/inventory.routes');
app.use('/api/inventory', inventoryRoutes);

// Attendance routes (WiFi IP-restricted clock-in/clock-out)
const attendanceRoutes = require('./routes/attendance.routes');
app.use('/api/attendance', attendanceRoutes);

// Admin organization routes (IP management)
const adminOrganizationRoutes = require('./routes/adminOrganization.routes');
app.use('/api/admin/organization', adminOrganizationRoutes);

// Notification settings routes
const notificationSettingsRoutes = require('./routes/notificationSettings.routes');
app.use('/api/notification-settings', notificationSettingsRoutes);

// Events/Appointments routes (Calendar system)
const eventRoutes = require('./routes/events.routes');
app.use('/api/events', eventRoutes);

// Lookup list routes (departments, positions, statuses)
const lookupRoutes = require('./routes/lookup.routes');
app.use('/api/lookup', lookupRoutes);

console.log('✅ Lookup API endpoint registered at /api/lookup');

// Notification seen tracking route (mark notifications as seen)
app.post('/api/notifications/:id/seen', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id: requisitionId } = req.params;
        const { user_id } = req.body; // Get user_id from request body
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required in request body'
            });
        }
        
        console.log(`Marking requisition ${requisitionId} as seen for user ${user_id}`);
        
        // Insert or update the seen status
        await connection.execute(
            `INSERT INTO user_notification_seen (user_id, requisition_id, is_seen, seen_at)
             VALUES (?, ?, TRUE, NOW())
             ON DUPLICATE KEY UPDATE is_seen = TRUE, seen_at = NOW()`,
            [user_id, requisitionId]
        );
        
        console.log(`✓ Requisition ${requisitionId} marked as seen for user ${user_id}`);
        
        res.json({
            success: true,
            message: 'Notification marked as seen'
        });
    } catch (error) {
        console.error('Error marking notification as seen:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as seen',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// ==================== EMPLOYEE API ====================

// GET all employees
app.get('/api/employees', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { program_id } = req.query;
        
        let query = `
            SELECT id, employee_id, full_name, email, phone, department, position, 
                    hire_date, salary, address, emergency_contact, emergency_phone,
                    annual_leave_days, sick_leave_days, used_annual_leave, used_sick_leave,
                    recognition, recognition_date, assigned_role, accessible_roles, visibility,
                    profile_image, program_id, created_at, is_active, status
             FROM employees`;
        
        if (program_id) {
            // When program_id is provided, get ALL staff but prioritize those in the program
            // Show staff in selected program first, then all other staff
            query += ' ORDER BY (program_id = ?) DESC, created_at DESC';
            const [rows] = await connection.execute(query, [program_id]);
            res.status(200).json({ success: true, employees: rows });
        } else {
            query += ' ORDER BY created_at DESC';
            const [rows] = await connection.execute(query);
            res.status(200).json({ success: true, employees: rows });
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET employee by email
app.get('/api/employees/by-email/:email', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email } = req.params;
        const [rows] = await connection.execute(
            `SELECT id, employee_id, full_name, email, phone, department, position, 
                    hire_date, salary, address, emergency_contact, emergency_phone,
                    annual_leave_days, sick_leave_days, used_annual_leave, used_sick_leave,
                    recognition, recognition_date, profile_image, status
             FROM employees 
             WHERE email = ?`,
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        res.status(200).json({ success: true, employee: rows[0] });
    } catch (error) {
        console.error('Error fetching employee by email:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employee', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET employee by ID
app.get('/api/employees/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const [rows] = await connection.execute(
            `SELECT id, employee_id, full_name, email, phone, department, position, 
                    hire_date, salary, address, emergency_contact, emergency_phone,
                    annual_leave_days, sick_leave_days, used_annual_leave, used_sick_leave,
                    recognition, recognition_date, assigned_role, accessible_roles, visibility,
                    profile_image, program_id, created_at, is_active, status
             FROM employees 
             WHERE id = ?`,
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        res.status(200).json({ success: true, employee: rows[0] });
    } catch (error) {
        console.error('Error fetching employee by ID:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employee', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST create new employee
app.post('/api/employees', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const {
            employeeId, fullName, email, phone, department, position, hireDate, salary,
            address, emergencyContact, emergencyPhone,
            annualLeaveDays, sickLeaveDays, usedAnnualLeave, usedSickLeave,
            recognition, recognitionDate, assigned_role, accessible_roles, visibility,
            profileImage, program_id,
            userId, userEmail, userName, roleId, roleName
        } = req.body;

        console.log('POST /api/employees received:', req.body);

        // Helper function to convert undefined to null
        const toNull = (value) => value !== undefined ? value : null;

        const [result] = await connection.execute(
            `INSERT INTO employees (
                employee_id, full_name, email, phone, department, position, hire_date, salary,
                address, emergency_contact, emergency_phone,
                annual_leave_days, sick_leave_days, used_annual_leave, used_sick_leave,
                recognition, recognition_date, assigned_role, accessible_roles, visibility, profile_image, program_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                toNull(employeeId), toNull(fullName), toNull(email), toNull(phone), 
                toNull(department), toNull(position), toNull(hireDate), toNull(salary),
                toNull(address), toNull(emergencyContact), toNull(emergencyPhone),
                annualLeaveDays || 21, sickLeaveDays || 10, usedAnnualLeave || 0, usedSickLeave || 0,
                toNull(recognition), toNull(recognitionDate), toNull(assigned_role), 
                toNull(accessible_roles), visibility || 'public',
                toNull(profileImage), toNull(program_id), 'Active'
            ]
        );

        const [newEmployee] = await connection.execute(
            `SELECT * FROM employees WHERE id = ?`,
            [result.insertId]
        );

        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'create',
                module: 'Employee Management',
                actionDescription: `Created new employee: ${fullName}`,
                tableName: 'employees',
                recordId: result.insertId,
                newValues: newEmployee[0],
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log employee creation activity:', logError);
        }

        res.status(201).json({ success: true, employee: newEmployee[0] });
    } catch (error) {
        console.error('Error creating employee:', error);
        console.error('Request body that caused error:', req.body);
        res.status(500).json({ success: false, message: 'Failed to create employee', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update employee
app.put('/api/employees/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('PUT /api/employees/:id - Request received');
        console.log('Employee ID:', req.params.id);
        console.log('Request body:', req.body);
        
        const { id } = req.params;
        const {
            employeeId, fullName, email, phone, department, position, hireDate, salary,
            address, emergencyContact, emergencyPhone,
            annualLeaveDays, sickLeaveDays, usedAnnualLeave, usedSickLeave,
            recognition, recognitionDate, assigned_role, accessible_roles, visibility,
            profileImage, is_active, program_id, status,
            userId, userEmail, userName, roleId, roleName
        } = req.body;

        // Get current employee data to preserve fields if not provided
        const [currentEmployee] = await connection.execute(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );
        
        if (currentEmployee.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        const currentIsActive = currentEmployee[0].is_active !== undefined ? currentEmployee[0].is_active : true;
        const currentStatus = currentEmployee[0].status || 'Active';

        // Helper function to convert undefined/null to null, or use existing value
        // Special handling: empty string for program_id means set to NULL (not preserve old value)
        const toNullOrDefault = (value, defaultValue) => {
            if (value === undefined || value === null) {
                return defaultValue !== undefined ? defaultValue : null;
            }
            if (value === '') {
                return null; // Empty string should set to NULL, not preserve old value
            }
            return value;
        };

        await connection.execute(
            `UPDATE employees SET
                employee_id = ?, full_name = ?, email = ?, phone = ?, department = ?, 
                position = ?, hire_date = ?, salary = ?, address = ?, 
                emergency_contact = ?, emergency_phone = ?,
                annual_leave_days = ?, sick_leave_days = ?, used_annual_leave = ?, used_sick_leave = ?,
                recognition = ?, recognition_date = ?, assigned_role = ?, accessible_roles = ?, 
                visibility = ?, profile_image = ?, is_active = ?, program_id = ?, status = ?
            WHERE id = ?`,
            [
                toNullOrDefault(employeeId, currentEmployee[0].employee_id), 
                toNullOrDefault(fullName, currentEmployee[0].full_name), 
                toNullOrDefault(email, currentEmployee[0].email), 
                toNullOrDefault(phone, currentEmployee[0].phone), 
                toNullOrDefault(department, currentEmployee[0].department), 
                toNullOrDefault(position, currentEmployee[0].position), 
                toNullOrDefault(hireDate, currentEmployee[0].hire_date), 
                toNullOrDefault(salary, currentEmployee[0].salary),
                toNullOrDefault(address, currentEmployee[0].address), 
                toNullOrDefault(emergencyContact, currentEmployee[0].emergency_contact), 
                toNullOrDefault(emergencyPhone, currentEmployee[0].emergency_phone),
                annualLeaveDays || currentEmployee[0].annual_leave_days || 21, 
                sickLeaveDays || currentEmployee[0].sick_leave_days || 10, 
                usedAnnualLeave || currentEmployee[0].used_annual_leave || 0, 
                usedSickLeave || currentEmployee[0].used_sick_leave || 0,
                toNullOrDefault(recognition, currentEmployee[0].recognition), 
                toNullOrDefault(recognitionDate, currentEmployee[0].recognition_date), 
                toNullOrDefault(assigned_role, currentEmployee[0].assigned_role), 
                toNullOrDefault(accessible_roles, currentEmployee[0].accessible_roles), 
                toNullOrDefault(visibility, currentEmployee[0].visibility || 'public'),
                toNullOrDefault(profileImage, currentEmployee[0].profile_image), 
                is_active !== undefined ? is_active : currentIsActive, 
                toNullOrDefault(program_id, currentEmployee[0].program_id), 
                status || currentStatus,
                id
            ]
        );

        const [updatedEmployee] = await connection.execute(
            `SELECT * FROM employees WHERE id = ?`,
            [id]
        );

        console.log('Employee updated successfully:', updatedEmployee[0]);
        console.log('Program ID - Request:', program_id, '| Current:', currentEmployee[0].program_id, '| Updated:', updatedEmployee[0].program_id);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'update',
                module: 'Employee Management',
                actionDescription: `Updated employee: ${fullName}`,
                tableName: 'employees',
                recordId: parseInt(id),
                oldValues: currentEmployee[0],
                newValues: updatedEmployee[0],
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log employee update activity:', logError);
        }
        
        res.status(200).json({ success: true, employee: updatedEmployee[0] });
    } catch (error) {
        console.error('Error updating employee:', error);
        console.error('Request body that caused error:', req.body);
        res.status(500).json({ success: false, message: 'Failed to update employee', error: error.message });
    } finally {
        await connection.end();
    }
});

// DELETE employee
app.delete('/api/employees/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        
        // Get employee data before deletion
        const [employeeToDelete] = await connection.execute(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );
        
        if (employeeToDelete.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        await connection.execute('DELETE FROM employees WHERE id = ?', [id]);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'delete',
                module: 'Employee Management',
                actionDescription: `Deleted employee: ${employeeToDelete[0].full_name}`,
                tableName: 'employees',
                recordId: parseInt(id),
                oldValues: employeeToDelete[0],
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log employee deletion activity:', logError);
        }
        
        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, message: 'Failed to delete employee', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update employee profile image only
app.put('/api/employees/:id/profile-image', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { profileImage } = req.body;

        await connection.execute(
            'UPDATE employees SET profile_image = ? WHERE id = ?',
            [profileImage || null, id]
        );

        res.status(200).json({ success: true, message: 'Profile image updated successfully' });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile image', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST upload employee profile photo (stores as Base64 in database)
app.post('/api/employees/:id/upload-photo', upload.single('profilePhoto'), async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Convert file to Base64 string for database storage
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        
        // Create data URL format: data:mimeType;base64,base64String
        const imageData = `data:${mimeType};base64,${base64Image}`;

        // Update the employee's profile photo with Base64 data
        await connection.execute(
            'UPDATE employees SET profile_image = ? WHERE id = ?',
            [imageData, id]
        );

        res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: {
                profileImage: imageData,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: mimeType
            }
        });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile photo',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// POST upload employee documents
app.post('/api/employees/:id/documents', upload.single('file'), async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { name, type, issue_date, expiry_date, notes } = req.body;
        
        // Validate required fields
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Document name and type are required'
            });
        }

        // Check if employee exists
        const [employee] = await connection.execute(
            'SELECT id FROM employees WHERE id = ?',
            [id]
        );
        
        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Prepare document data
        let fileData = null;
        let fileName = null;
        let fileSize = null;
        let mimeType = null;

        // If file is uploaded, convert to Base64
        if (req.file) {
            const base64File = req.file.buffer.toString('base64');
            mimeType = req.file.mimetype;
            // Create data URL format: data:mimeType;base64,base64String
            fileData = `data:${mimeType};base64,${base64File}`;
            fileName = req.file.originalname;
            fileSize = req.file.size;
        }

        // Insert document into database
        const [result] = await connection.execute(
            `INSERT INTO employee_documents 
             (employee_id, name, type, file, file_name, file_size, mime_type, issue_date, expiry_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                name,
                type,
                fileData,
                fileName,
                fileSize,
                mimeType,
                issue_date || null,
                expiry_date || null,
                notes || null
            ]
        );

        // Fetch the newly created document
        const [newDocument] = await connection.execute(
            'SELECT * FROM employee_documents WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document: newDocument[0]
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// GET employee documents
app.get('/api/employees/:id/documents', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        
        // Check if employee exists
        const [employee] = await connection.execute(
            'SELECT id FROM employees WHERE id = ?',
            [id]
        );
        
        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Fetch all active documents for this employee
        const [documents] = await connection.execute(
            'SELECT * FROM employee_documents WHERE employee_id = ? AND is_active = TRUE ORDER BY upload_date DESC',
            [id]
        );

        res.status(200).json({
            success: true,
            documents: documents
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// DELETE employee document
app.delete('/api/employees/:employeeId/documents/:documentId', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { employeeId, documentId } = req.params;
        
        // Check if document exists
        const [document] = await connection.execute(
            'SELECT * FROM employee_documents WHERE id = ? AND employee_id = ?',
            [documentId, employeeId]
        );
        
        if (document.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Soft delete - set is_active to FALSE
        await connection.execute(
            'UPDATE employee_documents SET is_active = FALSE WHERE id = ?',
            [documentId]
        );

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

// ==================== ROLE-BASED ACCESS API ====================

// GET employees accessible by a specific role
app.get('/api/employees/by-role/:role', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { role } = req.params;
        
        const [rows] = await connection.execute(
            `SELECT * FROM employees 
             WHERE visibility = 'public' 
                OR assigned_role = ? 
                OR JSON_CONTAINS(accessible_roles, ?)
             ORDER BY created_at DESC`,
            [role, JSON.stringify(role)]
        );
        
        res.status(200).json({ success: true, employees: rows });
    } catch (error) {
        console.error('Error fetching employees by role:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update employee role assignment
app.put('/api/employees/:id/role-assignment', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { assigned_role, accessible_roles, visibility } = req.body;

        await connection.execute(
            `UPDATE employees SET 
                assigned_role = ?, 
                accessible_roles = ?, 
                visibility = ? 
            WHERE id = ?`,
            [assigned_role, accessible_roles, visibility, id]
        );

        const [updatedEmployee] = await connection.execute(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );

        res.status(200).json({ success: true, employee: updatedEmployee[0] });
    } catch (error) {
        console.error('Error updating employee role assignment:', error);
        res.status(500).json({ success: false, message: 'Failed to update role assignment', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET requisitions accessible by a specific role
app.get('/api/requisitions/by-role/:role', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { role } = req.params;
        
        const [rows] = await connection.execute(
            `SELECT r.*, ri.description as item_description, ri.quantity, ri.unit_price, ri.total_price
             FROM requisitions r
             LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
             WHERE r.visibility = 'public' 
                OR r.assigned_role = ? 
                OR JSON_CONTAINS(r.accessible_roles, ?)
             ORDER BY r.created_at DESC`,
            [role, JSON.stringify(role)]
        );
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching requisitions by role:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update requisition role assignment
app.put('/api/requisitions/:id/role-assignment', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { assigned_role, accessible_roles, visibility } = req.body;

        await connection.execute(
            `UPDATE requisitions SET 
                assigned_role = ?, 
                accessible_roles = ?, 
                visibility = ? 
            WHERE id = ?`,
            [assigned_role, accessible_roles, visibility, id]
        );

        res.status(200).json({ success: true, message: 'Role assignment updated' });
    } catch (error) {
        console.error('Error updating requisition role assignment:', error);
        res.status(500).json({ success: false, message: 'Failed to update role assignment', error: error.message });
    } finally {
        await connection.end();
    }
});

// ==================== FORMS MANAGEMENT API ====================

// GET all forms
app.get('/api/forms', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM forms ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, forms: rows });
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch forms', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST create new form
app.post('/api/forms', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { name, description, is_active, allowed_roles } = req.body;
        
        const [result] = await connection.execute(
            'INSERT INTO forms (name, description, is_active, allowed_roles) VALUES (?, ?, ?, ?)',
            [name, description, is_active, allowed_roles]
        );

        const [newForm] = await connection.execute(
            'SELECT * FROM forms WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({ success: true, form: newForm[0] });
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ success: false, message: 'Failed to create form', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update form status
app.put('/api/forms/:id/status', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await connection.execute(
            'UPDATE forms SET is_active = ? WHERE id = ?',
            [is_active, id]
        );

        const [updatedForm] = await connection.execute(
            'SELECT * FROM forms WHERE id = ?',
            [id]
        );

        res.status(200).json({ success: true, form: updatedForm[0] });
    } catch (error) {
        console.error('Error updating form status:', error);
        res.status(500).json({ success: false, message: 'Failed to update form status', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update form roles
app.put('/api/forms/:id/roles', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { allowed_roles } = req.body;

        await connection.execute(
            'UPDATE forms SET allowed_roles = ? WHERE id = ?',
            [allowed_roles, id]
        );

        const [updatedForm] = await connection.execute(
            'SELECT * FROM forms WHERE id = ?',
            [id]
        );

        res.status(200).json({ success: true, form: updatedForm[0] });
    } catch (error) {
        console.error('Error updating form roles:', error);
        res.status(500).json({ success: false, message: 'Failed to update form roles', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET forms accessible by a specific role
app.get('/api/forms/accessible/:role', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { role } = req.params;
        
        const [rows] = await connection.execute(
            'SELECT * FROM forms WHERE is_active = TRUE AND JSON_CONTAINS(allowed_roles, ?)',
            [JSON.stringify(role)]
        );
        
        res.status(200).json({ success: true, forms: rows });
    } catch (error) {
        console.error('Error fetching accessible forms:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch accessible forms', error: error.message });
    } finally {
        await connection.end();
    }
});

// API Route to Handle Requisition Submission
app.post('/api/requisition', async (req, res) => {
    console.log('=== POST /api/requisition called ===');
    // 1. Establish a specific connection for this transaction
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connection established');

    try {
        // Start the transaction
        await connection.beginTransaction();

        const { requestor, department, date, description, items, signature, requestedBy, reviewedBy, approvedBy, authorizedBy, approvedSignature, authorizedSignature, reviewedSignature, program_id } = req.body;

        // Calculate grand total from items
        const grandTotal = items && Array.isArray(items) ? items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0) : 0;

        // Get user info from request (if available)
        const { userId, userEmail } = req.body;

        console.log('POST /api/requisition received:', req.body);

        // Helper function to convert undefined to null
        const toNull = (value) => value !== undefined ? value : null;
        
        // Generate a unique ID for the requisition
        const uniqueId = uuidv4();
        
        // 2. Insert the Main Requisition Header - try with unique_id first, fall back to without if column doesn't exist
        let headerResult;
        try {
          // Try inserting with unique_id column
          [headerResult] = await connection.execute(
              'INSERT INTO requisitions (requestor_name, requestor_email, user_id, department, purpose, request_date, signature_data, requested_by, reviewed_by, approved_by, authorized_by, approved_signature, authorized_signature, reviewed_signature, grand_total, status, unique_id, program_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [toNull(requestor), toNull(userEmail || requestor), toNull(userId), toNull(department), toNull(description), toNull(date), toNull(signature), toNull(requestedBy), toNull(reviewedBy), toNull(approvedBy), toNull(authorizedBy), toNull(approvedSignature), toNull(authorizedSignature), toNull(reviewedSignature), grandTotal, approvedSignature && authorizedSignature ? 'authorized' : 'pending', uniqueId, toNull(program_id)]
          );
        } catch (insertError) {
          if (insertError.code === 'ER_BAD_FIELD_ERROR' && insertError.message.includes('unique_id')) {
            // unique_id column doesn't exist, insert without it
            [headerResult] = await connection.execute(
                'INSERT INTO requisitions (requestor_name, requestor_email, user_id, department, purpose, request_date, signature_data, requested_by, reviewed_by, approved_by, authorized_by, approved_signature, authorized_signature, reviewed_signature, grand_total, status, program_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [toNull(requestor), toNull(userEmail || requestor), toNull(userId), toNull(department), toNull(description), toNull(date), toNull(signature), toNull(requestedBy), toNull(reviewedBy), toNull(approvedBy), toNull(authorizedBy), toNull(approvedSignature), toNull(authorizedSignature), toNull(reviewedSignature), grandTotal, approvedSignature && authorizedSignature ? 'authorized' : 'pending', toNull(program_id)]
            );
          } else {
            throw insertError; // Re-throw if it's a different error
          }
        }
                
        const requisitionId = headerResult.insertId; // Get the ID of the new row
                
        // Send email notification to all active reviewers from requisition_roles table
        console.log('=== SENDING EMAIL TO REVIEWERS ===');
        console.log('Attempting to fetch active reviewers from database...');
                
        try {
            // Debug: Check if requisition_roles table exists and has data
            const [tableCheck] = await connection.execute(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'requisition_roles'",
                [dbConfig.database]
            );
            
            if (tableCheck.length === 0) {
                console.error('❌ requisition_roles table does not exist!');
            } else {
                console.log('✓ requisition_roles table exists');
                
                // Check what roles exist
                const [allRolesCheck] = await connection.execute(
                    'SELECT user_id, role_type, is_active FROM requisition_roles'
                );
                console.log('All requisition roles in database:', allRolesCheck);
            }
            
            // Fetch all active reviewers from requisition_roles table
            const [reviewers] = await connection.execute(
                'SELECT u.email, u.full_name FROM requisition_roles rr ' +
                'JOIN users u ON rr.user_id = u.id ' +
                'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
                ['reviewer', true, true]
            );
                    
            console.log(`Query result: Found ${reviewers ? reviewers.length : 0} active reviewers`);
            
            if (reviewers && reviewers.length > 0) {
                console.log(`✓ Found ${reviewers.length} active reviewers:`);
                reviewers.forEach((r, i) => console.log(`  ${i+1}. ${r.full_name} (${r.email})`));
                        
                // Get the unique identifier for the requisition
                let uniqueIdentifier = requisitionId;
                                
                try {
                    // Try to get the unique_id if it exists in the requisitions table
                    const [requisitionRows] = await connection.execute(
                        'SELECT unique_id FROM requisitions WHERE id = ?',
                        [requisitionId]
                    );
                                    
                    if (requisitionRows.length > 0 && requisitionRows[0].unique_id) {
                        uniqueIdentifier = requisitionRows[0].unique_id;
                    } else {
                        // If unique_id column doesn't exist, use the regular id
                        uniqueIdentifier = requisitionId;
                    }
                } catch (error) {
                    // If unique_id column doesn't exist, use the regular id
                    if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('unique_id')) {
                        uniqueIdentifier = requisitionId;
                        console.log('unique_id column not found, using regular id for URL');
                    } else {
                        // Re-throw if it's a different error
                        throw error;
                    }
                }
                        
                for (const reviewer of reviewers) {
                    console.log(`\n=== Processing Reviewer Email ===`);
                    console.log(`Recipient: ${reviewer.email} (${reviewer.full_name})`);
                    console.log(`Requisition ID: ${requisitionId}`);
                    console.log(`Unique Identifier: ${uniqueIdentifier}`);
                    
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    console.log(`Frontend URL: ${frontendUrl}`);
                    
                    const htmlContent = `
                        <html>
                        <head><style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
                            .content { margin: 20px 0; }
                            .footer { margin-top: 20px; font-size: 12px; color: #666; }
                            .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                        </style></head>
                        <body>
                            <div class="header">
                                <h2>New Requisition Created</h2>
                            </div>
                            <div class="content">
                                <p>Hello ${reviewer.full_name || 'Reviewer'},</p>
                                <p>A new requisition has been created and requires your review:</p>
                                <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                                <p><strong>Requestor:</strong> ${requestor}</p>
                                <p><strong>Department:</strong> ${department}</p>
                                <p><strong>Purpose:</strong> ${description}</p>
                                <p>Please click the button below to review this requisition:</p>
                                <a href="${frontendUrl}/requisitions/${uniqueIdentifier}" class="button">Review Requisition</a>
                                <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${uniqueIdentifier}">${frontendUrl}/requisitions/${uniqueIdentifier}</a></p>
                            </div>
                            <div class="footer">
                                <p>This is an automated notification from SOKAPP Requisition System.</p>
                            </div>
                        </body>
                        </html>
                    `;
                            
                    console.log(`Calling sendEmailNotification function...`);
                    console.log(`Subject: New Requisition Requires Review - #${requisitionId}`);
                    
                    const emailResult = await sendEmailNotification(
                        reviewer.email,
                        `New Requisition Requires Review - #${requisitionId}`,
                        htmlContent
                    );
                            
                    if (emailResult.success) {
                        console.log(`✅ Email sent successfully to ${reviewer.email} (${reviewer.full_name})`);
                        console.log(`Message ID: ${emailResult.messageId || 'N/A'}`);
                    } else {
                        console.error(`❌ Failed to send email to ${reviewer.email}:`, emailResult.message);
                    }
                }
            } else {
                console.warn('⚠️  No active reviewers found in requisition_roles table');
                // Only log available roles when there are no reviewers to help debug
                const [allRoles] = await connection.execute('SELECT user_id, role_type, is_active FROM requisition_roles');
                console.log('All requisition roles in database:', allRoles);
                
                // Additional debug: Check users table
                const [activeUsers] = await connection.execute(
                    'SELECT id, email, full_name, is_active FROM users WHERE is_active = TRUE'
                );
                console.log('Active users in database:', activeUsers.length);
                if (activeUsers.length > 0) {
                    console.log('Sample active users:', activeUsers.slice(0, 5));
                }
            }
        } catch (notificationError) {
            console.error('❌ Error sending reviewer notifications:', notificationError);
            console.error('Stack trace:', notificationError.stack);
            // Don't fail the entire request if notification fails, just log the error
        }

        // 3. Insert all Items associated with this Requisition
        //  use a loop to insert each item linked to the requisitionId
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await connection.execute(
                    'INSERT INTO requisition_items (requisition_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [requisitionId, toNull(item.description), toNull(item.quantity), toNull(item.price), toNull(item.total)]
                );
            }
        }

        // 4. Commit the transaction (Save changes)
        await connection.commit();

        console.log(`Requisition #${requisitionId} created successfully.`);
        
        // Log activity
        try {
            const { userId, userEmail, userName, roleId, roleName } = req.body;
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'create',
                module: 'Requisition Management',
                actionDescription: `Created new requisition #${requisitionId}`,
                tableName: 'requisitions',
                recordId: requisitionId,
                newValues: {
                    requestor_name: requestor,
                    department,
                    purpose: description,
                    grand_total: grandTotal,
                    items_count: items ? items.length : 0
                },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log requisition creation activity:', logError);
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Requisition submitted successfully', 
            id: requisitionId 
        });

    } catch (error) {
        // If anything goes wrong, Rollback (Undo) changes
        await connection.rollback();
        console.error('Transaction Failed:', error);
        console.error('Request body that caused error:', req.body);
        res.status(500).json({ success: false, message: 'Failed to submit requisition', error: error.message });
    } finally {
        // Close the connection
        await connection.end();
    }
});

// GET endpoint to fetch all requisitions
app.get('/api/requisitions', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { since } = req.query;
        
        let query = `SELECT id, requestor_name, department, purpose, request_date, status, grand_total, 
                            assigned_role, accessible_roles, visibility, created_at 
                     FROM requisitions`;
        let params = [];
        
        if (since) {
            query += ` WHERE created_at > ?`;
            params.push(since);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const [rows] = await connection.execute(query, params);
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch unsigned/unprocessed requisitions (for notifications)
app.get('/api/requisitions/unsigned', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { unseen, user_id } = req.query;
        
        console.log('GET /api/requisitions/unsigned - Params:', { unseen, user_id });
        
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }
        
        // First, check what requisition roles this user has
        const [roles] = await connection.execute(
            `SELECT role_type FROM requisition_roles WHERE user_id = ? AND is_active = TRUE`,
            [user_id]
        );
        
        const userRoles = roles.map(r => r.role_type);
        console.log('User requisition roles:', userRoles);
        
        // If user has no requisition roles, return empty array
        if (userRoles.length === 0) {
            console.log('User has no requisition roles - returning empty array');
            return res.status(200).json({ success: true, requisitions: [] });
        }
        
        let query;
        let rows;
        
        if (unseen === 'true') {
            // Only fetch unseen notifications for users WITH roles
            console.log('Fetching UNSEEN notifications for user with roles:', userRoles);
            
            // Build role-specific conditions
            const roleConditions = [];
            if (userRoles.includes('reviewer')) {
                roleConditions.push('(r.signature_data IS NOT NULL AND r.reviewed_signature IS NULL)');
            }
            if (userRoles.includes('approver')) {
                roleConditions.push('(r.reviewed_signature IS NOT NULL AND r.approved_signature IS NULL)');
            }
            if (userRoles.includes('authorizer')) {
                roleConditions.push('(r.approved_signature IS NOT NULL AND r.authorized_signature IS NULL)');
            }
            
            const whereClause = roleConditions.join(' OR ');
            
            // If no role conditions, return empty array
            if (!whereClause || whereClause.trim() === '') {
                console.log('No role conditions matched - returning empty array');
                return res.status(200).json({ success: true, requisitions: [] });
            }
            
            query = `
                SELECT r.id, r.requestor_name, r.department, r.purpose, r.request_date, r.status, 
                       r.signature_data, r.reviewed_signature, r.approved_signature, r.authorized_signature,
                       r.created_at 
                FROM requisitions r
                LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = ?
                WHERE (uns.is_seen = FALSE OR uns.is_seen IS NULL)
                AND (${whereClause})
                ORDER BY r.created_at DESC
            `;
            console.log('Role-specific query:', query);
            console.log('Query params:', [user_id]);
            [rows] = await connection.execute(query, [user_id]);
            console.log('Found', rows.length, 'unseen requisitions for user roles');
        } else {
            // Fetch all unsigned requisitions for users WITH roles
            console.log('Fetching ALL unsigned requisitions for user with roles:', userRoles);
            
            // Build role-specific conditions
            const roleConditions = [];
            if (userRoles.includes('reviewer')) {
                roleConditions.push('(r.signature_data IS NOT NULL AND r.reviewed_signature IS NULL)');
            }
            if (userRoles.includes('approver')) {
                roleConditions.push('(r.reviewed_signature IS NOT NULL AND r.approved_signature IS NULL)');
            }
            if (userRoles.includes('authorizer')) {
                roleConditions.push('(r.approved_signature IS NOT NULL AND r.authorized_signature IS NULL)');
            }
            
            const whereClause = roleConditions.join(' OR ');
            
            // If no role conditions, return empty array
            if (!whereClause || whereClause.trim() === '') {
                console.log('No role conditions matched - returning empty array');
                return res.status(200).json({ success: true, requisitions: [] });
            }
            
            query = `
                SELECT id, requestor_name, department, purpose, request_date, status, 
                       signature_data, reviewed_signature, approved_signature, authorized_signature,
                       created_at 
                FROM requisitions 
                WHERE ${whereClause}
                ORDER BY created_at DESC
            `;
            console.log('All unsigned query:', query);
            [rows] = await connection.execute(query);
            console.log('Found', rows.length, 'total unsigned requisitions for user roles');
        }
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching unsigned requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch authorized requisitions (for requester notifications)
app.get('/api/requisitions/authorized', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, unseen, user_id } = req.query;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        let query;
        if (unseen === 'true' && user_id) {
            // Only fetch unseen notifications
            query = `
                SELECT r.id, r.requestor_name, r.requestor_email, r.department, r.purpose, r.request_date, r.status, 
                       r.grand_total, r.created_at 
                FROM requisitions r
                LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = ?
                WHERE r.status = 'authorized' 
                  AND r.requestor_email = ?
                  AND (uns.is_seen = FALSE OR uns.is_seen IS NULL)
                ORDER BY r.created_at DESC
            `;
            const [rows] = await connection.execute(query, [user_id, email]);
        } else {
            // Fetch all authorized requisitions
            query = `
                SELECT id, requestor_name, requestor_email, department, purpose, request_date, status, 
                       grand_total, created_at 
                FROM requisitions 
                WHERE status = 'authorized' 
                  AND requestor_email = ?
                ORDER BY created_at DESC
            `;
            const [rows] = await connection.execute(query, [email]);
        }
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching authorized requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// Alias for /authorized endpoint (for frontend compatibility)
app.get('/api/requisitions/finalized', async (req, res) => {
    // Forward to authorized endpoint - copy the logic directly
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, unseen, user_id } = req.query;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email parameter required' });
        }
        
        let query;
        let rows;
        
        if (unseen === 'true' && user_id) {
            // Only fetch unseen finalized requisitions
            query = `
                SELECT r.id, r.requestor_name, r.department, r.purpose, r.request_date, r.status, 
                       r.signature_data, r.reviewed_signature, r.approved_signature, r.authorized_signature,
                       r.created_at 
                FROM requisitions r
                LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = ?
                WHERE r.requestor_email = ?
                AND (uns.is_seen = FALSE OR uns.is_seen IS NULL)
                AND r.status = 'authorized'
                ORDER BY r.created_at DESC
            `;
            [rows] = await connection.execute(query, [user_id, email]);
        } else {
            query = `
                SELECT id, requestor_name, department, purpose, request_date, status, 
                       signature_data, reviewed_signature, approved_signature, authorized_signature,
                       created_at 
                FROM requisitions 
                WHERE requestor_email = ? AND status = 'authorized'
                ORDER BY created_at DESC
            `;
            [rows] = await connection.execute(query, [email]);
        }
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching finalized requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch rejected requisitions (for requester notifications)
app.get('/api/requisitions/rejected', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, unseen, user_id } = req.query;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email parameter required' });
        }
        
        let query;
        let rows;
        
        if (unseen === 'true' && user_id) {
            // Only fetch unseen rejected requisitions
            query = `
                SELECT r.id, r.requestor_name, r.requestor_email, r.department, r.purpose, r.request_date, 
                       r.status, r.rejection_note, r.rejected_by, r.rejected_at, r.grand_total, r.created_at 
                FROM requisitions r
                LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = ?
                WHERE r.requestor_email = ?
                AND (uns.is_seen = FALSE OR uns.is_seen IS NULL)
                AND r.status = 'rejected'
                ORDER BY r.created_at DESC
            `;
            [rows] = await connection.execute(query, [user_id, email]);
        } else {
            query = `
                SELECT r.id, r.requestor_name, r.requestor_email, r.department, r.purpose, r.request_date, 
                       r.status, r.rejection_note, r.rejected_by, r.rejected_at, r.grand_total, r.created_at 
                FROM requisitions r
                WHERE r.requestor_email = ? AND r.status = 'rejected'
                ORDER BY r.created_at DESC
            `;
            [rows] = await connection.execute(query, [email]);
        }
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching rejected requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch requisitions by user email (for standard users)
app.get('/api/requisitions/my', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const [rows] = await connection.execute(
            `SELECT id, requestor_name, requestor_email, department, purpose, request_date, status, created_at 
             FROM requisitions 
             WHERE requestor_email = ?
             ORDER BY created_at DESC`,
            [email]
        );
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching user requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch a single requisition with its items (with email validation)
app.get('/api/requisition/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const requisitionId = req.params.id;
        const { email, userId } = req.query; // Get user email from query parameter
        
        console.log('GET /api/requisition/:id - ID:', requisitionId, 'Email:', email, 'User ID:', userId);
        
        // Fetch requisition header
        const [requisitionRows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        
        if (requisitionRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Requisition not found' });
        }
        
        const requisition = requisitionRows[0];
        
        // SECURITY CHECK: Verify email matches requestor_email (unless admin)
        // First, check if user is admin by looking up their user record
        let isAdmin = false;
        if (userId) {
            const [userRows] = await connection.execute(
                'SELECT is_admin FROM users WHERE id = ?',
                [userId]
            );
            if (userRows.length > 0) {
                isAdmin = userRows[0].is_admin === 1 || userRows[0].is_admin === true || userRows[0].is_admin === '1';
            }
        }
        
        // Allow access if: no email provided OR email matches OR user is admin
        if (email && email !== requisition.requestor_email && !isAdmin) {
            console.warn('⚠️ Access denied: Email mismatch. Requested by:', email, 'Requisition owner:', requisition.requestor_email);
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: You can only view your own requisitions' 
            });
        }
        
        if (isAdmin && email !== requisition.requestor_email) {
            console.log('✓ Admin access granted for requisition:', requisitionId);
        }
        
        // Fetch requisition items
        const [itemsRows] = await connection.execute(
            'SELECT * FROM requisition_items WHERE requisition_id = ?',
            [requisitionId]
        );
        
        console.log('✓ Requisition fetched successfully for email:', email);
        res.status(200).json({ 
            success: true, 
            data: {
                ...requisition,
                items: itemsRows
            }
        });
    } catch (error) {
        console.error('Error fetching requisition:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisition', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch user's requisition roles
app.get('/api/user/requisition-roles', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        // First get user ID from email
        const [userRows] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const userId = userRows[0].id;
        
        // Fetch user's requisition roles
        const [rolesRows] = await connection.execute(
            'SELECT role_type FROM requisition_roles WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );
        
        const roles = rolesRows.map(row => row.role_type);
        
        res.status(200).json({
            success: true,
            roles: roles
        });
    } catch (error) {
        console.error('Error fetching user requisition roles:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user roles', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT endpoint to update a requisition
app.put('/api/requisition/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        
        const requisitionId = req.params.id;
        console.log('\n=== RECEIVING REQUISITION UPDATE ===');
        console.log('Requisition ID:', requisitionId);
        console.log('Request body keys:', Object.keys(req.body));
        console.log('reviewedSignature in body (camelCase):', req.body.reviewedSignature ? 'EXISTS' : 'MISSING');
        console.log('reviewed_signature in body (snake_case):', req.body.reviewed_signature ? 'EXISTS' : 'MISSING');
        console.log('approvedSignature in body (camelCase):', req.body.approvedSignature ? 'EXISTS' : 'MISSING');
        console.log('approved_signature in body (snake_case):', req.body.approved_signature ? 'EXISTS' : 'MISSING');
        console.log('authorizedSignature in body (camelCase):', req.body.authorizedSignature ? 'EXISTS' : 'MISSING');
        console.log('authorized_signature in body (snake_case):', req.body.authorized_signature ? 'EXISTS' : 'MISSING');
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        
        // Support both camelCase and snake_case for signature fields (frontend compatibility)
        const { requestor, department, date, description, items, signature, requestedBy, reviewedBy, approvedBy, authorizedBy, program_id } = req.body;
        const reviewedSignature = req.body.reviewedSignature || req.body.reviewed_signature;
        const approvedSignature = req.body.approvedSignature || req.body.approved_signature;
        const authorizedSignature = req.body.authorizedSignature || req.body.authorized_signature;
        
        // Helper function to convert undefined to null
        const toNull = (value) => value !== undefined ? value : null;
        
        // Calculate grand total from items
        const grandTotal = items && Array.isArray(items) ? items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0) : 0;
        
        // Fetch the ORIGINAL requisition BEFORE updating to preserve existing data
        const [originalRequisitionRows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        const originalRequisition = originalRequisitionRows[0];
        
        // Check which signatures are being ADDED in this request (were null before)
        // This must be done BEFORE updating the database
        const isNewReview = !originalRequisition.reviewed_signature && reviewedSignature;
        const isNewApproval = !originalRequisition.approved_signature && approvedSignature;
        const isNewAuthorization = !originalRequisition.authorized_signature && authorizedSignature;
        
        console.log('DEBUG: Checking signatures BEFORE database update...');
        console.log('DEBUG: Original reviewed_signature =', originalRequisition.reviewed_signature ? 'EXISTS' : 'NULL');
        console.log('DEBUG: New review signature in request?', !!reviewedSignature);
        console.log('DEBUG: Will trigger approver notification?', isNewReview);
        console.log('DEBUG: Original approved_signature =', originalRequisition.approved_signature ? 'EXISTS' : 'NULL');
        console.log('DEBUG: New approval signature in request?', !!approvedSignature);
        console.log('DEBUG: Will trigger authorizer notification?', isNewApproval);
        console.log('DEBUG: Original authorized_signature =', originalRequisition.authorized_signature ? 'EXISTS' : 'NULL');
        console.log('DEBUG: New authorization signature in request?', !!authorizedSignature);
        console.log('DEBUG: Will trigger finalization?', isNewAuthorization);
        
        // IMPORTANT: Preserve existing data - only update fields that are sent in the request
        // Use original values for fields not included in the request body
        const updateData = {
            requestor_name: requestor !== undefined ? requestor : originalRequisition.requestor_name,
            department: department !== undefined ? department : originalRequisition.department,
            purpose: description !== undefined ? description : originalRequisition.purpose,
            request_date: date !== undefined ? date : originalRequisition.request_date,
            signature_data: signature !== undefined ? signature : originalRequisition.signature_data,
            requested_by: requestedBy !== undefined ? requestedBy : originalRequisition.requested_by,
            reviewed_by: reviewedBy !== undefined ? reviewedBy : originalRequisition.reviewed_by,
            approved_by: approvedBy !== undefined ? approvedBy : originalRequisition.approved_by,
            authorized_by: authorizedBy !== undefined ? authorizedBy : originalRequisition.authorized_by,
            approved_signature: approvedSignature !== undefined ? approvedSignature : originalRequisition.approved_signature,
            authorized_signature: authorizedSignature !== undefined ? authorizedSignature : originalRequisition.authorized_signature,
            reviewed_signature: reviewedSignature !== undefined ? reviewedSignature : originalRequisition.reviewed_signature,
            grand_total: grandTotal || originalRequisition.grand_total,
            program_id: program_id !== undefined ? program_id : originalRequisition.program_id
        };
        
        // Determine new status based on signatures
        let newStatus = originalRequisition.status;
        if (approvedSignature && authorizedSignature) {
            newStatus = 'authorized';
        } else if (approvedSignature && !authorizedSignature) {
            newStatus = 'approved';
        } else if (reviewedSignature && !approvedSignature) {
            newStatus = 'reviewed';
        }
        
        console.log('DEBUG: Update data prepared - preserving existing values for missing fields');
        
        // Update requisition with preserved data
        await connection.execute(
            'UPDATE requisitions SET requestor_name = ?, department = ?, purpose = ?, request_date = ?, signature_data = ?, requested_by = ?, reviewed_by = ?, approved_by = ?, authorized_by = ?, approved_signature = ?, authorized_signature = ?, reviewed_signature = ?, grand_total = ?, status = ?, program_id = ? WHERE id = ?',
            [
                updateData.requestor_name,
                updateData.department,
                updateData.purpose,
                updateData.request_date,
                updateData.signature_data,
                updateData.requested_by,
                updateData.reviewed_by,
                updateData.approved_by,
                updateData.authorized_by,
                updateData.approved_signature,
                updateData.authorized_signature,
                updateData.reviewed_signature,
                updateData.grand_total,
                newStatus,
                updateData.program_id,
                requisitionId
            ]
        );
        
        // Fetch the updated requisition for email content (after signatures are saved)
        const [updatedRequisitionRows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        const updatedRequisition = updatedRequisitionRows[0];
        
        console.log('DEBUG: Requisition data preserved successfully');
        console.log('DEBUG: requestor_name =', updatedRequisition.requestor_name);
        console.log('DEBUG: department =', updatedRequisition.department);
        console.log('DEBUG: purpose =', updatedRequisition.purpose);
        
        // NOW send workflow notifications based on what we determined BEFORE the update
        // Workflow Stage 1: Reviewer signed → Notify Approvers
        if (isNewReview) {
            console.log('✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...');
            
            try {
                console.log('Fetching active approvers from database...');
                const [approvers] = await connection.execute(
                    'SELECT u.email, u.full_name FROM requisition_roles rr ' +
                    'JOIN users u ON rr.user_id = u.id ' +
                    'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
                    ['approver', true, true]
                );
                
                console.log(`Found ${approvers ? approvers.length : 0} active approvers`);
                
                if (approvers && approvers.length > 0) {
                    for (const approver of approvers) {
                        console.log(`Processing approver: ${approver.full_name} (${approver.email})`);
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                        const htmlContent = `
                            <html>
                            <head><style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
                                .content { margin: 20px 0; }
                                .footer { margin-top: 20px; font-size: 12px; color: #666; }
                                .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                            </style></head>
                            <body>
                                <div class="header">
                                    <h2>Requisition Awaiting Approval</h2>
                                </div>
                                <div class="content">
                                    <p>Hello ${approver.full_name || 'Approver'},</p>
                                    <p>A requisition has been reviewed and is awaiting your approval:</p>
                                    <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                                    <p><strong>Requestor:</strong> ${updatedRequisition.requestor_name}</p>
                                    <p><strong>Department:</strong> ${updatedRequisition.department}</p>
                                    <p><strong>Purpose:</strong> ${updatedRequisition.purpose}</p>
                                    <p>Please click the button below to review and approve this requisition:</p>
                                    <a href="${frontendUrl}/requisitions/${requisitionId}" class="button">Approve Requisition</a>
                                    <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisitionId}">${frontendUrl}/requisitions/${requisitionId}</a></p>
                                </div>
                                <div class="footer">
                                    <p>This is an automated notification from SOKAPP Requisition System.</p>
                                </div>
                            </body>
                            </html>
                        `;
                        
                        console.log(`Attempting to send approval notification to: ${approver.email} (${approver.full_name})`);
                        const emailResult = await sendEmailNotification(
                            approver.email,
                            `Requisition Awaiting Approval - #${requisitionId}`,
                            htmlContent
                        );
                        
                        if (emailResult.success) {
                            console.log(`✓ Approval notification sent successfully to ${approver.email} (${approver.full_name})`);
                        } else {
                            console.error(`✗ Failed to send approval notification to ${approver.email}:`, emailResult.message);
                        }
                    }
                } else {
                    console.warn('⚠️  No active approvers found in requisition_roles table');
                }
            } catch (notificationError) {
                console.error('Error sending approval notifications:', notificationError);
            }
        }
        
        // Workflow Stage 2: Approver signed → Notify Authorizers
        if (isNewApproval) {
            console.log('✓ STAGE 2: NEW approver signature detected, sending notifications to authorizers...');
            
            try {
                console.log('Fetching active authorizers from database...');
                const [authorizers] = await connection.execute(
                    'SELECT u.email, u.full_name FROM requisition_roles rr ' +
                    'JOIN users u ON rr.user_id = u.id ' +
                    'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
                    ['authorizer', true, true]
                );
                
                console.log(`Found ${authorizers ? authorizers.length : 0} active authorizers`);
                
                if (authorizers && authorizers.length > 0) {
                    for (const authorizer of authorizers) {
                        console.log(`Processing authorizer: ${authorizer.full_name} (${authorizer.email})`);
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                        const htmlContent = `
                            <html>
                            <head><style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
                                .content { margin: 20px 0; }
                                .footer { margin-top: 20px; font-size: 12px; color: #666; }
                                .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                            </style></head>
                            <body>
                                <div class="header">
                                    <h2>Requisition Awaiting Authorization</h2>
                                </div>
                                <div class="content">
                                    <p>Hello ${authorizer.full_name || 'Authorizer'},</p>
                                    <p>A requisition has been approved and is awaiting your authorization:</p>
                                    <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                                    <p><strong>Requestor:</strong> ${updatedRequisition.requestor_name}</p>
                                    <p><strong>Department:</strong> ${updatedRequisition.department}</p>
                                    <p><strong>Purpose:</strong> ${updatedRequisition.purpose}</p>
                                    <p><strong>Total Amount:</strong> ${updatedRequisition.grand_total || '0.00'} Birr </p>
                                    <p>Please click the button below to review and authorize this requisition:</p>
                                    <a href="${frontendUrl}/requisitions/${requisitionId}" class="button">Authorize Requisition</a>
                                    <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisitionId}">${frontendUrl}/requisitions/${requisitionId}</a></p>
                                </div>
                                <div class="footer">
                                    <p>This is an automated notification from SOKAPP Requisition System.</p>
                                </div>
                            </body>
                            </html>
                        `;
                        
                        console.log(`Attempting to send authorization notification to: ${authorizer.email} (${authorizer.full_name})`);
                        const emailResult = await sendEmailNotification(
                            authorizer.email,
                            `Requisition Awaiting Authorization - #${requisitionId}`,
                            htmlContent
                        );
                        
                        if (emailResult.success) {
                            console.log(`✓ Authorization notification sent successfully to ${authorizer.email} (${authorizer.full_name})`);
                        } else {
                            console.error(`✗ Failed to send authorization notification to ${authorizer.email}:`, emailResult.message);
                        }
                    }
                } else {
                    console.warn('⚠️  No active authorizers found in requisition_roles table');
                }
            } catch (notificationError) {
                console.error('Error sending authorization notifications:', notificationError);
            }
        }
        
        // Workflow Stage 3: Authorizer signed → Requisition is AUTHORIZED (not finalized)
        if (isNewAuthorization) {
            console.log('✓ STAGE 3: NEW authorization signature detected - Requisition AUTHORIZED, sending notifications to requester and finance...');
            
            // Update status to 'authorized' (keep it as authorized, not finalized)
            await connection.execute(
                'UPDATE requisitions SET status = ? WHERE id = ?',
                ['authorized', requisitionId]
            );
            
            try {
                // Send notification to REQUESTER
                if (updatedRequisition.requestor_email) {
                    console.log(`Sending finalization notification to requester: ${updatedRequisition.requestor_email}`);
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    const requesterHtmlContent = `
                        <html>
                        <head><style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { background-color: #28a745; color: white; padding: 10px; border-radius: 5px; }
                            .content { margin: 20px 0; }
                            .footer { margin-top: 20px; font-size: 12px; color: #666; }
                            .button { background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                            .success-badge { background-color: #28a745; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                        </style></head>
                        <body>
                            <div class="header">
                                <h2>✓ Your Requisition Has Been Authorized!</h2>
                            </div>
                            <div class="content">
                                <p>Hello ${updatedRequisition.requestor_name || 'Requester'},</p>
                                <p>Great news! Your requisition has been fully approved and all required signatures have been obtained.</p>
                                <span class="success-badge">AUTHORIZED</span>
                                <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                                <p><strong>Department:</strong> ${updatedRequisition.department || 'N/A'}</p>
                                <p><strong>Purpose:</strong> ${updatedRequisition.purpose || 'N/A'}</p>
                                <p><strong>Total Amount:</strong> ${updatedRequisition.grand_total || '0.00'} Birr</p>
                                <p>The finance team has been notified and will proceed with payment processing.</p>
                                <a href="${frontendUrl}/requisitions/${requisitionId}" class="button">View Your Requisition</a>
                                <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisitionId}">${frontendUrl}/requisitions/${requisitionId}</a></p>
                            </div>
                            <div class="footer">
                                <p>This is an automated notification from SOKAPP Requisition System.</p>
                                <p>Congratulations on your authorized requisition!</p>
                            </div>
                        </body>
                        </html>
                    `;
                    
                    const requesterEmailResult = await sendEmailNotification(
                        updatedRequisition.requestor_email,
                        `✓ Your Requisition Has Been Authorized - #${requisitionId}`,
                        requesterHtmlContent
                    );
                    
                    if (requesterEmailResult.success) {
                        console.log(`✓ Finalization notification sent successfully to requester: ${updatedRequisition.requestor_email}`);
                    } else {
                        console.error(`✗ Failed to send finalization notification to requester: ${updatedRequisition.requestor_email}:`, requesterEmailResult.message);
                    }
                } else {
                    console.warn('⚠️  No requestor email found for notification');
                }
                
                // Send notification to FINANCE team
                console.log('Fetching active finance personnel from database...');
                const [finance] = await connection.execute(
                    'SELECT u.email, u.full_name FROM requisition_roles rr ' +
                    'JOIN users u ON rr.user_id = u.id ' +
                    'WHERE rr.role_type = ? AND rr.is_active = ? AND u.is_active = ?',
                    ['finance', true, true]
                );
                
                console.log(`Found ${finance ? finance.length : 0} active finance personnel`);
                
                if (finance && finance.length > 0) {
                    for (const financeMember of finance) {
                        console.log(`Processing finance: ${financeMember.full_name} (${financeMember.email})`);
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                        const financeHtmlContent = `
                            <html>
                            <head><style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { background-color: #007bff; color: white; padding: 10px; border-radius: 5px; }
                                .content { margin: 20px 0; }
                                .footer { margin-top: 20px; font-size: 12px; color: #666; }
                                .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                                .priority-badge { background-color: #dc3545; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                            </style></head>
                            <body>
                                <div class="header">
                                    <h2>🏦 Payment Processing Required - Requisition Authorized</h2>
                                </div>
                                <div class="content">
                                    <p>Hello ${financeMember.full_name || 'Finance Team Member'},</p>
                                    <p>A requisition has been fully approved and requires immediate payment processing:</p>
                                    <span class="priority-badge">ACTION REQUIRED</span>
                                    <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                                    <p><strong>Requestor:</strong> ${updatedRequisition.requestor_name || 'N/A'}</p>
                                    <p><strong>Requestor Email:</strong> ${updatedRequisition.requestor_email || 'N/A'}</p>
                                    <p><strong>Department:</strong> ${updatedRequisition.department || 'N/A'}</p>
                                    <p><strong>Purpose:</strong> ${updatedRequisition.purpose || 'N/A'}</p>
                                    <p><strong>Total Amount:</strong> ${updatedRequisition.grand_total || '0.00'} Birr</p>
                                    <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">AUTHORIZED</span></p>
                                    <p>All required signatures have been obtained. Please proceed with payment processing and coordinate with the requestor.</p>
                                    <a href="${frontendUrl}/requisitions/${requisitionId}" class="button">View Requisition Details</a>
                                    <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisitionId}">${frontendUrl}/requisitions/${requisitionId}</a></p>
                                </div>
                                <div class="footer">
                                    <p>This is an automated notification from SOKAPP Requisition System.</p>
                                    <p>Please process this payment at your earliest convenience.</p>
                                </div>
                            </body>
                            </html>
                        `;
                        
                        console.log(`Attempting to send finance notification to: ${financeMember.email} (${financeMember.full_name})`);
                        const financeEmailResult = await sendEmailNotification(
                            financeMember.email,
                            `🏦 Payment Processing Required - Requisition #${requisitionId} Approved`,
                            financeHtmlContent
                        );
                        
                        if (financeEmailResult.success) {
                            console.log(`✓ Finance notification sent successfully to ${financeMember.email} (${financeMember.full_name})`);
                        } else {
                            console.error(`✗ Failed to send finance notification to ${financeMember.email}:`, financeEmailResult.message);
                        }
                    }
                } else {
                    console.warn('⚠️  No active finance personnel found in requisition_roles table');
                }
            } catch (notificationError) {
                console.error('Error sending finalization notifications:', notificationError);
            }
        }
        
        // Delete existing items only if items array is provided
        if (items && Array.isArray(items)) {
            await connection.execute(
                'DELETE FROM requisition_items WHERE requisition_id = ?',
                [requisitionId]
            );
            
            // Insert updated items
            for (const item of items) {
                await connection.execute(
                    'INSERT INTO requisition_items (requisition_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [requisitionId, item.description, item.quantity, item.price, item.total]
                );
            }
        } else {
            console.log('No items array provided - keeping existing items');
        }
        
        await connection.commit();
        
        // Log activity
        try {
            const { userId, userEmail, userName, roleId, roleName } = req.body;
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'update',
                module: 'Requisition Management',
                actionDescription: `Updated requisition #${requisitionId}`,
                tableName: 'requisitions',
                recordId: requisitionId,
                oldValues: originalRequisition,
                newValues: updatedRequisition,
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log requisition update activity:', logError);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Requisition updated successfully', 
            id: requisitionId 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating requisition:', error);
        res.status(500).json({ success: false, message: 'Failed to update requisition', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST endpoint to reject a requisition
app.post('/api/requisition/:id/reject', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        
        const requisitionId = req.params.id;
        const { rejectionNote, rejectedBy, rejectedByEmail } = req.body;
        
        if (!rejectionNote) {
            return res.status(400).json({ success: false, message: 'Rejection note is required' });
        }
        
        // Update requisition with rejection details
        await connection.execute(
            `UPDATE requisitions 
             SET status = 'rejected', 
                 rejection_note = ?, 
                 rejected_by = ?, 
                 rejected_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [rejectionNote, rejectedBy || null, requisitionId]
        );
        
        // Fetch the updated requisition to get requester email
        const [updatedRequisitionRows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        const updatedRequisition = updatedRequisitionRows[0];
        
        // Debug: Log the requisition data
        console.log('DEBUG: Updated requisition data:', JSON.stringify(updatedRequisition, null, 2));
        console.log('DEBUG: requestor_email value:', updatedRequisition?.requestor_email);
        
        // Send rejection notification email to the requester
        if (updatedRequisition && updatedRequisition.requestor_email) {
            console.log(`Sending rejection notification to requester: ${updatedRequisition.requestor_email}`);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            
            const requesterHtmlContent = `
                <html>
                <head><style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #dc3545; color: white; padding: 10px; border-radius: 5px; }
                    .content { margin: 20px 0; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                    .button { background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                    .rejection-badge { background-color: #dc3545; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                    .reason-box { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style></head>
                <body>
                    <div class="header">
                        <h2>✗ Requisition Rejected</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${updatedRequisition.requestor_name || 'Requester'},</p>
                        <p>We regret to inform you that your requisition has been rejected.</p>
                        <span class="rejection-badge">REJECTED</span>
                        
                        <div class="reason-box">
                            <strong>Reason for Rejection:</strong>
                            <p>${rejectionNote}</p>
                        </div>
                        
                        <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                        <p><strong>Department:</strong> ${updatedRequisition.department || 'N/A'}</p>
                        <p><strong>Purpose:</strong> ${updatedRequisition.purpose || 'N/A'}</p>
                        <p><strong>Total Amount:</strong> ${updatedRequisition.grand_total || '0.00'} Birr</p>
                        <p><strong>Rejected By:</strong> ${rejectedBy || 'N/A'}</p>
                        
                        <p>If you have questions about this decision, please contact the person who rejected your requisition or resubmit with the necessary corrections.</p>
                        <a href="${frontendUrl}/requisitions/${requisitionId}" class="button">View Requisition Details</a>
                        <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisitionId}">${frontendUrl}/requisitions/${requisitionId}</a></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from SOKAPP Requisition System.</p>
                    </div>
                </body>
                </html>
            `;
            
            const requesterEmailResult = await sendEmailNotification(
                updatedRequisition.requestor_email,
                `✗ Your Requisition Has Been Rejected - #${requisitionId}`,
                requesterHtmlContent
            );
            
            if (requesterEmailResult.success) {
                console.log(`✓ Rejection notification sent successfully to requester: ${updatedRequisition.requestor_email}`);
            } else {
                console.error(`✗ Failed to send rejection notification to requester: ${updatedRequisition.requestor_email}:`, requesterEmailResult.message);
            }
        } else {
            console.warn('⚠️  No requestor email found for rejection notification');
        }
        
        await connection.commit();
        
        // Log activity
        try {
            const { userId, userEmail, userName, roleId, roleName } = req.body;
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'update',
                module: 'Requisition Management',
                actionDescription: `Rejected requisition #${requisitionId}`,
                tableName: 'requisitions',
                recordId: requisitionId,
                newValues: {
                    status: 'rejected',
                    rejection_note: rejectionNote,
                    rejected_by: rejectedBy
                },
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log requisition rejection activity:', logError);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Requisition rejected successfully', 
            id: requisitionId 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error rejecting requisition:', error);
        res.status(500).json({ success: false, message: 'Failed to reject requisition', error: error.message });
    } finally {
        await connection.end();
    }
});

// ==================== USER AUTHENTICATION & MANAGEMENT ====================

// POST endpoint for user login
app.post('/api/login', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        
        // Check if new schema exists by checking if roles table exists
        const [tables] = await connection.execute(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'roles'",
            [dbConfig.database]
        );
        
        const hasNewSchema = tables.length > 0;
        
        if (hasNewSchema) {
            // Use new schema with roles: look up by email first, then check password
            const [rows] = await connection.execute(
                `SELECT u.id, u.full_name, u.email, u.password, u.is_admin, u.department, u.is_active, 
                        r.id as role_id, r.name as role_name, e.profile_image
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 LEFT JOIN employees e ON u.email = e.email COLLATE utf8mb4_unicode_ci
                 WHERE u.email = ?`,
                [email]
            );
            
            if (rows.length === 0) {
                console.log('Login failed: no user with email:', email);
                // Log failed login - user not found
                await logUserActivity({
                    userId: null,
                    userEmail: email,
                    userName: 'Unknown',
                    roleId: null,
                    roleName: null,
                    activityType: 'login_failed',
                    module: 'Authentication',
                    actionDescription: 'Login attempt - user not found',
                    status: 'failed',
                    failureReason: 'User not found'
                });
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            if (!rows[0].is_active) {
                console.log('Login failed: user inactive:', email);
                // Log failed login - inactive account
                await logUserActivity({
                    userId: rows[0].id,
                    userEmail: rows[0].email,
                    userName: rows[0].full_name,
                    roleId: rows[0].role_id,
                    roleName: rows[0].role_name || 'No Role',
                    activityType: 'login_failed',
                    module: 'Authentication',
                    actionDescription: 'Login attempt - inactive account',
                    status: 'failed',
                    failureReason: 'Account inactive'
                });
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            // Compare the provided password with the hashed password
            const isValidPassword = await bcrypt.compare(password, rows[0].password);
            if (!isValidPassword) {
                console.log('Login failed: password mismatch for:', email);
                // Log failed login - incorrect password
                await logUserActivity({
                    userId: rows[0].id,
                    userEmail: rows[0].email,
                    userName: rows[0].full_name,
                    roleId: rows[0].role_id,
                    roleName: rows[0].role_name || 'No Role',
                    activityType: 'login_failed',
                    module: 'Authentication',
                    actionDescription: 'Login attempt - incorrect password',
                    status: 'failed',
                    failureReason: 'Incorrect password'
                });
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            // Remove password from row before sending to client
            delete rows[0].password;
            
            // Get user permissions
            let permissions = [];
            if (rows[0].role_id) {
                const [perms] = await connection.execute(
                    `SELECT p.name 
                     FROM permissions p 
                     JOIN role_permissions rp ON p.id = rp.permission_id 
                     WHERE rp.role_id = ?`,
                    [rows[0].role_id]
                );
                permissions = perms.map(p => p.name);
            }
            
            // If admin, give all permissions
            if (rows[0].is_admin) {
                permissions = [
                    'dashboard_view', 'inventory_view', 'inventory_manage', 'form_manage',
                    'report_view', 'report_manage', 'record_view', 'record_manage',
                    'user_view', 'user_manage', 'settings_view', 'settings_manage',
                    'requisition_create', 'requisition_view_all', 'requisition_review', 'requisition_approve', 'requisition_authorize', 'role_manage',
                    'employee_view', 'employee_manage',
                    'child_view', 'child_create', 'child_update', 'child_delete',
                    'guardian_manage', 'legal_manage', 'medical_manage', 'education_manage', 'case_manage'
                ];
            }
            
            // Update last login
            await connection.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [rows[0].id]
            );
            
            // Log successful login
            await logUserActivity({
                userId: rows[0].id,
                userEmail: rows[0].email,
                userName: rows[0].full_name,
                roleId: rows[0].role_id,
                roleName: rows[0].role_name || 'No Role',
                activityType: 'login',
                module: 'Authentication',
                actionDescription: 'User login successful',
                status: 'success'
            });
            
            const user = {
                ...rows[0],
                role: rows[0].is_admin ? 'admin' : 'standard',
                role_name: rows[0].role_name || 'No Role',
                permissions: permissions
            };
            
            return res.status(200).json({ 
                success: true, 
                message: 'Login successful',
                user: user
            });
        } else {
            // Use old schema: look up by email first, then check password
            const [rows] = await connection.execute(
                `SELECT u.id, u.full_name, u.email, u.password, u.role, u.department, u.is_active, e.profile_image 
                 FROM users u 
                 LEFT JOIN employees e ON u.email = e.email COLLATE utf8mb4_unicode_ci
                 WHERE u.email = ?`,
                [email]
            );
            
            if (rows.length === 0) {
                console.log('Login failed: no user with email:', email);
                // Log failed login - user not found
                await logUserActivity({
                    userId: null,
                    userEmail: email,
                    userName: 'Unknown',
                    roleId: null,
                    roleName: null,
                    activityType: 'login_failed',
                    module: 'Authentication',
                    actionDescription: 'Login attempt - user not found',
                    status: 'failed',
                    failureReason: 'User not found'
                });
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            if (!rows[0].is_active) {
                console.log('Login failed: user inactive:', email);
                // Log failed login - inactive account
                await logUserActivity({
                    userId: rows[0].id,
                    userEmail: rows[0].email,
                    userName: rows[0].full_name,
                    roleId: null,
                    roleName: null,
                    activityType: 'login_failed',
                    module: 'Authentication',
                    actionDescription: 'Login attempt - inactive account',
                    status: 'failed',
                    failureReason: 'Account inactive'
                });
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            // Compare the provided password with the hashed password
            const isValidPassword = await bcrypt.compare(password, rows[0].password);
            if (!isValidPassword) {
                console.log('Login failed: password mismatch for:', email);
                // Log failed login - incorrect password
                await logUserActivity({
                    userId: rows[0].id,
                    userEmail: rows[0].email,
                    userName: rows[0].full_name,
                    roleId: null,
                    roleName: null,
                    activityType: 'login_failed',
                    module: 'Authentication',
                    actionDescription: 'Login attempt - incorrect password',
                    status: 'failed',
                    failureReason: 'Incorrect password'
                });
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            delete rows[0].password;
            
            // Map old role to permissions
            const isAdmin = rows[0].role === 'admin';
            let permissions = [];
            
            if (isAdmin) {
                permissions = [
                    'dashboard_view', 'inventory_view', 'inventory_manage', 'form_manage',
                    'report_view', 'report_manage', 'record_view', 'record_manage',
                    'user_view', 'user_manage', 'settings_view', 'settings_manage',
                    'requisition_create', 'requisition_view_all', 'requisition_review', 'requisition_approve', 'requisition_authorize', 'role_manage',
                    'employee_view', 'employee_manage',
                    'child_view', 'child_create', 'child_update', 'child_delete',
                    'guardian_manage', 'legal_manage', 'medical_manage', 'education_manage', 'case_manage'
                ];
            } else {
                // Standard user permissions - include inventory_view for all users
                permissions = ['dashboard_view', 'requisition_create', 'settings_view', 'employee_view', 'inventory_view'];
            }
            
            const user = {
                ...rows[0],
                is_admin: isAdmin,
                role_name: rows[0].role,
                permissions: permissions
            };
            
            return res.status(200).json({ 
                success: true, 
                message: 'Login successful',
                user: user
            });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST endpoint for user logout
app.post('/api/logout', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { userId, userEmail, userName, roleId, roleName, sessionDuration } = req.body;
        
        if (!userId || !userEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'User information is required for logout' 
            });
        }
        
        // Log the logout activity
        await logUserActivity({
            userId: userId,
            userEmail: userEmail,
            userName: userName || 'Unknown',
            roleId: roleId,
            roleName: roleName || 'No Role',
            activityType: 'logout',
            module: 'Authentication',
            actionDescription: 'User logout',
            status: 'success',
            sessionDuration: sessionDuration || null
        });
        
        console.log(`✅ Logout logged for user: ${userName} (${userEmail})`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Logout successful' 
        });
    } catch (error) {
        console.error('Error during logout:', error);
        // Don't fail the logout even if logging fails
        res.status(200).json({ 
            success: true, 
            message: 'Logout successful (activity logging failed)' 
        });
    } finally {
        await connection.end();
    }
});

// GET endpoint to fetch all users (admin only)
app.get('/api/users', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Check if new schema exists
        const [tables] = await connection.execute(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'roles'",
            [dbConfig.database]
        );
        
        const hasNewSchema = tables.length > 0;
        
        let query;
        if (hasNewSchema) {
            query = `SELECT u.id, u.full_name, u.email, u.role_id, r.name as role_name, 
                            u.department, u.phone, u.is_active, u.created_at, u.last_login,
                            GROUP_CONCAT(DISTINCT rr.role_type SEPARATOR ',') as requisition_roles
                     FROM users u 
                     LEFT JOIN roles r ON u.role_id = r.id 
                     LEFT JOIN requisition_roles rr ON u.id = rr.user_id AND rr.is_active = TRUE
                     GROUP BY u.id, u.full_name, u.email, u.role_id, r.name, 
                              u.department, u.phone, u.is_active, u.created_at, u.last_login
                     ORDER BY u.created_at DESC`;
        } else {
            query = `SELECT u.id, u.full_name, u.email, u.role as role_name, u.department, u.phone, 
                            u.is_active, u.created_at, u.last_login,
                            GROUP_CONCAT(DISTINCT rr.role_type SEPARATOR ',') as requisition_roles
                     FROM users u
                     LEFT JOIN requisition_roles rr ON u.id = rr.user_id AND rr.is_active = TRUE
                     GROUP BY u.id, u.full_name, u.email, u.role, u.department, u.phone, 
                              u.is_active, u.created_at, u.last_login
                     ORDER BY u.created_at DESC`;
        }
        
        const [rows] = await connection.execute(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST endpoint to create a new user (admin only)
app.post('/api/users', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Check if new schema exists
        const [tables] = await connection.execute(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'roles'",
            [dbConfig.database]
        );
        
        const hasNewSchema = tables.length > 0;
        const { full_name, email, role_id, department, phone, is_admin } = req.body;
        
        // Check if email already exists
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        
        // Generate a random password for initial creation (will be replaced)
        const crypto = require('crypto');
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const hashedTempPassword = await bcrypt.hash(tempPassword, 12);
        
        let query, params;
        if (hasNewSchema) {
            // Check if the role is Admin to set is_admin flag
            let isAdminValue = is_admin || false;
            if (role_id) {
                const [roleRows] = await connection.execute(
                    'SELECT name FROM roles WHERE id = ?',
                    [role_id]
                );
                if (roleRows.length > 0 && roleRows[0].name === 'Admin') {
                    isAdminValue = true;
                }
            }
            
            // Create user with is_active = FALSE (invited status)
            query = 'INSERT INTO users (full_name, email, password, role_id, is_admin, department, phone, program_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)';
            params = [full_name, email, hashedTempPassword, role_id, isAdminValue, department, phone, program_id || null];
        } else {
            query = 'INSERT INTO users (full_name, email, password, role, department, phone, program_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)';
            params = [full_name, email, hashedTempPassword, role_id || 'standard', department, phone, program_id || null];
        }
        
        const [result] = await connection.execute(query, params);
        
        // Generate invitation token
        const plainToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store the invitation token
        await connection.execute(
            'INSERT INTO invitation_tokens (email, token, expires_at) VALUES (?, ?, ?)',
            [email, hashedToken, expiresAt]
        );
        
        // Send invitation email
        try {
            console.log('=== SENDING INVITATION EMAIL ===');
            console.log('EMAIL_FROM env:', process.env.EMAIL_FROM);
            console.log('BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY);
            console.log('Recipient email:', email);
            
            // Use environment variable for frontend URL, fallback to localhost:3000
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const invitationLink = `${frontendUrl}/accept-invitation?email=${encodeURIComponent(email)}&token=${plainToken}`;
            
            const brevoResponse = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { email: process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL || 'no-reply@yoursite.com' },
                to: [{ email: email }],
                subject: 'SOKAPP - Invitation to Join',
                htmlContent: `
                    <h2>Welcome to SOKAPP!</h2>
                    <p>You have been invited to join SOKAPP. Please click the link below to set your password and activate your account:</p>
                    <p><a href="${invitationLink}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Activate Account</a></p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Best regards,<br/>The SOKAPP Team</p>
                `
            }, {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY
                }
            });
            
            console.log('✅ Invitation email sent successfully:', brevoResponse.data);
            console.log('Message ID:', brevoResponse.data.messageId);
        } catch (emailError) {
            console.error('❌ Error sending invitation email:', emailError.response?.data || emailError.message);
            console.error('Status:', emailError.response?.status);
            console.error('Status Text:', emailError.response?.statusText);
            // Don't fail the request if email fails, just log it
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'User invited successfully. An invitation email has been sent.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error inviting user:', error);
        res.status(500).json({ success: false, message: 'Failed to invite user', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT endpoint to update a user (admin only)
app.put('/api/users/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Check if new schema exists
        const [tables] = await connection.execute(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'roles'",
            [dbConfig.database]
        );
        
        const hasNewSchema = tables.length > 0;
        const userId = req.params.id;
        const { full_name, email, role_id, department, phone, is_active, is_admin, program_id } = req.body;
        
        let query, params;
        if (hasNewSchema) {
            // Check if the role is Admin to set is_admin flag
            let isAdminValue = is_admin || false;
            if (role_id) {
                const [roleRows] = await connection.execute(
                    'SELECT name FROM roles WHERE id = ?',
                    [role_id]
                );
                if (roleRows.length > 0 && roleRows[0].name === 'Admin') {
                    isAdminValue = true;
                }
            }
            
            query = 'UPDATE users SET full_name = ?, email = ?, role_id = ?, is_admin = ?, department = ?, phone = ?, program_id = ?, is_active = ? WHERE id = ?';
            params = [full_name, email, role_id, isAdminValue, department, phone, program_id || null, is_active, userId];
        } else {
            query = 'UPDATE users SET full_name = ?, email = ?, role = ?, department = ?, phone = ?, program_id = ?, is_active = ? WHERE id = ?';
            params = [full_name, email, role_id, department, phone, program_id || null, is_active, userId];
        }
        
        await connection.execute(query, params);
        
        // Handle requisition role assignments if provided
        if (req.body.requisition_roles !== undefined) {
            // First, remove all existing requisition roles for this user
            await connection.execute('DELETE FROM requisition_roles WHERE user_id = ?', [userId]);
            
            // Then add the new requisition roles if any are specified
            if (Array.isArray(req.body.requisition_roles) && req.body.requisition_roles.length > 0) {
                for (const roleType of req.body.requisition_roles) {
                    if (['reviewer', 'approver', 'authorizer', 'finance'].includes(roleType)) {
                        await connection.execute(`
                            INSERT INTO requisition_roles (user_id, role_type, is_active)
                            VALUES (?, ?, TRUE)
                            ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP
                        `, [userId, roleType]);
                    }
                }
            }
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
    } finally {
        await connection.end();
    }
});

// DELETE endpoint to delete a user (admin only)
app.delete('/api/users/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const userId = req.params.id;
        
        await connection.execute(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST endpoint to reset user password (admin only)
app.post('/api/users/:id/reset-password', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const userId = req.params.id;
        const { new_password } = req.body;
        
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [new_password, userId]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST endpoint for forgot password
app.post('/api/forgot-password', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email } = req.body;
        
        // Validate email
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        // Check if user exists and is active
        const [users] = await connection.execute(
            'SELECT id, full_name, email, is_active FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );
        
        if (users.length === 0) {
            // Return success even if user doesn't exist to prevent email enumeration
            return res.status(200).json({ 
                success: true, 
                message: 'If an account exists with this email, a password reset link has been sent.' 
            });
        }
        
        const user = users[0];
        
        // Generate reset token
        const crypto = require('crypto');
        const plainToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        
        // Store the reset token
        await connection.execute(
            'INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
            [user.id, email, hashedToken, expiresAt]
        );
        
        // Send reset email
        try {
            // Use environment variable for frontend URL, fallback to localhost:3000
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/reset-password?token=${plainToken}&email=${encodeURIComponent(email)}`;
            
            const brevoResponse = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { email: process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL || 'no-reply@yoursite.com' },
                to: [{ email: email }],
                subject: 'SOKAPP - Password Reset Request',
                htmlContent: `
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.full_name},</p>
                    <p>You have requested to reset your password. Click the link below to reset your password:</p>
                    <p><a href="${resetLink}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>Best regards,<br/>The SOKAPP Team</p>
                `
            }, {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY
                }
            });
            
            console.log('Password reset email sent successfully:', brevoResponse.data);
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError.response?.data || emailError.message);
            // Don't fail the request if email fails, just log it
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'If an account exists with this email, a password reset link has been sent.' 
        });
    } catch (error) {
        console.error('Error processing forgot password request:', error);
        res.status(500).json({ success: false, message: 'Failed to process request', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST endpoint to reset password with token
app.post('/api/reset-password', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, token, newPassword } = req.body;
        
        // Validate inputs
        if (!email || !token || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, token, and new password are required' 
            });
        }
        
        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }
        
        // Hash the token to compare with stored hash
        const crypto = require('crypto');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find the reset token
        const [tokens] = await connection.execute(
            'SELECT * FROM password_reset_tokens WHERE email = ? AND token = ? AND used = FALSE',
            [email, hashedToken]
        );
        
        if (tokens.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset token' 
            });
        }
        
        const resetToken = tokens[0];
        const now = new Date();
        
        // Check if token has expired
        if (new Date(resetToken.expires_at) < now) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reset token has expired' 
            });
        }
        
        // Check if user exists and is active
        const [users] = await connection.execute(
            'SELECT id, is_active FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User not found or inactive' 
            });
        }
        
        const user = users[0];
        
        // Hash the new password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Update user password
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        // Mark token as used
        await connection.execute(
            'UPDATE password_reset_tokens SET used = TRUE, used_at = ? WHERE id = ?',
            [now, resetToken.id]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reset password', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// POST endpoint to accept invitation and set password
app.post('/api/accept-invitation', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, token, password } = req.body;
        
        // Validate inputs
        if (!email || !token || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, token, and password are required' 
            });
        }
        
        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }
        
        // Additional password strength check
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
            });
        }
        
        // Hash the token to compare with stored hash
        const crypto = require('crypto');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find the invitation token
        const [tokens] = await connection.execute(
            'SELECT * FROM invitation_tokens WHERE email = ? AND token = ? AND used = FALSE',
            [email, hashedToken]
        );
        
        if (tokens.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired invitation token' 
            });
        }
        
        const invitationToken = tokens[0];
        const now = new Date();
        
        // Check if token has expired
        if (new Date(invitationToken.expires_at) < now) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invitation token has expired' 
            });
        }
        
        // Check if user exists
        const [users] = await connection.execute(
            'SELECT id, is_active FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const user = users[0];
        
        // Hash the new password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update user password and activate account
        await connection.execute(
            'UPDATE users SET password = ?, is_active = TRUE WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        // Mark token as used
        await connection.execute(
            'UPDATE invitation_tokens SET used = TRUE, used_at = ? WHERE id = ?',
            [now, invitationToken.id]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Account activated successfully'
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to activate account', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// ==================== ROLES & PERMISSIONS MANAGEMENT ====================

// GET all roles with their permissions
app.get('/api/roles', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [roles] = await connection.execute('SELECT * FROM roles ORDER BY name');
        
        // Get permissions for each role
        for (let role of roles) {
            const [permissions] = await connection.execute(
                `SELECT p.id, p.name, p.description, p.category 
                 FROM permissions p 
                 JOIN role_permissions rp ON p.id = rp.permission_id 
                 WHERE rp.role_id = ?`,
                [role.id]
            );
            role.permissions = permissions;
        }
        
        res.status(200).json({ success: true, data: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch roles', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET all permissions
app.get('/api/permissions', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [permissions] = await connection.execute(
            'SELECT * FROM permissions ORDER BY category, name'
        );
        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch permissions', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST create new role
app.post('/api/roles', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { name, description, permission_ids } = req.body;
        
        // Create role
        const [result] = await connection.execute(
            'INSERT INTO roles (name, description) VALUES (?, ?)',
            [name, description]
        );
        
        const roleId = result.insertId;
        
        // Assign permissions
        if (permission_ids && permission_ids.length > 0) {
            for (const permId of permission_ids) {
                await connection.execute(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                    [roleId, permId]
                );
            }
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Role created successfully',
            id: roleId
        });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ success: false, message: 'Failed to create role', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update role
app.put('/api/roles/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const roleId = req.params.id;
        const { name, description, is_active, permission_ids } = req.body;
        
        // Update role
        await connection.execute(
            'UPDATE roles SET name = ?, description = ?, is_active = ? WHERE id = ?',
            [name, description, is_active, roleId]
        );
        
        // Update permissions - delete old and insert new
        await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
        
        if (permission_ids && permission_ids.length > 0) {
            for (const permId of permission_ids) {
                await connection.execute(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                    [roleId, permId]
                );
            }
        }
        
        res.status(200).json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
    } finally {
        await connection.end();
    }
});

// DELETE role
app.delete('/api/roles/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const roleId = req.params.id;
        
        await connection.execute('DELETE FROM roles WHERE id = ?', [roleId]);
        
        res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ success: false, message: 'Failed to delete role', error: error.message });
    } finally {
        await connection.end();
    }
});

// ==================== PROGRAMS MANAGEMENT ====================

// GET all programs
app.get('/api/programs', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [programs] = await connection.execute(
            'SELECT * FROM programs ORDER BY name'
        );
        res.status(200).json({ success: true, programs });
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch programs', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// POST create new program
app.post('/api/programs', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { name, description, is_active } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Program name is required' 
            });
        }
        
        // Check if program with same name exists
        const [existing] = await connection.execute(
            'SELECT id FROM programs WHERE name = ?',
            [name.trim()]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'A program with this name already exists' 
            });
        }
        
        const [result] = await connection.execute(
            'INSERT INTO programs (name, description, is_active) VALUES (?, ?, ?)',
            [name.trim(), description || null, is_active !== false]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Program created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create program', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// PUT update program
app.put('/api/programs/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const programId = req.params.id;
        const { name, description, is_active } = req.body;
        
        console.log('Updating program:', { programId, name, description, is_active, type: typeof is_active });
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Program name is required' 
            });
        }
        
        // Check if another program with same name exists (excluding current program)
        const [existing] = await connection.execute(
            'SELECT id FROM programs WHERE BINARY name = ? AND id != ?',
            [name.trim(), programId]
        );
        
        console.log('Duplicate check result:', existing);
        
        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'A program with this name already exists' 
            });
        }
        
        // Verify program exists
        const [programCheck] = await connection.execute(
            'SELECT id FROM programs WHERE id = ?',
            [programId]
        );
        
        if (programCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Program not found' 
            });
        }
        
        // Convert is_active to appropriate type for MySQL
        let isActiveValue = 1; // Default to true (1)
        if (typeof is_active === 'string') {
            isActiveValue = is_active.toLowerCase() === 'true' ? 1 : 0;
        } else if (typeof is_active === 'boolean') {
            isActiveValue = is_active ? 1 : 0;
        } else if (typeof is_active === 'number') {
            isActiveValue = is_active !== 0 ? 1 : 0;
        } else if (is_active === undefined || is_active === null) {
            isActiveValue = 1; // Default to true
        }
        
        console.log('Converting is_active:', { original: is_active, converted: isActiveValue });
        
        // Use query instead of execute to avoid prepared statement issues
        await connection.query(
            'UPDATE programs SET name = ?, description = ?, is_active = ? WHERE id = ?',
            [name.trim(), description || null, isActiveValue, programId]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Program updated successfully' 
        });
    } catch (error) {
        console.error('Error updating program:', error);
        console.error('Error details:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('SQL Message:', error.sqlMessage);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update program', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// DELETE program
app.delete('/api/programs/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const programId = req.params.id;
        
        // Check if program is assigned to any users, employees, or children
        const [userCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE program_id = ?',
            [programId]
        );
        
        const [employeeCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM employees WHERE program_id = ?',
            [programId]
        );
        
        const [childCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM children WHERE program_id = ?',
            [programId]
        );
        
        const totalAssigned = userCount[0].count + employeeCount[0].count + childCount[0].count;
        
        if (totalAssigned > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete program. It is assigned to ${totalAssigned} record(s) (${userCount[0].count} users, ${employeeCount[0].count} employees, ${childCount[0].count} children). Please reassign or remove them first.`,
                counts: {
                    users: userCount[0].count,
                    employees: employeeCount[0].count,
                    children: childCount[0].count
                }
            });
        }
        
        await connection.execute('DELETE FROM programs WHERE id = ?', [programId]);
        
        res.status(200).json({ 
            success: true, 
            message: 'Program deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete program', 
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// GET user permissions
app.get('/api/users/:id/permissions', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const userId = req.params.id;
        
        const [permissions] = await connection.execute(
            `SELECT p.name, p.description, p.category 
             FROM permissions p 
             JOIN role_permissions rp ON p.id = rp.permission_id 
             JOIN users u ON u.role_id = rp.role_id 
             WHERE u.id = ?`,
            [userId]
        );
        
        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch permissions', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST switch user role (for admins to switch their view)
app.post('/api/users/:id/switch-role', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const userId = req.params.id;
        const { role_id } = req.body;
        
        await connection.execute(
            'UPDATE users SET role_id = ? WHERE id = ?',
            [role_id, userId]
        );
        
        // Get updated user with role
        const [users] = await connection.execute(
            `SELECT u.id, u.full_name, u.email, u.is_admin, u.department, 
                    r.id as role_id, r.name as role_name
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [userId]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Role switched successfully',
            user: users[0]
        });
    } catch (error) {
        console.error('Error switching role:', error);
        res.status(500).json({ success: false, message: 'Failed to switch role', error: error.message });
    } finally {
        await connection.end();
    }
});

// ==================== INVENTORY MANAGEMENT ====================

// GET all inventory items
app.get('/api/inventory', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM inventory ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch inventory', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET single inventory item
app.get('/api/inventory/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const itemId = req.params.id;
        const [rows] = await connection.execute(
            'SELECT * FROM inventory WHERE id = ?',
            [itemId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch item', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST create new inventory item
app.post('/api/inventory', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { name, category, quantity, unit, location, min_stock_level, description, supplier, cost_per_unit, program_id } = req.body;
        
        // Determine status based on quantity
        let status = 'In Stock';
        if (quantity === 0) {
            status = 'Out of Stock';
        } else if (quantity <= (min_stock_level || 10)) {
            status = 'Low Stock';
        }
        
        const [result] = await connection.execute(
            `INSERT INTO inventory (name, category, quantity, unit, location, status, min_stock_level, description, supplier, cost_per_unit, program_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category, quantity, unit, location, status, min_stock_level || 10, description, supplier, cost_per_unit, program_id || null]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Item created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ success: false, message: 'Failed to create item', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT update inventory item
app.put('/api/inventory/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const itemId = req.params.id;
        const { name, category, quantity, unit, location, min_stock_level, description, supplier, cost_per_unit, program_id } = req.body;
        
        // Determine status based on quantity
        let status = 'In Stock';
        if (quantity === 0) {
            status = 'Out of Stock';
        } else if (quantity <= (min_stock_level || 10)) {
            status = 'Low Stock';
        }
        
        await connection.execute(
            `UPDATE inventory SET name = ?, category = ?, quantity = ?, unit = ?, location = ?, 
             status = ?, min_stock_level = ?, description = ?, supplier = ?, cost_per_unit = ?, program_id = ? 
             WHERE id = ?`,
            [name, category, quantity, unit, location, status, min_stock_level || 10, description, supplier, cost_per_unit, program_id || null, itemId]
        );
        
        res.status(200).json({ success: true, message: 'Item updated successfully' });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
    } finally {
        await connection.end();
    }
});

// DELETE inventory item
app.delete('/api/inventory/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const itemId = req.params.id;
        
        await connection.execute('DELETE FROM inventory WHERE id = ?', [itemId]);
        
        res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ success: false, message: 'Failed to delete item', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST adjust inventory quantity (stock in/out)
app.post('/api/inventory/:id/adjust', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const itemId = req.params.id;
        const { quantity_change, reason, notes, user_id } = req.body;
        
        // Get current quantity
        const [currentItem] = await connection.execute(
            'SELECT quantity, min_stock_level FROM inventory WHERE id = ?',
            [itemId]
        );
        
        if (currentItem.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        const previousQuantity = currentItem[0].quantity;
        const newQuantity = previousQuantity + quantity_change;
        const minStockLevel = currentItem[0].min_stock_level || 10;
        
        if (newQuantity < 0) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }
        
        // Determine new status
        let status = 'In Stock';
        if (newQuantity === 0) {
            status = 'Out of Stock';
        } else if (newQuantity <= minStockLevel) {
            status = 'Low Stock';
        }
        
        // Update inventory
        await connection.execute(
            'UPDATE inventory SET quantity = ?, status = ? WHERE id = ?',
            [newQuantity, status, itemId]
        );
        
        // Record transaction
        const transactionType = quantity_change > 0 ? 'IN' : 'OUT';
        await connection.execute(
            `INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_change, previous_quantity, new_quantity, reason, notes, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemId, transactionType, quantity_change, previousQuantity, newQuantity, reason, notes, user_id]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Stock adjusted successfully',
            new_quantity: newQuantity,
            status: status
        });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ success: false, message: 'Failed to adjust stock', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET inventory statistics
app.get('/api/inventory/stats/summary', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [totalResult] = await connection.execute('SELECT COUNT(*) as count FROM inventory');
        const [inStockResult] = await connection.execute("SELECT COUNT(*) as count FROM inventory WHERE status = 'In Stock'");
        const [lowStockResult] = await connection.execute("SELECT COUNT(*) as count FROM inventory WHERE status = 'Low Stock'");
        const [outOfStockResult] = await connection.execute("SELECT COUNT(*) as count FROM inventory WHERE status = 'Out of Stock'");
        
        res.status(200).json({
            success: true,
            data: {
                total: totalResult[0].count,
                inStock: inStockResult[0].count,
                lowStock: lowStockResult[0].count,
                outOfStock: outOfStockResult[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET inventory transactions for an item
app.get('/api/inventory/:id/transactions', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const itemId = req.params.id;
        const [rows] = await connection.execute(
            `SELECT t.*, u.full_name as created_by_name 
             FROM inventory_transactions t 
             LEFT JOIN users u ON t.created_by = u.id 
             WHERE t.inventory_id = ? 
             ORDER BY t.created_at DESC`,
            [itemId]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    } finally {
        await connection.end();
    }
});

// GET all inventory transactions (for transaction log)
app.get('/api/inventory/transactions/all', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            `SELECT t.*, i.name as item_name, u.full_name as created_by_name 
             FROM inventory_transactions t 
             INNER JOIN inventory i ON t.inventory_id = i.id
             LEFT JOIN users u ON t.created_by = u.id 
             ORDER BY t.created_at DESC`,
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching all transactions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST inventory request (for non-managers to request items)
app.post('/api/inventory/request', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { item_name, quantity_needed, reason, urgency, user_id } = req.body;
        
        // Insert the request into a table (you may need to create this table)
        // For now, we'll just log it and return success
        console.log('Inventory Request:', { item_name, quantity_needed, reason, urgency, user_id });
        
        res.status(200).json({ 
            success: true, 
            message: 'Item request submitted successfully. Inventory manager will review your request.'
        });
    } catch (error) {
        console.error('Error submitting request:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request', error: error.message });
    } finally {
        await connection.end();
    }
});

// ==================== NEWS & NOTICES API ====================

// GET news and notices
app.get('/api/news-notices', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            'SELECT news, notice, updated_at FROM news_notices WHERE id = 1'
        );
        if (rows.length === 0) {
            return res.status(200).json({ success: true, news: '', notice: '' });
        }
        res.status(200).json({ success: true, ...rows[0] });
    } catch (error) {
        console.error('Error fetching news/notices:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch news/notices', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST/UPDATE news
app.post('/api/news', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { news } = req.body;
        
        await connection.execute(
            `INSERT INTO news_notices (id, news, notice) 
             VALUES (1, ?, '') 
             ON DUPLICATE KEY UPDATE news = VALUES(news)`,
            [news]
        );
        
        res.status(200).json({ success: true, message: 'News updated successfully' });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ success: false, message: 'Failed to update news', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST/UPDATE notice
app.post('/api/notices', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { notice } = req.body;
        
        await connection.execute(
            `INSERT INTO news_notices (id, news, notice) 
             VALUES (1, '', ?) 
             ON DUPLICATE KEY UPDATE notice = VALUES(notice)`,
            [notice]
        );
        
        res.status(200).json({ success: true, message: 'Notice updated successfully' });
    } catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ success: false, message: 'Failed to update notice', error: error.message });
    } finally {
        await connection.end();
    }
});

// UPDATE both news and notice
app.put('/api/news-notices', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { news, notice } = req.body;
        
        await connection.execute(
            `INSERT INTO news_notices (id, news, notice) 
             VALUES (1, ?, ?) 
             ON DUPLICATE KEY UPDATE 
                news = VALUES(news), 
                notice = VALUES(notice)`,
            [news || '', notice || '']
        );
        
        res.status(200).json({ success: true, message: 'News and notices updated successfully' });
    } catch (error) {
        console.error('Error updating news/notices:', error);
        res.status(500).json({ success: false, message: 'Failed to update news/notices', error: error.message });
    } finally {
        await connection.end();
    }
});

// Helper function to send notification email
const sendNotificationEmail = async (requisitionId, recipientType, recipientName, existingConnection = null) => {
  console.log(`=== sendNotificationEmail called ===`);
  console.log(`requisitionId: ${requisitionId}`);
  console.log(`recipientType: ${recipientType}`);
  console.log(`recipientName: ${recipientName}`);
  console.log(`existingConnection provided: ${!!existingConnection}`);
  
  try {
    const connection = existingConnection || await mysql.createConnection(dbConfig);
    const shouldCloseConnection = !existingConnection; // Only close if we created the connection
    console.log(`shouldCloseConnection: ${shouldCloseConnection}`);
    console.log(`Connection object:`, connection ? 'exists' : 'null');
    console.log(`Connection state:`, connection ? connection.state : 'null');
    console.log(`Connection threadId:`, connection ? connection.threadId : 'null');
    console.log(`Connection config:`, connection ? connection.config : 'null');
    
    // Fetch requisition details - try to get unique_id if it exists, fallback to id
    let [requisitionRows] = await connection.execute(
      'SELECT * FROM requisitions WHERE id = ?',
      [requisitionId]
    );
    
    // Add unique_identifier to each row, checking if unique_id column exists
    requisitionRows.forEach(row => {
      // Check if unique_id column exists in the row
      if ('unique_id' in row) {
        row.unique_identifier = row.unique_id || row.id;
      } else {
        row.unique_identifier = row.id; // Fallback to regular id if unique_id doesn't exist
      }
    });
    
    if (requisitionRows.length === 0) {
      console.error(`Requisition ${requisitionId} not found`);
      if (shouldCloseConnection) {
        await connection.end();
      }
      return;
    }
    
    const requisition = requisitionRows[0];
    
    // Determine how to find recipient(s)
    let recipientEmail = null;
    let [userRows] = [];
    
    // If recipientName is empty, it means we want to send to all users with the specific role
    if (recipientName === '') {
      console.log(`Looking for users with role: ${recipientType}`);
      // Send to all users with the specified requisition role
      [userRows] = await connection.execute(`
        SELECT DISTINCT u.email, u.full_name
        FROM users u 
        JOIN requisition_roles rr ON u.id = rr.user_id
        WHERE rr.role_type = ? AND u.is_active = TRUE AND rr.is_active = TRUE
      `, [recipientType]);
      console.log(`Found ${userRows.length} users with ${recipientType} role:`, userRows);
    } else {
      // Try to find a specific user by name or email
      // Try to find by full name first
      [userRows] = await connection.execute(
        'SELECT email, full_name FROM users WHERE full_name = ?',
        [recipientName]
      );
      
      if (userRows.length === 0) {
        // If not found by name, try to find by email directly
        [userRows] = await connection.execute(
          'SELECT email, full_name FROM users WHERE email = ?',
          [recipientName]
        );
      }
      
      if (userRows.length === 0) {
        // If still not found, try to find by role name
        [userRows] = await connection.execute(`
          SELECT u.email, u.full_name
          FROM users u 
          JOIN roles r ON u.role_id = r.id 
          WHERE r.name = ? AND u.is_active = TRUE
        `, [recipientName]);
      }
    }
    
    if (userRows.length > 0) {
      // If multiple users match the criteria, send to all of them
      for (const userRow of userRows) {
        // Create email content for this specific user
        const action = recipientType === 'reviewer' ? 'Review' : 
                  recipientType === 'approver' ? 'Approval' : 
                  recipientType === 'authorizer' ? 'Authorization' :
                  recipientType === 'finance' ? 'Processing' : 'Action';
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const htmlContent = `
          <html>
          <head><style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
              .content { margin: 20px 0; }
              .footer { margin-top: 20px; font-size: 12px; color: #666; }
              .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          </style></head>
          <body>
              <div class="header">
                  <h2>Requisition Notification</h2>
              </div>
              <div class="content">
                  <p>Dear ${userRow.full_name},</p>
                  <p>${recipientType === 'finance' 
                    ? 'A requisition has been fully approved and is ready for processing:' 
                    : `You have been requested to ${action.toLowerCase()} a requisition:`}</p>
                  <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                  <p><strong>Requestor:</strong> ${requisition.requestor_name}</p>
                  <p><strong>Department:</strong> ${requisition.department}</p>
                  <p><strong>Purpose:</strong> ${requisition.purpose}</p>
                  <p><strong>Status:</strong> ${requisition.status}</p>
                  <p>${recipientType === 'finance' 
                    ? 'Please click the button below to view the requisition for processing:' 
                    : `Please click the button below to access the requisition and complete the ${action.toLowerCase()}:`}</p>
                  <a href="${frontendUrl}/requisitions/${requisition.unique_identifier}" class="button">View Requisition</a>
                  <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisition.unique_identifier}">${frontendUrl}/requisitions/${requisition.unique_identifier}</a></p>
              </div>
              <div class="footer">
                  <p>This is an automated notification from SOKAPP Requisition System.</p>
              </div>
          </body>
          </html>
        `;
        
        // Send the email to this specific user
        const emailResult = await sendEmailNotification(
          userRow.email,
          recipientType === 'finance' 
            ? `Requisition Ready for Processing - #${requisitionId}`
            : `Requisition ${action} Required - #${requisitionId}`,
          htmlContent
        );
        
        if (emailResult.success) {
          console.log(`Notification email sent to ${recipientType} ${userRow.full_name} (${userRow.email}) for requisition ${requisitionId}`);
        } else {
          console.error(`Failed to send notification email to ${recipientType} ${userRow.full_name} (${userRow.email}):`, emailResult.message);
        }
      }
      // Close connection only if we created it
      if (shouldCloseConnection) {
        await connection.end();
      }
      return { success: true, message: `Notifications sent to ${userRows.length} ${recipientType}(s)` };
    }
    
    // If no users were found, report error
    if (shouldCloseConnection) {
      await connection.end();
    }
    
    console.error(`No users found for ${recipientType} with criteria: ${recipientName}`);
    return { success: false, message: `No users found for ${recipientType} role` };
  } catch (error) {
    console.error(`Error sending notification email for requisition ${requisitionId}:`, error);
    if (shouldCloseConnection) {
      await connection.end();
    }
    return { success: false, message: error.message };
  }
};

// Function to send email notification via Brevo API
const sendEmailNotification = async (toEmail, subject, htmlContent) => {
    console.log(`\n=== sendEmailNotification CALLED ===`);
    console.log(`To Email: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Content Length: ${htmlContent ? htmlContent.length : 0} characters`);
    
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        console.error('❌ Brevo API key not configured in environment variables');
        console.error('Check .env file for BREVO_API_KEY');
        return { success: false, message: 'Email service not configured' };
    }
    
    console.log(`✓ Brevo API key found (length: ${apiKey.length})`);
    
    try {
        console.log('DEBUG: process.env.EMAIL_FROM =', process.env.EMAIL_FROM);
        
        if (!process.env.EMAIL_FROM) {
            console.warn('⚠️  EMAIL_FROM not set, using default');
        }
        
        const emailData = {
            sender: {
                email: process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL || 'noreply@yoursite.com',
                name: 'SOKAPP System'
            },
            to: [
                { email: toEmail }
            ],
            subject: subject,
            htmlContent: htmlContent
        };
        
        console.log('\n=== EMAIL DATA ===');
        console.log('From:', JSON.stringify(emailData.sender));
        console.log('To:', toEmail);
        console.log('Subject:', subject);
        console.log('=================\n');
        
        console.log('Sending email via Brevo API...');
        console.log('API Key starts with:', apiKey.substring(0, 15) + '...');
        console.log('Target URL: https://api.brevo.com/v3/smtp/email');
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error('❌ Email request timed out after 10 seconds');
            controller.abort();
        }, 10000); // 10 second timeout
        
        try {
            const response = await axios.post(
                'https://api.brevo.com/v3/smtp/email',
                emailData,
                {
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'api-key': apiKey
                    },
                    signal: controller.signal,
                    timeout: 10000 // 10 second timeout
                }
            );
            
            clearTimeout(timeoutId);
            console.log('✅ Brevo API Response Status:', response.status);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
            console.log('Message ID:', response.data.messageId);
            
            return { success: true, messageId: response.data.messageId };
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
                console.error('\n❌ REQUEST TIMEOUT: Brevo API did not respond within 10 seconds');
                console.error('Possible causes:');
                console.error('  1. Network connectivity issue');
                console.error('  2. Firewall blocking outbound HTTPS');
                console.error('  3. DNS resolution failure');
                console.error('  4. Brevo API is down');
                return { success: false, message: 'Email request timed out' };
            }
            
            console.error('\n❌ ERROR SENDING EMAIL VIA BREVO');
            console.error('Error Type:', error.constructor.name);
            console.error('Error Message:', error.message);
            console.error('Error Code:', error.code);
            
            if (error.response) {
                console.error('\nHTTP Response Error:');
                console.error('Status Code:', error.response.status);
                console.error('Status Text:', error.response.statusText);
                console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
                
                // Common Brevo error codes
                if (error.response.data && error.response.data.message) {
                    console.error('\nBrevo Error Message:', error.response.data.message);
                }
            } else if (error.request) {
                console.error('\nNo Response Received - Network Error?');
                console.error('This usually means:');
                console.error('  1. No internet connection');
                console.error('  2. Firewall blocking api.brevo.com');
                console.error('  3. DNS not resolving api.brevo.com');
                console.error('Request object:', JSON.stringify(error.request, null, 2));
            } else {
                console.error('\nOther Error:', error.message);
            }
            
            console.error('\nFull Error Stack:', error.stack);
            
            return { success: false, message: error.response?.data?.message || error.message };
        }
    } catch (error) {
        console.error(`Error in sendEmailNotification wrapper:`, error);
        return { success: false, message: error.message };
    }
};

// POST endpoint to send notification email for requisition
app.post('/api/requisition/:id/send-notification', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const requisitionId = req.params.id;
        const { recipientType } = req.body; // 'reviewer', 'approver', or 'authorizer'
        
        // Fetch requisition details
        const [requisitionRows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        
        if (requisitionRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Requisition not found' });
        }
        
        const requisition = requisitionRows[0];
        
        // Determine recipient email based on recipientType
        let recipientEmail = null;
        let recipientName = null;
        let action = '';
        
        switch(recipientType) {
            case 'reviewer':
                recipientName = requisition.reviewed_by;
                break;
            case 'approver':
                recipientName = requisition.approved_by;
                break;
            case 'authorizer':
                recipientName = requisition.authorized_by;
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid recipient type' });
        }
        
        if (recipientName) {
            // Try to find by full name first
            let [userRows] = await connection.execute(
                'SELECT email FROM users WHERE full_name = ?',
                [recipientName]
            );
            
            if (userRows.length === 0) {
                // If not found by name, try to find by email directly
                [userRows] = await connection.execute(
                    'SELECT email FROM users WHERE email = ?',
                    [recipientName]
                );
            }
            
            if (userRows.length > 0) {
                recipientEmail = userRows[0].email;
            } else {
                // If still not found, try to find by role name
                [userRows] = await connection.execute(`
                    SELECT u.email 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE r.name = ? AND u.is_active = TRUE
                `, [recipientName]);
                
                if (userRows.length === 0) {
                    // If not found by role name, try to find by permission
                    let permissionName = '';
                    switch(recipientType) {
                      case 'reviewer':
                        permissionName = 'requisition_review'; // Specific permission for reviewing requisitions
                        break;
                      case 'approver':
                        permissionName = 'requisition_approve';
                        break;
                      case 'authorizer':
                        permissionName = 'requisition_authorize'; // Specific permission for authorizing requisitions
                        break;
                    }
                    
                    if (permissionName) {
                      [userRows] = await connection.execute(`
                        SELECT DISTINCT u.email 
                        FROM users u 
                        JOIN roles r ON u.role_id = r.id 
                        JOIN role_permissions rp ON r.id = rp.role_id
                        JOIN permissions p ON rp.permission_id = p.id
                        WHERE p.name = ? AND u.is_active = TRUE
                      `, [permissionName]);
                    }
                }
                
                if (userRows.length > 0) {
                    // If multiple users have the same role or permission, pick the first one
                    recipientEmail = userRows[0].email;
                }
            }
        }
        
        switch(recipientType) {
            case 'reviewer':
                action = 'Review';
                break;
            case 'approver':
                action = 'Approval';
                break;
            case 'authorizer':
                action = 'Authorization';
                break;
        }
        
        if (!recipientEmail) {
            return res.status(400).json({ success: false, message: `Recipient email not found for ${recipientType}` });
        }
        
        // Create email content
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const requisitionUrl = `${frontendUrl}/requisitions/${requisition.unique_identifier}`;
        
        const htmlContent = `
            <html>
            <head><style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
                .content { margin: 20px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
                .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
            </style></head>
            <body>
                <div class="header">
                    <h2>Requisition Notification</h2>
                </div>
                <div class="content">
                    <p>Dear ${recipientName},</p>
                    <p>You have been requested to ${action.toLowerCase()} a requisition:</p>
                    <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                    <p><strong>Requestor:</strong> ${requisition.requestor_name}</p>
                    <p><strong>Department:</strong> ${requisition.department}</p>
                    <p><strong>Purpose:</strong> ${requisition.purpose}</p>
                    <p><strong>Status:</strong> ${requisition.status}</p>
                    <p>Please click the button below to access the requisition and complete the ${action.toLowerCase()}:</p>
                    <a href="${frontendUrl}/requisitions/${requisition.unique_identifier}" class="button">View Requisition</a>
                    <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisition.unique_identifier}">${frontendUrl}/requisitions/${requisition.unique_identifier}</a></p>
                </div>
                <div class="footer">
                    <p>This is an automated notification from SOKAPP Requisition System.</p>
                </div>
            </body>
            </html>
        `;
        
        // Send the email
        const emailResult = await sendEmailNotification(
            recipientEmail,
            `Requisition ${action} Required - #${requisitionId}`,
            htmlContent
        );
        
        if (emailResult.success) {
            res.status(200).json({ success: true, message: `Notification email sent successfully to ${recipientEmail}` });
        } else {
            res.status(500).json({ success: false, message: `Failed to send email: ${emailResult.message}` });
        }
        
    } catch (error) {
        console.error('Error sending notification email:', error);
        res.status(500).json({ success: false, message: 'Failed to send notification email', error: error.message });
    } finally {
        await connection.end();
    }
});

// Endpoint to get workflow settings (reviewers, approvers, authorizers)
app.get('/api/workflow-settings', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // Get all users grouped by role for workflow assignments
        const [usersWithRoles] = await connection.execute(`
            SELECT u.id, u.full_name, u.email, u.phone, u.department, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.is_active = TRUE
            ORDER BY r.name, u.full_name
        `);
        
        // Get all roles for dropdown options
        const [roles] = await connection.execute('SELECT id, name, description FROM roles ORDER BY name');
        
        res.status(200).json({ 
            success: true, 
            users: usersWithRoles,
            roles: roles
        });
    } catch (error) {
        console.error('Error fetching workflow settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch workflow settings', error: error.message });
    } finally {
        await connection.end();
    }
});

// Endpoint to save workflow settings
app.post('/api/workflow-settings', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { workflowSettings } = req.body;
        // This endpoint would save workflow settings to a dedicated table
        // For now, we'll just return success as the settings are typically saved in the requisition form itself
        
        res.status(200).json({ 
            success: true, 
            message: 'Workflow settings saved successfully' 
        });
    } catch (error) {
        console.error('Error saving workflow settings:', error);
        res.status(500).json({ success: false, message: 'Failed to save workflow settings', error: error.message });
    } finally {
        await connection.end();
    }
});

// Endpoint to send notifications to users with specific permissions
app.post('/api/requisition/:id/send-notification-by-permission', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const requisitionId = req.params.id;
        const { permissionType } = req.body; // 'review', 'approval', 'authorization'
        
        // Fetch requisition details
        const [requisitionRows] = await connection.execute(
            'SELECT * FROM requisitions WHERE id = ?',
            [requisitionId]
        );
        
        if (requisitionRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Requisition not found' });
        }
        
        const requisition = requisitionRows[0];
        
        // Map permission type to permission name and action
        let permissionName = '';
        let action = '';
        
        switch(permissionType) {
            case 'review':
                permissionName = 'requisition_review'; // For users who can review requisitions
                action = 'Review';
                break;
            case 'approval':
                permissionName = 'requisition_approve'; // For users who can approve requisitions
                action = 'Approval';
                break;
            case 'authorization':
                permissionName = 'requisition_authorize'; // For users who can authorize requisitions
                action = 'Authorization';
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid permission type' });
        }
        
        // Get all users with the specific permission
        const [usersWithPermission] = await connection.execute(`
            SELECT DISTINCT u.email, u.full_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name = ? AND u.is_active = TRUE
        `, [permissionName]);
        
        if (usersWithPermission.length === 0) {
            return res.status(404).json({ success: false, message: `No users found with ${permissionName} permission` });
        }
        
        // Send email to each user with the permission
        let successCount = 0;
        let failureCount = 0;
        
        for (const user of usersWithPermission) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const htmlContent = `
                <html>
                <head><style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
                    .content { margin: 20px 0; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                    .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
                </style></head>
                <body>
                    <div class="header">
                        <h2>Requisition Notification</h2>
                    </div>
                    <div class="content">
                        <p>Dear ${user.full_name},</p>
                        <p>You have been requested to ${action.toLowerCase()} a requisition:</p>
                        <p><strong>Requisition ID:</strong> #${requisitionId}</p>
                        <p><strong>Requestor:</strong> ${requisition.requestor_name}</p>
                        <p><strong>Department:</strong> ${requisition.department}</p>
                        <p><strong>Purpose:</strong> ${requisition.purpose}</p>
                        <p><strong>Status:</strong> ${requisition.status}</p>
                        <p>Please click the button below to access the requisition and complete the ${action.toLowerCase()}:</p>
                        <a href="${frontendUrl}/requisitions/${requisitionId}" class="button">View Requisition</a>
                        <p>Alternatively, you can access it directly at: <a href="${frontendUrl}/requisitions/${requisitionId}">${frontendUrl}/requisitions/${requisitionId}</a></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from SOKAPP Requisition System.</p>
                    </div>
                </body>
                </html>
            `;
            
            const emailResult = await sendEmailNotification(
                user.email,
                `Requisition ${action} Required - #${requisitionId}`,
                htmlContent
            );
            
            if (emailResult.success) {
                successCount++;
            } else {
                failureCount++;
                console.error(`Failed to send email to ${user.email}:`, emailResult.message);
            }
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Notification emails sent successfully to ${successCount} users${failureCount > 0 ? ` with ${failureCount} failures` : ''}`,
            details: {
                sentTo: successCount,
                failed: failureCount,
                totalEligible: usersWithPermission.length
            }
        });
        
    } catch (error) {
        console.error('Error sending notification by permission:', error);
        res.status(500).json({ success: false, message: 'Failed to send notification by permission', error: error.message });
    } finally {
        await connection.end();
    }
});

// API endpoints for managing requisition roles in admin dashboard

// GET all requisition roles
app.get('/api/requisition-roles', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(`
            SELECT rr.id, rr.user_id, u.full_name, u.email, rr.role_type, rr.is_active, rr.created_at, rr.updated_at
            FROM requisition_roles rr
            JOIN users u ON rr.user_id = u.id
            ORDER BY rr.role_type, u.full_name
        `);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching requisition roles:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisition roles', error: error.message });
    } finally {
        await connection.end();
    }
});

// POST add/update requisition role
app.post('/api/requisition-roles', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { user_id, role_type } = req.body;

        // Validate input
        if (!user_id || !role_type || !['reviewer', 'approver', 'authorizer', 'finance'].includes(role_type)) {
            return res.status(400).json({ success: false, message: 'Invalid user_id or role_type' });
        }

        // Check if user exists
        const [userCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Insert or update the role assignment
        await connection.execute(`
            INSERT INTO requisition_roles (user_id, role_type, is_active)
            VALUES (?, ?, TRUE)
            ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP
        `, [user_id, role_type]);

        res.status(200).json({ success: true, message: 'Requisition role assigned successfully' });
    } catch (error) {
        console.error('Error assigning requisition role:', error);
        res.status(500).json({ success: false, message: 'Failed to assign requisition role', error: error.message });
    } finally {
        await connection.end();
    }
});

// DELETE remove requisition role
app.delete('/api/requisition-roles/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const roleId = req.params.id;
        await connection.execute('DELETE FROM requisition_roles WHERE id = ?', [roleId]);
        res.status(200).json({ success: true, message: 'Requisition role removed successfully' });
    } catch (error) {
        console.error('Error removing requisition role:', error);
        res.status(500).json({ success: false, message: 'Failed to remove requisition role', error: error.message });
    } finally {
        await connection.end();
    }
});

// PUT toggle requisition role active status
app.put('/api/requisition-roles/:id/toggle', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const roleId = req.params.id;
        const [row] = await connection.execute('SELECT is_active FROM requisition_roles WHERE id = ?', [roleId]);
        if (row.length === 0) {
            return res.status(404).json({ success: false, message: 'Requisition role not found' });
        }

        const newStatus = !row[0].is_active;
        await connection.execute('UPDATE requisition_roles SET is_active = ? WHERE id = ?', [newStatus, roleId]);

        res.status(200).json({ success: true, message: `Requisition role ${newStatus ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Error toggling requisition role:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle requisition role', error: error.message });
    } finally {
        await connection.end();
    }
});

// Endpoint to change user password
app.post('/api/users/change-password', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { user_id, current_password, new_password } = req.body;
        
        if (!user_id || !current_password || !new_password) {
            return res.status(400).json({ success: false, message: 'User ID, current password, and new password are required' });
        }
        
        // Get the user's current password
        const [users] = await connection.execute(
            'SELECT id, password FROM users WHERE id = ?',
            [user_id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const user = users[0];
        
        // Compare the current password with the stored hashed password
        const isValidCurrentPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidCurrentPassword) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        
        // Validate new password strength
        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
        }
        
        // Additional password strength check
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(new_password)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
        }
        
        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(new_password, 12);
        
        // Update the password in the database
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, user_id]
        );
        
        res.status(200).json({ success: true, message: 'Password changed successfully' });
        
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
    } finally {
        await connection.end();
    }
});

// ========== USER ACTIVITY REPORTING ROUTES ==========
const userActivityRoutes = require('./routes/userActivity.routes');
app.use('/api/user-activity', userActivityRoutes);

console.log('✅ User Activity API endpoint registered at /api/user-activity');

// ========== CHILD MANAGEMENT ROUTES ==========
const childRoutes = require('./routes/children.routes');
app.use('/api/children', childRoutes);

// ========== RESOURCE MANAGEMENT ROUTES ==========
const roomsRoutes = require('./routes/rooms.routes');
const bedsRoutes = require('./routes/beds.routes');
const fixedAssetsRoutes = require('./routes/fixedAssets.routes');
app.use('/api/rooms', roomsRoutes);
app.use('/api/beds', bedsRoutes);
app.use('/api/fixed-assets', fixedAssetsRoutes);

// ========== PROGRAMS ROUTES ==========
/**
 * GET /api/programs
 * Get all active programs
 */
app.get('/api/programs', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [programs] = await connection.execute(
            `SELECT id, name, description, is_active 
             FROM programs 
             WHERE is_active = TRUE 
             ORDER BY name`
        );
        
        res.status(200).json({
            success: true,
            count: programs.length,
            programs: programs
        });
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch programs',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});


// ==================== USER PROFILE PICTURE UPLOAD ====================

/**
 * POST /api/users/upload-profile-picture
 * Upload/update user's profile picture (stores as Base64 in employees table)
 */
app.post('/api/users/upload-profile-picture', upload.single('profilePhoto'), async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        // Get user's email first
        const [users] = await connection.execute(
            'SELECT id, full_name, email FROM users WHERE id = ?',
            [user_id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const userEmail = users[0].email;
        
        // Check if employee record exists for this user's email
        const [employees] = await connection.execute(
            'SELECT id, profile_image FROM employees WHERE email = ?',
            [userEmail]
        );
        
        // Compress image before storing in database
        const maxFileSize = 2 * 1024 * 1024; // 2MB limit for database storage
        
        let compressedImageBuffer = req.file.buffer;
        let compressed = false;
        
        // Check if image needs compression (simple check - if over 2MB, reject)
        if (req.file.size > maxFileSize) {
            return res.status(413).json({
                success: false,
                message: 'Image is too large. Maximum allowed size is 2MB. Please choose a smaller image or reduce its dimensions before uploading.',
                maxSize: '2MB',
                currentSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`
            });
        }
        
        // Convert file to Base64 string for database storage
        const base64Image = compressedImageBuffer.toString('base64');
        const mimeType = req.file.mimetype;
        
        // Create data URL format: data:mimeType;base64,base64String
        const imageData = `data:${mimeType};base64,${base64Image}`;
        
        // Check if the final Base64 string is too large for MySQL
        // Base64 increases size by ~33%, so 2MB file becomes ~2.67MB
        const estimatedPacketSize = Buffer.byteLength(imageData, 'utf8');
        const mysqlMaxPacket = 4 * 1024 * 1024; // 4MB safety limit (MySQL default is often 4MB or 16MB)
        
        if (estimatedPacketSize > mysqlMaxPacket) {
            return res.status(413).json({
                success: false,
                message: `Image is too large for database storage after encoding (${(estimatedPacketSize / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is ${(mysqlMaxPacket / 1024 / 1024).toFixed(0)}MB. Please choose a smaller image.`,
                maxSize: '2MB',
                encodedSize: `${(estimatedPacketSize / 1024 / 1024).toFixed(2)}MB`
            });
        }
        
        if (employees.length > 0) {
            // Update existing employee record
            await connection.execute(
                'UPDATE employees SET profile_image = ? WHERE email = ?',
                [imageData, userEmail]
            );
        } else {
            // Create new employee record with profile image
            await connection.execute(
                `INSERT INTO employees (full_name, email, profile_image, created_at, updated_at) 
                 VALUES (?, ?, ?, NOW(), NOW())`,
                [users[0].full_name, userEmail, imageData]
            );
        }
        
        // Log the activity
        await logUserActivity({
            userId: user_id,
            userEmail: userEmail,
            userName: users[0].full_name,
            roleId: null,
            roleName: null,
            activityType: 'profile_picture_update',
            module: 'User Management',
            actionDescription: 'User updated profile picture',
            status: 'success'
        });
        
        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                profileImage: imageData,
                originalName: req.file.originalname,
                size: compressedImageBuffer.length,
                mimeType: mimeType,
                compressed: compressed
            }
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        
        // Handle MySQL packet size error specifically
        if (error.code === 'ER_NET_PACKET_TOO_LARGE' || error.errno === 1153) {
            return res.status(413).json({
                success: false,
                message: 'Image is too large for database storage. Maximum allowed size is 2MB. Please choose a smaller image or reduce its dimensions.',
                maxSize: '2MB',
                details: 'The image exceeds MySQL\'s maximum packet size limit.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});


// ===== APPOINTMENTS ROUTES =====

// Get ALL appointments (system-wide calendar - visible to everyone)
app.get('/api/appointments/all', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const sql = `
            SELECT a.*, 
                   creator.full_name as creator_full_name,
                   creator.email as creator_email,
                   GROUP_CONCAT(DISTINCT attendee.full_name ORDER BY attendee.full_name SEPARATOR ', ') as attendee_names,
                   GROUP_CONCAT(DISTINCT attendee.email ORDER BY attendee.email SEPARATOR ', ') as attendee_emails,
                   GROUP_CONCAT(DISTINCT aa.user_id ORDER BY attendee.full_name SEPARATOR ',') as attendee_user_ids
            FROM appointments a
            JOIN users creator ON a.creator_user_id = creator.id
            LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
            LEFT JOIN users attendee ON aa.user_id = attendee.id
            GROUP BY a.id
            ORDER BY a.start_datetime DESC
        `;
        const [results] = await connection.execute(sql);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    } finally {
        await connection.end();
    }
});

// Get appointments by date range (for calendar view - system-wide)
app.get('/api/appointments/range', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { startDate, endDate } = req.query;
        
        const sql = `
            SELECT a.*, 
                   creator.full_name as creator_full_name,
                   creator.email as creator_email,
                   GROUP_CONCAT(DISTINCT attendee.full_name ORDER BY attendee.full_name SEPARATOR ', ') as attendee_names,
                   GROUP_CONCAT(DISTINCT attendee.email ORDER BY attendee.email SEPARATOR ', ') as attendee_emails,
                   GROUP_CONCAT(DISTINCT aa.user_id ORDER BY attendee.full_name SEPARATOR ',') as attendee_user_ids
            FROM appointments a
            JOIN users creator ON a.creator_user_id = creator.id
            LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
            LEFT JOIN users attendee ON aa.user_id = attendee.id
            WHERE a.start_datetime BETWEEN ? AND ?
            GROUP BY a.id
            ORDER BY a.start_datetime ASC
        `;
        const [results] = await connection.execute(sql, [startDate, endDate]);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching appointments by range:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    } finally {
        await connection.end();
    }
});

// Get current user's personal appointments
app.get('/api/appointments', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // For now, get all appointments since we don't have auth
        // TODO: Filter by logged-in user when auth is implemented
        const sql = `
            SELECT a.*, 
                   creator.full_name as creator_full_name,
                   creator.email as creator_email,
                   GROUP_CONCAT(DISTINCT attendee.full_name ORDER BY attendee.full_name SEPARATOR ', ') as attendee_names,
                   GROUP_CONCAT(DISTINCT attendee.email ORDER BY attendee.email SEPARATOR ', ') as attendee_emails,
                   GROUP_CONCAT(DISTINCT aa.user_id ORDER BY attendee.full_name SEPARATOR ',') as attendee_user_ids
            FROM appointments a
            JOIN users creator ON a.creator_user_id = creator.id
            LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
            LEFT JOIN users attendee ON aa.user_id = attendee.id
            GROUP BY a.id
            ORDER BY a.start_datetime DESC
        `;
        const [results] = await connection.execute(sql);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    } finally {
        await connection.end();
    }
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { title, description, attendee_user_ids, start_datetime, end_datetime, location, reminder_minutes_before } = req.body;
        
        // Support both single attendee (backward compatibility) and multiple attendees
        const attendees = Array.isArray(attendee_user_ids) ? attendee_user_ids : [attendee_user_ids];
        
        // TODO: Get creator from authentication when implemented
        // For now, use first user as default creator (you should implement proper auth)
        const creator_user_id = 1; // Replace with actual authenticated user ID
        
        // Validate required fields
        if (!title || !attendees || attendees.length === 0 || !start_datetime || !end_datetime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, at least one attendee, start time, and end time are required' 
            });
        }
        
        // Set default reminder time if not provided (1 minute)
        const reminderTime = reminder_minutes_before ? parseInt(reminder_minutes_before) : 1;
        
        // Insert appointment - include attendee_user_id for backward compatibility
        // Use first attendee as the primary attendee_user_id
        const primaryAttendeeId = attendees[0];
        
        const sql = `INSERT INTO appointments 
                     (creator_user_id, attendee_user_id, title, description, start_datetime, end_datetime, location, status, reminder_minutes_before) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await connection.execute(sql, [creator_user_id, primaryAttendeeId, title, description, start_datetime, end_datetime, location, 'scheduled', reminderTime]);
        const appointmentId = result.insertId;
        
        // Insert all attendees into junction table
        if (attendees.length > 0) {
            // Use individual inserts for each attendee
            for (const attendeeId of attendees) {
                const insertAttendeeSql = 'INSERT INTO appointment_attendees (appointment_id, user_id) VALUES (?, ?)';
                await connection.execute(insertAttendeeSql, [appointmentId, attendeeId]);
            }
        }
        
        res.json({ success: true, message: 'Appointment created successfully', id: appointmentId });
    } catch (error) {
        console.error('Error creating appointment:', error);
        console.error('Error details:', {
            message: error.message,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            errno: error.errno,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create appointment',
            error: error.message 
        });
    } finally {
        await connection.end();
    }
});

// Update appointment
app.put('/api/appointments/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const { title, description, attendee_user_ids, start_datetime, end_datetime, location, status, reminder_minutes_before } = req.body;
        
        // Support both single attendee (backward compatibility) and multiple attendees
        const attendees = Array.isArray(attendee_user_ids) ? attendee_user_ids : [attendee_user_ids];
        
        // Validate required fields
        if (!title || !attendees || attendees.length === 0 || !start_datetime || !end_datetime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, at least one attendee, start time, and end time are required' 
            });
        }
        
        // Set default reminder time if not provided (1 minute)
        const reminderTime = reminder_minutes_before !== undefined ? parseInt(reminder_minutes_before) : 1;
        
        // Get current appointment to preserve existing values for missing fields
        const [currentRows] = await connection.execute('SELECT * FROM appointments WHERE id = ?', [id]);
        const currentAppointment = currentRows.length > 0 ? currentRows[0] : null;
        
        // Ensure all fields have proper values
        // For optional fields not provided, use current DB values or defaults
        const safeDescription = description !== undefined ? (description || null) : (currentAppointment?.description || null);
        const safeLocation = location !== undefined ? (location || null) : (currentAppointment?.location || null);
        const safeStatus = status !== undefined ? (status || 'pending') : (currentAppointment?.status || 'scheduled');
        
        const primaryAttendeeId = currentAppointment?.attendee_user_id || attendees[0];
        
        // Update appointment - keep the original primary attendee
        const sql = `UPDATE appointments 
                     SET title=?, description=?, start_datetime=?, end_datetime=?, location=?, status=?, reminder_minutes_before=?, attendee_user_id=?
                     WHERE id=?`;
        
        await connection.execute(sql, [title, safeDescription, start_datetime, end_datetime, safeLocation, safeStatus, reminderTime, primaryAttendeeId, id]);
        
        // Update attendees in junction table: delete old ones and insert new ones
        const deleteSql = 'DELETE FROM appointment_attendees WHERE appointment_id = ?';
        await connection.execute(deleteSql, [id]);
        
        if (attendees.length > 0) {
            // Insert all attendees into junction table
            for (const attendeeId of attendees) {
                const insertAttendeeSql = 'INSERT INTO appointment_attendees (appointment_id, user_id) VALUES (?, ?)';
                await connection.execute(insertAttendeeSql, [id, attendeeId]);
            }
        }
        
        res.json({ success: true, message: 'Appointment updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        console.error('Error details:', {
            message: error.message,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            errno: error.errno,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: 'Failed to update appointment' });
    } finally {
        await connection.end();
    }
});

// Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM appointments WHERE id=?';
        await connection.execute(sql, [id]);
        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete appointment' });
    } finally {
        await connection.end();
    }
});

// Get all users (for attendee selection dropdown)
app.get('/api/users/list', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const sql = 'SELECT id, full_name, email FROM users ORDER BY full_name';
        const [results] = await connection.execute(sql);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    } finally {
        await connection.end();
    }
});

// 404 handler for API routes (should come before React catch-all)
app.use((req, res, next) => {
    // If it's an API route that wasn't found, return 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            success: false, 
            message: `API endpoint ${req.path} not found` 
        });
    }
    // Otherwise, pass to React app
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Catch-all handler to serve React app for all other routes (SPA)
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});