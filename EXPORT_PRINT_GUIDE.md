# Child Profile Export / Print Guide

## Overview
The child profile export feature uses the browser's built-in print functionality to generate a PDF or printed copy of the child's complete profile.

---

## How It Works

### Current Implementation
1. **Click "Print / Save PDF" button** in the child profile header
2. **Opens a new browser tab** with a formatted, printable version of the child's profile
3. **Shows control panel** with three buttons:
   - 🖨️ **Print** - Opens print dialog
   - 💾 **Save as PDF** - Shows instructions and opens print dialog where you can select "Save as PDF"
   - ✖ **Close** - Closes the preview window
4. **User chooses their preferred action**:
   - Click "Print" to print directly
   - Click "Save as PDF" to save as PDF file
   - Click "Close" to cancel

---

## What Gets Printed/Exported

### Basic Information Section
- ✅ Full Name (First Middle Last)
- ✅ **Nickname** (if available) - *NEW!*
- ✅ Gender
- ✅ Date of Birth
- ✅ Estimated Age
- ✅ Blood Group
- ✅ Nationality
- ✅ Religion
- ✅ Place of Birth
- ✅ Admission Date
- ✅ Admitted By
- ✅ Current Status
- ✅ Health Status
- ✅ Disability Status & Description

### Guardian Information
- Complete list of guardians with:
  - Name
  - Relationship
  - Phone
  - Address
  - Alive Status
  - Notes

### Legal Documents
- Document table with:
  - Type
  - Document Number
  - Issue Date
  - Expiry Date
  - Verified Status

### Medical Records
- Medical conditions
- Vaccination status
- Allergies
- Medications
- Doctor/Hospital names
- Last checkup date

### Education Records
- School name
- Grade level
- Enrollment date
- Performance notes

### Case History
- Case type
- Case date
- Notes
- Social worker name

---

## How to Save as PDF

### Method 1: Using Print Dialog (All Browsers)
1. Click **"Print / Save PDF"** button
2. When print dialog opens, look for **"Destination"** or **"Printer"** option
3. Select **"Save as PDF"** or **"Microsoft Print to PDF"** instead of a physical printer
4. Click **"Save"** or **"Print"**
5. Choose location and filename
6. PDF will be saved to your computer

### Method 2: Browser Menu (Alternative)
1. After clicking export, right-click anywhere in the print preview
2. Select **"Print..."** from context menu
3. Follow steps in Method 1

---

## Features

### Updated Button Label
- **Old:** "Export Profile" with download icon
- **New:** "Print / Save PDF" with printer icon
- More accurate description of functionality

### Control Panel
The preview window now includes a floating control panel with:
- **🖨️ Print Button** - Directly opens print dialog
- **💾 Save as PDF Button** - Shows helpful instructions, then opens print dialog
- **✖ Close Button** - Closes the preview window
- Controls are positioned in top-right corner for easy access
- Controls don't appear in printed/PDF output

### Nickname Support
- Nickname now appears in the exported profile if the child has one saved
- Displays right after Full Name in Basic Information section

### Professional Formatting
- Clean, organized layout with sections
- Color-coded section headers
- Proper tables for records
- Optimized for both printing and PDF generation

### Print-Only Elements
- "Print Again" and "Close" buttons only appear in the preview window
- These buttons don't show up in the final printed/PDF version

---

## Browser Compatibility

| Browser | Print to PDF Support | Notes |
|---------|---------------------|-------|
| Chrome | ✅ Native | Best support - "Save as PDF" option |
| Firefox | ✅ Via plugin | May need "Save as PDF" extension |
| Edge | ✅ Native | "Microsoft Print to PDF" option |
| Safari | ✅ Native | "Save as PDF" in Mac, iOS has share options |
| Opera | ✅ Native | Similar to Chrome |

---

## Troubleshooting

### Issue: Print dialog doesn't appear
**Solution:** 
- The new interface shows buttons instead of auto-printing
- Click the "🖨️ Print" or "💾 Save as PDF" button in the preview window
- If popup is blocked, allow popups for your application URL

### Issue: Want to save as PDF but only see print options
**Solution:**
1. Click the "💾 Save as PDF" button in the preview
2. Read the instructions that appear
3. In the print dialog, look for "Destination" or "Printer" dropdown
4. Select "Save as PDF" or "Microsoft Print to PDF"
5. Complete the save process

### Issue: Content looks cut off or misaligned
**Solution:**
- In print settings, select "Fit to page" or "Scale to fit"
- Ensure paper size is set correctly (usually Letter or A4)
- Try landscape orientation for wider tables

### Issue: Can't save as PDF
**Solution:**
- Make sure you have a PDF printer installed
- Windows: "Microsoft Print to PDF" should be pre-installed
- Mac: Use "Save as PDF" dropdown in print dialog
- Install Adobe Acrobat or similar PDF software if needed

### Issue: Nickname not showing in export
**Solution:**
1. Verify nickname is saved in the child's profile
2. Edit the child profile and add a nickname if missing
3. Save and try exporting again

---

## Technical Details

### Files Modified
- `src/services/childService.js` - Export logic and HTML generation
- `src/components/childProfile/ChildLayout.js` - Button label update

### Key Functions
```javascript
downloadChildProfilePDF(id)
├── Fetches child data via API
├── Generates formatted HTML
├── Opens new window
├── Writes HTML to window
└── Triggers print after 500ms
```

### HTML Generation
- Uses template literals for clean HTML structure
- Includes inline CSS for consistent styling
- Responsive grid layout for Basic Information
- Tables for structured data (documents, records, etc.)

---

## Future Enhancements (Potential)

If you want true PDF downloads in the future, consider:

1. **jsPDF Library** - Client-side PDF generation
2. **html2pdf.js** - Converts HTML to PDF automatically
3. **Backend PDF Generation** - Server creates actual PDF file
4. **PDFMake** - Another client-side PDF library

These would require additional dependencies but provide actual file downloads instead of using browser print.

---

## Quick Reference

**To Export/Print:**
1. Navigate to child profile
2. Click **"Print / Save PDF"** button (top right)
3. Choose print destination (printer or PDF)
4. Save or print your document!

**What's Included:**
- ✅ All Basic Information (including nickname)
- ✅ Guardian details
- ✅ Legal documents
- ✅ Medical records
- ✅ Education records
- ✅ Case history

**File Format:**
- Output depends on your browser's print capabilities
- Most common: PDF (via "Save as PDF")
- Also supports: Physical printing

---

## Related Documentation

- Nickname Implementation: `NICKNAME_IMPLEMENTATION.md`
- Profile Updates: `CHILD_PROFILE_UPDATES.md`
- Database Migration: `database/add_nickname_to_children.sql`
