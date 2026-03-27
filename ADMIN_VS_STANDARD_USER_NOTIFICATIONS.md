# Admin vs Standard User Notifications - Comparison Guide

## Side-by-Side Comparison

### Notification Sources

| Aspect | Admin Users | Standard Users |
|--------|-------------|----------------|
| **What They See** | All pending requisitions awaiting action + Their approved requisitions | Only their own approved requisitions |
| **API Endpoint** | `GET /api/requisitions/unsigned` | `GET /api/requisitions/finalized?email=user@example.com` |
| **Notification Count Based On** | Unsigned/unprocessed requisitions (any user's) | Finalized requisitions (only theirs) |
| **Email Notifications** | When their own requisitions are approved | When their own requisitions are approved |

---

## Visual Examples

### Admin User View

**Nav Bar Badge:**
```
┌──────────────────────┐
│ 🔔 5                 │ ← 3 pending action + 2 approved
└──────────────────────┘
```

**Notification Panel:**
```
╔═══════════════════════════════════╗
║ Requisition Notifications    [X] ║
╠═══════════════════════════════════╣
║ ⏰ Pending Your Action            ║
╟───────────────────────────────────╢
║ #125 | Medical Supplies           ║
║ Pending Review | Mar 8, 2026      ║
╟───────────────────────────────────╢
║ #126 | Office Equipment           ║
║ Pending Approval | Mar 7, 2026    ║
╟───────────────────────────────────╢
║ #127 | Training Materials         ║
║ Pending Authorization | Mar 6     ║
╠═══════════════════════════════════╣
║ ✓ Approved Requisitions           ║
╟───────────────────────────────────╢
║ #123 | Computer Parts             ║
║ ✓ Approved | 3,500.00 Birr       ║
╟───────────────────────────────────╢
║ #124 | Furniture                   ║
║ ✓ Approved | 5,200.00 Birr       ║
╚═══════════════════════════════════╝
```

### Standard User View

**Nav Bar Badge:**
```
┌──────────────────────┐
│ 🔔 2                 │ ← 2 approved requisitions
└──────────────────────┘
```

**Notification Panel:**
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
║ #124 | Teaching Materials         ║
║ Admin Dept.                       ║
║ ✓ Approved | 2,300.00 Birr       ║
╚═══════════════════════════════════╝
```

---

## Code Differences

### Admin Implementation (Admin.js)

```javascript
// State
const [newRequisitionCount, setNewRequisitionCount] = useState(0);

// Polling function
const checkForUnsignedRequisitions = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/requisitions/unsigned');
        const result = await response.json();
        
        if (result.success && result.requisitions) {
            const unsignedReqs = result.requisitions.length;
            setNewRequisitionCount(unsignedReqs);
        }
    } catch (error) {
        console.error('Error checking for unsigned requisitions:', error);
    }
};

// Poll every 30 seconds
useEffect(() => {
    const isAdmin = currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1';
    if (!isAdmin) return;

    checkForUnsignedRequisitions();
    const interval = setInterval(checkForUnsignedRequisitions, 30000);
    
    return () => clearInterval(interval);
}, [currentUser]);
```

### Standard User Implementation (StandardUser.js)

```javascript
// State
const [newRequisitionCount, setNewRequisitionCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);

// Polling function
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

// Poll every 30 seconds
useEffect(() => {
    if (!user?.email) return;

    checkForFinalizedRequisitions();
    const interval = setInterval(checkForFinalizedRequisitions, 30000);
    
    return () => clearInterval(interval);
}, [user?.email]);
```

---

## Email Notifications

### Both Admin and Standard Users Receive Same Email When Their Requisition is Approved:

**Email Template:**
```
Subject: ✓ Your Requisition Has Been Approved - #123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Your Requisition Has Been Approved!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello John Doe,

Great news! Your requisition has been fully approved 
and all required signatures have been obtained.

                    ┌──────────────┐
                    │   APPROVED   │
                    └──────────────┘

Requisition ID: #123
Department: Program
Purpose: Office supplies for Q2
Total Amount: 1,500.00 Birr

The finance team has been notified and will proceed 
with payment processing.

[View Your Requisition]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification from SOKAPP.
Congratulations on your approved requisition!
```

---

## Backend Logic Flow

### For Admin Users
```
Admin logs in → Start polling /api/requisitions/unsigned
    ↓
Fetch all requisitions missing signatures
    ↓
Count = Total pending requisitions (from any user)
    ↓
Update badge count
    ↓
