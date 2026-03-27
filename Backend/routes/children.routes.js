const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const upload = require('../middleware/upload.middleware');
const { logUserActivity } = require('../utils/activityLogger');

// No auth or permission middleware - same as other routes in this app

// ========== TIER 1 ROUTES - CORE CHILD MANAGEMENT ==========

/**
 * GET /api/children
 * Get all children with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, gender, program_id } = req.query;
        const filters = {};
        
        if (status) filters.status = status;
        if (gender) filters.gender = gender;
        if (program_id) filters.program_id = program_id;

        const children = await Child.getAll(filters);
        
        res.status(200).json({
            success: true,
            count: children.length,
            data: children
        });
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch children',
            error: error.message
        });
    }
});

/**
 * GET /api/children/:id/export/pdf
 * Export individual child profile as JSON (for PDF generation on frontend)
 * MUST BE BEFORE /:id route to match first
 */
router.get('/:id/export/pdf', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        // Get all related data
        const [guardians, legalDocs, medicalRecords, educationRecords, caseHistory] = await Promise.all([
            Child.getGuardians(req.params.id),
            Child.getLegalDocuments(req.params.id),
            Child.getMedicalRecords(req.params.id),
            Child.getEducationRecords(req.params.id),
            Child.getCaseHistory(req.params.id)
        ]);
        
        // Compile complete profile data
        const profileData = {
            basicInfo: child,
            guardians,
            legalDocuments: legalDocs,
            medicalRecords: medicalRecords,
            educationRecords: educationRecords,
            caseHistory
        };
        
        res.status(200).json({
            success: true,
            data: profileData
        });
    } catch (error) {
        console.error('Error exporting child profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export child profile',
            error: error.message
        });
    }
});

/**
 * GET /api/children/:id
 * Get child by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        res.status(200).json({
            success: true,
            data: child
        });
    } catch (error) {
        console.error('Error fetching child:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch child',
            error: error.message
        });
    }
});

/**
 * POST /api/children
 * Create new child
 */
router.post('/', async (req, res) => {
    try {
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        
        const childId = await Child.create(req.body);
        
        const newChild = await Child.getById(childId);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'create',
                module: 'Child Profile Management',
                actionDescription: `Created new child profile: ${newChild?.full_name || 'Unknown'}`,
                tableName: 'children',
                recordId: childId,
                newValues: newChild,
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log child creation activity:', logError);
        }
        
        res.status(201).json({
            success: true,
            message: 'Child profile created successfully',
            data: newChild
        });
    } catch (error) {
        console.error('Error creating child:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create child profile',
            error: error.message
        });
    }
});

/**
 * PUT /api/children/:id
 * Update child
 */
router.put('/:id', async (req, res) => {
    try {
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        
        // Get current child data before update
        const currentChild = await Child.getById(req.params.id);
        
        const updated = await Child.update(req.params.id, req.body);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Child not found or no changes made'
            });
        }

        const child = await Child.getById(req.params.id);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'update',
                module: 'Child Profile Management',
                actionDescription: `Updated child profile: ${child?.full_name || 'Unknown'}`,
                tableName: 'children',
                recordId: parseInt(req.params.id),
                oldValues: currentChild,
                newValues: child,
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log child update activity:', logError);
        }
        
        res.status(200).json({
            success: true,
            message: 'Child profile updated successfully',
            data: child
        });
    } catch (error) {
        console.error('Error updating child:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update child profile',
            error: error.message
        });
    }
});

/**
 * DELETE /api/children/:id
 * Delete child (cascades to all Tier 2 tables)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { userId, userEmail, userName, roleId, roleName } = req.body;
        
        // Get child data before deletion
        const childToDelete = await Child.getById(req.params.id);
        
        if (!childToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }
        
        await Child.delete(req.params.id);
        
        // Log activity
        try {
            await logUserActivity({
                userId,
                userEmail,
                userName,
                roleId,
                roleName,
                activityType: 'delete',
                module: 'Child Profile Management',
                actionDescription: `Deleted child profile: ${childToDelete.full_name}`,
                tableName: 'children',
                recordId: parseInt(req.params.id),
                oldValues: childToDelete,
                status: 'success'
            });
        } catch (logError) {
            console.error('Failed to log child deletion activity:', logError);
        }
        
        res.status(200).json({
            success: true,
            message: 'Child profile deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting child:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete child profile',
            error: error.message
        });
    }
});

// ========== TIER 2 ROUTES - GUARDIAN INFORMATION ==========

/**
 * GET /api/children/:id/guardians
 * Get guardians for a child
 */
