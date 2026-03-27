import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export Utils - Provides PDF, Excel, and Print export functionality
 */
export const ExportUtils = {
  /**
   * Export data to PDF
   * @param {string} title - Title of the document
   * @param {array} columns - Column headers
   * @param {array} data - Data rows
   * @param {string} filename - Output filename (without extension)
   */
  exportToPDF: (title, columns, data, filename = 'export') => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      // Add timestamp
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
      
      // Create table
      const tableColumn = columns.map(col => col.header || col);
      const tableRows = [];
      
      data.forEach(row => {
        const rowData = columns.map(col => {
          // Try multiple ways to get the value
          let value;
          
          // First try: row has accessor property (e.g., row.field)
          if (col.accessor && row[col.accessor] !== undefined) {
            value = row[col.accessor];
          } 
          // Second try: row has 'value' property (common pattern)
          else if (row.value !== undefined) {
            value = row.value;
          }
          // Third try: direct property access
          else if (col && row[col] !== undefined) {
            value = row[col];
          }
          // Default: empty string
          else {
            value = '';
          }
          
          return value !== null && value !== undefined ? String(value) : '';
        });
        tableRows.push(rowData);
      });
      
      // Use autoTable from the imported module
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });
      
      // Save the PDF
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF');
    }
  },

  /**
   * Export data to Excel (XLSX format)
   * @param {array} columns - Column headers
   * @param {array} data - Data rows
   * @param {string} sheetName - Name of the Excel sheet
   * @param {string} filename - Output filename (without extension)
   */
  exportToExcel: (columns, data, sheetName = 'Sheet1', filename = 'export') => {
    try {
      // Prepare data for Excel
      const excelData = data.map(row => {
        const excelRow = {};
        columns.forEach(col => {
          const header = col.header || col;
          const value = row[col.accessor] !== undefined ? row[col.accessor] : row[col];
          excelRow[header] = value !== null && value !== undefined ? value : '';
        });
        return excelRow;
      });
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = columns.map(col => ({
        wch: Math.max(
          (col.header || col).length,
          ...data.map(row => {
            const value = row[col.accessor] !== undefined ? row[col.accessor] : row[col];
            return value ? String(value).length : 0;
          })
        ) + 2
      }));
      ws['!cols'] = colWidths;
      
      // Style header row
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Export file
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel');
    }
  },

  /**
   * Print data as a formatted table
   * @param {string} title - Title of the document
   * @param {array} columns - Column headers
   * @param {array} data - Data rows
   */
  printData: (title, columns, data) => {
    try {
      // Create print window content
      const printWindow = window.open('', '_blank');
      
      // Build HTML table
      let tableHTML = `
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                @page {
                  size: landscape;
                  margin: 1cm;
                }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #3B82F6;
                  color: white;
                  font-weight: bold;
                }
                tr:nth-child(even) {
                  background-color: #f9fafb;
                }
                h1 {
                  color: #1f2937;
                  font-size: 18px;
                  margin-bottom: 10px;
                }
                .timestamp {
                  color: #6b7280;
                  font-size: 9px;
                  margin-bottom: 20px;
                }
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  ${columns.map(col => `<th>${col.header || col}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${columns.map(col => {
                      const value = row[col.accessor] !== undefined ? row[col.accessor] : row[col];
                      return `<td>${value !== null && value !== undefined ? String(value) : ''}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      printWindow.document.write(tableHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error('Error printing:', error);
      alert('Failed to print');
    }
  }
};

export default ExportUtils;
