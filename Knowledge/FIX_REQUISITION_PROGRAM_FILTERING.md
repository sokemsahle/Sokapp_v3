# ✅ FIX: Requisition List Program Filtering

## 🎯 THE PROBLEM

The requisition list was **NOT filtering based on the program selected in the navigation bar**. When users selected different programs in the top nav, the requisition list didn't respond to those changes.

### Root Cause:
- The `RequisitionList` component already accepted `selectedProgram` prop and had filtering logic
- BUT the layout components (`AdminLayout` and `StandardUserLayout`) weren't passing the `selectedProgram` prop to RequisitionList

---

## ✅ THE SOLUTION

Added `selectedProgram` prop to all RequisitionList instances in both Admin and Standard User layouts.

### Changes Made:

#### 1. **AdminLayout.js** (2 changes)

**Line ~276:** Requisitions overview route
```javascript
<Route path="/requisitions" element={
  <RequisitionList 
    onCreateNew={() => navigate('/admin/requisitions/create')} 
    onEditRequisition={(reqId) => { 
      console.log('Edit requisition:', reqId); 
      navigate(`/admin/requisitions/${reqId}/edit`); 
    }} 
    currentUser={currentUser} 
    selectedProgram={selectedProgram}  // ← ADDED
  />
} />
```

**Line ~283:** Requisitions list route
```javascript
<Route path="/requisitions/list" element={
  <RequisitionList 
    onCreateNew={() => navigate('/admin/requisitions/create')} 
    onEditRequisition={(reqId) => { 
      console.log('Edit requisition:', reqId); 
      navigate(`/admin/requisitions/${reqId}/edit`); 
    }} 
    currentUser={currentUser} 
    selectedProgram={selectedProgram}  // ← ADDED
  />
} />
```

---

#### 2. **StandardUserLayout.js** (2 changes)

**Line ~485:** My Requisitions route
```javascript
<Route path="/my-requisitions" element={
  <FormAccessWrapper formName="Requisition Form">
    <RequisitionList 
      onCreateNew={() => navigate('/user/my-requisitions/create')} 
      onEditRequisition={(reqId) => navigate(`/user/my-requisitions/${reqId}`)} 
      userOnly={true} 
      currentUser={user} 
      selectedProgram={selectedProgram}  // ← ADDED
    />
  </FormAccessWrapper>
} />
```

**Line ~498:** My Requisitions list route
```javascript
<Route path="/my-requisitions/list" element={
  <FormAccessWrapper formName="Requisition Form">
    <RequisitionList 
      onCreateNew={() => navigate('/user/my-requisitions/create')} 
      onEditRequisition={(reqId) => navigate(`/user/my-requisitions/${reqId}`)} 
      userOnly={true} 
      currentUser={user} 
      selectedProgram={selectedProgram}  // ← ADDED
    />
  </FormAccessWrapper>
} />
```

---

## 🎯 HOW IT WORKS NOW

### Complete Flow:

```
User selects "Main Program" in top nav
    ↓
Nav calls onProgramChange("5")
    ↓
Layout updates selectedProgram state to 5
    ↓
RequisitionList re-renders (useEffect triggered by selectedProgram)
    ↓
fetchRequisitions() called with program filter
    ↓
API: GET /api/requisitions?program_id=5
    ↓
Backend returns only requisitions in Program 5
    ↓
RequisitionList displays filtered results
```

### "All Programs" Behavior:

```
User selects "All Programs" in top nav
    ↓
Nav converts "none" → null
    ↓
Layout sets selectedProgram to null
    ↓
RequisitionList receives selectedProgram=null
    ↓
NO program filter applied to API call
    ↓
Backend returns ALL requisitions (including NULL program_id)
    ↓
RequisitionList shows all requisitions
```

---

## 📊 WHAT'S DISPLAYED

### When "All Programs" Selected:
- ✅ Shows ALL requisitions from all programs
- ✅ Includes requisitions with `program_id = NULL`
- ✅ Includes requisitions with any program assignment

### When Specific Program Selected (e.g., "Youth Program"):
- ✅ Shows ONLY requisitions in that program
- ✅ Excludes requisitions with `program_id = NULL`
- ✅ Excludes requisitions in other programs

---

## 🔧 EXISTING INFRASTRUCTURE (Already Working)

The following components were already set up correctly:

### Backend:
- ✅ `Backend/routes/requisitions.routes.js` - Accepts `program_id` query parameter
- ✅ Backend models filter by `program_id` when provided

### RequisitionList Component:
- ✅ Already accepts `selectedProgram` prop (line 6)
- ✅ Already has useEffect dependency on `selectedProgram` (line 33)
- ✅ Already has filtering logic (lines 65-68):
  ```javascript
  if (selectedProgram) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}program_id=${selectedProgram}`;
  }
  ```
- ✅ Already loads programs for display (line 11)

### Nav Component:
- ✅ Already has program dropdown with "All Programs" option
- ✅ Already converts "none" value to `null`
- ✅ Already calls `onProgramChange` callback when program changes

---

## 🧪 TEST NOW

### Test Steps:

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd Backend
   node server.js
   
   # Terminal 2 - Frontend
   npm start
   ```

