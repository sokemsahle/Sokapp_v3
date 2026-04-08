-- ============================================
-- RESOURCE MANAGEMENT SYSTEM
-- Dormitory Rooms and Beds Management
-- ============================================
-- Run this AFTER the child_management_schema.sql
-- Adds room and bed management with child assignment support

USE sokapptest;

-- ============================================
-- STEP 1: CREATE ROOMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_organization (organization_id),
    INDEX idx_room_name (room_name),
    
    CONSTRAINT fk_rooms_organization
        FOREIGN KEY (organization_id)
            REFERENCES users(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 2: CREATE BEDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    bed_number VARCHAR(50) NOT NULL,
    status ENUM('available', 'occupied') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_room (room_id),
    INDEX idx_status (status),
    
    CONSTRAINT fk_beds_room
        FOREIGN KEY (room_id)
            REFERENCES rooms(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: ALTER CHILDREN TABLE
-- Add room_id and bed_id columns
-- ============================================

ALTER TABLE children 
ADD COLUMN room_id INT AFTER current_status,
ADD COLUMN bed_id INT AFTER room_id;

-- Add foreign key constraints
ALTER TABLE children
ADD CONSTRAINT fk_children_room
    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE SET NULL;

ALTER TABLE children
ADD CONSTRAINT fk_children_bed
    FOREIGN KEY (bed_id)
        REFERENCES beds(id)
        ON DELETE SET NULL;

-- Add indexes for better performance
ALTER TABLE children
ADD INDEX idx_room (room_id),
ADD INDEX idx_bed (bed_id);

-- ============================================
-- STEP 4: ADD PERMISSIONS
-- ============================================

INSERT IGNORE INTO permissions (name, description, category) VALUES
('room_view', 'View dormitory rooms', 'Resources'),
('room_create', 'Create new rooms', 'Resources'),
('room_update', 'Update rooms', 'Resources'),
('room_delete', 'Delete rooms', 'Resources'),
('bed_view', 'View beds', 'Resources'),
('bed_create', 'Create new beds', 'Resources'),
('bed_update', 'Update beds', 'Resources'),
('bed_delete', 'Delete beds', 'Resources'),
('bed_assign', 'Assign beds to children', 'Resources');

-- Assign all resource permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.category = 'Resources'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- VERIFICATION
-- ============================================

SHOW TABLES LIKE 'rooms';
SHOW TABLES LIKE 'beds';

SELECT 'Rooms table created' as status;
SELECT 'Beds table created' as status;
SELECT 'Children table updated with room_id and bed_id' as status;

SELECT 'Resource Permissions Added' as status, COUNT(*) as count 
FROM permissions 
WHERE category = 'Resources';

-- Show columns in children table to verify
DESCRIBE children;
