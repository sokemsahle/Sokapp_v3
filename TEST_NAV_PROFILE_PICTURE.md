# Quick Test - Navigation Profile Picture Fix

## 🧪 Testing Steps

### Before Testing
1. Make sure backend server is running on `http://localhost:5000`
2. Make sure frontend is running on `http://localhost:3000`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Open browser DevTools (F12) → Console tab

### Test Case 1: User WITH Employee Profile Picture

**Steps:**
1. Login as a user who has an employee profile with a photo
   - Example: Check if user's email exists in employees table with `profile_image` field populated
   
2. **Check Console Logs:**
   ```
   ✅ Should see: "Fetching employee data for email: user@example.com"
   ✅ Should see: "Response status: 200"
   ✅ Should see: "Response data: {success: true, employee: {...}}"
   ✅ Should see: "Employee data set: {...}"
   ```

3. **Check Navigation Bar (Top Right):**
   ```
   ✅ Profile circle should show employee's actual photo (not default logo)
   ✅ Image should be clear and properly loaded
   ```

4. **Click Profile to Open Dropdown:**
   ```
   ✅ Dropdown header should show same employee photo
   ✅ Should display employee's full name
   ✅ Should display user's email
   ```

5. **Navigate to Different Pages:**
   ```
   ✅ Dashboard → Profile picture remains consistent
   ✅ Inventory → Profile picture remains consistent
   ✅ Settings → Profile picture remains consistent
   ✅ My Requisitions → Profile picture remains consistent
   ```

### Test Case 2: User WITHOUT Employee Profile

**Steps:**
1. Login as a user who doesn't have an employee profile

2. **Check Console Logs:**
   ```
   ✅ Should see: "Fetching employee data for email: user@example.com"
   ✅ Should see: "Response status: 404"
   ✅ Should see: "Employee profile not found for this email (this is normal)"
   ❌ Should NOT see any red errors
   ```

3. **Check Navigation Bar:**
   ```
   ✅ Profile circle should show default logo (/Logo/logo-favicon.png)
   ✅ No broken image icon
   ```

### Test Case 3: Admin User with Employee Profile

**Steps:**
1. Login as admin user who also has an employee profile

2. **Check Admin View:**
   ```
   ✅ Navigation bar shows employee profile photo
   ✅ "Admin" badge visible
   ✅ Can switch to standard view
   ```

3. **Switch to Standard View:**
   ```
   ✅ Navigation bar still shows same employee profile photo
   ✅ "Standard" badge visible
   ✅ Can switch back to admin
   ```

### Test Case 4: Profile Picture Fallback Logic

**Test the priority system:**

1. **Scenario A: Employee has profile_image**
   ```
   Result: Shows employeeData.profile_image ✅
   ```

2. **Scenario B: No employee record, but user has profile_image**
   ```
   Result: Shows user.profile_image ✅
   ```

3. **Scenario C: No employee record AND no user profile_image**
   ```
   Result: Shows /Logo/logo-favicon.png ✅
   ```

4. **Scenario D: Invalid image URL**
   ```
   Result: onError handler replaces with /Logo/logo-favicon.png ✅
   ```

## 🔍 Debugging Checklist

If profile picture is NOT showing correctly:

### Frontend Checks:
- [ ] Open DevTools Console (F12)
- [ ] Check for error messages related to `/api/employees/by-email/`
- [ ] Verify `employeeData` state is being set (add console.log in Nav component)
- [ ] Check if image URL is accessible (right-click → Open Image in New Tab)
- [ ] Verify CSS is not hiding the image (check computed styles)

### Backend Checks:
- [ ] Test API endpoint directly: `GET http://localhost:5000/api/employees/by-email/user@example.com`
- [ ] Check if employees table has `profile_image` column
- [ ] Verify database connection is working
- [ ] Check backend logs for any errors

### Database Checks:
```sql
-- Check if employee record exists
SELECT id, full_name, email, profile_image 
FROM employees 
WHERE email = 'user@example.com';

-- Check if profile_image field has data
SELECT email, LENGTH(profile_image) as image_length 
FROM employees 
WHERE email = 'user@example.com';
```

## 📊 Expected Behavior Summary

| Scenario | Profile Picture Source | Console Message | Visual Result |
|----------|----------------------|-----------------|---------------|
| User with employee photo | `employeeData.profile_image` | "Employee data set" | ✅ Shows employee photo |
| User without employee record | `user.profile_image` or default logo | "Employee profile not found (normal)" | ✅ Shows fallback image |
| Admin with employee photo | `employeeData.profile_image` | "Employee data set" | ✅ Shows employee photo |
| Network error | Default logo | Error message logged | ✅ Gracefully degrades |
| Invalid image URL | Default logo via onError | No error visible to user | ✅ Auto-replaces with fallback |

## ⏱️ Performance Expectations

- **Initial Load:** Profile picture should appear within 1-2 seconds after login
- **Page Navigation:** Profile picture should be instant (no reloading)
- **API Calls:** Only ONE call to fetch employee data per session (not per page)
- **Memory:** employeeData cached in component state (no repeated fetches)

## ✅ Success Criteria

All tests pass if:
- [x] Profile pictures display correctly for users with employee photos
- [x] Fallback images work for users without employee records
- [x] No console errors (only expected informational messages)
- [x] Profile pictures remain consistent across all pages
- [x] Dropdown menu shows same profile picture as navbar
- [x] Switching between admin/standard views maintains profile picture
- [x] Page load performance is good (no noticeable delay)

---

**Test Status:** Ready to Test  
**Last Updated:** March 15, 2026
