import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Validate token when component mounts
  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Missing token or email.');
      setTokenExpired(true);
      return;
    }

    // In a real app, you might want to validate the token with a GET request
    // For now, we'll just check if the parameters exist
    setTokenValidated(true);
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.RESET_PASSWORD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Password reset successfully! You can now log in with your new password.');
        // Clear form
        setNewPassword('');
        setConfirmPassword('');
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('An error occurred while resetting your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValidated && !tokenExpired) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h2>Reset Password</h2>
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (tokenExpired) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h2>Reset Password</h2>
          <div className="error-message">
            {error || 'Invalid or expired reset link. Please request a new password reset.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Reset Password</h2>
        <p>Enter your new password for {email}</p>
        
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="reset-password-btn"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;