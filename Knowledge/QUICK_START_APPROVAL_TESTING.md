# Quick Start Guide - Inventory Request Approval System

## 🚀 Get Started in 3 Minutes

### Step 1: Verify Backend is Running
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
node server.js
```
✅ Ensure you see: "Server running on port 5000"

### Step 2: Verify Database Setup
Make sure you've run the inventory request system SQL:
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
# Run enhanced_inventory_request_system.sql in phpMyAdmin or:
mysql -u root -p sokapptest < enhanced_inventory_request_system.sql
```

### Step 3: Start Frontend
```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3"
npm start
```
✅ Opens at http://localhost:3000

---

## 🧪 Test the System

### Scenario 1: Create and Approve a Request

#### A. Submit a Request (as Standard User):
1. Login as standard user
2. Go to **Inventory → Request Item**
3. Fill in form:
   - Select item: "A4 Paper Reams"
   - Quantity: 10 reams
   - Reason: "Testing approval system"
   - Urgency: Normal
4. Click **"Submit Request"**
5. ✅ See success message

#### B. Approve the Request (as Admin):
1. Login as admin user
2. Go to **Inventory → Request Approvals**
3. See your pending request in the table
4. Click **"Approve"** button
5. Modal opens showing request details
6. Keep quantity at 10 (or change for partial approval)
7. Click **"Confirm Approval"**
8. ✅ See success: "Request approved successfully"
9. ✅ Check email inbox for approval notification

#### C. Verify Stock Reduction:
1. Go to **Inventory → View Inventory**
2. Find "A4 Paper Reams"
3. ✅ Verify stock reduced by 10 units
4. ✅ Check transaction log shows the reduction

---

### Scenario 2: Reject a Request

#### A. Submit Another Request:
1. Login as standard user
2. Submit request for "Printer Ink Cartridges"
3. Quantity: 5 cartridges
4. Reason: "Testing rejection workflow"

#### B. Reject the Request (as Admin):
1. Go to **Inventory → Request Approvals**
2. Find the new request
3. Click **"Reject"** button
4. Enter rejection reason: 
   ```
   Budget constraints. Please resubmit next quarter.
   ```
5. Click **"Confirm Rejection"**
6. ✅ See success message
7. ✅ Check email inbox for rejection notification with reason

---

### Scenario 3: Partial Approval

#### A. Submit Large Request:
1. Login as standard user
2. Request "Ballpoint Pens (Blue)"
3. Quantity: 500 pieces (when only 1000 in stock)
4. Reason: "Office supply bulk order"

#### B. Partially Approve (as Admin):
1. Go to **Inventory → Request Approvals**
2. Click **"Approve"** on the request
3. Change quantity to 200 (less than requested 500)
4. ⚠️ See warning: "This will be a partial approval"
5. Click **"Confirm Approval"**
6. ✅ Status shows "Partially Approved"
7. ✅ Email explains partial approval to requestor

---

## 📋 Navigation Paths

### For Admin Users:
```
http://localhost:3000/admin/inventory/approvals
```

### For Standard Users (with manage permission):
```
http://localhost:3000/inventory/approvals
```

---

## 🔑 Test Accounts

### Admin Account:
- Email: `admin@sokapp.online`
- Password: (your admin password)
- Has full approval permissions

### Standard User Account:
- Email: `user@example.com`
- Password: (your user password)
- Can submit requests but NOT approve/reject

### Inventory Manager Account:
- Email: `manager@sokapp.online`
- Password: (your manager password)
- Can approve/reject requests

---

## 🎯 What to Test

### Core Functionality Checklist:

#### Approval Tests:
- [ ] Can view all pending requests
- [ ] Can approve full quantity
- [ ] Can approve partial quantity
- [ ] Stock reduces automatically on approval
- [ ] Transaction log created
- [ ] Approval email received

#### Rejection Tests:
- [ ] Can reject a request
- [ ] Rejection reason is required
- [ ] Rejection email sent with reason
- [ ] Status updates to "rejected"

#### UI/UX Tests:
- [ ] Filters work (status, urgency, search)
- [ ] Statistics cards show correct counts
- [ ] Modals open and close properly
- [ ] Warnings appear for edge cases
- [ ] Table displays all information correctly

#### Permission Tests:
- [ ] User without manage permission sees "Access Denied"
- [ ] Only users with `inventory_manage` can approve/reject
- [ ] Navigation menu shows/hides based on permissions

