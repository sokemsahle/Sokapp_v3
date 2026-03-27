# Enhanced Inventory Request Management System - Complete Guide

## 🎯 Overview

This system provides a complete inventory request workflow with:
- ✅ **Dropdown item selection** from available inventory
- ✅ **Email notifications** to inventory managers
- ✅ **Approval/Rejection workflow** with email confirmations
- ✅ **Automatic stock reduction** on approval (via database trigger)
- ✅ **Transaction logging** for audit trail
- ✅ **Partial approval support**

---

## 📋 Installation Steps

### Step 1: Run the Database Setup

Execute the SQL script in phpMyAdmin or via command line:

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
SETUP_INVENTORY_REQUEST_SYSTEM.bat
```

**Or manually in phpMyAdmin:**
1. Open phpMyAdmin → Select `sokapptest` database
2. Click "SQL" tab
3. Copy and paste contents from `enhanced_inventory_request_system.sql`
4. Click "Go"

### Step 2: Register the Backend Route

Add this to `Backend/server.js`:

```javascript
// Add near other route imports (around line 27)
const inventoryRoutes = require('./routes/inventory.routes');

// Add after other app.use statements (around line 45)
app.use('/api/inventory', inventoryRoutes);
```

### Step 3: Restart Backend Server

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
# Stop current server (Ctrl+C)
node server.js
```

---

## 🗄️ Database Schema

### New Table: `inventory_requests`

```sql
CREATE TABLE inventory_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id INT NOT NULL,              -- Links to inventory.id
  requestor_user_id INT,                   -- Optional user ID
  requestor_name VARCHAR(255),            -- Person requesting
  requestor_email VARCHAR(255),           -- For notifications
  requestor_department VARCHAR(100),      -- Department
  quantity_requested INT,                 -- How many requested
  quantity_approved INT,                  -- How many approved (can be partial)
  reason TEXT,                            -- Why they need it
  urgency ENUM('low','normal','high','urgent'),
  status ENUM('pending','approved','rejected','partially_approved'),
  approved_by INT,                        -- Who approved
  approved_by_name VARCHAR(255),
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  rejected_at TIMESTAMP,
  notified TINYINT,                       -- Email sent?
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Database Trigger

The trigger `after_inventory_request_approved` automatically:
1. Reduces inventory stock when request is approved
2. Creates transaction log entry
3. Records previous and new quantities

---

## 🔌 API Endpoints

### 1. **Create Request** (For Standard Users)
```http
POST /api/inventory/request
Content-Type: application/json

{
  "inventory_id": 1,
  "requestor_name": "John Doe",
  "requestor_email": "john@example.com",
  "requestor_department": "Finance",
  "quantity_requested": 10,
  "reason": "Need for monthly reports",
  "urgency": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request submitted successfully. Inventory manager will be notified.",
  "request_id": 123
}
```

**What happens:**
- ✅ Validates stock availability
- ✅ Creates request record
- ✅ Sends email to all inventory managers
- ✅ Returns request ID

---

### 2. **Get Pending Requests** (For Inventory Managers)
```http
GET /api/inventory/requests/pending
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "inventory_id": 1,
      "requestor_name": "John Doe",
      "requestor_email": "john@example.com",
      "quantity_requested": 10,
      "urgency": "high",
      "status": "pending",
      "item_name": "A4 Paper Reams",
      "current_stock": 500,
      "unit": "reams"
    }
  ],
  "count": 1
}
```

---

### 3. **Approve Request** (Inventory Managers Only)
```http
PUT /api/inventory/request/123/approve
Content-Type: application/json

{
  "approved_by": 1,
  "approved_by_name": "Admin User",
  "quantity_approved": 10  // Can be less than requested for partial approval
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request approved successfully. Stock updated automatically.",
  "status": "approved",
  "quantity_approved": 10
}
```

**What happens:**
- ✅ Updates request status
- ✅ **Database trigger fires** → reduces stock
- ✅ Creates transaction log
- ✅ Sends approval email to requestor

---

### 4. **Reject Request** (Inventory Managers Only)
```http
PUT /api/inventory/request/123/reject
Content-Type: application/json

