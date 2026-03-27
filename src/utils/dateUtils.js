// Date Utility Functions
// Strict DD/MM/YYYY format handling for the appointment system

/**
 * Format date from ISO/UTC string to DD/MM/YYYY format
 * @param {string} dateString - ISO date string (e.g., '2026-03-20T10:00:00.000Z')
 * @returns {string} Formatted date in DD/MM/YYYY format
 */
export const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parse DD/MM/YYYY string to Date object
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {Date} JavaScript Date object
 */
export const parseDDMMYYYY = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format datetime for display (DD/MM/YYYY HH:mm)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted datetime in DD/MM/YYYY HH:mm format
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const datePart = formatDateToDDMMYYYY(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}`;
};

/**
 * Convert local date and time to UTC ISO string for API storage
 * @param {string} dateString - Date in YYYY-MM-DD format (from input type="date")
 * @param {string} timeString - Time in HH:MM format (from input type="time")
 * @returns {string} ISO 8601 formatted string treating input as UTC
 */
export const localToUTC = (dateString, timeString) => {
  if (!dateString || !timeString) return null;
  const [year, month, day] = dateString.split('-');
  const [hours, minutes] = timeString.split(':');
  
  // Create date directly in UTC to avoid timezone shifts
  const utcDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  ));
  
  return utcDate.toISOString();
};

/**
 * Extract time from ISO datetime string
 * @param {string} dateString - ISO date string
 * @returns {string} Time in HH:MM format
 */
export const extractTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Extract date from ISO datetime string in YYYY-MM-DD format for input type="date"
 * @param {string} dateString - ISO date string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const extractDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the first day of the month for a given date
 * @param {Date} date - JavaScript Date object
 * @returns {number} Day of week (0-6, where 0 is Sunday)
 */
export const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

/**
 * Get the number of days in a month
 * @param {number} year - Full year
 * @param {number} month - Month (0-11)
 * @returns {number} Number of days in the month
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Check if two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Format date range for display
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatDateToDDMMYYYY(startDate);
  const end = formatDateToDDMMYYYY(endDate);
  
  // If same day, show once with time range
  if (start === end) {
    const startTime = extractTime(startDate);
    const endTime = extractTime(endDate);
    return `${start} (${startTime} - ${endTime})`;
  }
  
  return `${start} to ${end}`;
};