---

## 🐛 Troubleshooting

### Issue: Can't access approval page
**Solution:**
```sql
-- Verify you have inventory_manage permission
SELECT r.name, p.name 
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'inventory_manage';
```

### Issue: API returns 404
**Solution:**
- Verify backend is running on port 5000
- Check `.env` file has correct API URL
- Restart backend server

### Issue: Emails not sending
**Solution:**
- Check `.env` has `BREVO_API_KEY` set
- Verify API key is valid
- Check Brevo account credits

### Issue: Stock not reducing
**Solution:**
```sql
-- Check if trigger exists
SHOW TRIGGERS LIKE 'inventory_requests';

-- If missing, run the SQL script again
```

### Issue: Modal won't close
**Solution:**
- Click "Cancel" button
- Click outside modal overlay
- Press Escape key

---

## 📊 Sample Test Queries

### View All Pending Requests:
```sql
SELECT * FROM inventory_requests WHERE status = 'pending' ORDER BY created_at DESC;
```

### View My Requests (Standard User):
```sql
SELECT * FROM inventory_requests WHERE requestor_email = 'user@example.com';
```

### Check Stock Levels:
```sql
SELECT id, name, quantity, min_stock_level 
FROM inventory 
ORDER BY quantity ASC;
```

### View Transaction History:
```sql
SELECT * FROM inventory_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📧 Email Testing

### Expected Emails:

#### When Request Submitted:
- **To:** All inventory managers
- **Subject:** 📦 New Inventory Request #123
- **Content:** Request details + urgency level

#### When Request Approved:
- **To:** Requestor
- **Subject:** ✅ Inventory Request #123 Approved
- **Content:** Approval details + collection info

#### When Request Rejected:
- **To:** Requestor
- **Subject:** ❌ Inventory Request #123 Rejected
- **Content:** Rejection reason prominently displayed

### Check Email Delivery:
1. Submit test request
2. Check manager email inbox
3. Approve/reject request
4. Check requestor email inbox
5. Verify email content matches expectations

---

## 🎨 Visual Testing

### Check These UI Elements:
- [ ] Stat cards display correct colors
- [ ] Urgency badges are color-coded
- [ ] Status badges match state
- [ ] Table rows have hover effects
- [ ] Modals center properly
- [ ] Forms validate input
- [ ] Buttons have correct icons
- [ ] Responsive design works on mobile

---

## 🔍 Debug Mode

### Enable Console Logging:
Open browser DevTools (F12) and check console for:
- API call responses
- Error messages
- Form submission data

### Backend Logs:
Check backend terminal for:
- API endpoint hits
- Database query results
- Email send attempts

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Can navigate to `/inventory/approvals`
2. ✅ See statistics dashboard with numbers
3. ✅ See pending requests in table
4. ✅ Can click "Approve" and see modal
5. ✅ Can submit approval and see success
6. ✅ Stock levels update automatically
7. ✅ Emails are sent and received
8. ✅ Transaction logs are created

---

## 📝 Test Script Template

Use this template to document your tests:

```
Test Date: ___________
Tester: ___________

Test 1: Full Approval
- Request submitted: ✓ / ✗
- Email received by manager: ✓ / ✗
- Approval modal opened: ✓ / ✗
- Stock reduced: ✓ / ✗
- Approval email sent: ✓ / ✗

Test 2: Partial Approval
- Partial quantity entered: ✓ / ✗
- Warning shown: ✓ / ✗
- Status = partially_approved: ✓ / ✗

Test 3: Rejection
- Reject modal opened: ✓ / ✗
- Reason required: ✓ / ✗
- Rejection email sent: ✓ / ✗
- Status = rejected: ✓ / ✗

Notes:
___________________________
___________________________
```

---

## 🎯 Next Steps After Testing

Once testing is complete:
1. Add real inventory items to your database
2. Configure actual email addresses in Brevo
3. Assign proper permissions to user roles
4. Train inventory managers on approval workflow
5. Set up low stock alerts
6. Create standard operating procedures

---

**🎉 You're ready to test the complete approval/rejection system!**

For detailed documentation, see:
- `INVENTORY_APPROVAL_REJECTION_IMPLEMENTATION.md`
- `INVENTORY_APPROVAL_VISUAL_GUIDE.md`
- `INVENTORY_REQUEST_SYSTEM_GUIDE.md`
