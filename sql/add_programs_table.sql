-- Add Programs Table and program_id columns to existing tables
-- Run this after the main schema is set up

USE sokapptest;

-- ============================================
-- STEP 1: CREATE PROGRAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_programs_name (name),
    INDEX idx_programs_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default programs
INSERT INTO programs (name, description) VALUES
('Main Program', 'Primary residential care program'),
('Youth Program', 'Independent living program for older youth'),
('Emergency Program', 'Short-term emergency placement'),
('Family Reunification', 'Family strengthening and reunification services')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- STEP 2: ADD program_id TO EMPLOYEES TABLE
-- ============================================

ALTER TABLE employees 
ADD COLUMN program_id INT AFTER is_active,
ADD CONSTRAINT fk_employees_program 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX idx_employees_program ON employees(program_id);

-- ============================================
-- STEP 3: ADD program_id TO REQUISITIONS TABLE
-- ============================================

ALTER TABLE requisitions 
ADD COLUMN program_id INT AFTER visibility,
ADD CONSTRAINT fk_requisitions_program 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX idx_requisitions_program ON requisitions(program_id);

-- ============================================
-- STEP 4: ADD program_id TO USERS TABLE
-- ============================================

ALTER TABLE users 
ADD COLUMN program_id INT AFTER role_id,
ADD CONSTRAINT fk_users_program 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX idx_users_program ON users(program_id);

-- ============================================
-- STEP 5: ADD program_id TO INVENTORY TABLE
-- ============================================

ALTER TABLE inventory 
ADD COLUMN program_id INT AFTER is_active,
ADD CONSTRAINT fk_inventory_program 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX idx_inventory_program ON inventory(program_id);

-- ============================================
-- STEP 6: ADD program_id TO CHILDREN TABLE
-- ============================================

ALTER TABLE children 
ADD COLUMN program_id INT AFTER profile_photo,
ADD CONSTRAINT fk_children_program 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX idx_children_program ON children(program_id);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Programs created:' as message, COUNT(*) as count FROM programs
UNION ALL
SELECT 'Employees with program_id:', COUNT(*) FROM employees WHERE program_id IS NOT NULL
UNION ALL
SELECT 'Requisitions with program_id:', COUNT(*) FROM requisitions WHERE program_id IS NOT NULL
UNION ALL
SELECT 'Users with program_id:', COUNT(*) FROM users WHERE program_id IS NOT NULL
UNION ALL
SELECT 'Inventory with program_id:', COUNT(*) FROM inventory WHERE program_id IS NOT NULL
UNION ALL
SELECT 'Children with program_id:', COUNT(*) FROM children WHERE program_id IS NOT NULL;
