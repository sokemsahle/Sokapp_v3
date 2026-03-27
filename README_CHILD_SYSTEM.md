# 👶 Child Management System

Complete Tier 1 & Tier 2 child profile management with enterprise-grade RBAC (Role-Based Access Control).

---

## 🚀 Quick Start

**3-Minute Setup:**

```bash
# 1. Run database schema
cd database
.\setup_child_management.bat

# 2. Restart server
npm start

# 3. Test API
curl http://localhost:5000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN"
```

📖 **Full guide**: [QUICK_START_CHILD_SYSTEM.md](../QUICK_START_CHILD_SYSTEM.md)

---

## ✨ Features

### Tier 1 - Core Child Profile
- ✅ Complete demographic information
- ✅ Health and disability status
- ✅ Admission tracking
- ✅ Photo storage
- ✅ Status management (Active, Adopted, etc.)

### Tier 2 - Extended Documentation
- ✅ **Guardian Information** - Family/guardian records
- ✅ **Legal Documents** - Birth certificates, court orders
- ✅ **Medical Records** - Health history, medications
- ✅ **Education Records** - School performance, certificates
- ✅ **Case History** - Background case tracking

### Security Features
- ✅ JWT authentication
- ✅ Permission-based access control
- ✅ In-memory permission caching
- ✅ SQL injection prevention
- ✅ Foreign key constraints
- ✅ CASCADE delete relationships

---

## 📁 What's Included

```
database/
├── child_management_schema.sql      # Database schema
├── setup_child_management.bat       # Setup script
├── child_permissions_assign.sql     # Permission helpers
└── verify_installation.bat          # Installation checker

Backend/
├── middleware/
│   ├── auth.middleware.js           # JWT + permissions
│   └── permission.middleware.js     # Permission checks
├── models/
│   └── Child.js                     # Data operations
├── routes/
│   └── children.routes.js           # API endpoints
└── CHILD_MANAGEMENT_API_DOCS.md     # API documentation

Documentation/
├── QUICK_START_CHILD_SYSTEM.md      # Quick start guide
├── CHILD_IMPLEMENTATION_SUMMARY.md  # Technical summary
└── README_CHILD_SYSTEM.md           # This file
```

---

## 🗄️ Database Schema

### Tables Created

**Tier 1:**
- `children` - Core child profiles

**Tier 2:**
- `child_guardian_information`
- `child_legal_documents`
- `child_medical_records`
- `child_education_records`
- `child_case_history`

### Permissions Added

9 new permissions in the `permissions` table:
- `child_view`, `child_create`, `child_update`, `child_delete`
- `guardian_manage`, `legal_manage`, `medical_manage`
- `education_manage`, `case_manage`

---

## 🔐 API Endpoints

### Tier 1 - Child Management

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/children` | `child_view` | List all children |
| GET | `/api/children/:id` | `child_view` | Get child by ID |
| POST | `/api/children` | `child_create` | Create new child |
| PUT | `/api/children/:id` | `child_update` | Update child |
| DELETE | `/api/children/:id` | `child_delete` | Delete child |

### Tier 2 - Extended Documentation

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/children/:id/guardians` | `guardian_manage` | Get guardians |
| POST | `/api/children/:id/guardians` | `guardian_manage` | Add guardian |
| GET | `/api/children/:id/legal-documents` | `legal_manage` | Get legal docs |
| POST | `/api/children/:id/legal-documents` | `legal_manage` | Add legal doc |
| GET | `/api/children/:id/medical-records` | `medical_manage` | Get medical records |
| POST | `/api/children/:id/medical-records` | `medical_manage` | Add medical record |
| GET | `/api/children/:id/education-records` | `education_manage` | Get education records |
| POST | `/api/children/:id/education-records` | `education_manage` | Add education record |
| GET | `/api/children/:id/case-history` | `case_manage` | Get case history |
| POST | `/api/children/:id/case-history` | `case_manage` | Add case history |

**Total: 17 protected endpoints**

---

## 🔧 Installation

### Prerequisites

- Node.js 14+
- MySQL 8.0+
- Git

### Step 1: Database Setup

```bash
# Navigate to database folder
cd database

# Run the schema
mysql -u root -P 3307 sokapptest < child_management_schema.sql

# Or use the batch file (Windows)
.\setup_child_management.bat
```

### Step 2: Verify Installation

```bash
# Run verification script
cd database
.\verify_installation.bat
```

### Step 3: Install Dependencies

```bash
cd Backend
npm install
```

### Step 4: Configure Environment

Ensure `.env` file has:

```bash
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=sokapptest
JWT_SECRET=your-secret-key
```

