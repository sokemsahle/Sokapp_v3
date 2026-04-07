const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

class ChildModel {
    /**
     * Get all children with optional filters
     */
    async getAll(filters = {}) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            let query = `
                SELECT c.*, u.full_name as admitted_by_name
                FROM children c
                LEFT JOIN users u ON c.admitted_by = u.id
                WHERE 1=1
            `;
            const params = [];

            // Apply filters
            if (filters.status) {
                query += ' AND c.current_status = ?';
                params.push(filters.status);
            }

            if (filters.gender) {
                query += ' AND c.gender = ?';
                params.push(filters.gender);
            }

            if (filters.program_id) {
                query += ' AND c.program_id = ?';
                params.push(filters.program_id);
            }

            query += ' ORDER BY c.created_at DESC';

            const [rows] = await connection.execute(query, params);
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Get child by ID with full profile
     */
    async getById(id) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [rows] = await connection.execute(
                `SELECT c.*, u.full_name as admitted_by_name
                 FROM children c
                 LEFT JOIN users u ON c.admitted_by = u.id
                 WHERE c.id = ?`,
                [id]
            );
            return rows[0] || null;
        } finally {
            await connection.end();
        }
    }

    /**
     * Create new child
     */
    async create(data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const {
                firstName, middleName, lastName, gender, dateOfBirth, ageType,
                placeOfBirth, nationality, religion, bloodGroup, disabilityStatus,
                disabilityDescription, healthStatus, dateOfAdmission, admittedBy,
                currentStatus, profilePhoto, program_id, room_id, bed_id, nickname
            } = data;
    
            const [result] = await connection.execute(
                `INSERT INTO children (
                    first_name, middle_name, last_name, nickname, gender, date_of_birth, date_of_birth_type,
                    place_of_birth, nationality, religion, blood_group, disability_status,
                    disability_description, health_status, date_of_admission, admitted_by,
                    current_status, profile_photo, program_id, room_id, bed_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    firstName, middleName || null, lastName, nickname || null, gender, dateOfBirth || null,
                    ageType || 'actual', placeOfBirth || null, nationality || null,
                    religion || null, bloodGroup || null, disabilityStatus || false,
                    disabilityDescription || null, healthStatus || null, dateOfAdmission,
                    admittedBy || null, currentStatus || 'Active', profilePhoto || null,
                    program_id || null, room_id || null, bed_id || null
                ]
            );
    
            // If bed is assigned, update bed status to occupied
            if (bed_id) {
                await connection.execute(
                    `UPDATE beds SET status = 'occupied' WHERE id = ?`,
                    [bed_id]
                );
            }
    
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    /**
     * Update child
     */
    async update(id, data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            // First, get the current child data to check for bed changes
            const [currentChild] = await connection.execute(
                `SELECT room_id, bed_id FROM children WHERE id = ?`,
                [id]
            );
            
            const fields = [];
            const values = [];

            // Build dynamic update query
            const allowedFields = {
                firstName: 'first_name',
                middleName: 'middle_name',
                lastName: 'last_name',
                nickname: 'nickname',
                gender: 'gender',
                dateOfBirth: 'date_of_birth',
                ageType: 'date_of_birth_type',
                placeOfBirth: 'place_of_birth',
                nationality: 'nationality',
                religion: 'religion',
                bloodGroup: 'blood_group',
                disabilityStatus: 'disability_status',
                disabilityDescription: 'disability_description',
                healthStatus: 'health_status',
                dateOfAdmission: 'date_of_admission',
                currentStatus: 'current_status',
                profilePhoto: 'profile_photo',
                program_id: 'program_id',
                room_id: 'room_id',
                bed_id: 'bed_id'
            };

            for (const [key, column] of Object.entries(allowedFields)) {
                if (data[key] !== undefined) {
                    // Convert empty strings to null for foreign key columns
                    let value = data[key];
                    if (value === '') {
                        value = null;
                    }
                    fields.push(`${column} = ?`);
                    values.push(value);
                }
            }

            if (fields.length === 0) return false;

            // Validate foreign key constraints before update
            if (data.program_id !== undefined) {
                if (data.program_id) {
                    const [programs] = await connection.execute(
                        `SELECT id FROM programs WHERE id = ?`,
                        [data.program_id]
                    );
                    if (programs.length === 0) {
                        throw new Error(`Program with ID ${data.program_id} does not exist`);
                    }
                } else {
                    // If program_id is empty/null, it's valid (will set to NULL)
                }
            }

            if (data.room_id !== undefined) {
                if (data.room_id) {
                    const [rooms] = await connection.execute(
                        `SELECT id FROM rooms WHERE id = ?`,
                        [data.room_id]
                    );
                    if (rooms.length === 0) {
                        throw new Error(`Room with ID ${data.room_id} does not exist`);
                    }
                } else {
                    // If room_id is empty/null, it's valid (will set to NULL)
                }
            }

            if (data.bed_id !== undefined) {
                if (data.bed_id) {
                    const [beds] = await connection.execute(
                        `SELECT id FROM beds WHERE id = ?`,
                        [data.bed_id]
                    );
                    if (beds.length === 0) {
                        throw new Error(`Bed with ID ${data.bed_id} does not exist`);
                    }
                } else {
                    // If bed_id is empty/null, it's valid (will set to NULL)
                }
            }

            values.push(id);
            const query = `UPDATE children SET ${fields.join(', ')} WHERE id = ?`;
            
            await connection.execute(query, values);
            
            // Handle bed status updates
            const oldBedId = currentChild[0]?.bed_id;
            const newBedId = data.bed_id;
            
            // If bed was removed or changed, mark old bed as available
            if (oldBedId && oldBedId !== newBedId) {
                await connection.execute(
                    `UPDATE beds SET status = 'available' WHERE id = ?`,
                    [oldBedId]
                );
            }
            
            // If new bed is assigned, mark it as occupied
            if (newBedId && newBedId !== oldBedId) {
                await connection.execute(
                    `UPDATE beds SET status = 'occupied' WHERE id = ?`,
                    [newBedId]
                );
            }
            
            return true;
        } finally {
            await connection.end();
        }
    }

    /**
     * Delete child
     */
    async delete(id) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            await connection.execute('DELETE FROM children WHERE id = ?', [id]);
            return true;
        } finally {
            await connection.end();
        }
    }

    // ========== TIER 2 METHODS ==========

    /**
     * Get guardians for a child
     */
    async getGuardians(childId) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM child_guardian_information WHERE child_id = ? ORDER BY created_at DESC',
                [childId]
            );
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Add guardian
     */
    async addGuardian(childId, data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const { guardianName, relationshipToChild, phone, address, aliveStatus, notes } = data;
            
            const [result] = await connection.execute(
                `INSERT INTO child_guardian_information 
                (child_id, guardian_name, relationship_to_child, phone, address, alive_status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [childId, guardianName, relationshipToChild, phone || null, address || null, aliveStatus !== false, notes || null]
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    /**
     * Get legal documents for a child
     */
    async getLegalDocuments(childId) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM child_legal_documents WHERE child_id = ? ORDER BY created_at DESC',
                [childId]
            );
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Add legal document
     */
    async addLegalDocument(childId, data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const { documentType, documentNumber, issueDate, expiryDate, documentFile, verifiedStatus } = data;
            
            const [result] = await connection.execute(
                `INSERT INTO child_legal_documents 
                (child_id, document_type, document_number, issue_date, expiry_date, document_file, verified_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [childId, documentType, documentNumber || null, issueDate || null, expiryDate || null, documentFile || null, verifiedStatus || false]
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    /**
     * Get medical records for a child
     */
    async getMedicalRecords(childId) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM child_medical_records WHERE child_id = ? ORDER BY created_at DESC',
                [childId]
            );
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Add medical record
     */
    async addMedicalRecord(childId, data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            // Common fields
            const { 
                note_type,
                medical_condition, 
                vaccination_status, 
                last_medical_checkup, 
                allergies, 
                medications, 
                doctor_name, 
                hospital_name, 
                medical_report_file,
                // Home Health Care Note fields
                age_years,
                height_cm,
                weight_kg,
                head_circumference_cm,
                weight_for_age_percentile,
                weight_for_height_percentile,
                height_for_age_percentile,
                temperature_celsius,
                respiration_rate,
                pulse_rate,
                spo2_percentage,
                other_vitals,
                present_illness,
                treatment_plan,
                // Ongoing Health Note fields
                performer_first_name,
                performer_middle_name,
                performer_last_name,
                medical_center_name,
                doctor_specialty,
                diagnosis,
                visit_reason,
                visit_details,
                next_appointment_date
            } = data;
            
            const [result] = await connection.execute(
                `INSERT INTO child_medical_records 
                (child_id, note_type, medical_condition, vaccination_status, last_medical_checkup, 
                 allergies, medications, doctor_name, hospital_name, medical_report_file,
                 age_years, height_cm, weight_kg, head_circumference_cm, 
                 weight_for_age_percentile, weight_for_height_percentile, height_for_age_percentile,
                 temperature_celsius, respiration_rate, pulse_rate, spo2_percentage, other_vitals,
                 present_illness, treatment_plan,
                 performer_first_name, performer_middle_name, performer_last_name,
                 medical_center_name, doctor_specialty, diagnosis, visit_reason, visit_details, 
                 next_appointment_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    childId, 
                    note_type || 'ongoing_health', 
                    medical_condition || null, 
                    vaccination_status || null, 
                    last_medical_checkup || null, 
                    allergies || null, 
                    medications || null, 
                    doctor_name || null, 
                    hospital_name || null, 
                    medical_report_file || null,
                    age_years || null,
                    height_cm || null,
                    weight_kg || null,
                    head_circumference_cm || null,
                    weight_for_age_percentile || null,
                    weight_for_height_percentile || null,
                    height_for_age_percentile || null,
                    temperature_celsius || null,
                    respiration_rate || null,
                    pulse_rate || null,
                    spo2_percentage || null,
                    other_vitals || null,
                    present_illness || null,
                    treatment_plan || null,
                    performer_first_name || null,
                    performer_middle_name || null,
                    performer_last_name || null,
                    medical_center_name || null,
                    doctor_specialty || null,
                    diagnosis || null,
                    visit_reason || null,
                    visit_details || null,
                    next_appointment_date || null
                ]
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    /**
     * Get education records for a child
     */
    async getEducationRecords(childId) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM child_education_records WHERE child_id = ? ORDER BY created_at DESC',
                [childId]
            );
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Add education record
     */
    async addEducationRecord(childId, data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const { schoolName, gradeLevel, enrollmentDate, performanceNotes, certificateFile } = data;
            
            const [result] = await connection.execute(
                `INSERT INTO child_education_records 
                (child_id, school_name, grade_level, enrollment_date, performance_notes, certificate_file)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [childId, schoolName || null, gradeLevel || null, enrollmentDate || null, performanceNotes || null, certificateFile || null]
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    /**
     * Get case history for a child
     */
    async getCaseHistory(childId) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM child_case_history WHERE child_id = ? ORDER BY report_date DESC',
                [childId]
            );
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Add case history
     */
    async addCaseHistory(childId, data) {
        const connection = await mysql.createConnection(dbConfig);
        try {
            const { caseType, description, reportedBy, reportDate, caseStatus } = data;
            
            const [result] = await connection.execute(
                `INSERT INTO child_case_history 
                (child_id, case_type, description, reported_by, report_date, case_status)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [childId, caseType, description || null, reportedBy || null, reportDate || null, caseStatus || 'Open']
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }
}

module.exports = new ChildModel();
