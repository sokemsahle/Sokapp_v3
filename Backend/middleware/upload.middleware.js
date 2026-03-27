const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration - Store in memory for database storage
const storage = multer.memoryStorage();

// File filter - allow images and documents
const fileFilter = (req, file, cb) => {
    // Allowed image types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Allowed document types
    const allowedDocumentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    if (file.fieldname === 'profilePhoto' || file.fieldname === 'image') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, WebP) are allowed for profile photos'), false);
        }
    } else if (file.fieldname === 'documentFile' || file.fieldname === 'medicalReport' || file.fieldname === 'certificate') {
        if (allowedDocumentTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPEG, PNG'), false);
        }
    } else {
        cb(new Error('Unknown file field'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: fileFilter
});

module.exports = upload;
