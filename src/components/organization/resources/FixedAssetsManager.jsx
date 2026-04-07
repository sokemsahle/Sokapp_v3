import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../../config/api';
import './Resources.css';

const FixedAssetsManager = ({ user }) => {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState(null);
    const [expandedAssetId, setExpandedAssetId] = useState(null);
    const [maintenanceLogs, setMaintenanceLogs] = useState({});
    const [formData, setFormData] = useState({
        asset_name: '',
        asset_category: '',
        asset_code: '',
        serial_number: '',
        manufacturer: '',
        model: '',
        purchase_date: '',
        purchase_price: '',
        supplier: '',
        warranty_period_months: '',
        location: '',
        condition_status: 'good',
        availability_status: 'available',
        assigned_to: '',
        notes: '',
        depreciation_rate: 0,
        current_value: ''
    });
    const [editingAsset, setEditingAsset] = useState(null);

    useEffect(() => {
        fetchCategories();
        fetchAssets();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ASSET_CATEGORIES));
            const result = await response.json();
            if (result.success) {
                setCategories(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FIXED_ASSETS));
            const result = await response.json();
            if (result.success) {
                setAssets(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching fixed assets:', error);
            setMessage('Error fetching fixed assets');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.asset_name.trim() || !formData.asset_category) {
            setMessage('Please enter asset name and select category');
            return;
        }

        setLoading(true);
        try {
            const url = editingAsset 
                ? API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ASSET_BY_ID(editingAsset.id))
                : API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FIXED_ASSETS);
            
            const method = editingAsset ? 'PUT' : 'POST';
            
            const payload = {
                organization_id: user?.id || user?.user_id || 1,
                ...formData,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                current_value: formData.current_value ? parseInt(formData.current_value) : null,
                depreciation_rate: formData.depreciation_rate ? parseFloat(formData.depreciation_rate) : 0,
                warranty_period_months: formData.warranty_period_months ? parseInt(formData.warranty_period_months) : null
            };
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                setMessage(editingAsset ? 'Asset updated successfully!' : 'Asset created successfully!');
                resetForm();
                fetchAssets();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(result.message || 'Failed to save asset');
            }
        } catch (error) {
            console.error('Error saving fixed asset:', error);
            setMessage('Error saving fixed asset');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (asset) => {
        setEditingAsset(asset);
        setFormData({
            asset_name: asset.asset_name,
            asset_category: asset.asset_category,
            asset_code: asset.asset_code || '',
            serial_number: asset.serial_number || '',
            manufacturer: asset.manufacturer || '',
            model: asset.model || '',
            purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
            purchase_price: asset.purchase_price || '',
            supplier: asset.supplier || '',
            warranty_period_months: asset.warranty_period_months || '',
            location: asset.location || '',
            condition_status: asset.condition_status,
            availability_status: asset.availability_status,
            assigned_to: asset.assigned_to || '',
            notes: asset.notes || '',
            depreciation_rate: asset.depreciation_rate || 0,
            current_value: asset.current_value || ''
        });
        setShowAssetForm(true);
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm('Are you sure you want to delete this fixed asset? This will also delete all maintenance records.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ASSET_BY_ID(assetId)), {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                setMessage('Fixed asset deleted successfully!');
                fetchAssets();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(result.message || 'Failed to delete fixed asset');
            }
        } catch (error) {
            console.error('Error deleting fixed asset:', error);
            setMessage('Error deleting fixed asset');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMaintenance = (asset) => {
        setSelectedAssetForMaintenance(asset);
        setShowMaintenanceForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleMaintenanceLog = async (assetId) => {
        if (expandedAssetId === assetId) {
            setExpandedAssetId(null);
            return;
        }
        
        // Fetch maintenance logs if not already loaded
        if (!maintenanceLogs[assetId]) {
            try {
                const response = await fetch(API_CONFIG.getUrl(`/api/fixed-assets/${assetId}`));
                const result = await response.json();
                if (result.success) {
                    setMaintenanceLogs(prev => ({
                        ...prev,
                        [assetId]: result.data.maintenance_history || []
                    }));
                }
            } catch (error) {
                console.error('Error fetching maintenance logs:', error);
            }
        }
        setExpandedAssetId(assetId);
    };

    const getMaintenanceTypeBadgeClass = (type) => {
        switch(type) {
            case 'routine': return 'badge-info';
            case 'repair': return 'badge-warning';
            case 'inspection': return 'badge-success';
            case 'replacement': return 'badge-danger';
            default: return '';
        }
    };

    const resetForm = () => {
        setFormData({
            asset_name: '',
            asset_category: '',
            asset_code: '',
            serial_number: '',
            manufacturer: '',
            model: '',
            purchase_date: '',
            purchase_price: '',
            supplier: '',
            warranty_period_months: '',
            location: '',
            condition_status: 'good',
            availability_status: 'available',
            assigned_to: '',
            notes: '',
            depreciation_rate: 0,
            current_value: ''
        });
        setEditingAsset(null);
    };

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'available': return 'status-available';
            case 'in_use': return 'status-in-use';
            case 'under_maintenance': return 'status-maintenance';
            case 'retired': return 'status-retired';
            default: return '';
        }
    };

    const getConditionBadgeClass = (condition) => {
        switch(condition) {
            case 'excellent': return 'condition-excellent';
            case 'good': return 'condition-good';
            case 'fair': return 'condition-fair';
            case 'poor': return 'condition-poor';
            case 'damaged': return 'condition-damaged';
            default: return '';
        }
    };

    return (
        <div className="resources-manager">
            <h3><i className='bx bx-store'></i> Fixed Assets Management</h3>
            
            {message && <div className="message-banner">{message}</div>}
            
            {/* Add Asset Button */}
            <div className="action-bar" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Fixed Assets ({assets.length})</h4>
                <button 
                    className="btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowAssetForm(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <i className='bx bx-plus'></i> Add New Fixed Asset
                </button>
            </div>
            
            {/* Asset Form Modal Popup */}
            {showAssetForm && (
                <div className="modal-overlay asset-form-modal" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowAssetForm(false);
                        resetForm();
                    }
                }}>
                    <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <h4>
                                <i className='bx bx-store'></i> {editingAsset ? 'Edit Fixed Asset' : 'Add New Fixed Asset'}
                            </h4>
                            <button 
                                className="modal-close"
                                onClick={() => {
                                    setShowAssetForm(false);
                                    resetForm();
                                }}
                            >
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <div className="asset-form-content">
                            <form onSubmit={handleSubmit} className="resource-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="asset_name">Asset Name *</label>
                            <input
                                type="text"
                                id="asset_name"
                                value={formData.asset_name}
                                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                                placeholder="e.g., Office Desk, Laptop Computer"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="asset_category">Category *</label>
                            <select
                                id="asset_category"
                                value={formData.asset_category}
                                onChange={(e) => setFormData({ ...formData, asset_category: e.target.value })}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="asset_code">Asset Code</label>
                            <input
                                type="text"
                                id="asset_code"
                                value={formData.asset_code}
                                onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                                placeholder="e.g., FURN-001, IT-002"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="serial_number">Serial Number</label>
                            <input
                                type="text"
                                id="serial_number"
                                value={formData.serial_number}
                                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                placeholder="Manufacturer serial number"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="manufacturer">Manufacturer</label>
                            <input
                                type="text"
                                id="manufacturer"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                placeholder="e.g., Dell, IKEA, Samsung"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="model">Model</label>
                            <input
                                type="text"
                                id="model"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                placeholder="Model number/name"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="purchase_date">Purchase Date</label>
                            <input
                                type="date"
                                id="purchase_date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="purchase_price">Purchase Price (Birr)</label>
                            <input
                                type="number"
                                id="purchase_price"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="supplier">Supplier</label>
                            <input
                                type="text"
                                id="supplier"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                placeholder="Supplier name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="warranty_period_months">Warranty Period (Months)</label>
                            <input
                                type="number"
                                id="warranty_period_months"
                                value={formData.warranty_period_months}
                                onChange={(e) => setFormData({ ...formData, warranty_period_months: e.target.value })}
                                placeholder="e.g., 24"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input
                                type="text"
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Main Office Room 1"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="assigned_to">Assigned To</label>
                            <input
                                type="text"
                                id="assigned_to"
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                placeholder="Person/Department using this asset"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="condition_status">Condition Status *</label>
                            <select
                                id="condition_status"
                                value={formData.condition_status}
                                onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
                                required
                            >
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                                <option value="damaged">Damaged</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="availability_status">Availability Status *</label>
                            <select
                                id="availability_status"
                                value={formData.availability_status}
                                onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                                required
                            >
                                <option value="available">Available</option>
                                <option value="in_use">In Use</option>
                                <option value="under_maintenance">Under Maintenance</option>
                                <option value="retired">Retired</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="current_value">Amount Available</label>
                            <input
                                type="number"
                                id="current_value"
                                value={formData.current_value}
                                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                placeholder="e.g., 10, 50, 100"
                                step="1"
                                min="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="depreciation_rate">Depreciation Rate (%)</label>
                            <input
                                type="number"
                                id="depreciation_rate"
                                value={formData.depreciation_rate}
                                onChange={(e) => setFormData({ ...formData, depreciation_rate: e.target.value })}
                                placeholder="Annual depreciation %"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            placeholder="Additional information about this asset..."
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : editingAsset ? 'bx-save' : 'bx-plus'}`}></i>
                            {loading ? 'Saving...' : editingAsset ? 'Update Asset' : 'Add Asset'}
                        </button>
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={() => {
                                setShowAssetForm(false);
                                resetForm();
                            }}
                        >
                            <i className='bx bx-x'></i> Cancel
                        </button>
                    </div>
                </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Maintenance Log Modal Popup */}
            {showMaintenanceForm && selectedAssetForMaintenance && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowMaintenanceForm(false);
                        setSelectedAssetForMaintenance(null);
                    }
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>
                                <i className='bx bx-wrench'></i> Add Maintenance Log - {selectedAssetForMaintenance.asset_name}
                            </h4>
                            <button 
                                className="modal-close"
                                onClick={() => {
                                    setShowMaintenanceForm(false);
                                    setSelectedAssetForMaintenance(null);
                                }}
                            >
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <MaintenanceLogForm 
                            asset={selectedAssetForMaintenance}
                            onCancel={() => {
                                setShowMaintenanceForm(false);
                                setSelectedAssetForMaintenance(null);
                            }}
                            onSuccess={() => {
                                setShowMaintenanceForm(false);
                                setSelectedAssetForMaintenance(null);
                                fetchAssets();
                                setMessage('Maintenance log added successfully!');
                                setTimeout(() => setMessage(''), 3000);
                            }}
                        />
                    </div>
                </div>
            )}
            
            {/* Assets List */}
            <div className="resource-list-panel">
                <h4>Fixed Assets ({assets.length})</h4>
                
                {loading && !assets.length && (
                    <div className="loading-message">Loading fixed assets...</div>
                )}
                
                {!loading && assets.length === 0 && (
                    <div className="no-data-message">
                        <i className='bx bx-info-circle'></i>
                        <p>No fixed assets added yet. Add your first asset above.</p>
                    </div>
                )}

                <div className="resource-grid">
                    {assets.map((asset) => (
                        <div key={asset.id} className="asset-card">
                            <div className="card-header">
                                <div className="asset-title-section">
                                    <h5>{asset.asset_name}</h5>
                                    <span className="category-badge">{asset.asset_category}</span>
                                </div>
                                {asset.asset_code && (
                                    <span className="asset-code">{asset.asset_code}</span>
                                )}
                            </div>
                            
                            <div className="card-body">
                                <div className="asset-details">
                                    {asset.manufacturer && (
                                        <div className="detail-item">
                                            <i className='bx bx-buildings'></i>
                                            <span>{asset.manufacturer} {asset.model}</span>
                                        </div>
                                    )}
                                    {asset.location && (
                                        <div className="detail-item">
                                            <i className='bx bx-map'></i>
                                            <span>{asset.location}</span>
                                        </div>
                                    )}
                                    {asset.assigned_to && (
                                        <div className="detail-item">
                                            <i className='bx bx-user'></i>
                                            <span>{asset.assigned_to}</span>
                                        </div>
                                    )}
                                    <div className="asset-status-badges">
                                        <span className={`badge ${getStatusBadgeClass(asset.availability_status)}`}>
                                            {asset.availability_status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`badge ${getConditionBadgeClass(asset.condition_status)}`}>
                                            {asset.condition_status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                
                                {(asset.purchase_price || asset.current_value) && (
                                    <div className="asset-value">
                                        {asset.purchase_price && (
                                            <div className="value-item">
                                                <span className="label">Purchase Price:</span>
                                                <span className="value">{parseFloat(asset.purchase_price).toFixed(2)} Birr</span>
                                            </div>
                                        )}
                                        {asset.current_value && (
                                            <div className="value-item highlight">
                                                <span className="label">Amount Available:</span>
                                                <span className="value">{parseInt(asset.current_value)} items</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="card-actions">
                                <button 
                                    className="btn-icon btn-edit"
                                    onClick={() => handleEdit(asset)}
                                    title="Edit asset"
                                >
                                    <i className='bx bx-edit'></i>
                                </button>
                                <button 
                                    className="btn-icon btn-maintenance"
                                    onClick={() => handleAddMaintenance(asset)}
                                    title="Add maintenance log"
                                >
                                    <i className='bx bx-plus'></i>
                                </button>
                                <button 
                                    className="btn-icon"
                                    style={{backgroundColor: '#17a2b8'}}
                                    onClick={() => toggleMaintenanceLog(asset.id)}
                                    title="View maintenance logs"
                                >
                                    <i className='bx bx-list-ul'></i>
                                </button>
                                <button 
                                    className="btn-icon btn-delete"
                                    onClick={() => handleDelete(asset.id)}
                                    title="Delete asset"
                                >
                                    <i className='bx bx-trash'></i>
                                </button>
                            </div>
                            
                            {/* Maintenance Log Display */}
                            {expandedAssetId === asset.id && (
                                <div className="maintenance-log-display">
                                    <h5>Maintenance History</h5>
                                    {!maintenanceLogs[asset.id] || maintenanceLogs[asset.id].length === 0 ? (
                                        <p className="no-data">No maintenance records found.</p>
                                    ) : (
                                        <div className="maintenance-logs-list">
                                            {maintenanceLogs[asset.id].map((log) => (
                                                <div key={log.id} className="maintenance-log-item">
                                                    <div className="log-header">
                                                        <span className={`badge ${getMaintenanceTypeBadgeClass(log.maintenance_type)}`}>
                                                            {log.maintenance_type.toUpperCase()}
                                                        </span>
                                                        <span className="log-date">{new Date(log.maintenance_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="log-description">{log.description}</p>
                                                    {(log.performed_by || log.cost) && (
                                                        <div className="log-details">
                                                            {log.performed_by && (
                                                                <span className="log-performer">
                                                                    <i className='bx bx-user'></i> {log.performed_by}
                                                                </span>
                                                            )}
                                                            {log.cost && (
                                                                <span className="log-cost">
                                                                    <i className='bx bx-money'></i> {parseFloat(log.cost).toFixed(2)} Birr
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {log.next_scheduled_date && (
                                                        <div className="log-next-scheduled">
                                                            <strong>Next Scheduled:</strong> {new Date(log.next_scheduled_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Maintenance Log Form Component
const MaintenanceLogForm = ({ asset, onCancel, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        maintenance_date: new Date().toISOString().split('T')[0],
        maintenance_type: 'routine',
        description: '',
        performed_by: '',
        cost: '',
        next_scheduled_date: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.description.trim()) {
            alert('Please enter maintenance description');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ASSET_MAINTENANCE(asset.id)), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cost: formData.cost ? parseFloat(formData.cost) : null
                })
            });
            
            const result = await response.json();
            if (result.success) {
                onSuccess();
            } else {
                alert(result.message || 'Failed to add maintenance log');
            }
        } catch (error) {
            console.error('Error adding maintenance log:', error);
            alert('Error adding maintenance log');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="maintenance-form-content">
            <form onSubmit={handleSubmit} className="resource-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="maintenance_date">Maintenance Date *</label>
                        <input
                            type="date"
                            id="maintenance_date"
                            value={formData.maintenance_date}
                            onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="maintenance_type">Maintenance Type *</label>
                        <select
                            id="maintenance_type"
                            value={formData.maintenance_type}
                            onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                            required
                        >
                            <option value="routine">Routine Maintenance</option>
                            <option value="repair">Repair</option>
                            <option value="inspection">Inspection</option>
                            <option value="replacement">Replacement</option>
                        </select>
                    </div>
                </div>

                <div className="form-group full-width">
                    <label htmlFor="description">Description *</label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        placeholder="Describe the maintenance work performed..."
                        required
                    ></textarea>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="performed_by">Performed By</label>
                        <input
                            type="text"
                            id="performed_by"
                            value={formData.performed_by}
                            onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                            placeholder="Technician/Company name"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="cost">Cost (Birr)</label>
                        <input
                            type="number"
                            id="cost"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                        />
                    </div>
                </div>

                <div className="form-group full-width">
                    <label htmlFor="next_scheduled_date">Next Scheduled Date</label>
                    <input
                        type="date"
                        id="next_scheduled_date"
                        value={formData.next_scheduled_date}
                        onChange={(e) => setFormData({ ...formData, next_scheduled_date: e.target.value })}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : 'bx-save'}`}></i>
                        {loading ? 'Saving...' : 'Add Maintenance Log'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        <i className='bx bx-x'></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FixedAssetsManager;
