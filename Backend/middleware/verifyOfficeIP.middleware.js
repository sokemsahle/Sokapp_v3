const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sokapptest',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

/**
 * Get client IP address from request
 * Handles various proxy scenarios (X-Forwarded-For, X-Real-IP, etc.)
 */
function getClientIP(req) {
    // Check for X-Forwarded-For header (common in proxy/load balancer setups)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
        // Take the first one (original client)
        return forwardedFor.split(',')[0].trim();
    }
    
    // Check for X-Real-IP header (used by nginx)
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
        return realIP;
    }
    
    // Fall back to req.ip (Express's built-in property)
    return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Verify Office IP Middleware
 * Checks if the request is coming from an authorized office IP address
 */
async function verifyOfficeIP(req, res, next) {
    try {
        // Get client IP
        const clientIP = getClientIP(req);
        
        console.log(`[verifyOfficeIP] Checking IP: ${clientIP}`);
        
        if (!clientIP || clientIP === 'unknown') {
            return res.status(403).json({
                success: false,
                message: 'Unable to determine client IP address'
            });
        }
        
        // Connect to database
        const connection = await mysql.createConnection(dbConfig);
        
        try {
            // Query allowed_ips table to check if this IP is authorized
            const [rows] = await connection.execute(
                `SELECT id, ip_address, description 
                 FROM allowed_ips 
                 WHERE ip_address = ?`,
                [clientIP]
            );
            
            // If no matching IP found, reject the request
            if (rows.length === 0) {
                console.log(`[verifyOfficeIP] IP ${clientIP} not in allowed list`);
                return res.status(403).json({
                    success: false,
                    message: 'Must be on company WiFi to perform this action',
                    error: 'IP_NOT_AUTHORIZED'
                });
            }
            
            // IP is authorized - attach it to request for logging purposes
            req.authorizedIP = rows[0];
            console.log(`[verifyOfficeIP] IP ${clientIP} authorized (${rows[0].description || 'No description'})`);
            
            next();
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('[verifyOfficeIP] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify IP address',
            error: error.message
        });
    }
}

module.exports = {
    verifyOfficeIP,
    getClientIP
};
