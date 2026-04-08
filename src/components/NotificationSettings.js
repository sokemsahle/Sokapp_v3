import React, { useState, useEffect } from 'react';
import API_CONFIG from '../config/api';
import axios from 'axios';

const NotificationSettings = ({ user, onClose }) => {
  const [settings, setSettings] = useState({
    welfare_alerts: true,
    task_reminders: true,
    system_announcements: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // API base URL
  const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch notification settings from backend
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notification-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSettings({
          welfare_alerts: response.data.data.welfare_alerts,
          task_reminders: response.data.data.task_reminders,
          system_announcements: response.data.data.system_announcements
        });
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError('Failed to load notification settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle switch changes with optimistic UI update
  const handleToggle = async (settingKey) => {
    // Optimistic UI update: update state immediately
    const previousValue = settings[settingKey];
    setSettings(prev => ({ ...prev, [settingKey]: !prev[settingKey] }));
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/notification-settings`,
        { [settingKey]: !previousValue },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update with actual server response
        setSettings(response.data.data);
        setSuccessMessage('Notification settings updated successfully!');
      }
    } catch (err) {
      console.error('Error updating notification settings:', err);
      // Rollback on error
      setSettings(prev => ({ ...prev, [settingKey]: previousValue }));
      setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get setting label and description
  const getSettingInfo = (key) => {
    const info = {
      welfare_alerts: {
        label: 'Child Welfare Alerts',
        description: 'Medical alerts, dietary requirements, incident reports',
        icon: 'bx bx-heart'
      },
      task_reminders: {
        label: 'Task & Shift Reminders',
        description: 'Daily chores, shift handovers, staff meetings',
        icon: 'bx bx-time-five'
      },
      system_announcements: {
        label: 'General System Announcements',
        description: 'Facility updates, policy changes, emergency drills',
        icon: 'bx bx-bell'
      }
    };
    return info[key] || {};
  };

  return (
    <div className="notification-settings-overlay" onClick={onClose}>
      <div className="notification-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-settings-header">
          <div className="header-title">
            <i className='bx bx-cog'></i>
            <h2>Notification Settings</h2>
          </div>
          <button 
            className="close-btn" 
            onClick={onClose}
            title="Close"
            disabled={saving}
          >
            <i className='bx bx-x'></i>
          </button>
        </div>

        {/* Content */}
        <div className="notification-settings-content">
          {loading ? (
            <div className="loading-state">
              <i className='bx bx-loader-alt bx-spin'></i>
              <p>Loading your notification preferences...</p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <i className='bx bx-error-circle'></i>
                  <span>{error}</span>
                  <button onClick={() => setError(null)}>
                    <i className='bx bx-x'></i>
                  </button>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="success-message">
                  <i className='bx bx-check-circle'></i>
                  <span>{successMessage}</span>
                  <button onClick={() => setSuccessMessage(null)}>
                    <i className='bx bx-x'></i>
                  </button>
                </div>
              )}

              {/* Settings List */}
              <div className="settings-list">
                {Object.keys(settings).map((settingKey) => {
                  const info = getSettingInfo(settingKey);
                  return (
                    <div key={settingKey} className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <i className={info.icon}></i>
                        </div>
                        <div className="setting-details">
                          <h3>{info.label}</h3>
                          <p>{info.description}</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings[settingKey]}
                          onChange={() => handleToggle(settingKey)}
                          disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="settings-footer">
                <p>
                  <i className='bx bx-info-circle'></i>
                  Changes are saved automatically and synced with the server.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
