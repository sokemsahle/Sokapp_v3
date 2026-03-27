# 🔄 Inventory Request System - Workflow Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY REQUEST WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  STANDARD    │
│    USER      │
└──────┬───────┘
       │
       │ 1. Goes to Inventory Page
       ▼
┌─────────────────────────────────────────┐
│  Click "Request Item" Button            │
└─────────────────────────────────────────┘
       │
       │ 2. Form Opens with Dropdown
       ▼
┌─────────────────────────────────────────┐
│  SELECT ITEM FROM DROPDOWN              │
│  ┌───────────────────────────────────┐  │
│  │ • A4 Paper (500 available)        │  │
│  │ • Pens (1000 available)           │  │
│  │ • Notebooks (300 available)       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
       │
       │ 3. Fills Form:
       │    - Quantity: 10
       │    - Urgency: High
       │    - Reason: "Need for reports"
       ▼
┌─────────────────────────────────────────┐
│  Submit Request                         │
│  POST /api/inventory/request            │
└─────────────────────────────────────────┘
       │
       │ 4. Backend Validates:
       │    ✓ Item exists?
       │    ✓ Enough stock?
       │    ✓ Required fields?
       ▼
┌─────────────────────────────────────────┐
│  Save to Database                       │
│  INSERT INTO inventory_requests         │
│  Status: "pending"                      │
└─────────────────────────────────────────┘
       │
       │ 5. Trigger Email Notifications
       ▼
┌─────────────────────────────────────────┐
│  📧 EMAIL TO INVENTORY MANAGERS         │
│  Subject: 📦 New Request #123 - HIGH    │
│  Content:                               │
│    - Requestor: John Doe                │
│    - Item: A4 Paper                     │
│    - Quantity: 10 reams                 │
│    - Urgency: HIGH                      │
│    - [Link to approve/reject]           │
└─────────────────────────────────────────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│ MANAGER 1    │                  │ MANAGER 2    │
│ Receives     │                  │ Receives     │
│ Email        │                  │ Email        │
└──────┬───────┘                  └──────┬───────┘
       │                                  │
       └──────────────┬───────────────────┘
                      │
                      │ 6. Manager Logs In
                      ▼
             ┌─────────────────────────────────────────┐
             │  View Pending Requests Dashboard        │
             │  ┌───────────────────────────────────┐  │
             │  │ ID  │ Requestor │ Item  │ Action  │  │
             │  │ 123 │ John D.   │ Paper │ ✅/❌   │  │
             │  └───────────────────────────────────┘  │
             └─────────────────────────────────────────┘
                      │
                      │ 7. Manager Reviews
                      │    - Checks stock level
                      │    - Reviews reason
                      ▼
             ┌─────────────────────────────────────────┐
             │  Manager Makes Decision                 │
             │                                         │
             │    ┌──────────────┐  ┌──────────────┐   │
             │    │   APPROVE    │  │    REJECT    │   │
             │    └──────┬───────┘  └──────┬───────┘   │
             └───────────┼─────────────────┼───────────┘
                         │                 │
          ┌──────────────┘                 └──────────────┐
          │                                              │
          ▼                                              ▼
┌─────────────────────┐                    ┌─────────────────────┐
│  APPROVE REQUEST    │                    │  REJECT REQUEST     │
│  PUT /request/:id/  │                    │  PUT /request/:id/  │
│  approve            │                    │  reject             │
│                     │                    │                     │
│  Input:             │                    │  Input:             │
│  - quantity_approved│                    │  - rejection_reason │
│  - approved_by_name │                    │  - rejected_by_name │
└─────────┬───────────┘                    └─────────┬───────────┘
          │                                          │
          │ 8a. Update Database                      │ 8b. Update Database
          ▼                                          ▼
┌─────────────────────┐                    ┌─────────────────────┐
│ UPDATE status =     │                    │ UPDATE status =     │
│ 'approved'          │                    │ 'rejected'          │
│ SET approved_by,    │                    │ SET rejection_reason│
│ approval_date       │                    │ rejected_at         │
└─────────┬───────────┘                    └─────────┬───────────┘
          │                                          │
          │                                          │
          ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 DATABASE TRIGGER FIRES                     │
