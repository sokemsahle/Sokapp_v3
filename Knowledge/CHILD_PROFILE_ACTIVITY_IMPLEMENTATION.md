# 🚀 Child Profile Activity Logging - Quick Implementation Guide

## Current Status

✅ **Import Added:** The activity logger is already imported in `Backend/routes/children.routes.js`

```javascript
const { logUserActivity } = require('../utils/activityLogger');
```

---

## Endpoints to Update

Based on the children.routes.js file structure, here are the key endpoints that need activity logging:

### 1. POST /api/children - Create Child Profile

**Location:** Around line ~200 in children.routes.js

**Add this after successful child creation:**

```javascript
// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'create',
        module: 'Child Profile Management',
        actionDescription: `Created child profile: ${childData.full_name || 'New Child'}`,
        tableName: 'children',
        recordId: result.insertId,
        newValues: childData,
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log child creation activity:', logError);
}
```

---

### 2. PUT /api/children/:id - Update Child Profile

**Location:** Around line ~300 in children.routes.js

**Add this after successful update:**

```javascript
// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'update',
        module: 'Child Profile Management',
        actionDescription: `Updated child profile: ${childData.full_name || 'Child'}`,
        tableName: 'children',
        recordId: parseInt(id),
        oldValues: existingChild,
        newValues: updatedChild,
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log child update activity:', logError);
}
```

---

### 3. DELETE /api/children/:id - Delete Child Profile

**Location:** Around line ~400 in children.routes.js

**Add this before or after deletion:**

```javascript
// Get child data before deletion
const [childToDelete] = await connection.execute(
    'SELECT * FROM children WHERE id = ?',
    [id]
);

// ... delete operation ...

// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'delete',
        module: 'Child Profile Management',
        actionDescription: `Deleted child profile: ${childToDelete[0]?.full_name || 'Child'}`,
        tableName: 'children',
        recordId: parseInt(id),
        oldValues: childToDelete[0],
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log child deletion activity:', logError);
}
```

---

### 4. POST /api/children/:id/guardians - Add Guardian

**Location:** Around line ~450 in children.routes.js

**Add this after adding guardian:**

```javascript
// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'create',
        module: 'Child Profile Management',
        actionDescription: `Added guardian to child profile`,
        tableName: 'guardians',
        recordId: result.insertId,
        newValues: guardianData,
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log guardian addition activity:', logError);
}
```

---

### 5. POST /api/children/:id/medical - Add Medical Record

**Location:** Around line ~550 in children.routes.js

**Add this after adding medical record:**

```javascript
// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'create',
        module: 'Child Profile Management',
        actionDescription: `Added medical record to child profile`,
        tableName: 'medical_records',
        recordId: result.insertId,
        newValues: medicalData,
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log medical record addition activity:', logError);
}
```

---

### 6. POST /api/children/:id/education - Add Education Record

**Location:** Around line ~650 in children.routes.js

**Add this after adding education record:**

```javascript
// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'create',
        module: 'Child Profile Management',
        actionDescription: `Added education record to child profile`,
        tableName: 'education_records',
        recordId: result.insertId,
        newValues: educationData,
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log education record addition activity:', logError);
}
```

---

### 7. POST /api/children/:id/legal - Add Legal Document

**Location:** Around line ~750 in children.routes.js

**Add this after adding legal document:**

```javascript
// Log activity
try {
    const { userId, userEmail, userName, roleId, roleName } = req.body;
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'create',
        module: 'Child Profile Management',
        actionDescription: `Added legal document to child profile`,
        tableName: 'legal_documents',
        recordId: result.insertId,
        newValues: legalData,
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log legal document addition activity:', logError);
}
```

---

## Implementation Steps

### Step 1: Find CREATE Endpoint
1. Open `Backend/routes/children.routes.js`
2. Search for `router.post('/', async` or similar create endpoint
3. Extract user info from request body
4. Add activity logging after successful creation

### Step 2: Find UPDATE Endpoint  
1. Search for `router.put('/:id', async` 
2. Extract user info and get existing child data
3. Add activity logging with old/new values after update

### Step 3: Find DELETE Endpoint
1. Search for `router.delete('/:id', async`
2. Get child data before deletion
3. Add activity logging after deletion

### Step 4: Find Record Addition Endpoints
1. Search for guardian, medical, education, legal endpoints
2. Add activity logging after each record creation

### Step 5: Test
1. Restart backend server
2. Create/update/delete a child profile
3. Check database:
   ```sql
   SELECT * FROM user_activity_log 
   WHERE module = 'Child Profile Management'
   ORDER BY activity_timestamp DESC;
   ```

---

## Pattern Summary

All implementations follow this pattern:

```javascript
// 1. Extract user info
const { userId, userEmail, userName, roleId, roleName } = req.body;

// 2. Perform database operation
const [result] = await connection.execute(query, values);

// 3. Log activity (wrapped in try-catch)
try {
    await logUserActivity({
        userId,
        userEmail,
        userName,
        roleId,
        roleName,
        activityType: 'create', // or 'update', 'delete'
        module: 'Child Profile Management',
        actionDescription: 'Description of what happened',
        tableName: 'affected_table',
        recordId: result.insertId or parseInt(id),
        oldValues: oldData,      // For updates/deletes
        newValues: newData,      // For creates/updates
        status: 'success'
    });
} catch (logError) {
    console.error('Failed to log activity:', logError);
    // Don't throw - continue normally
}
```

---

## Testing Checklist

- [ ] Create child profile → Check activity log
- [ ] Update child profile → Check activity log
- [ ] Delete child profile → Check activity log
- [ ] Add guardian → Check activity log
- [ ] Add medical record → Check activity log
- [ ] Add education record → Check activity log
- [ ] Add legal document → Check activity log

---

## Example Database Query

After implementing, verify with:

```sql
-- Check all child profile activities
SELECT 
    id,
    user_name,
    activity_type,
    action_description,
    table_name,
    activity_timestamp
FROM user_activity_log 
WHERE module = 'Child Profile Management'
ORDER BY activity_timestamp DESC;

-- Check specific child's history
SELECT * FROM user_activity_log 
WHERE table_name = 'children' 
AND record_id = 123
ORDER BY activity_timestamp DESC;
```

---

**Estimated Time:** 30-45 minutes  
**Difficulty:** Easy (follow established patterns)  
**Status:** Ready to implement ✅
