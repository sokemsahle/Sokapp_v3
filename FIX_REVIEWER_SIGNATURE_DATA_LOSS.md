# Fix: Reviewer Signature Clears All Information

## Problem Identified 🐛

When a reviewer signed a requisition, **all the requisition information was being cleared** - requestor name, department, purpose, items, etc. were all set to NULL.

### Root Cause

The backend was using a `toNull()` helper function that converted `undefined` values to `NULL`:

```javascript
const toNull = (value) => value !== undefined ? value : null;
```

When the frontend sent ONLY signature data (like `reviewedSignature` and `reviewedBy`), it didn't include other fields like `requestor`, `department`, etc. The `toNull()` function then converted these missing fields to `NULL`, **overwriting existing data**:

```javascript
// ❌ BROKEN CODE - BEFORE FIX
await connection.execute(
    'UPDATE requisitions SET requestor_name = ?, department = ?, purpose = ?, ...',
    [toNull(requestor), toNull(department), toNull(description), ...]
    // When requestor is undefined → becomes NULL → overwrites database value!
);
```

### What Happened

1. Frontend sends: `{ reviewedSignature: "data:image...", reviewedBy: "John" }`
2. Backend destructures: `const { requestor, department, ... } = req.body`
3. Missing fields are `undefined`
4. `toNull(undefined)` returns `null`
5. Database UPDATE sets all missing fields to NULL
6. **All requisition data is lost!** 💥

## Solution Implemented ✅

**Fetch the original requisition first, then preserve existing values for any fields not included in the update request.**

### Fixed Code Logic

```javascript
// ✅ FIXED CODE - AFTER FIX

// 1. Fetch ORIGINAL requisition with ALL fields
const [originalRequisitionRows] = await connection.execute(
    'SELECT * FROM requisitions WHERE id = ?',
    [requisitionId]
);
const originalRequisition = originalRequisitionRows[0];

// 2. Build update data - use new values if sent, otherwise keep original
const updateData = {
    requestor_name: requestor !== undefined ? requestor : originalRequisition.requestor_name,
    department: department !== undefined ? department : originalRequisition.department,
    purpose: description !== undefined ? description : originalRequisition.purpose,
    request_date: date !== undefined ? date : originalRequisition.request_date,
    signature_data: signature !== undefined ? signature : originalRequisition.signature_data,
    reviewed_by: reviewedBy !== undefined ? reviewedBy : originalRequisition.reviewed_by,
    reviewed_signature: reviewedSignature !== undefined ? reviewedSignature : originalRequisition.reviewed_signature,
    // ... etc for all fields
};

// 3. Update with preserved data
await connection.execute(
    'UPDATE requisitions SET requestor_name = ?, department = ?, ...',
    [updateData.requestor_name, updateData.department, ...]
);
```

### Key Changes

1. **Fetch full original record:** Changed from selecting only 3 signature columns to `SELECT *`
2. **Conditional updates:** Only update fields that are explicitly sent in the request
3. **Preserve everything else:** Keep original values for missing fields
4. **Dynamic status:** Calculate status based on which signatures are present

## Changes Made 📝

### File: `Backend/server.js`

**Lines 1213-1298:** Complete restructure of the update logic

**Before (Lines 1213-1241):**
```javascript
// Selected only 3 columns
const [originalRequisitionRows] = await connection.execute(
    'SELECT reviewed_signature, approved_signature, authorized_signature FROM requisitions WHERE id = ?',
    [requisitionId]
);

// Used toNull() which destroyed data
await connection.execute(
    'UPDATE requisitions SET ...',
    [toNull(requestor), toNull(department), ...] // ❌ Converts undefined to NULL
);
```

**After (Lines 1213-1293):**
```javascript
// Select ALL columns to preserve
const [originalRequisitionRows] = await connection.execute(
    'SELECT * FROM requisitions WHERE id = ?',
    [requisitionId]
);

// Build update data conditionally
const updateData = {
    requestor_name: requestor !== undefined ? requestor : originalRequisition.requestor_name,
    department: department !== undefined ? department : originalRequisition.department,
    // ... etc
};

// Update with preserved values
await connection.execute(
    'UPDATE requisitions SET ...',
    [updateData.requestor_name, updateData.department, ...] // ✅ Preserves originals
);
```

## How This Fixes Both Issues 🔧

