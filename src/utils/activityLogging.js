/**
 * Activity Logging Helper
 * Provides utilities to include user information in API requests for activity tracking
 */

/**
 * Get current user information from localStorage
 * @returns {Object} User information object with userId, userEmail, userName, roleId, roleName
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        userId: user.id,
        userEmail: user.email,
        userName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name || user.role
      };
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  return {};
};

/**
 * Add user information to request data for activity logging
 * @param {Object} existingData - Existing request data
 * @returns {Object} Combined data with user information
 */
export const addUserInfoForLogging = (existingData = {}) => {
  const userData = getCurrentUser();
  return {
    ...existingData,
    ...userData
  };
};

/**
 * Get user info as payload for DELETE requests
 * @returns {Object} User information object
 */
export const getUserInfoForDelete = () => {
  return getCurrentUser();
};
