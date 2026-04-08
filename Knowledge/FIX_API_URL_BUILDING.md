# Fix: API URL Building Error in resourceService.js

## Error Message
```
[resourceService] Error fetching beds by room: TypeError: 
_config_api__WEBPACK_IMPORTED_MODULE_0__.default.getUrl(...) is not a function
    at Object.getBedsByRoom (resourceService.js:146:1)
```

## Root Cause

The code was incorrectly calling the API endpoint builder:

**WRONG:**
```javascript
let url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS_BY_ROOM)(roomId);
```

This was wrong because:
- `API_CONFIG.ENDPOINTS.BEDS_BY_ROOM` is already a function: `(roomId) => /api/beds/room/${roomId}`
- Calling it without parameters returns a function, not a string
- Then calling `.getUrl(function)` fails because getUrl expects a string

**CORRECT:**
```javascript
// Build the URL correctly - BEDS_BY_ROOM is a function that returns the endpoint string
let endpoint = API_CONFIG.ENDPOINTS.BEDS_BY_ROOM(roomId);
let url = API_CONFIG.getUrl(endpoint);
```

This is correct because:
1. First call `API_CONFIG.ENDPOINTS.BEDS_BY_ROOM(roomId)` to get the endpoint string
2. Then pass that string to `API_CONFIG.getUrl(endpoint)` to build the full URL

## How It Works

### API_CONFIG Structure
```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  
  ENDPOINTS: {
   BEDS_BY_ROOM: (roomId) => `/api/beds/room/${roomId}`,
    // ... other endpoints
  },
  
  getUrl(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  }
};
```

### Correct Usage Pattern

For **dynamic endpoints** (functions):
```javascript
// Step 1: Call the function with parameter
let endpoint = API_CONFIG.ENDPOINTS.BEDS_BY_ROOM(123);
// Returns: "/api/beds/room/123"

// Step 2: Build full URL
let url = API_CONFIG.getUrl(endpoint);
// Returns: "http://localhost:3000/api/beds/room/123"
```

For **static endpoints** (strings):
```javascript
// Can be used directly
let url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS);
// Returns: "http://localhost:3000/api/beds"
```

## Files Modified

- `src/services/resourceService.js`
  - Fixed `getBedsByRoom()` method
  - Now correctly builds URL for dynamic endpoints

## Testing

After this fix, the bed dropdown should now work correctly:

1. **Create Mode**: Shows only available beds
2. **Edit Mode**: Shows all beds (available + occupied)

Console logs should now show:
```
[resourceService] Getting beds for room: 1 status: available
[resourceService] Fetching URL: http://localhost:3000/api/beds/room/1?status=available
[resourceService] Response status: 200
[resourceService] Result: {success: true, count: X, data: [...]}
Beds loaded: X
```

## Related Patterns

This same pattern should be used for all other dynamic endpoints:
- `ROOM_BY_ID(id)`
- `BED_BY_ID(id)`
- `BED_ASSIGN(id)`
- `BED_RELEASE(id)`
- `EMPLOYEE_DOCUMENTS(id)`

All of these are functions that need to be called with an ID first, before passing to `getUrl()`.
