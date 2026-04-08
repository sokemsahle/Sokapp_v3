import React, { useState, useEffect } from 'react';
import './Requisition.css';
import API_CONFIG from '../../config/api';

const RequisitionNotifications = ({ isOpen, onClose, onRequisitionClick, currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [finalizedNotifications, setFinalizedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllNotifications();
    }
  }, [isOpen]);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch unsigned requisitions (pending action)
      const unsignedResponse = await fetch(API_CONFIG.getUrl('/api/requisitions/unsigned'));
      const unsignedResult = await unsignedResponse.json();
      
      // Fetch finalized requisitions (for requester notification)
      const finalizedResponse = await fetch(API_CONFIG.getUrl(`/api/requisitions/finalized?email=${encodeURIComponent(currentUser.email)}`));
      const finalizedResult = await finalizedResponse.json();
      
      if (unsignedResult.success) {
        setNotifications(unsignedResult.requisitions || []);
      }
      
      if (finalizedResult.success) {
        setFinalizedNotifications(finalizedResult.requisitions || []);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (req) => {
    if (!req.signature_data) return 'Unsigned by Requestor';
    if (!req.reviewed_signature) return 'Pending Review';
    if (!req.approved_signature) return 'Pending Approval';
    if (!req.authorized_signature) return 'Pending Authorization';
    return 'Complete';
  };

  const getStatusClass = (req) => {
    if (!req.signature_data) return 'status-unsigned';
    if (!req.reviewed_signature) return 'status-review';
    if (!req.approved_signature) return 'status-approval';
    if (!req.authorized_signature) return 'status-authorization';
    return 'status-complete';
  };

  const getFinalizedStatusClass = () => {
    return 'status-finalized';
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Requisition Notifications</h3>
          <button className="close-btn" onClick={onClose}>
            <i className='bx bx-x'></i>
          </button>
        </div>
        
        <div className="notification-content">
          {loading ? (
            <div className="loading-spinner">Loading notifications...</div>
          ) : error ? (
            <div className="error-message">
              <i className='bx bx-error'></i>
              {error}
              <button className="retry-btn" onClick={fetchAllNotifications}>
                Retry
              </button>
            </div>
          ) : notifications.length === 0 && finalizedNotifications.length === 0 ? (
            <div className="no-notifications">
              <i className='bx bx-check-circle'></i>
              <p>No pending notifications</p>
              <span>All requisitions are up to date</span>
            </div>
          ) : (
            <div className="notification-list-container">
              {/* Pending Action Notifications */}
              {notifications.length > 0 && (
                <div className="notification-section">
                  <h4 className="notification-section-title">
                    <i className='bx bx-time-five'></i> Pending Your Action
                  </h4>
                  <div className="notification-list">
                    {notifications.map((req) => (
                      <div 
                        key={req.id} 
                        className="notification-item"
                        onClick={() => {
                          if (onRequisitionClick) {
                            onRequisitionClick(req.id);
                            onClose();
                          }
                        }}
                      >
                        <div className="notification-main">
                          <div className="notification-title">
                            <span className="req-id">#{req.id}</span>
                            <span className="req-name">{req.requestor_name}</span>
                          </div>
                          <div className="notification-details">
                            <span className="department">{req.department}</span>
                            <span className="purpose">{req.purpose?.substring(0, 50)}{req.purpose?.length > 50 ? '...' : ''}</span>
                          </div>
                        </div>
                        <div className="notification-meta">
                          <span className={`status-badge ${getStatusClass(req)}`}>
                            {getStatusText(req)}
                          </span>
                          <span className="date">{formatDate(req.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Finalized Notifications */}
              {finalizedNotifications.length > 0 && (
                <div className="notification-section">
                  <h4 className="notification-section-title">
                    <i className='bx bx-check-double'></i> Approved Requisitions
                  </h4>
                  <div className="notification-list">
                    {finalizedNotifications.map((req) => (
                      <div 
                        key={req.id} 
                        className="notification-item finalized"
                        onClick={() => {
                          if (onRequisitionClick) {
                            onRequisitionClick(req.id);
                            onClose();
                          }
                        }}
                      >
                        <div className="notification-main">
                          <div className="notification-title">
                            <span className="req-id">#{req.id}</span>
                            <span className="req-name">{req.requestor_name}</span>
                          </div>
                          <div className="notification-details">
                            <span className="department">{req.department}</span>
                            <span className="purpose">{req.purpose?.substring(0, 50)}{req.purpose?.length > 50 ? '...' : ''}</span>
                          </div>
                        </div>
                        <div className="notification-meta">
                          <span className={`status-badge ${getFinalizedStatusClass()}`}>
                            ✓ Approved
                          </span>
                          <span className="amount">{req.grand_total || '0.00'} Birr</span>
                          <span className="date">{formatDate(req.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequisitionNotifications;