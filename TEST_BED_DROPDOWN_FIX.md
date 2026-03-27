# Testing Bed Dropdown Fix

## IMPORTANT: Which mode are you testing?

### Test 1: Creating NEW Child (Create Mode)
**Expected Behavior:** Should show ONLY available beds

Steps:
1. Go to Child Profiles
2. Click "Add New Child" button
3. Fill in Step 1 (Basic Info)
4. Click "Next" to Step 2
5. Click "Next" to Step 3 (Admission)
6. In "Assign Dormitory Room" dropdown, select a room
7. **Check "Assign Bed" dropdown**

What you should see:
- ✅ Only beds with status="available" appear
- ✅ Each option shows: "Bed Number (Available)"
- ✅ Counter below shows: "💡 X available, 0 occupied"

Console logs you should see (F12 → Console):
```
=== Room Changed ===
Selected Room ID: [number]
Is Edit Mode: false  ← IMPORTANT: This should be FALSE
Calling loadBeds with roomId: [id] includeOccupied: false
=== Loading Beds ===
Room ID: [number]
Include Occupied: false
Status Filter: available
[resourceService] Getting beds for room: [id] status: available
Beds loaded: [number]
```

---

### Test 2: Editing EXISTING Child (Edit Mode)
**Expected Behavior:** Should show ALL beds (both available AND occupied)

Steps:
1. Go to Child Profiles
2. Find a child that ALREADY has a room and bed assigned
3. Click the "Edit" button (pencil icon)
4. You should see Step 3 with room and bed already filled
5. **Check "Assign Bed" dropdown** - does it show the current bed?

What you should see:
- ✅ All beds appear (both available AND occupied)
- ✅ Current bed shows with "(Occupied)" label
- ✅ Other beds show with "(Available)" label
- ✅ Counter below shows: "💡 X available, Y occupied"

Console logs you should see (F12 → Console):
```
=== Loading Beds === (when component first loads)
Room ID: [number]
Include Occupied: true  ← IMPORTANT: This should be TRUE
Status Filter: null
Beds loaded: [number]

=== Room Changed === (if you change room)
Selected Room ID: [number]
Is Edit Mode: true  ← IMPORTANT: This should be TRUE
Calling loadBeds with roomId: [id] includeOccupied: true
```

---

## Troubleshooting Based on Console Logs

### If you see NO console logs at all:
**Problem:** Room selection change handler not being triggered
**Solution:** 
- Make sure you're actually selecting a room from dropdown
- Check if rooms dropdown has any options

### If you see logs but "Beds loaded: 0":
**Problem:** No beds match the filter
**Solution:**
- For create mode: Make sure there are available beds
- For edit mode: Make sure there are ANY beds in that room

### If you see "Error loading beds":
**Problem:** API call failed
**Solution:**
- Check if backend server is running (http://localhost:3000)
- Check browser Network tab for failed requests

### If beds array is empty [] but API returned data:
**Problem:** State not updating correctly
**Solution:**
- This would be a React state issue
- Check if `setBeds()` is being called

---

## Quick Database Check

Run these SQL queries to verify you have test data:

```sql
-- Check rooms
USE sokapptest;
SELECT * FROM rooms;

-- Check beds
SELECT * FROM beds;

-- Check beds with room names
SELECT b.id, b.bed_number, b.status, r.room_name
FROM beds b
INNER JOIN rooms r ON b.room_id = r.id;
```

If no beds exist, create some:

```sql
-- First get a room ID
SELECT id, room_name FROM rooms;

-- Then add beds (replace 1 with actual room ID)
INSERT INTO beds(room_id, bed_number, status) VALUES 
(1, 'Bed A-1', 'available'),
(1, 'Bed A-2', 'available'),
(1, 'Bed A-3', 'occupied');
```

---

## What to Check Next

Please share the following information:

1. **Which mode are you testing?**
   - Create mode (new child) OR
   - Edit mode (existing child)

2. **Browser console logs** when you select a room:
   - Press F12 to open DevTools
   - Go to Console tab
   - Select a room from dropdown
   - Copy all the logs that appear

3. **What do you see in the bed dropdown?**
   - Empty (no options)?
   - Shows "No Bed Assignment" only?
   - Shows some beds but not all?
   - Shows beds but they're all marked as available/occupied?

4. **Backend terminal output:**
   - Do you see the API request logs?
   - What does it say for "Beds found"?

This will help me pinpoint exactly where the issue is!
