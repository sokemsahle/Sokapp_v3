-- ============================================
-- Fix for MySQL max_allowed_packet Error
-- ============================================
-- This script increases MySQL's max_allowed_packet size
-- to allow larger profile images to be stored in the database.
--
-- ERROR: "Got a packet bigger than 'max_allowed_packet' bytes"
-- 
-- The default max_allowed_packet is often 1MB or 4MB.
-- This script increases it to 16MB (recommended for image storage).
-- ============================================

-- Check current max_allowed_packet value
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Option 1: Set at SESSION level (temporary, resets on restart)
SET SESSION max_allowed_packet = 16777216; -- 16MB in bytes

-- Option 2: Set at GLOBAL level (temporary, resets on restart)
SET GLOBAL max_allowed_packet = 16777216; -- 16MB in bytes

-- Verify the change
SHOW VARIABLES LIKE 'max_allowed_packet';

-- ============================================
-- PERMANENT FIX (requires MySQL restart)
-- ============================================
-- To make this change permanent, you need to edit your MySQL configuration file:
--
-- For Windows (my.ini):
--   Location: C:\ProgramData\MySQL\MySQL Server X.X\my.ini
--   Add/modify: max_allowed_packet = 16M
--
-- For Linux/Mac (my.cnf):
--   Location: /etc/mysql/my.cnf or /etc/my.cnf
--   Add/modify: max_allowed_packet = 16M
--
-- Then restart MySQL service:
--   Windows: net stop MySQL && net start MySQL
--   Linux: sudo systemctl restart mysql
-- ============================================

-- ============================================
-- NOTES:
-- ============================================
-- 1. The profile picture upload feature now compresses images to 2MB max
-- 2. Base64 encoding increases size by ~33% (2MB → ~2.67MB)
-- 3. With 16MB max_allowed_packet, you can store images up to ~12MB before encoding
-- 4. The backend validates file size BEFORE attempting database insert
-- 5. Users will see clear error messages if their image is too large
-- ============================================
