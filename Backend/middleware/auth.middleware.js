const jwt = require('jsonwebtoken');
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

// In-memory cache for permissions (TTL: 5 minutes)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached permissions for a user
 */
function getCachedPermissions(userId) {
    const cached = permissionCache.get(userId);
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
        permissionCache.delete(userId);
        return null;
    }
    
    return cached.permissions;
}

/**
 * Cache permissions for a user
 */
function cachePermissions(userId, permissions) {
    permissionCache.set(userId, {
        permissions,
        timestamp: Date.now()
    });
}

/**
 * Invalidate cache for a specific user
 */
function invalidateUserCache(userId) {
    permissionCache.delete(userId);
}

/**
 * Clear entire permission cache
 */
function clearPermissionCache() {
    permissionCache.clear();
}

/**
 * Auth Middleware - Verifies JWT and loads user permissions
 */
async function authMiddleware(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Extract user ID from decoded token
        const userId = decoded.id || decoded.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token payload.'
            });
        }

        // Check cache first
        let permissions = getCachedPermissions(userId);
        
        if (!permissions) {
            // Load permissions from database
            const connection = await mysql.createConnection(dbConfig);
            try {
                const [rows] = await connection.execute(
                    `SELECT DISTINCT p.name as permission_name
                     FROM permissions p
                     JOIN role_permissions rp ON rp.permission_id = p.id
                     JOIN user_roles ur ON ur.role_id = rp.role_id
                     WHERE ur.user_id = ? AND ur.is_active != FALSE`,
                    [userId]
                );
                
                permissions = rows.map(row => row.permission_name);
                
                // Cache the permissions
                cachePermissions(userId, permissions);
                
            } finally {
                await connection.end();
            }
        }

        // Attach user info and permissions to request
        req.user = {
            id: userId,
            email: decoded.email,
            permissions: permissions
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed.',
            error: error.message
        });
    }
}

module.exports = {
    authMiddleware,
    invalidateUserCache,
    clearPermissionCache
};