2. **Login as Admin or Standard User**

3. **Test "All Programs":**
   - Select "All Programs" in top nav
   - Click "Requisition" or "My Requisitions" in sidebar
   - ✅ Should show ALL requisitions (including those without program)

4. **Test Specific Program:**
   - Select a specific program (e.g., "Youth Program")
   - Navigate to requisitions
   - ✅ Should show ONLY requisitions in that program
   - ✅ Should update in real-time when program changes

5. **Test Export:**
   - With program filter active, click "Export CSV"
   - ✅ Should export only filtered requisitions

---

## 📋 FILES MODIFIED

| File | Changes |
|------|---------|
| `src/layouts/AdminLayout.js` | Added `selectedProgram` prop to 2 RequisitionList instances |
| `src/layouts/StandardUserLayout.js` | Added `selectedProgram` prop to 2 RequisitionList instances |

**Total:** 2 files, 4 changes (2 per layout)

---

## ✅ SUCCESS CHECKLIST

After testing, verify:

- [ ] Program dropdown appears in top navigation
- [ ] "All Programs" option is selected by default
- [ ] Changing program triggers requisition list refresh
- [ ] Specific program shows only requisitions in that program
- [ ] "All Programs" shows all requisitions including NULL program_id
- [ ] Works for both Admin and Standard User views
- [ ] Works for both "Requisition" and "My Requisitions" sections
- [ ] No console errors
- [ ] Export respects current program filter

---

## 🎯 BENEFITS

### User Experience:
- ✅ Quick program-based filtering without leaving page
- ✅ Real-time updates when program selection changes
- ✅ Consistent behavior across admin and standard views
- ✅ Consistent behavior with other modules (Children, Employees, Inventory)

### Technical:
- ✅ Reuses existing program filtering infrastructure
- ✅ Minimal code changes (only 4 lines total)
- ✅ Follows established pattern used by other components
- ✅ No breaking changes to existing functionality

---

## 🔍 TROUBLESHOOTING

### Issue: Requisition list doesn't update when program changes

**Check:**
1. Is `selectedProgram` state being updated? Add console.log in layout
2. Is `RequisitionList` receiving the prop? Check DEBUG log (line 16-22)
3. Is API being called with correct filters? Check Network tab
4. Are there requisitions with the selected program_id in database?

**Debug:**
```javascript
// In RequisitionList.jsx, line 30-33
useEffect(() => {
  loadPrograms();
  fetchRequisitions();
}, [selectedProgram]);  // ← Verify this dependency is present

// In fetchRequisitions(), line 64-68
console.log('Fetching requisitions with program filter:', selectedProgram);
```

---

### Issue: Shows 0 requisitions when program is selected

**Possible causes:**
1. No requisitions assigned to that program in database
2. Program ID mismatch between frontend and backend
3. Database foreign key constraint issues

**Check:**
```sql
USE sokapptest;

-- See how many requisitions per program
SELECT program_id, COUNT(*) as requisition_count 
FROM requisitions 
GROUP BY program_id;

-- See all programs
SELECT id, name FROM programs;
```

---

### Issue: "All Programs" doesn't show requisitions with NULL program_id

**Verify backend logic:**
```javascript
// RequisitionList.jsx line 65-68
if (selectedProgram) {
  const separator = url.includes('?') ? '&' : '?';
  url += `${separator}program_id=${selectedProgram}`;
}
// When selectedProgram is null/empty, NO filter is added ✓
```

**This is correct!** When no program_id parameter, returns ALL requisitions including NULL.

---

## 📚 RELATED DOCUMENTATION

- `FIX_CHILD_PROGRAM_FILTERING.md` - Same implementation for child profiles
- `VISUAL_GUIDE_PROGRAM_FILTERING.md` - Complete visual guide
- `PROGRAM_FILTERING_IMPLEMENTATION.md` - System-wide implementation
- `REQUISITION_EMAIL_WORKFLOW.md` - Requisition system documentation

---

## ✅ COMPLETE!

**Status:** ✅ IMPLEMENTED AND READY TO TEST  
**Date:** March 16, 2026  
**Files Modified:** 2 (AdminLayout.js, StandardUserLayout.js)  
**Lines Changed:** 4 total  

The requisition list now properly filters based on the program selected in the navigation bar, and shows all requisitions (including those with null program_id) when "All Programs" is selected! 🎉

---

## 🔄 COMPLETE PROGRAM FILTERING SUMMARY

With this fix, the following modules now support program-based filtering:

1. ✅ **Dashboard** - Staff members filtered by program
2. ✅ **Employees** - Employee list filtered by program
3. ✅ **Inventory** - Inventory items filtered by program
4. ✅ **Child Profiles** - Children filtered by program
5. ✅ **Requisitions** - Requisitions filtered by program

**All major modules now have consistent program filtering across the application!** 🎊
