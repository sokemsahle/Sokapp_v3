# Requisition Email Workflow Documentation

## Overview
The requisition system has a complete automated email notification workflow that keeps all stakeholders informed throughout the requisition lifecycle. Emails are sent using the **Brevo API** (formerly Sendinblue).

---

## Email Configuration

### Environment Variables (`.env`)
```env
# Brevo Email Configuration
BREVO_API_KEY=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
EMAIL_FROM=noreply@sokapp.online
BREVO_SENDER_EMAIL=noreply@sokapp.online
FRONTEND_URL=http://localhost:3000
```

### Email Service Function
Located in `Backend/server.js` (lines 2988-3043):

```javascript
const sendEmailNotification = async (toEmail, subject, htmlContent) => {
    // Uses Brevo API to send HTML emails
    // Returns: { success: true/false, messageId: '...' }
}
```

---

## Email Workflow Stages

### 📧 Stage 0: Requisition Created → Notify Reviewers

**Trigger:** When a new requisition is submitted (`POST /api/requisition`)

**Recipients:** All active users with `reviewer` role in `requisition_roles` table

**Email Content:**
- Subject: `New Requisition Requires Review - #{requisitionId}`
- Requisition ID, Requestor, Department, Purpose
- Link to review the requisition

**Code Location:** `server.js` lines 600-697

**SQL Query:**
```sql
SELECT u.email, u.full_name FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'reviewer' AND rr.is_active = TRUE AND u.is_active = TRUE
```

---

### 📧 Stage 1: Reviewer Signed → Notify Approvers

**Trigger:** When reviewer adds their signature (`PUT /api/requisition/:id`)

**Condition:** `reviewed_signature EXISTS AND approved_signature DOES NOT EXIST`

**Recipients:** All active users with `approver` role in `requisition_roles` table

**Email Content:**
- Subject: `Requisition Awaiting Approval - #{requisitionId}`
- Notification that requisition has been reviewed
- Requisition details (ID, Requestor, Department, Purpose)
- Link to approve the requisition

**Code Location:** `server.js` lines 956-1025

**SQL Query:**
```sql
SELECT u.email, u.full_name FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'approver' AND rr.is_active = TRUE AND u.is_active = TRUE
```

---

### 📧 Stage 2: Approver Signed → Notify Authorizers

**Trigger:** When approver adds their signature (`PUT /api/requisition/:id`)

**Condition:** `approved_signature EXISTS AND authorized_signature DOES NOT EXIST`

**Recipients:** All active users with `authorizer` role in `requisition_roles` table

**Email Content:**
- Subject: `Requisition Awaiting Authorization - #{requisitionId}`
- Notification that requisition has been approved
- Requisition details including total amount
- Link to authorize the requisition

**Code Location:** `server.js` lines 1027-1097

**SQL Query:**
```sql
SELECT u.email, u.full_name FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'authorizer' AND rr.is_active = TRUE AND u.is_active = TRUE
```

---

### 📧 Stage 3: Authorizer Signed → Notify Requester & Finance

**Trigger:** When authorizer adds their signature (`PUT /api/requisition/:id`)

**Condition:** `authorized_signature EXISTS AND status != 'authorized' AND status != 'finalized'`

#### 3A: Email to Requester
**Recipient:** The person who created the requisition (`requestor_email`)

**Email Content:**
- Subject: `✓ Your Requisition Has Been Authorized - #{requisitionId}`
- Success notification with green badge
- Requisition details and total amount
- Message that finance team has been notified
- Link to view the requisition

**Code Location:** `server.js` lines 1109-1161

#### 3B: Email to Finance Team
**Recipients:** All active users with `finance` role in `requisition_roles` table

**Email Content:**
- Subject: `🏦 Payment Processing Required - Requisition #{requisitionId} Approved`
- Priority action required badge
- Complete requisition details including requestor contact info
- Total amount in Birr
- Status: AUTHORIZED (green highlight)
- Link to view requisition details

**Code Location:** `server.js` lines 1163-1234

**SQL Query:**
```sql
SELECT u.email, u.full_name FROM requisition_roles rr 
JOIN users u ON rr.user_id = u.id 
WHERE rr.role_type = 'finance' AND rr.is_active = TRUE AND u.is_active = TRUE
```

---

### 📧 Stage 4: Requisition Rejected → Notify Requester

**Trigger:** When a requisition is rejected (`POST /api/requisition/:id/reject`)

**Recipient:** The person who created the requisition (`requestor_email`)

**Email Content:**
- Subject: `✗ Your Requisition Has Been Rejected - #{requisitionId}`
- Red header indicating rejection
- Rejection reason/note prominently displayed
- Requisition details
- Who rejected it
- Link to view details and resubmit if needed

**Code Location:** `server.js` lines 1266-1377

---

## Manual Email Sending Endpoints

### 1. Send Notification by Role Type
**Endpoint:** `POST /api/requisition/:id/send-notification`

**Body:**
```json
{
  "recipientType": "reviewer" // or "approver" or "authorizer"
}
```

**Code Location:** `server.js` lines 3046-3215

---

### 2. Send Notification by Permission Type
**Endpoint:** `POST /api/requisition/:id/send-notification-by-permission`

**Body:**
```json
{
  "permissionType": "review" // or "approval" or "authorization"
}
```

**Description:** Sends emails to all users with specific permissions

**Code Location:** `server.js` lines 3266-3372

