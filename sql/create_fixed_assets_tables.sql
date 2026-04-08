-- ============================================
-- QUICK FIX: Create Fixed Assets Tables
-- Run this to fix the 500 error on /api/fixed-assets
-- ============================================

USE sokapptest;

-- Drop tables if they exist (to recreate with proper schema)
DROP TABLE IF EXISTS asset_maintenance_log;
DROP TABLE IF EXISTS fixed_assets;

-- Create Fixed Assets Table
CREATE TABLE fixed_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    asset_category VARCHAR(100) NOT NULL,
    asset_code VARCHAR(50) UNIQUE,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(150),
    model VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    supplier VARCHAR(200),
    warranty_period_months INT,
    warranty_expiry_date DATE,
    location VARCHAR(200),
    condition_status ENUM('excellent', 'good', 'fair', 'poor', 'damaged') DEFAULT 'good',
    availability_status ENUM('available', 'in_use', 'under_maintenance', 'retired') DEFAULT 'available',
    assigned_to VARCHAR(200),
    notes TEXT,
    depreciation_rate DECIMAL(5, 2) DEFAULT 0.00,
    current_value DECIMAL(12, 2),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_organization (organization_id),
    INDEX idx_asset_category (asset_category),
    INDEX idx_asset_code (asset_code),
    INDEX idx_condition_status (condition_status),
    INDEX idx_availability_status (availability_status),
    
    CONSTRAINT fk_fixed_assets_organization
        FOREIGN KEY (organization_id)
            REFERENCES users(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Asset Maintenance Log Table
CREATE TABLE asset_maintenance_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type ENUM('routine', 'repair', 'inspection', 'replacement') NOT NULL,
    description TEXT NOT NULL,
    performed_by VARCHAR(200),
    cost DECIMAL(10, 2),
    next_scheduled_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_asset (asset_id),
    INDEX idx_maintenance_date (maintenance_date),
    
    CONSTRAINT fk_maintenance_asset
        FOREIGN KEY (asset_id)
            REFERENCES fixed_assets(id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add asset categories to lookup if not exists
INSERT INTO lookup_lists (category, item_name, sort_order, is_active)
VALUES 
    ('Asset Category', 'Furniture & Fixtures', 1, 1),
    ('Asset Category', 'Office Equipment', 2, 1),
    ('Asset Category', 'IT Equipment', 3, 1),
    ('Asset Category', 'Vehicles', 4, 1),
    ('Asset Category', 'Machinery & Equipment', 5, 1),
    ('Asset Category', 'Appliances', 6, 1),
    ('Asset Category', 'Sports & Recreation Equipment', 7, 1),
    ('Asset Category', 'Kitchen Equipment', 8, 1),
    ('Asset Category', 'Medical Equipment', 9, 1),
    ('Asset Category', 'Other', 10, 1)
ON DUPLICATE KEY UPDATE item_name = item_name;

-- Add permissions
INSERT INTO permissions (name, description, category)
VALUES
    ('asset_view', 'View fixed assets', 'Fixed Assets'),
    ('asset_create', 'Create new fixed assets', 'Fixed Assets'),
    ('asset_update', 'Update fixed assets', 'Fixed Assets'),
    ('asset_delete', 'Delete fixed assets', 'Fixed Assets'),
    ('asset_maintenance', 'Record asset maintenance', 'Fixed Assets')
ON DUPLICATE KEY UPDATE name = name;

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.category = 'Fixed Assets'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Verify creation
SELECT '✅ Fixed Assets tables created successfully!' as status;
DESCRIBE fixed_assets;
DESCRIBE asset_maintenance_log;
