# Visual Guide: Edit & Delete Buttons in View Inventory

## 📍 Where to Find the Buttons

### Step 1: Navigate to Inventory
```
Sidebar → Inventory → View Inventory
```

### Step 2: Look at the Actions Column
The last column on the right shows action buttons.

---

## 👀 What You'll See

### For Users WITH Inventory Management Permission:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INVENTORY ITEMS                            │
├──────────────┬────────────┬─────────────┬────────────┬─────────┬────────┤
│ Item Name    │ Category   │ Quantity    │ Location   │ Status  │Actions │
├──────────────┼────────────┼─────────────┼────────────┼─────────┼────────┤
│ Rice Bags    │ Food       │ 50 Bags     │ Storage A  │ In Stock│ [↑][✎][🗑]│
│              │            │             │            │         │        │
│ Soap Bars    │ Hygiene    │ 100 Pcs     │ Pantry B   │ In Stock│ [↑][✎][🗑]│
│              │            │             │            │         │        │
│ Notebooks    │ Education  │ 200 Each    │ Room 101   │ In Stock│ [↑][✎][🗑]│
│              │            │             │            │         │        │
│ Pens         │ Education  │ 8 Boxes     │ Storage C  │ Low Stock│[↑][✎][🗑]│
└──────────────┴────────────┴─────────────┴────────────┴─────────┴────────┘

Legend:
[↑] = Stock Adjust (Up/Down arrow icon)
[✎] = Edit (Pencil icon)
[🗑] = Delete (Trash icon)
```

### For Users WITHOUT Inventory Management Permission:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INVENTORY ITEMS                            │
├──────────────┬────────────┬─────────────┬────────────┬─────────┬────────┤
│ Item Name    │ Category   │ Quantity    │ Location   │ Status  │Actions │
├──────────────┼────────────┼─────────────┼────────────┼─────────┼────────┤
│ Rice Bags    │ Food       │ 50 Bags     │ Storage A  │ In Stock│View Only│
│              │            │             │            │         │        │
│ Soap Bars    │ Hygiene    │ 100 Pcs     │ Pantry B   │ In Stock│View Only│
│              │            │             │            │         │        │
│ Notebooks    │ Education  │ 200 Each    │ Room 101   │ In Stock│View Only│
└──────────────┴────────────┴─────────────┴────────────┴─────────┴────────┘
```

---

## 🔘 Button Details

### 1. Stock Adjust Button 📦
**Appearance:** Blue button with up/down arrow icon  
**Location:** First button in Actions column  
**Click Behavior:** Opens prompt asking for quantity change and reason

```
┌──────────────────────────┐
│    Stock Adjustment      │
├──────────────────────────┤
│ Current Quantity: 50     │
│                          │
│ Enter quantity change:   │
│ [____]                   │
│                          │
│ Reason:                  │
│ [___________________]    │
│                          │
│      [Cancel] [OK]       │
└──────────────────────────┘
```

**Usage:**
- Enter `+10` or just `10` to add stock
- Enter `-5` or just `-5` to remove stock
- Provide a reason for the adjustment

---

### 2. Edit Button ✏️
**Appearance:** Green button with pencil icon  
**Location:** Middle button in Actions column  
**Click Behavior:** Opens modal with all item fields pre-filled

```
┌─────────────────────────────────────────┐
│         Edit Item                       │
├─────────────────────────────────────────┤
│ Item Name *        Category *           │
│ [Rice Bags    ]    [Food & Nutrition v]│
│                                         │
│ Quantity *         Unit *               │
│ [50          ]     [Bags           ]   │
│                                         │
│ Location *         Min Stock Level      │
│ [Storage A    ]     [10            ]   │
│                                         │
│ Description                             │
│ [Rice bags for distribution...]         │
│                                         │
│ Supplier           Cost Per Unit        │
│ [ABC Suppliers]    [25.50         ]    │
│                                         │
│ Program                                 │
│ [School Feeding Program v]              │
│                                         │
│        [Cancel]  [Update Item]          │
└─────────────────────────────────────────┘
```

**Usage:**
- Modify any field as needed
- Click "Update Item" to save changes
- Click "Cancel" to discard changes

---

### 3. Delete Button 🗑️
**Appearance:** Red button with trash icon  
**Location:** Last button in Actions column  
**Click Behavior:** Shows confirmation dialog

```
┌─────────────────────────────────────┐
│  ⚠️  Confirm Delete                 │
├─────────────────────────────────────┤
│                                     │
│  Are you sure you want to delete    │
│  this item?                         │
│                                     │
│  This action cannot be undone.      │
│                                     │
│        [Cancel]  [OK]               │
└─────────────────────────────────────┘
```

**Usage:**
- Click "OK" to permanently delete the item
- Click "Cancel" to keep the item

---

## 🎯 Color Coding

| Button | Color | Meaning |
|--------|-------|---------|
| **Stock Adjust** | 🔵 Blue | Neutral action (can add or remove) |
| **Edit** | 🟢 Green | Safe action (modify data) |
| **Delete** | 🔴 Red | Destructive action (permanent removal) |

---

## 📱 Responsive Behavior

### Desktop View (> 1024px):
All three buttons visible in a row

```
[📦 Stock] [✏️ Edit] [🗑️ Delete]
```

### Tablet View (768px - 1024px):
Buttons may stack vertically or show icons only

```
[📦]
[✏️]
[🗑️]
```

### Mobile View (< 768px):
May appear as dropdown menu or require scrolling

---

## 🔍 Hover Effects

When you hover over each button:

### Stock Adjust:
```
┌────────────────┐
│  Stock In/Out  │ ← Tooltip appears
│       ↑        │
│   (highlighted)│
└────────────────┘
```

### Edit:
```
┌────────────────┐
│  Edit Item     │ ← Tooltip appears
│       ✎        │
│   (highlighted)│
└────────────────┘
```

### Delete:
```
┌────────────────┐
│  Delete Item   │ ← Tooltip appears
│       🗑        │
│   (highlighted)│
└────────────────┘
```

---

## 💡 Quick Reference

| Action | Button | Icon | Color | Confirmation? |
|--------|--------|------|-------|---------------|
| **Adjust Stock** | First | ↑↓ Arrows | Blue | Yes (Prompt) |
| **Edit** | Middle | Pencil | Green | No (Direct Save) |
| **Delete** | Last | Trash Can | Red | Yes (Dialog) |

---

## ✅ Visual Checklist

Before performing any action, verify:

### For Edit/Delete Access:
- [ ] You see action buttons (not "View Only")
- [ ] Buttons are colored (blue, green, red)
- [ ] Icons are visible (arrow, pencil, trash)

### Before Clicking Delete:
- [ ] You're certain about deletion
- [ ] Item is not referenced elsewhere
- [ ] You understand it's permanent

### Before Adjusting Stock:
- [ ] You have valid reason for adjustment
- [ ] You know current quantity
- [ ] You understand impact of change

---

## 🎨 Screenshot Guide

### What to Expect When You Click:

1. **Click Edit** → Modal slides in from right
2. **Click Delete** → Browser dialog pops up
3. **Click Stock Adjust** → Prompt appears

### Animation Effects:
- **Modal Open**: Smooth slide-in animation
- **Button Hover**: Slight color brightening
- **Success Message**: Fade in at top of page

---

## 📞 Still Confused?

Look for these visual cues:
- **Blue button** = Safe to click, adjusts numbers
- **Green button** = Safe to click, changes details
- **Red button** = Warning! Permanent action
- **Gray text** = You can't click (view only)

---

**Remember:** If you don't see the colored buttons, you only have view-only access! 👀
