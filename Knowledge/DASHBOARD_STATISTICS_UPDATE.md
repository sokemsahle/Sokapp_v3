# Dashboard Statistics Implementation

## Overview
Updated the Dashboard component to fetch and display **real-time data** from the backend API instead of hardcoded values.

## Changes Made

### 1. Added State Management
- **`stats`**: Object to store dashboard statistics
  - `totalChildren`: Total number of children
  - `underageChildren`: Children under 18 years old
  - `emptyBeds`: Number of available beds
- **`statsLoading`**: Boolean flag for loading state

### 2. New Function: `fetchDashboardStats()`
This function runs on component mount and when `selectedProgram` changes.

**Data Sources:**
- `GET /api/children` - Fetches all children (optionally filtered by program)
- `GET /api/beds` - Fetches all beds

**Calculations:**
1. **Total Children**: Simple count of all children returned from API
2. **Underage Children**: Uses the `estimated_age` field from the database
   - Returns children with `estimated_age < 1` (infants)
   - Falls back to date calculation from `date_of_birth` if `estimated_age` is null
3. **Empty Beds**: Counts beds with `status === 'available'`

### 3. Updated Summary Cards
The dashboard cards now display:
- **Real data** from the database
- **Loading spinner** while data is being fetched
- **Dynamic updates** when program filter changes

## Features

### Age Calculation Logic
```javascript
// Primary: Use estimated_age from database
if (child.estimated_age !== null && child.estimated_age !== undefined) {
 return child.estimated_age < 1; // Under 1 year old
}

// Fallback: Calculate from date_of_birth
const now = new Date();
const birthDate = new Date(child.date_of_birth);
let age = now.getFullYear() - birthDate.getFullYear();
const monthDiff = now.getMonth() - birthDate.getMonth();
const dayDiff = now.getDate() - birthDate.getDate();

// Adjust if birthday hasn't occurred yet this year
const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) 
  ? age - 1 
  : age;

return actualAge < 1; // Under 1 year old (age 0 - infants)
```

### Program Filtering Support
When a program is selected, the dashboard automatically filters:
- Children by selected program
- Staff by selected program (existing feature)
- Bed count remains global (not program-specific)

## Loading States
Each card shows a spinning loader icon (`bx-loader-alt bx-spin`) while:
- Children data is being fetched (`statsLoading`)
- Staff data is being fetched (`loading`)

## Error Handling
- Gracefully handles API errors
- Logs errors to console
- Continues to show last known state or zeros if fetch fails

## API Endpoints Used
1. **Children**: `http://localhost:5000/api/children`
   - Optional query param: `?program_id={selectedProgram}`
   
2. **Beds**: `http://localhost:5000/api/beds`
   - Returns all beds with status information

## Testing Checklist
- [ ] Verify total children count matches database
- [ ] Check underage calculation is accurate (children under 1 year old / infants)
- [ ] Confirm empty beds count matches available beds
- [ ] Test with different program selections
- [ ] Verify loading spinners appear during fetch
- [ ] Check error handling when backend is unavailable

## Future Enhancements
Potential improvements:
1. Add refresh button to manually reload statistics
2. Implement real-time updates using WebSockets
3. Add more detailed breakdowns (e.g., children by gender, age groups)
4. Cache statistics to reduce API calls
5. Add trend indicators (↑↓) showing changes over time
