import React, { useState, useEffect } from 'react';
import '../Settings.css';

const ManageOfficeIPs = ({ user }) => {
    const [allowedIPs, setAllowedIPs] = useState([]);
    const [newIP, setNewIP] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fetching, setFetching] = useState(true);

    // Fetch allowed IPs on mount
    useEffect(() => {
        fetchAllowedIPs();
    }, []);

    const fetchAllowedIPs = async () => {
        try {
            setFetching(true);
            
            // Debug: Log the user object
            console.log('[ManageOfficeIPs] User object:', user);
            console.log('[ManageOfficeIPs] User ID:', user?.id);
            console.log('[ManageOfficeIPs] User ID type:', typeof user?.id);
            
            if (!user?.id) {
                console.error('[ManageOfficeIPs] ERROR: No user ID found!');
                setError('User not logged in or user ID missing');
                setFetching(false);
                return;
            }
            
            const userIdString = user.id.toString();
            console.log('[ManageOfficeIPs] Sending X-User-ID header:', userIdString);
            
            const response = await fetch('http://localhost:5000/api/admin/organization/ips', {
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userIdString
                }
            });
            
            console.log('[ManageOfficeIPs] Response status:', response.status);
            
            const result = await response.json();
            
            if (result.success) {
                setAllowedIPs(result.data || []);
            } else {
                setError(result.message || 'Failed to fetch allowed IPs');
            }
        } catch (err) {
            console.error('Error fetching IPs:', err);
            setError('Unable to connect to server');
        } finally {
            setFetching(false);
        }
    };

    const validateIP = (ip) => {
        // IPv4 pattern
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        // IPv6 pattern (simplified)
        const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/i;
        
        return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
    };

    const handleAddIP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newIP.trim()) {
            setError('Please enter an IP address');
            return;
        }

        if (!validateIP(newIP.trim())) {
            setError('Invalid IP address format. Please enter a valid IPv4 or IPv6 address.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/organization/ips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user?.id || ''
                },
                body: JSON.stringify({
                    ip_address: newIP.trim(),
                    description: description.trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('IP address added successfully!');
                setNewIP('');
                setDescription('');
                fetchAllowedIPs();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to add IP address');
            }
        } catch (err) {
            console.error('Error adding IP:', err);
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIP = async (id, ip) => {
        if (!window.confirm(`Are you sure you want to remove ${ip} from the allowed list?`)) {
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:5000/api/admin/organization/ips/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user?.id || ''
                }
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('IP address removed successfully!');
                fetchAllowedIPs();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to remove IP address');
            }
        } catch (err) {
            console.error('Error deleting IP:', err);
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDescription = async (id, currentDesc) => {
        const newDesc = prompt('Enter new description:', currentDesc || '');
        if (newDesc === null) return; // User cancelled

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:5000/api/admin/organization/ips/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user?.id || ''
                },
                body: JSON.stringify({
                    description: newDesc.trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('Description updated successfully!');
                fetchAllowedIPs();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to update description');
            }
        } catch (err) {
            console.error('Error updating IP:', err);
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <h2>Manage Office WiFi IPs</h2>
            <p className="panel-description">
                Control which IP addresses employees can use to clock in/out. Only devices connected to these authorized networks will be able to record attendance.
            </p>

            <div className="settings-layout">
                <div className="settings-content-full">
                    {/* Add New IP Form */}
                    <div className="settings-panel">
                        <h3>Add New Allowed IP</h3>
                        
                        {error && (
                            <div className="message-banner" style={{ backgroundColor: '#fee', color: '#c00', marginBottom: '15px' }}>
                                {error}
                            </div>
                        )}
                        
                        {success && (
                            <div className="message-banner" style={{ backgroundColor: '#efe', color: '#0a0', marginBottom: '15px' }}>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleAddIP} style={{ marginTop: '20px' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    IP Address *
                                </label>
                                <input
                                    type="text"
                                    value={newIP}
                                    onChange={(e) => setNewIP(e.target.value)}
                                    placeholder="e.g., 192.168.1.1 or 2001:db8::1"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                    disabled={loading}
                                />
                                <small style={{ color: '#666' }}>
                                    Supports both IPv4 (192.168.1.1) and IPv6 (2001:db8::1) formats
                                </small>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Main Office WiFi, Branch Office, etc."
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    backgroundColor: loading ? '#ccc' : '#4CAF50',
                                    color: 'white',
                                    padding: '12px 24px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Adding...' : 'Add IP Address'}
                            </button>
                        </form>
                    </div>

                    {/* Allowed IPs Table */}
                    <div className="settings-panel" style={{ marginTop: '30px' }}>
                        <h3>Currently Allowed IPs</h3>
                        
                        {fetching ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                Loading allowed IPs...
                            </div>
                        ) : allowedIPs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <i className='bx bx-info-circle' style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                                No allowed IPs configured yet. Add your first office WiFi IP above.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Added By</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Created At</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allowedIPs.map((ip) => (
                                            <tr 
                                                key={ip.id} 
                                                style={{ borderBottom: '1px solid #eee' }}
                                            >
                                                <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                    {ip.ip_address}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {ip.description || (
                                                        <span 
                                                            onClick={() => handleUpdateDescription(ip.id, ip.description)}
                                                            style={{ color: '#999', cursor: 'pointer', fontStyle: 'italic' }}
                                                            title="Click to add description"
                                                        >
                                                            <i className='bx bx-edit'></i> Add description
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', color: '#666' }}>
                                                    {ip.added_by_name || 'Unknown'}
                                                </td>
                                                <td style={{ padding: '12px', color: '#666' }}>
                                                    {new Date(ip.created_at).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDeleteIP(ip.id, ip.ip_address)}
                                                        disabled={loading}
                                                        style={{
                                                            backgroundColor: '#f44336',
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: loading ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        <i className='bx bx-trash'></i> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageOfficeIPs;
