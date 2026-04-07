# Database Migration: Birth Date Type Tracking

## Overview
This migration improves how we track birth dates by adding a `date_of_birth_type` column and removing the separate `estimated_age` column. Now all birth dates are stored in the `date_of_birth` field with a type indicator.

## Files Created
1. `add_date_of_birth_type_and_remove_estimated_age.sql` - Main migration script
2. `rollback_remove_date_of_birth_type.sql` - Rollback script (if needed)

## Changes Made

### Before (Old Schema)
```sql
CREATE TABLE children (
    ...
    date_of_birth DATE,           -- Exact birth date (nullable)
    estimated_age INT,            -- Estimated age in years (nullable)
    ...
);
```

**Problem:** Had two separate fields, couldn't easily tell which type of age info was provided.

### After (New Schema)
```sql
CREATE TABLE children (
    ...
    date_of_birth DATE,                    -- Birth date (always required now)
    date_of_birth_type VARCHAR(20),        -- 'actual' or 'estimated'
    ...
);
```

**Benefit:** Single source of truth for birth date with clear type indicator.

## Migration Steps

### 1. Run the Migration
```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the migration script
source database/add_date_of_birth_type_and_remove_estimated_age.sql
```

### 2. What the Migration Does

**Step 1:** Adds `date_of_birth_type` column
- Default value: 'actual'
- Accepts: 'actual' or 'estimated'

**Step 2:** Updates existing records
- Records with `estimated_age` but no `date_of_birth` → set type to 'estimated'
- Records with `date_of_birth` → set type to 'actual'

**Step 3:** Removes `estimated_age` column
- Cleans up old redundant field

**Step 4:** Creates index
- Improves query performance when filtering by birth date type

### 3. Verify the Migration
```sql
-- Check that all records have the new column
SELECT id, first_name, date_of_birth, date_of_birth_type 
FROM children 
LIMIT 10;

-- Count records by type
SELECT date_of_birth_type, COUNT(*) as count 
FROM children 
GROUP BY date_of_birth_type;
```

## Data Migration Notes

### Important Consideration
⚠️ **Records with only `estimated_age` will need manual review**

If a child record only has an estimated age (e.g., "5 years old") without a birth date, you'll need to:
1. Manually calculate an approximate birth year
2. Enter it as a date (e.g., January 1st of that year)
3. Mark the type as 'estimated'

**Example:**
```sql
-- For a child estimated to be 5 years old in 2026
UPDATE children 
SET date_of_birth = '2021-01-01', 
    date_of_birth_type = 'estimated'
WHERE id = <child_id>;
```

## Frontend Alignment

The frontend form already supports this structure:
- ✅ Radio buttons for "Actual Date of Birth" vs "Estimated Age (Birth Date)"
- ✅ Single date picker field for both options
- ✅ Saves both `dateOfBirth` and `ageType` to backend
- ✅ Automatically calculates age from entered date

## Benefits

### 1. **Data Consistency**
- All birth dates stored in one field
- Clear indication of accuracy level
- No confusion about which field to use

### 2. **Simpler Queries**
```sql
-- Find all children with estimated birth dates
SELECT * FROM children WHERE date_of_birth_type = 'estimated';

-- Calculate accurate ages for all children
SELECT 
    first_name,
    date_of_birth,
    date_of_birth_type,
    TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) as age
FROM children;
```

### 3. **Better Reporting**
- Easy to filter by actual vs estimated dates
- More accurate age calculations
- Cleaner data for analytics

### 4. **Database Normalization**
- Eliminates redundant storage
- Single source of truth
- Follows best practices

## Rollback Procedure

If you need to revert to the old schema:

```bash
# Run the rollback script
source database/rollback_remove_date_of_birth_type.sql
```

**Note:** Rolling back will lose the distinction between actual and estimated dates.

## Testing Checklist

- [ ] Backup database before migration
- [ ] Run migration script
- [ ] Verify `date_of_birth_type` column exists
- [ ] Verify `estimated_age` column is removed
- [ ] Check that existing records have correct type values
- [ ] Test frontend form - can save both actual and estimated types
- [ ] Test frontend form - radio button selection persists after save
- [ ] Verify age calculation works correctly
- [ ] Test reports and exports include birth date type

## Future Enhancements

Potential improvements to consider:
1. Add validation to ensure `date_of_birth` is always provided
2. Add UI indicator showing birth date type in child list
3. Create reports filtering by birth date accuracy
4. Add data quality checks for estimated dates older than X years

---

**Migration Date:** March 31, 2026  
**Database:** MySQL  
**Affected Table:** children  
**Breaking Change:** Yes (removes `estimated_age` column)  
**Rollback Available:** Yes
