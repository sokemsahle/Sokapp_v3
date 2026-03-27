# 📋 How to Run SQL in phpMyAdmin

## ✅ Quick Steps

### **Step 1: Open phpMyAdmin**
1. Open your web browser
2. Go to `http://localhost/phpmyadmin` (or your server's phpMyAdmin URL)
3. Login if required

---

### **Step 2: Select Database**
1. In the left sidebar, click on **`sokapptest`** database
2. The database structure will load

---

### **Step 3: Open SQL Tab**
1. Click on the **"SQL"** tab at the top of the page
2. A large text box will appear where you can paste SQL

---

### **Step 4: Run the SQL Script**
1. Open the file: `database/child_setup_phpmyadmin.sql`
2. **Copy ALL the content** (Ctrl+A, Ctrl+C)
3. **Paste** into the SQL text box in phpMyAdmin
4. Click the **"Go"** button

---

### **Step 5: Verify Success**
You should see:
- ✅ Green success messages
- ✅ Tables created: `children`, `child_guardian_information`, `child_legal_documents`, etc.
- ✅ Permissions added: 9 new permissions
- ✅ Role assignments updated

---

## 🎯 What the SQL Does

### **Creates:**
- 6 new tables (Tier 1 & Tier 2)
- 9 new permissions
- Foreign key relationships
- Indexes for performance

### **Assigns Permissions To:**
- ✅ **Admin** - Full access to everything
- ✅ **HR** - Full access to child management
- ✅ **Director** - Full access to child management
- ✅ **Teacher** - View + Education records only

---

## 🔍 Expected Results

After running, you should see these tables in your database:

```
children
child_guardian_information
child_legal_documents
child_medical_records
child_education_records
child_case_history
```

And in the `permissions` table:
```
child_view
child_create
child_update
child_delete
guardian_manage
legal_manage
medical_manage
education_manage
case_manage
```

---

## ❌ Troubleshooting

### **Error: "Database doesn't exist"**
**Solution:** Create the database first or select the correct database name

### **Error: "Table already exists"**
**Solution:** That's OK! It means tables were already created. Continue anyway.

### **Error: "Duplicate entry for key 'PRIMARY'"**
**Solution:** That's OK! Permissions already exist. Continue anyway.

### **Nothing shows up**
**Solution:** 
1. Refresh the page (F5)
2. Check if you selected the right database
3. Make sure you copied ALL the SQL

---

## ✅ After Running SQL

1. **Restart your Backend server** (if not already running):
   ```bash
   cd Backend
   node server.js
   ```

2. **Refresh your React app** in the browser

3. **Login as admin** → You should now see "Child Profiles" in the sidebar

4. **Click "Child Profiles"** → Start adding children!

---

## 📸 Visual Guide

```
phpMyAdmin Interface:
┌─────────────────────────────────────┐
│ Databases    SQL    Status...       │ ← Click SQL tab
├─────────────────────────────────────┤
│ sokapptest (selected)               │
│  - users                            │
│  - roles                            │
│  - permissions                      │
│  (+ new child tables after running) │
└─────────────────────────────────────┘

SQL Tab:
┌─────────────────────────────────────┐
│ [Large text box]                    │
│ Paste SQL here                      │
│                                     │
│ [Go] [Clear]                        │ ← Click Go
└─────────────────────────────────────┘
```

---

## 🎉 Success Indicators

You'll know it worked when:
- ✅ No red error messages
- ✅ Success message appears: "Your SQL query has been executed successfully"
- ✅ New tables appear in left sidebar
- ✅ "Child Profiles" menu item visible in app
- ✅ Can navigate to `/children` route

---

**Need help?** Check the queries at the bottom of the SQL file that verify the setup!
