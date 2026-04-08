import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../config/api';
import './AttendanceWidget.css';

const AttendanceWidget = ({ user, employeeData }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [currentLog, setCurrentLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fetchingStatus, setFetchingStatus] = useState(true);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch today's attendance status on mount
    useEffect(() => {
        console.log('[AttendanceWidget] Component mounted, user:', user);
        fetchTodayStatus();
    }, [user]);

    const fetchTodayStatus = async () => {
        try {
            setFetchingStatus(true);
            console.log('[AttendanceWidget] Fetching attendance status...');
            
            if (!user?.id) {
                console.error('[AttendanceWidget] No user ID available');
                return;
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/attendance/today/status?userId=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('[AttendanceWidget] Response status:', response.status);
            const result = await response.json();
            console.log('[AttendanceWidget] Response data:', result);

            if (result.success) {
                setIsClockedIn(result.data.isClockedIn);
                setCurrentLog(result.data.currentLog);
            } else {
                console.error('Failed to fetch attendance status:', result.message);
            }
        } catch (err) {
            console.error('[AttendanceWidget] Error fetching attendance status:', err);
        } finally {
            setFetchingStatus(false);
        }
    };

    const handleClockAction = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!user?.id) {
                throw new Error('User ID not available. Please log in again.');
            }

            if (isClockedIn) {
                // Clock out
                if (!currentLog || !currentLog.id) {
                    throw new Error('No active clock-in session found');
                }

                const response = await fetch(`${API_CONFIG.BASE_URL}/api/attendance/clock-out/${currentLog.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: user.id })
                });

                const result = await response.json();

                if (result.success) {
                    setSuccess('Successfully clocked out!');
                    setIsClockedIn(false);
                    setCurrentLog(null);
                    setTimeout(() => setSuccess(''), 5000);
                } else {
                    if (response.status === 403) {
                        setError('Must be on company WiFi to clock out');
                    } else {
                        setError(result.message || 'Failed to clock out');
                    }
                }
            } else {
                // Clock in
                const response = await fetch(`${API_CONFIG.BASE_URL}/api/attendance/clock-in`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: user.id })
                });

                const result = await response.json();

                if (result.success) {
                    setSuccess('Successfully clocked in! Have a productive day!');
                    setIsClockedIn(true);
                    setCurrentLog(result.data);
                    setTimeout(() => setSuccess(''), 5000);
                } else {
                    if (response.status === 403) {
                        setError('Must be on company WiFi to clock in');
                    } else {
                        setError(result.message || 'Failed to clock in');
                    }
                }
            }
        } catch (err) {
            console.error('Clock action error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Auto-dismiss error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Format time for display (HH:MM:SS AM/PM)
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Format date for display (Day, Month DD, YYYY)
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate work duration if clocked in
    const calculateDuration = () => {
        if (!isClockedIn || !currentLog?.clock_in) return null;
        
        const now = new Date();
        const clockIn = new Date(currentLog.clock_in);
        const diffMs = now - clockIn;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return `${diffHrs}h ${diffMins}m ${diffSecs}s`;
    };

    const employeeName = employeeData?.full_name || user?.full_name || user?.username || 'Employee';
    const firstName = employeeName.split(' ')[0];

    // Debug: Log render
    console.log('[AttendanceWidget] Rendering...', { isClockedIn, loading, error });

    return (
        <div className="attendance-widget">
            {/* Header */}
            <div className="attendance-widget-header">
                <h3>
                    <i className='bx bx-time'></i>
                    Attendance Tracker
                </h3>
                <p className="attendance-widget-welcome">
                    Welcome back, {firstName}! Manage your daily attendance.
                </p>
            </div>

            {/* Live Clock Display */}
            <div className="live-clock-display">
                <div className="live-time">
                    {formatTime(currentTime)}
                </div>
                <div className="live-date">
                    {formatDate(currentTime)}
                </div>
            </div>

            {/* Status and Action */}
            <div className="attendance-status-container">
                {isClockedIn ? (
                    <div className="status-badge-clocked-in">
                        <div className="status-content">
                            <span className="status-text">
                                <i className='bx bx-check-circle'></i>
                                Currently Clocked In
                            </span>
                            <span className="duration-display">
                                {calculateDuration()}
                            </span>
                        </div>
                        {currentLog?.ip_address && (
                            <div className="ip-info">
                                <i className='bx bx-wifi'></i>
                                IP: {currentLog.ip_address}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="status-badge-not-clocked-in">
                        <span className="status-text">
                            <i className='bx bx-time-five'></i>
                            Not Clocked In
                        </span>
                        <p>
                            Clock in to start tracking your work day
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <div className="error-content">
                        <i className='bx bx-error-circle error-icon'></i>
                        <div className="error-text">
                            <p>{error}</p>
                            <p className="error-hint">
                                Make sure you're connected to the office WiFi network
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="success-message">
                    <div className="success-content">
                        <i className='bx bx-check-circle success-icon'></i>
                        <p className="success-text">{success}</p>
                    </div>
                </div>
            )}

            {/* Clock In/Out Button */}
            <button
                onClick={handleClockAction}
                disabled={loading || fetchingStatus}
                className={`clock-action-button 
                    ${isClockedIn ? 'clock-out-button' : 'clock-in-button'}
                `}
            >
                {loading ? (
                    <>
                        <i className='bx bx-loader-alt loading-spinner'></i>
                        Processing...
                    </>
                ) : isClockedIn ? (
                    <>
                        <i className='bx bx-log-out button-icon'></i>
                        Clock Out
                    </>
                ) : (
                    <>
                        <i className='bx bx-log-in button-icon'></i>
                        Clock In
                    </>
                )}
            </button>

            {/* Additional Info */}
            <div className="attendance-widget-footer">
                <p className="footer-info">
                    <i className='bx bx-info-circle'></i>
                    You must be connected to the office WiFi network to clock in or out
                </p>
            </div>
        </div>
    );
};

export default AttendanceWidget;
