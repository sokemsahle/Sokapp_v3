// Frontend API Configuration
// This file reads from environment variables and provides API endpoints

const API_CONFIG = {
  // Base URL for all API calls - ALWAYS use localhost:5000 for backend API
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Debug: Log the actual BASE_URL being used
  DEBUG_URL: (() => {
    const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('[API_CONFIG] BASE_URL:', url, '| NODE_ENV:', process.env.NODE_ENV);
    return url;
  })(),
  
  // API Endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    RESET_PASSWORD: '/api/reset-password',
    
    // Employees
    EMPLOYEES: '/api/employees',
    EMPLOYEE_DOCUMENTS: (id) => `/api/employees/${id}/documents`,
    
    // Users & Roles
    USERS: '/api/users',
    ROLES: '/api/roles',
    PERMISSIONS: '/api/permissions',
    
    // Invitations
    ACCEPT_INVITATION: '/api/accept-invitation',
    
    // Content
    NEWS_NOTICES: '/api/news-notices',
    NEWS: '/api/news',
    NOTICES: '/api/notices',
    
    // User Management
    CHANGE_PASSWORD: '/api/users/change-password',
    UPLOAD_PROFILE_PICTURE: '/api/users/upload-profile-picture',
    
    // Requisitions (if applicable)
    REQUISITIONS: '/api/requisitions',
    
    // Programs
    PROGRAMS: '/api/programs',
    
    // Lookup Lists
    LOOKUP_DATA: '/api/lookup',
    ADD_LOOKUP_ITEM: '/api/lookup/add',
    DELETE_LOOKUP_ITEM: '/api/lookup/delete',
    
    // Resource Management
    ROOMS: '/api/rooms',
    ROOM_BY_ID: (id) => `/api/rooms/${id}`,
    BEDS: '/api/beds',
    BEDS_AVAILABLE: '/api/beds/available',
    BEDS_BY_ROOM: (roomId) => `/api/beds/room/${roomId}`,
    BED_BY_ID: (id) => `/api/beds/${id}`,
    BED_ASSIGN: (id) => `/api/beds/${id}/assign`,
    BED_RELEASE: (id) => `/api/beds/${id}/release`,
    
    // Fixed Assets
    FIXED_ASSETS: '/api/fixed-assets',
    FIXED_ASSET_BY_ID: (id) => `/api/fixed-assets/${id}`,
    ASSET_CATEGORIES: '/api/fixed-assets/categories',
    ASSET_MAINTENANCE: (id) => `/api/fixed-assets/${id}/maintenance`,
    
    // Appointments
    APPOINTMENTS: '/api/appointments',
    APPOINTMENTS_ALL: '/api/appointments/all', // System-wide calendar
    APPOINTMENTS_RANGE: '/api/appointments/range',
    APPOINTMENT_BY_ID: (id) => `/api/appointments/${id}`,
    USERS_LIST: '/api/users/list',
  },
  
  // Helper method to build full URL
  getUrl(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  },
  
  // Helper method for dynamic employee endpoints
  getEmployeeUrl(id, endpoint = '') {
    const base = `/api/employees/${id}`;
    return endpoint ? `${base}${endpoint}` : base;
  },
};

export default API_CONFIG;
