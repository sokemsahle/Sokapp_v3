import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Settings.css';
import LookupEditor from './LookupEditor/LookupEditor';
import API_CONFIG from '../config/api';

const Organization = ({ user }) => {
    const [activeTab, setActiveTab] = useState('news'); // 'news' or 'lookup'
    const location = useLocation();
    
    // Check URL pathname on mount and when it changes to navigate to appropriate tab
    useEffect(() => {
        console.log('[Organization] Current pathname:', location.pathname);
        // Check if the path ends with /lookup
        if (location.pathname.endsWith('/lookup')) {
            console.log('[Organization] Setting activeTab to lookup');
            setActiveTab('lookup');
        } else {
            console.log('[Organization] Setting activeTab to news');
            setActiveTab('news');
        }
    }, [location.pathname]);
    
    // News & Notices state
    const [localNews, setLocalNews] = useState('');
    const [localNotice, setLocalNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
                setLocalNews('');
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
                setLocalNotice('');
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

    return (
        <div className="settings-container">
            <h2>Organization Settings</h2>
            
            {/* Tab Navigation */}
            <div className="org-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    <i className='bx bx-news'></i>
                    News & Notices
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'lookup' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lookup')}
                >
                    <i className='bx bx-list-check'></i>
                    Lookup Lists
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'news' && (
                <div className="settings-layout">
                    <div className="settings-content-full">
                        <div className="settings-panel">
                            {message && <div className="message-banner">{message}</div>}
                            
                            {(user?.role === 'admin' || user?.assigned_role === 'admin') && (
                                <>
                                    <div className="news-section">
                                        <h3>Post News</h3>
                                        <p className="panel-description">Share organization news and updates with all members.</p>
                                        <textarea 
                                            value={localNews} 
                                            onChange={(e) => setLocalNews(e.target.value)} 
                                            placeholder="Enter your news update..." 
                                            className="update-input" 
                                            rows="4"
                                        />
                                        <button 
                                            className="btn-primary" 
                                            onClick={postNews}
                                            disabled={loading}
                                        >
                                            <i className='bx bx-send'></i> 
                                            {loading ? 'Posting...' : 'Post News'}
                                        </button>
                                    </div>
                                    
                                    <div className="notice-section">
                                        <h3>Post Notice</h3>
                                        <p className="panel-description">Post important notices and announcements.</p>
                                        <textarea 
                                            value={localNotice} 
                                            onChange={(e) => setLocalNotice(e.target.value)} 
                                            placeholder="Enter your notice..." 
                                            className="update-input" 
                                            rows="4"
                                        />
                                        <button 
                                            className="btn-primary" 
                                            onClick={postNotice}
                                            disabled={loading}
                                        >
                                            <i className='bx bx-send'></i> 
                                            {loading ? 'Posting...' : 'Post Notice'}
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {user?.role !== 'admin' && user?.assigned_role !== 'admin' && (
                                <div className="no-permission-panel">
                                    <i className='bx bx-info-circle'></i>
                                    <p>Only administrators can post news and notices.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'lookup' && (
                <LookupEditor user={user} />
            )}
        </div>
    );
};

export default Organization;
