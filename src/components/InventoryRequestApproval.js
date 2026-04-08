import React, { useState, useEffect } from 'react';
import API_CONFIG from '../config/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Package, 
  User, 
  Mail, 
  Calendar,
  Search,
  Filter,
  ChevronDown,
  X
} from 'lucide-react';
import './InventoryRequestApproval.css';

const InventoryRequestApproval = ({ user, hasManagePermission = false }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalQuantity, setApprovalQuantity] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Check if user is finance role or has inventory manage permission
  const userRole = user?.role?.toLowerCase() || '';
  const isFinanceUser = userRole === 'finance';
  const canManageRequests = hasManagePermission || isFinanceUser;

  useEffect(() => {
    if (canManageRequests) {
      fetchPendingRequests();
      fetchAllRequests();
    }
  }, [canManageRequests]);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/requests/pending`);
      const result = await response.json();
      
      if (result.success) {
        setPendingRequests(result.requests || []);
      } else {
        console.error('Failed to fetch pending requests:', result.message);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/requests`);
      const result = await response.json();
      
      if (result.success) {
        setAllRequests(result.requests || result.data || []);
      }
    } catch (error) {
      console.error('Error fetching all requests:', error);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setApprovalQuantity(request.quantity_requested.toString());
    setShowApproveModal(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    
    if (!approvalQuantity || parseInt(approvalQuantity) <= 0) {
      alert('Please enter a valid approval quantity');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/request/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_by: user?.id || 1,
          approved_by_name: user?.full_name || user?.name || 'Admin User',
          quantity_approved: parseInt(approvalQuantity)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Request approved successfully! ${result.status === 'partially_approved' ? 'Partial approval granted.' : 'Stock has been automatically reduced.'}`);
        setShowApproveModal(false);
        fetchPendingRequests();
        fetchAllRequests();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/request/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejected_by: user?.id || 1,
          rejected_by_name: user?.full_name || user?.name || 'Admin User',
          rejection_reason: rejectionReason.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Request rejected successfully. Rejection email sent to requestor.');
        setShowRejectModal(false);
        fetchPendingRequests();
        fetchAllRequests();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const filteredRequests = (allRequests || []).filter(request => {
    const matchesSearch = (request.requestor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.requestor_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesUrgency = filterUrgency === 'all' || request.urgency === filterUrgency;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'normal': return '#28a745';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved': return 'status-badge-approved';
      case 'rejected': return 'status-badge-rejected';
      case 'pending': return 'status-badge-pending';
      case 'partially_approved': return 'status-badge-partial';
      default: return 'status-badge-pending';
    }
  };

  if (!canManageRequests) {
    return (
      <div className="approval-page">
        <div className="permission-denied">
          <AlertTriangle size={48} className="icon-warning" />
          <h2>Access Denied</h2>
          <p>You don't have permission to manage inventory requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-request-approval-page">
      {/* Header */}
      <div className="approval-page-header">
        <div>
          <h1 className="page-title">Inventory Request Approvals</h1>
          <ul className="breadcrumb">
            <li><a href="#/admin/inventory">Inventory</a></li>
            /
            <li><a href="#" className="active">Request Approvals</a></li>
          </ul>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="approval-stats-grid">
        <div className="approval-stat-card">
          <div className="stat-icon bg-blue">
            <Clock size={24} className="text-blue" />
          </div>
          <div className="stat-info">
            <h3>{pendingRequests.length}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        <div className="approval-stat-card">
          <div className="stat-icon bg-green">
            <CheckCircle size={24} className="text-green" />
          </div>
          <div className="stat-info">
            <h3>{allRequests.filter(r => r.status === 'approved').length}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="approval-stat-card">
          <div className="stat-icon bg-red">
            <XCircle size={24} className="text-red" />
          </div>
          <div className="stat-info">
            <h3>{allRequests.filter(r => r.status === 'rejected').length}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="approval-stat-card">
          <div className="stat-icon bg-orange">
            <Package size={24} className="text-orange" />
          </div>
          <div className="stat-info">
            <h3>{allRequests.filter(r => r.status === 'partially_approved').length}</h3>
            <p>Partially Approved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="approval-filters">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by requestor, item, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="partially_approved">Partially Approved</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Urgency:</label>
          <select 
            value={filterUrgency} 
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Urgency</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="approval-table-container">
        <div className="table-header">
          <h3>All Requests ({filteredRequests.length})</h3>
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <Package size={64} className="empty-icon" />
            <h3>No Requests Found</h3>
            <p>There are no inventory requests matching your criteria.</p>
          </div>
        ) : (
          <table className="approval-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Requestor</th>
                <th>Department</th>
                <th>Qty Requested</th>
                <th>Current Stock</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className={`request-row status-${request.status}`}>
                  <td>#{request.id}</td>
                  <td>
                    <div className="item-info">
                      <strong>{request.item_name || 'Unknown Item'}</strong>
                      <small className="text-muted">{request.category || ''}</small>
                    </div>
                  </td>
                  <td>
                    <div className="requestor-info">
                      <User size={16} />
                      <span>{request.requestor_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{request.requestor_department || 'N/A'}</td>
                  <td>
                    <span className="quantity-badge">
                      {request.quantity_requested} {request.unit || 'units'}
                    </span>
                  </td>
                  <td>
                    <span className={`stock-level ${request.current_stock <= request.min_stock_level ? 'low' : 'good'}`}>
                      {request.current_stock} {request.unit || 'units'}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="urgency-badge"
                      style={{ backgroundColor: getUrgencyColor(request.urgency) }}
                    >
                      {request.urgency.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="date-info">
                      <Calendar size={14} />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="btn-approve"
                            onClick={() => handleApproveClick(request)}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={() => handleRejectClick(request)}
                            title="Reject"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <span className="action-text">✓ Approved</span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="action-text">✗ Rejected</span>
                      )}
                      {request.status === 'partially_approved' && (
                        <span className="action-text">✓ Partial</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Request #{selectedRequest.id}</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleApproveSubmit}>
              <div className="modal-body">
                <div className="request-details">
                  <h4>Request Details</h4>
                  <div className="detail-row">
                    <span className="label">Item:</span>
                    <span className="value">{selectedRequest.item_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Requestor:</span>
                    <span className="value">{selectedRequest.requestor_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Requested Quantity:</span>
                    <span className="value">{selectedRequest.quantity_requested} {selectedRequest.unit}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Current Stock:</span>
                    <span className={`value ${selectedRequest.current_stock < selectedRequest.quantity_requested ? 'warning' : ''}`}>
                      {selectedRequest.current_stock} {selectedRequest.unit}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Reason:</span>
                    <p className="reason-text">{selectedRequest.reason || 'No reason provided'}</p>
                  </div>
                </div>

                <div className="approval-input-group">
                  <label htmlFor="approvalQuantity">Quantity to Approve *</label>
                  <input
                    id="approvalQuantity"
                    type="number"
                    min="1"
                    max={selectedRequest.quantity_requested}
                    value={approvalQuantity}
                    onChange={(e) => setApprovalQuantity(e.target.value)}
                    required
                    placeholder="Enter quantity to approve"
                  />
                  {parseInt(approvalQuantity) < selectedRequest.quantity_requested && (
                    <small className="warning-text">
                      ⚠️ This will be a partial approval. Requestor will receive {approvalQuantity} out of {selectedRequest.quantity_requested} requested.
                    </small>
                  )}
                  {parseInt(approvalQuantity) > selectedRequest.current_stock && (
                    <small className="error-text">
                      ⚠️ Warning: Current stock ({selectedRequest.current_stock}) is less than approval quantity!
                    </small>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowApproveModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-approve">
                  <CheckCircle size={16} />
                  Confirm Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Request #{selectedRequest.id}</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <div className="request-details">
                  <h4>Request Details</h4>
                  <div className="detail-row">
                    <span className="label">Item:</span>
                    <span className="value">{selectedRequest.item_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Requestor:</span>
                    <span className="value">{selectedRequest.requestor_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Requested Quantity:</span>
                    <span className="value">{selectedRequest.quantity_requested} {selectedRequest.unit}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Reason:</span>
                    <p className="reason-text">{selectedRequest.reason || 'No reason provided'}</p>
                  </div>
                </div>

                <div className="rejection-input-group">
                  <label htmlFor="rejectionReason">Rejection Reason *</label>
                  <textarea
                    id="rejectionReason"
                    rows="4"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    placeholder="Explain why this request is being rejected..."
                  />
                  <small className="info-text">
                    ℹ️ A rejection email will be sent to {selectedRequest.requestor_email}
                  </small>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-reject">
                  <XCircle size={16} />
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryRequestApproval;
