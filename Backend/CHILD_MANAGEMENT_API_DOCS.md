# Child Management System - API Documentation

## Overview

Complete Tier 1 & Tier 2 child profile management system with Role-Based Access Control (RBAC).

---

## Database Setup

### Step 1: Run SQL Schema

Execute the SQL file to create tables and permissions:

```bash
# Option 1: Use the batch file (Windows)
cd database
.\setup_child_management.bat

# Option 2: Manual execution
mysql -u root -P 3307 sokapptest < child_management_schema.sql
```

### Step 2: Assign Permissions

Permissions are automatically assigned to the `admin` role. To assign to other roles:

```sql
-- Example: Assign child_view permission to HR role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'HR' 
AND p.name = 'child_view';
```

---

## Authentication

All endpoints require JWT authentication.

**Header Format:**
```
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### TIER 1 - Core Child Management

#### 1. Get All Children
```http
GET /api/children
Authorization: Bearer <token>
Permission Required: child_view
```

**Query Parameters (Optional):**
- `status` - Filter by status (Active, Reunified, Adopted, Deceased, Transferred)
- `gender` - Filter by gender (Male, Female, Other)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "middle_name": "Michael",
      "last_name": "Doe",
      "gender": "Male",
      "date_of_birth": "2015-05-15",
      "estimated_age": 10,
      "current_status": "Active",
      "date_of_admission": "2023-01-10",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 2. Get Child by ID
```http
GET /api/children/:id
Authorization: Bearer <token>
Permission Required: child_view
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "gender": "Male",
    "date_of_birth": "2015-05-15",
    "place_of_birth": "Nairobi",
    "nationality": "Kenyan",
    "blood_group": "O+",
    "disability_status": false,
    "health_status": "Good",
    "date_of_admission": "2023-01-10",
    "admitted_by_name": "Admin User",
    "current_status": "Active",
    "profile_photo": "/uploads/child1.jpg"
  }
}
```

#### 3. Create New Child
```http
POST /api/children
Authorization: Bearer <token>
Permission Required: child_create
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "middleName": "Mary",
  "lastName": "Smith",
  "gender": "Female",
  "dateOfBirth": "2016-08-20",
  "estimatedAge": 9,
  "placeOfBirth": "Mombasa",
  "nationality": "Kenyan",
  "religion": "Christian",
  "bloodGroup": "A+",
  "disabilityStatus": false,
  "disabilityDescription": null,
  "healthStatus": "Good",
  "dateOfAdmission": "2024-01-15",
  "admittedBy": 1,
  "currentStatus": "Active",
  "profilePhoto": "/uploads/child2.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Child profile created successfully",
  "data": {
    "id": 2,
    "first_name": "Jane",
    "last_name": "Smith",
    ...
  }
}
```

#### 4. Update Child
```http
PUT /api/children/:id
Authorization: Bearer <token>
Permission Required: child_update
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Johnson",
  "healthStatus": "Requires medication",
  "currentStatus": "Active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Child profile updated successfully",
  "data": { ... }
}
```

#### 5. Delete Child
```http
DELETE /api/children/:id
Authorization: Bearer <token>
Permission Required: child_delete
```

**Response:**
```json
{
  "success": true,
  "message": "Child profile deleted successfully"
}
```

⚠️ **Note:** Deleting a child will cascade delete all Tier 2 records (guardians, legal documents, medical records, education records, case history).

---

### TIER 2 - Extended Documentation

#### GUARDIAN INFORMATION

##### Get Guardians
```http
GET /api/children/:id/guardians
Authorization: Bearer <token>
Permission Required: guardian_manage
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "child_id": 1,
      "guardian_name": "Mary Doe",
      "relationship_to_child": "Aunt",
      "phone": "+254700123456",
      "address": "123 Nairobi St",
      "alive_status": true,
      "notes": "Primary contact"
    }
  ]
}
```

##### Add Guardian
```http
POST /api/children/:id/guardians
Authorization: Bearer <token>
Permission Required: guardian_manage
Content-Type: application/json
```

**Request Body:**
```json
{
  "guardianName": "Mary Doe",
  "relationshipToChild": "Aunt",
  "phone": "+254700123456",
  "address": "123 Nairobi St",
  "aliveStatus": true,
  "notes": "Primary contact"
}
```

---

#### LEGAL DOCUMENTS

##### Get Legal Documents
```http
GET /api/children/:id/legal-documents
Authorization: Bearer <token>
Permission Required: legal_manage
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "child_id": 1,
      "document_type": "Birth Certificate",
      "document_number": "BC123456",
      "issue_date": "2015-06-01",
      "expiry_date": null,
      "document_file": "/docs/bc_123.pdf",
      "verified_status": true
    }
  ]
}
```

##### Add Legal Document
```http
POST /api/children/:id/legal-documents
Authorization: Bearer <token>
Permission Required: legal_manage
Content-Type: application/json
```

**Request Body:**
```json
{
  "documentType": "Birth Certificate",
  "documentNumber": "BC123456",
  "issueDate": "2015-06-01",
  "expiryDate": null,
  "documentFile": "/docs/bc_123.pdf",
  "verifiedStatus": true
}
```

---

#### MEDICAL RECORDS

##### Get Medical Records
```http
GET /api/children/:id/medical-records
Authorization: Bearer <token>
Permission Required: medical_manage
```

##### Add Medical Record
```http
POST /api/children/:id/medical-records
Authorization: Bearer <token>
Permission Required: medical_manage
Content-Type: application/json
```

**Request Body:**
```json
{
  "medicalCondition": "Asthma",
  "vaccinationStatus": "Up to date",
  "lastCheckup": "2024-01-10",
  "allergies": "Penicillin",
  "medications": "Albuterol inhaler",
  "doctorName": "Dr. Smith",
  "hospitalName": "Nairobi Hospital",
  "medicalReportFile": "/reports/medical_123.pdf"
}
```

---

#### EDUCATION RECORDS

##### Get Education Records
```http
GET /api/children/:id/education-records
Authorization: Bearer <token>
Permission Required: education_manage
```

##### Add Education Record
```http
POST /api/children/:id/education-records
Authorization: Bearer <token>
Permission Required: education_manage
Content-Type: application/json
```

**Request Body:**
```json
{
  "schoolName": "Nairobi Primary School",
  "gradeLevel": "Grade 5",
  "enrollmentDate": "2023-09-01",
  "performanceNotes": "Excellent in mathematics",
  "certificateFile": "/certs/grade5.pdf"
}
```

---

#### CASE HISTORY

##### Get Case History
```http
GET /api/children/:id/case-history
Authorization: Bearer <token>
Permission Required: case_manage
```

##### Add Case History
```http
POST /api/children/:id/case-history
Authorization: Bearer <token>
Permission Required: case_manage
Content-Type: application/json
```

**Request Body:**
```json
{
  "caseType": "Orphaned",
  "description": "Both parents deceased in accident",
  "reportedBy": "Social Services",
  "reportDate": "2023-01-05",
  "caseStatus": "Closed"
}
```

---

## Permission System

### Available Permissions

| Permission | Description | Category |
|------------|-------------|----------|
| `child_view` | View child profiles | Children |
| `child_create` | Create new child profile | Children |
| `child_update` | Update child profile | Children |
| `child_delete` | Delete child profile | Children |
| `guardian_manage` | Manage guardian information | Children |
| `legal_manage` | Manage legal documents | Children |
| `medical_manage` | Manage medical records | Children |
| `education_manage` | Manage education records | Children |
| `case_manage` | Manage case history | Children |

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Child not found"
}
```

