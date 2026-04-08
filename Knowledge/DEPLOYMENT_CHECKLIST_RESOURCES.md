# Deployment Checklist - Resource Management System

## Pre-Deployment

### ✅ Code Review Complete
- [x] All files created without syntax errors
- [x] Backend routes follow existing patterns
- [x] Frontend components match app styling
- [x] Database schema includes proper constraints
- [x] Foreign key relationships defined correctly

### ✅ Documentation Created
- [x] Implementation summary document
- [x] Quick start guide for users
- [x] This deployment checklist

---

## Deployment Steps

### Step 1: Database Setup (REQUIRED)

**Action:** Run the database setup script

```bash
cd "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database"
setup_resource_management.bat
```

**Expected Output:**
```
============================================
RESOURCE MANAGEMENT SETUP COMPLETED!
============================================

Tables created:
- rooms
- beds

Children table updated with:
- room_id column
- bed_id column

Permissions added for resource management
```

**Verification:**
```sql
USE sokapptest;

-- Check rooms table exists
SHOW TABLES LIKE 'rooms';

-- Check beds table exists
SHOW TABLES LIKE 'beds';

-- Check children table has new columns
DESCRIBE children;

-- Verify permissions added
SELECT * FROM permissions WHERE category = 'Resources';
```

**Troubleshooting:**
- If error "Table exists": Script already ran, safe to skip
- If error "Foreign key constraint fails": Check parent tables exist
- If error "Access denied": Verify MySQL credentials in .bat file

---

### Step 2: Backend Server Restart

**Action:** Restart the backend server to load new routes

**If using batch file:**
```bash
start-unified-server.bat
```

**If using npm:**
```bash
cd Backend
npm start
```

**Expected Output:**
```
Server running on http://localhost:5000
```

**Verification:**
Test API endpoints are accessible:
```bash
# Test rooms endpoint
curl http://localhost:5000/api/rooms

# Test beds endpoint
curl http://localhost:5000/api/beds
```

Should return JSON with `success: true`

---

### Step 3: Frontend Build (If Production)

**Action:** Rebuild React app

```bash
npm run build
```

**Expected Output:**
```
Creating an optimized production build...
Compiled successfully.
```

**Note:** For development, this step is not needed - hot reload will handle it

---

### Step 4: Frontend Refresh

**Action:** Clear cache and refresh browser

**Steps:**
1. Open browser DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**OR:**
- Press `Ctrl + Shift + Delete`
- Check "Cached images and files"
- Click "Clear data"
- Refresh page (F5)

---

## Post-Deployment Verification

### Functional Testing Checklist

#### Organization → Resources Page
- [ ] Navigate to Organization section in sidebar
- [ ] Click "Resources" menu item (appears under "Shamida News")
- [ ] Verify page loads without errors
- [ ] Switch between "Dormitory Rooms" and "Beds" tabs
- [ ] Verify tab switching works smoothly

#### Room Management
- [ ] Create a new room
  - Room Name: "Test Room 101"
  - Capacity: 4
- [ ] Verify success message appears
- [ ] Verify room appears in room list
- [ ] Verify room shows bed count (0 initially)
- [ ] Edit the room (change capacity)
- [ ] Verify changes save successfully
- [ ] Attempt to delete room (should succeed if no beds)

#### Bed Management
- [ ] Select a room from dropdown
- [ ] Create a new bed
  - Bed Number: "Bed A-1"
  - Status: Available
- [ ] Verify bed appears in list with green badge
- [ ] Create another bed with status "Occupied"
- [ ] Verify bed appears with red badge
- [ ] Edit a bed (change status)
- [ ] Verify changes reflect immediately
- [ ] Try to delete occupied bed (should fail with error message)
- [ ] Delete available bed (should succeed)

#### Child Profile Integration
- [ ] Go to Child Profiles
- [ ] Create new child or edit existing
- [ ] Navigate to Step 3 (Admission Information)
- [ ] Verify "Assign Dormitory Room" dropdown exists
- [ ] Verify dropdown shows rooms with available bed count
- [ ] Select a room
- [ ] Verify "Assign Bed" dropdown becomes active
- [ ] Verify bed dropdown shows only available beds
- [ ] Select a bed
- [ ] Save child profile
- [ ] Verify success message

#### Bed Assignment Logic
- [ ] After assigning bed to child, check bed list
- [ ] Verify assigned bed now shows as "occupied" (red)
- [ ] Verify bed no longer appears in available beds dropdown
- [ ] Edit child and change bed selection
- [ ] Verify old bed becomes "available" (green)
- [ ] Verify new bed becomes "occupied" (red)
- [ ] Remove bed assignment from child
- [ ] Verify bed becomes "available" again

#### Data Persistence
- [ ] Refresh browser page
- [ ] Verify all data still loads correctly
- [ ] Navigate away and back to Resources
- [ ] Verify rooms and beds still appear

---

### API Endpoint Testing

Use Postman or curl to test:

