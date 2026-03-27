import React, { useState, useEffect } from 'react';
import './Settings.css';
import API_CONFIG from '../config/api';

const Settings = ({settinopen, user, defaultSection}) => {
    const [localNews, setLocalNews] = useState('');
    const [localNotice, setLocalNotice] = useState('');
    const [activeSection, setActiveSection] = useState(defaultSection || 'profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [employeeData, setEmployeeData] = useState(null);

    // Debug: Log user object on mount and when it changes
    useEffect(() => {
        console.log('[Settings] User object:', user);
        console.log('[Settings] User ID:', user?.id);
        console.log('[Settings] User email:', user?.email);
        console.log('[Settings] User full_name:', user?.full_name);
    }, [user]);

    // Fetch employee data based on user email
    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!user?.email) return;
            
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/api/employees/by-email/${user.email}`);
                const result = await response.json();
                
                if (result.success && result.employee) {
                    setEmployeeData(result.employee);
                    setProfilePicture(result.employee.profile_image);
                    console.log('[Settings] Employee data fetched:', result.employee);
                } else {
                    console.log('[Settings] No employee record found for email:', user.email);
                    setProfilePicture(null);
                }
            } catch (error) {
                console.error('[Settings] Error fetching employee data:', error);
                setProfilePicture(null);
            }
        };
        
        fetchEmployeeData();
    }, [user?.email]);

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setMessage('Please select a valid image file (JPEG, PNG, or WebP)');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        
        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setMessage('File size should not exceed 5MB');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        
        setUploadingPicture(true);
        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('profilePhoto', file);
        
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.UPLOAD_PROFILE_PICTURE), {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                setMessage('Profile picture updated successfully!');
                setProfilePicture(result.data.profileImage);
                
                // Dispatch custom event to update navbar profile picture
                window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
                    detail: { profileImage: result.data.profileImage } 
                }));
                
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to update profile picture: ' + (result.message || 'Unknown error'));
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            setMessage('Error uploading profile picture');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setUploadingPicture(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const removeProfilePicture = async () => {
        if (!profilePicture) return;
        
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
        
        setUploadingPicture(true);
        
        try {
            // For removing, we'll just set it to null in a future API call
            // For now, just clear the local state
            setProfilePicture(null);
            setMessage('Profile picture removed successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error removing profile picture:', error);
            setMessage('Error removing profile picture');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setUploadingPicture(false);
        }
    };

    // Update activeSection when defaultSection prop changes
    useEffect(() => {
        if (defaultSection) {
            setActiveSection(defaultSection);
        }
    }, [defaultSection]);

    // Fetch current news and notices on mount
    useEffect(() => {
        fetchNewsNotices();
    }, []);

    const fetchNewsNotices = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.NEWS_NOTICES));
            const result = await response.json();
            if (result.success) {
                setLocalNews(result.news || '');
                setLocalNotice(result.notice || '');
            }
        } catch (error) {
            console.error('Error fetching news/notices:', error);
        }
    };

    const postNews = async () => {
        if (!localNews.trim()) {
            setMessage('Please enter news content');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.NEWS), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ news: localNews })
            });
            const result = await response.json();
            if (result.success) {
                setMessage('News posted successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to post news');
            }
        } catch (error) {
            console.error('Error posting news:', error);
            setMessage('Error posting news');
        } finally {
            setLoading(false);
        }
    };

    const postNotice = async () => {
        if (!localNotice.trim()) {
            setMessage('Please enter notice content');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.NOTICES), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notice: localNotice })
            });
            const result = await response.json();
            if (result.success) {
                setMessage('Notice posted successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to post notice');
            }
        } catch (error) {
            console.error('Error posting notice:', error);
            setMessage('Error posting notice');
        } finally {
            setLoading(false);
        }
    };
    
        const handleChangePassword = async () => {
            console.log('=== CHANGE PASSWORD FUNCTION STARTED ===');
            console.log('User:', user);
            console.log('User ID:', user?.id);
            
            // Basic validation
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                const msg = 'Please fill in all password fields';
                alert(msg);
                setMessage(msg);
                console.log('Validation failed:', msg);
                return;
            }
                
            if (newPassword !== confirmNewPassword) {
                const msg = 'New passwords do not match';
                alert(msg);
                setMessage(msg);
                console.log('Validation failed:', msg);
                return;
            }
                
            // Password strength validation
            if (newPassword.length < 6) {
                const msg = 'New password must be at least 6 characters long';
                alert(msg);
                setMessage(msg);
                console.log('Validation failed:', msg);
                return;
            }
                
            // Additional password strength check
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
            if (!passwordRegex.test(newPassword)) {
                const msg = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
                alert(msg);
                setMessage(msg);
                console.log('Validation failed:', msg);
                return;
            }
                
            if (currentPassword === newPassword) {
                const msg = 'New password must be different from current password';
                alert(msg);
                setMessage(msg);
                console.log('Validation failed:', msg);
                return;
            }

            // Check if user ID exists
            if (!user?.id) {
                const msg = 'User information not loaded. User ID is missing!\n\nUser object: ' + JSON.stringify(user, null, 2);
                alert(msg);
                setMessage(msg);
                console.error('User ID missing:', user);
                return;
            }
            
            console.log('All validations passed. Proceeding with password change...');
            alert('✓ Validations passed!\nUser ID: ' + user.id + '\nSending request to server...');
                
            setPasswordLoading(true);
            try {
                const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD);
                console.log('[Password Change] Request URL:', url);
                
                const requestBody = {
                    user_id: user?.id,
                    current_password: currentPassword,
                    new_password: newPassword
                };
                console.log('[Password Change] Request Body:', requestBody);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                
                console.log('[Password Change] Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[Password Change] Error response:', errorText);
                    alert('❌ Server Error (' + response.status + '):\n' + errorText);
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }
                
                const result = await response.json();
                console.log('[Password Change] Result:', result);
                    
                if (result.success) {
                    alert('✅ Password changed successfully!');
                    setMessage('Password changed successfully!');
                    // Clear the password fields
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setTimeout(() => setMessage(''), 3000);
                } else {
                    alert('❌ Failed to change password:\n' + (result.message || 'Unknown error'));
                    setMessage(result.message || 'Failed to change password');
                }
            } catch (error) {
                console.error('[Password Change] Error:', error);
                alert('❌ Error changing password:\n' + error.message);
                setMessage(error.message || 'Error changing password');
            } finally {
                setPasswordLoading(false);
            }
        };

    if (!settinopen) {
        return null;
    }

    const settingsSections = [
        { id: 'profile', icon: 'bx bx-user', title: 'Profile Settings', description: 'Update your personal information and preferences.' },
        { id: 'notifications', icon: 'bx bx-bell', title: 'Notification Settings', description: 'Manage your notification preferences.' },
        { id: 'privacy', icon: 'bx bx-lock', title: 'Privacy Settings', description: 'Control your privacy and data sharing options.' },
        { id: 'account', icon: 'bx bx-cog', title: 'Account Settings', description: 'Change your account details and password.' },
    ];
    
    return (
        <div className="settings-container">
            <h2>Settings</h2>
            
            <div className="settings-layout">
                <div className="settings-sidebar">
                    {settingsSections.map((section) => (
                        <button
                            key={section.id}
                            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <i className={section.icon}></i>
                            <div>
                                <h4>{section.title}</h4>
                                <p>{section.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    {activeSection === 'profile' && (
                        <div className="settings-panel">
                            <h3>Profile Information</h3>
                            
                            {/* Profile Picture Section */}
                            <div className="profile-picture-section">
                                <h4>Profile Picture</h4>
                                <div className="profile-picture-container">
                                    <div className="profile-picture-preview">
                                        {profilePicture ? (
                                            <img 
                                                src={profilePicture} 
                                                alt="Profile" 
                                                onError={(e) => {
                                                    e.target.src = "/Logo/logo-favicon.png";
                                                    e.target.onerror = null;
                                                }}
                                            />
                                        ) : (
                                            <div className="profile-picture-placeholder">
                                                <i className='bx bx-user'></i>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="profile-picture-actions">
                                        <label className="btn-primary">
                                            <i className='bx bx-upload'></i>
                                            {uploadingPicture ? 'Uploading...' : 'Upload New Picture'}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleProfilePictureChange}
                                                disabled={uploadingPicture}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        
                                        {profilePicture && (
                                            <button 
                                                className="btn-secondary btn-danger"
                                                onClick={removeProfilePicture}
                                                disabled={uploadingPicture}
                                            >
                                                <i className='bx bx-trash'></i>
                                                Remove Picture
                                            </button>
                                        )}
                                        
                                        <p className="picture-help-text">
                                            Accepted formats: JPEG, PNG, WebP. Max size: 5MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="profile-info">
                                <div className="info-row">
                                    <label>Full Name:</label>
                                    <span>{user?.full_name}</span>
                                </div>
                                <div className="info-row">
                                    <label>Email:</label>
                                    <span>{user?.email}</span>
                                </div>
                                <div className="info-row">
                                    <label>Current Role:</label>
                                    <span className="role-badge">{user?.role_name || 'No Role'}</span>
                                </div>
                                <div className="info-row">
                                    <label>Department:</label>
                                    <span>{user?.department || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="settings-panel">
                            <h3>Notification Preferences</h3>
                            <p className="panel-description">Configure how you receive notifications and alerts.</p>
                            
                            <div className="notification-preferences">
                                <div className="preference-group">
                                    <h4>Email Notifications</h4>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>Receive email notifications for important updates</span>
                                    </label>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>Receive daily digest emails</span>
                                    </label>
                                </div>
                                
                                <div className="preference-group">
                                    <h4>In-App Notifications</h4>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>Enable in-app notification alerts</span>
                                    </label>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>Show notification badges</span>
                                    </label>
                                </div>
                                
                                <div className="preference-group">
                                    <h4>Notification Types</h4>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>Child profile updates</span>
                                    </label>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>Requisition status changes</span>
                                    </label>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                        <span>System announcements</span>
                                    </label>
                                </div>
                            </div>
                            
                            <button className="btn-primary" style={{marginTop: '20px'}}>
                                <i className='bx bx-save'></i> Save Preferences
                            </button>
                        </div>
                    )}

                    {activeSection === 'privacy' && (
                        <div className="settings-panel">
                            <h3>Privacy Settings</h3>
                            <p className="panel-description">This section is under development.</p>
                        </div>
                    )}
                    
                    {activeSection === 'account' && (
                        <div className="settings-panel">
                            <h3>Account Settings</h3>
                            <div className="password-change-form">
                                <h4>Change Password</h4>
                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="password-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="password-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmNewPassword">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmNewPassword"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="password-input"
                                    />
                                </div>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleChangePassword}
                                    disabled={passwordLoading}
                                    style={{cursor: 'pointer', zIndex: 9999, position: 'relative'}}
                                >
                                    <i className='bx bx-key'></i>
                                    {passwordLoading ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default Settings;