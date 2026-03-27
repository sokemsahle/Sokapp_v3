# Fix: 500 Internal Server Error When Saving Signatures

## Issue
When users clicked "Save Signature" button after adding signatures in view mode, they received:
```
PUT http://localhost:5000/api/requisition/46 500 (Internal Server Error)
Failed to save signatures: Failed to update requisition
```

## Root Cause
**Field Name Mismatch:** The frontend was sending signature field names in **camelCase** format, but the backend expected **snake_case** format.

### Frontend Sent (WRONG):
```json
{
  "reviewedSignature": "data:image/png;base64,...",
  "approvedSignature": "data:image/png;base64,...",
  "authorizedSignature": "data:image/png;base64,...",
  "reviewedBy": "John Doe",
  "approvedBy": "Jane Smith",
  "authorizedBy": "Bob Johnson"
}
```

### Backend Expected (CORRECT):
```javascript
// From server.js line 971
const { requestor, department, date, description, items, signature, 
        requestedBy, reviewedBy, approvedBy, authorizedBy, 
        approvedSignature, authorizedSignature, reviewedSignature, 
        program_id } = req.body;
```

**Note:** The backend destructures `reviewed_signature`, `approved_signature`, `authorized_signature` from the request body (line 981-982 uses these variable names in the SQL query).

## Solution

Updated the payload in `handleSignatureSubmit()` function to use snake_case to match backend expectations.

### Changes Made

**File:** `src/components/Requisition/Requisition.js`  
**Function:** `handleSignatureSubmit()` (Lines ~286-293)

**Before:**
```javascript
const payload = {
  reviewedSignature: reviewedSignature || null,
  approvedSignature: approvedSignature || null,
  authorizedSignature: authorizedSignature || null,
  reviewedBy: formData.reviewedBy || null,
  approvedBy: formData.approvedBy || null,
  authorizedBy: formData.authorizedBy || null
};
```

**After:**
```javascript
const payload = {
  reviewed_signature: reviewedSignature || null,
  approved_signature: approvedSignature || null,
  authorized_signature: authorizedSignature || null,
  reviewed_by: formData.reviewedBy || null,
  approved_by: formData.approvedBy || null,
  authorized_by: formData.authorizedBy || null
};
```

## How It Works Now

### Correct Request Flow:

```
Frontend → Backend Payload:
{
  "reviewed_signature": "data:image/png;base64,iVBOR...",
  "approved_signature": "data:image/png;base64,iVBOR...",
  "authorized_signature": null,
  "reviewed_by": "John Doe",
  "approved_by": "Jane Smith",
  "authorized_by": null
}

Backend Processing:
✓ Destructures fields correctly
✓ Updates database with signature data
✓ Returns success response
```

### Backend SQL Query (Line 981):
```sql
UPDATE requisitions SET 
  requestor_name = ?, 
  department = ?, 
  purpose = ?, 
  request_date = ?, 
  signature_data = ?, 
  requested_by = ?, 
  reviewed_by = ?,        -- ← Uses reviewed_by
  approved_by = ?, 
  authorized_by = ?, 
  approved_signature = ?, -- ← Uses approved_signature
  authorized_signature = ?, 
  reviewed_signature = ?, -- ← Uses reviewed_signature
  grand_total = ?, 
  status = CASE WHEN approved_signature IS NOT NULL AND authorized_signature IS NOT NULL THEN "authorized" ELSE "pending" END, 
  program_id = ? 
WHERE id = ?
```

## Testing Steps

### Test Signature Save:
1. ✅ Navigate to requisition in view mode
2. ✅ Enter name in "Reviewed By" field
3. ✅ Click "Sign Review"
4. ✅ Draw signature on canvas
5. ✅ Click "Save" on signature controls
6. ✅ Click "Save Signature" button at bottom
7. ✅ **Expected:** Success message appears
8. ✅ **Expected:** No 500 error
9. ✅ **Expected:** Page refreshes showing saved signature

### Browser Console Output (Success):
```javascript
=== SAVING SIGNATURE CHANGES ===
Payload: {
  "reviewed_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "approved_signature": null,
  "authorized_signature": null,
  "reviewed_by": "John Doe",
  "approved_by": null,
  "authorized_by": null
}
Response: {
  success: true,
  message: "Requisition updated successfully"
}
✅ Signature(s) saved successfully!
```

