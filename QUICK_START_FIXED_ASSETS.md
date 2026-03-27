# Quick Start Guide - Fixed Asset Management

## 🚀 Getting Started in 5 Minutes

### Step 1: Setup Database (1 minute)

1. Open File Explorer
2. Navigate to: `c:\Users\hp\Documents\code\SOKAPP project\Version 3\database`
3. Double-click: `setup_fixed_assets.bat`
4. Wait for "FIXED ASSET MANAGEMENT SETUP COMPLETED!" message

**What this does:**
- Creates `fixed_assets` table
- Creates `asset_maintenance_log` table
- Adds 10 asset categories to lookup lists
- Sets up 5 permissions for fixed assets

---

### Step 2: Restart Backend Server (30 seconds)

1. Stop your current backend server (Ctrl+C if running)
2. Run: `start-unified-server.bat` or navigate to Backend folder and run `npm start`
3. Wait for "Server running on http://localhost:5000"

---

### Step 3: Access Fixed Assets Management (30 seconds)

1. Open browser: http://localhost:3000 (or your frontend URL)
2. Login as admin
3. Click hamburger menu (☰) if sidebar is closed
4. Scroll to **Organization** section
5. Click **Resources** (under Shamida News)
6. Click on **Fixed Assets** tab (third tab)

---

## 📋 Using the System

### Adding Your First Fixed Asset

1. Go to **Organization → Resources → Fixed Assets** tab
2. Fill in the "Add New Fixed Asset" form:

   **Required Fields:**
   - **Asset Name:** e.g., "Office Desk", "Laptop Computer", "Refrigerator"
   - **Category:** Select from dropdown (Furniture, IT Equipment, etc.)

   **Recommended Fields:**
   - **Asset Code:** Internal tracking code (e.g., "FURN-001", "IT-002")
   - **Serial Number:** From manufacturer
   - **Manufacturer:** Company name (e.g., "Dell", "IKEA", "Samsung")
   - **Model:** Model number or name
   - **Purchase Date:** When you bought it
   - **Purchase Price:** What you paid
   - **Supplier:** Where you bought it from
   - **Warranty Period:** Months of warranty coverage
   - **Location:** Where it's located (e.g., "Main Office Room 1")
   - **Assigned To:** Who uses it (person or department)
   - **Condition Status:** 
     - Excellent (like new)
     - Good (normal wear)
     - Fair (shows wear)
     - Poor (needs repair)
     - Damaged (broken)
   - **Availability Status:**
     - Available (ready to use)
     - In Use (currently assigned)
     - Under Maintenance (being repaired)
     - Retired (no longer in service)
   - **Current Value:** What it's worth now
   - **Notes:** Any additional information

3. Click **"Add Asset"**
4. Your asset appears in the list below

---

### Recording Maintenance

1. Find the asset in the list
2. Click the **wrench icon (🔧)** on the asset card
3. A maintenance form appears at the top
4. Fill in:
   - **Maintenance Date:** When work was done
   - **Maintenance Type:** Routine/Repair/Inspection/Replacement
   - **Description:** What work was performed
   - **Performed By:** Technician or company name
   - **Cost:** How much it cost
   - **Next Scheduled Date:** When next maintenance is due
5. Click **"Add Maintenance Log"**
6. The asset's last maintenance date is automatically updated

---

### Managing Asset Lifecycle

#### Update Asset Information
1. Click the **edit icon (✏️)** on the asset card
2. Modify any fields (condition, location, value, etc.)
3. Click **"Update Asset"**

#### Track Depreciation
- Update **Current Value** field periodically
- Adjust **Depreciation Rate** if needed
- System tracks purchase price vs current value

#### Monitor Warranty
- System auto-calculates warranty expiry from purchase date + warranty period
- Check assets with expiring warranties using SQL query (see below)

#### Retire an Asset
1. Edit the asset
2. Change **Availability Status** to "Retired"
3. Update **Condition Status** if needed
4. Add note about retirement reason
5. Click **"Update Asset"**

---

## 🎯 Quick Reference

