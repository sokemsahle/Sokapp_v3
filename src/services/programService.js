import API_CONFIG from '../config/api';

/**
 * Fetch all active programs
 * @returns {Promise} Resolves with programs data
 */
export const getPrograms = async () => {
  try {
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROGRAMS));
    const result = await response.json();
    
    if (result.success) {
      return { success: true, programs: result.programs };
    } else {
      return { success: false, message: result.message || 'Failed to fetch programs' };
    }
  } catch (error) {
    console.error('Error fetching programs:', error);
    return { success: false, message: error.message || 'Network error' };
  }
};