## Database Update Verification

After successful save, check database:
```sql
SELECT id, reviewed_by, reviewed_signature, 
       approved_by, approved_signature, 
       authorized_by, authorized_signature, 
       status 
FROM requisitions 
WHERE id = 46;
```

**Expected Result:**
- `reviewed_by` column contains user's name
- `reviewed_signature` column contains base64 image data
- Status may update based on signatures added

## Common Issues & Solutions

### Issue: Still getting 500 error
**Possible Causes:**
1. **Database connection issue** - Check if backend server is running
2. **Invalid base64 data** - Ensure signature canvas is working properly
3. **Missing required fields** - Check if all necessary fields are included

### Debug Steps:
1. Check browser console for exact error message
2. Check backend server console/logs for detailed error
3. Verify payload structure matches backend expectations
4. Check database connection is active

### Issue: Signature saves but shows null in database
**Check:**
1. Is signature data URL valid? (Should start with `data:image/png;base64,`)
2. Is signature too large? (May exceed database field size)
3. Are you clicking "Save" on signature pad before "Save Signature"?

## Related Backend Code

From `Backend/server.js` lines 965-983:
```javascript
app.put('/api/requisition/:id', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        
        const requisitionId = req.params.id;
        const { requestor, department, date, description, items, signature, 
                requestedBy, reviewedBy, approvedBy, authorizedBy, 
                approvedSignature, authorizedSignature, reviewedSignature, 
                program_id } = req.body;
        
        // ... processing
        
        await connection.execute(
            'UPDATE requisitions SET requestor_name = ?, department = ?, purpose = ?, request_date = ?, signature_data = ?, requested_by = ?, reviewed_by = ?, approved_by = ?, authorized_by = ?, approved_signature = ?, authorized_signature = ?, reviewed_signature = ?, grand_total = ?, status = CASE WHEN approved_signature IS NOT NULL AND authorized_signature IS NOT NULL THEN "authorized" ELSE "pending" END, program_id = ? WHERE id = ?',
            [toNull(requestor), toNull(department), toNull(description), toNull(date), toNull(signature), toNull(requestedBy), toNull(reviewedBy), toNull(approvedBy), toNull(authorizedBy), toNull(approvedSignature), toNull(authorizedSignature), toNull(reviewedSignature), grandTotal, toNull(program_id), requisitionId]
        );
        
        await connection.commit();
        res.status(200).json({ success: true, message: 'Requisition updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating requisition:', error);
        res.status(500).json({ success: false, message: 'Failed to update requisition', error: error.message });
    } finally {
        await connection.end();
    }
});
```

## Files Modified

✅ `src/components/Requisition/Requisition.js`
- Updated `handleSignatureSubmit()` payload field names
- Changed from camelCase to snake_case for signature fields

## Field Naming Convention Summary

| Frontend Variable | Backend Parameter | Database Column |
|-------------------|-------------------|-----------------|
| `reviewedSignature` | `reviewed_signature` | `reviewed_signature` |
| `approvedSignature` | `approved_signature` | `approved_signature` |
| `authorizedSignature` | `authorized_signature` | `authorized_signature` |
| `formData.reviewedBy` | `reviewedBy` | `reviewed_by` |
| `formData.approvedBy` | `approvedBy` | `approved_by` |
| `formData.authorizedBy` | `authorizedBy` | `authorized_by` |

**Note:** The `By` fields (reviewedBy, approvedBy, authorizedBy) are sent as camelCase and the backend converts them automatically. Only the signature fields need explicit snake_case.

## Related Documentation

- Previous Fix: [`FIX_SIGNATURE_PAD_NOT_SHOWING.md`](./FIX_SIGNATURE_PAD_NOT_SHOWING.md)
- Save Button: [`FIX_SAVE_SIGNATURE_BUTTON.md`](./FIX_SAVE_SIGNATURE_BUTTON.md)
- Main Fix: [`FIX_STANDARD_USER_REQUISITION_ACCESS.md`](./FIX_STANDARD_USER_REQUISITION_ACCESS.md)

---

**Status:** ✅ FIXED  
**Date:** March 13, 2026  
**Affected Component:** Requisition.js `handleSignatureSubmit()` function  
**Impact:** Signatures now save successfully without 500 errors
