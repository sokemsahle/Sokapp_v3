import React, { useState, useEffect } from 'react';
import './Report.css';

// Professional SVG Icons
const Icons = {
    Users: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
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
    Clock: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    CheckCircle: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    ArrowLeft: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Search: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    Filter: () => (
        <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
};

const AttendanceReport = ({ selectedProgram }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [userDetails, setUserDetails] = useState(null);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        searchQuery: ''
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        presentToday: 0,
        totalPresentDays: 0,
        avgAttendance: 0
    });

    // Fetch all users with attendance summary
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let url = 'http://localhost:5000/api/attendance/report/users';
            const params = new URLSearchParams();
            
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (selectedProgram) params.append('programId', selectedProgram);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                setUsers(result.data);
                
                // Calculate stats
                const today = new Date().toISOString().split('T')[0];
                const presentToday = result.data.filter(u => u.last_attendance_date === today).length;
                const totalPresentDays = result.data.reduce((sum, u) => sum + (u.total_days_present || 0), 0);
                const avgAttendance = result.data.length > 0 
                    ? Math.round((presentToday / result.data.length) * 100) 
                    : 0;
                
                setStats({
                    totalUsers: result.data.length,
                    presentToday,
                    totalPresentDays,
                    avgAttendance
                });
            } else {
                setError(result.message || 'Failed to load attendance data');
            }
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch detailed attendance for a specific user
    const fetchUserDetails = async (userId) => {
        setLoading(true);
        setError(null);
        
        try {
            let url = `http://localhost:5000/api/attendance/report/user/${userId}`;
            const params = new URLSearchParams();
            
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                setUserDetails(result.user);
                setAttendanceLogs(result.data);
            } else {
                setError(result.message || 'Failed to load user details');
            }
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            console.error('Error fetching user details:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (viewMode === 'list') {
            fetchUsers();
        }
    }, [viewMode, selectedProgram, filters.startDate, filters.endDate]);

    // Handle user click
    const handleUserClick = (user) => {
        setSelectedUser(user);
        setViewMode('detail');
        fetchUserDetails(user.id);
    };

    // Handle back to list
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedUser(null);
        setUserDetails(null);
        setAttendanceLogs([]);
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Format time from minutes
    const formatHours = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Format time
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Filter users by search query
    const filteredUsers = users.filter(user => {
        if (!filters.searchQuery) return true;
        const query = filters.searchQuery.toLowerCase();
        return (
            user.full_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.role?.toLowerCase().includes(query)
        );
    });

    // Render List View
    const renderListView = () => (
        <div className="attendance-report">
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon"><Icons.Users /></div>
                    <div className="stat-details">
                        <h3>{stats.totalUsers}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                
                <div className="stat-card success">
                    <div className="stat-icon"><Icons.CheckCircle /></div>
                    <div className="stat-details">
                        <h3>{stats.presentToday}</h3>
                        <p>Present Today</p>
                    </div>
                </div>
                
                <div className="stat-card info">
                    <div className="stat-icon"><Icons.Calendar /></div>
                    <div className="stat-details">
                        <h3>{stats.totalPresentDays}</h3>
                        <p>Total Present Days</p>
                    </div>
                </div>
                
                <div className="stat-card warning">
                    <div className="stat-icon"><Icons.Clock /></div>
                    <div className="stat-details">
                        <h3>{stats.avgAttendance}%</h3>
                        <p>Avg Attendance Rate</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="report-filters">
                <div className="filter-group">
                    <label>
                        <i className='bx bx-search'></i>
                        <input
                            type="text"
                            name="searchQuery"
                            placeholder="Search by name, email, department..."
                            value={filters.searchQuery}
                            onChange={handleFilterChange}
                        />
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        <i className='bx bx-calendar'></i>
                        Start Date:
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        <i className='bx bx-calendar'></i>
                        End Date:
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </label>
                </div>
            </div>

            {/* Users Table */}
            <div className="report-section-full">
                <h3>All Users Attendance Summary</h3>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Total Days Present</th>
                                <th>Last Attendance</th>
                                <th>Complete Days</th>
                                <th>Avg Hours/Day</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <strong>{user.full_name}</strong>
                                            <small>{user.email}</small>
                                        </div>
                                    </td>
                                    <td>{user.role || 'N/A'}</td>
                                    <td>
                                        <span className="status-badge status-badge-success">
                                            {user.total_days_present || 0}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.last_attendance_date)}</td>
                                    <td>{user.complete_days || 0}</td>
                                    <td>{formatHours(user.avg_minutes_per_day)}</td>
                                    <td>
                                        <button 
                                            className="btn-view"
                                            onClick={() => handleUserClick(user)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && !loading && (
                    <div className="no-data">
                        <i className='bx bx-info-circle'></i>
                        <p>No attendance records found</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Render Detail View
    const renderDetailView = () => (
        <div className="attendance-detail">
            {/* Back Button */}
            <button className="btn-back" onClick={handleBackToList}>
                <Icons.ArrowLeft />
                Back to User List
            </button>

            {/* User Info Card */}
            {userDetails && (
                <div className="user-detail-header">
                    <div className="user-avatar">
                        {userDetails.profile_image ? (
                            <img src={userDetails.profile_image} alt={userDetails.full_name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {userDetails.full_name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <div className="user-detail-info">
                        <h2>{userDetails.full_name}</h2>
                        <p className="email">{userDetails.email}</p>
                        <div className="user-meta">
                            <span><strong>Role:</strong> {userDetails.role || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Logs Table */}
            <div className="report-section-full">
                <h3>Attendance History</h3>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Total Hours</th>
                                <th>IP Address</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceLogs.map((log) => {
                                const totalMinutes = log.clock_in && log.clock_out
                                    ? Math.round((new Date(log.clock_out) - new Date(log.clock_in)) / 60000)
                                    : null;
                                
                                return (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.date)}</td>
                                        <td>
                                            <span className="time-badge">
                                                {formatTime(log.clock_in)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="time-badge">
                                                {formatTime(log.clock_out)}
                                            </span>
                                        </td>
                                        <td>
                                            {totalMinutes ? (
                                                <span className="status-badge status-badge-info">
                                                    {formatHours(totalMinutes)}
                                                </span>
                                            ) : (
                                                <span className="status-badge status-badge-warning">
                                                    Incomplete
                                                </span>
                                            )}
                                        </td>
                                        <td><code>{log.ip_address || 'N/A'}</code></td>
                                        <td>
                                            {log.clock_out ? (
                                                <span className="status-badge status-badge-success">
                                                    Complete
                                                </span>
                                            ) : (
                                                <span className="status-badge status-badge-warning">
                                                    In Progress
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {attendanceLogs.length === 0 && !loading && (
                    <div className="no-data">
                        <i className='bx bx-info-circle'></i>
                        <p>No attendance records found for this user</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="attendance-report-container">
            <div className="report-header">
                <h2>
                    {viewMode === 'list' ? (
                        <>
                            <i className='bx bx-user'></i>
                            Attendance Report
                        </>
                    ) : (
                        <>
                            <i className='bx bx-file'></i>
                            {selectedUser?.full_name}'s Attendance
                        </>
                    )}
                </h2>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading attendance data...</p>
                </div>
            )}

            {error && (
                <div className="error-state">
                    <i className='bx bx-error-circle'></i>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && (
                viewMode === 'list' ? renderListView() : renderDetailView()
            )}
        </div>
    );
};

export default AttendanceReport;