```bash
# 1. Get all rooms
curl http://localhost:5000/api/rooms
# Expected: { success: true, count: N, data: [...] }

# 2. Get room by ID with beds
curl http://localhost:5000/api/rooms/1
# Expected: { success: true, data: { id: 1, room_name: "...", beds: [...] } }

# 3. Get available beds only
curl http://localhost:5000/api/beds/available
# Expected: { success: true, count: N, data: [...] }

# 4. Get beds by room
curl http://localhost:5000/api/beds/room/1
# Expected: { success: true, count: N, data: [...] }

# 5. Create room
curl -X POST http://localhost:5000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"organization_id":1,"room_name":"Test Room","capacity":5}'
# Expected: { success: true, message: "...", data: {...} }

# 6. Create bed
curl -X POST http://localhost:5000/api/beds \
  -H "Content-Type: application/json" \
  -d '{"room_id":1,"bed_number":"Test-1","status":"available"}'
# Expected: { success: true, message: "...", data: {...} }
```

---

## Performance Checks

### Load Time
- [ ] Resources page loads in < 2 seconds
- [ ] Room/bed lists render in < 1 second
- [ ] Form submissions complete in < 2 seconds

### Database Queries
Run these to verify indexes are working:

```sql
-- Should use index on room_id
EXPLAIN SELECT * FROM beds WHERE room_id = 1;

-- Should use index on status
EXPLAIN SELECT * FROM beds WHERE status = 'available';

-- Should use foreign key index
EXPLAIN SELECT * FROM children WHERE room_id IS NOT NULL;
```

Look for "type: ref" or "type: range" (good), not "type: ALL" (bad)

---

## Security Verification

### Access Control
- [ ] Standard users can view resources (read-only)
- [ ] Admin users can create/edit/delete rooms and beds
- [ ] Unauthenticated users cannot access APIs

### Data Integrity
- [ ] Cannot create bed without valid room_id
- [ ] Cannot assign non-existent room to child
- [ ] Cannot delete room with occupied beds
- [ ] Cannot delete occupied bed
- [ ] Foreign key constraints prevent orphaned records

### Input Validation
- [ ] Room name required (cannot be empty)
- [ ] Capacity must be positive number
- [ ] Bed number required
- [ ] Status must be 'available' or 'occupied'

---

## Rollback Plan (If Issues Found)

### Immediate Rollback
If critical issues found within 24 hours:

1. **Database Rollback:**
```sql
USE sokapptest;

-- Remove new columns from children table
ALTER TABLE children 
  DROP FOREIGN KEY fk_children_room,
  DROP FOREIGN KEY fk_children_bed,
  DROP INDEX idx_room,
  DROP INDEX idx_bed,
  DROP COLUMN room_id,
  DROP COLUMN bed_id;

-- Drop new tables
DROP TABLE IF EXISTS beds;
DROP TABLE IF EXISTS rooms;

-- Remove permissions
DELETE FROM permissions WHERE category = 'Resources';
```

2. **Code Rollback:**
   - Revert git commit
   - Deploy previous version

3. **Frontend Rollback:**
   - Restore previous build
   - Clear CDN/cache

### Partial Rollback
If only specific features have issues:

- Disable bed assignment in child form (comment out fields)
- Keep room/bed management functional
- Fix issues incrementally

---

## Success Criteria

Deployment is considered successful when:

✅ Database tables created without errors
✅ Backend serves new API routes
✅ Frontend displays Resources page
✅ Users can create rooms and beds
✅ Bed assignment works in child profiles
✅ Automatic status updates function correctly
✅ No console errors in browser
✅ No server errors in logs
✅ All verification tests pass

---

## Monitoring (First Week)

### Daily Checks
- [ ] Check backend logs for errors
- [ ] Monitor database query performance
- [ ] Review user feedback
- [ ] Check for any data inconsistencies

### Weekly Reports
Generate these SQL reports:

```sql
-- Room occupancy rate
SELECT 
  COUNT(*) as total_rooms,
  SUM(bed_count) as total_beds,
  SUM(available_beds) as vacant_beds,
  ROUND((SUM(bed_count) - SUM(available_beds)) / SUM(bed_count) * 100, 2) as occupancy_rate
FROM (
  SELECT r.id, COUNT(b.id) as bed_count,
         SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_beds
  FROM rooms r
  LEFT JOIN beds b ON r.id = b.room_id
  GROUP BY r.id
) as room_stats;

-- Children with bed assignments
SELECT 
  COUNT(*) as total_children,
  COUNT(room_id) as children_with_room,
  COUNT(bed_id) as children_with_bed
FROM children;
```

---

## Support Contacts

If issues encountered:

1. **Technical Issues:** Check implementation summary document
2. **Database Issues:** Review SQL schema files
3. **Frontend Issues:** Check browser console (F12)
4. **Backend Issues:** Review server logs

---

## Sign-Off

- [ ] Database administrator reviewed
- [ ] Lead developer approved
- [ ] QA testing completed
- [ ] User documentation distributed
- [ ] Stakeholder demo completed
- [ ] Go-live approval received

**Deployment Date:** _______________
**Deployed By:** _______________
**Approved By:** _______________

---

**Status:** Ready for Deployment ✅
