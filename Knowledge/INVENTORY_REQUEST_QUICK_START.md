# 📦 Inventory Request System - Quick Start Guide

## What You Get

A complete inventory management system where:
- **Standard users** can request items from a dropdown list
- **Inventory managers** receive email notifications and can approve/reject
- **Stock automatically reduces** when requests are approved
- **Transaction logs** are created automatically
- **Email confirmations** sent to everyone

---

## ⚡ 3-Minute Setup

### Step 1: Run SQL in phpMyAdmin (2 minutes)

1. Open phpMyAdmin → Select `sokapptest` database
2. Click "SQL" tab
3. Open file: `database/enhanced_inventory_request_system.sql`
4. Copy all content → Paste → Click "Go"

✅ Done! Table created, trigger installed, sample data added

### Step 2: Register Backend Route (1 minute)

Open `Backend/server.js` and add:

```javascript
// Line ~27 (after other requires)
const inventoryRoutes = require('./routes/inventory.routes');

// Line ~45 (after other app.use)
app.use('/api/inventory', inventoryRoutes);
```

### Step 3: Restart Backend

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\Backend"
# Press Ctrl+C to stop current server
node server.js
```

---

## 🎯 How It Works

### For Standard Users (Request Items):

1. Go to Inventory → Click "Request Item"
2. **Select item from dropdown** (shows available stock)
3. Enter quantity needed
4. Add reason (why you need it)
5. Submit → **Manager gets email notification**
6. Wait for approval email

### For Inventory Managers (Approve/Reject):

1. Receive email: "New Inventory Request #123"
2. Go to Inventory → "Pending Requests" tab
3. See all pending requests with urgency levels
4. Click **Approve** or **Reject**
5. **Stock automatically reduces** (database trigger)
6. Requestor gets email confirmation

---

## 📋 API Endpoints Cheat Sheet

| Action | Method | Endpoint |
|--------|--------|----------|
| Create request | POST | `/api/inventory/request` |
| View pending requests | GET | `/api/inventory/requests/pending` |
| Approve request | PUT | `/api/inventory/request/:id/approve` |
| Reject request | PUT | `/api/inventory/request/:id/reject` |
| View my requests | GET | `/api/inventory/requests/my?email=user@example.com` |

---

## 🧪 Test It Now

### Test as Standard User:

```bash
curl -X POST http://localhost:5000/api/inventory/request \
  -H "Content-Type: application/json" \
  -d '{
    "inventory_id": 1,
    "requestor_name": "Test User",
    "requestor_email": "test@example.com",
    "requestor_department": "Finance",
    "quantity_requested": 5,
    "reason": "Testing the system",
    "urgency": "normal"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Request submitted successfully...",
  "request_id": 1
}
```

### Test as Manager (Approve):

```bash
curl -X PUT http://localhost:5000/api/inventory/request/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approved_by": 1,
    "approved_by_name": "Admin User",
    "quantity_approved": 5
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Request approved successfully...",
  "status": "approved"
}
```

### Verify Stock Reduced:

```sql
SELECT name, quantity FROM inventory WHERE id = 1;
-- Should show reduced quantity
```

### Check Transaction Log:

```sql
SELECT * FROM inventory_transactions 
WHERE inventory_id = 1 
ORDER BY created_at DESC LIMIT 1;
-- Should show OUT transaction
```

---

## 📁 Files Created

```
📦 Inventory Request System
├── 📄 enhanced_inventory_request_system.sql      ← Database setup
├── 📄 SETUP_INVENTORY_REQUEST_SYSTEM.bat        ← Easy setup script
├── 📄 inventory_request_queries.sql             ← Useful SQL queries
├── 📄 INVENTORY_REQUEST_SYSTEM_GUIDE.md         ← Full documentation
├── 📄 INVENTORY_REQUEST_QUICK_START.md          ← This file
└── Backend/
    └── routes/
        └── inventory.routes.js                  ← API endpoints
```

---

## 🔍 Quick Database Checks

### See all pending requests:
```sql
SELECT * FROM inventory_requests WHERE status = 'pending';
```

### See all approved requests:
```sql
SELECT * FROM inventory_requests WHERE status = 'approved';
```

### Check if trigger exists:
```sql
SHOW TRIGGERS LIKE 'inventory_requests';
```

### View transaction history:
```sql
SELECT * FROM inventory_transactions ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

**Problem:** "Table doesn't exist"  
**Fix:** Run the SQL setup script again

**Problem:** "404 Error /api/inventory/request"  
**Fix:** Make sure you added the route to `server.js`

**Problem:** Emails not sending  
**Fix:** Check `.env` has `BREVO_API_KEY=your_key_here`

**Problem:** Stock not reducing  
**Fix:** Verify trigger: `SHOW TRIGGERS LIKE 'inventory_requests';`

---

## 📊 Sample Data Included

The SQL creates 10 test items:
- A4 Paper (500 reams)
- Ballpoint Pens Blue (1000 pcs)
- Ballpoint Pens Red (800 pcs)
- Notebooks (300 pcs)
- Printer Ink Cartridges (50 pcs)
- USB Flash Drives (100 pcs)
- Desk Lamps (75 pcs)
- Office Chairs (30 pcs)
- Whiteboard Markers (400 pcs)
- Staplers (150 pcs)

---

## ✅ Success Checklist

After setup, verify:
- [ ] `inventory_requests` table exists
- [ ] Trigger `after_inventory_request_approved` exists
- [ ] Can call POST `/api/inventory/request`
- [ ] Can view pending requests
- [ ] Can approve/reject requests
- [ ] Stock reduces on approval
- [ ] Transaction log created
- [ ] Emails sent (if BREVO configured)

---

## 🎨 Frontend Integration

To add the request form to your inventory component:

```jsx
// In your inventory.js component
const [showRequestForm, setShowRequestForm] = useState(false);
const [inventoryItems, setInventoryItems] = useState([]);

// Fetch items for dropdown
useEffect(() => {
  fetch('http://localhost:5000/api/inventory')
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        setInventoryItems(result.data.filter(item => item.quantity > 0));
      }
    });
}, []);

// Render request form
{showRequestForm && (
  <div className="request-form-modal">
    <h3>Request Item</h3>
    <select value={formData.inventory_id} onChange={e => 
      setFormData({...formData, inventory_id: e.target.value})
    }>
      <option value="">Select item...</option>
      {inventoryItems.map(item => (
        <option key={item.id} value={item.id}>
          {item.name} - {item.quantity} {item.unit} available
        </option>
      ))}
    </select>
    {/* Add other fields */}
  </div>
)}
```

---

## 📞 Need Help?

Check the full documentation: `INVENTORY_REQUEST_SYSTEM_GUIDE.md`

Or run diagnostic queries: `database/inventory_request_queries.sql`

---

**Status:** ✅ Ready to Use  
**Setup Time:** 3 minutes  
**Last Updated:** March 14, 2026
