import React, { useState, useEffect } from 'react';
import './index.css';

const LoginPage = ({ handleLogin }) => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [news, setNews] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Fetch news and notices from database on mount
  useEffect(() => {
    fetchNewsNotices();
  }, []);

  const fetchNewsNotices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/news-notices');
      const result = await response.json();
      if (result.success) {
        setNews(result.news || '');
        setNotice(result.notice || '');
      }
    } catch (error) {
      console.error('Error fetching news/notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isForgotPassword) {
      // Passes the email and password to the handler in App.js
      handleLogin(email, password);
    } else {
      // Handle forgot password logic
      handleForgotPassword();
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordMessage(data.message || 'Password reset link sent successfully!');
        // Clear the email after successful submission
        setForgotPasswordEmail('');
      } else {
        setForgotPasswordMessage(data.message || 'Failed to send password reset link');
      }
    } catch (error) {
      console.error('Error sending forgot password request:', error);
      setForgotPasswordMessage('An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side: Login Form */}
      <div className="login-left">
        <div className="login-box">
          <div className="logo-section">
            <img src="/Logo/logo-light-transparent.png" alt="SOKAPP" className="main-logo" />
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            {!isForgotPassword ? (
              <>
                <div className="input-group">
                  <label htmlFor="username">Email</label>
                  <input 
                    type="email" 
                    id="username" 
                    placeholder="yourname@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="password" 
                      placeholder="your password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                    <i 
                      className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} toggle-password`}
                      onClick={() => setShowPassword(!showPassword)}
                    ></i>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="login-btn">Log In To Sokapp</button>
                  <a 
                    href="#" 
                    className="forgot-link" 
                    onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); }}
                  >
                    Forgot Password
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label htmlFor="reset-email">Email</label>
                  <input 
                    type="email" 
                    id="reset-email" 
                    placeholder="yourname@email.com" 
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required 
                  />
                </div>

                {forgotPasswordMessage && (
                  <div className={`message ${forgotPasswordMessage.includes('sent') ? 'success' : 'error'}`}>
                    {forgotPasswordMessage}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="login-btn" disabled={forgotPasswordLoading}>
                    {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button 
                    type="button" 
                    className="back-btn" 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotPasswordMessage('');
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Right Side: Updates Panel */}
      <div className="login-right">
        <div className="updates-content">
          <h1>Shamida Updates...</h1>
          
          {loading ? (
            <p className="loading-text">Loading updates...</p>
          ) : (
            <>
              <section className="update-item">
                <h3>What's new</h3>
                <p>{news || "There is no News at the moment."}</p>
              </section>

              <section className="update-item">
                <h3>Important Notice</h3>
                <p>{notice || "There is no Notice at the moment."}</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;