# Program Filtering Implementation Guide

## Quick Start

### Step 1: Run Database Migration
```bash
cd database
setup_programs.bat
```

This will:
- Create the `programs` table with 4 default programs
- Add `program_id` column to: employees, requisitions, users, inventory, children tables
- Set up foreign key relationships

### Step 2: Restart Backend Server
```bash
cd Backend
npm start
```

### Step 3: Test the Implementation

1. **Login as Admin**
2. **Use the Program Selector** in the top navigation bar
3. **Test filtering** in these modules:
   - Dashboard (Staff Members section)
   - Employees
   - User Access Control
   - Requisitions (My Requisitions & All Requisitions)
   - Inventory
   - Child Profiles

---

## What's Been Implemented

### ✅ Backend (Complete)

1. **Programs API Endpoint**
   - `GET /api/programs` - Fetch all active programs
   - Returns list of programs for dropdown

2. **Employee Endpoints Updated**
   - `GET /api/employees?program_id=X` - Filter by program
   - `POST /api/employees` - Accepts program_id
   - `PUT /api/employees/:id` - Accepts program_id

3. **Frontend Service**
   - Created `src/services/programService.js`
   - Added PROGRAMS endpoint to `src/config/api.js`

4. **Navigation Component**
   - Program selector dropdown connected to real API data
   - Callback to parent component when program changes

5. **Admin Component**
   - State management for selected program
   - Passes program filter to all child components

### ⚠️ Components Needing Updates

The following components need to be updated to use the `selectedProgram` prop:

#### 1. EmployeeManagement (`src/components/EmployeeForm/EmployeeManagement.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Filter employees by program_id when fetching
- Add Program dropdown field in EmployeeForm

#### 2. UserControle (`src/components/usercontrole.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Filter users by program_id
- Add Program dropdown in user create/edit modal

#### 3. Inventory (`src/components/inventory.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Filter inventory by program_id
- Add Program dropdown in item form

#### 4. RequisitionList (`src/components/Requisition/RequisitionList.jsx`)
**Changes needed:**
- Accept `selectedProgram` prop
- Filter requisitions by program_id

#### 5. Requisition (`src/components/Requisition/Requisition.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Add Program dropdown field
- Save program_id when creating requisitions

#### 6. ChildList (`src/components/childProfile/ChildList.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Filter children by program_id
- Update childService.js to support program filtering

#### 7. ChildForm (`src/components/childProfile/ChildForm.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Add Program dropdown field
- Save program_id when creating/updating children

#### 8. Dashboard (`src/components/Dashboard.js`)
**Changes needed:**
- Accept `selectedProgram` prop
- Filter employees by program_id in staff display

---

## Example Implementation Pattern

Here's the pattern to follow for updating each component:

### List View Component (e.g., EmployeeManagement)

```javascript
// 1. Accept selectedProgram prop
const EmployeeManagement = ({ isOpen, selectedProgram }) => {
  
  // 2. Modify fetch to include program filter
  const fetchEmployees = async () => {
    try {
      let url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.EMPLOYEES);
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      // ... rest of code
    }
  };
  
  // 3. Refetch when program changes
  useEffect(() => {
    fetchEmployees();
  }, [selectedProgram]);
  
  // ... rest of component
};
```

### Form Component (e.g., EmployeeForm)

```javascript
// 1. Import program service
import { getPrograms } from '../../services/programService';

// 2. Add programs state
const [programs, setPrograms] = useState([]);
const [formData, setFormData] = useState({
  // ... existing fields
  program_id: ''  // Add program_id field
});

// 3. Load programs on mount
useEffect(() => {
  loadPrograms();
}, []);

const loadPrograms = async () => {
  const result = await getPrograms();
  if (result.success) {
    setPrograms(result.programs);
  }
};

// 4. Add Program dropdown in form JSX
<div className="form-group">
  <label>Program:</label>
  <select 
    name="program_id" 
    value={formData.program_id} 
    onChange={handleInputChange}
  >
    <option value="">Select Program</option>
    {programs.map(program => (
      <option key={program.id} value={program.id}>
        {program.name}
      </option>
    ))}
  </select>
</div>

// 5. Include program_id in submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  const dataToSend = {
    ...formData,
    program_id: formData.program_id || null
  };
  // ... send to API
};
```

---

## Database Schema

### Programs Table
```sql
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Default Programs
1. **Main Program** - Primary residential care program
2. **Youth Program** - Independent living program for older youth
3. **Emergency Program** - Short-term emergency placement
4. **Family Reunification** - Family strengthening and reunification services

---

## Testing Checklist

### Database
- [ ] Programs table exists
- [ ] Default programs inserted
- [ ] program_id columns added to all tables
- [ ] Foreign key constraints working

### Backend API
- [ ] GET /api/programs returns list
- [ ] GET /api/employees?program_id=1 filters correctly
- [ ] POST /api/employees saves program_id
- [ ] PUT /api/employees/:id updates program_id

### Frontend UI
- [ ] Program selector shows real programs
- [ ] "All Programs" option works (no filter)
- [ ] Selecting program filters employee list
- [ ] Selecting program filters user list
- [ ] Selecting program filters inventory
- [ ] Selecting program filters requisitions
- [ ] Selecting program filters children
- [ ] Can create new items with program assignment
- [ ] Can edit items and change program

### Edge Cases
- [ ] No program selected shows all records
- [ ] Deleting a program sets program_id to NULL (ON DELETE SET NULL)
- [ ] Inactive programs don't appear in dropdown
- [ ] Program filtering works with other filters (department, status, etc.)

---

## Troubleshooting

### Issue: Program selector shows empty dropdown
**Solution:** Check if programs table has data
```sql
SELECT * FROM programs WHERE is_active = TRUE;
```

### Issue: Filtering not working
**Solution:** 
1. Check browser console for errors
2. Verify backend is receiving program_id parameter
3. Check network tab for API calls

### Issue: Can't save program_id
**Solution:**
1. Verify program_id column exists in table
2. Check backend POST/PUT endpoints accept program_id
3. Verify form includes program_id in submission

---

## Next Steps

To complete the implementation, follow the example patterns above to update each component. Start with the simplest component (Dashboard or EmployeeManagement) and work your way through the list.

Each component update follows the same pattern:
1. Accept `selectedProgram` prop
2. Use it to filter API calls
3. Add Program dropdown in forms
4. Save program_id on create/update

For questions or issues, refer to this guide or check the example implementations.
