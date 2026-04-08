import React, { useState, useEffect } from 'react';
import { useNavigate }
from 'react-router-dom';
import { 
  Search,
  Plus,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import './inventory.css';
import { getPrograms } from '../services/programService';
import API_CONFIG from '../config/api';

const Inventory = ({ Inventoryopen, selectedProgram, user, hasManagePermission = false, viewMode = 'view' }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedItemForTransactions, setSelectedItemForTransactions] = useState(null);
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    location: '',
    min_stock_level: 10,
    description: '',
    supplier: '',
    cost_per_unit: '',
    program_id: '',
    has_expiry_date: false,
    expiry_date: '',
    is_returnable: false
  });
  const [programs, setPrograms] = useState([]);
  const [requestFormData, setRequestFormData] = useState({
    inventory_id: '',
    quantity_needed: '',
    reason: '',
    urgency: 'normal',
    expected_return_date: ''
  });

  // Fetch inventory data
  useEffect(() => {
    if (Inventoryopen) {
      loadPrograms();
      fetchInventoryCategories();
      if (viewMode === 'transactions') {
        fetchAllTransactions();
      } else {
        fetchInventory();
        fetchStats();
      }
    }
  }, [Inventoryopen, selectedProgram, viewMode]);

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

  const fetchInventoryCategories = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lookup`);
      const result = await response.json();
      if (result.success && result.inventoryCategories) {
        setInventoryCategories(result.inventoryCategories);
      } else {
        // Fallback to default categories if API fails
        setInventoryCategories([
          'Food & Nutrition',
          'Hygiene',
          'Education',
          'Medical',
          'Clothing',
          'Other'
        ]);
      }
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      // Fallback to default categories
      setInventoryCategories([
        'Food & Nutrition',
        'Hygiene',
        'Education',
        'Medical',
        'Clothing',
        'Other'
      ]);
    }
  };

  const fetchInventory = async () => {
    try {
      let url = `${API_CONFIG.BASE_URL}/api/inventory`;
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.items) {
        setItems(result.items);
      } else if (result.data) {
        // Fallback if data is in different format
        setItems(result.data);
      } else {
        // Default to empty array
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/stats/summary`);
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/transactions/all`);
      const result = await response.json();
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching all transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestItem = async (e) => {
    e.preventDefault();
    try {
      // Get selected item to check if it's returnable
      const selectedItem = items.find(item => item.id == requestFormData.inventory_id);
      const isReturnable = selectedItem && selectedItem.is_returnable;
      
      // Map quantity_needed to quantity_requested and add user details
      const requestData = {
        inventory_id: requestFormData.inventory_id,
        quantity_requested: requestFormData.quantity_needed,
        reason: requestFormData.reason,
        urgency: requestFormData.urgency,
        requestor_name: user?.full_name || user?.name || 'Unknown User',
        requestor_email: user?.email || 'unknown@example.com',
        requestor_department: user?.department || null,
        user_id: user?.id,
        is_returnable: isReturnable,
        expected_return_date: isReturnable ? (requestFormData.expected_return_date || null) : null
      };

      console.log('Submitting request with data:', requestData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const result = await response.json();
      console.log('Server response:', result);
      if (result.success) {
        const message = isReturnable 
          ? 'Item request submitted successfully! This item will be checked out to you upon approval.'
          : 'Item request submitted successfully!';
        alert(message);
        setRequestFormData({
          inventory_id: '',
          quantity_needed: '',
          reason: '',
          urgency: 'normal',
          expected_return_date: ''
        });
      } else {
        alert('Error: ' + (result.message || 'Failed to submit request'));
      }
    } catch (error) {
      console.error('Error requesting item:', error);
      alert('An error occurred while submitting your request');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      // Convert form data to proper types before sending
      const itemData = {
        ...formData,
        has_expiry_date: !!formData.has_expiry_date,  // Convert to boolean
        is_returnable: !!formData.is_returnable,      // Convert to boolean
        expiry_date: formData.expiry_date || null
      };
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const result = await response.json();
      if (result.success) {
        alert('Item created successfully!');
        setShowModal(false);
        resetForm();
        fetchInventory();
        fetchStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      // Convert form data to proper types before sending
      const itemData = {
        ...formData,
        has_expiry_date: !!formData.has_expiry_date,  // Convert to boolean
        is_returnable: !!formData.is_returnable,      // Convert to boolean
        expiry_date: formData.expiry_date || null
      };
      
      console.log('Updating item with data:', itemData);
      console.log('has_expiry_date value:', itemData.has_expiry_date);
      console.log('is_returnable value:', itemData.is_returnable);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const result = await response.json();
      if (result.success) {
        alert('Item updated successfully!');
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        fetchInventory();
        fetchStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/${id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          alert('Item deleted successfully!');
          fetchInventory();
          fetchStats();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      location: item.location,
      min_stock_level: item.min_stock_level || 10,
      description: item.description || '',
      supplier: item.supplier || '',
      cost_per_unit: item.cost_per_unit || '',
      program_id: item.program_id || '',
      has_expiry_date: item.has_expiry_date === 1 || item.has_expiry_date === true,
      expiry_date: item.expiry_date || '',
      is_returnable: item.is_returnable === 1 || item.is_returnable === true
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      location: '',
      min_stock_level: 10,
      description: '',
      supplier: '',
      cost_per_unit: '',
      program_id: '',
      has_expiry_date: false,
      expiry_date: '',
      is_returnable: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    
    // Convert string "true"/"false" to actual boolean for expiry and returnable fields
    if (name === 'has_expiry_date' || name === 'is_returnable') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Filter items
  const filteredItems = (items || []).filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set((items || []).map(item => item.category))].filter(Boolean);

  if (!Inventoryopen) return null;

  // Transaction Log View (Inventory Managers Only)
  if (viewMode === 'transactions' && hasManagePermission) {
    return (
      <div className="inventory-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Inventory Transaction Log</h1>
            <ul className="breadcrumb">
              <li><a href="/inventory">Inventory</a></li> /
              <li><a href="#" className="active">Transaction Log</a></li>
            </ul>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <div className="table-title">
              <h3>All Transactions ({transactions.length})</h3>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading transactions...</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity Change</th>
                  <th>Previous Qty</th>
                  <th>New Qty</th>
                  <th>Reason</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data-cell">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                      <td className="font-medium">{transaction.item_name || 'Item ID: ' + transaction.inventory_id}</td>
                      <td>
                        <span className={`status-badge ${transaction.transaction_type === 'IN' ? 'bg-green' : 'bg-red'}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td style={{ color: transaction.quantity_change > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                        {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                      </td>
                      <td>{transaction.previous_quantity}</td>
                      <td>{transaction.new_quantity}</td>
                      <td>{transaction.reason || '-'}</td>
                      <td>{transaction.created_by_name || 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Request Item View (Read-only mode for non-managers)
  if (viewMode === 'request') {
    return (
      <div className="inventory-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Request Inventory Item</h1>
            <ul className="breadcrumb">
              <li><a href="/inventory">Inventory</a></li> /
              <li><a href="#" className="active">Request Item</a></li>
            </ul>
          </div>
        </div>

        <div className="modal-overlay" style={{ position: 'relative', opacity: 1, background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="modal-header">
              <h3>Submit Item Request</h3>
            </div>
            <form onSubmit={handleRequestItem}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Select Item *</label>
                  <select 
                    name="inventory_id" 
                    value={requestFormData.inventory_id}
                    onChange={(e) => setRequestFormData(prev => ({ ...prev, inventory_id: e.target.value, expected_return_date: '' }))}
                    required
                  >
                    <option value="">-- Select an available item --</option>
                    {(items || []).filter(item => item.quantity > 0).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.category} (Available: {item.quantity} {item.unit})
                        {item.is_returnable ? ' [RETURNABLE]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity Needed *</label>
                  <input 
                    type="number" 
                    name="quantity_needed" 
                    value={requestFormData.quantity_needed}
                    onChange={(e) => setRequestFormData(prev => ({ ...prev, quantity_needed: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Urgency</label>
                  <select 
                    name="urgency" 
                    value={requestFormData.urgency}
                    onChange={(e) => setRequestFormData(prev => ({ ...prev, urgency: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                {requestFormData.inventory_id && items.find(item => item.id == requestFormData.inventory_id)?.is_returnable && (
                  <div className="form-group full-width">
                    <label>Expected Return Date (Optional)</label>
                    <input 
                      type="date" 
                      name="expected_return_date" 
                      value={requestFormData.expected_return_date}
                      onChange={(e) => setRequestFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                      ℹ️ This item is returnable. Please indicate when you plan to return it (optional).
                    </small>
                  </div>
                )}
                <div className="form-group full-width">
                  <label>Reason *</label>
                  <textarea 
                    name="reason" 
                    value={requestFormData.reason}
                    onChange={(e) => setRequestFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="4"
                    placeholder="Explain why you need this item"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Add Item View Mode (For Admin and Finance Users)
  if (viewMode === 'add') {
    return (
      <div className="inventory-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add New Inventory Item</h1>
            <ul className="breadcrumb">
              <li><a href="/admin/inventory">Inventory</a></li> /
              <li><a href="#" className="active">Add New Item</a></li>
            </ul>
          </div>
        </div>

        <div className="modal-overlay" style={{ position: 'relative', opacity: 1, background: 'transparent' }}>
          <div className="modal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="modal-header">
              <h3>Create New Inventory Item</h3>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    name="category" 
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {inventoryCategories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <input 
                    type="text" 
                    name="unit" 
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="e.g., Cans, Packs, Bottles"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Pantry A, Storage B"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Min Stock Level</label>
                  <input 
                    type="number" 
                    name="min_stock_level" 
                    value={formData.min_stock_level}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>Stored</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    value={formData.supplier}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Cost Per Unit</label>
                  <input 
                    type="number" 
                    name="cost_per_unit" 
                    value={formData.cost_per_unit}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Program</label>
                  <select 
                    name="program_id" 
                    value={formData.program_id}
                    onChange={handleInputChange}
                  >
                    <option value="">No Program</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Has Expiry Date?</label>
                  <select 
                    name="has_expiry_date" 
                    value={formData.has_expiry_date ? 'true' : 'false'}
                    onChange={handleInputChange}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {formData.has_expiry_date ? (
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input 
                      type="date" 
                      name="expiry_date" 
                      value={formData.expiry_date || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : null}
                <div className="form-group">
                  <label>Returnable?</label>
                  <select 
                    name="is_returnable" 
                    value={formData.is_returnable ? 'true' : 'false'}
                    onChange={handleInputChange}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => navigate('/admin/inventory')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Standard View Mode (with permission-based controls)
  return (
    <div className="inventory-page">
      {/* Header Section */}
      <div className="page-header">
        <div>
            <h1 className="page-title">Inventory</h1>
            <ul className="breadcrumb">
                <li><a href="#">Management</a></li>
                /
                <li><a href="#" className="active">Inventory</a></li>
            </ul>
        </div>
        {/* Only show Add button for users with manage permission */}
        {hasManagePermission && (
          <button className="btn-primary" onClick={openCreateModal}>
              <Plus size={20} />
              <span>Add New Item</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-icon bg-blue">
                <Package size={24} className="text-blue" />
            </div>
            <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Items</p>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon bg-green">
                <CheckCircle size={24} className="text-green" />
            </div>
            <div className="stat-info">
                <h3>{stats.inStock}</h3>
                <p>In Stock</p>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon bg-orange">
                <AlertTriangle size={24} className="text-orange" />
            </div>
            <div className="stat-info">
                <h3>{stats.lowStock}</h3>
                <p>Low Stock</p>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon bg-red">
                <XCircle size={24} className="text-red" />
            </div>
            <div className="stat-info">
                <h3>{stats.outOfStock}</h3>
                <p>Out of Stock</p>
            </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="table-container">
        <div className="table-header">
            <div className="table-title">
                <h3>Inventory Items ({filteredItems.length})</h3>
            </div>
            <div className="table-actions">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        </div>

        {loading ? (
            <div className="loading-state">Loading inventory...</div>
        ) : (
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Location</th>
                        <th>Expiry</th>
                        <th>Returnable</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="no-data-cell">
                                No items found. Click "Add New Item" to create one.
                            </td>
                        </tr>
                    ) : (
                        filteredItems.map((item) => (
                            <tr key={item.id}>
                                <td className="font-medium">{item.name}</td>
                                <td>
                                    <span className="category-badge">{item.category}</span>
                                </td>
                                <td>{item.quantity} {item.unit}</td>
                                <td>{item.location}</td>
                                <td>
                                    {item.has_expiry_date ? (
                                        <span style={{ color: '#e74c3c', fontWeight: '500' }}>
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'Not set'}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#95a5a6' }}>—</span>
                                    )}
                                </td>
                                <td>
                                    {item.is_returnable ? (
                                        <span style={{ color: '#27ae60', fontWeight: '500' }}>Yes</span>
                                    ) : (
                                        <span style={{ color: '#95a5a6' }}>No</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`status-badge ${item.status?.toLowerCase().replace(/ /g, '-')}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        {/* Only show edit/delete for managers */}
                                        {hasManagePermission ? (
                                          <>
                                            <button 
                                                className="btn-icon btn-edit" 
                                                title="Edit"
                                                onClick={() => openEditModal(item)}
                                            >
                                                <i className='bx bx-edit'></i>
                                            </button>
                                            <button 
                                                className="btn-icon btn-delete" 
                                                title="Delete"
                                                onClick={() => handleDeleteItem(item.id)}
                                            >
                                                <i className='bx bx-trash'></i>
                                            </button>
                                          </>
                                        ) : (
                                          <span style={{ color: '#666', fontSize: '0.85rem' }}>View Only</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                    <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                </div>
                <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Item Name *</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Category *</label>
                            <select 
                                name="category" 
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {inventoryCategories.map((category, index) => (
                                  <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Quantity *</label>
                            <input 
                                type="number" 
                                name="quantity" 
                                value={formData.quantity}
                                onChange={handleInputChange}
                                required
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Unit *</label>
                            <input 
                                type="text" 
                                name="unit" 
                                value={formData.unit}
                                onChange={handleInputChange}
                                placeholder="e.g., Cans, Packs, Bottles"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Location *</label>
                            <input 
                                type="text" 
                                name="location" 
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="e.g., Pantry A, Storage B"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Min Stock Level</label>
                            <input 
                                type="number" 
                                name="min_stock_level" 
                                value={formData.min_stock_level}
                                onChange={handleInputChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Description</label>
                            <textarea 
                                name="description" 
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="2"
                            />
                        </div>
                        <div className="form-group">
                            <label>Stored</label>
                            <input 
                                type="text" 
                                name="Stored" 
                                value={formData.stored}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Cost Per Unit</label>
                            <input 
                                type="number" 
                                name="cost_per_unit" 
                                value={formData.cost_per_unit}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label>Program</label>
                            <select 
                                name="program_id" 
                                value={formData.program_id}
                                onChange={handleInputChange}
                            >
                                <option value="">No Program</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>{program.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Has Expiry Date?</label>
                            <select 
                                name="has_expiry_date" 
                                value={formData.has_expiry_date ? 'true' : 'false'}
                                onChange={handleInputChange}
                            >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </select>
                        </div>
                        {formData.has_expiry_date ? (
                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input 
                                    type="date" 
                                    name="expiry_date" 
                                    value={formData.expiry_date || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                        ) : null}
                        <div className="form-group">
                            <label>Returnable?</label>
                            <select 
                                name="is_returnable" 
                                value={formData.is_returnable ? 'true' : 'false'}
                                onChange={handleInputChange}
                            >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingItem ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;