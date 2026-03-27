# Requisition Rejection Feature Documentation

## Overview
This feature allows users with requisition roles (reviewer, approver, authorizer, admin) to reject requisitions with a reason. The requester will receive an email notification with the rejection reason.

## Features Added

### 1. Database Changes
- **rejection_note** (TEXT): Stores the detailed reason for rejection
- **rejected_by** (VARCHAR): Name of the person who rejected the requisition
- **rejected_at** (TIMESTAMP): Timestamp when the requisition was rejected
- **status** enum updated to include 'rejected'

### 2. Backend API Endpoint
**POST /api/requisition/:id/reject**

Request Body:
```json
{
  "rejectionNote": "Reason for rejection",
  "rejectedBy": "John Doe",
  "rejectedByEmail": "john@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Requisition rejected successfully",
  "id": 123
}
```

### 3. Frontend Components

#### Rejection Button
- Only visible to users with requisition roles (reviewer, approver, authorizer, admin)
- Located in the form footer next to the submit button
- Red colored button with "Reject Requisition" label

#### Rejection Modal
- Appears when clicking the Reject button
- Contains a textarea for entering the rejection reason (required)
- Cancel and Confirm Rejection buttons
- Prevents submission without a reason

#### Rejection Notice Banner
- Displayed at the top of rejected requisitions
- Shows:
  - Rejection reason
  - Person who rejected
  - Date/time of rejection
- Visible to all users viewing the requisition

### 4. Email Notification
When a requisition is rejected:
- Requester receives an automated email
- Email includes:
  - Requisition details (ID, department, purpose, amount)
  - Reason for rejection (highlighted in a red box)
  - Who rejected it
  - Link to view the requisition
  - Professional styling with rejection badge

## Setup Instructions

### Step 1: Update Database
Run the database migration script:

**Option A: Using Batch File (Windows)**
```bash
cd database
ADD_REJECTION_FEATURE.bat
```

**Option B: Manual SQL Execution**
1. Open phpMyAdmin
2. Select your database (e.g., `sokapptest`)
3. Click on SQL tab
4. Copy and paste contents from `database/add_rejection_support.sql`
5. Click "Go"

### Step 2: Restart Backend Server
```bash
cd Backend
npm start
```

### Step 3: Test the Feature
1. Login as a user with requisition role (reviewer, approver, or authorizer)
2. Open a pending requisition
3. Click "Reject Requisition" button
4. Enter a rejection reason
5. Click "Confirm Rejection"
6. Verify the requester receives an email

## User Flow

### For Reviewers/Approvers/Authorizers:
1. Navigate to a requisition that needs review
2. Review the items and details
3. If issues are found, click "Reject Requisition"
4. Enter a detailed reason for rejection
5. Click "Confirm Rejection"
6. System automatically emails the requester

### For Requesters:
1. Receive email notification about rejection
2. Email contains the rejection reason
3. Click link to view rejected requisition
4. See rejection banner with details
5. Can resubmit a corrected requisition if needed

## Permissions

### Who Can Reject:
- ✅ Users with "reviewer" role
- ✅ Users with "approver" role
- ✅ Users with "authorizer" role
- ✅ Admin users (is_admin = 1)

### Who Cannot Reject:
- ❌ Standard users without requisition roles
- ❌ The original requester themselves
- ❌ Users with only "finance" role

## Email Template

The rejection email includes:
- **Header**: Red background with "Requisition Rejected" title
- **Rejection Badge**: Visual indicator showing "REJECTED" status
- **Reason Box**: Highlighted box with the rejection reason
- **Requisition Details**: ID, department, purpose, total amount
- **Rejected By**: Name of person who rejected
- **Action Button**: Link to view the requisition
- **Footer**: Automated message from SOKAPP system

## Security & Validation

### Backend Validation:
- Rejection note is required (minimum 1 character)
- Requisition must exist
- Database transaction ensures data consistency
- Rollback on any error

### Frontend Validation:
- Rejection reason textarea is required
- Cannot submit empty rejection note
- Modal prevents accidental rejections
- Cancel button allows backing out

## Status Workflow

```
pending → reviewed → approved → authorized ✓
   ↓
rejected ✗
```

Once rejected:
- Status changes to 'rejected'
- No further workflow actions possible
- Requester notified via email
- Visible to all users with access

## Testing Checklist

- [ ] Database columns added successfully
- [ ] Reject button visible for authorized users only
- [ ] Reject button hidden for unauthorized users
- [ ] Rejection modal appears on button click
- [ ] Cannot submit without rejection reason
- [ ] Email sent to requester with correct details
- [ ] Rejection banner displays on rejected requisitions
- [ ] All rejection data saved to database
- [ ] Can view rejection details after rejection
- [ ] Backend endpoint returns proper responses

## Troubleshooting

### Issue: Reject button not showing
**Solution**: Verify user has requisition role (reviewer, approver, authorizer) or is admin

### Issue: Database error on rejection
**Solution**: Run the SQL migration script to add rejection columns

### Issue: Email not sending
**Solution**: Check email configuration in backend .env file

### Issue: Rejection details not displaying
**Solution**: Refresh the page or check if rejection_note column exists in database

## Files Modified

### Backend:
- `Backend/server.js` - Added POST /api/requisition/:id/reject endpoint

### Frontend:
- `src/components/Requisition/Requisition.js` - Added rejection UI and logic

### Database:
- `database/add_rejection_support.sql` - SQL migration script
- `database/ADD_REJECTION_FEATURE.bat` - Windows batch file

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requisition/:id/reject` | Reject a requisition with reason |
| GET | `/api/requisition/:id` | Get requisition details (includes rejection info) |

## Example Usage

### Rejecting a Requisition via API:
```javascript
const response = await fetch('http://localhost:5000/api/requisition/123/reject', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rejectionNote: 'Budget exceeded for this department',
    rejectedBy: 'John Doe',
    rejectedByEmail: 'john@example.com'
  }),
});

const result = await response.json();
console.log(result); // { success: true, message: 'Requisition rejected successfully', id: 123 }
```

## Support
For issues or questions about this feature, contact the system administrator or check the project documentation.
