import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ChildReport = ({ selectedProgram }) => {
  const [childrenData, setChildrenData] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState({
    infant: 0,
    age1to5: 0,
    age5to10: 0,
    age10to15: 0,
    above15: 0
  });
  const [loading, setLoading] = useState(true);
  const [totalChildren, setTotalChildren] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchChildrenData();
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

  const fetchChildrenData = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/children';
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        const children = result.data;
        setChildrenData(children);
        setTotalChildren(children.length);
        calculateAgeDistribution(children);
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Child Age Distribution Report', 14, 22);
    
    // Add timestamp
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    // Add total count
    doc.setFontSize(12);
    doc.text(`Total Children: ${totalChildren}`, 14, 42);
    
    // Create table with age distribution
    const tableColumn = ['Age Group', 'Count', 'Percentage'];
    const tableRows = [];
    
    const ageGroups = [
      { label: 'Infants (<1)', value: ageDistribution.infant },
      { label: 'Ages 1-5', value: ageDistribution.age1to5 },
      { label: 'Ages 5-10', value: ageDistribution.age5to10 },
      { label: 'Ages 10-15', value: ageDistribution.age10to15 },
      { label: 'Above 15', value: ageDistribution.above15 }
    ];
    
    ageGroups.forEach(group => {
      const percentage = totalChildren > 0 ? ((group.value / totalChildren) * 100).toFixed(1) : '0.0';
      tableRows.push([group.label, group.value, `${percentage}%`]);
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
    
    doc.save(`Child_Age_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = [
      ['Child Age Distribution Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Total Children: ${totalChildren}`],
      [],
      ['Age Group', 'Count', 'Percentage']
    ];
    
    const ageGroups = [
      { label: 'Infants (<1)', value: ageDistribution.infant },
      { label: 'Ages 1-5', value: ageDistribution.age1to5 },
      { label: 'Ages 5-10', value: ageDistribution.age5to10 },
      { label: 'Ages 10-15', value: ageDistribution.age10to15 },
      { label: 'Above 15', value: ageDistribution.above15 }
    ];
    
    ageGroups.forEach(group => {
      const percentage = totalChildren > 0 ? ((group.value / totalChildren) * 100).toFixed(1) : '0.0';
      data.push([group.label, group.value, `${percentage}%`]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Age Distribution');
    
    XLSX.writeFile(wb, `Child_Age_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const calculateAgeDistribution = (children) => {
    const distribution = {
      infant: 0,
      age1to5: 0,
      age5to10: 0,
      age10to15: 0,
      above15: 0
    };

    const now = new Date();

    children.forEach(child => {
      let age = null;

      // Use estimated_age if available
      if (child.estimated_age !== null && child.estimated_age !== undefined) {
        age = child.estimated_age;
      } 
      // Fallback to date_of_birth calculation
      else if (child.date_of_birth) {
        const birthDate = new Date(child.date_of_birth);
        age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        const dayDiff = now.getDate() - birthDate.getDate();
        
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age = age - 1;
        }
      }

      // Categorize by age groups
      if (age !== null) {
        if (age < 1) {
          distribution.infant++;
        } else if (age >= 1 && age < 5) {
          distribution.age1to5++;
        } else if (age >= 5 && age < 10) {
          distribution.age5to10++;
        } else if (age >= 10 && age < 15) {
          distribution.age10to15++;
        } else {
          distribution.above15++;
        }
      }
    });

    setAgeDistribution(distribution);
  };

  const chartData = {
    labels: [
      `Infant (<1) - ${ageDistribution.infant}`,
      `1-5 Years - ${ageDistribution.age1to5}`,
      `5-10 Years - ${ageDistribution.age5to10}`,
      `10-15 Years - ${ageDistribution.age10to15}`,
      `Above 15 - ${ageDistribution.above15}`
    ],
    datasets: [
      {
        label: 'Number of Children',
        data: [
          ageDistribution.infant,
          ageDistribution.age1to5,
          ageDistribution.age5to10,
          ageDistribution.age10to15,
          ageDistribution.above15
        ],
        backgroundColor: [
          '#ff4b5c', // Red for Infant (var(--danger))
          '#474fa8', // Primary blue for 1-5 (var(--primary))
          '#ffc107', // Yellow for 5-10 (var(--warning))
          '#831dba', // Purple for 10-15 (var(--success))
          '#acacac'  // Grey for Above 15 (var(--grey))
        ],
        hoverBackgroundColor: [
          '#ff4b5c',
          '#474fa8',
          '#ffc107',
          '#831dba',
          '#acacac'
        ],
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
            const percentage = totalChildren > 0 ? ((value / totalChildren) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="child-report-loading">
        <i className='bx bx-loader-alt bx-spin'></i>
        <p>Loading child report...</p>
      </div>
    );
  }

  return (
    <div className="child-report-container">
      <div className="child-report-header">
        <h2>Child Age Distribution Report</h2>
        
        <p>Total Children: <strong>{totalChildren}</strong></p>
        
        {/* Export Button */}
        <div className="export-dropdown">
          <button 
            className="export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={totalChildren === 0}
          >
            <i className='bx bx-download'></i>
            {totalChildren === 0 ? 'No Data to Export' : 'Export Report'}
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

      <div className="child-report-content">
        <div className="pie-chart-wrapper">
          <div className="pie-chart-container">
            {totalChildren > 0 ? (
              <Pie data={chartData} options={chartOptions} />
            ) : (
              <div className="no-data-message">
                <i className='bx bx-info-circle'></i>
                <p>No children data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="age-statistics">
          <h3>Age Group Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#ff4b5c' }}>
                <i className='bx bx-baby-carriage'></i>
              </div>
              <div className="stat-info">
                <h4>{ageDistribution.infant}</h4>
                <p>Infants (&lt;1)</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#474fa8' }}>
                <i className='bx bx-smile'></i>
              </div>
              <div className="stat-info">
                <h4>{ageDistribution.age1to5}</h4>
                <p>Ages 1-5</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#ffc107' }}>
                <i className='bx bx-child'></i>
              </div>
              <div className="stat-info">
                <h4>{ageDistribution.age5to10}</h4>
                <p>Ages 5-10</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#831dba' }}>
                <i className='bx bx-user-circle'></i>
              </div>
              <div className="stat-info">
                <h4>{ageDistribution.age10to15}</h4>
                <p>Ages 10-15</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#acacac' }}>
                <i className='bx bx-user'></i>
              </div>
              <div className="stat-info">
                <h4>{ageDistribution.above15}</h4>
                <p>Above 15</p>
              </div>
            </div>
          </div>

          <div className="summary-section">
            <h4>Summary</h4>
            <ul className="summary-list">
              <li>
                <span className="dot" style={{ backgroundColor: '#ff4b5c' }}></span>
                <span><strong>Infants:</strong> {ageDistribution.infant} children (under 1 year)</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#474fa8' }}></span>
                <span><strong>Early Childhood:</strong> {ageDistribution.age1to5} children (ages 1-5)</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#ffc107' }}></span>
                <span><strong>Middle Childhood:</strong> {ageDistribution.age5to10} children (ages 5-10)</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#831dba' }}></span>
                <span><strong>Pre-Teen:</strong> {ageDistribution.age10to15} children (ages 10-15)</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#acacac' }}></span>
                <span><strong>Teenagers:</strong> {ageDistribution.above15} children (above 15 years)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildReport;
