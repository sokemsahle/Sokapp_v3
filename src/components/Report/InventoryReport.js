import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../config/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const InventoryReport = ({ selectedProgram }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState({});
  const [statusDistribution, setStatusDistribution] = useState({
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchInventoryData();
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

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      let url = `${API_CONFIG.BASE_URL}/api/inventory`;
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.items) {
        const items = result.items;
        setInventoryData(items);
        setTotalItems(items.length);
        calculateCategoryDistribution(items);
        calculateStatusDistribution(items);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };



  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Inventory Management Report', 14, 22);
    
    // Add timestamp
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    // Add summary stats
    doc.setFontSize(12);
    doc.text(`Total Items: ${totalItems}`, 14, 42);
    
    // Create table with category distribution
    const tableColumn = ['Category', 'Count', 'Percentage'];
    const tableRows = [];
    
    Object.entries(categoryDistribution).forEach(([category, count]) => {
      const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : '0.0';
      tableRows.push([category, count, `${percentage}%`]);
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
      const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : '0.0';
      const statusLabel = status.replace(/([A-Z])/g, ' $1').trim();
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
    
    doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = [
      ['Inventory Management Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Total Items: ${totalItems}`],
      [],
      ['Category Distribution']
    ];
    
    Object.entries(categoryDistribution).forEach(([category, count]) => {
      const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : '0.0';
      data.push([category, count, `${percentage}%`]);
    });
    
    data.push([]);
    data.push(['Status Distribution']);
    
    Object.entries(statusDistribution).forEach(([status, count]) => {
      const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : '0.0';
      const statusLabel = status.replace(/([A-Z])/g, ' $1').trim();
      data.push([statusLabel, count, `${percentage}%`]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Distribution');
    
    XLSX.writeFile(wb, `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const calculateCategoryDistribution = (items) => {
    const distribution = {};
    
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    
    setCategoryDistribution(distribution);
  };

  const calculateStatusDistribution = (items) => {
    const distribution = {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0
    };
    
    items.forEach(item => {
      const status = item.status || 'In Stock';
      if (status === 'In Stock') {
        distribution.inStock++;
      } else if (status === 'Low Stock') {
        distribution.lowStock++;
      } else if (status === 'Out of Stock') {
        distribution.outOfStock++;
      }
    });
    
    setStatusDistribution(distribution);
  };

  // Prepare chart data for category distribution
  const categoryColors = [
    '#474fa8', '#ff4b5c', '#ffc107', '#831dba', '#acacac',
    '#20c997', '#fd7e14', '#007bff', '#6f42c1', '#e83e8c'
  ];

  const chartData = {
    labels: Object.keys(categoryDistribution).map((cat, index) => 
      `${cat} - ${categoryDistribution[cat]}`
    ),
    datasets: [
      {
        label: 'Number of Items',
        data: Object.values(categoryDistribution),
        backgroundColor: categoryColors.slice(0, Object.keys(categoryDistribution).length),
        hoverBackgroundColor: categoryColors.slice(0, Object.keys(categoryDistribution).length),
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
            const percentage = totalItems > 0 ? ((value / totalItems) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Status bar chart data
  const statusChartData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        label: 'Items by Status',
        data: [statusDistribution.inStock, statusDistribution.lowStock, statusDistribution.outOfStock],
        backgroundColor: ['#20c997', '#ffc107', '#ff4b5c'],
        borderColor: ['#1aa67d', '#dcb006', '#ff3648'],
        borderWidth: 2
      }
    ]
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed || 0;
            const percentage = totalItems > 0 ? ((value / totalItems) * 100).toFixed(1) : 0;
            return `${value} items (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="inventory-report-loading">
        <i className='bx bx-loader-alt bx-spin'></i>
        <p>Loading inventory report...</p>
      </div>
    );
  }

  return (
    <div className="inventory-report-container">
      <div className="inventory-report-header">
        <h2>Inventory Management Report</h2>
        
        <p>Total Items: <strong>{totalItems}</strong></p>
        
        {/* Export Button */}
        <div className="export-dropdown">
          <button 
            className="export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={totalItems === 0}
          >
            <i className='bx bx-download'></i>
            {totalItems === 0 ? 'No Data to Export' : 'Export Report'}
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

      <div className="inventory-report-content">
        <div className="inventory-charts-wrapper">
          <div className="chart-row">
            <div className="pie-chart-wrapper">
              <div className="pie-chart-container">
                {totalItems > 0 && Object.keys(categoryDistribution).length > 0 ? (
                  <Pie data={chartData} options={chartOptions} />
                ) : (
                  <div className="no-data-message">
                    <i className='bx bx-info-circle'></i>
                    <p>No inventory data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bar-chart-wrapper">
              <div className="bar-chart-container">
                {totalItems > 0 ? (
                  <Bar data={statusChartData} options={statusChartOptions} />
                ) : (
                  <div className="no-data-message">
                    <i className='bx bx-info-circle'></i>
                    <p>No status data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="inventory-statistics">
          <h3>Inventory Statistics</h3>
          
          <h4>Category Breakdown</h4>
          <div className="stats-grid">
            {Object.entries(categoryDistribution).map(([category, count]) => {
              const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : '0.0';
              const index = Object.keys(categoryDistribution).indexOf(category);
              return (
                <div key={category} className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: categoryColors[index % categoryColors.length] }}>
                    <i className='bx bx-package'></i>
                  </div>
                  <div className="stat-info">
                    <h4>{count}</h4>
                    <p>{category}</p>
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
                <i className='bx bx-check-circle'></i>
              </div>
              <div className="stat-info">
                <h4>{statusDistribution.inStock}</h4>
                <p>In Stock</p>
                <span>{totalItems > 0 ? ((statusDistribution.inStock / totalItems) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#ffc107' }}>
                <i className='bx bx-low-vision'></i>
              </div>
              <div className="stat-info">
                <h4>{statusDistribution.lowStock}</h4>
                <p>Low Stock</p>
                <span>{totalItems > 0 ? ((statusDistribution.lowStock / totalItems) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#ff4b5c' }}>
                <i className='bx bx-x-circle'></i>
              </div>
              <div className="stat-info">
                <h4>{statusDistribution.outOfStock}</h4>
                <p>Out of Stock</p>
                <span>{totalItems > 0 ? ((statusDistribution.outOfStock / totalItems) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>

          <div className="summary-section">
            <h4>Summary</h4>
            <ul className="summary-list">
              <li>
                <span className="dot" style={{ backgroundColor: '#20c997' }}></span>
                <span><strong>In Stock:</strong> {statusDistribution.inStock} items available</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#ffc107' }}></span>
                <span><strong>Low Stock:</strong> {statusDistribution.lowStock} items need reordering soon</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#ff4b5c' }}></span>
                <span><strong>Out of Stock:</strong> {statusDistribution.outOfStock} items require immediate attention</span>
              </li>
              <li>
                <span className="dot" style={{ backgroundColor: '#474fa8' }}></span>
                <span><strong>Total Categories:</strong> {Object.keys(categoryDistribution).length} categories</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
