import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Loginpage from "./login_page";
import ResetPassword from './components/ResetPassword';
import AcceptInvitation from './components/AcceptInvitation';
import API_CONFIG from './config/api';

// Layout components that handle their own internal routing
import AdminLayout from './layouts/AdminLayout';
import StandardUserLayout from './layouts/StandardUserLayout';

// Redirect component for requisition email links
const RequisitionRedirect = ({ currentUser }) => {
  const { id } = useParams();
  const isAdmin = currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1';
  return <Navigate to={isAdmin ? `/admin/requisitions/${id}` : `/user/my-requisitions/${id}`} />;
};

function App() {
  // Initialize state from localStorage if available
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('isLoggedIn');
    return saved === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // This function is called from the LoginPage component
  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsLoggedIn(true);
        setCurrentUser(result.user);
        // Save to localStorage for persistence across refreshes
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        const isAdmin = result.user.is_admin === 1 || result.user.is_admin === true || result.user.is_admin === '1';
        console.log(`${isAdmin ? 'Admin' : 'Standard User'} login successful`);
      } else {
        alert(result.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Failed to connect to server. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      // Call backend logout API to log the activity
      if (currentUser) {
        await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.full_name,
            roleId: currentUser.role_id,
            roleName: currentUser.role_name || currentUser.role,
            sessionDuration: null // Can be calculated from login time if needed
          })
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API fails
    } finally {
      // Always clear state and localStorage
      setIsLoggedIn(false);
      setCurrentUser(null);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      // Force redirect to home page
      window.location.href = '/';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public routes - accessible without login */}
        <Route path="/" element={
          isLoggedIn ? (
            <Navigate to={currentUser?.is_admin ? '/admin/dashboard' : '/user/dashboard'} />
          ) : (
            <Loginpage handleLogin={handleLogin} />
          )
        } />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        
        {/* Protected Admin Routes - Admins can access both admin and standard user views */}
        {isLoggedIn && (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? (
          <>
            <Route path="/admin/*" element={<AdminLayout handleLogout={handleLogout} currentUser={currentUser} />} />
            <Route path="/user/*" element={<StandardUserLayout handleLogout={handleLogout} user={currentUser} />} />
          </>
        ) : null}
        
        {/* Protected Standard User Routes - Non-admin users can only access standard user views */}
        {isLoggedIn && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? (
          <Route path="/user/*" element={<StandardUserLayout handleLogout={handleLogout} user={currentUser} />} />
        ) : null}
        
        {/* Universal Requisition Route - handles email links for both admin and standard users */}
        {isLoggedIn && (
          <Route 
            path="/requisitions/:id" 
            element={<RequisitionRedirect currentUser={currentUser} />} 
          />
        )}
        
        {/* Catch-all route - redirect based on login status */}
        <Route path="*" element={
          isLoggedIn ? (
            <Navigate to={currentUser?.is_admin ? '/admin/dashboard' : '/user/dashboard'} />
          ) : (
            <Loginpage handleLogin={handleLogin} />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;