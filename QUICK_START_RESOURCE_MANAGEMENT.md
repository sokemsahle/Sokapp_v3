# Quick Start Guide - Resource Management System

## 🚀 Getting Started in 5 Minutes

### Step 1: Setup Database (1 minute)

1. Open File Explorer
2. Navigate to: `c:\Users\hp\Documents\code\SOKAPP project\Version 3\database`
3. Double-click: `setup_resource_management.bat`
4. Wait for "RESOURCE MANAGEMENT SETUP COMPLETED!" message

**What this does:**
- Creates `rooms` table
- Creates `beds` table
- Adds `room_id` and `bed_id` columns to `children` table
- Sets up permissions

---

### Step 2: Restart Backend Server (30 seconds)

1. Stop your current backend server (Ctrl+C)
2. Run: `start-unified-server.bat` or `npm start` in Backend folder
3. Wait for "Server running on http://localhost:5000"

---

### Step 3: Access Resource Management (30 seconds)

1. Open browser: http://localhost:3000 (or your frontend URL)
2. Login as admin
3. Click hamburger menu (☰) if sidebar is closed
4. Scroll to **Organization** section
5. Click **Resources** (new item under Shamida News)

---

## 📋 Using the System

### Creating Your First Room

1. Go to **Organization → Resources**
2. Stay on **Dormitory Rooms** tab
3. Fill in the form:
   - **Room Name:** e.g., "Room 101 - Block A"
   - **Capacity:** e.g., 4 (number of beds)
4. Click **Add Room**
5. See your room appear in the list below

### Adding Beds to a Room

1. Switch to **Beds** tab
2. Select your room from dropdown at top
3. Fill in the form:
   - **Bed Number:** e.g., "Bed A-101"
   - **Status:** Available (default)
4. Click **Add Bed**
5. Repeat for each bed in the room

### Assigning Bed to Child

1. Go to **Child Profiles**
2. Create new child or edit existing
3. In **Step 3 (Admission Information)**:
   - Find **Assign Dormitory Room** dropdown
   - Select the room
   - Find **Assign Bed** dropdown (now active)
   - Select an available bed (green)
4. Click **Create Child** or **Update Child**

**What happens automatically:**
- Bed status changes to "occupied" (red)
- Bed no longer shows in available beds list
- Child's record linked to room and bed

### Changing Child's Bed

1. Edit the child profile
2. Change the room selection OR
3. Select different bed from dropdown
4. Click **Update Child**

**What happens automatically:**
- Old bed becomes "available" (green)
- New bed becomes "occupied" (red)
- No manual status updates needed!

---

## 🎯 Quick Reference

### Color Codes
- 🟢 **Green badge** = Available bed
- 🔴 **Red badge** = Occupied bed

### Rules
- ✅ One bed belongs to one child at a time
- ✅ A room can have many beds
- ✅ Not all children need beds (optional fields)
- ❌ Cannot delete occupied beds
- ❌ Cannot assign already occupied beds

### Tips
- 💡 Create rooms BEFORE adding beds
- 💡 Add beds BEFORE assigning to children
- 💡 Room dropdown shows available bed count
- 💡 Bed dropdown only shows available beds
- 💡 Leave room/bed unassigned if not needed

---

## 🔍 Verification Steps

### Check Room Creation
```sql
USE sokapptest;
SELECT * FROM rooms ORDER BY created_at DESC LIMIT 5;
```

### Check Bed Creation
```sql
USE sokapptest;
SELECT b.*, r.room_name 
FROM beds b 
JOIN rooms r ON b.room_id = r.id 
ORDER BY b.created_at DESC LIMIT 10;
```

### Check Child-Bed Assignment
```sql
USE sokapptest;
SELECT c.first_name, c.last_name, r.room_name, b.bed_number, b.status
FROM children c
LEFT JOIN rooms r ON c.room_id = r.id
LEFT JOIN beds b ON c.bed_id = b.id
WHERE c.room_id IS NOT NULL;
```

---

## ❓ Troubleshooting

### "Resources" menu not showing
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check you're logged in as admin

### Cannot create rooms
- Verify database setup completed
- Check backend server is running
- Open browser console (F12) for errors

### Beds not showing in dropdown
- Ensure room is selected first
- Check that beds exist for selected room
- Verify beds are marked as "available"

### Cannot delete room/bed
- Check if any beds are occupied
- Reassign children to different beds first
- Use bulk operations if needed

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check backend terminal for error logs
3. Verify database tables exist:
   ```sql
   SHOW TABLES LIKE 'rooms';
   SHOW TABLES LIKE 'beds';
   ```
4. Review implementation summary document

---

## ✅ Success Indicators

You know it's working when:
- ✅ "Resources" appears in Organization menu
- ✅ You can create a room
- ✅ You can add beds to a room
- ✅ Beds show green (available) / red (occupied) badges
- ✅ Child form has room/bed dropdowns
- ✅ Assigning bed makes it unavailable
- ✅ Changing bed updates both beds' statuses

---

**Happy Managing! 🎉**
