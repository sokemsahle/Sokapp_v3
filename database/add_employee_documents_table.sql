-- SQL to add employee documents table
-- Run this to create the employee_documents table in your database

CREATE TABLE IF NOT EXISTS employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    notes TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_documents_employee_id (employee_id),
    INDEX idx_employee_documents_type (type),
    INDEX idx_employee_documents_expiry_date (expiry_date)
);

-- Verify table creation
DESCRIBE employee_documents;

-- Show sample data (should be empty initially)
SELECT * FROM employee_documents LIMIT 5;