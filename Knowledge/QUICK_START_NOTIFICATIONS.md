# Quick Start Guide: Requisition Approval Notifications

## What's New? 🎉

When your requisition gets fully approved, you now get:
- ✉️ **Email notification** sent to your inbox
- 🔔 **Nav bar notification** showing in the app
- 💰 **Finance team notified** automatically for payment processing

## For Requestors (Staff/Employees)

### Step 1: Submit Your Requisition
1. Go to Requisition → Create New
2. Fill in all details
3. Add items and amounts
4. Sign and submit

### Step 2: Wait for Approvals
Your requisition goes through:
```
Requestor → Reviewer → Approver → Authorizer → FINALIZED ✓
```

### Step 3: Receive Notification
When fully approved, you'll see:

**In your email:**
```
Subject: ✓ Your Requisition Has Been Approved - #123

Great news! Your requisition has been fully approved...
Requisition ID: #123
Total Amount: 1,500.00 Birr
Status: APPROVED ✓
```

**In the app (top right bell icon):**
```
🔔 1

Click to see:
┌─────────────────────────────────┐
│ ✓ Approved Requisitions         │
├─────────────────────────────────┤
│ #123 | Office Supplies          │
│ Program Dept.                   │
│ ✓ Approved | 1,500.00 Birr     │
└─────────────────────────────────┘
```

### Step 4: Finance Processes Payment
- Finance team receives automatic notification
- They contact you for payment coordination
- You can track status in Requisition List

## For Finance Team

### When Requisition is Finalized

**You receive email:**
```
Subject: 🏦 Payment Processing Required - Requisition #123 Approved

ACTION REQUIRED
Requestor: John Doe (user@example.com)
Department: Program
Amount: 1,500.00 Birr
Status: FULLY APPROVED

[View Requisition Details]
```

### Your Action Items:
1. ✓ Check email notification
2. ✓ Click link to view requisition
3. ✓ Verify all signatures are complete
4. ✓ Contact requestor for payment details
5. ✓ Process payment
6. ✓ Update requisition status if needed

## For Approvers (Reviewers/Authorizers)

### Notification Flow
You still get notifications when it's your turn to sign. The system handles notifying everyone else automatically.

### Your Role:
1. Receive email/notification
2. Review requisition
3. Add your signature
4. System takes care of rest

## Visual Examples

### Nav Bar Notification Badge
```
┌─────────────────────┐
│  🔔 2               │ ← Shows count of pending items
└─────────────────────┘
```

### Notification Panel Layout
```
╔═══════════════════════════════════╗
║ Requisition Notifications    [X] ║
╠═══════════════════════════════════╣
║ ⏰ Pending Your Action            ║
╟───────────────────────────────────╢
║ #124 | Meeting Supplies           ║
║ Pending Review | Mar 8, 2026      ║
╚═══════════════════════════════════╝

╔═══════════════════════════════════╗
║ ✓ Approved Requisitions           ║
╟───────────────────────────────────╢
║ #123 | Office Equipment           ║
║ ✓ Approved | 2,500.00 Birr        ║
╚═══════════════════════════════════╝
```

## Email Configuration

Make sure your email is correct in the system:
1. Go to Settings
2. Check your profile
3. Verify email address is correct
4. Update if needed

## Common Questions

**Q: I didn't get an email. What should I do?**
A: 
1. Check spam/junk folder
2. Verify your email in Settings is correct
3. Ask admin to resend notification
4. Check if requisition is actually finalized (all signatures complete)

**Q: Finance hasn't contacted me. What now?**
A:
1. Wait 24 hours after approval
2. Send polite reminder email to finance
3. Include requisition ID in subject
4. Copy your supervisor if urgent

**Q: Can I see all my approved requisitions?**
A: Yes! Go to Requisition → My Requisitions → Filter by "Approved" status

**Q: How do I know finance received the notification?**
A: Finance emails are logged in backend console. Ask admin to verify if needed.

## Troubleshooting

### No Notification Showing
- Refresh the page (F5)
- Log out and log back in
- Clear browser cache
- Check with IT if problem persists

### Email Not Received
- Check spam folder
- Verify email address in Settings
- Check email server logs (admin)
- Resend from backend (admin only)

### Wrong Amount or Details
- Contact admin to correct data
- Create new requisition if needed
- Keep old one as reference

## Tips for Smooth Processing

✅ **Fill all fields completely** - Incomplete forms delay approval
✅ **Use clear descriptions** - Helps approvers understand request
✅ **Attach quotes if available** - Speeds up approval process
✅ **Follow up politely** - Don't wait too long to check status
✅ **Keep records** - Save confirmation emails for reference

## Contact Support

For technical issues:
- Email: support@sokapp.com
- Include: Your name, requisition ID, issue description
- Attach: Screenshot if helpful

---

**Quick Reference Card**

```
┌─────────────────────────────────────┐
│ REQUISITION NOTIFICATION FLOW       │
├─────────────────────────────────────┤
│ 1. Submit → Wait for signatures     │
│ 2. Get email when approved ✓        │
│ 3. See notification in nav bar 🔔   │
│ 4. Finance contacts you 💰          │
│ 5. Coordinate payment delivery      │
└─────────────────────────────────────┘
```

**Need Help?** Check the full documentation in `REQUISITION_FINALIZATION_NOTIFICATIONS.md`

---

Last Updated: March 8, 2026
