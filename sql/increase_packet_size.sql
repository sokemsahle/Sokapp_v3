-- Fix 2: Increase MySQL max_allowed_packet size
-- Run this in MySQL as root/admin

-- Check current value
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Set to 64MB (default is usually 4MB or 16MB)
-- This is a temporary session change
SET GLOBAL max_allowed_packet = 67108864;

-- For permanent change, add this to your my.ini/my.cnf file:
-- [mysqld]
-- max_allowed_packet=64M

-- Verify the change
SHOW VARIABLES LIKE 'max_allowed_packet';
