# Standard User Requisition Notifications

## Overview
Standard users (non-admin) now receive notifications in their navigation bar when their requisitions are approved/finalized, just like admin users.

---

## 🎯 What's New for Standard Users?

### Notification Features
1. **Nav Bar Badge** 🔔
   - Shows count of approved requisitions
   - Visible in the top-right corner next to profile

2. **Notification Panel** 📬
   - Click bell icon to open
   - Shows "Approved Requisitions" section
   - Displays requisition details and amounts

3. **Email Notifications** ✉️
   - Sent when requisition is fully approved
   - Includes all requisition details
   - Finance team also notified simultaneously

---

## 🔄 How It Works

### For Standard Users

```
Submit Requisition → Wait for Signatures → Get Notified ✓
```

**Detailed Flow:**
1. User submits requisition through "My Requisitions → Create New"
2. Requisition goes through approval workflow:
   - Reviewer signs
   - Approver signs
   - Authorizer signs
3. When **all signatures complete**:
   - Status updates to "finalized"
   - Email sent to user ✓
   - Nav bar notification appears 🔔
   - Count shows number of approved requisitions

### Notification Display

**Nav Bar:**
```
┌──────────────────────┐
│ 🔔 2                 │ ← Shows 2 approved requisitions
└──────────────────────┘
```

**Notification Panel (When Clicked):**
```
╔═══════════════════════════════════╗
║ Requisition Notifications    [X] ║
╠═══════════════════════════════════╣
║ ✓ Approved Requisitions           ║
╟───────────────────────────────────╢
║ #123 | Office Supplies            ║
║ Program Dept.                     ║
║ ✓ Approved | 1,500.00 Birr       ║
╟───────────────────────────────────╢
║ #124 | Training Materials         ║
║ Admin Dept.                       ║
║ ✓ Approved | 2,300.00 Birr       ║
╚═══════════════════════════════════╝
```

---

## 📋 Implementation Details

### Frontend Changes

#### StandardUser.js Updates

**1. State Management:**
```javascript
const [newRequisitionCount, setNewRequisitionCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
```

**2. Polling Function:**
```javascript
const checkForFinalizedRequisitions = async () => {
    if (!user?.email) return;
    
    try {
        const response = await fetch(
            `http://localhost:5000/api/requisitions/finalized?email=${encodeURIComponent(user.email)}`
        );
        const result = await response.json();
        
        if (result.success && result.requisitions) {
            const finalizedCount = result.requisitions.length;
            setNewRequisitionCount(finalizedCount);
            console.log('Notification count updated:', finalizedCount);
        }
    } catch (error) {
        console.error('Error checking for finalized requisitions:', error);
    }
};
```

**3. Auto-Polling:**
```javascript
useEffect(() => {
    if (!user?.email) return;

    // Check immediately on load
    checkForFinalizedRequisitions();
    
    // Set up polling interval (every 30 seconds)
    const interval = setInterval(checkForFinalizedRequisitions, 30000);
    
    return () => clearInterval(interval);
}, [user?.email]);
```

**4. Nav Component Integration:**
```jsx
<Nav
    toggleSidebar={toggleSidebar}
    user={user}
    onBackToAdmin={onBackToAdmin}
    isStandardView={true}
    onLogout={handleLogout}
    onSwitchAccount={() => alert('Switch Account')}
    notificationCount={newRequisitionCount}
    onNotificationClick={() => {
        setShowNotifications(true);
        setNewRequisitionCount(0); // Clear badge
    }}
/>

<RequisitionNotifications 
    isOpen={showNotifications}
    onClose={() => setShowNotifications(false)}
    onRequisitionClick={(reqId) => {
        setActiveItem('Requisition-List');
        setShowNotifications(false);
        checkForFinalizedRequisitions(); // Refresh count
    }}
    currentUser={user}
/>
```

### Backend Changes

#### API Endpoint
```javascript
GET /api/requisitions/finalized?email=user@example.com
```

**Response:**
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

**SQL Query:**
```sql
SELECT id, requestor_name, requestor_email, department, purpose, 
       request_date, status, grand_total, created_at 
FROM requisitions 
WHERE status = 'finalized' 
  AND requestor_email = ?
ORDER BY created_at DESC
```

---

## 🚀 Setup Instructions

### 1. Database Requirements
Ensure your `requisitions` table has:
- `status` column (ENUM with 'finalized')
- `requestor_email` column (VARCHAR)
- `grand_total` column (DECIMAL)

**Check Schema:**
```sql
DESCRIBE requisitions;
```

**Add Missing Columns:**
```sql
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'reviewed', 'approved', 'authorized', 'finalized') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS requestor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS grand_total DECIMAL(10, 2);
```

### 2. Email Configuration
Verify `.env` has email settings:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=SOKAPP Requisition <no-reply@sokapp.com>
```

### 3. Restart Backend Server
```bash
cd Backend
npm start
```

---

## 🧪 Testing Guide

### Test Scenario 1: Submit and Receive Notification

**Steps:**
1. Log in as standard user
2. Go to My Requisitions → Create New
3. Fill form and submit
4. Have admin/approver sign all required signatures
5. Watch for notification

**Expected Results:**
- ✓ Email received in inbox
- ✓ Nav bar badge appears (count = 1)
- ✓ Click bell shows "Approved Requisitions" section
- ✓ Can click to view requisition details

### Test Scenario 2: Multiple Approvals

**Steps:**
1. Submit 3 different requisitions
2. Get all approved
3. Check notification count

