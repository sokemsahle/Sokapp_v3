import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../config/api';
import './Report.css';

// Professional SVG Icons
const Icons = {
    Activity: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Users: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Login: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Alert: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Calendar: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    UserCheck: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 11 19 13 23 9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Clock: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Shield: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
};

const UserActivityReport = ({ selectedProgram }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState({
        summary: {},
        security: {},
        users: {}
    });
    const [sortConfig, setSortConfig] = useState({
        sortBy: 'activity_timestamp',
        sortOrder: 'DESC'
    });

    // Fetch user activity data from backend API
    const fetchUserActivityData = async (reportType) => {
        setLoading(true);
        setError(null);
        
        try {
            // Add sorting parameters for detail endpoint
            const params = reportType === 'detail' ? `?sortBy=${sortConfig.sortBy}&sortOrder=${sortConfig.sortOrder}` : '';
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user-activity/${reportType}${params}`);
            const result = await response.json();
            
            if (result.success) {
                setReportData(prev => ({
                    ...prev,
                    [reportType]: result.data
                }));
            } else {
                setError(result.error || 'Failed to load data');
            }
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            console.error('Error fetching user activity:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when tab changes
    useEffect(() => {
        fetchUserActivityData(activeTab);
    }, [activeTab]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle column header click for sorting
    const handleSort = (column) => {
        const newOrder = sortConfig.sortBy === column && sortConfig.sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSortConfig({
            sortBy: column,
            sortOrder: newOrder
        });
        
        // Re-fetch data with new sorting
        fetchUserActivityData(activeTab);
    };

    // Get sort icon for column
    const getSortIcon = (column) => {
        if (sortConfig.sortBy !== column) return ' ↕️';
        return sortConfig.sortOrder === 'ASC' ? ' ↑' : ' ↓';
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        if (!status) return 'status-badge-neutral';
        const statusLower = status.toLowerCase();
        if (statusLower === 'success' || statusLower === 'active') return 'status-badge-success';
        if (statusLower === 'failed' || statusLower === 'inactive') return 'status-badge-failed';
        if (statusLower === 'pending' || statusLower === 'warning') return 'status-badge-pending';
        return 'status-badge-neutral';
    };

    // Render Summary Tab
    const renderSummaryTab = () => {
        const { summary } = reportData;
        
        return (
            <div className="user-activity-report">
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon"><Icons.Activity /></div>
                        <div className="stat-details">
                            <h3>{summary.todayActivities || 0}</h3>
                            <p>Today's Activities</p>
                        </div>
                    </div>
                    
                    <div className="stat-card success">
                        <div className="stat-icon"><Icons.Users /></div>
                        <div className="stat-details">
                            <h3>{summary.activeUsers || 0}</h3>
                            <p>Active Users</p>
                        </div>
                    </div>
                    
                    <div className="stat-card info">
                        <div className="stat-icon"><Icons.Login /></div>
                        <div className="stat-details">
                            <h3>{summary.loginCount || 0}</h3>
                            <p>Logins Today</p>
                        </div>
                    </div>
                    
                    <div className="stat-card warning">
                        <div className="stat-icon"><Icons.Alert /></div>
                        <div className="stat-details">
                            <h3>{summary.failedLogins || 0}</h3>
                            <p>Failed Login Attempts</p>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon"><Icons.Calendar /></div>
                        <div className="stat-details">
                            <h3>{summary.weeklyActivities || 0}</h3>
                            <p>Weekly Activities</p>
                        </div>
                    </div>
                </div>

                <div className="report-section-full">
                    <h3>Recent Activities</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('activity_timestamp')} style={{cursor: 'pointer'}}>
                                        Timestamp{getSortIcon('activity_timestamp')}
                                    </th>
                                    <th onClick={() => handleSort('user_name')} style={{cursor: 'pointer'}}>
                                        User{getSortIcon('user_name')}
                                    </th>
                                    <th onClick={() => handleSort('role_name')} style={{cursor: 'pointer'}}>
                                        Role{getSortIcon('role_name')}
                                    </th>
                                    <th onClick={() => handleSort('activity_type')} style={{cursor: 'pointer'}}>
                                        Activity Type{getSortIcon('activity_type')}
                                    </th>
                                    <th onClick={() => handleSort('module')} style={{cursor: 'pointer'}}>
                                        Module{getSortIcon('module')}
                                    </th>
                                    <th>Action</th>
                                    <th>Device</th>
                                    <th onClick={() => handleSort('status')} style={{cursor: 'pointer'}}>
                                        Status{getSortIcon('status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.recentActivities && summary.recentActivities.length > 0 ? (
                                    summary.recentActivities.map((activity, index) => (
                                        <tr key={index}>
                                            <td>{formatDate(activity.activity_timestamp)}</td>
                                            <td>
                                                <div className="user-info">
                                                    <strong>{activity.user_name || 'Unknown'}</strong>
                                                    <small>{activity.user_email}</small>
                                                </div>
                                            </td>
                                            <td>{activity.role_name || 'N/A'}</td>
                                            <td>
                                                <span className={`activity-type-badge type-${activity.activity_type}`}>
                                                    {activity.activity_type}
                                                </span>
                                            </td>
                                            <td>{activity.module || 'N/A'}</td>
                                            <td>{activity.action_description || 'N/A'}</td>
                                            <td>{activity.device_type || 'Desktop'}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadgeClass(activity.status)}`}>
                                                    {activity.status || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{textAlign: 'center'}}>No recent activities found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Active Users Section */}
                {summary.activeUsersList && summary.activeUsersList.length > 0 && (
                    <div className="report-section">
                        <h3><Icons.Users /> Active Users Today</h3>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Total Activities</th>
                                        <th>First Activity</th>
                                        <th>Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.activeUsersList.map((user, index) => (
                                        <tr key={index}>
                                            <td><strong>{user.user_name || 'Unknown'}</strong></td>
                                            <td>{user.user_email || 'N/A'}</td>
                                            <td>{user.role_name || 'N/A'}</td>
                                            <td>
                                                <span className="activity-type-badge">
                                                    {user.activity_count}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.first_activity)}</td>
                                            <td>{formatDate(user.last_activity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render Security Tab
    const renderSecurityTab = () => {
        const { security } = reportData;
        
        return (
            <div className="user-activity-report">
                <div className="report-section">
                    <h3><Icons.Alert /> Failed Login Attempts</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>IP Address</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {security.failedLogins && security.failedLogins.length > 0 ? (
                                    security.failedLogins.map((login, index) => (
                                        <tr key={index} className="danger-row">
                                            <td>{formatDate(login.activity_timestamp)}</td>
                                            <td>{login.user_name || 'Unknown'}</td>
                                            <td>{login.user_email || 'N/A'}</td>
                                            <td><code>{login.ip_address}</code></td>
                                            <td>{login.failure_reason || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center'}}>No failed login attempts</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="report-section">
                    <h3>⚠️ Suspicious IP Addresses (Last 24 Hours)</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>Attempt Count</th>
                                    <th>First Attempt</th>
                                    <th>Last Attempt</th>
                                    <th>Targeted Emails</th>
                                </tr>
                            </thead>
                            <tbody>
                                {security.suspiciousIPs && security.suspiciousIPs.length > 0 ? (
                                    security.suspiciousIPs.map((ip, index) => (
                                        <tr key={index} className="warning-row">
                                            <td><code>{ip.ip_address}</code></td>
                                            <td><strong>{ip.attempt_count}</strong></td>
                                            <td>{formatDate(ip.first_attempt)}</td>
                                            <td>{formatDate(ip.last_attempt)}</td>
                                            <td>{ip.targeted_emails || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center'}}>No suspicious activity detected</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="report-section">
                    <h3>🚪 Recent Logout Events</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Session Duration</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {security.logoutEvents && security.logoutEvents.length > 0 ? (
                                    security.logoutEvents.map((logout, index) => (
                                        <tr key={index}>
                                            <td>{formatDate(logout.activity_timestamp)}</td>
                                            <td>{logout.user_name || 'Unknown'}</td>
                                            <td>{logout.user_email || 'N/A'}</td>
                                            <td>{logout.session_duration ? `${Math.round(logout.session_duration / 60)} min` : 'N/A'}</td>
                                            <td><code>{logout.ip_address}</code></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center'}}>No logout events found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Render Users Tab
    const renderUsersTab = () => {
        const { users } = reportData;
        
        return (
            <div className="user-activity-report">
                <div className="report-section-full">
                    <h3>👥 User Activity Metrics (Last 30 Days)</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Active Days</th>
                                    <th>Total Activities</th>
                                    <th>Logins</th>
                                    <th>Creates</th>
                                    <th>Updates</th>
                                    <th>Deletes</th>
                                    <th>Failed Actions</th>
                                    <th>Last Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.userMetrics && users.userMetrics.length > 0 ? (
                                    users.userMetrics.map((user, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="user-info">
                                                    <strong>{user.user_name}</strong>
                                                    <small>{user.user_email}</small>
                                                </div>
                                            </td>
                                            <td>{user.role_name || 'N/A'}</td>
                                            <td>{user.active_days || 0}</td>
                                            <td><strong>{user.total_activities || 0}</strong></td>
                                            <td>{user.login_count || 0}</td>
                                            <td>{user.create_count || 0}</td>
                                            <td>{user.update_count || 0}</td>
                                            <td>{user.delete_count || 0}</td>
                                            <td>{user.failed_actions || 0}</td>
                                            <td>{formatDate(user.last_activity)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" style={{textAlign: 'center'}}>No user activity data found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="report-section">
                    <h3><Icons.Activity /> Module Breakdown (Last 7 Days)</h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Module</th>
                                    <th>Activity Count</th>
                                    <th>Unique Users</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.moduleBreakdown && users.moduleBreakdown.length > 0 ? (
                                    users.moduleBreakdown.map((module, index) => (
                                        <tr key={index}>
                                            <td><strong>{module.module || 'N/A'}</strong></td>
                                            <td>{module.activity_count || 0}</td>
                                            <td>{module.unique_users || 0}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{textAlign: 'center'}}>No module data found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="report-content-wrapper">
            <div className="report-tabs">
                <button 
                    className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    <Icons.Activity /> Summary
                </button>
                <button 
                    className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <Icons.Shield /> Security
                </button>
                <button 
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Icons.Users /> Users
                </button>
            </div>

            <div className="report-body">
                {loading && (
                    <div className="loading-state">
                        <i className='bx bx-loader-alt bx-spin'></i>
                        <p>Loading activity data...</p>
                    </div>
                )}
                
                {error && (
                    <div className="error-state">
                        <i className='bx bx-error-circle'></i>
                        <p>{error}</p>
                    </div>
                )}
                
                {!loading && !error && (
                    <>
                        {activeTab === 'summary' && renderSummaryTab()}
                        {activeTab === 'security' && renderSecurityTab()}
                        {activeTab === 'users' && renderUsersTab()}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserActivityReport;