{
  "rejected_by": 1,
  "rejected_by_name": "Admin User",
  "rejection_reason": "Insufficient stock at this time"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request rejected successfully"
}
```

**What happens:**
- ✅ Updates request status to rejected
- ✅ Sends rejection email to requestor

---

### 5. **Get My Requests** (For Users)
```http
GET /api/inventory/requests/my?email=john@example.com
```

---

### 6. **Get All Requests** (With Filters)
```http
GET /api/inventory/requests?status=approved&start_date=2026-01-01
```

---

## 🎨 Frontend Implementation Guide

### A. Request Item Form (For Standard Users)

```jsx
import React, { useState, useEffect } from 'react';

const RequestItemForm = ({ user, onClose }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [formData, setFormData] = useState({
    inventory_id: '',
    quantity_requested: 1,
    reason: '',
    urgency: 'normal'
  });

  // Fetch available inventory items
  useEffect(() => {
    fetch('http://localhost:5000/api/inventory')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setInventoryItems(result.data.filter(item => item.quantity > 0));
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requestData = {
      ...formData,
      requestor_name: user.full_name,
      requestor_email: user.email,
      requestor_department: user.department
    };

    const response = await fetch('http://localhost:5000/api/inventory/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Request submitted! You will receive an email when approved.');
      onClose();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Request Item from Inventory</h3>
      
      {/* Dropdown to select item */}
      <select 
        value={formData.inventory_id}
        onChange={(e) => setFormData({...formData, inventory_id: e.target.value})}
        required
      >
        <option value="">Select an item...</option>
        {inventoryItems.map(item => (
          <option key={item.id} value={item.id}>
            {item.name} - {item.category} (Available: {item.quantity} {item.unit})
          </option>
        ))}
      </select>

      {/* Quantity */}
      <input
        type="number"
        min="1"
        value={formData.quantity_requested}
        onChange={(e) => setFormData({...formData, quantity_requested: e.target.value})}
        placeholder="Quantity needed"
        required
      />

      {/* Urgency */}
      <select 
        value={formData.urgency}
        onChange={(e) => setFormData({...formData, urgency: e.target.value})}
      >
        <option value="low">Low</option>
        <option value="normal" selected>Normal</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      {/* Reason */}
      <textarea
        value={formData.reason}
        onChange={(e) => setFormData({...formData, reason: e.target.value})}
        placeholder="Why do you need this item?"
        rows="3"
        required
      />

      <button type="submit">Submit Request</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
};
```

---

### B. Approval Dashboard (For Inventory Managers)

```jsx
import React, { useState, useEffect } from 'react';

const InventoryRequestDashboard = ({ user }) => {
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    const response = await fetch('http://localhost:5000/api/inventory/requests/pending');
    const result = await response.json();
    
    if (result.success) {
      setPendingRequests(result.requests);
    }
  };

  const handleApprove = async (requestId, quantityToApprove) => {
    const response = await fetch(`http://localhost:5000/api/inventory/request/${requestId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approved_by: user.id,
        approved_by_name: user.full_name,
        quantity_approved: quantityToApprove
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Request approved! Stock has been automatically reduced.');
      fetchPendingRequests(); // Refresh list
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleReject = async (requestId) => {
    const rejectionReason = prompt('Enter rejection reason:');
    if (!rejectionReason) return;

    const response = await fetch(`http://localhost:5000/api/inventory/request/${requestId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rejected_by: user.id,
        rejected_by_name: user.full_name,
        rejection_reason: rejectionReason
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Request rejected');
      fetchPendingRequests(); // Refresh list
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  return (
    <div>
      <h2>Pending Inventory Requests</h2>
      
      {pendingRequests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Requested By</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Current Stock</th>
              <th>Urgency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map(req => (
              <tr key={req.id}>
                <td>#{req.id}</td>
                <td>
                  {req.requestor_name}<br/>
                  <small>{req.requestor_email}</small>
                </td>
                <td>{req.item_name}</td>
                <td>{req.quantity_requested} {req.unit}</td>
                <td>{req.current_stock} {req.unit}</td>
                <td>
                  <span style={{
                    color: req.urgency === 'urgent' ? 'red' : 
                          req.urgency === 'high' ? 'orange' : 'green'
                  }}>
                    {req.urgency.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleApprove(req.id, req.quantity_requested)}>
                    ✅ Approve
                  </button>
                  <button onClick={() => handleReject(req.id)}>
                    ❌ Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

## 📧 Email Templates

### 1. New Request Notification (Sent to Inventory Managers)

```html
Subject: 📦 New Inventory Request #123 - URGENT

<h2>New Inventory Request Submitted</h2>
<p><strong>Request ID:</strong> #123</p>
<p><strong>Requested by:</strong> John Doe</p>
<p><strong>Department:</strong> Finance</p>
<hr>
<h3>Item Details:</h3>
<p><strong>Item:</strong> A4 Paper Reams</p>
<p><strong>Quantity Requested:</strong> 10 reams</p>
<p><strong>Current Stock:</strong> 500 reams</p>
<p><strong>Urgency:</strong> <span style="color: red">URGENT</span></p>
<p><strong>Reason:</strong> Need for monthly reports</p>
<hr>
<p>Please log in to approve or reject this request.</p>
```

### 2. Approval Confirmation (Sent to Requestor)

```html
Subject: ✅ Inventory Request #123 Approved

<h2>Your Inventory Request Has Been Approved!</h2>
<p><strong>Status:</strong> APPROVED</p>
<hr>
<h3>Approved Items:</h3>
<p><strong>Item:</strong> A4 Paper Reams</p>
<p><strong>Quantity Approved:</strong> 10 reams</p>
<hr>
<p><strong>Approved by:</strong> Admin User</p>
<p>You can collect your items from the inventory location.</p>
```

---

## 🔄 Workflow Diagram

```
User Creates Request
       ↓
Stock Validation
       ↓
Request Saved to DB
       ↓
Email to Inventory Managers
       ↓
   ┌───────┴───────┐
   │               │
Approve         Reject
   ↓               ↓
Trigger Fires   Email Sent
   ↓
Stock Reduced
   ↓
Transaction Logged
   ↓
Email to Requestor
```

---

## ✅ Testing Checklist

### As Standard User:
- [ ] Can see list of available items in dropdown
- [ ] Can select item and enter quantity
- [ ] Gets error if quantity exceeds available stock
- [ ] Can submit request
- [ ] Receives approval/rejection email

### As Inventory Manager:
- [ ] Receives email when new request submitted
- [ ] Can view all pending requests
- [ ] Can approve requests (full or partial quantity)
- [ ] Can reject requests with reason
- [ ] Sees stock automatically reduce after approval
- [ ] Can view transaction log

### Database Checks:
```sql
-- Check pending requests
SELECT * FROM inventory_requests WHERE status = 'pending';

-- Check approved requests
SELECT * FROM inventory_requests WHERE status = 'approved';

-- Verify stock was reduced
SELECT id, name, quantity FROM inventory WHERE id IN (
  SELECT DISTINCT inventory_id FROM inventory_requests WHERE status = 'approved'
);

-- Check transaction log
SELECT * FROM inventory_transactions 
WHERE reason LIKE '%Request #%';
```

---

## 🛠️ Troubleshooting

### Issue: Emails not being sent
**Solution:** Check `.env` file has `BREVO_API_KEY` set correctly

### Issue: Stock not reducing
**Solution:** Verify trigger exists:
```sql
SHOW TRIGGERS LIKE 'inventory_requests';
```

### Issue: "Table doesn't exist"
**Solution:** Run the SQL setup script again

### Issue: 404 Error on API endpoints
**Solution:** Make sure route is registered in `server.js`

---

## 📊 Sample Data

The SQL script includes 10 sample inventory items:
- Office Supplies (Paper, Pens, Notebooks, etc.)
- Electronics (Ink Cartridges, USB Drives)
- Furniture (Chairs, Lamps)

---

## 🔐 Permissions Required

| Permission | What It Does |
|------------|--------------|
| `inventory_view` | Can view inventory and submit requests |
| `inventory_manage` | Can approve/reject requests, manage inventory |

---

## 📝 Files Created

1. `database/enhanced_inventory_request_system.sql` - Database setup
2. `database/SETUP_INVENTORY_REQUEST_SYSTEM.bat` - Easy setup script
3. `Backend/routes/inventory.routes.js` - API routes
4. `INVENTORY_REQUEST_SYSTEM_GUIDE.md` - This documentation

---

**Status:** ✅ Ready to Install  
**Last Updated:** March 14, 2026