**Expected Results:**
- ✓ Nav bar shows "3"
- ✓ All 3 appear in notification panel
- ✓ Each shows amount and details

### Test Scenario 3: Clear Notification

**Steps:**
1. Have pending notification
2. Click bell icon
3. Click on a requisition

**Expected Results:**
- ✓ Badge count resets to 0
- ✓ Navigate to requisition list
- ✓ Can still see requisitions in panel (not deleted)

---

## 🎨 UI/UX Features

### Visual Design

**Notification Badge:**
- Red circle with white number
- Positioned on bell icon
- Only shows when count > 0

**Notification Panel:**
- Slides in from right
- Green gradient for approved items
- Checkmark icon (✓) for approved status
- Amount displayed in green

**Hover Effects:**
- Items highlight on hover
- Slight translation to right
- Cursor changes to pointer

### Responsive Behavior
- Works on desktop and mobile
- Panel adjusts width for smaller screens
- Touch-friendly for mobile devices

---

## 📊 Comparison: Admin vs Standard User

| Feature | Admin | Standard User |
|---------|-------|---------------|
| **Nav Notification** | ✓ All unsigned requisitions | ✓ Only their finalized requisitions |
| **Email on Approval** | ✗ (Only if they're requester) | ✓ Yes, when their requisition approved |
| **Notification Panel** | ✓ Two sections (Pending + Approved) | ✓ One section (Approved only) |
| **Polling Interval** | 30 seconds | 30 seconds |
| **API Endpoint** | `/api/requisitions/unsigned` | `/api/requisitions/finalized?email=` |

---

## 🔧 Troubleshooting

### Issue 1: No Notification Showing

**Possible Causes:**
- Email not matching requestor_email in database
- Requisition status not 'finalized'
- Polling not running

**Solutions:**
1. Check browser console for errors
2. Verify user email matches requisition requestor_email
3. Check requisition status in database:
   ```sql
   SELECT id, status, requestor_email FROM requisitions WHERE id = 123;
   ```
4. Manually trigger poll in console:
   ```javascript
   checkForFinalizedRequisitions();
   ```

### Issue 2: Email Not Received

**Possible Causes:**
- Email configuration incorrect
- Email went to spam
- Requestor email missing

**Solutions:**
1. Check spam folder
2. Verify email in `.env` file
3. Check backend console for email errors
4. Verify requestor_email exists in requisition record

### Issue 3: Notification Count Wrong

**Possible Causes:**
- Polling interval too long
- State not updating properly

**Solutions:**
1. Reduce polling interval in code (from 30s to 10s)
2. Refresh page to force update
3. Check console logs for count updates

### Issue 4: Component Not Rendering

**Possible Causes:**
- Import statement missing
- Component name typo

**Solutions:**
1. Verify import at top of StandardUser.js:
   ```javascript
   import RequisitionNotifications from './components/Requisition/RequisitionNotifications';
   ```
2. Check component tag is properly closed
3. Look for React errors in console

---

## 💡 Best Practices

### For Users
1. **Check notifications regularly** - Bell icon updates automatically
2. **Click to view details** - See full requisition information
3. **Keep email updated** - Ensure notifications go to correct address
4. **Save confirmation emails** - Keep for records

### For Developers
1. **Monitor console logs** - Check for polling errors
2. **Test email delivery** - Verify email configuration works
3. **Handle edge cases** - Missing emails, failed queries
4. **Optimize polling** - Balance freshness vs performance

---

## 🔮 Future Enhancements

### Potential Features
- [ ] Mark individual notifications as read
- [ ] Filter by date range
- [ ] Export approved requisitions to PDF
- [ ] Push notifications for mobile
- [ ] Sound alerts for new approvals
- [ ] Customizable polling interval
- [ ] Notification history/archive
- [ ] Batch email digest (daily summary)

### Technical Improvements
- [ ] WebSocket for real-time updates (replace polling)
- [ ] Redis cache for faster queries
- [ ] Email queue system for reliability
- [ ] Analytics on notification engagement
- [ ] A/B testing email templates

---

## 📈 Usage Statistics

Track these metrics:
- Average time from finalization to notification
- Email open rates
- Click-through rates on notifications
- User satisfaction scores

---

## 🆘 Support

### For Users
Having issues? Contact:
- Email: support@sokapp.com
- Include: Your name, requisition ID, problem description

### For Developers
Debugging tips:
1. Check backend console for email errors
2. Monitor frontend console for API errors
3. Verify database query returns expected results
4. Test email configuration independently

---

## ✅ Checklist for Deployment

- [ ] Database has `status` and `requestor_email` columns
- [ ] Email configuration in `.env` is correct
- [ ] Backend server restarted with new code
- [ ] Frontend rebuilt with StandardUser.js changes
- [ ] Test requisition submitted and approved
- [ ] Email notification received
- [ ] Nav bar notification visible
- [ ] Notification panel opens correctly
- [ ] Click navigation works

---

**Last Updated:** March 8, 2026  
**Version:** 3.0  
**Status:** Production Ready ✅  
**Tested:** Manual testing completed successfully

---

## Quick Reference

```
┌─────────────────────────────────────┐
│ STANDARD USER NOTIFICATION FLOW     │
├─────────────────────────────────────┤
│ 1. Submit requisition               │
│ 2. Wait for all signatures          │
│ 3. Get email ✓                      │
│ 4. See bell badge 🔔                │
│ 5. Click to view details            │
│ 6. Coordinate with finance 💰       │
└─────────────────────────────────────┘
```

**Remember:** Notifications are automatic - no manual action needed!
