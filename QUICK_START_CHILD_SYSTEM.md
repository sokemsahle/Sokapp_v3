# 🚀 Quick Start Guide - Child Management System

## ⚡ 3-Step Setup

### Step 1: Database Setup (2 minutes)

```bash
# Navigate to database folder
cd database

# Run the SQL schema
# Option A: Use the batch file (easiest)
.\setup_child_management.bat

# Option B: Manual MySQL command
mysql -u root -P 3307 sokapptest < child_management_schema.sql
```

✅ This creates:
- `children` table (Tier 1)
- `child_guardian_information` table
- `child_legal_documents` table
- `child_medical_records` table
- `child_education_records` table
- `child_case_history` table (Tier 2)
- 9 new permissions in `permissions` table
- Auto-assigns all permissions to `admin` role

---

### Step 2: Restart Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Then restart
npm start
```

✅ Server will automatically load new routes and middleware

---

### Step 3: Test API (1 minute)

```bash
# Test endpoint (replace TOKEN with your JWT)
curl http://localhost:5000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

---

## ✅ You're Done!

The system is now ready to use.

---

## 📋 What Was Added?

### Backend Files Created:
```
Backend/
├── middleware/
│   ├── auth.middleware.js       # JWT + Permission loader
│   └── permission.middleware.js # Permission checker
├── models/
│   └── Child.js                 # Database operations
├── routes/
│   └── children.routes.js       # All API endpoints
└── CHILD_MANAGEMENT_API_DOCS.md # Full documentation

database/
├── child_management_schema.sql  # Database schema
└── setup_child_management.bat   # Setup script
```

### Database Changes:
- ✅ 6 new tables created
- ✅ 9 new permissions added
- ✅ Foreign keys configured
- ✅ Indexes for performance
- ✅ CASCADE delete relationships

---

## 🎯 Next Steps

### For Developers:
1. Read full API documentation: `Backend/CHILD_MANAGEMENT_API_DOCS.md`
2. Integrate with React frontend
3. Create UI components for child management

### For Admins:
1. Assign permissions to roles:
```sql
-- Example: Give HR role access to view children
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'HR' AND p.name = 'child_view';
```

2. Test different permission levels

---

## 🔧 Troubleshooting

### Error: "Cannot find module './routes/children.routes'"
**Solution:** Make sure you're in the Backend directory and all files were created

### Error: "Table 'children' doesn't exist"
**Solution:** Run the SQL schema again:
```bash
mysql -u root -P 3307 sokapptest < child_management_schema.sql
```

### Error: "You do not have permission"
**Solution:** Your user needs permissions assigned:
```sql
-- Check your user's role
SELECT u.email, r.name as role_name 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.email = 'your@email.com';

-- Assign permissions to your role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'YourRole' AND p.category = 'Children';
```

### Error: "Access denied. No token provided"
**Solution:** Include JWT token in Authorization header:
```
Authorization: Bearer your-jwt-token
```

---

## 📊 System Architecture

```
Frontend (React)
    ↓
JWT Token → Backend (Express)
    ↓
Auth Middleware → Load Permissions
    ↓
Permission Middleware → Check Access
    ↓
Child Routes → Handle Request
    ↓
Child Model → Database Operations
    ↓
MySQL Database (sokapptest)
```

---

## 🔐 Security Checklist

- ✅ JWT authentication required
- ✅ Permission-based access control
- ✅ SQL injection prevention
- ✅ CASCADE delete for data integrity
- ✅ Input validation
- ✅ CORS enabled
- ✅ In-memory permission caching

---

## 📞 Need Help?

Check these files:
- **API Docs:** `Backend/CHILD_MANAGEMENT_API_DOCS.md`
- **Schema:** `database/child_management_schema.sql`
- **Middleware:** `Backend/middleware/auth.middleware.js`

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ SQL runs without errors
- ✅ Server starts successfully
- ✅ API returns `{"success": true, "count": 0, "data": []}`
- ✅ Permission errors show 403 status code
- ✅ New tables appear in database

---

**Estimated Total Setup Time: 3-5 minutes** ⏱️
