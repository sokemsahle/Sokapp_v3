# User Activity Report - Web App Integration Guide

## ✅ What Was Added

I've added a **User Activity Report** feature to your SOKAPP web application!

### Files Created/Modified:

1. **NEW:** `src/components/Report/UserActivityReport.js`
   - Complete React component for user activity reporting
   - 4 tabs: Summary, Security, Users, Export
   - Beautiful UI with stats cards and tables

2. **UPDATED:** `src/components/Report.js`
   - Added import for UserActivityReport
   - Enabled the "User Activity" menu item (was disabled)
   - Changed description from "Coming soon" to "Login tracking & audit trail"

3. **NEW:** `src/services/userActivityAPI.php`
   - Backend API to fetch real data from database
   - Returns JSON data for the report

---

## 🎯 How to Use in Your Web App

### Step 1: Make Sure Database is Installed

First, ensure you've run the SQL installation:

```sql
-- In phpMyAdmin, run:
mysql -u root -p sokapptest < 01_INSTALL_FOR_PHPMYADMIN.sql
```

This creates the `user_activity_log` table and sample data.

### Step 2: Access the Report in Your App

1. **Login** to your SOKAPP application
2. Navigate to **Reports** section (from sidebar/menu)
3. Click on **"User Activity"** in the left sidebar
4. You'll see 4 tabs:
   - 📊 **Summary** - Today's activity overview
   - 🚨 **Security** - Failed logins and alerts
   - 👥 **Users** - User performance metrics
   - 📥 **Export** - Download reports

### Step 3: Connect to Real Data (Optional)

Currently showing mock data. To show real database data:

1. **Deploy the PHP API:**
   - Copy `src/services/userActivityAPI.php` to your backend server
   - Place it in your PHP server directory (e.g., `htdocs/sokapp/api/`)
   - Update database credentials in the file

2. **Update the React component:**
   - Open `src/components/Report/UserActivityReport.js`
   - Find the `fetchUserActivityData` function
   - Replace mock data with actual API call:

```javascript
const fetchUserActivityData = async (reportType) => {
    setLoading(true);
    setError(null);
    
    try {
        const response = await fetch(`http://localhost/sokapp/api/userActivityAPI.php?type=${reportType}`);
        const result = await response.json();
        
        if (result.success) {
            setReportData(result.data);
        } else {
            setError(result.error || 'Failed to load data');
        }
    } catch (err) {
        setError('Failed to connect to server. Please try again.');
        console.error('Error fetching user activity:', err);
    } finally {
        setLoading(false);
    }
};
```

3. **Restart your React app:**
   ```bash
   npm start
   ```

---

## 📊 Features Included

### Summary Tab
- Total activities today
- Active users count
- Login count
- Failed login attempts
- Recent activities table with:
  - Timestamp
  - User name & email
  - Action type
  - Module accessed
  - Status
  - IP address

### Security Tab
- Security alerts display
- Failed login attempts
- Permission denials
- Alert levels (HIGH, MEDIUM, LOW)
- Device and IP information

### Users Tab
- User performance metrics
- Total actions per user
- Last active timestamp
- Role breakdown

### Export Tab
- CSV export button
- Excel export button
- PDF export button
- (Backend implementation needed for actual export)

---

## 🎨 Styling

The component uses existing CSS from:
- `src/components/Report/Report.css`

Additional styles are inline or can be added to that file.

---

## 🔧 Customization Options

### Change Date Range
Add date filter inputs to the component:

```javascript
const [dateRange, setDateRange] = useState('today'); // 'today', 'week', 'month'

// Add date picker or dropdown
<select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
    <option value="today">Today</option>
    <option value="week">This Week</option>
    <option value="month">This Month</option>
</select>
```

### Add More Report Types
Extend the switch statement in `UserActivityReport.js`:

```javascript
case 'audit':
    return <AuditTrailReport />;
case 'compliance':
    return <ComplianceReport />;
```

### Add Real-time Updates
Add polling to refresh data every 30 seconds:

```javascript
useEffect(() => {
    fetchUserActivityData(activeTab);
    const interval = setInterval(() => {
        fetchUserActivityData(activeTab);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
}, [activeTab]);
```

---

## 🐛 Troubleshooting

### Issue: "Component shows mock data"
**Solution:** That's normal! Mock data is shown until you connect the PHP API. Follow Step 3 above.

### Issue: "User Activity menu not clickable"
**Solution:** 
1. Make sure you saved all files
2. Restart your React dev server: `npm start`
3. Clear browser cache: Ctrl+Shift+R

### Issue: "API returns error"
**Solution:**
1. Check database credentials in `userActivityAPI.php`
2. Verify `user_activity_log` table exists:
   ```sql
   SELECT COUNT(*) FROM user_activity_log;
   ```
3. Check CORS settings if API is on different domain

### Issue: "Table shows no data"
**Solution:**
1. Run the installation script to add sample data
2. Or wait for users to generate activity naturally

---

## 📝 Testing Without Backend

You can test the UI right now with mock data:

1. Open your React app
2. Go to Reports → User Activity
3. Click through tabs (Summary, Security, Users)
4. You'll see sample data displayed

No backend needed for testing the UI!

---

## 🚀 Next Steps

1. **Test the UI** (works immediately with mock data)
2. **Deploy PHP API** to your backend server
3. **Connect React to API** using the fetch code above
4. **Customize** as needed for your requirements
5. **Add export functionality** (CSV/PDF generation)

---

## 📞 Quick Reference

### File Locations:
- Frontend Component: `src/components/Report/UserActivityReport.js`
- Backend API: `src/services/userActivityAPI.php`
- Main Report Menu: `src/components/Report.js`

### API Endpoints:
```
GET /api/userActivityAPI.php?type=summary    → Summary report
GET /api/userActivityAPI.php?type=security   → Security alerts
GET /api/userActivityAPI.php?type=users      → User metrics
GET /api/userActivityAPI.php?type=today      → Today only
```

---

**Version:** 1.0  
**Created:** March 2026  
**Framework:** React + PHP/MySQL  
**Status:** ✅ Ready to Use