router.get('/:id/guardians', async (req, res) => {
    try {
        // Verify child exists
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const guardians = await Child.getGuardians(req.params.id);
        
        res.status(200).json({
            success: true,
            count: guardians.length,
            data: guardians
        });
    } catch (error) {
        console.error('Error fetching guardians:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guardians',
            error: error.message
        });
    }
});

/**
 * POST /api/children/:id/guardians
 * Add guardian to child
 */
router.post('/:id/guardians', async (req, res) => {
    try {
        // Verify child exists
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const guardianId = await Child.addGuardian(req.params.id, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Guardian added successfully',
            data: { id: guardianId, ...req.body }
        });
    } catch (error) {
        console.error('Error adding guardian:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add guardian',
            error: error.message
        });
    }
});

// ========== TIER 2 ROUTES - LEGAL DOCUMENTS ==========

// FILE UPLOAD ROUTES MUST COME BEFORE GENERIC ROUTES

/**
 * POST /api/children/:id/legal-documents/upload
 * Upload legal document file (stores as Base64 in database)
 */
router.post('/:id/legal-documents/upload', upload.single('documentFile'), async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Convert file to Base64 string for database storage
        const base64File = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname;
        
        // Create data URL format: data:mimeType;base64,base64String
        const documentData = `data:${mimeType};base64,${base64File}`;

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                documentFile: documentData,
                originalName: originalName,
                size: req.file.size,
                mimeType: mimeType
            }
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
            error: error.message
        });
    }
});

/**
 * GET /api/children/:id/legal-documents
 * Get legal documents for a child
 */
router.get('/:id/legal-documents', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const documents = await Child.getLegalDocuments(req.params.id);
        
        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error('Error fetching legal documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch legal documents',
            error: error.message
        });
    }
});

/**
 * POST /api/children/:id/legal-documents
 * Add legal document to child
 */
router.post('/:id/legal-documents', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const docId = await Child.addLegalDocument(req.params.id, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Legal document added successfully',
            data: { id: docId, ...req.body }
        });
    } catch (error) {
        console.error('Error adding legal document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add legal document',
            error: error.message
        });
    }
});

// ========== TIER 2 ROUTES - MEDICAL RECORDS ==========

/**
 * POST /api/children/:id/medical-records/upload
 * Upload medical report file (stores as Base64 in database)
 */
router.post('/:id/medical-records/upload', upload.single('medicalReport'), async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Convert file to Base64 string for database storage
        const base64File = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname;
        
        // Create data URL format: data:mimeType;base64,base64String
        const reportData = `data:${mimeType};base64,${base64File}`;

        res.status(200).json({
            success: true,
            message: 'Medical report uploaded successfully',
            data: {
                medicalReportFile: reportData,
                originalName: originalName,
                size: req.file.size,
                mimeType: mimeType
            }
        });
    } catch (error) {
        console.error('Error uploading medical report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload medical report',
            error: error.message
        });
    }
});

/**
 * GET /api/children/:id/medical-records
 * Get medical records for a child
 */
router.get('/:id/medical-records', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const records = await Child.getMedicalRecords(req.params.id);
        
        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medical records',
            error: error.message
        });
    }
});

/**
 * POST /api/children/:id/medical-records
 * Add medical record to child
 */
router.post('/:id/medical-records', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const recordId = await Child.addMedicalRecord(req.params.id, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Medical record added successfully',
            data: { id: recordId, ...req.body }
        });
    } catch (error) {
        console.error('Error adding medical record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add medical record',
            error: error.message
        });
    }
});

// ========== TIER 2 ROUTES - EDUCATION RECORDS ==========

