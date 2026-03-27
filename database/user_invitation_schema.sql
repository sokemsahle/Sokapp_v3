-- User Invitation System Schema Updates

-- 1. Add status column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'invited', 'inactive') DEFAULT 'invited';

-- 2. Create invitation_tokens table
CREATE TABLE IF NOT EXISTS invitation_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    used BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Update existing users to have appropriate status
-- Set existing users with passwords as 'active'
UPDATE users 
SET status = 'active' 
WHERE password IS NOT NULL AND password != '' AND is_active = TRUE;

-- Set existing users without passwords as 'invited' 
UPDATE users 
SET status = 'invited' 
WHERE (password IS NULL OR password = '') AND is_active = TRUE;

-- 4. Add foreign key constraint (optional)
-- ALTER TABLE invitation_tokens 
-- ADD CONSTRAINT fk_invitation_tokens_email 
-- FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE;