import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChild, deleteChild, downloadChildProfilePDF } from '../../services/childService';
import Tier2Tabs from './Tier2Tabs';
import './ChildProfile.css';

const ChildLayout = ({ user, childId, onBack, basePath = '/admin' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Calculate current age
  const currentAge = child ? calculateAge(child.date_of_birth) : null;

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
          <button onClick={handleExportProfile} className="btn-secondary" title="Export Profile as PDF">
            <i className='bx bx-download'></i> Export Profile
          </button>
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
                {currentAge !== null ? `${currentAge} years old` : (child?.estimated_age ? `~${child.estimated_age} years (estimated)` : 'Unknown')}
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