│                                                                 │
│  after_inventory_request_approved                               │
│  Automatically executes when status changes to 'approved'       │
│                                                                 │
│  1. REDUCE STOCK:                                               │
│     UPDATE inventory                                            │
│     SET quantity = quantity - approved_qty                      │
│     WHERE id = request.inventory_id                             │
│                                                                 │
│  2. CREATE TRANSACTION LOG:                                     │
│     INSERT INTO inventory_transactions                          │
│     - transaction_type: 'OUT'                                   │
│     - quantity_change: -10                                      │
│     - previous_quantity: 500                                    │
│     - new_quantity: 490                                         │
│     - reason: 'Request #123 - John Doe'                         │
│     - notes: 'Approved by Admin'                                │
└─────────┬───────────────────────────────────────────────────────┘
          │
          │ 9. Send Confirmation Emails
          ▼
┌─────────────────────────────────────────┐
│  📧 EMAIL TO REQUESTOR                  │
│  Subject: ✅ Request #123 Approved!      │
│  Content:                               │
│    "Your request has been approved!"    │
│    - Item: A4 Paper                     │
│    - Quantity Approved: 10 reams        │
│    - Pick up location: Storage Room A   │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  📧 EMAIL TO REQUESTOR (If Rejected)    │
│  Subject: ❌ Request #123 Rejected       │
│  Content:                               │
│    "Your request was rejected"          │
│    - Reason: Insufficient stock         │
│    - Contact manager for questions      │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  ✅ PROCESS COMPLETE                     │
│                                         │
│  ✓ Stock reduced automatically          │
│  ✓ Transaction logged                   │
│  ✓ All parties notified                 │
│  ✓ Audit trail created                  │
└─────────────────────────────────────────┘


## 📊 Data Flow Summary

```
REQUEST CREATED
    ↓
Stock Validation
    ↓
Save as PENDING
    ↓
Email Managers ←──────────────────────┐
    ↓                                  │
Manager Reviews                        │
    ↓                                  │
    ├─→ APPROVE ─→ Trigger Fires       │
    │       ├─→ Reduce Stock           │
    │       └─→ Log Transaction        │
    │                                  │
    └─→ REJECT ─→ Update Status        │
            ↓                          │
Email Requestor ───────────────────────┘
```

---

## 🔍 Database State Changes

### Before Approval:
```sql
inventory_requests:
  id: 123
  status: 'pending'
  quantity_requested: 10
  
inventory:
  id: 1
  name: 'A4 Paper'
  quantity: 500
  
inventory_transactions:
  (no entry yet)
```

### After Approval:
```sql
inventory_requests:
  id: 123
  status: 'approved'
  quantity_approved: 10
  approved_by: 1
  approved_by_name: 'Admin User'
  
inventory:
  id: 1
  name: 'A4 Paper'
  quantity: 490  ← Reduced by 10!
  
inventory_transactions:
  id: 456
  inventory_id: 1
  transaction_type: 'OUT'
  quantity_change: -10
  previous_quantity: 500
  new_quantity: 490
  reason: 'Request #123 - John Doe'
```

---

## 🎨 Frontend Component Flow

```
Inventory Component
    ├── View Mode (All users)
    │   └── Shows list of items with current stock
    │
    ├── Request Mode (Standard users)
    │   ├── Dropdown: Select item
    │   ├── Input: Quantity needed
    │   ├── Input: Reason
    │   └── Submit → API Call
    │
    └── Management Mode (inventory_manage permission)
        ├── View pending requests
        ├── Approve button
        ├── Reject button
        └── View transaction history
```

---

## 📱 Email Notification Flow

```
User Submits Request
    ↓
┌─────────────────────────────────┐
│ BREVO Email Service             │
│                                 │
│ To: All inventory managers      │
│ Subject: 📦 New Request #123    │
│ Body: Request details + urgency │
└─────────────────────────────────┘
    ↓
Managers Receive Email
    ↓
Manager Approves/Rejects
    ↓
┌─────────────────────────────────┐
│ BREVO Email Service             │
│                                 │
│ To: Requestor                   │
│ Subject: ✅ Approved or ❌      │
│ Body: Decision + details        │
└─────────────────────────────────┘
    ↓
Requestor Receives Confirmation
```

---

## 🔐 Permission Matrix

| Action | Standard User | Inventory Manager | Admin |
|--------|--------------|-------------------|-------|
| View inventory | ✅ | ✅ | ✅ |
| Request items | ✅ | ✅ | ✅ |
| Approve requests | ❌ | ✅ | ✅ |
| Reject requests | ❌ | ✅ | ✅ |
| Manage inventory | ❌ | ✅ | ✅ |
| View transactions | ❌ | ✅ | ✅ |

---

**Last Updated:** March 14, 2026
