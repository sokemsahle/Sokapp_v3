# Requisition Finalization Notification System

## Overview
When a requisition is fully approved (all signatures obtained), the system now automatically:
1. **Sends email notifications** to both the requester and finance team
2. **Shows in-app notifications** in the navigation bar for requesters
3. **Updates the requisition status** to "finalized"

## Features Implemented

### 1. Backend Changes

#### Email Notifications
When a requisition receives the final authorization signature:

**Requester receives:**
- ✓ Approval confirmation email
- ✓ Requisition details (ID, amount, purpose)
- ✓ Link to view the requisition
- ✓ Notification that finance has been notified

**Finance team receives:**
- 🏦 Payment processing notification
- ✓ Requestor contact information
- ✓ Complete requisition details
- ✓ Priority badge indicating action required
- ✓ Link to view full requisition

#### New API Endpoints
```javascript
GET /api/requisitions/finalized?email=user@example.com
```
Returns finalized requisitions for a specific user that haven't been notified yet.

#### Database Changes
Added `notified` column to `requisitions` table:
- Type: `TINYINT(1)` 
- Default: `0` (not notified)
- Purpose: Track which requesters have been notified of approval

### 2. Frontend Changes

#### Enhanced Notification Panel
The notification panel now shows TWO sections:

**Section 1: Pending Your Action**
- Requisitions awaiting your review/approval/authorization
- Shows current workflow stage
- Color-coded status badges

**Section 2: Approved Requisitions**
- Your requisitions that have been fully approved
- Green gradient background with checkmark icon
- Shows total amount approved
- Direct link to view requisition

#### Visual Improvements
- ✓ Separate sections for different notification types
- ✓ Color-coded status badges
- ✓ Gradient backgrounds for approved items
- ✓ Improved hover effects
- ✓ Clear visual hierarchy

## How It Works

### Workflow Process

```
1. Requestor submits requisition
   ↓
2. Reviewer signs → Notifies Approvers
   ↓
3. Approver signs → Notifies Authorizers
   ↓
4. Authorizer signs → REQUISITION FINALIZED
   ↓
5. System automatically:
   - Updates status to 'finalized'
   - Sends email to Requestor (confirmation)
   - Sends email to Finance (payment processing)
   - Shows notification in nav bar
```

### Email Templates

**Requestor Email:**
```
Subject: ✓ Your Requisition Has Been Approved - #123

✓ Green header with success message
✓ Personalized greeting
✓ Requisition details table
✓ Success badge "APPROVED"
✓ Call-to-action button to view requisition
✓ Footer with congratulations
```

**Finance Email:**
```
Subject: 🏦 Payment Processing Required - Requisition #123 Approved

🔵 Blue header with payment processing notice
✓ Priority badge "ACTION REQUIRED"
✓ Complete requisition details including requestor email
✓ Status shown as "FULLY APPROVED"
✓ Call-to-action button to view details
✓ Footer requesting prompt processing
```

## Installation Steps

### 1. Update Database
Run the migration script:
```bash
cd database
ADD_NOTIFIED_COLUMN.bat
```

Or manually execute:
```sql
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS notified TINYINT(1) DEFAULT 0;
```

### 2. Restart Backend Server
```bash
cd Backend
npm start
```

### 3. Test the Feature

#### Test Scenario 1: As Requestor
1. Submit a new requisition
2. Have it go through all approval stages
3. When final signature is added, check:
   - ✓ Email inbox for approval confirmation
   - ✓ Nav bar notification badge
   - ✓ Notification panel shows "Approved Requisitions" section

#### Test Scenario 2: As Finance
1. Wait for requisition to be fully approved
2. Check email inbox for payment processing notification
3. Click link to view requisition details

#### Test Scenario 3: As Admin/Approver
1. Open notification panel
2. Verify two sections appear:
   - "Pending Your Action" (for unsigned requisitions)
   - "Approved Requisitions" (for your finalized ones)

## Configuration

### Email Settings
Ensure your `.env` file has correct email configuration:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=SOKAPP Requisition <no-reply@sokapp.com>
```

### Finance Role Setup
Make sure you have users with the 'finance' role in `requisition_roles` table:
```sql
SELECT * FROM requisition_roles WHERE role_type = 'finance' AND is_active = TRUE;
```

If no finance users exist, add them:
```sql
INSERT INTO requisition_roles (user_id, role_type, is_active)
SELECT id, 'finance', TRUE FROM users WHERE email = 'finance@example.com';
```

## Benefits

### For Requestors
- ✓ Immediate notification when requisition is approved
- ✓ Clear visibility of approved amounts
- ✓ Easy access to requisition details
- ✓ Peace of mind knowing finance is processing payment

### For Finance Team
- ✓ Automatic notification of new payments to process
- ✓ All requisition details in one email
- ✓ Direct link to full requisition
- ✓ Clear priority indication

### For Approvers
- ✓ Better visibility of requisition status
- ✓ Streamlined workflow notifications
- ✓ Reduced manual communication needed

## Troubleshooting

### Issue: Emails not sending
**Solution:**
1. Check backend console for email errors
2. Verify email credentials in `.env`
3. Ensure `sendEmailNotification()` function is working
4. Check spam folder

### Issue: Notification count not updating
**Solution:**
1. Check browser console for errors
2. Verify `/api/requisitions/finalized` endpoint returns data
3. Check that `requestor_email` matches logged-in user email
4. Ensure `notified` column exists in database

### Issue: No "Approved Requisitions" section showing
**Solution:**
1. Verify requisition status is 'finalized' in database
2. Check that user email matches `requestor_email`
3. Ensure `notified` field is properly set
4. Try clearing browser cache

### Issue: Finance not receiving emails
**Solution:**
1. Verify finance users exist in `requisition_roles` table
2. Check that finance users have `is_active = TRUE`
3. Ensure finance users have valid email addresses
4. Check backend console for email send errors

## Database Schema

### Updated Requisitions Table
```sql
CREATE TABLE requisitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestor_name VARCHAR(255),
    requestor_email VARCHAR(255),  -- Used for notifications
    department VARCHAR(100),
    purpose TEXT,
    status ENUM('pending', 'reviewed', 'approved', 'authorized', 'finalized'),
    grand_total DECIMAL(10, 2),
    notified TINYINT(1) DEFAULT 0,  -- NEW: Track notification status
    -- ... other fields ...
);
```

## API Response Examples

### GET /api/requisitions/finalized?email=user@example.com
```json
{
  "success": true,
  "requisitions": [
    {
      "id": 123,
      "requestor_name": "John Doe",
      "requestor_email": "user@example.com",
      "department": "Program",
      "purpose": "Office supplies for Q2",
      "status": "finalized",
      "grand_total": 1500.00,
      "created_at": "2026-03-08T10:30:00Z"
    }
  ]
}
```

## Future Enhancements

Potential improvements:
- [ ] Mark notifications as read/unread
- [ ] SMS notifications for urgent requisitions
- [ ] Email digest of daily approvals
- [ ] Customizable notification preferences
- [ ] Push notifications for mobile apps
- [ ] Export approved requisitions to PDF
- [ ] Integration with accounting software

## Support

For issues or questions:
1. Check backend server logs
2. Verify database schema is up to date
3. Test email configuration
4. Contact system administrator

---

**Last Updated:** March 8, 2026  
**Version:** 3.0  
**Status:** Production Ready ✅
