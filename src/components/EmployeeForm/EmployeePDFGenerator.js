import jsPDF from 'jspdf';
import 'jspdf-autotable';

const EmployeePDFGenerator = {
  // Generate employee report PDF
  generateEmployeeReport: (employee, documents = []) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text('Employee Information Report', 20, 20);
    
    // Add some spacing
    let yPos = 40;
    
    // Employee details section
    doc.setFontSize(16);
    doc.text('Employee Details', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    
    // Draw a table-like structure for employee details
    const employeeDetails = [
      ['Employee ID', employee.employee_id || 'N/A'],
      ['Full Name', employee.full_name || employee.fullName || 'N/A'],
      ['Email', employee.email || 'N/A'],
      ['Phone', employee.phone || 'N/A'],
      ['Department', employee.department || 'N/A'],
      ['Position', employee.position || 'N/A'],
      ['Hire Date', employee.hire_date || employee.hireDate || 'N/A'],
      ['Salary', employee.salary ? `${parseFloat(employee.salary).toFixed(2)} Birr` : 'N/A'],
      ['Address', employee.address || 'N/A'],
      ['Emergency Contact', employee.emergency_contact || employee.emergencyContact || 'N/A'],
      ['Emergency Phone', employee.emergency_phone || employee.emergencyPhone || 'N/A']
    ];
    
    // Add employee details to the PDF
    employeeDetails.forEach(detail => {
      doc.text(`${detail[0]}:`, 25, yPos);
      doc.text(String(detail[1] || 'N/A'), 80, yPos);
      yPos += 7;
    });
    
    // Add leave information
    yPos += 10;
    doc.setFontSize(16);
    doc.text('Leave Information', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    const leaveDetails = [
      ['Annual Leave Days', employee.annual_leave_days || employee.annualLeaveDays || 'N/A'],
      ['Annual Leave Used', employee.used_annual_leave || employee.usedAnnualLeave || 'N/A'],
      ['Sick Leave Days', employee.sick_leave_days || employee.sickLeaveDays || 'N/A'],
      ['Sick Leave Used', employee.used_sick_leave || employee.usedSickLeave || 'N/A']
    ];
    
    leaveDetails.forEach(leave => {
      doc.text(`${leave[0]}:`, 25, yPos);
      doc.text(String(leave[1] || 'N/A'), 80, yPos);
      yPos += 7;
    });
    
    // Add recognition information
    if (employee.recognition || employee.recognition) {
      yPos += 10;
      doc.setFontSize(16);
      doc.text('Recognition/Awards', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text(`Recognition: ${employee.recognition || 'N/A'}`, 25, yPos);
      yPos += 7;
      doc.text(`Date: ${employee.recognition_date || employee.recognitionDate || 'N/A'}`, 25, yPos);
      yPos += 10;
    }
    
    // Add documents section if any exist
    if (documents && documents.length > 0) {
      yPos += 10;
      doc.setFontSize(16);
      doc.text('Documents', 20, yPos);
      yPos += 10;
      
      // Add table header
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Document Name', 25, yPos);
      doc.text('Type', 80, yPos);
      doc.text('Issue Date', 110, yPos);
      doc.text('Expiry Date', 140, yPos);
      doc.text('Status', 170, yPos);
      doc.setFont(undefined, 'normal');
      
      yPos += 7;
      doc.line(20, yPos, 200, yPos); // Draw line
      
      yPos += 5;
      
      // Add document rows
      documents.forEach(docItem => {
        doc.text(String(docItem.name || 'N/A'), 25, yPos);
        doc.text(String(docItem.type || 'N/A'), 80, yPos);
        doc.text(String(docItem.issue_date || docItem.issueDate || 'N/A'), 110, yPos);
        doc.text(String(docItem.expiry_date || docItem.expiryDate || 'N/A'), 140, yPos);
        
        // Status based on expiry date
        const status = docItem.expiry_date || docItem.expiryDate ? 
          (new Date(docItem.expiry_date || docItem.expiryDate) < new Date() ? 'Expired' : 'Valid') : 
          'N/A';
        doc.text(String(status), 170, yPos);
        
        yPos += 7;
      });
    }
    
    // Footer and Stamp
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 20, 287);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 120, 287);
      
      // Add stamp to all pages
      addStampToPage(doc);
    }
    
    // Save the PDF
    doc.save(`Employee_Report_${employee.employee_id || employee.employeeId || 'unknown'}.pdf`);
  },

  // Generate document-specific PDF
  generateDocumentPDF: (employee, document) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text('Employee Document Details', 20, 20);
    
    let yPos = 40;
    
    // Employee info
    doc.setFontSize(16);
    doc.text('Employee Information', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Name: ${String(employee.full_name || employee.fullName || 'N/A')}`, 25, yPos);
    yPos += 7;
    doc.text(`Employee ID: ${String(employee.employee_id || employee.employeeId || 'N/A')}`, 25, yPos);
    yPos += 7;
    doc.text(`Department: ${String(employee.department || 'N/A')}`, 25, yPos);
    yPos += 10;
    
    // Document details
    doc.setFontSize(16);
    doc.text('Document Details', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Document Name: ${String(document.name || 'N/A')}`, 25, yPos);
    yPos += 7;
    doc.text(`Document Type: ${String(document.type || 'N/A')}`, 25, yPos);
    yPos += 7;
    doc.text(`Issue Date: ${String(document.issue_date || document.issueDate || 'N/A')}`, 25, yPos);
    yPos += 7;
    doc.text(`Expiry Date: ${String(document.expiry_date || document.expiryDate || 'N/A')}`, 25, yPos);
    yPos += 7;
    doc.text(`Upload Date: ${String(document.upload_date || document.uploadDate || new Date().toLocaleDateString())}`, 25, yPos);
    yPos += 7;
    if (document.notes) {
      doc.text(`Notes: ${String(document.notes)}`, 25, yPos);
      yPos += 7;
    }
    
    // Status
    const status = document.expiry_date || document.expiryDate ? 
      (new Date(document.expiry_date || document.expiryDate) < new Date() ? 'EXPIRED' : 'VALID') : 
      'NO EXPIRY';
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 0, 0); // Red for expired, green for valid
    if ((document.expiry_date || document.expiryDate) && new Date(document.expiry_date || document.expiryDate) < new Date()) {
      doc.text(`STATUS: ${String(status)}`, 25, yPos);
    } else if (document.expiry_date || document.expiryDate) {
      doc.setTextColor(0, 128, 0); // Green
      doc.text(`STATUS: ${String(status)}`, 25, yPos);
    } else {
      doc.setTextColor(0, 0, 0); // Black
      doc.text(`STATUS: ${String(status)}`, 25, yPos);
    }
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    // Add stamp to the page
    addStampToPage(doc);
    
    // Footer
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 287);
    
    
    
    // Save the PDF
    doc.save(`${document.type}_${document.name}.pdf`);
  }
};

// Helper function to add stamp to PDF
const addStampToPage = (doc) => {
  // Load the stamp image and add it to the PDF
  // Position stamp in bottom-right corner to overlay on text content
  try {
    // Add the stamp image with full opacity
    doc.addImage('/Stamp/shamida stamp-Photoroom.png', 'PNG', 135, 230, 50, 40); // x, y, width, height - Bottom right corner
  } catch (e) {
    console.warn('Could not add stamp to PDF:', e);
  }
};

export default EmployeePDFGenerator;