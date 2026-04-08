import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../config/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const EmployeeReport = ({ selectedProgram }) => {
  const [employeesData, setEmployeesData] = useState([]);
  const [departmentDistribution, setDepartmentDistribution] = useState({});
  const [statusDistribution, setStatusDistribution] = useState({
    active: 0,
    inactive: 0,
    former: 0
  });
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchEmployeesData();
  }, [selectedProgram]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const fetchEmployeesData = async () => {
    try {
      setLoading(true);
      let url = `${API_CONFIG.BASE_URL}/api/employees`;
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.employees) {
        const employees = result.employees;
        setEmployeesData(employees);
        setTotalEmployees(employees.length);
        calculateDepartmentDistribution(employees);
        calculateStatusDistribution(employees);
      }
    } catch (error) {
      console.error('Error fetching employees data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Employee Management Report', 14, 22);
    
    // Add timestamp
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    // Add total count
    doc.setFontSize(12);
    doc.text(`Total Employees: ${totalEmployees}`, 14, 42);
    
    // Create table with department distribution
    const tableColumn = ['Department', 'Count', 'Percentage'];
    const tableRows = [];
    
    Object.entries(departmentDistribution).forEach(([dept, count]) => {
      const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : '0.0';
      tableRows.push([dept, count, `${percentage}%`]);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'striped',
      colors: {
        primary: '#474fa8'
      }
    });
    
    // Add status distribution
    const statusY = doc.lastAutoTable.finalY + 10;
    doc.text('Status Distribution', 14, statusY);
    
    const statusTableColumn = ['Status', 'Count', 'Percentage'];
    const statusTableRows = [];
    
    Object.entries(statusDistribution).forEach(([status, count]) => {
      const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : '0.0';
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      statusTableRows.push([statusLabel, count, `${percentage}%`]);
    });
    
    autoTable(doc, {
      head: [statusTableColumn],
      body: statusTableRows,
      startY: statusY + 5,
      theme: 'striped',
      colors: {
        primary: '#474fa8'
      }
    });
    
    doc.save(`Employee_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = [
      ['Employee Management Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Total Employees: ${totalEmployees}`],
      [],
      ['Department Distribution']
    ];
    
    Object.entries(departmentDistribution).forEach(([dept, count]) => {
      const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : '0.0';
      data.push([dept, count, `${percentage}%`]);
    });
    
    data.push([]);
    data.push(['Status Distribution']);
    
    Object.entries(statusDistribution).forEach(([status, count]) => {
      const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : '0.0';
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      data.push([statusLabel, count, `${percentage}%`]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Distribution');
    
    XLSX.writeFile(wb, `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const calculateDepartmentDistribution = (employees) => {
    const distribution = {};
    
    employees.forEach(emp => {
      // Normalize department name: trim whitespace and convert to title case
      let dept = emp.department || 'Unassigned';
      
      // Convert to title case for consistent display (e.g., "shamida shelter" -> "Shamida Shelter")
      dept = dept.trim().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      distribution[dept] = (distribution[dept] || 0) + 1;
    });
    
    setDepartmentDistribution(distribution);
  };

  const calculateStatusDistribution = (employees) => {
    const distribution = {
      active: 0,
      inactive: 0,
      former: 0
    };
    
    employees.forEach(emp => {
      const status = emp.status || (emp.is_active ? 'Active' : 'Inactive');
      if (status === 'Active') {
        distribution.active++;
      } else if (status === 'Inactive') {
        distribution.inactive++;
      } else if (status === 'Former Employee') {
        distribution.former++;
      }
    });
    
    setStatusDistribution(distribution);
  };

  // Prepare chart data for department distribution
  const departmentColors = [
    '#474fa8', '#ff4b5c', '#ffc107', '#831dba', '#acacac',
    '#20c997', '#fd7e14', '#007bff', '#6f42c1', '#e83e8c'
  ];

  const chartData = {
    labels: Object.keys(departmentDistribution).map((dept, index) => 
      `${dept} - ${departmentDistribution[dept]}`
    ),
    datasets: [
      {
        label: 'Number of Employees',
        data: Object.values(departmentDistribution),
        backgroundColor: departmentColors.slice(0, Object.keys(departmentDistribution).length),
        hoverBackgroundColor: departmentColors.slice(0, Object.keys(departmentDistribution).length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = totalEmployees > 0 ? ((value / totalEmployees) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="employee-report-loading">
        <i className='bx bx-loader-alt bx-spin'></i>
        <p>Loading employee report...</p>
      </div>
    );
  }

  return (
    <div className="employee-report-container">
      <div className="employee-report-header">
        <h2>Employee Management Report</h2>
        
        <p>Total Employees: <strong>{totalEmployees}</strong></p>
        
        {/* Export Button */}
        <div className="export-dropdown">
          <button 
            className="export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={totalEmployees === 0}
          >
            <i className='bx bx-download'></i>
            {totalEmployees === 0 ? 'No Data to Export' : 'Export Report'}
          </button>
          
          {showExportMenu && (
            <div className="export-menu">
              <button className="export-menu-item" onClick={handleExportPDF}>
                <i className='bx bx-file-pdf'></i>
                Export as PDF
              </button>
              <button className="export-menu-item" onClick={handleExportExcel}>
                <i className='bx bx-file-excel'></i>
                Export as Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="employee-report-content">
        <div className="pie-chart-wrapper">
          <div className="pie-chart-container">
            {totalEmployees > 0 && Object.keys(departmentDistribution).length > 0 ? (
              <Pie data={chartData} options={chartOptions} />
            ) : (
              <div className="no-data-message">
                <i className='bx bx-info-circle'></i>
                <p>No employees data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="employee-statistics">
          <h3>Department & Status Statistics</h3>
          
          <h4>Department Breakdown</h4>
          <div className="stats-grid">
            {Object.entries(departmentDistribution).map(([dept, count]) => {
              const percentage = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : '0.0';
              return (
                <div key={dept} className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: departmentColors[Object.keys(departmentDistribution).indexOf(dept) % departmentColors.length] }}>
                    <i className='bx bx-building'></i>
                  </div>
                  <div className="stat-info">
                    <h4>{count}</h4>
                    <p>{dept}</p>
                    <small>{percentage}%</small>
                  </div>
                </div>
              );
            })}
          </div>

          <h4>Status Breakdown</h4>
          <div className="status-stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#20c997' }}>
                <i className='bx bx-user-check'></i>
              </div>
              <div className="stat-info">
                <h4>{statusDistribution.active}</h4>
                <p>Active</p>
                <span>{totalEmployees > 0 ? ((statusDistribution.active / totalEmployees) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#ffc107' }}>
                <i className='bx bx-user-x'></i>
              </div>
              <div className="stat-info">
                <h4>{statusDistribution.inactive}</h4>
                <p>Inactive</p>
                <span>{totalEmployees > 0 ? ((statusDistribution.inactive / totalEmployees) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#acacac' }}>
                <i className='bx bx-user-minus'></i>
              </div>
              <div className="stat-info">
                <h4>{statusDistribution.former}</h4>
                <p>Former Employee</p>
                <span>{totalEmployees > 0 ? ((statusDistribution.former / totalEmployees) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>

          <div className="summary-section">
            <h4>Summary</h4>
            <ul className="summary-list">
              <li>
                <span className="dot" style={{ backgroundColor: '#20c997' }}></span>
                <span><strong>Active Employees:</strong> {statusDistribution.active} currently working</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#ffc107' }}></span>
                <span><strong>Inactive Employees:</strong> {statusDistribution.inactive} temporarily inactive</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#acacac' }}></span>
                <span><strong>Former Employees:</strong> {statusDistribution.former} no longer with the organization</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#474fa8' }}></span>
                <span><strong>Total Departments:</strong> {Object.keys(departmentDistribution).length} departments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReport;
