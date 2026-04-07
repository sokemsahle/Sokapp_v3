-- ============================================
-- ASSET MAINTENANCE LOG TABLE
-- Run this if the table doesn't exist
-- ============================================

USE sokapptest;

-- Create Asset Maintenance Log Table (if not exists)
CREATE TABLE IF NOT EXISTS asset_maintenance_log (
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

-- Verify table structure
DESCRIBE asset_maintenance_log;

-- Sample data for testing (optional)
-- INSERT INTO asset_maintenance_log (asset_id, maintenance_date, maintenance_type, description, performed_by, cost, next_scheduled_date)
-- VALUES 
-- (1, '2024-01-15', 'routine', 'Regular maintenance check', 'John Technician', 50.00, '2024-07-15'),
-- (1, '2024-03-20', 'repair', 'Fixed broken part', 'ABC Repair Services', 150.00, NULL);

SELECT '✅ Asset Maintenance Log table ready!' as status;
