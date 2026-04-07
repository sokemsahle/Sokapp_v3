import React, { useState, useEffect } from 'react';
import './LookupEditor.css';
import API_CONFIG from '../../config/api';

const LookupEditor = ({ user }) => {
    const [activeCategory, setActiveCategory] = useState('departments');
    const [lookupData, setLookupData] = useState({
        departments: [],
        positions: [],
        employeeStatuses: ['Active', 'Inactive', 'Former Employee'],
        inventoryCategories: [],
        assetCategories: []
    });
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch lookup data on mount
    useEffect(() => {
        fetchLookupData();
    }, []);

    const fetchLookupData = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOOKUP_DATA));
            const result = await response.json();
            
            if (result.success) {
                setLookupData({
                    departments: result.departments || [],
                    positions: result.positions || [],
                    employeeStatuses: result.employeeStatuses || ['Active', 'Inactive', 'Former Employee'],
                    inventoryCategories: result.inventoryCategories || [],
                    assetCategories: result.assetCategories || []
                });
            }
        } catch (error) {
            console.error('Error fetching lookup data:', error);
            // Fallback to default employee statuses
            setLookupData(prev => ({
                ...prev,
                employeeStatuses: ['Active', 'Inactive', 'Former Employee']
            }));
        }
    };

    const handleAddItem = async () => {
        if (!newItem.trim()) {
            setMessage('Please enter a value');
            return;
        }

        // Check for duplicates (case-insensitive)
        const exists = lookupData[activeCategory].some(
            item => item.toLowerCase() === newItem.trim().toLowerCase()
        );

        if (exists) {
            setMessage('This value already exists');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ADD_LOOKUP_ITEM), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeCategory,
                    value: newItem.trim()
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setMessage(`${activeCategory.slice(0, -1).charAt(0).toUpperCase() + activeCategory.slice(0, -1).slice(1)} added successfully!`);
                setNewItem('');
                
                // Update local state
                setLookupData(prev => ({
                    ...prev,
                    [activeCategory]: [...prev[activeCategory], newItem.trim()]
                }));
                
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to add: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding lookup item:', error);
            setMessage('Error adding item');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (itemToDelete) => {
        if (!window.confirm(`Are you sure you want to delete "${itemToDelete}"? This may affect existing records.`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.DELETE_LOOKUP_ITEM), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeCategory,
                    value: itemToDelete
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setMessage('Item deleted successfully!');
                
                // Update local state
                setLookupData(prev => ({
                    ...prev,
                    [activeCategory]: prev[activeCategory].filter(item => item !== itemToDelete)
                }));
                
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to delete: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting lookup item:', error);
            setMessage('Error deleting item');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'departments', label: 'Departments', icon: 'bx bx-building' },
        { id: 'positions', label: 'Positions', icon: 'bx bx-briefcase' },
        { id: 'employeeStatuses', label: 'Employee Statuses', icon: 'bx bx-user-circle' },
        { id: 'inventoryCategories', label: 'Inventory Categories', icon: 'bx bx-package' },
        { id: 'assetCategories', label: 'Asset Categories', icon: 'bx bx-building-house' }
    ];

    return (
        <div className="lookup-editor-container">
            <h2>Lookup List Editor</h2>
            <p className="section-description">Manage dropdown values used across the organization forms</p>

            <div className="lookup-layout">
                {/* Category Sidebar */}
                <div className="lookup-sidebar">
                    <h3>Categories</h3>
                    <ul className="category-menu">
                        {categories.map(cat => (
                            <li
                                key={cat.id}
                                className={activeCategory === cat.id ? 'active' : ''}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <i className={cat.icon}></i>
                                <span>{cat.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Content Area */}
                <div className="lookup-content">
                    {message && <div className="message-banner">{message}</div>}

                    <div className="lookup-header">
                        <h3>{categories.find(c => c.id === activeCategory)?.label}</h3>
                        <p className="lookup-description">
                            {activeCategory === 'departments' && 'Manage department names used in employee forms'}
                            {activeCategory === 'positions' && 'Manage job titles and positions'}
                            {activeCategory === 'employeeStatuses' && 'Manage employee status options'}
                            {activeCategory === 'inventoryCategories' && 'Manage inventory item categories'}
                            {activeCategory === 'assetCategories' && 'Manage fixed asset categories for organization resources'}
                        </p>
                    </div>

                    {/* Add New Item */}
                    {(user?.role === 'admin' || user?.assigned_role === 'admin') && (
                        <div className="add-item-section">
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                    placeholder={`Enter new ${activeCategory === 'inventoryCategories' || activeCategory === 'assetCategories' ? 'category' : activeCategory.slice(0, -1)}`}
                                    className="lookup-input"
                                />
                                <button
                                    className="btn-primary"
                                    onClick={handleAddItem}
                                    disabled={loading || !newItem.trim()}
                                >
                                    <i className='bx bx-plus'></i> Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Items List */}
                    <div className="items-list">
                        <h4>Current {categories.find(c => c.id === activeCategory)?.label}</h4>
                        <div className="items-grid">
                            {lookupData[activeCategory].map((item, index) => (
                                <div key={index} className="item-tag">
                                    <span>{item}</span>
                                    {(user?.role === 'admin' || user?.assigned_role === 'admin') && (
                                        <button
                                            className="delete-item-btn"
                                            onClick={() => handleDeleteItem(item)}
                                            title="Delete"
                                        >
                                            <i className='bx bx-x'></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {lookupData[activeCategory].length === 0 && (
                            <div className="no-items-message">
                                <i className='bx bx-info-circle'></i>
                                <p>No items found. Add your first {activeCategory === 'inventoryCategories' || activeCategory === 'assetCategories' ? 'category' : activeCategory.slice(0, -1)} above.</p>
                            </div>
                        )}
                    </div>

                    {/* Usage Info */}
                    <div className="usage-info">
                        <i className='bx bx-info-square'></i>
                        <div>
                            <strong>Usage Information:</strong>
                            <p>
                                {activeCategory === 'departments' && 'These department names will appear in the Employee Form dropdown when creating or editing employees.'}
                                {activeCategory === 'positions' && 'These positions will be available in the Employee Form position dropdown.'}
                                {activeCategory === 'employeeStatuses' && 'These status options control the employee lifecycle states (Active, Inactive, Former Employee).'}
                                {activeCategory === 'inventoryCategories' && 'These categories will appear in the Inventory Form when adding or editing inventory items.'}
                                {activeCategory === 'assetCategories' && 'These categories will appear in the Fixed Assets Form when adding or editing organization fixed assets.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LookupEditor;
