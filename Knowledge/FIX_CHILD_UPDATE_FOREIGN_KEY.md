# Fix: Child Update Foreign Key Constraint Error

## Problem

When updating a child profile through the frontend, if the **Program** field was set to "No Program" (or if Room/Bed were set to "No Assignment"), the backend would throw a foreign key constraint error:

```
Error: Cannot add or update a child row: a foreign key constraint fails 
(`sokapptest`.`children`, CONSTRAINT `fk_child_program` FOREIGN KEY (`program_id`) 
REFERENCES `programs` (`id`) ON DELETE SET NULL)
```

## Root Cause

1. The frontend form has dropdown selects for `program_id`, `room_id`, and `bed_id` with an option like:
   ```html
   <option value="">No Program</option>
   ```

2. When no selection is made, the form sends an **empty string** `''` for these fields.

3. The database foreign key constraints (`fk_child_program`, `fk_children_room`, `fk_children_bed`) only accept:
   - `NULL` values
   - Valid IDs from the referenced tables
   
4. MySQL cannot convert an empty string `''` to a valid ID, causing the constraint violation.

## Solution

Modified the `Child.update()` method in `Backend/models/Child.js` to automatically convert empty strings to `NULL` before executing the SQL query.

### Code Changes

**File:** `Backend/models/Child.js` (Lines 154-164)

**Before:**
```javascript
for (const [key, column] of Object.entries(allowedFields)) {
    if (data[key] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(data[key]);
    }
}
```

**After:**
```javascript
for (const [key, column] of Object.entries(allowedFields)) {
    if (data[key] !== undefined) {
        // Convert empty strings to null for foreign key columns
        let value = data[key];
        if (value === '') {
            value = null;
        }
        fields.push(`${column} = ?`);
        values.push(value);
    }
}
```

## Affected Fields

This fix applies to all foreign key fields in the children table:
- `program_id` → References `programs(id)`
- `room_id` → References `rooms(id)`
- `bed_id` → References `beds(id)`

All three constraints use `ON DELETE SET NULL`, meaning they accept `NULL` values.

## Testing

### Test 1: Direct SQL (Confirms the Issue)
```javascript
// This FAILS with foreign key error
await connection.execute(
    'UPDATE children SET program_id = ? WHERE id = ?',
    ['', childId]
);
```

### Test 2: Using Child Model (Verifies the Fix)
```javascript
// This NOW WORKS after the fix
await Child.update(childId, { 
    firstName: 'TestName',
    program_id: ''  // Empty string converted to NULL
});
```

**Test Results:**
```
=== Simple Child Update Test ===

Child ID: 7, Name: Abenezer, program_id: 3

Updating with program_id = ""...
Update result: true
Updated program_id: null
✓ SUCCESS! Empty string was converted to NULL
```

## Additional Notes

The `Child.create()` method already handles this correctly using the `||` operator:
```javascript
program_id || null, room_id || null, bed_id || null
```

This works because `'' || null` evaluates to `null`. However, the `update()` method used dynamic field mapping, which required explicit conversion logic.

## Verification Steps

To verify this fix is working:

1. Open a child profile in edit mode
2. Change the Program field to "No Program"
3. Save the child profile
4. Should save successfully without any foreign key errors
5. Check the database - `program_id` should be `NULL`

## Files Modified

- ✅ `Backend/models/Child.js` - Added empty string to NULL conversion in `update()` method

## Related Database Schema

```sql
ALTER TABLE children 
ADD COLUMN program_id INT,
ADD CONSTRAINT fk_child_program 
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

ALTER TABLE children 
ADD COLUMN room_id INT,
ADD CONSTRAINT fk_children_room 
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

ALTER TABLE children 
ADD COLUMN bed_id INT,
ADD CONSTRAINT fk_children_bed 
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL;
```

All three constraints use `ON DELETE SET NULL`, confirming that `NULL` values are acceptable.

---

**Date Fixed:** March 15, 2026  
**Issue:** Foreign key constraint violation when updating child with empty program_id  
**Solution:** Convert empty strings to NULL in Child.update() method