---

## Security Features

✅ JWT-based authentication  
✅ Permission-based access control  
✅ In-memory permission caching (5 min TTL)  
✅ Foreign key constraints with CASCADE delete  
✅ Input validation  
✅ SQL injection prevention (parameterized queries)  
✅ CORS enabled  

---

## File Structure

```
Backend/
├── middleware/
│   ├── auth.middleware.js       # JWT verification & permission loading
│   └── permission.middleware.js # Permission check middleware
├── models/
│   └── Child.js                 # Child model & database operations
├── routes/
│   └── children.routes.js       # All child-related routes
└── server.js                    # Main server file (updated)

database/
├── child_management_schema.sql  # SQL schema for child system
└── setup_child_management.bat   # Windows setup script
```

---

## Testing with cURL

### Example: Create Child
```bash
curl -X POST http://localhost:5000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Child",
    "gender": "Male",
    "dateOfBirth": "2015-01-01",
    "dateOfAdmission": "2024-01-15"
  }'
```

### Example: Get Children
```bash
curl -X GET http://localhost:5000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices

1. **Always validate data on frontend before sending**
2. **Handle errors gracefully**
3. **Store JWT tokens securely (localStorage or httpOnly cookies)**
4. **Refresh tokens before expiration**
5. **Use HTTPS in production**
6. **Implement file upload for document storage**
7. **Add audit logging for sensitive operations**
8. **Regular database backups**

---

## Support

For issues or questions, check the database schema and ensure:
- MySQL is running on port 3307
- Database 'sokapptest' exists
- Permissions are properly assigned
- JWT_SECRET is configured in environment variables