Display in two sections:
    - Pending Your Action (all users' requisitions)
    - Approved Requisitions (admin's own)
```

### For Standard Users
```
Standard user logs in → Start polling /api/requisitions/finalized?email=X
    ↓
Fetch only finalized requisitions for this email
    ↓
Count = Total approved requisitions (only this user's)
    ↓
Update badge count
    ↓
Display in one section:
    - Approved Requisitions (this user's only)
```

---

## Database Queries

### Admin Query
```sql
SELECT id, requestor_name, department, purpose, request_date, status, 
       signature_data, reviewed_signature, approved_signature, authorized_signature,
       created_at 
FROM requisitions 
WHERE signature_data IS NULL 
   OR reviewed_signature IS NULL 
   OR approved_signature IS NULL 
   OR authorized_signature IS NULL
ORDER BY created_at DESC
```

### Standard User Query
```sql
SELECT id, requestor_name, requestor_email, department, purpose, request_date, 
       status, grand_total, created_at 
FROM requisitions 
WHERE status = 'finalized' 
  AND requestor_email = ?
ORDER BY created_at DESC
```

---

## Permission Matrix

| Action | Admin | Standard User |
|--------|-------|---------------|
| **See all pending requisitions** | ✓ Yes | ✗ No |
| **See own approved requisitions** | ✓ Yes | ✓ Yes |
| **Get email on approval** | ✓ If they're requester | ✓ If they're requester |
| **Navigate to any requisition** | ✓ Yes | ✗ Only their own |
| **Sign requisitions** | ✓ Yes (all stages) | ✗ No (unless assigned role) |

---

## Notification Panel Sections

### Admin Panel Structure
```
┌─────────────────────────────────┐
│ PENDING YOUR ACTION             │
│ (Can have 0-N items)            │
├─────────────────────────────────┤
│ • Shows requisitions awaiting   │
│   reviewer/approver/authorizer  │
│   signatures                    │
│ • From ANY user                 │
│ • Color-coded by stage          │
├─────────────────────────────────┤
│ APPROVED REQUISITIONS           │
│ (Can have 0-N items)            │
├─────────────────────────────────┤
│ • Shows admin's own finalized   │
│   requisitions                  │
│ • Green gradient background     │
│ • Shows amount                  │
└─────────────────────────────────┘
```

### Standard User Panel Structure
```
┌─────────────────────────────────┐
│ APPROVED REQUISITIONS           │
│ (Can have 0-N items)            │
├─────────────────────────────────┤
│ • Shows user's own finalized    │
│   requisitions only             │
│ • Green gradient background     │
│ • Shows amount                  │
│ • No "Pending" section          │
└─────────────────────────────────┘
```

---

## Use Case Scenarios

### Scenario 1: New Requisition Submitted

**Admin:**
- Sees nothing (no signatures needed yet)
- Notification count unchanged

**Standard User (Requester):**
- Sees nothing (not approved yet)
- Notification count unchanged

### Scenario 2: Requisition Needs Review

**Admin (as Reviewer):**
- Sees requisition in "Pending Your Action" section
- Gets email notification
- Can click to review and sign

**Standard User:**
- Sees nothing (still waiting)
- No notification yet

### Scenario 3: Requisition Fully Approved

**Admin:**
- If admin was requester: Sees in "Approved Requisitions" section
- If someone else was requester: No change (unless admin has pending actions)

**Standard User (Requester):**
- ✓ Email notification received
- ✓ Nav bar badge appears
- ✓ Sees in "Approved Requisitions" section
- ✓ Can view details and coordinate with finance

### Scenario 4: Multiple Approvals

**Admin:**
- Badge shows total of: pending actions + own approvals
- Panel shows both sections populated

**Standard User:**
- Badge shows count of own approvals only
- Panel shows only "Approved" section

---

## Testing Checklist

### Admin Testing
- [ ] Submit requisition as admin
- [ ] Have another admin sign as reviewer
- [ ] Check notification appears
- [ ] Verify "Pending Your Action" section shows other users' requisitions
- [ ] Verify "Approved Requisitions" shows own requisitions
- [ ] Click notification navigates correctly
- [ ] Email received when own requisition approved

### Standard User Testing
- [ ] Submit requisition as standard user
- [ ] Wait for all signatures
- [ ] Check email received
- [ ] Verify nav bar badge appears
- [ ] Check "Approved Requisitions" section shows
- [ ] Click notification shows requisition details
- [ ] Verify can't see other users' requisitions

---

## Common Questions

**Q: Why does admin see more notifications?**  
A: Admin needs to see all pending actions across the organization, plus their own approvals.

**Q: Can standard users see pending requisitions?**  
A: No, they only see their own finalized (approved) requisitions.

**Q: Do both get emails?**  
A: Yes, both admin and standard users get emails when THEIR requisition is approved.

**Q: What if admin submits requisition?**  
A: They'll see it in "Approved Requisitions" section once finalized, just like standard users.

**Q: Can standard users have "Pending Your Action"?**  
A: Only if they have special roles (reviewer/approver/authorizer). Regular staff see only approvals.

---

## Summary Table

| Feature | Admin | Standard User |
|---------|-------|---------------|
| **Badge Count Source** | Unsigned + Own finalized | Own finalized only |
| **Panel Sections** | 2 (Pending + Approved) | 1 (Approved only) |
| **Email on Approval** | Yes (if requester) | Yes (if requester) |
| **Can View Others'** | Yes | No |
| **Can Sign** | Yes (all stages) | No (unless role assigned) |
| **API Used** | `/api/requisitions/unsigned` | `/api/requisitions/finalized?email=` |
| **Polling Interval** | 30 seconds | 30 seconds |

---

**Created:** March 8, 2026  
**Purpose:** Clarify differences between admin and standard user notification experiences  
**Status:** Complete ✅
