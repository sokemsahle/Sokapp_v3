import React, { useState, useEffect } from 'react';

const NotificationCenter = ({ isOpen, onClose, onRequisitionClick, currentUser, onCountChange }) => {
  const [showAll, setShowAll] = useState(false); // Toggle to show all vs unseen only
  
  // Requisition notifications state
  const [requisitionNotifications, setRequisitionNotifications] = useState([]);
  const [finalizedNotifications, setFinalizedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    console.log('[NotificationCenter] isOpen changed to:', isOpen);
    if (isOpen) {
      console.log('[NotificationCenter] Panel opened, fetching notifications...');
      fetchAllNotifications();
    } else {
      console.log('[NotificationCenter] Panel closed');
    }
  }, [isOpen]);

  // Notify parent of count changes
  useEffect(() => {
    console.log('[NotificationCenter] Notifying parent of count change:', notificationCount, 'isOpen:', isOpen);
    if (onCountChange && typeof onCountChange === 'function') {
      onCountChange(notificationCount);
      console.log('[NotificationCenter] Parent notified successfully');
    } else {
      console.log('[NotificationCenter] WARNING: onCountChange not a function!', typeof onCountChange);
    }
  }, [notificationCount, onCountChange]);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch unsigned requisitions (pending action) - only unseen if not showing all
      const unsignedResponse = await fetch(`http://localhost:5000/api/requisitions/unsigned?unseen=${!showAll}&user_id=${currentUser.id}`);
      const unsignedResult = await unsignedResponse.json();
      
      // Fetch finalized requisitions (for requester notification) - only unseen if not showing all
      const finalizedResponse = await fetch(`http://localhost:5000/api/requisitions/finalized?email=${encodeURIComponent(currentUser.email)}&unseen=${!showAll}&user_id=${currentUser.id}`);
      const finalizedResult = await finalizedResponse.json();
      
      if (unsignedResult.success) {
        const unsignedCount = unsignedResult.requisitions?.length || 0;
        console.log('[NotificationCenter] Unsigned requisitions:', unsignedCount);
        setRequisitionNotifications(unsignedResult.requisitions || []);
        setNotificationCount(unsignedCount);
      } else {
        console.log('[NotificationCenter] Unsigned response not successful:', unsignedResult);
      }
      
      if (finalizedResult.success) {
        const finalizedCount = finalizedResult.requisitions?.length || 0;
        console.log('[NotificationCenter] Finalized requisitions:', finalizedCount);
        setFinalizedNotifications(finalizedResult.requisitions || []);
      } else {
        console.log('[NotificationCenter] Finalized response not successful:', finalizedResult);
      }
      
      // Calculate total for parent notification
      const totalCount = (unsignedResult.success ? unsignedResult.requisitions?.length || 0 : 0) + 
                        (finalizedResult.success ? finalizedResult.requisitions?.length || 0 : 0);
      console.log('[NotificationCenter] Total count to notify parent:', totalCount);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRequisitionClick = async (reqId) => {
    console.log('=== NOTIFICATION CLICK DEBUG ===');
    console.log('Notification clicked:', reqId);
    console.log('Current user:', currentUser);
    console.log('Current user ID:', currentUser?.id);
    
    // Mark notification as seen in database
    try {
      const token = localStorage.getItem('token');
      console.log('Token found:', !!token);
      
      if (!currentUser || !currentUser.id) {
        console.error('❌ ERROR: No current user or no user ID!');
        return;
      }
      
      console.log('Sending request to mark as seen...');
      console.log('Request body will be:', JSON.stringify({ user_id: currentUser.id }));
      
      // Send user_id in request body instead of using JWT
      const response = await fetch(`http://localhost:5000/api/notifications/${reqId}/seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header needed
        },
        body: JSON.stringify({
          user_id: currentUser.id
        })
      });
      
      console.log('API Response status:', response.status);
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        console.log('✓ Notification marked as seen in database');
        
        // Remove from BOTH arrays immediately
        setRequisitionNotifications(prev => {
          const filtered = prev.filter(req => req.id !== reqId);
          console.log('Filtered requisitionNotifications:', filtered.length, '(was', prev.length, ')');
          return filtered;
        });
        setFinalizedNotifications(prev => {
          const filtered = prev.filter(req => req.id !== reqId);
          console.log('Filtered finalizedNotifications:', filtered.length, '(was', prev.length, ')');
          return filtered;
        });
        
        // Update notification count
        setNotificationCount(prev => {
          const newCount = Math.max(0, prev - 1);
          console.log('✓ New notification count:', newCount, '(was', prev, ')');
          return newCount;
        });
        
        console.log('✓ Removed from UI successfully');
      } else {
        console.error('Failed to mark as seen:', result.message);
      }
    } catch (error) {
      console.error('❌ Error marking notification as seen:', error);
    }
    
    // Close the notification panel first
    if (onClose) {
      onClose();
    }
    
    // Navigate to requisition after a short delay
    setTimeout(() => {
      if (onRequisitionClick) {
        onRequisitionClick(reqId);
      }
    }, 100);
    
    console.log('=== END DEBUG ===');
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
      <div className="notification-panel unified" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notifications</h3>
          <div className="header-actions">
            <button 
              className="show-all-toggle"
              onClick={() => setShowAll(!showAll)}
              title={showAll ? "Show Unseen Only" : "Show All"}
            >
              <i className={`bx ${showAll ? 'bx-hide' : 'bx-show'}`}></i>
              <span>{showAll ? 'Hide Seen' : 'Show All'}</span>
            </button>
            <button className="close-btn" onClick={onClose}>
              <i className='bx bx-x'></i>
            </button>
          </div>
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
          ) : requisitionNotifications.length === 0 && finalizedNotifications.length === 0 ? (
            <div className="no-notifications">
              <i className='bx bx-check-circle'></i>
              <p>{showAll ? 'No notifications' : 'No unseen notifications'}</p>
              <span>{showAll ? 'All notifications have been viewed' : showAll ? 'Click "Show All" to see viewed notifications' : 'All notifications are up to date'}</span>
              {!showAll && (
                <button className="settings-cta" onClick={() => setShowAll(true)}>
                  <i className='bx bx-show'></i>
                  Show All Notifications (including seen)
                </button>
              )}
            </div>
          ) : (
            <div className="notification-list-container">
              {/* Pending Action Notifications */}
              {requisitionNotifications.length > 0 && (
                <div className="notification-section">
                  <h4 className="notification-section-title">
                    <i className='bx bx-time-five'></i> Pending Your Action
                  </h4>
                  <div className="notification-list">
                    {requisitionNotifications.map((req) => (
                      <div 
                        key={req.id} 
                        className="notification-item"
                        onClick={() => handleRequisitionClick(req.id)}
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
                        onClick={() => handleRequisitionClick(req.id)}
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

export default NotificationCenter;