### Step 5: Start Server

```bash
npm start
```

---

## 📖 Usage Examples

### Create New Child

```javascript
const response = await fetch('/api/children', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    dateOfBirth: '2015-05-15',
    dateOfAdmission: '2024-01-15'
  })
});

const data = await response.json();
console.log(data);
```

### Add Guardian

```javascript
await fetch('/api/children/1/guardians', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guardianName: 'Mary Doe',
    relationshipToChild: 'Aunt',
    phone: '+254700123456'
  })
});
```

### Get Medical Records

```javascript
const response = await fetch('/api/children/1/medical-records', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const records = await response.json();
console.log(records);
```

---

## 🛡️ Permission System

### How It Works

1. **User Login** → JWT token generated
2. **Request Made** → Token sent in header
3. **Auth Middleware** → Verifies token, loads user permissions
4. **Permission Middleware** → Checks if user has required permission
5. **Route Handler** → Processes request if authorized

### Assigning Permissions

```sql
-- Give HR role full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'HR' 
AND p.category = 'Children';

-- Give Teacher view + education access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Teacher' 
AND p.name IN ('child_view', 'education_manage');
```

Use helper script: `child_permissions_assign.sql`

---

## 🧪 Testing

### Using cURL

```bash
# Get all children
curl http://localhost:5000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create child
curl -X POST http://localhost:5000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Child",
    "gender": "Female",
    "dateOfBirth": "2016-01-01",
    "dateOfAdmission": "2024-01-15"
  }'

# Without token (should fail)
curl http://localhost:5000/api/children
# Response: {"success":false,"message":"Access denied. No token provided."}
```

---

## 📊 Architecture

```
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │ JWT Token
       ↓
┌─────────────────────────┐
│   Express Server        │
│   (Node.js)             │
├─────────────────────────┤
│ Auth Middleware         │ → Load Permissions
│ Permission Middleware   │ → Check Access
│ Routes                  │ → Handle Requests
└──────┬──────────────────┘
       │
       ↓
┌─────────────┐
│   MySQL     │
│  Database   │
└─────────────┘
```

---

## 🔒 Security Best Practices

✅ **Always**
- Use HTTPS in production
- Validate input on frontend and backend
- Rotate JWT secrets regularly
- Monitor failed access attempts
- Backup database daily
- Use parameterized queries

❌ **Never**
- Hardcode credentials
- Trust client-side validation alone
- Log sensitive data
- Share JWT secrets publicly
- Skip permission checks

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START_CHILD_SYSTEM.md](../QUICK_START_CHILD_SYSTEM.md) | 3-step setup guide |
| [CHILD_MANAGEMENT_API_DOCS.md](Backend/CHILD_MANAGEMENT_API_DOCS.md) | Complete API reference |
| [CHILD_IMPLEMENTATION_SUMMARY.md](../CHILD_IMPLEMENTATION_SUMMARY.md) | Technical implementation details |
| [README_CHILD_SYSTEM.md](README_CHILD_SYSTEM.md) | This overview document |

---

## 🆘 Troubleshooting

### Common Issues

**Problem**: "Table doesn't exist"  
**Solution**: Run `child_management_schema.sql`

**Problem**: "Permission denied"  
**Solution**: Assign permissions using `child_permissions_assign.sql`

**Problem**: "Invalid token"  
**Solution**: Check JWT_SECRET in .env matches what was used to generate token

**Problem**: "Cannot connect to database"  
**Solution**: Verify MySQL is running on port 3307

---

## 🎯 Next Steps

### For Developers
1. Read API documentation
2. Create React components
3. Implement file upload
4. Add search/filter functionality
5. Build reports dashboard

### For Admins
1. Assign permissions to roles
2. Train staff
3. Monitor usage
4. Review audit logs

---

## 📈 Performance Tips

- Enable query caching
- Use connection pooling
- Index frequently queried columns
- Archive old records
- Compress large responses
- Implement pagination

---

## 🤝 Contributing

When extending this system:

1. Follow existing patterns
2. Add permissions for new features
3. Update documentation
4. Write tests
5. Don't break backward compatibility

---

## 📄 License

Part of SOKAPP project - Internal use only

---

## 📞 Support

For questions or issues:
1. Check documentation files
2. Review SQL scripts
3. Examine middleware code
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-04  
**Status**: Production Ready ✅

---

## 🎉 Success Indicators

You know it's working when:
- ✅ All verification checks pass
- ✅ API returns data (not errors)
- ✅ Permissions are enforced (403 for unauthorized)
- ✅ Database tables created successfully
- ✅ Server starts without errors

**Ready to use!** 🚀
