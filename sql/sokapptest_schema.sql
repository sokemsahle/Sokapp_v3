-- SOKAPP Test Database Schema
-- Run this to create a fresh database with role-based access control

-- Create database
CREATE DATABASE IF NOT EXISTS sokapptest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sokapptest;

-- ============================================
-- USERS & ROLES TABLES
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    department VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FORMS MANAGEMENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    allowed_roles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EMPLOYEES TABLE (with role-based access)
-- ============================================

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- General Information
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(50),
    position VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(10, 2),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    
    -- Dashboard Fields (Leave Balance)
    annual_leave_days INT DEFAULT 21,
    sick_leave_days INT DEFAULT 10,
    used_annual_leave INT DEFAULT 0,
    used_sick_leave INT DEFAULT 0,
    
    -- Dashboard Fields (Recognition)
    recognition VARCHAR(255) DEFAULT NULL,
    recognition_date DATE DEFAULT NULL,
    
    -- Role-based Access Control
    assigned_role VARCHAR(50) DEFAULT NULL,
    accessible_roles JSON DEFAULT NULL,
    visibility ENUM('public', 'role_based', 'private') DEFAULT 'public',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_employees_email (email),
    INDEX idx_employees_department (department),
    INDEX idx_employees_assigned_role (assigned_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REQUISITIONS TABLE (with role-based access)
-- ============================================

CREATE TABLE IF NOT EXISTS requisitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestor_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    purpose TEXT,
    request_date DATE,
    signature_data LONGTEXT,
    grand_total DECIMAL(10, 2) DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    
    -- Role-based Access Control
    assigned_role VARCHAR(50) DEFAULT NULL,
    accessible_roles JSON DEFAULT NULL,
    visibility ENUM('public', 'role_based', 'private') DEFAULT 'public',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_requisitions_assigned_role (assigned_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Requisition Items
CREATE TABLE IF NOT EXISTS requisition_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id INT NOT NULL,
    description TEXT,
    quantity INT,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Requisition Roles (Workflow assignments)
CREATE TABLE IF NOT EXISTS requisition_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_type ENUM('reviewer', 'approver', 'authorizer', 'finance') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator with full access'),
('Finance', 'Finance department access'),
('HR', 'Human Resources department access'),
('Director', 'Director level access'),
('Teacher', 'Teaching staff access'),
('Standard', 'Standard user access')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
('user_manage', 'Manage users'),
('form_manage', 'Manage forms'),
('employee_view', 'View employees'),
('employee_edit', 'Edit employees'),
('requisition_view', 'View requisitions'),
('requisition_create', 'Create requisitions'),
('requisition_approve', 'Approve requisitions'),
('settings_view', 'View settings')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Insert default forms with role-based access
INSERT INTO forms (name, description, is_active, allowed_roles) VALUES
('Requisition Form', 'Request for materials, supplies, or services', TRUE, '["admin", "Finance", "Director"]'),
('Employee Form', 'Employee information and records', TRUE, '["admin", "HR", "Director"]')
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    is_active = VALUES(is_active);

-- ============================================
-- VERIFY TABLES
-- ============================================

SHOW TABLES;

-- Verify data
SELECT 'Roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Forms', COUNT(*) FROM forms;
