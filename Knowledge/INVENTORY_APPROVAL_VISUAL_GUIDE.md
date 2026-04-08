# Inventory Request Approval Page - Visual Guide

## 📸 Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INVENTORY REQUEST APPROVALS                                            │
│  Management / Inventory / Request Approvals                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   🕐         │  │   ✓          │  │   ✗          │  │   📦         ││
│  │   5          │  │   12         │  │   3          │  │   2          ││
│  │ Pending      │  │ Approved     │  │ Rejected     │  │ Partial      ││
│  │ Requests     │  │              │  │              │  │              ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  🔍 Search...           Status: [All ▼]    Urgency: [All ▼]            │
│                         (pending,        (urgent, high,                │
│                          approved,        normal, low)                  │
│                          rejected,                                       │
│                          partial)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  All Requests (22)                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ID │ Item      │ Requestor │ Dept  │ Qty  │ Stock │ Urgency │ ⚡ │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ #1 │ A4 Paper  │ John Doe  │ Sales │ 10   │ 500   │ 🔴 URGENT│ ✓✗│  │
│  │    │ Reams     │ john@...  │       │ reams│ reams │         │    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ #2 │ Ballpoint │ Jane Smith│ HR    │ 50   │ 1000  │ 🟠 HIGH  │ ✓✗│  │
│  │    │ Pens      │ jane@...  │       │ pcs  │ pcs   │         │    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ #3 │ Notebooks │ Bob Wilson│ Fin.  │ 25   │ 300   │ 🟢 NORMAL│ ✓✗│  │
│  │    │           │ bob@...   │       │ pcs  │ pcs   │         │    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ #4 │ Printer   │ Alice     │ IT    │ 5    │ 50    │ ⚫ LOW   │✓ ✗│  │
│  │    │ Ink       │ alice@... │       │ pcs  │ pcs   │         │    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Approve Modal

```
┌─────────────────────────────────────────────────────┐
│  Approve Request #1                            ✗   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  REQUEST DETAILS                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ Item:            A4 Paper Reams              │  │
│  │ Requestor:       John Doe                    │  │
│  │ Requested Qty:   10 reams                    │  │
│  │ Current Stock:   500 reams                   │  │
│  │ Reason:          Need for monthly reports    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Quantity to Approve *                              │
│  ┌──────────────────────────────────────────────┐  │
│  │ [10                                      ]   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cancel          ✓ Confirm Approval          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Partial Approval Warning (appears when qty < requested):
```
⚠️ This will be a partial approval. Requestor will 
   receive 5 out of 10 requested.
```

### Insufficient Stock Warning (appears when qty > stock):
```
⚠️ Warning: Current stock (50) is less than approval 
   quantity!
```

---

## ❌ Reject Modal

```
┌─────────────────────────────────────────────────────┐
│  Reject Request #1                             ✗   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  REQUEST DETAILS                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ Item:            A4 Paper Reams              │  │
│  │ Requestor:       John Doe                    │  │
│  │ Requested Qty:   10 reams                    │  │
│  │ Reason:          Need for monthly reports    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Rejection Reason *                                 │
│  ┌──────────────────────────────────────────────┐  │
│  │ Insufficient stock available. Please resubmit│  │
│  │ with lower quantity next month when new     │  │
│  │ stock arrives.                              │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ℹ️ A rejection email will be sent to john@...     │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cancel          ✗ Confirm Rejection         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding Reference