/**
 * POST /api/children/:id/education-records/upload
 * Upload education certificate file (stores as Base64 in database)
 */
router.post('/:id/education-records/upload', upload.single('certificate'), async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Convert file to Base64 string for database storage
        const base64File = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname;
        
        // Create data URL format: data:mimeType;base64,base64String
        const certificateData = `data:${mimeType};base64,${base64File}`;

        res.status(200).json({
            success: true,
            message: 'Certificate uploaded successfully',
            data: {
                certificateFile: certificateData,
                originalName: originalName,
                size: req.file.size,
                mimeType: mimeType
            }
        });
    } catch (error) {
        console.error('Error uploading certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload certificate',
            error: error.message
        });
    }
});

/**
 * GET /api/children/:id/education-records
 * Get education records for a child
 */
router.get('/:id/education-records', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const records = await Child.getEducationRecords(req.params.id);
        
        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        console.error('Error fetching education records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch education records',
            error: error.message
        });
    }
});

/**
 * POST /api/children/:id/education-records
 * Add education record to child
 */
router.post('/:id/education-records', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const recordId = await Child.addEducationRecord(req.params.id, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Education record added successfully',
            data: { id: recordId, ...req.body }
        });
    } catch (error) {
        console.error('Error adding education record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add education record',
            error: error.message
        });
    }
});

// ========== TIER 2 ROUTES - CASE HISTORY ==========

/**
 * GET /api/children/:id/case-history
 * Get case history for a child
 */
router.get('/:id/case-history', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const cases = await Child.getCaseHistory(req.params.id);
        
        res.status(200).json({
            success: true,
            count: cases.length,
            data: cases
        });
    } catch (error) {
        console.error('Error fetching case history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch case history',
            error: error.message
        });
    }
});

/**
 * POST /api/children/:id/case-history
 * Add case history to child
 */
router.post('/:id/case-history', async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const caseId = await Child.addCaseHistory(req.params.id, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Case history added successfully',
            data: { id: caseId, ...req.body }
        });
    } catch (error) {
        console.error('Error adding case history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add case history',
            error: error.message
        });
    }
});

// ========== FILE UPLOAD ROUTES ==========

/**
 * POST /api/children/:id/upload-photo
 * Upload profile photo for a child (stores as Base64 in database)
 */
router.post('/:id/upload-photo', upload.single('profilePhoto'), async (req, res) => {
    try {
        const child = await Child.getById(req.params.id);
        if (!child) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

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

        // Update the child's profile photo with Base64 data
        await Child.update(req.params.id, { profilePhoto: imageData });

        res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: {
                profilePhoto: imageData,
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
    }
});

/**
 * GET /api/children/export/csv
 * Export children list as CSV
 */
router.get('/export/csv', async (req, res) => {
    try {
        const { status, gender, program_id } = req.query;
        const filters = {};
        
        if (status) filters.status = status;
        if (gender) filters.gender = gender;
        if (program_id) filters.program_id = program_id;

        const children = await Child.getAll(filters);
        
        // CSV Header
        const headers = [
            'ID',
            'First Name',
            'Last Name',
            'Gender',
            'Date of Birth',
            'Estimated Age',
            'Nationality',
            'Blood Group',
            'Admission Date',
            'Status',
            'Program',
            'Created At'
        ];
        
        // CSV Rows
        const csvRows = children.map(child => [
            child.id,
            `"${(child.first_name || '').replace(/"/g, '""')}"`,
            `"${(child.last_name || '').replace(/"/g, '""')}"`,
            child.gender || '',
            child.date_of_birth || '',
            child.estimated_age || '',
            `"${(child.nationality || '').replace(/"/g, '""')}"`,
            child.blood_group || '',
            child.date_of_admission || '',
            child.current_status || '',
            `"${(child.program_name || '').replace(/"/g, '""')}"`,
            child.created_at || ''
        ]);
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');
        
        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="children_export_${new Date().toISOString().split('T')[0]}.csv"`);
        
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error exporting children:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export children',
            error: error.message
        });
    }
});

module.exports = router;
