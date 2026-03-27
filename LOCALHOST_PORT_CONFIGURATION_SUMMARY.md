# Localhost Port Configuration Summary

## Overview
This document provides a complete reference of all files using localhost:3000 (frontend) and localhost:5000 (backend) in the SOKAPP project.

---

## Port Assignment

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend (React)** | 3000 | http://localhost:3000 | User interface |
| **Backend API** | 5000 | http://localhost:5000 | API endpoints |

---

## Configuration Files

### 1. Root `.env` File
**Location:** `./.env`
```env
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
PORT=5000
```

### 2. Backend `.env` File
**Location:** `./Backend/.env`
```env
REACT_APP_API_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
PORT=5000
```

### 3. Frontend `package.json`
**Location:** `./package.json`
```json
{
  "proxy": "http://localhost:5000"
}
```

### 4. API Configuration
**Location:** `./src/config/api.js`
```javascript
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'development' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:5000'),
  // ... endpoints
};
```

---

## Frontend Files Using localhost:5000

### Child Profile Components
1. **`./src/components/childProfile/ChildForm.js`** (Line 245)
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

2. **`./src/components/childProfile/EducationTab.js`** (Line 55)
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

3. **`./src/components/childProfile/MedicalTab.js`** (Line 58)
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

4. **`./src/components/childProfile/LegalTab.js`** (Lines 66, 190)
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${doc.document_file}`} ...>
   ```

### Employee Management
5. **`./src/components/Dashboard.js`** (Line 16)
   ```javascript
   let url = 'http://localhost:5000/api/employees';
   ```

6. **`./src/components/EmployeeForm/EmployeeManagement.js`** (Line 349)
   ```javascript
   const response = await fetch(`http://localhost:5000/api/employees/${employee.id}`, {...});
   ```

7. **`./src/components/EmployeeForm/EmployeeForm.js`** (Lines 111, 143, 163)
   ```javascript
   const response = await fetch(`http://localhost:5000/api/employees/${employeeId}/documents`);
   const downloadUrl = `http://localhost:5000${document.filePath}`;
   const response = await fetch(`http://localhost:5000/api/employees/documents/${docToRemove.id}`, {...});
   ```

### Inventory Management
8. **`./src/components/inventory.js`** (Lines 62, 80, 93, 117, 142, 165)
   ```javascript
   let url = 'http://localhost:5000/api/inventory';
   const response = await fetch('http://localhost:5000/api/inventory/stats/summary');
   const response = await fetch('http://localhost:5000/api/inventory', {...});
   const response = await fetch(`http://localhost:5000/api/inventory/${editingItem.id}`, {...});
   const response = await fetch(`http://localhost:5000/api/inventory/${id}`, {...});
   const response = await fetch(`http://localhost:5000/api/inventory/${item.id}/adjust`, {...});
   ```

---

## Backend Files Using localhost:3000

### Email Notification Links
**Location:** `./Backend/server.js`

All email links now use environment variable `FRONTEND_URL` with fallback to `http://localhost:3000`:

#### Invitation Emails
- **Line 1647** - User invitation link
  ```javascript
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const invitationLink = `${frontendUrl}/accept-invitation?email=${encodeURIComponent(email)}&token=${plainToken}`;
  ```

#### Password Reset Emails
- **Line 1849** - Password reset link
  ```javascript
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${plainToken}&email=${encodeURIComponent(email)}`;
  ```

#### Requisition Emails
All requisition email templates now use `frontendUrl` variable:

1. **Reviewer Notification** (Lines 645, 665-666)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${uniqueIdentifier}">Review Requisition</a>
   ```

2. **Approver Notification** (Lines 973, 994-995)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${requisitionId}">Approve Requisition</a>
   ```

3. **Authorizer Notification** (Lines 1045, 1065-1066)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${requisitionId}">Authorize Requisition</a>
   ```

4. **Requester Authorization Notice** (Lines 1112, 1133-1134)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${requisitionId}">View Your Requisition</a>
   ```

5. **Finance Payment Processing** (Lines 1175, 1199-1200)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${requisitionId}">View Requisition Details</a>
   ```

6. **Rejection Notification** (Lines 1305, 1332-1333)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${requisitionId}">View Requisition Details</a>
   ```

7. **General Requisition Notification** (Lines 2912, 2932-2933)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   <a href="${frontendUrl}/requisitions/${requisition.unique_identifier}">View Requisition</a>
   ```

---

## Best Practices

### ✅ Recommended Approach
1. **Use Environment Variables**: Always use `process.env.REACT_APP_API_URL` or `process.env.FRONTEND_URL` instead of hardcoded values
2. **Provide Fallbacks**: Use `|| 'http://localhost:XXXX'` as fallback for development
3. **Proxy Configuration**: The `proxy` in `package.json` allows using relative URLs in development

### ❌ Avoid
- Hardcoding `http://localhost:3000` or `http://localhost:5000` directly in code
- Using absolute URLs when relative URLs work (in development with proxy)
- Mixing different port configurations across files

---

## How to Change Ports

### To Change Frontend Port (Currently 3000)
1. Update `.env` file:
   ```env
   FRONTEND_URL=http://localhost:NEW_PORT
   ```
2. Update any hardcoded references in documentation
3. Restart the React development server

### To Change Backend Port (Currently 5000)
1. Update both `.env` files:
   ```env
   PORT=NEW_PORT
   REACT_APP_API_URL=http://localhost:NEW_PORT
   API_BASE_URL=http://localhost:NEW_PORT
   ALLOWED_ORIGINS=http://localhost:NEW_PORT,...
   ```
2. Update `package.json` proxy:
   ```json
   "proxy": "http://localhost:NEW_PORT"
   ```
3. Update all frontend files using hardcoded localhost:5000 (see list above)
4. Restart the backend server

---

## Testing the Configuration

### Start Backend Server
```bash
cd Backend
npm start
# Backend runs on http://localhost:5000
```

### Start Frontend Server
```bash
npm start
# Frontend runs on http://localhost:3000
# API requests are proxied to http://localhost:5000
```

### Verify Configuration
1. Open browser: `http://localhost:3000`
2. Check browser console for API calls going to correct port
3. Test email notifications to verify links use correct frontend URL

---

## Deployment Notes

When deploying to production:
1. Replace `localhost:3000` with your actual frontend domain (e.g., `https://app.sokapp.online`)
2. Replace `localhost:5000` with your actual backend domain (or use same origin)
3. Update all environment variables accordingly
4. Remove proxy configuration from `package.json` in production build

---

## Document Last Updated
**Date:** March 11, 2026  
**Status:** All hardcoded localhost:3000 references in backend server.js have been replaced with environment variable `FRONTEND_URL`