### Asset Categories Available
1. Furniture & Fixtures (desks, chairs, cabinets)
2. Office Equipment (printers, copiers, scanners)
3. IT Equipment (computers, servers, networking)
4. Vehicles (cars, vans, trucks)
5. Machinery & Equipment (industrial equipment)
6. Appliances (refrigerators, washers, microwaves)
7. Sports & Recreation Equipment (gym equipment, sports gear)
8. Kitchen Equipment (stoves, ovens, blenders)
9. Medical Equipment (first aid, health monitoring)
10. Other (anything that doesn't fit above)

### Color Codes

**Availability Status:**
- 🟢 **Green badge** = Available
- 🔵 **Blue badge** = In Use
- 🟡 **Yellow badge** = Under Maintenance
- ⚪ **Gray badge** = Retired

**Condition Status:**
- 💚 **Dark Green** = Excellent
- 💙 **Light Blue** = Good
- 💛 **Yellow** = Fair
- ❤️ **Light Red** = Poor
- 💜 **Dark Red** = Damaged

### Rules
- ✅ Each asset must have a name and category
- ✅ Asset codes must be unique (for tracking)
- ✅ One asset can have unlimited maintenance records
- ❌ Cannot delete an asset without deleting its maintenance logs first (automatic)

### Tips
- 💡 Use consistent asset coding (FURN-001, FURN-002, IT-001, etc.)
- 💡 Record all assets, even low-value items
- 💡 Take photos and store file paths in Notes field
- 💡 Schedule preventive maintenance before items break
- 💡 Track warranty dates to claim repairs when needed
- 💡 Update current value annually for accurate financial records
- 💡 Use Assigned To field to know who has what equipment

---

## 🔍 Verification Steps

### Check Your Assets by Category
```sql
USE sokapptest;
SELECT asset_category, COUNT(*) as count
FROM fixed_assets
GROUP BY asset_category
ORDER BY count DESC;
```

### Check Assets Needing Attention
```sql
USE sokapptest;
SELECT asset_name, asset_category, condition_status, 
       next_maintenance_date, availability_status
FROM fixed_assets
WHERE condition_status IN ('poor', 'damaged')
   OR next_maintenance_date <= CURDATE()
ORDER BY next_maintenance_date ASC;
```

### Check Warranty Expiring Soon (Next 3 Months)
```sql
USE sokapptest;
SELECT asset_name, manufacturer, model, 
       warranty_expiry_date, supplier
FROM fixed_assets
WHERE warranty_expiry_date BETWEEN CURDATE() 
  AND DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
ORDER BY warranty_expiry_date ASC;
```

### View Maintenance History for Specific Asset
```sql
USE sokapptest;
SELECT a.asset_name, m.maintenance_date, m.maintenance_type,
       m.description, m.performed_by, m.cost
FROM fixed_assets a
LEFT JOIN asset_maintenance_log m ON a.id = m.asset_id
WHERE a.asset_code = 'YOUR-ASSET-CODE'
ORDER BY m.maintenance_date DESC;
```

### Total Asset Value Summary
```sql
USE sokapptest;
SELECT 
    asset_category,
    COUNT(*) as count,
    SUM(purchase_price) as total_purchase,
    SUM(current_value) as total_current,
    SUM(purchase_price) - SUM(current_value) as depreciation
FROM fixed_assets
WHERE availability_status != 'retired'
GROUP BY asset_category
ORDER BY total_current DESC;
```

---

## ❓ Troubleshooting

### "Fixed Assets" tab not showing
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check you're logged in as admin
- Verify Resources page loaded correctly

### Cannot create assets
- Verify database setup completed (run setup_fixed_assets.bat)
- Check backend server is running
- Open browser console (F12) for JavaScript errors
- Check backend terminal for error logs

### Asset categories dropdown is empty
- Verify lookup_lists table has entries
- Check SQL script ran successfully
- Query: `SELECT * FROM lookup_lists WHERE category = 'Asset Category';`

### Maintenance log won't save
- Ensure maintenance date and description are filled
- Check that asset exists and hasn't been deleted
- Verify database connection

---

## 📊 Example Scenarios

### Scenario 1: New Organization Setup
You're setting up a new community center and need to track all assets:

1. **Furniture:**
   - 20 office chairs → Create one asset per chair or batch as "20 Office Chairs"
   - 10 desks → Same approach
   - 5 filing cabinets → Track separately for insurance

2. **IT Equipment:**
   - 5 desktop computers → Track serial numbers individually
   - 3 printers → Record toner changes in maintenance
   - 1 server → Critical asset, schedule regular maintenance

3. **Appliances:**
   - 1 refrigerator in kitchen → Track cleaning/maintenance
   - 1 washing machine → Record repairs
   - 2 microwaves → Note when they stop working

### Scenario 2: Vehicle Fleet
Track organization vehicles:

- **Asset Name:** "Ford Transit Van 2024"
- **Category:** Vehicles
- **Asset Code:** VEH-001
- **Serial Number:** VIN number
- **Manufacturer:** Ford
- **Model:** Transit Van
- **Purchase Date:** 2024-01-15
- **Purchase Price:** 35000.00
- **Location:** Parking Lot A
- **Assigned To:** "Transport Department" or "John Smith"
- **Condition:** Excellent
- **Availability:** In Use

**Maintenance Entries:**
- Oil change every 6 months
- Tire rotation annually
- Brake inspection yearly
- Repairs as needed

### Scenario 3: Sports Equipment
Track gym and sports equipment:

- Treadmills, exercise bikes, weights
- Basketball hoops, soccer goals
- Safety inspection dates
- Repair worn parts
- Replace damaged equipment

---

## 🎉 Success Indicators

You know it's working when:
- ✅ "Fixed Assets" tab appears in Resources page
- ✅ You can create a new fixed asset
- ✅ Asset appears in list with correct category badge
- ✅ Status badges show correct colors
- ✅ You can add maintenance logs
- ✅ Maintenance history is tracked
- ✅ You can edit and update assets
- ✅ Asset values are tracked
- ✅ You can delete assets (with confirmation)

---

## 📞 Next Steps

After setting up your fixed assets:

1. **Conduct Asset Audit:** Walk through your facility and record all assets
2. **Assign Asset Codes:** Create a consistent coding system
3. **Record Purchase Info:** Gather receipts and warranty information
4. **Set Locations:** Document where each asset is located
5. **Assign Responsibilities:** Note who is responsible for each asset
6. **Schedule Maintenance:** Set up regular maintenance schedules
7. **Monitor Conditions:** Regularly update condition status
8. **Track Values:** Update current values annually

---

**Happy Asset Managing! 🎉**

Your organization now has complete control over its fixed assets, from furniture to vehicles, with full maintenance tracking and value monitoring.
