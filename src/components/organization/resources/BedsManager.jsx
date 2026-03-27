import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../../config/api';

const BedsManager = ({ user }) => {
    const [rooms, setRooms] = useState([]);
    const [beds, setBeds] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        room_id: '',
        bed_number: '',
        status: 'available'
    });
    const [editingBed, setEditingBed] = useState(null);

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (selectedRoomId) {
            fetchBedsByRoom(selectedRoomId);
        } else {
            setBeds([]);
        }
    }, [selectedRoomId]);

    const fetchRooms = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOMS));
            const result = await response.json();
            if (result.success) {
                setRooms(result.data || []);
                // Auto-select first room if available
                if (result.data && result.data.length > 0) {
                    setSelectedRoomId(result.data[0].id.toString());
                    setFormData(prev => ({ ...prev, room_id: result.data[0].id.toString() }));
                }
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const fetchBedsByRoom = async (roomId) => {
        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS_BY_ROOM(roomId)));
            const result = await response.json();
            if (result.success) {
                setBeds(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching beds:', error);
            setMessage('Error fetching beds');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.room_id || !formData.bed_number.trim()) {
            setMessage('Please select a room and enter bed number');
            return;
        }

        setLoading(true);
        try {
            const url = editingBed 
                ? API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BED_BY_ID(editingBed.id))
                : API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BEDS);
            
            const method = editingBed ? 'PUT' : 'POST';
            
            const payload = {
                room_id: parseInt(formData.room_id),
                bed_number: formData.bed_number,
                status: formData.status
            };
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                setMessage(editingBed ? 'Bed updated successfully!' : 'Bed created successfully!');
                setFormData({ ...formData, bed_number: '' });
                setEditingBed(null);
                fetchBedsByRoom(formData.room_id);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(result.message || 'Failed to save bed');
            }
        } catch (error) {
            console.error('Error saving bed:', error);
            setMessage('Error saving bed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (bed) => {
        setEditingBed(bed);
        setFormData({
            room_id: bed.room_id.toString(),
            bed_number: bed.bed_number,
            status: bed.status
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (bedId) => {
        if (!window.confirm('Are you sure you want to delete this bed?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BED_BY_ID(bedId)), {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                setMessage('Bed deleted successfully!');
                fetchBedsByRoom(selectedRoomId);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(result.message || 'Failed to delete bed');
            }
        } catch (error) {
            console.error('Error deleting bed:', error);
            setMessage('Error deleting bed');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingBed(null);
        setFormData({ ...formData, bed_number: '' });
    };

    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        setSelectedRoomId(roomId);
        setFormData({ 
            room_id: roomId, 
            bed_number: '', 
            status: 'available' 
        });
    };

    return (
        <div className="resources-manager">
            <h3><i className='bx bx-bed'></i> Beds Management</h3>
            
            {message && <div className="message-banner">{message}</div>}
            
            {/* Room Selection */}
            <div className="room-selector-panel">
                <label htmlFor="room_select"><strong>Select Room:</strong></label>
                <select 
                    id="room_select"
                    value={selectedRoomId}
                    onChange={handleRoomChange}
                    className="room-select"
                >
                    <option value="">-- Choose a Room --</option>
                    {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                            {room.room_name} (Capacity: {room.capacity}, Available: {room.available_beds || 0})
                        </option>
                    ))}
                </select>
            </div>

            {/* Add/Edit Bed Form */}
            {selectedRoomId && (
                <div className="resource-form-panel">
                    <h4>{editingBed ? 'Edit Bed' : 'Add New Bed'}</h4>
                    <form onSubmit={handleSubmit} className="resource-form">
                        <div className="form-group">
                            <label htmlFor="bed_number">Bed Number *</label>
                            <input
                                type="text"
                                id="bed_number"
                                value={formData.bed_number}
                                onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                                placeholder="e.g., Bed A-101, Bunk 1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status *</label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                required
                            >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : editingBed ? 'bx-save' : 'bx-plus'}`}></i>
                                {loading ? 'Saving...' : editingBed ? 'Update Bed' : 'Add Bed'}
                            </button>
                            {editingBed && (
                                <button type="button" className="btn-secondary" onClick={handleCancel}>
                                    <i className='bx bx-x'></i> Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Beds List */}
            {selectedRoomId && (
                <div className="resource-list-panel">
                    <h4>Beds in Selected Room ({beds.length})</h4>
                    
                    {loading && !beds.length && (
                        <div className="loading-message">Loading beds...</div>
                    )}
                    
                    {!loading && beds.length === 0 && (
                        <div className="no-data-message">
                            <i className='bx bx-info-circle'></i>
                            <p>No beds added to this room yet. Add your first bed above.</p>
                        </div>
                    )}

                    <div className="resource-grid">
                        {beds.map((bed) => (
                            <div key={bed.id} className={`resource-card ${bed.status}`}>
                                <div className="card-header">
                                    <h5>{bed.bed_number}</h5>
                                    <span className={`status-badge ${bed.status}`}>
                                        {bed.status === 'available' ? (
                                            <>
                                                <i className='bx bx-check-circle'></i> Available
                                            </>
                                        ) : (
                                            <>
                                                <i className='bx bx-x-circle'></i> Occupied
                                            </>
                                        )}
                                    </span>
                                </div>
                                
                                <div className="card-body">
                                    <div className="room-info">
                                        <i className='bx bx-buildings'></i>
                                        <span>{bed.room_name}</span>
                                    </div>
                                </div>
                                
                                <div className="card-actions">
                                    <button 
                                        className="btn-icon btn-edit"
                                        onClick={() => handleEdit(bed)}
                                        title="Edit bed"
                                    >
                                        <i className='bx bx-edit'></i>
                                    </button>
                                    <button 
                                        className="btn-icon btn-delete"
                                        onClick={() => handleDelete(bed.id)}
                                        title="Delete bed"
                                    >
                                        <i className='bx bx-trash'></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BedsManager;