### Urgency Colors:
- 🔴 **Urgent** - Red (#dc3545) - Immediate attention needed
- 🟠 **High** - Orange (#fd7e14) - Priority request
- 🟢 **Normal** - Green (#28a745) - Standard processing
- ⚫ **Low** - Gray (#6c757d) - Can wait

### Status Colors:
- 🟡 **Pending** - Yellow background (#fff3cd) - Awaiting action
- 🟢 **Approved** - Green background (#d4edda) - Fully approved
- 🔴 **Rejected** - Red background (#f8d7da) - Declined
- 🟠 **Partially Approved** - Orange background (#ffe5d0) - Partial qty

### Stock Level Indicators:
- 🟢 **Good Stock** - Green text on light green (#e8f5e9)
- 🔴 **Low Stock** - Red text on light red (#ffebee)

---

## 📊 Sample Data Display

### Table Row Examples:

#### High Priority Request:
```
┌────────────────────────────────────────────────────────────────┐
│ #5 | USB Flash    | Mike Johnson | Accounting | 20 pcs | 100  │
│      Drives 16GB  | mike@...     │            | 🔴URGENT| ✓✗ │
│                     |              |            | 🟢GOOD |    │
└────────────────────────────────────────────────────────────────┘
```

#### Low Priority Request (Already Approved):
```
┌────────────────────────────────────────────────────────────────┐
│ #2 | Whiteboard   | Sarah Lee    | Marketing  | 15 pcs | 400  │
│      Markers      | sarah@...    │            | ⚫LOW   | ✓  │
│                     |              |            | 🟢GOOD |    │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Visualization

### Approval Flow:
```
Request Submitted
       ↓
Email sent to managers
       ↓
Manager reviews in dashboard
       ↓
Clicks "Approve" button
       ↓
Modal opens with details
       ↓
Enters approval quantity
       ↓
Clicks "Confirm Approval"
       ↓
┌──────────────────────────┐
│ DATABASE TRIGGER FIRES   │
│ • Stock reduced          │
│ • Transaction logged     │
│ • Status updated         │
│ • Email sent to requestor│
└──────────────────────────┘
       ↓
Success message shown
       ↓
Dashboard refreshes
```

### Rejection Flow:
```
Request Submitted
       ↓
Email sent to managers
       ↓
Manager reviews in dashboard
       ↓
Clicks "Reject" button
       ↓
Modal opens with details
       ↓
Enters rejection reason
       ↓
Clicks "Confirm Rejection"
       ↓
┌──────────────────────────┐
│ EMAIL SENT TO REQUESTOR  │
│ • Status = rejected      │
│ • Reason displayed       │
│ • Manager contact info   │
└──────────────────────────┘
       ↓
Success message shown
       ↓
Dashboard refreshes
```

---

## 📱 Mobile Responsive Design

### Desktop View (>768px):
- 4 stat cards in one row
- Full table with all columns visible
- Horizontal action buttons

### Tablet View (768px):
- 2 stat cards per row
- Scrollable table horizontally
- Stacked action buttons

### Mobile View (<768px):
- 1 stat card per row (stacked)
- Simplified table with key columns
- Vertical action buttons
- Collapsible filters

---

## 🎯 Key UI Elements

### 1. Statistics Cards
- Large numbers for quick scanning
- Icons matching stat type
- Hover animation (lift effect)
- Color-coded backgrounds

### 2. Filter Bar
- Search box with icon
- Dropdown selects for status/urgency
- Clean, minimal design
- Instant filtering (no apply button)

### 3. Data Table
- Alternating row colors on hover
- Left border color shows status
- Compact but readable spacing
- Clear column headers

### 4. Action Buttons
- Green approve button with checkmark icon
- Red reject button with X icon
- Hover effects (lift + shadow)
- Disabled state for processed requests

### 5. Modals
- Dark overlay backdrop
- Click outside to close
- Scrollable content area
- Fixed footer with actions

---

## 💡 UX Best Practices Implemented

✅ **Clear Visual Hierarchy**
- Page title → Stats → Filters → Data
- Most important info always visible

✅ **Immediate Feedback**
- Hover states on interactive elements
- Loading messages during API calls
- Success/error alerts after actions

✅ **Prevent Errors**
- Warnings for edge cases
- Validation before submission
- Confirmation modals

✅ **Efficient Navigation**
- Keyboard accessible
- Click outside to close modals
- Breadcrumb navigation

✅ **Accessible Design**
- High contrast colors
- Clear labels on all inputs
- Descriptive button text

---

## 🖱️ Interactive Elements

### Hover Effects:
- Table rows: Light gray background
- Stat cards: Lift up 2px + shadow
- Buttons: Lift up 1px + shadow + darken
- Close button: Gray background

### Transitions:
- All hover effects: 0.2s ease
- Modal open/close: 0.3s fade
- Filter changes: Instant

### Focus States:
- Input fields: Blue border + glow
- Buttons: Outline ring
- Links: Underline

---

This visual guide helps understand the layout and interaction patterns of the approval page!
