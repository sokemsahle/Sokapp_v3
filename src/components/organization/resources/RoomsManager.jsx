import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../../config/api';

const RoomsManager = ({ user }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        room_name: '',
        capacity: 1
    });
    const [editingRoom, setEditingRoom] = useState(null);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOMS));
            const result = await response.json();
            if (result.success) {
                setRooms(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            setMessage('Error fetching rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.room_name.trim()) {
            setMessage('Please enter a room name');
            return;
        }

        setLoading(true);
        try {
            const url = editingRoom 
                ? API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOM_BY_ID(editingRoom.id))
                : API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOMS);
            
            const method = editingRoom ? 'PUT' : 'POST';
            
            const payload = {
                organization_id: user?.id || user?.user_id || 1, // Default to 1 if not available
                ...formData
            };
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                setMessage(editingRoom ? 'Room updated successfully!' : 'Room created successfully!');
                setFormData({ room_name: '', capacity: 1 });
                setEditingRoom(null);
                fetchRooms();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(result.message || 'Failed to save room');
            }
        } catch (error) {
            console.error('Error saving room:', error);
            setMessage('Error saving room');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (room) => {
        setEditingRoom(room);
        setFormData({
            room_name: room.room_name,
            capacity: room.capacity
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (roomId) => {
        if (!window.confirm('Are you sure you want to delete this room? This will also delete all beds in this room.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROOM_BY_ID(roomId)), {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                setMessage('Room deleted successfully!');
                fetchRooms();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(result.message || 'Failed to delete room');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            setMessage('Error deleting room');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingRoom(null);
        setFormData({ room_name: '', capacity: 1 });
    };

    return (
        <div className="resources-manager">
            <h3><i className='bx bx-buildings'></i> Dormitory Rooms Management</h3>
            
            {message && <div className="message-banner">{message}</div>}
            
            {/* Add/Edit Room Form */}
            <div className="resource-form-panel">
                <h4>{editingRoom ? 'Edit Room' : 'Add New Room'}</h4>
                <form onSubmit={handleSubmit} className="resource-form">
                    <div className="form-group">
                        <label htmlFor="room_name">Room Name *</label>
                        <input
                            type="text"
                            id="room_name"
                            value={formData.room_name}
                            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                            placeholder="e.g., Room 101, Block A"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="capacity">Capacity (Number of Beds) *</label>
                        <input
                            type="number"
                            id="capacity"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                            min="1"
                            max="50"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : editingRoom ? 'bx-save' : 'bx-plus'}`}></i>
                            {loading ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
                        </button>
                        {editingRoom && (
                            <button type="button" className="btn-secondary" onClick={handleCancel}>
                                <i className='bx bx-x'></i> Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Rooms List */}
            <div className="resource-list-panel">
                <h4>Existing Rooms ({rooms.length})</h4>
                
                {loading && !rooms.length && (
                    <div className="loading-message">Loading rooms...</div>
                )}
                
                {!loading && rooms.length === 0 && (
                    <div className="no-data-message">
                        <i className='bx bx-info-circle'></i>
                        <p>No rooms added yet. Add your first room above.</p>
                    </div>
                )}

                <div className="resource-grid">
                    {rooms.map((room) => (
                        <div key={room.id} className="resource-card">
                            <div className="card-header">
                                <h5>{room.room_name}</h5>
                                <span className="capacity-badge">
                                    Capacity: {room.capacity}
                                </span>
                            </div>
                            
                            <div className="card-body">
                                <div className="bed-stats">
                                    <div className="stat-item">
                                        <i className='bx bx-bed'></i>
                                        <span>Total Beds: {room.bed_count || 0}</span>
                                    </div>
                                    <div className="stat-item available">
                                        <i className='bx bx-check-circle'></i>
                                        <span>Available: {room.available_beds || 0}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="card-actions">
                                <button 
                                    className="btn-icon btn-edit"
                                    onClick={() => handleEdit(room)}
                                    title="Edit room"
                                >
                                    <i className='bx bx-edit'></i>
                                </button>
                                <button 
                                    className="btn-icon btn-delete"
                                    onClick={() => handleDelete(room.id)}
                                    title="Delete room"
                                >
                                    <i className='bx bx-trash'></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoomsManager;
