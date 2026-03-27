import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Package,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import './inventory.css';

const ReturnableItems = ({ user, hasManagePermission = false }) => {
  const navigate = useNavigate();
  const [checkedOutItems, setCheckedOutItems] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checked-out'); // 'checked-out' or 'history'
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  
  const [checkoutFormData, setCheckoutFormData] = useState({
    inventory_id: '',
    borrower_name: user?.full_name || user?.name || '',
    borrower_email: user?.email || '',
    borrower_department: '',
    quantity: 1,
    expected_return_date: '',
    condition_at_checkout: '',
    notes: ''
  });

  const [returnFormData, setReturnFormData] = useState({
    condition_at_return: '',
    notes: ''
  });

  // Fetch checked out items
  const fetchCheckedOutItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory/returnable/checked-out');
      const result = await response.json();
      if (result.success) {
        setCheckedOutItems(result.transactions);
      }
    } catch (error) {
      console.error('Error fetching checked out items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory/returnable/history');
      const result = await response.json();
      if (result.success) {
        setTransactionHistory(result.transactions);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'checked-out') {
      fetchCheckedOutItems();
    } else {
      fetchTransactionHistory();
    }
  }, [activeTab]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/inventory/returnable/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutFormData)
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Item checked out successfully!');
        setShowCheckoutModal(false);
        setCheckoutFormData({
          inventory_id: '',
          borrower_name: user?.full_name || user?.name || '',
          borrower_email: user?.email || '',
          borrower_department: '',
          quantity: 1,
          expected_return_date: '',
          condition_at_checkout: '',
          notes: ''
        });
        fetchCheckedOutItems();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error checking out item:', error);
      alert('Failed to checkout item');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      const response = await fetch(`http://localhost:5000/api/inventory/returnable/${selectedTransaction.id}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnFormData)
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Item returned successfully! Inventory updated automatically.');
        setShowReturnModal(false);
        setReturnFormData({
          condition_at_return: '',
          notes: ''
        });
        setSelectedTransaction(null);
        fetchCheckedOutItems();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error returning item:', error);
      alert('Failed to return item');
    }
  };

  const openCheckoutModal = async () => {
    setShowCheckoutModal(true);
    
    // Load returnable items for dropdown
    try {
      const response = await fetch('http://localhost:5000/api/inventory?status=In%20Stock');
      const result = await response.json();
      if (result.success) {
        const returnableItems = result.items.filter(item => item.is_returnable && item.quantity > 0);
        setAvailableItems(returnableItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const openReturnModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReturnModal(true);
  };

  const filteredCheckedOut = (checkedOutItems || []).filter(item => 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.borrower_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = (transactionHistory || []).filter(item => 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.borrower_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div className="error-message">Please log in to access this page</div>;
  }

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/admin/inventory')}
            style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <ArrowLeft size={16} />
            Back to Inventory
          </button>
          <h1 className="page-title">Returnable Items Tracking</h1>
          <ul className="breadcrumb">
            <li><a href="/admin/inventory">Inventory</a></li> /
            <li><a href="#" className="active">Returnable Items</a></li>
          </ul>
        </div>
        {hasManagePermission && (
          <button className="btn-primary" onClick={openCheckoutModal}>
            <Download size={20} />
            <span>Checkout Item</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button 
          className={`tab ${activeTab === 'checked-out' ? 'active' : ''}`}
          onClick={() => setActiveTab('checked-out')}
        >
          <Package size={18} />
          Currently Checked Out ({checkedOutItems.length})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={18} />
          Transaction History
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by item name, borrower name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading...</p>
        </div>
      )}

      {/* Checked Out Items Tab */}
      {!loading && activeTab === 'checked-out' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Borrower</th>
                <th>Department</th>
                <th>Quantity</th>
                <th>Checkout Date</th>
                <th>Expected Return</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCheckedOut.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data-cell">
                    No items currently checked out
                  </td>
                </tr>
              ) : (
                filteredCheckedOut.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.item_name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="#666" />
                        <div>
                          <div>{item.borrower_name}</div>
                          <div style={{ fontSize: '0.85em', color: '#666' }}>{item.borrower_email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.borrower_department || 'N/A'}</td>
                    <td>{item.quantity}</td>
                    <td>{new Date(item.checkout_date).toLocaleDateString()}</td>
                    <td>
                      {item.expected_return_date ? (
                        <span style={{ 
                          color: new Date(item.expected_return_date) < new Date() ? '#e74c3c' : '#f39c12',
                          fontWeight: '500'
                        }}>
                          {new Date(item.expected_return_date).toLocaleDateString()}
                        </span>
                      ) : (
                        'Not set'
                      )}
                    </td>
                    <td>
                      {hasManagePermission && (
                        <button 
                          className="btn-primary" 
                          onClick={() => openReturnModal(item)}
                          style={{ padding: '5px 10px', fontSize: '0.9em' }}
                        >
                          <CheckCircle size={16} />
                          <span style={{ marginLeft: '5px' }}>Return</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction History Tab */}
      {!loading && activeTab === 'history' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Borrower</th>
                <th>Checkout Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data-cell">
                    No transaction history found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.item_name}</td>
                    <td>
                      <div>{item.borrower_name}</div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>{item.borrower_email}</div>
                    </td>
                    <td>{new Date(item.checkout_date).toLocaleDateString()}</td>
                    <td>
                      {item.actual_return_date 
                        ? new Date(item.actual_return_date).toLocaleDateString()
                        : '—'
                      }
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {item.condition_at_return || item.condition_at_checkout || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Checkout Returnable Item</h3>
              <button className="close-btn" onClick={() => setShowCheckoutModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCheckout}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Select Item *</label>
                  <select
                    name="inventory_id"
                    value={checkoutFormData.inventory_id}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, inventory_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Select a returnable item --</option>
                    {availableItems?.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.category} (Available: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Borrower Name *</label>
                  <input
                    type="text"
                    name="borrower_name"
                    value={checkoutFormData.borrower_name}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, borrower_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Borrower Email *</label>
                  <input
                    type="email"
                    name="borrower_email"
                    value={checkoutFormData.borrower_email}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, borrower_email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="borrower_department"
                    value={checkoutFormData.borrower_department}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, borrower_department: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={checkoutFormData.quantity}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expected Return Date</label>
                  <input
                    type="date"
                    name="expected_return_date"
                    value={checkoutFormData.expected_return_date}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Condition at Checkout</label>
                  <textarea
                    name="condition_at_checkout"
                    value={checkoutFormData.condition_at_checkout}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, condition_at_checkout: e.target.value }))}
                    rows="2"
                    placeholder="Describe item condition..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={checkoutFormData.notes}
                    onChange={(e) => setCheckoutFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="2"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCheckoutModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Checkout Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Return Item: {selectedTransaction.item_name}</h3>
              <button className="close-btn" onClick={() => setShowReturnModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReturn}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Borrower</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                    {selectedTransaction.borrower_name}
                  </div>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                    {selectedTransaction.quantity}
                  </div>
                </div>
                <div className="form-group">
                  <label>Checkout Date</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                    {new Date(selectedTransaction.checkout_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Condition at Return</label>
                  <textarea
                    name="condition_at_return"
                    value={returnFormData.condition_at_return}
                    onChange={(e) => setReturnFormData(prev => ({ ...prev, condition_at_return: e.target.value }))}
                    rows="3"
                    placeholder="Describe item condition upon return..."
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={returnFormData.notes}
                    onChange={(e) => setReturnFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="2"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Upload size={18} />
                  <span style={{ marginLeft: '5px' }}>Confirm Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnableItems;
