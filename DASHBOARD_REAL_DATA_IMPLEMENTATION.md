# Admin Dashboard - Real Data Implementation

## Overview
Updated the Admin Layout Dashboard component to fetch and display **actual real-time data** from the backend API instead of hardcoded values.

## Changes Made

### 1. Added State Management
New state variables to track dashboard statistics:
- `childrenCount`: Total number of children in the system
- `underageCount`: Number of children under 18 years old
- `emptyBedsCount`: Number of available beds
- `statsLoading`: Loading state for statistics data
- Existing states: `staffList`, `staffCount`, `loading` (already working)

### 2. New Function: `fetchDashboardStats()`
This function runs on component mount and when `selectedProgram` changes.

**Data Sources:**
- `GET /api/children` - Fetches all children (optionally filtered by program)
- `GET /api/beds` - Fetches all beds with their status

**Calculations:**
1. **Total Children**: Simple count of all children returned from API
2. **Underage Children**: Uses intelligent age calculation
   - Primary: Uses `estimated_age` field from database if available
   - Fallback: Calculates age from `date_of_birth` using proper date math
   - Returns children under 18 years old
3. **Empty Beds**: Counts beds with `status === 'available'`

### 3. Updated Summary Cards
The dashboard cards now display:
- **Real data** from the database
- **Loading indicators** (`-`) while data is being fetched
- **Dynamic updates** when program filter changes

### 4. Data Flow

```
Component Mount
    ↓
fetchDashboardStats() ←→ API /api/children
    ↓                       → Count total children
    ↓                       → Filter underage (< 18)
    ↓                       → Calculate age from estimated_age or date_of_birth
    ↓
fetchDashboardStats() ←→ API /api/beds
    ↓                       → Count available beds
    ↓
Update State
    ↓
Re-render Cards with Real Values
```

## API Endpoints Used

### Children Endpoint
**URL:** `GET http://localhost:5000/api/children`
**Query Parameters:** 
- `program_id` (optional): Filter by specific program
- `status` (optional): Filter by status
- `gender` (optional): Filter by gender

**Response Format:**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "estimated_age": 15,
      "date_of_birth": "2010-05-15",
      ...
    }
  ]
}
```

### Beds Endpoint
**URL:** `GET http://localhost:5000/api/beds`
**Query Parameters:** None (returns all beds)

**Response Format:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "bed_number": "B001",
      "room_id": 1,
      "status": "available",
      ...
    }
  ]
}
```

### Employees Endpoint (Already Working)
**URL:** `GET http://localhost:5000/api/employees`
**Query Parameters:**
- `program_id` (optional): Filter by specific program

**Response Format:**
```json
{
  "success": true,
  "employees": [
    {
      "id": 1,
      "full_name": "Jane Smith",
      "position": "Social Worker",
      "email": "jane@example.com",
      "phone": "123-456-7890",
      "is_active": true,
      ...
    }
  ]
}
```

## Age Calculation Logic

The underage calculation uses a two-tier approach:

### Tier 1: Estimated Age (Preferred)
```javascript
if (child.estimated_age !== null && child.estimated_age !== undefined) {
  return child.estimated_age < 18;
}
```

### Tier 2: Date of Birth (Fallback)
```javascript
if (child.date_of_birth) {
  const birthDate = new Date(child.date_of_birth);
  const age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  // Adjust for birthday not yet occurred this year
  const adjustedAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;
  return adjustedAge < 18;
}
```

This ensures accurate age calculation even when exact birth dates are unknown.

## Loading States

The dashboard now shows loading indicators while fetching data:

- **Children/Underage/Empty Beds Cards**: Show `-` while `statsLoading` is true
- **Staff Members Card**: Shows `-` while `loading` is true
- **Staff Table**: Shows spinner with "Loading staff members..." message

## Error Handling

All API calls include try-catch blocks:
- Errors are logged to console with descriptive messages
- Component gracefully handles failures (shows last known state or empty values)
- No application crashes on API failures

## Testing Checklist

- [ ] Verify total children count matches database
- [ ] Check underage calculation is accurate (children under 18)
- [ ] Confirm empty beds count matches available beds in database
- [ ] Test with different program selections (if applicable)
- [ ] Verify loading indicators appear during fetch
- [ ] Check error handling when backend is unavailable
- [ ] Test age calculation edge cases (birthday today, birthday next month, etc.)

## Backend Requirements

Ensure the following endpoints are available:

1. **Children Route**: `Backend/routes/children.routes.js`
   - GET `/api/children` - Returns all children with filters

2. **Beds Route**: `Backend/routes/beds.routes.js`
   - GET `/api/beds` - Returns all beds with status

3. **Employees Routes**: `Backend/server.js`
   - GET `/api/employees` - Returns all employees
   - GET `/api/employees/by-email/:email` - Returns employee by email

## Frontend Files Modified

- `src/components/Dashboard.js` - Main dashboard component with real data fetching

## How to Test

1. **Start Backend Server:**
   ```bash
   cd Backend
   node server.js
   # or use the batch file
   start-backend.bat
   ```

2. **Start Frontend:**
   ```bash
   npm start
   # or use the batch file
   start-frontend.bat
   ```

3. **Navigate to Admin Dashboard:**
   - URL: `http://localhost:3000/admin/dashboard`
   - Login with admin credentials

4. **Verify Data:**
   - Check that the numbers match your database
   - Open browser DevTools → Console to see any errors
   - Check Network tab to see API responses

## Troubleshooting

### Dashboard Shows "-" or "0" for All Values

**Possible Causes:**
1. Backend server not running
2. API endpoints returning errors
3. Database is empty

**Solutions:**
1. Check if backend is running on port 5000
2. Open browser DevTools → Network tab and check API responses
3. Verify database has data

### Age Calculation Seems Incorrect

**Check:**
1. Does the child have `estimated_age` field? (This takes priority)
2. If using `date_of_birth`, verify the date format is valid
3. Check browser console for any JavaScript errors

### Staff Members Not Showing

**Check:**
1. Are there employees in the database?
2. Is the `/api/employees` endpoint responding?
3. Check browser console for errors

## Future Enhancements

Potential improvements for the dashboard:

1. **Add Refresh Button**: Manual reload of statistics
2. **Real-time Updates**: WebSocket connection for live data
3. **More Detailed Breakdowns**:
   - Children by gender
   - Children by age groups (0-5, 6-12, 13-17)
   - Bed occupancy rate percentage
   - Staff by department
4. **Trend Indicators**: Show ↑↓ changes compared to last month
5. **Charts/Graphs**: Visual representation of data
6. **Export Statistics**: Download dashboard data as PDF/Excel
7. **Caching**: Reduce API calls with smart caching strategy

## Notes

- The component automatically refreshes data when `selectedProgram` changes
- Only the first 6 staff members are displayed in the table (for UI clarity)
- The staff count shows total number regardless of display limit
- All API calls use the base URL: `http://localhost:5000`
- CORS is enabled on the backend to allow frontend requests

---

**Last Updated:** March 15, 2026
**Version:** 3.0
