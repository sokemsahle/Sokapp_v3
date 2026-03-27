# Debugging Steps for Bed Dropdown Issue

## Step 1: Check Console Logs

Open browser console (F12) and look for these logs when you select a room:

```
=== Room Changed ===
Selected Room ID: [should show room ID]
Is Edit Mode: [true/false]
Calling loadBeds with roomId: [roomId] includeOccupied: [true/false]
=== Loading Beds ===
Room ID: [should match above]
Include Occupied: [true/false]
Status Filter: [available or null]
[resourceService] Getting beds for room: [roomId] status: [status]
[resourceService] Fetching URL: [full URL]
[resourceService] Response status: 200
[resourceService] Result: {success: true, count: X, data: [...]}
Beds loaded: X
```

## Step 2: Check Backend Console

In your backend terminal, look for:

```
=== GET /api/beds/room/:roomId ===
Room ID: [number]
Status filter: available OR undefined
Executing query with params: [[roomId], [status]]
Beds found: [number]
```

## Step 3: Verify Data Exists

### Check if rooms exist:
Run this in your database:
```sql
USE sokapptest;
SELECT * FROM rooms;
```

### Check if beds exist:
```sql
USE sokapptest;
SELECT * FROM beds;
```

### Check beds with room info:
```sql
SELECT b.*, r.room_name 
FROM beds b 
INNER JOIN rooms r ON b.room_id = r.id;
```

### Check available beds specifically:
```sql
SELECT b.*, r.room_name 
FROM beds b 
INNER JOIN rooms r ON b.room_id = r.id 
WHERE b.status = 'available';
```

## Step 4: Test API Directly

Open browser and try these URLs (adjust port if needed):

1. **Get all rooms:**
   ```
   http://localhost:5000/api/rooms
   ```

2. **Get beds for a specific room (replace 1 with actual room ID):**
   ```
   http://localhost:5000/api/beds/room/1
   ```

3. **Get only available beds for a room:**
   ```
   http://localhost:5000/api/beds/room/1?status=available
   ```

Expected response format:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {"id": 1, "room_id": 1, "bed_number": "Bed 1", "status": "available", ...},
    {"id": 2, "room_id": 1, "bed_number": "Bed 2", "status": "occupied", ...}
  ]
}
```

## Common Issues & Solutions

### Issue 1: No rooms exist
**Solution:** Create rooms first in Organization → Resources → Rooms tab

### Issue 2: No beds exist
**Solution:** Create beds under rooms in Organization → Resources → Beds tab

### Issue 3: All beds are occupied
**Solution:** Create more beds or mark some as "available"

### Issue 4: API returns 404
**Solution:** 
- Check backend server is running on port 5000
- Check `.env` file has correct `REACT_APP_API_URL=http://localhost:5000`

### Issue 5: CORS error in console
**Solution:** 
- Backend needs to allow CORS
- Check `server.js` has CORS configuration

### Issue 6: Room dropdown shows 0 available beds
**Solution:** 
- The room might have no beds created yet
- Or all beds are marked as "occupied"

## Quick Fix Commands

If you need to quickly add test data:

```sql
USE sokapptest;

-- Add a test room
INSERT INTO rooms (room_name, capacity) VALUES ('Test Room A', 4);

-- Get the room ID (check the output)
SELECT LAST_INSERT_ID() as room_id;

-- Add beds to that room (replace 1 with actual room ID)
INSERT INTO beds(room_id, bed_number, status) VALUES 
(1, 'Bed A-1', 'available'),
(1, 'Bed A-2', 'available'),
(1, 'Bed A-3', 'occupied'),
(1, 'Bed A-4', 'available');

-- Verify
SELECT b.*, r.room_name 
FROM beds b 
INNER JOIN rooms r ON b.room_id = r.id;
```

## What to Share for Further Help

If still not working, please share:

1. **Browser console logs** (the complete log from selecting a room)
2. **Backend console logs** (from the terminal running the backend)
3. **API test results** (what you get when visiting the API URLs directly)
4. **Database check results** (output of the SQL queries above)

This will help pinpoint exactly where the issue is!
