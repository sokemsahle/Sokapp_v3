import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChildren, exportChildrenCSV } from '../../services/childService';
import ExportUtils from '../../utils/ExportUtils';
import './ChildProfile.css';

const ChildList = ({ user, basePath = '/admin', selectedProgram = null }) => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    gender: ''
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuId, setExportMenuId] = useState(null);
  const [programs, setPrograms] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Fetch programs on mount for display purposes
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const { getPrograms } = await import('../../services/programService');
        const result = await getPrograms();
        if (result.success) {
          setPrograms(result.programs);
        }
      } catch (error) {
        console.error('Error loading programs:', error);
      }
    };
    loadPrograms();
  }, []);

  useEffect(() => {
    loadChildren();
  }, [filters, selectedProgram]);

  // Filter children based on search term
  const filteredChildren = searchTerm.trim() === '' 
    ? children 
    : children.filter(child => {
        const fullName = `${child.first_name} ${child.last_name}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          child.first_name.toLowerCase().includes(searchLower) ||
          child.last_name.toLowerCase().includes(searchLower) ||
          (child.nationality && child.nationality.toLowerCase().includes(searchLower)) ||
          (child.religion && child.religion.toLowerCase().includes(searchLower))
        );
      });

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - today.getFullYear();
    const monthDiff = now.getMonth() - today.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < today.getDate())) {
      age--;
    }
    
    return age;
  };

  // Sort children
  const sortedChildren = [...filteredChildren].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue, bValue;
    if (sortConfig.key === 'name') {
      aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
      bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
    } else if (sortConfig.key === 'age') {
      // Use calculated age from DOB if available, otherwise use estimated_age
      aValue = calculateAge(a.date_of_birth) || parseInt(a.estimated_age) || 0;
      bValue = calculateAge(b.date_of_birth) || parseInt(b.estimated_age) || 0;
    } else if (sortConfig.key === 'admission') {
      aValue = new Date(a.date_of_admission);
      bValue = new Date(b.date_of_admission);
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedChildren.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedChildren = sortedChildren.slice(startIndex, endIndex);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleSort = (key) => {
    setSortConfig(currentConfig => ({
      key,
      direction: currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
      if (exportMenuId && !event.target.closest('.individual-export-dropdown')) {
        setExportMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu, exportMenuId]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      
      // Combine filters with program filter
      const allFilters = { ...filters };
      
      // Only add program_id if selectedProgram is not null (not "All Programs")
      if (selectedProgram !== null) {
        allFilters.program_id = selectedProgram;
      }
      
      console.log('Loading children with filters:', allFilters);
      const result = await getChildren(allFilters);
      console.log('API result:', result);
      const childrenData = result.data || [];
      console.log('Children data count:', childrenData.length);
      setChildren(childrenData);
      setError(null);
    } catch (err) {
      console.error('Error loading children:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load children. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExportCSV = () => {
    // Combine filters with program filter for export
    const allFilters = { ...filters };
    if (selectedProgram !== null) {
      allFilters.program_id = selectedProgram;
    }
    exportChildrenCSV(allFilters);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Gender', accessor: 'gender' },
      { header: 'Age', accessor: 'age' },
      { header: 'Admission Date', accessor: 'date_of_admission' },
      { header: 'Status', accessor: 'current_status' }
    ];
    
    const formattedData = children.map(child => ({
      name: `${child.first_name} ${child.last_name}`,
      gender: child.gender,
      age: calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age} (estimated)` : '-'),
      date_of_admission: new Date(child.date_of_admission).toLocaleDateString(),
      current_status: child.current_status
    }));
    
    ExportUtils.exportToPDF('Child Profiles Report', columns, formattedData, 'Child_Profiles');
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Gender', accessor: 'gender' },
      { header: 'Age', accessor: 'age' },
      { header: 'Admission Date', accessor: 'date_of_admission' },
      { header: 'Status', accessor: 'current_status' }
    ];
    
    const formattedData = children.map(child => ({
      name: `${child.first_name} ${child.last_name}`,
      gender: child.gender,
      age: calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age} (estimated)` : '-'),
      date_of_admission: new Date(child.date_of_admission).toLocaleDateString(),
      current_status: child.current_status
    }));
    
    ExportUtils.exportToExcel(columns, formattedData, 'Child Profiles', 'Child_Profiles');
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Gender', accessor: 'gender' },
      { header: 'Age', accessor: 'age' },
      { header: 'Admission Date', accessor: 'date_of_admission' },
      { header: 'Status', accessor: 'current_status' }
    ];
    
    const formattedData = children.map(child => ({
      name: `${child.first_name} ${child.last_name}`,
      gender: child.gender,
      age: calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age} (estimated)` : '-'),
      date_of_admission: new Date(child.date_of_admission).toLocaleDateString(),
      current_status: child.current_status
    }));
    
    ExportUtils.printData('Child Profiles Report', columns, formattedData);
    setShowExportMenu(false);
  };

  // Export single child to PDF
  const exportSingleChildPDF = (child) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Full Name', value: `${child.first_name} ${child.last_name}` },
      { field: 'Gender', value: child.gender },
      { field: 'Age', value: calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age} years (estimated)` : '-') },
      { field: 'Date of Admission', value: new Date(child.date_of_admission).toLocaleDateString() },
      { field: 'Current Status', value: child.current_status },
      { field: 'Place of Origin', value: child.place_of_origin || '-' },
      { field: 'Language', value: child.language || '-' },
      { field: 'Education Level', value: child.education_level || '-' }
    ];
    
    ExportUtils.exportToPDF(`Child Profile - ${child.first_name} ${child.last_name}`, columns, formattedData, `Child_${child.id}`);
    setExportMenuId(null);
  };

  // Export single child to Excel
  const exportSingleChildExcel = (child) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Full Name', value: `${child.first_name} ${child.last_name}` },
      { field: 'Gender', value: child.gender },
      { field: 'Age', value: calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age} years (estimated)` : '-') },
      { field: 'Date of Admission', value: new Date(child.date_of_admission).toLocaleDateString() },
      { field: 'Current Status', value: child.current_status },
      { field: 'Place of Origin', value: child.place_of_origin || '-' },
      { field: 'Language', value: child.language || '-' },
      { field: 'Education Level', value: child.education_level || '-' }
    ];
    
    ExportUtils.exportToExcel(columns, formattedData, 'Child Profile', `Child_${child.id}`);
    setExportMenuId(null);
  };

  // Print single child
  const printSingleChild = (child) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Full Name', value: `${child.first_name} ${child.last_name}` },
      { field: 'Gender', value: child.gender },
      { field: 'Age', value: calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age} years (estimated)` : '-') },
      { field: 'Date of Admission', value: new Date(child.date_of_admission).toLocaleDateString() },
      { field: 'Current Status', value: child.current_status },
      { field: 'Place of Origin', value: child.place_of_origin || '-' },
      { field: 'Language', value: child.language || '-' },
      { field: 'Education Level', value: child.education_level || '-' }
    ];
    
    ExportUtils.printData(`Child Profile - ${child.first_name} ${child.last_name}`, columns, formattedData);
    setExportMenuId(null);
  };

  const canCreateChild = user?.permissions?.includes('child_create');
  const canViewChild = user?.permissions?.includes('child_view');

 console.log('ChildList - canViewChild:', canViewChild, 'User permissions:', user?.permissions);

  if (!canViewChild) {
    return (
      <div className="child-list">
        <div className="error-message">
          <i className='bx bx-lock'></i>
          <p>You do not have permission to view children</p>
        </div>
      </div>
    );
  }

 console.log('Rendering ChildList with', children.length, 'children');

  return (
    <div className="child-list">
      <div className="child-list-header">
        <h1>Child Profiles</h1>
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <div className="export-dropdown" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="btn-secondary"
              type="button"
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
          {canCreateChild && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`${basePath}/children/new`);
              }} 
              className="btn-primary"
              type="button"
            >
              <i className='bx bx-plus'></i> Add New Child
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar">
        {/* Program filter indicator */}
        {selectedProgram !== null && (
          <div className="filter-group" style={{ background: '#e3f2fd', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ margin: 0, fontWeight: '600', color: '#1976d2' }}>
              <i className='bx bx-filter-alt'></i> Program Filter:
            </label>
            <span style={{ color: '#1976d2', fontWeight: '500' }}>
              {programs.find(p => p.id === selectedProgram)?.name || `Program ID: ${selectedProgram}`}
            </span>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('clear-program-filter'))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', padding: '4px', fontSize: '16px' }}
              title="Clear program filter (select 'All Programs' in top bar)"
            >
              <i className='bx bx-x'></i>
            </button>
          </div>
        )}
        
        <div className="filter-group search-group">
          <label><i className='bx bx-search'></i> Search:</label>
          <input
            type="text"
            placeholder="Search by name, nationality, religion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              <i className='bx bx-x'></i>
            </button>
          )}
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Reunified">Reunified</option>
            <option value="Adopted">Adopted</option>
            <option value="Deceased">Deceased</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Gender:</label>
          <select name="gender" value={filters.gender} onChange={handleFilterChange}>
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading children...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className='bx bx-error-circle'></i>
          <p>{error}</p>
        </div>
      ) : children.length === 0 ? (
        <div className="empty-state">
          <i className='bx bx-user'></i>
          <p>No children found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="children-table">
            <thead>
              <tr>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Name {getSortIcon('name')}
                </th>
                <th>Gender</th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('age')}
                  style={{ cursor: 'pointer' }}
                >
                  Age {getSortIcon('age')}
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('admission')}
                  style={{ cursor: 'pointer' }}
                >
                  Admission Date {getSortIcon('admission')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChildren.map((child) => (
                <tr 
                  key={child.id} 
                  className="clickable-row"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`${basePath}/children/${child.id}`);
                  }}
                >
                  <td>
                    <div className="name-cell">
                      {child.profile_photo && (
                        <img src={child.profile_photo} alt="" className="thumbnail" />
                      )}
                      <span>{child.first_name} {child.last_name}</span>
                    </div>
                  </td>
                  <td>{child.gender}</td>
                  <td style={{ fontWeight: calculateAge(child.date_of_birth) ? '600' : 'normal', color: calculateAge(child.date_of_birth) ? 'var(--primary)' : 'inherit' }}>
                    {calculateAge(child.date_of_birth) || (child.estimated_age ? `~${child.estimated_age}` : '-')}
                  </td>
                  <td>{new Date(child.date_of_admission).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${child.current_status.toLowerCase()}`}>
                      {child.current_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`${basePath}/children/${child.id}`);
                        }}
                        className="btn-icon"
                        title="View Details"
                        type="button"
                      >
                        <i className='bx bx-show'></i>
                      </button>
                      <div className="individual-export-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExportMenuId(exportMenuId === child.id ? null : child.id);
                          }}
                          title="Export Options"
                          type="button"
                        >
                          <i className='bx bx-download'></i>
                        </button>
                        {exportMenuId === child.id && (
                          <div className="export-menu" style={{ position: 'absolute', right: 0, zIndex: 1000 }}>
                            <button onClick={() => exportSingleChildPDF(child)} className="export-menu-item">
                              <i className='bx bx-file-pdf'></i> Export PDF
                            </button>
                            <button onClick={() => exportSingleChildExcel(child)} className="export-menu-item">
                              <i className='bx bx-file-excel'></i> Export Excel
                            </button>
                            <button onClick={() => printSingleChild(child)} className="export-menu-item">
                              <i className='bx bx-print'></i> Print
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Search results info */}
      {searchTerm && (
        <div className="search-results-info">
          Showing {paginatedChildren.length} of {filteredChildren.length} children matching "{searchTerm}"
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            <i className='bx bx-chevron-left'></i> Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
            {filteredChildren.length > 0 && (
              <span> • Showing {Math.min(startIndex + 1, filteredChildren.length)}-{Math.min(endIndex, filteredChildren.length)} of {filteredChildren.length}</span>
            )}
          </div>
          
          <button 
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next <i className='bx bx-chevron-right'></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChildList;
