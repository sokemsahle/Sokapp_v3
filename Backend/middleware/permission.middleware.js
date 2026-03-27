/**
 * Permission Check Middleware
 * Reusable middleware to check if user has specific permission
 */

/**
 * Require specific permission to access route
 * @param {string} permissionName - The permission required (e.g., 'child_view')
 * @returns {Function} Express middleware function
 */
function requirePermission(permissionName) {
    return (req, res, next) => {
        // Ensure auth middleware has run first
        if (!req.user || !req.user.permissions) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Check if user has the required permission
        if (!req.user.permissions.includes(permissionName)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        // User has permission, proceed
        next();
    };
}

/**
 * Require any of the specified permissions (OR logic)
 * @param {Array<string>} permissionNames - Array of permissions (user needs at least one)
 * @returns {Function} Express middleware function
 */
function requireAnyPermission(permissionNames) {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const hasPermission = permissionNames.some(perm => 
            req.user.permissions.includes(perm)
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
}

/**
 * Require all of the specified permissions (AND logic)
 * @param {Array<string>} permissionNames - Array of permissions (user needs all)
 * @returns {Function} Express middleware function
 */
function requireAllPermissions(permissionNames) {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const hasAllPermissions = permissionNames.every(perm => 
            req.user.permissions.includes(perm)
        );

        if (!hasAllPermissions) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
}

module.exports = {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions
};
