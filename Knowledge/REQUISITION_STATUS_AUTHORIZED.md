# Requisition Status Update - Authorized Status

## Summary
Updated the requisition workflow so that when a requisition is authorized (authorizer signs it), the status changes to **"authorized"** instead of "finalized".

## Changes Made

### Backend Changes (server.js)

1. **Status Update Logic** (Line ~1097-1104)
   - Changed: When authorizer signs, status now updates to `'authorized'` instead of `'finalized'`
   - Updated condition to check for both `'authorized'` and `'finalized'` to prevent duplicate notifications
   - Updated console log messages from "FINALIZED" to "AUTHORIZED"

2. **Email Notifications**
   - **Requester Notification**: Updated email subject and content to say "Authorized" instead of "Approved"
   - **Finance Notification**: Updated email subject and status badge to say "AUTHORIZED" instead of "FULLY APPROVED"
   - Success badge text changed from "APPROVED" to "AUTHORIZED"

3. **API Endpoint** (Line ~785-813)
   - Renamed endpoint from `/api/requisitions/finalized` to `/api/requisitions/authorized`
   - Updated SQL query to filter by `status = 'authorized'` instead of `'finalized'`
   - Updated comments and error messages

### Frontend Changes (Requisition.js)

1. **Completion Check** (Line ~145-147)
   - Updated `isRequisitionCompleted` logic to only check for `status === 'authorized'` (removed `'finalized'` check)
   - This ensures requisitions with "authorized" status are treated as completed

## Workflow Stages

The requisition workflow now works as follows:

1. **Pending** → Initial status when created
2. **Reviewed** → When reviewer adds signature
3. **Approved** → When approver adds signature  
4. **Authorized** → When authorizer adds signature (FINAL STATUS)

## Status Values

- ✅ **pending** - Awaiting review
- ✅ **authorized** - Fully approved and authorized (replaces "finalized")
- ❌ **finalized** - No longer used (replaced by "authorized")

## Testing

To test the changes:

1. Create a new requisition
2. Have a reviewer sign it → Status remains "pending"
3. Have an approver sign it → Status remains "pending"
4. Have an authorizer sign it → Status changes to **"authorized"**
5. Verify:
   - Requester receives "Your Requisition Has Been Authorized" email
   - Finance team receives "Payment Processing Required - Requisition Authorized" email
   - Requisition shows as completed in the UI
   - No further edits can be made

## Notes

- The term "finalized" has been completely replaced with "authorized"
- All notification emails now use "authorized" terminology
- The status change happens automatically when the authorizer's signature is added
- The system prevents duplicate notifications by checking if status is already "authorized" or "finalized"