---

## Workflow Roles Management

### Get Workflow Settings
**Endpoint:** `GET /api/workflow-settings`

**Returns:** All active users with their roles for workflow assignment

**Code Location:** `server.js` lines 3217-3243

---

## Database Schema

### requisition_roles Table
```sql
CREATE TABLE requisition_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    role_type ENUM('reviewer', 'approver', 'authorizer', 'finance'),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### requisitions Table (relevant columns)
```sql
CREATE TABLE requisitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requestor_name VARCHAR(255),
    requestor_email VARCHAR(255),
    department VARCHAR(255),
    purpose TEXT,
    status ENUM('pending', 'reviewed', 'approved', 'authorized', 'finalized', 'rejected'),
    reviewed_signature TEXT,
    approved_signature TEXT,
    authorized_signature TEXT,
    rejection_note TEXT,
    rejected_by VARCHAR(255),
    rejected_at TIMESTAMP,
    grand_total DECIMAL(10,2),
    -- ... other columns
);
```

---

## Email Template Structure

All emails follow a consistent HTML template structure:

```html
<html>
<head>
<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background-color: [color]; padding: 10px; border-radius: 5px; }
    .content { margin: 20px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
    .button { background-color: #007bff; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 5px; display: inline-block; }
    .badge { background-color: [color]; color: white; padding: 5px 15px; 
             border-radius: 20px; display: inline-block; }
</style>
</head>
<body>
    <div class="header">
        <h2>[Email Title]</h2>
    </div>
    <div class="content">
        <p>Hello [Name],</p>
        <p>[Message content]</p>
        <p><strong>Requisition ID:</strong> #[id]</p>
        <p><strong>Requestor:</strong> [name]</p>
        <p><strong>Department:</strong> [department]</p>
        <p><strong>Purpose:</strong> [purpose]</p>
        <p><strong>Total Amount:</strong> [amount] Birr</p>
        <a href="[frontendUrl]/requisitions/[id]" class="button">[Action Button]</a>
    </div>
    <div class="footer">
        <p>This is an automated notification from SOKAPP Requisition System.</p>
    </div>
</body>
</html>
```

---

## Error Handling

### Email Sending Failures
- If Brevo API key is missing: Logs error, returns `{ success: false, message: 'Email service not configured' }`
- If API call fails: Logs detailed error including HTTP status and response data
- Email failures do NOT rollback the requisition transaction (non-blocking)

### Debug Logging
All email operations include extensive logging:
- ✅ Success messages with recipient email
- ❌ Failure messages with error details
- ⚠️ Warnings when no recipients found
- DEBUG statements for troubleshooting

---

## Testing Checklist

### To test the complete workflow:

1. **Setup:**
   - Ensure `BREVO_API_KEY` is valid in `.env`
   - Ensure `EMAIL_FROM` is configured
   - Create test users in database with different roles
   - Assign roles in `requisition_roles` table

2. **Create Requisition:**
   - Submit new requisition via frontend
   - Check reviewer inbox for email

3. **Review Stage:**
   - Login as reviewer
   - Add review signature
   - Check approver inbox for email

4. **Approval Stage:**
   - Login as approver
   - Add approval signature
   - Check authorizer inbox for email

5. **Authorization Stage:**
   - Login as authorizer
   - Add authorization signature
   - Check requester inbox for authorization email
   - Check finance team inbox for payment processing email

6. **Rejection Stage:**
   - Create another requisition
   - Reject it with a note
   - Check requester inbox for rejection email

---

## Common Issues & Solutions

### Issue 1: Emails not sending
**Solution:** Check Brevo API key validity and ensure `EMAIL_FROM` is set

### Issue 2: No recipients found
**Solution:** Verify users exist in `requisition_roles` table with correct `role_type` and `is_active = TRUE`

### Issue 3: Wrong email content
**Solution:** Check HTML template strings in server.js, ensure proper string interpolation

### Issue 4: Emails going to spam
**Solution:** Verify domain authentication in Brevo dashboard, check SPF/DKIM records

---

## Best Practices

1. **Multiple Recipients:** System supports multiple reviewers/approvers/authorizers
2. **Active Status Check:** Only sends to users where `is_active = TRUE`
3. **Non-Blocking:** Email failures don't prevent requisition processing
4. **Detailed Logging:** Every email attempt is logged for debugging
5. **HTML Templates:** Professional, branded email templates
6. **Direct Links:** All emails include direct links to requisition pages

---

## Related Files

- **Main Implementation:** `Backend/server.js` (lines 550-1400, 2988-3043, 3046-3215, 3266-3372)
- **Environment Config:** `Backend/.env`
- **Frontend Integration:** `src/components/Requisition/RequisitionList.jsx`
- **Database Schema:** `database/sokapptest_schema.sql`

---

## Summary

The requisition email workflow ensures complete transparency and communication throughout the approval process:

✅ **4 Automated Stages** + Rejection handling  
✅ **5 Recipient Types:** Reviewers, Approvers, Authorizers, Finance, Requesters  
✅ **Professional HTML Templates** with branding  
✅ **Error Resilient** - emails don't block business logic  
✅ **Comprehensive Logging** for debugging  
✅ **Manual Override** endpoints for re-sending  

Total Email Triggers: **6**
- New requisition → Reviewers
- Reviewed → Approvers  
- Approved → Authorizers
- Authorized → Requester + Finance
- Rejected → Requester
