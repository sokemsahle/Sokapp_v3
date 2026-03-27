# Medical Records Enhancement - Home & Ongoing Health Notes

## Overview
This update enhances the Medical Records form with two distinct note types:
1. **Home Health Care Note** - For tracking vital signs and health metrics at home
2. **Ongoing Health Note** - For medical visits, diagnoses, and specialist care

---

## 📋 Database Changes

### Step 1: Run SQL Script in phpMyAdmin

1. **Login to phpMyAdmin**
2. **Select your database** (e.g., `sokapptest`)
3. **Click on "SQL" tab**
4. **Copy and paste** the contents of `database/UPDATE_MEDICAL_RECORDS_SCHEMA.sql`
5. **Click "Go"** to execute

### What the SQL Does:

#### Adds New Columns:

**Note Type Selection:**
- `note_type` - ENUM('home_health_care', 'ongoing_health')

**Home Health Care Note Fields:**
- `age_years` - Decimal (e.g., 8.5 years)
- `height_cm` - Decimal (height in centimeters)
- `weight_kg` - Decimal (weight in kilograms)
- `head_circumference_cm` - Decimal (head circumference)
- `weight_for_age_percentile` - VARCHAR (e.g., "75th")
- `weight_for_height_percentile` - VARCHAR (e.g., "60th")
- `height_for_age_percentile` - VARCHAR (e.g., "80th")
- `temperature_celsius` - Decimal (body temperature)
- `respiration_rate` - INT (breaths per minute)
- `pulse_rate` - INT (heart rate per minute)
- `spo2_percentage` - INT (oxygen saturation %)
- `other_vitals` - TEXT (additional observations)
- `present_illness` - TEXT (illness description)
- `treatment_plan` - TEXT (treatment instructions)

