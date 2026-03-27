import React, { useState, useEffect } from 'react';
import './Requisition.css';
import { getPrograms } from '../../services/programService';
import ExportUtils from '../../utils/ExportUtils';

const RequisitionList = ({ onCreateNew, onEditRequisition, userOnly = false, currentUser = null, selectedProgram }) => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [programs, setPrograms] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuId, setExportMenuId] = useState(null);

  // Debug: Log props on mount and when they change
  console.log('DEBUG: RequisitionList props:', { 
    hasOnCreateNew: !!onCreateNew, 
    hasOnEditRequisition: !!onEditRequisition,
    userOnly, 
    currentUser,
    selectedProgram 
  });
  
  // Safety: Create a no-op function if onEditRequisition is not provided
  const handleEditRequisition = onEditRequisition || ((reqId) => {
    console.warn('onEditRequisition not provided - edit functionality disabled');
    alert('Edit functionality is not available. Please navigate through the admin menu.');
  });

  useEffect(() => {
    loadPrograms();
    fetchRequisitions();
  }, [selectedProgram]);

  // Debug: Monitor onEditRequisition prop changes
  useEffect(() => {
    console.log('=== onEditRequisition prop changed ===');
    console.log('Type:', typeof onEditRequisition);
    console.log('Value:', onEditRequisition);
    console.log('Is function:', typeof onEditRequisition === 'function');
  }, [onEditRequisition]);

  const loadPrograms = async () => {
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.programs);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      
      // Use different endpoint based on userOnly flag
      let url = 'http://localhost:5000/api/requisitions';
      if (userOnly && currentUser?.email) {
        url = `http://localhost:5000/api/requisitions/my?email=${encodeURIComponent(currentUser.email)}`;
      }
      
      // Add program filter if selected
      if (selectedProgram) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}program_id=${selectedProgram}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setRequisitions(result.requisitions || result.data || []);
      } else {
        setError('Failed to load requisitions');
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase() || 'pending';
    return <span className={`status-badge status-${statusClass}`}>{status || 'Pending'}</span>;
  };

  // Get program name by ID
  const getProgramName = (programId) => {
    if (!programId) return '-';
    const program = programs.find(p => p.id === parseInt(programId));
    return program ? program.name : '-';
  };

  const filteredRequisitions = requisitions.filter(req =>
    req.requestor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuId && !event.target.closest('.individual-export-dropdown')) {
        setExportMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportMenuId]);

  // Export to Excel (CSV format) - Legacy function, keeping for backward compatibility
  const exportToExcelLegacy = () => {
    if (filteredRequisitions.length === 0) {
      alert('No requisitions to export');
      return;
    }

    // CSV Header
    const headers = ['ID', 'Requestor', 'Department', 'Purpose', 'Date', 'Status', 'Created At','Total Amount'];
    
    // CSV Rows
    const rows = filteredRequisitions.map(req => [
      req.id,
      req.requestor_name || '',
      req.department || '',
      req.purpose || '',
      req.request_date || '',
      req.status || 'Pending',
      req.created_at || '',
      req.grand_total || ''
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `requisitions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const columns = [
      { header: 'ID', accessor: 'id' },
      { header: 'Requestor', accessor: 'requestor_name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Purpose', accessor: 'purpose' },
      { header: 'Date', accessor: 'request_date' },
      { header: 'Status', accessor: 'status' },
      { header: 'Total Amount', accessor: 'grand_total' }
    ];
    
    const formattedData = filteredRequisitions.map(req => ({
      id: req.id,
      requestor_name: req.requestor_name || '-',
      department: req.department || '-',
      purpose: req.purpose || '-',
      request_date: formatDate(req.request_date),
      status: req.status || 'Pending',
      grand_total: req.grand_total ? `${parseFloat(req.grand_total).toFixed(2)} Birr` : '0.00 Birr'
    }));
    
    ExportUtils.exportToPDF('Requisition Report', columns, formattedData, 'Requisitions');
    setShowExportMenu(false);
  };

  // Export to Excel (XLSX)
  const handleExportExcel = () => {
    const columns = [
      { header: 'ID', accessor: 'id' },
      { header: 'Requestor', accessor: 'requestor_name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Purpose', accessor: 'purpose' },
      { header: 'Date', accessor: 'request_date' },
      { header: 'Status', accessor: 'status' },
      { header: 'Total Amount', accessor: 'grand_total' }
    ];
    
    const formattedData = filteredRequisitions.map(req => ({
      id: req.id,
      requestor_name: req.requestor_name || '-',
      department: req.department || '-',
      purpose: req.purpose || '-',
      request_date: formatDate(req.request_date),
      status: req.status || 'Pending',
      grand_total: req.grand_total ? parseFloat(req.grand_total).toFixed(2) : '0.00'
    }));
    
    ExportUtils.exportToExcel(columns, formattedData, 'Requisitions', 'Requisitions');
    setShowExportMenu(false);
  };

  // Print
  const handlePrint = () => {
    const columns = [
      { header: 'ID', accessor: 'id' },
      { header: 'Requestor', accessor: 'requestor_name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Purpose', accessor: 'purpose' },
      { header: 'Date', accessor: 'request_date' },
      { header: 'Status', accessor: 'status' },
      { header: 'Total Amount', accessor: 'grand_total' }
    ];
    
    const formattedData = filteredRequisitions.map(req => ({
      id: req.id,
      requestor_name: req.requestor_name || '-',
      department: req.department || '-',
      purpose: req.purpose || '-',
      request_date: formatDate(req.request_date),
      status: req.status || 'Pending',
      grand_total: req.grand_total ? `${parseFloat(req.grand_total).toFixed(2)} Birr` : '0.00 Birr'
    }));
    
    ExportUtils.printData('Requisition Report', columns, formattedData);
    setShowExportMenu(false);
  };

  // Export single requisition to Excel (Legacy - keeping for backward compatibility)
  const exportSingleRequisition = (req) => {
    // CSV Header
    const headers = ['Field', 'Value'];
    
    // CSV Rows - detailed information
    const rows = [
      ['Requisition ID', req.id],
      ['Requestor Name', req.requestor_name || ''],
      ['Requestor Email', req.requestor_email || ''],
      ['Department', req.department || ''],
      ['Program', getProgramName(req.program_id)],
      ['Purpose', req.purpose || ''],
      ['Request Date', formatDate(req.request_date)],
      ['Status', req.status || 'Pending'],
      ['Created At', formatDate(req.created_at)],
      ['Updated At', formatDate(req.updated_at)]
    ];

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `requisition_${req.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export single requisition to PDF
  const exportSingleRequisitionPDF = (req) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Requisition ID', value: req.id },
      { field: 'Requestor Name', value: req.requestor_name || '-' },
      { field: 'Requestor Email', value: req.requestor_email || '-' },
      { field: 'Department', value: req.department || '-' },
      { field: 'Program', value: getProgramName(req.program_id) },
      { field: 'Purpose', value: req.purpose || '-' },
      { field: 'Request Date', value: formatDate(req.request_date) },
      { field: 'Status', value: req.status || 'Pending' },
      { field: 'Created At', value: formatDate(req.created_at) },
      { field: 'Updated At', value: formatDate(req.updated_at) },
      { field: 'Total Amount', value: req.grand_total ? `${parseFloat(req.grand_total).toFixed(2)} Birr` : '0.00 Birr' }
    ];
    
    ExportUtils.exportToPDF(`Requisition #${req.id} Details`, columns, formattedData, `Requisition_${req.id}`);
    setExportMenuId(null);
  };

  // Export single requisition to Excel
  const exportSingleRequisitionExcel = (req) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Requisition ID', value: req.id },
      { field: 'Requestor Name', value: req.requestor_name || '-' },
      { field: 'Requestor Email', value: req.requestor_email || '-' },
      { field: 'Department', value: req.department || '-' },
      { field: 'Program', value: getProgramName(req.program_id) },
      { field: 'Purpose', value: req.purpose || '-' },
      { field: 'Request Date', value: formatDate(req.request_date) },
      { field: 'Status', value: req.status || 'Pending' },
      { field: 'Created At', value: formatDate(req.created_at) },
      { field: 'Updated At', value: formatDate(req.updated_at) },
      { field: 'Total Amount', value: req.grand_total ? parseFloat(req.grand_total).toFixed(2) : '0.00' }
    ];
    
    ExportUtils.exportToExcel(columns, formattedData, 'Requisition Details', `Requisition_${req.id}`);
    setExportMenuId(null);
  };

  // Print single requisition
  const printSingleRequisition = (req) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Requisition ID', value: req.id },
      { field: 'Requestor Name', value: req.requestor_name || '-' },
      { field: 'Requestor Email', value: req.requestor_email || '-' },
      { field: 'Department', value: req.department || '-' },
      { field: 'Program', value: getProgramName(req.program_id) },
      { field: 'Purpose', value: req.purpose || '-' },
      { field: 'Request Date', value: formatDate(req.request_date) },
      { field: 'Status', value: req.status || 'Pending' },
      { field: 'Created At', value: formatDate(req.created_at) },
      { field: 'Updated At', value: formatDate(req.updated_at) },
      { field: 'Total Amount', value: req.grand_total ? `${parseFloat(req.grand_total).toFixed(2)} Birr` : '0.00 Birr' }
    ];
    
    ExportUtils.printData(`Requisition #${req.id} Details`, columns, formattedData);
    setExportMenuId(null);
  };

  if (loading) {
    return (
      <main className="requisition-container">
        <div className="header">
          <h1>Requisition List</h1>
        </div>
        <div className="form-card">
          <div className="loading-spinner">Loading requisitions...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="requisition-container">
        <div className="header">
          <h1>Requisition List</h1>
        </div>
        <div className="form-card">
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={fetchRequisitions}>Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="requisition-container">
      <div className="header">
        <h1>{userOnly ? 'My Requisitions' : 'Requisition List'}</h1>
        {!userOnly && (
          <ul className="breadcrumb">
            <li><a href="#">Management</a></li>
            /
            <li><a href="#" className="active">Requisition List</a></li>
          </ul>
        )}
      </div>

      <div className="form-card">
        <div className="list-header">
          <div className="search-box">
            <i className='bx bx-search'></i>
            <input
              type="text"
              placeholder="Search by requestor, department, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-actions">
            {!userOnly && (
              <div className="export-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  className="btn-secondary"
                  title="Export options"
                >
                  <i className='bx bx-download'></i> Export{' '}
                  <i className='bx bx-chevron-down'></i>
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button onClick={handleExportPDF} className="export-menu-item">
                      <i className='bx bx-file-pdf'></i> Export PDF
                    </button>
                    <button onClick={handleExportExcel} className="export-menu-item">
                      <i className='bx bx-file-excel'></i> Export Excel
                    </button>
                    <button onClick={handlePrint} className="export-menu-item">
                      <i className='bx bx-print'></i> Print
                    </button>
                  </div>
                )}
              </div>
            )}
            <button className="btn-primary" onClick={onCreateNew}>
              <i className='bx bx-plus'></i> Create New
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="requisition-list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Requestor</th>
                <th>Department</th>
                <th>Program</th>
                <th>Purpose</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    {searchTerm ? 'No requisitions found matching your search.' : 'No requisitions found. Create your first requisition!'}
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr key={req.id}>
                    <td>#{req.id}</td>
                    <td>{req.requestor_name}</td>
                    <td>{req.department}</td>
                    <td>{getProgramName(req.program_id)}</td>
                    <td className="purpose-cell" title={req.purpose}>
                      {req.purpose?.length > 40 ? req.purpose.substring(0, 40) + '...' : req.purpose}
                    </td>
                    <td>{formatDate(req.request_date)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {(req.status === 'pending' || currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') && (
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => {
                              console.log('Edit button clicked for requisition ID:', req.id);
                              console.log('Current user:', currentUser);
                              console.log('Current user is_admin:', currentUser?.is_admin);
                              // Use the safe wrapper function
                              handleEditRequisition(req.id);
                            }}
                            title="Edit Requisition"
                          >
                            <i className='bx bx-edit'></i>
                          </button>
                        )}
                        <div className="individual-export-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            className="btn-icon btn-export"
                            onClick={() => setExportMenuId(exportMenuId === req.id ? null : req.id)}
                            title="Export Options"
                          >
                            <i className='bx bx-download'></i>
                          </button>
                          {exportMenuId === req.id && (
                            <div className="export-menu" style={{ position: 'absolute', right: 0, zIndex: 1000 }}>
                              <button onClick={() => exportSingleRequisitionPDF(req)} className="export-menu-item">
                                <i className='bx bx-file-pdf'></i> Export PDF
                              </button>
                              <button onClick={() => exportSingleRequisitionExcel(req)} className="export-menu-item">
                                <i className='bx bx-file-excel'></i> Export Excel
                              </button>
                              <button onClick={() => printSingleRequisition(req)} className="export-menu-item">
                                <i className='bx bx-print'></i> Print
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="list-footer">
          <span>Total: {filteredRequisitions.length} requisition(s)</span>
        </div>
      </div>
    </main>
  );
};

export default RequisitionList;