### Issue 1: Data Being Cleared ✅ FIXED

**Before:** When reviewer signs, only `reviewedSignature` is sent → all other fields become NULL  
**After:** When reviewer signs, only `reviewedSignature` is updated → all other fields keep original values

### Issue 2: Approver Email Notification ✅ FIXED

The approver email notification logic (lines 1252+) now works correctly because:
1. We detect new signatures BEFORE updating (line 1222)
2. We preserve all requisition data (lines 1243-1293)
3. Email content has access to complete requisition data (line 1296)

## Testing Guide 🧪

### Test 1: Reviewer Signs - Data Preserved

1. **Create a requisition** with full details:
   - Requestor: "John Doe"
   - Department: "Program"
   - Purpose: "Office supplies needed"
   - Add items
   - Submit

2. **Sign as Reviewer**:
   - Open the requisition
   - Enter "Jane Smith" in Reviewed By
   - Add signature
   - Save

3. **Verify Data is Preserved**:
   ```sql
   SELECT requestor_name, department, purpose, grand_total 
   FROM requisitions 
   WHERE id = [your_requisition_id];
   ```
   
   **Expected Result:**
   ```
   requestor_name: "John Doe" ✓
   department: "Program" ✓
   purpose: "Office supplies needed" ✓
   grand_total: [calculated amount] ✓
   reviewed_signature: [signature data] ✓
   ```

### Test 2: Approver Gets Email

After reviewer signs:
1. Check backend console for: `✓ STAGE 1: NEW reviewer signature detected`
2. Check approver email inbox
3. Verify email contains correct requisition details

### Test 3: Full Workflow

Test each stage preserves data:
1. ✅ Requestor submits → Data saved
2. ✅ Reviewer signs → Data preserved + Approvers notified
3. ✅ Approver signs → Data preserved + Authorizers notified
4. ✅ Authorizer signs → Data preserved + Requester/Finance notified

## Expected Console Output

When reviewer signs:

```
DEBUG: Checking signatures BEFORE database update...
DEBUG: Original reviewed_signature = NULL
DEBUG: New review signature in request? true
DEBUG: Will trigger approver notification? true
DEBUG: Update data prepared - preserving existing values for missing fields
DEBUG: Requisition data preserved successfully
DEBUG: requestor_name = John Doe
DEBUG: department = Program
DEBUG: purpose = Office supplies needed
✓ STAGE 1: NEW reviewer signature detected, sending notifications to approvers...
Found 2 active approvers
Processing approver: yilkal sahle (sokem@shamidaethiopia.com)
✓ Approval notification sent successfully
```

## Database Verification

Run this query to verify data preservation:

```sql
-- Before reviewer signs
SELECT id, requestor_name, department, purpose, reviewed_signature, approved_signature 
FROM requisitions 
WHERE id = [your_id];

-- After reviewer signs (should show same values + reviewed_signature)
SELECT id, requestor_name, department, purpose, reviewed_signature, approved_signature 
FROM requisitions 
WHERE id = [your_id];
```

## Common Scenarios Tested

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Reviewer signs | ❌ All data cleared | ✅ Only signature added |
| Approver signs | ❌ All data cleared | ✅ Only signature added |
| Multiple signatures | ❌ Each clears previous | ✅ All signatures accumulate |
| Email notifications | ❌ No data for email | ✅ Full data available |
| Status updates | ❌ Stuck on pending | ✅ Updates correctly |

## Files Modified

- ✅ `Backend/server.js` (Lines 1213-1298) - Fixed data preservation logic
- ✅ Created this documentation

## Related Fixes

This fix also resolves:
- ✅ Approver email notifications (now have complete data)
- ✅ Status progression (pending → reviewed → approved → authorized)
- ✅ Multi-signature workflow (each signature preserved)
- ✅ Requisition integrity (no data loss)

## Success Criteria

✅ Requestor name preserved when reviewer signs  
✅ Department preserved when approver signs  
✅ Purpose preserved when authorizer signs  
✅ Items/grand total never cleared  
✅ All signatures accumulate correctly  
✅ Status updates properly through workflow  
✅ Email notifications contain complete data  

---

**Status:** ✅ FIXED - Data preservation implemented  
**Date:** March 16, 2026  
**Impact:** Both data loss AND email notification issues resolved