**Ongoing Health Note Fields:**
- `performer_first_name` - VARCHAR (performer's first name)
- `performer_middle_name` - VARCHAR (performer's middle name)
- `performer_last_name` - VARCHAR (performer's last name)
- `medical_center_name` - VARCHAR (hospital/clinic name)
- `doctor_name` - VARCHAR (doctor's name)
- `doctor_specialty` - VARCHAR (specialty area)
- `diagnosis` - TEXT (medical diagnosis)
- `visit_reason` - VARCHAR (reason for visit)
- `visit_details` - TEXT (visit notes)
- `next_appointment_date` - DATE (follow-up date)

**Modifications:**
- Makes `medical_report_file` optional (was required)
- Adds index on `note_type` for faster filtering

---

## 💻 Frontend Changes

### Updated Component: `src/components/childProfile/MedicalTab.js`

#### New Features:

1. **Note Type Toggle**
   - Radio buttons to switch between "Home Health Care Note" and "Ongoing Health Note"
   - Dynamic form rendering based on selection
   - Hides/shows relevant fields

2. **Home Health Care Note Form**
   - Growth metrics (age, height, weight, head circumference)
   - Growth percentiles (weight for age, weight for height, height for age)
   - Vital signs (temperature, respiration, pulse, SpO2)
   - Present illness documentation
   - Treatment plan

3. **Ongoing Health Note Form**
   - Performer information (first, middle, last name)
   - Medical center details
   - Doctor information and specialty
   - Diagnosis and visit details
   - Follow-up appointment scheduling

4. **Common Features**
   - File upload for medical reports (optional)
   - Form validation
   - Auto-reset after submission
   - Loading states

---

## 🎯 How to Use

### For Home Health Care Notes:

1. **Navigate to Child Profile** → Medical Records tab
2. **Click "Add Record"**
3. **Select "Home Health Care Note"** radio button
4. **Fill in the following fields:**
   - Age (years) - e.g., 8.5
   - Height (cm) - e.g., 125.5
   - Weight (kg) - e.g., 30.2
   - Head Circumference (cm) - e.g., 52.0
   - Temperature (°C) - e.g., 37.5
   - Respiration Rate (/min) - e.g., 20
   - Pulse Rate (/min) - e.g., 80
   - SpO2 (%) - e.g., 98
   - Growth percentiles (optional)
   - Present Illness (textarea)
   - Treatment Plan (textarea)
5. **Upload Medical Report** (optional)
6. **Click "Add Record"**

### For Ongoing Health Notes:

1. **Navigate to Child Profile** → Medical Records tab
2. **Click "Add Record"**
3. **Select "Ongoing Health Note"** radio button
4. **Fill in the following fields:**
   - Performer's First Name
   - Performer's Middle Name
   - Performer's Last Name
   - Name of Medical Center
   - Doctor's Name
   - Doctor's Specialty
   - Diagnosis
   - Visit Reason
   - Next Appointment Date
   - Visit Details (textarea)
5. **Upload Medical Report** (optional)
6. **Click "Add Record"**

---

## 🔧 Technical Implementation Details

### Form State Management:

```javascript
const [noteType, setNoteType] = useState('ongoing_health');

const handleNoteTypeChange = (type) => {
  setNoteType(type);
};
```

### Conditional Rendering:

```javascript
{noteType === 'home_health_care' && (
  {/* Home Health Care fields */}
)}

{noteType === 'ongoing_health' && (
  {/* Ongoing Health Note fields */}
)}
```

### Data Mapping:

The form data is mapped to database columns in the submit handler:

```javascript
const recordData = {
  note_type: noteType,
  // ... common fields
  // Home Health Care fields
  age_years: formData.ageYears || null,
  height_cm: formData.heightCm || null,
  // ... etc
  
  // Ongoing Health fields
  performer_first_name: formData.performerFirstName || null,
  medical_center_name: formData.medicalCenterName || null,
  // ... etc
};
```

---

## 🧪 Testing Checklist

### Database:
- [ ] SQL script executes without errors in phpMyAdmin
- [ ] All new columns are added to `child_medical_records` table
- [ ] Column data types are correct
- [ ] Index on `note_type` is created

### Frontend - Home Health Care Note:
- [ ] Radio button toggle works correctly
- [ ] All Home Health Care fields display when selected
- [ ] Fields hide when switching to Ongoing Health Note
- [ ] Numeric inputs accept decimal values where appropriate
- [ ] Percentiles accept text input (e.g., "75th")
- [ ] SpO2 has min/max validation (0-100)
- [ ] Textareas work for Present Illness and Treatment Plan
- [ ] File upload is optional
- [ ] Form submission saves all fields correctly

### Frontend - Ongoing Health Note:
- [ ] All Ongoing Health fields display when selected
- [ ] Fields hide when switching to Home Health Care Note
- [ ] Name fields accept text input
- [ ] Date picker works for Next Appointment Date
- [ ] Textarea works for Visit Details
- [ ] File upload is optional
- [ ] Form submission saves all fields correctly

### General:
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Success message shows after submission
- [ ] Form resets after successful submission
- [ ] File upload works (PDF, DOC, DOCX, JPEG, PNG)
- [ ] Records display correctly in the list view
- [ ] Existing records still display properly

---

## 📊 Sample Data Queries

### View all Home Health Care Notes:
```sql
SELECT * FROM child_medical_records 
WHERE note_type = 'home_health_care'
ORDER BY created_at DESC;
```

### View all Ongoing Health Notes:
```sql
SELECT * FROM child_medical_records 
WHERE note_type = 'ongoing_health'
ORDER BY created_at DESC;
```

### Get recent vital signs for a specific child:
```sql
SELECT 
  child_id,
  age_years,
  height_cm,
  weight_kg,
  temperature_celsius,
  pulse_rate,
  respiration_rate,
  spo2_percentage,
  created_at
FROM child_medical_records
WHERE child_id = 1 
  AND note_type = 'home_health_care'
ORDER BY created_at DESC
LIMIT 10;
```

### Track upcoming appointments:
```sql
SELECT 
  c.first_name,
  c.last_name,
  m.next_appointment_date,
  m.medical_center_name,
  m.doctor_name
FROM child_medical_records m
JOIN children c ON m.child_id = c.id
WHERE m.note_type = 'ongoing_health'
  AND m.next_appointment_date >= CURDATE()
ORDER BY m.next_appointment_date ASC;
```

---

## 🚨 Troubleshooting

### Issue: SQL Error "Duplicate column name"
**Solution:** The columns already exist. This means the update was already applied. Skip the SQL step.

### Issue: Form doesn't show new fields
**Solution:** 
1. Clear browser cache
2. Restart frontend development server
3. Check browser console for errors

### Issue: Can't save Home Health Care fields
**Solution:**
1. Verify SQL script was executed successfully
2. Check that all new columns exist in the database
3. Check backend logs for SQL errors

### Issue: File upload fails
**Solution:**
1. Verify file size is under 5MB
2. Check that file type is allowed (PDF, DOC, DOCX, JPEG, PNG)
3. Ensure `/uploads` directory exists in Backend folder
4. Check write permissions on `/uploads` directory

---

## 📝 Notes

- **Backward Compatibility:** Existing medical records will continue to work. The `note_type` defaults to 'ongoing_health' for backward compatibility.
- **Optional Fields:** All new fields are optional (NULL allowed) except `note_type`.
- **File Upload:** Medical report file upload is now optional (not required).
- **Data Types:** 
  - Decimals use appropriate precision (e.g., DECIMAL(5,2) for age, DECIMAL(6,2) for measurements)
  - Dates use DATE type
  - Text fields use TEXT or VARCHAR with appropriate lengths
  - Rates use INT for whole numbers

---

## 🎨 UI/UX Highlights

- **Clean Section Headers:** Colored headers distinguish between note types
- **Responsive Layout:** Fields organized in rows for better space utilization
- **Clear Labels:** Descriptive labels with placeholders
- **Input Validation:** Numeric inputs for measurements, date pickers for dates
- **Visual Feedback:** Radio buttons clearly show selected option
- **Conditional Display:** Only relevant fields shown based on selection

---

## ✅ Completion Checklist

- [x] SQL script created and tested
- [x] Frontend component updated with toggle functionality
- [x] Home Health Care Note fields implemented
- [x] Ongoing Health Note fields implemented
- [x] Form state management updated
- [x] Data mapping to database columns
- [x] Form reset functionality
- [x] File upload remains optional
- [x] Documentation created

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check backend server logs
4. Verify database schema changes were applied
5. Ensure both frontend and backend servers are running

---

**Last Updated:** March 15, 2026  
**Version:** 3.0  
**Database:** sokapptest  
**Component:** MedicalTab.js
