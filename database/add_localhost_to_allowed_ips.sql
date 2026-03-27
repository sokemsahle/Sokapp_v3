-- Add localhost and current WiFi IP to allowed_ips for testing
INSERT INTO allowed_ips (ip_address, description, created_by) 
VALUES 
    ('127.0.0.1', 'Localhost IPv4 - Development', 1),
    ('::1', 'Localhost IPv6 - Development', 1),
    ('192.168.8.74', 'Office WiFi - Main Network', 1)
ON DUPLICATE KEY UPDATE ip_address = ip_address;

-- Verify the IPs were added
SELECT * FROM allowed_ips ORDER BY created_at DESC;
