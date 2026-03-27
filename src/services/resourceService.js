import API_CONFIG from '../config/api';

/**
 * Resource Management Service
 * Handles API calls for rooms and beds management
 */

const resourceService = {
    /**
     * Get all rooms with bed counts
     */
    getRooms: async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOMS));
            const result = await response.json();
            
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message || 'Failed to fetch rooms' };
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Get room by ID with beds
     */
    getRoomById: async (roomId) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOM_BY_ID)(roomId));
            const result = await response.json();
            
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message || 'Failed to fetch room' };
            }
        } catch (error) {
            console.error('Error fetching room:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Create new room
     */
    createRoom: async (roomData) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOMS), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating room:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Update room
     */
    updateRoom: async (roomId, roomData) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOM_BY_ID)(roomId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating room:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Delete room
     */
    deleteRoom: async (roomId) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOM_BY_ID)(roomId), {
                method: 'DELETE'
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting room:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Get all beds
     */
    getBeds: async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS));
            const result = await response.json();
            
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message || 'Failed to fetch beds' };
            }
        } catch (error) {
            console.error('Error fetching beds:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Get available beds only
     */
    getAvailableBeds: async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS_AVAILABLE));
            const result = await response.json();
            
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message || 'Failed to fetch available beds' };
            }
        } catch (error) {
            console.error('Error fetching available beds:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Get beds by room
     */
    getBedsByRoom: async (roomId, status = null) => {
       try {
           console.log('[resourceService] Getting beds for room:', roomId, 'status:', status);
            
            // Build the URL correctly - BEDS_BY_ROOM is a function that returns the endpoint string
            let endpoint = API_CONFIG.ENDPOINTS.BEDS_BY_ROOM(roomId);
            let url = API_CONFIG.getUrl(endpoint);
            
            if (status) {
                url += `?status=${status}`;
            }
           console.log('[resourceService] Fetching URL:', url);
            
           const response = await fetch(url);
           console.log('[resourceService] Response status:', response.status);
            
           const result = await response.json();
           console.log('[resourceService] Result:', result);
            
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message || 'Failed to fetch beds' };
            }
        } catch (error) {
           console.error('[resourceService] Error fetching beds by room:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Create new bed
     */
    createBed: async (bedData) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bedData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating bed:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Update bed
     */
    updateBed: async (bedId, bedData) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BED_BY_ID)(bedId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bedData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating bed:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Delete bed
     */
    deleteBed: async (bedId) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BED_BY_ID)(bedId), {
                method: 'DELETE'
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting bed:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Assign bed to child (mark as occupied)
     */
    assignBed: async (bedId, childId) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BED_ASSIGN)(bedId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ child_id: childId })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error assigning bed:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    },

    /**
     * Release bed (mark as available)
     */
    releaseBed: async (bedId) => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BED_RELEASE)(bedId), {
                method: 'PUT'
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error releasing bed:', error);
            return { success: false, message: 'Failed to connect to server' };
        }
    }
};

export default resourceService;
