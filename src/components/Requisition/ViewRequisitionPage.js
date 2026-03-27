import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Requisition from './Requisition';

const ViewRequisitionPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(null); // null = loading, false = no access, true = has access
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState({
    isReviewer: false,
    isApprover: false,
    isAuthorizer: false,
    isFinance: false
  });

  useEffect(() => {
    if (currentUser?.email) {
      checkAccess();
    }
  }, [currentUser]);

  const checkAccess = async () => {
    try {
      console.log('Checking access for user:', currentUser.email);
      // Check if user has any requisition role or is admin
      const response = await fetch(`http://localhost:5000/api/user/requisition-roles?email=${encodeURIComponent(currentUser.email)}`);
      const result = await response.json();
      
      console.log('API Response:', result);
      
      if (result.success) {
        const hasRole = result.roles && result.roles.length > 0;
        const isAdmin = currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1';
        
        console.log('Has role:', hasRole, 'Roles:', result.roles);
        console.log('Is admin:', isAdmin);
        
        // Store roles for UI permissions
        if (result.roles) {
          setUserRoles({
            isReviewer: result.roles.includes('reviewer'),
            isApprover: result.roles.includes('approver'),
            isAuthorizer: result.roles.includes('authorizer'),
            isFinance: result.roles.includes('finance')
          });
        }
        
        // Grant access if user has requisition role OR is admin
        setHasAccess(hasRole || isAdmin);
      } else {
        console.log('API returned success: false');
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/requisitions');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading requisition...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to view this requisition.</p>
        <button 
          onClick={() => navigate('/')}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <Requisition
        isOpen={true}
        mode="view" // Changed to "view" mode to enable viewing and rejecting
        requisitionId={id}
        onBack={handleBackToList}
        currentUser={currentUser}
        userRoles={userRoles} // Pass user roles for permission checking
      />
    </div>
  );
};

export default ViewRequisitionPage;