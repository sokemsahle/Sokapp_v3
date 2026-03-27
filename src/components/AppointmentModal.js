import React, { useState, useEffect } from 'react';
import './Appointments.css';
import API_CONFIG from '../config/api';
import { 
  formatDateToDDMMYYYY, 
  extractDateForInput, 
  extractTime,
  localToUTC 
} from '../utils/dateUtils';

const AppointmentModal = ({ isOpen, onClose, appointment, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    attendee_user_ids: [], // Changed to array for multiple attendees
    date: '', // YYYY-MM-DD format for input type="date"
    start_time: '', // HH:MM format for input type="time"
    end_time: '', // HH:MM format for input type="time"
    location: '',
    status: 'scheduled',
    reminder_minutes_before: 1 // Default to 1 minute
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch users list on mount
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (appointment && mode === 'edit') {
      // Parse attendee_user_ids from backend (comma-separated string) to array
      let attendeeIds = [];
      if (appointment.attendee_user_ids) {
        // Backend returns comma-separated string like "1,2,3"
        const idsString = typeof appointment.attendee_user_ids === 'string' 
          ? appointment.attendee_user_ids 
          : String(appointment.attendee_user_ids);
        attendeeIds = idsString.split(',').map(id => id.trim()).filter(id => id !== '');
      }
      
      // Handle both old (start_datetime) and new (start_time) field names from backend
      const startTime = appointment.start_time || appointment.start_datetime;
      const endTime = appointment.end_time || appointment.end_datetime;
      
      setFormData({
        title: appointment.title || '',
        description: appointment.description || '',
        attendee_user_ids: attendeeIds,
        date: extractDateForInput(startTime),
        start_time: extractTime(startTime),
        end_time: extractTime(endTime),
        location: appointment.location || '',
        status: appointment.status || 'scheduled',
        reminder_minutes_before: parseInt(appointment.reminder_minutes_before) || 1
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        attendee_user_ids: [],
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        status: 'scheduled',
        reminder_minutes_before: 1
      });
    }
  }, [appointment, mode]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS_LIST));
      const result = await response.json();
      
      if (result.success) {
        console.log('[AppointmentModal] Fetched users:', result.data);
        // Convert emails to lowercase for display consistency
        const usersWithLowercaseEmails = result.data.map(user => ({
          ...user,
          email: user.email ? user.email.toLowerCase() : user.email
        }));
        setUsers(usersWithLowercaseEmails);
      } else {
        console.error('Failed to fetch users:', result.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.attendee_user_ids || formData.attendee_user_ids.length === 0) {
      newErrors.attendee_user_ids = 'Please select at least one attendee';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    
    // Check if end time is after start time
    if (formData.date && formData.start_time && formData.end_time) {
      const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.date}T${formData.end_time}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.end_time = 'End time must be after start time';
      }
    }
    
    console.log('[AppointmentModal] Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle multi-select for attendee_user_ids
    if (name === 'attendee_user_ids') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selectedOptions
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('[AppointmentModal] Form validation failed');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Convert local date/time to UTC for API storage
      const start_datetime = localToUTC(formData.date, formData.start_time);
      const end_datetime = localToUTC(formData.date, formData.end_time);
      
      // Ensure attendee_user_ids is a valid array of integers
      const attendeeIds = Array.isArray(formData.attendee_user_ids) 
        ? formData.attendee_user_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
        : [];
      
      if (attendeeIds.length === 0) {
        setErrors({ submit: 'Please select at least one attendee' });
        setSubmitting(false);
        return;
      }
      
      // Calculate reminder time based on minutes before event
      const reminderDateTime = new Date(start_datetime);
      reminderDateTime.setMinutes(reminderDateTime.getMinutes() - parseInt(formData.reminder_minutes_before));
      
      // Map frontend fields to backend API format
      const payload = {
        title: formData.title,
        description: formData.description,
        start_datetime: start_datetime,  // Backend expects start_datetime (ISO string)
        end_datetime: end_datetime,      // Backend expects end_datetime (ISO string)
        location: formData.location,
        reminder_minutes_before: parseInt(formData.reminder_minutes_before), // Backend expects integer minutes
        attendee_user_ids: attendeeIds
      };
      
      console.log('[AppointmentModal] Sending payload:', payload);
      
      let response;
      if (mode === 'create') {
        response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.APPOINTMENTS), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.APPOINTMENT_BY_ID(appointment.id)), {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      
      console.log('[AppointmentModal] Response status:', response.status);
      const result = await response.json();
      console.log('[AppointmentModal] Response data:', result);
      
      if (result.success) {
        onSave(result);
        onClose();
      } else {
        console.error('[AppointmentModal] Server error:', result);
        setErrors({ submit: result.message || 'Failed to save appointment' });
      }
    } catch (error) {
      console.error('[AppointmentModal] Error saving appointment:', error);
      setErrors({ submit: 'Failed to save appointment. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.APPOINTMENT_BY_ID(appointment.id)), {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        onSave(result);
        onClose();
      } else {
        setErrors({ submit: result.message || 'Failed to delete appointment' });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setErrors({ submit: 'Failed to delete appointment. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content appointment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? 'New Appointment' : 'Edit Appointment'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && (
              <div className="error-message" style={{ marginBottom: '15px', padding: '10px', background: '#ffe6e6', color: '#d8000c', borderRadius: '4px' }}>
                {errors.submit}
              </div>
            )}
            
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter appointment title"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>
            
            {/* Attendee - Multi-select with checkboxes */}
            <div className="form-group">
              <label htmlFor="attendee_user_ids">Attendees *</label>
              <div className="multi-select-dropdown" style={{
                border: errors.attendee_user_ids ? '2px solid #dc3545' : '1px solid #ddd',
                borderRadius: '6px',
                padding: '10px',
                maxHeight: '250px',
                overflowY: 'auto',
                backgroundColor: '#fff',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {users.map((user, index) => (
                  <div key={user.id} className="checkbox-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    marginBottom: index < users.length - 1 ? '6px' : '0',
                    backgroundColor: formData.attendee_user_ids.includes(user.id.toString()) ? '#f0f9ff' : '#fafafa',
                    border: '1px solid #e8e8e8',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    ':hover': {
                      backgroundColor: '#f0f9ff',
                      borderColor: '#b3d9ff'
                    }
                  }}
                  onClick={(e) => {
                    if (e.target.type !== 'checkbox') {
                      const checkbox = document.getElementById(`user_${user.id}`);
                      if (checkbox) checkbox.click();
                    }
                  }}>
                    <input
                      type="checkbox"
                      id={`user_${user.id}`}
                      name="attendee_user_ids"
                      value={user.id}
                      checked={formData.attendee_user_ids.includes(user.id.toString())}
                      onChange={(e) => {
                        const newAttendees = e.target.checked
                          ? [...formData.attendee_user_ids, user.id.toString()]
                          : formData.attendee_user_ids.filter(id => id !== user.id.toString());
                        setFormData(prev => ({
                          ...prev,
                          attendee_user_ids: newAttendees
                        }));
                        if (errors.attendee_user_ids) {
                          setErrors(prev => ({
                            ...prev,
                            attendee_user_ids: ''
                          }));
                        }
                      }}
                      style={{ 
                        marginRight: '12px', 
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px',
                        accentColor: '#4CAF50'
                      }}
                    />
                    <label 
                      htmlFor={`user_${user.id}`} 
                      style={{ 
                        cursor: 'pointer', 
                        margin: 0, 
                        flex: 1,
                        fontSize: '14px',
                        color: '#333',
                        fontWeight: formData.attendee_user_ids.includes(user.id.toString()) ? '500' : '400'
                      }}
                    >
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>{user.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px', textTransform: 'lowercase' }}>{user.email}</div>
                    </label>
                  </div>
                ))}
              </div>
              {errors.attendee_user_ids && <span className="error-text">{errors.attendee_user_ids}</span>}
            </div>
            
            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter appointment details"
                rows="4"
              />
            </div>
            
            {/* Date and Time */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date (DD/MM/YYYY) *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
                {formData.date && (
                  <small className="help-text">
                    Selected: {formatDateToDDMMYYYY(new Date(formData.date).toISOString())}
                  </small>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_time">Start Time *</label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={errors.start_time ? 'error' : ''}
                />
                {errors.start_time && <span className="error-text">{errors.start_time}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="end_time">End Time *</label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={errors.end_time ? 'error' : ''}
                />
                {errors.end_time && <span className="error-text">{errors.end_time}</span>}
              </div>
            </div>
            
            {/* Location */}
            <div className="form-group">
              <label htmlFor="location">Location (Optional)</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Conference Room A or Zoom link"
              />
            </div>
            
            {/* Email Reminder Time */}
            <div className="form-group">
              <label htmlFor="reminder_minutes_before">Email Reminder</label>
              <select
                id="reminder_minutes_before"
                name="reminder_minutes_before"
                value={formData.reminder_minutes_before}
                onChange={handleChange}
              >
                <option value="1">1 minute before</option>
                <option value="5">5 minutes before</option>
                <option value="10">10 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">24 hours before</option>
                <option value="10080">1 week before</option>
              </select>
              <small className="help-text" style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>
                Choose when you want to receive an email reminder before this appointment
              </small>
            </div>
            
            {/* Status (Edit mode only) */}
            {mode === 'edit' && (
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            
            {mode === 'edit' && (
              <button 
                type="button" 
                className="btn-delete" 
                onClick={handleDelete}
                disabled={submitting}
              >
                Delete
              </button>
            )}
            
            <button 
              type="submit" 
              className="btn-save" 
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
