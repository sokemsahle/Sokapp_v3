# Fix: Assign Bed Not Showing Available Beds

## Problem
When editing a child profile that already had a bed assigned, the "Assign Bed" dropdown was not showing any beds. This was because the system was only loading beds with status='available', which excluded the currently assigned bed (status='occupied').

## Root Cause
In `ChildForm.js`, the `loadBeds()` function was hardcoded to filter beds by `status='available'`:

```javascript
const loadBeds = async (roomId) => {
  const result = await resourceService.getBedsByRoom(roomId, 'available');
  // ...
};
```

This meant:
- When creating a new child: Only available beds showed ✅ (correct)
- When editing a child with an assigned bed: The assigned bed didn't show ❌ (incorrect)

## Solution

### 1. Updated `loadBeds` Function
Modified the function to accept an optional `includeOccupied` parameter:

```javascript
const loadBeds = async (roomId, includeOccupied = false) => {
  // If includeOccupied is true, load all beds (for edit mode to show current bed)
  // Otherwise, only load available beds (for create mode)
  const statusFilter = includeOccupied ? null : 'available';
  const result = await resourceService.getBedsByRoom(roomId, statusFilter);
  // ...
};
```

### 2. Updated Room Selection Handler
When changing rooms in edit mode, now loads all beds including occupied ones:

```javascript
onChange={(e) => {
  const roomId = e.target.value;
  setFormData({ ...formData, room_id: roomId, bed_id: '' });
  if (roomId) {
    // In edit mode, include occupied beds so current bed shows
    loadBeds(roomId, isEditMode);
  } else {
    setBeds([]);
  }
}}
```

### 3. Updated Child Data Loading
When loading an existing child's data, now includes occupied beds:

```javascript
if (child.room_id) {
  await loadBeds(child.room_id, true); // Include occupied to show current bed
}
```

### 4. Enhanced UI Feedback
Added visual indicators to show bed status in the dropdown:

```javascript
{beds.map(bed => (
  <option key={bed.id} value={bed.id}>
    {bed.bed_number} {bed.status === 'occupied' ? '(Occupied)' : '(Available)'}
  </option>
))}
```

Also added a helpful counter below the dropdown:
```javascript
💡 {beds.filter(b => b.status === 'available').length} available, 
   {beds.filter(b => b.status === 'occupied').length} occupied in this room
```

## Behavior After Fix

### Creating New Child
- Select a room → Shows only **available** beds ✅
- Can only assign available beds ✅

### Editing Existing Child (No Bed Assigned)
- Select a room → Shows only **available** beds ✅
- Can assign an available bed ✅

### Editing Existing Child (With Bed Assigned)
- Select same room → Shows **all beds** (available + occupied) ✅
- Currently assigned bed shows with "(Occupied)" label ✅
- Can see bed status at a glance ✅
- Can change to another available bed ✅

### Changing Child's Room
- Select different room → Shows **all beds** in edit mode ✅
- Can see all options including occupied beds ✅
- Prevents accidental double-booking (backend validation) ✅

## Files Modified
- `src/components/childProfile/ChildForm.js`
  - Updated `loadBeds()` function signature
  - Updated room selection onChange handler
  - Updated `loadChildData()` function
  - Enhanced bed dropdown UI with status indicators

## Testing Steps
1. **Create new child**: Verify only available beds show
2. **Edit child with bed**: Verify current bed shows in dropdown with "(Occupied)" label
3. **Change bed**: Verify can select different available bed
4. **Change room**: Verify all beds in new room show (edit mode)
5. **Check counter**: Verify available/occupied count displays correctly

## Benefits
✅ Current bed assignment visible when editing
✅ Clear visual distinction between available/occupied beds
✅ Helpful bed availability counter
✅ Prevents confusion about bed assignments
✅ Maintains data integrity (can't double-book beds)
