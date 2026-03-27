import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AcceptInvitation.css';
import API_CONFIG from '../config/api';

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    
    // State for password validation checks
    const [passwordChecks, setPasswordChecks] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false
    });

    useEffect(() => {
        // Get email and token from URL parameters
        const emailParam = searchParams.get('email');
        const tokenParam = searchParams.get('token');
        
        if (emailParam && tokenParam) {
            setEmail(decodeURIComponent(emailParam));
            setToken(tokenParam);
        } else {
            setMessage('Invalid invitation link. Please check your email.');
            setMessageType('error');
        }
    }, [searchParams]);

    // Update password validation checks as user types
    useEffect(() => {
        const checks = {
            minLength: password.length >= 6,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password)
        };
        setPasswordChecks(checks);
    }, [password]);
    
    const validateForm = () => {
        if (!password || !confirmPassword) {
            setMessage('Please fill in all password fields');
            setMessageType('error');
            return false;
        }
        
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            setMessageType('error');
            return false;
        }
        
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long');
            setMessageType('error');
            return false;
        }
        
        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            setMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            setMessageType('error');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setMessage('');
        
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ACCEPT_INVITATION), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    token,
                    password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                setMessage('Account activated successfully! You will be redirected to login.');
                setMessageType('success');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setMessage(result.message || 'Failed to activate account');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            setMessage('Error activating account. Please try again.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="accept-invitation-container">
            <div className="accept-invitation-card">
                <div className="accept-invitation-header">
                    <div className="accept-invitation-icon-container">
                        <svg className="accept-invitation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h1 className="accept-invitation-title">Activate Your Account</h1>
                    <p className="accept-invitation-subtitle">Set your password to complete your registration</p>
                </div>

                {message && (
                    <div className={`message-container ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="accept-invitation-form">
                    <div className="form-group">
                        <label className="form-label">
                            Email Address
                        </label>
                        <div className="email-display">
                            {email || 'No email provided'}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="password-requirements">
                        <h3 className="requirements-header">
                            <svg className="requirements-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Password Requirements
                        </h3>
                        <ul className="requirements-list">
                            <li className="requirement-item">
                                <span className={`requirement-check ${passwordChecks.minLength ? 'met' : ''}`}>
                                    {passwordChecks.minLength ? '✓' : '○'}
                                </span>
                                At least 6 characters long
                            </li>
                            <li className="requirement-item">
                                <span className={`requirement-check ${passwordChecks.hasUpper ? 'met' : ''}`}>
                                    {passwordChecks.hasUpper ? '✓' : '○'}
                                </span>
                                One uppercase letter (A-Z)
                            </li>
                            <li className="requirement-item">
                                <span className={`requirement-check ${passwordChecks.hasLower ? 'met' : ''}`}>
                                    {passwordChecks.hasLower ? '✓' : '○'}
                                </span>
                                One lowercase letter (a-z)
                            </li>
                            <li className="requirement-item">
                                <span className={`requirement-check ${passwordChecks.hasNumber ? 'met' : ''}`}>
                                    {passwordChecks.hasNumber ? '✓' : '○'}
                                </span>
                                One number (0-9)
                            </li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <span className="spinner"></span>
                                Activating Account...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Activate Account
                            </span>
                        )}
                    </button>
                </form>

                <div className="login-link-container">
                    <p>Already have an account? <a href="/login" className="login-link">Sign in here</a></p>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitation;