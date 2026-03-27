# 🔧 Backend Bug Fixes - Notification API Errors

## Problems Fixed

### ❌ Error 1: `rows is not defined` (Line 922)
**Issue:** Variable `rows` was declared inside if/else blocks with `const [rows]`, making it scoped only to those blocks. When the code tried to use `rows` outside the blocks, it threw an error.

**Before:**
```javascript
if (unseen === 'true' && user_id) {
    const [rows] = await connection.execute(query, [user_id]); // Scoped to if block
} else {
    const [rows] = await connection.execute(query); // Scoped to else block
}

res.status(200).json({ success: true, requisitions: rows }); // ❌ rows not defined!
```

**After:**
```javascript
let rows; // Declare outside blocks

if (unseen === 'true' && user_id) {
    [rows] = await connection.execute(query, [user_id]); // Assign, don't declare
} else {
    [rows] = await connection.execute(query); // Assign, don't declare
}

res.status(200).json({ success: true, requisitions: rows }); // ✅ Works!
```

---

### ❌ Error 2: `Cannot read properties of undefined (reading 'handle')` (Line 981)
**Issue:** The `/api/requisitions/finalized` alias tried to forward requests using `app._router.handle()`, but `app._router` was undefined.

**Before:**
```javascript
app.get('/api/requisitions/finalized', async (req, res) => {
    req.url = req.url.replace('/finalized', '/authorized');
    app._router.handle(req, res); // ❌ app._router is undefined!
});
```

**After:**
```javascript
app.get('/api/requisitions/finalized', async (req, res) => {
    // Copy the authorized endpoint logic directly
    const connection = await mysql.createConnection(dbConfig);
    try {
        const { email, unseen, user_id } = req.query;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email parameter required' });
        }
        
        let query;
        let rows;
        
        if (unseen === 'true' && user_id) {
            // Only fetch unseen finalized requisitions
            query = `
                SELECT r.id, r.requestor_name, r.department, r.purpose, r.request_date, r.status, 
                       r.signature_data, r.reviewed_signature, r.approved_signature, r.authorized_signature,
                       r.created_at 
                FROM requisitions r
                LEFT JOIN user_notification_seen uns ON r.id = uns.requisition_id AND uns.user_id = ?
                WHERE r.requestor_email = ?
                AND (uns.is_seen = FALSE OR uns.is_seen IS NULL)
                AND r.status = 'authorized'
                ORDER BY r.created_at DESC
            `;
            [rows] = await connection.execute(query, [user_id, email]);
        } else {
            query = `
                SELECT id, requestor_name, department, purpose, request_date, status, 
                       signature_data, reviewed_signature, approved_signature, authorized_signature,
                       created_at 
                FROM requisitions 
                WHERE requestor_email = ? AND status = 'authorized'
                ORDER BY created_at DESC
            `;
            [rows] = await connection.execute(query, [email]);
        }
        
        res.status(200).json({ success: true, requisitions: rows });
    } catch (error) {
        console.error('Error fetching finalized requisitions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error.message });
    } finally {
        await connection.end();
    }
});
```

---

## Files Modified

**File:** `Backend/server.js`

**Changes:**
1. **Line 884-929:** Fixed variable scoping in `/api/requisitions/unsigned`
   - Declared `rows` variable at function scope
   - Removed `const` from destructuring assignments
   
2. **Line 979-1023:** Replaced broken alias with full implementation in `/api/requisitions/finalized`
   - Added complete query logic matching `/authorized` endpoint
   - Supports `?unseen=true&user_id=X` filtering
   - Proper error handling

---

## Testing Steps

### Test 1: Unsigned Requisitions
1. Open browser DevTools Console
2. Click bell icon
3. Should see successful API call:
   ```
   GET http://localhost:5000/api/requisitions/unsigned?unseen=true&user_id=1
   Response: 200 OK
   ```
4. Console should show notifications loading ✅

### Test 2: Finalized Requisitions
1. Still in notification center
2. Should also see:
   ```
   GET http://localhost:5000/api/requisitions/finalized?email=...&unseen=true&user_id=1
   Response: 200 OK
   ```
3. Both endpoints return data ✅

### Test 3: Click Notification
1. Click any notification
2. Should mark as seen and disappear ✅
3. Badge count decreases ✅

---

## Expected Backend Logs After Fix

```
Server running on http://localhost:5000
Connected to MySQL database

2026-03-16T08:XX:XX.XXXZ - GET /api/requisitions/unsigned
✅ (No errors!)

2026-03-16T08:XX:XX.XXXZ - GET /api/requisitions/finalized
✅ (No errors!)
```

**Before fix, you saw:**
```
Error fetching unsigned requisitions: ReferenceError: rows is not defined
TypeError: Cannot read properties of undefined (reading 'handle')
```

**After fix:**
```
✅ Clean logs, no errors!
```

---

## Technical Details

### Why Variable Scoping Matters

**JavaScript Block Scope:**
```javascript
// ❌ WRONG
if (true) {
    const x = 5; // x only exists inside this block
}
console.log(x); // ReferenceError: x is not defined

// ✅ CORRECT
let x;
if (true) {
    x = 5; // x was declared outside, so it persists
}
console.log(x); // 5 ✅
```

### Why Router Forwarding Failed

Express apps have internal router, but accessing `app._router` is:
- Not guaranteed to exist
- Internal API (underscore prefix means private)
- Might not be initialized yet

**Better approach:** Duplicate the logic or use proper middleware composition.

---

## Benefits

✅ **Stable API** - No more 500 errors  
✅ **Consistent behavior** - Both endpoints work the same way  
✅ **Better error messages** - Clear what went wrong if it does  
✅ **Maintainable code** - No tricky router hacks  

---

## Additional Notes

### Database Table Still Required!

These fixes assume you've already created the `user_notification_seen` table:

```sql
CREATE TABLE IF NOT EXISTS user_notification_seen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    requisition_id INT NOT NULL,
    is_seen BOOLEAN DEFAULT FALSE,
    seen_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_requisition (user_id, requisition_id),
    INDEX idx_user_seen (user_id, is_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

If you haven't created it yet, do that first!

---

## Quick Restart

After these fixes:

```bash
# Stop backend (Ctrl+C)
cd "Backend"
npm start
```

Then refresh your app - everything should work! 🚀

---

**Fix Date:** March 16, 2026  
**Status:** ✅ Complete  
**Breaking Changes:** None  
**Impact:** Critical bug fixes for notification system
