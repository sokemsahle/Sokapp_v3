import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChild, deleteChild, downloadChildProfilePDF } from '../../services/childService';
import ExportUtils from '../../utils/ExportUtils';
import Tier2Tabs from './Tier2Tabs';
import './ChildProfile.css';

const ChildLayout = ({ user, childId, onBack, basePath = '/admin' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Use childId from props OR from URL params (for direct URL access)
  const effectiveChildId = childId || id;

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

  // Helper function to get detailed age for children under 1 year
  const getDetailedAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    
    // Calculate total time difference in milliseconds
    const diffTime = now - birthDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If less than 1 year old
    if (diffDays < 365) {
      // Calculate months
      let months = (now.getFullYear() - birthDate.getFullYear()) * 12;
      months += now.getMonth() - birthDate.getMonth();
      
      // Adjust if day of month hasn't been reached yet
      if (now.getDate() < birthDate.getDate()) {
        months--;
      }
      
      // Calculate remaining days
      let days = 0;
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
      const adjustedBirthDay = birthDate.getDate() > prevMonthDate.getDate() ? prevMonthDate.getDate() : birthDate.getDate();
      
      if (now.getDate() >= adjustedBirthDay) {
        days = now.getDate() - adjustedBirthDay;
      } else {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, adjustedBirthDay);
        days = now.getDate() + (adjustedBirthDay - prevMonth.getDate());
      }
      
      return { months, days, isUnderOneYear: true };
    }
    
    return { years: calculateAge(dateOfBirth), isUnderOneYear: false };
  };

  // Calculate current age
  const currentAge = child ? calculateAge(child.date_of_birth) : null;
  const detailedAge = child ? getDetailedAge(child.date_of_birth) : null;

  // Debug logging
  useEffect(() => {
    console.log('DEBUG ChildLayout - ID:', effectiveChildId);
    console.log('DEBUG ChildLayout - User:', user);
    console.log('DEBUG ChildLayout - Permissions:', user?.permissions);
  }, [effectiveChildId, user]);

  useEffect(() => {
    if (effectiveChildId) {
      loadChildDetails(effectiveChildId);
    } else {
      // No ID - redirect to children list
      navigate(`${basePath}/children`);
    }
  }, [effectiveChildId]);

  const loadChildDetails = async (childId) => {
    try {
      setLoading(true);
      const result = await getChild(childId);
      setChild(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to load child details');
      console.error('Error loading child:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this child profile? This will delete all associated records.')) {
      return;
    }

    try {
      await deleteChild(effectiveChildId);
      alert('Child profile deleted successfully');
      navigate(`${basePath}/children`);
    } catch (err) {
      alert('Failed to delete child profile: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting child:', err);
    }
  };

  const handleExportProfile = async () => {
    try {
      await downloadChildProfilePDF(effectiveChildId);
    } catch (error) {
      alert('Failed to export profile: ' + (error.message || 'Unknown error'));
      console.error('Error exporting profile:', error);
    }
  };

  // Export child profile data to PDF
  const exportProfileToPDF = () => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    // Calculate age display value with ~ prefix for estimated
    let ageDisplay;
    if (detailedAge?.isUnderOneYear) {
      ageDisplay = `${detailedAge.months} month${detailedAge.months !== 1 ? 's' : ''}`;
      if (detailedAge.days > 0) {
        ageDisplay += `, ${detailedAge.days} day${detailedAge.days !== 1 ? 's' : ''}`;
      }
      // Add ~ prefix if estimated
      if (child.date_of_birth_type === 'estimated') {
        ageDisplay = `~${ageDisplay}`;
      }
    } else if (currentAge !== null) {
      ageDisplay = `${currentAge} year${currentAge !== 1 ? 's' : ''} old`;
      // Add ~ prefix if estimated
      if (child.date_of_birth_type === 'estimated') {
        ageDisplay = `~${ageDisplay}`;
      }
    } else {
      ageDisplay = 'Unknown';
    }
    
    const formattedData = [
      { field: 'Full Name', value: `${child.first_name} ${child.middle_name || ''} ${child.last_name}`.trim() },
      { field: 'Nickname', value: child.nickname || '-' },
      { field: 'Gender', value: child.gender },
      { field: 'Date of Birth', value: child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Unknown' },
      { field: 'Age', value: ageDisplay },
      { field: 'Blood Group', value: child.blood_group || 'Unknown' },
      { field: 'Admission Date', value: child.date_of_admission ? new Date(child.date_of_admission).toLocaleDateString() : 'Unknown' },
      { field: 'Status', value: child.current_status },
      { field: 'Health Status', value: child.health_status || '-' }
    ];
    
    ExportUtils.exportToPDF(
      `Child Profile - ${child.first_name} ${child.last_name}`,
      columns,
      formattedData,
      `Child_${child.first_name}_${child.last_name}`
    );
    setShowExportMenu(false);
  };

  // Export child profile data to Excel
  const exportProfileToExcel = () => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    // Calculate age display value with ~ prefix for estimated
    let ageDisplay;
    if (detailedAge?.isUnderOneYear) {
      ageDisplay = `${detailedAge.months} month${detailedAge.months !== 1 ? 's' : ''}`;
      if (detailedAge.days > 0) {
        ageDisplay += `, ${detailedAge.days} day${detailedAge.days !== 1 ? 's' : ''}`;
      }
      // Add ~ prefix if estimated
      if (child.date_of_birth_type === 'estimated') {
        ageDisplay = `~${ageDisplay}`;
      }
    } else if (currentAge !== null) {
      ageDisplay = `${currentAge} year${currentAge !== 1 ? 's' : ''} old`;
      // Add ~ prefix if estimated
      if (child.date_of_birth_type === 'estimated') {
        ageDisplay = `~${ageDisplay}`;
      }
    } else {
      ageDisplay = 'Unknown';
    }
    
    const formattedData = [
      { field: 'Full Name', value: `${child.first_name} ${child.middle_name || ''} ${child.last_name}`.trim() },
      { field: 'Nickname', value: child.nickname || '-' },
      { field: 'Gender', value: child.gender },
      { field: 'Date of Birth', value: child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Unknown' },
      { field: 'Age', value: ageDisplay },
      { field: 'Blood Group', value: child.blood_group || 'Unknown' },
      { field: 'Admission Date', value: child.date_of_admission ? new Date(child.date_of_admission).toLocaleDateString() : 'Unknown' },
      { field: 'Status', value: child.current_status },
      { field: 'Health Status', value: child.health_status || '-' }
    ];
    
    ExportUtils.exportToExcel(
      columns,
      formattedData,
      'Child Profile',
      `Child_${child.first_name}_${child.last_name}`
    );
    setShowExportMenu(false);
  };

  // Print child profile
  const printProfile = () => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    // Calculate age display value with ~ prefix for estimated
    let ageDisplay;
    if (detailedAge?.isUnderOneYear) {
      ageDisplay = `${detailedAge.months} month${detailedAge.months !== 1 ? 's' : ''}`;
      if (detailedAge.days > 0) {
        ageDisplay += `, ${detailedAge.days} day${detailedAge.days !== 1 ? 's' : ''}`;
      }
      // Add ~ prefix if estimated
      if (child.date_of_birth_type === 'estimated') {
        ageDisplay = `~${ageDisplay}`;
      }
    } else if (currentAge !== null) {
      ageDisplay = `${currentAge} year${currentAge !== 1 ? 's' : ''} old`;
      // Add ~ prefix if estimated
      if (child.date_of_birth_type === 'estimated') {
        ageDisplay = `~${ageDisplay}`;
      }
    } else {
      ageDisplay = 'Unknown';
    }
    
    const formattedData = [
      { field: 'Full Name', value: `${child.first_name} ${child.middle_name || ''} ${child.last_name}`.trim() },
      { field: 'Nickname', value: child.nickname || '-' },
      { field: 'Gender', value: child.gender },
      { field: 'Date of Birth', value: child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Unknown' },
      { field: 'Age', value: ageDisplay },
      { field: 'Blood Group', value: child.blood_group || 'Unknown' },
      { field: 'Admission Date', value: child.date_of_admission ? new Date(child.date_of_admission).toLocaleDateString() : 'Unknown' },
      { field: 'Status', value: child.current_status },
      { field: 'Health Status', value: child.health_status || '-' }
    ];
    
    ExportUtils.printData(
      `Child Profile - ${child.first_name} ${child.last_name}`,
      columns,
      formattedData
    );
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="child-layout">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading child details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="child-layout">
        <div className="error-message">
          <i className='bx bx-error-circle'></i>
          <p>{error}</p>
          <button onClick={() => navigate(`${basePath}/children`)} className="btn-primary">
            Back to Children List
          </button>
        </div>
      </div>
    );
  }

  // This check is now handled in useEffect, but keep as safety
  if (!child) {
    return null;
  }

  return (
    <div className="child-layout">
      <div className="child-header">
        <div className="child-header-left">
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button onClick={() => onBack ? onBack() : navigate(`${basePath}/children`)} className="btn-back" title="Back to Child List">
              <i className='bx bx-arrow-back'></i>
            </button>
            <button onClick={() => navigate(`${basePath}/dashboard`)} className="btn-back" title="Back to Dashboard" style={{background: 'var(--primary)', color: 'var(--white)'}}>
              <i className='bx bxs-dashboard'></i> Dashboard
            </button>
          </div>
          <h1>{child?.first_name} {child?.last_name}</h1>
        </div>
        <div className="child-header-actions">
          <div className="export-dropdown" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="btn-secondary"
              type="button"
              title="Export options"
            >
              <i className='bx bx-download'></i> Export / Print{' '}
              <i className='bx bx-chevron-down'></i>
            </button>
            {showExportMenu && (
              <div className="export-menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '5px', zIndex: 1000 }}>
                <button onClick={printProfile} className="export-menu-item">
                  <i className='bx bx-printer'></i> Print
                </button>
                <button onClick={exportProfileToPDF} className="export-menu-item">
                  <i className='bx bxs-file-pdf'></i> Save as PDF
                </button>
                <button onClick={exportProfileToExcel} className="export-menu-item">
                  <i className='bx bxs-file-excel'></i> Export to Excel
                </button>
              </div>
            )}
          </div>
          {user?.permissions?.includes('child_update') && (
            <button onClick={() => navigate(`${basePath}/children/${effectiveChildId}/edit`)} className="btn-secondary">
              <i className='bx bx-edit'></i> Edit Profile
            </button>
          )}
          {user?.permissions?.includes('child_delete') && (
            <button onClick={handleDelete} className="btn-danger">
              <i className='bx bx-trash'></i> Delete
            </button>
          )}
        </div>
      </div>

      <div className="child-detail-grid">
        <div className="child-info-card">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name:</label>
              <span>{child?.first_name} {child?.middle_name || ''} {child?.last_name}</span>
            </div>
            {child?.nickname && (
              <div className="info-item">
                <label>Nickname:</label>
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{child.nickname}</span>
              </div>
            )}
            <div className="info-item">
              <label>Gender:</label>
              <span>{child?.gender}</span>
            </div>
            <div className="info-item">
              <label>Date of Birth:</label>
              <span>{child?.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Unknown'}</span>
            </div>
            <div className="info-item">
              <label>Age:</label>
              <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '16px' }}>
                {detailedAge?.isUnderOneYear 
                  ? `${detailedAge.months} month${detailedAge.months !== 1 ? 's' : ''}${detailedAge.days > 0 ? `, ${detailedAge.days} day${detailedAge.days !== 1 ? 's' : ''}` : ''}`
                  : (currentAge !== null ? `${currentAge} year${currentAge !== 1 ? 's' : ''} old` : (child?.estimated_age ? `~${child.estimated_age} years (estimated)` : 'Unknown'))}
              </span>
            </div>
            {child?.estimated_age && !child?.date_of_birth && (
              <div className="info-item">
                <label>Estimated Age:</label>
                <span>{child.estimated_age} years</span>
              </div>
            )}
            <div className="info-item">
              <label>Blood Group:</label>
              <span>{child?.blood_group || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <label>Admission Date:</label>
              <span>{child?.date_of_admission ? new Date(child.date_of_admission).toLocaleDateString() : 'Unknown'}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className={`status-badge ${child?.current_status?.toLowerCase()}`}>
                {child?.current_status}
              </span>
            </div>
            {child?.health_status && (
              <div className="info-item full-width">
                <label>Health Status:</label>
                <span>{child.health_status}</span>
              </div>
            )}
          </div>
        </div>

        {child?.profile_photo && (
          <div className="child-photo-card">
            <img src={child.profile_photo} alt={`${child.first_name} ${child.last_name}`} />
          </div>
        )}
      </div>

      <Tier2Tabs childId={effectiveChildId} child={child} user={user} />
    </div>
  );
};

export default ChildLayout;
