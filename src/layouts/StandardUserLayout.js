import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Nav from '../components/Nav';
import Settings from '../components/Settings';
import Organization from '../components/Organization';
import ResourcesPage from '../components/organization/resources/ResourcesPage';
import RequisitionList from '../components/Requisition/RequisitionList';
import Requisition from '../components/Requisition/Requisition';
import NotificationCenter from '../components/NotificationCenter';
import ViewRequisitionPage from '../components/Requisition/ViewRequisitionPage';
import Inventory from '../components/inventory';
import InventoryRequestApproval from '../components/InventoryRequestApproval';
import ReturnableItems from '../components/ReturnableItems';
import EmployeeManagement from '../components/EmployeeForm/EmployeeManagement';
import NotificationSettings from '../components/NotificationSettings';
import Appointments from '../components/Appointments';
import SystemCalendar from '../components/SystemCalendar';

// Child Profile Components
import ChildList from '../components/childProfile/ChildList';
import ChildLayout from '../components/childProfile/ChildLayout';
import ChildForm from '../components/childProfile/ChildForm';

// Attendance Widget
import AttendanceWidget from '../components/dashboard/AttendanceWidget';

// Component to check form access before rendering
const FormAccessWrapper = ({ formName, children }) => {
  const [formStatus, setFormStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFormAccess();
  }, [formName]);

  const checkFormAccess = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/forms');
      const result = await response.json();
      
      if (result.success && result.forms) {
        const form = result.forms.find(f => f.name === formName);
        setFormStatus(form ? { is_active: form.is_active, name: form.name } : null);
      }
    } catch (error) {
      console.error('Error checking form access:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{padding: '40px', textAlign: 'center'}}>Checking form access...</div>;
  }

  if (!formStatus) {
    return (
      <div style={{padding: '40px', textAlign: 'center'}}>
        <i className='bx bx-error-circle' style={{fontSize: '3rem', color: '#dc3545', marginBottom: '15px'}}></i>
        <h3>Form Not Found</h3>
        <p>The form "{formName}" is not available.</p>
      </div>
    );
  }

  if (!formStatus.is_active) {
    return (
      <div style={{padding: '40px', textAlign: 'center'}}>
        <i className='bx bx-lock' style={{fontSize: '3rem', color: '#6c757d', marginBottom: '15px'}}></i>
        <h3>Form Deactivated</h3>
        <p>The "{formName}" is currently deactivated.</p>
        <p style={{color: '#6c757d', fontSize: '0.9rem'}}>Please contact your administrator to activate this form.</p>
      </div>
    );
  }

  return children;
};

function StandardUserLayout({ handleLogout, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage on first load
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  const [newRequisitionCount, setNewRequisitionCount] = useState(() => {
    // Initialize from sessionStorage if available
    const saved = sessionStorage.getItem('notificationCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [userLoaded, setUserLoaded] = useState(() => {
    // Check immediately if user already exists (from localStorage on page refresh)
    const hasUser = user?.id && user?.email;
    console.log('[StandardUserLayout] Initial userLoaded check:', hasUser ? '✅ User exists' : '❌ No user');
    return hasUser;
  });
  const panelJustOpenedRef = useRef(false);

  // Mark user as loaded when user is available
  useEffect(() => {
    if (user?.id && user?.email) {
      console.log('[StandardUserLayout] ✓ User fully loaded:', user.id, user.email);
      setUserLoaded(true);
    }
  }, [user?.id, user?.email]);

  // Fetch employee data for profile picture
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.email) {
        console.log('No user email found');
        setLoadingEmployee(false);
        return;
      }
      
      console.log('Fetching employee data for email:', user.email);
      
      try {
        const response = await fetch(`http://localhost:5000/api/employees/by-email/${encodeURIComponent(user.email)}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);
          
          if (data.success && data.employee) {
            setEmployeeData(data.employee);
            console.log('Employee data set:', data.employee);
          } else {
            console.log('No employee found for this email');
          }
        } else if (response.status === 404) {
          // Employee not found - this is OK, not an error
          console.log('Employee profile not found for this email (this is normal)');
        } else {
          console.error('Failed to fetch employee data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      } finally {
        setLoadingEmployee(false);
      }
    };

    fetchEmployeeData();
  }, [user?.email]);

  // Apply dark mode class on mount and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const handleSwitchToAdmin = () => {
    // Navigate to admin dashboard
    navigate('/admin/dashboard');
  };

  const handleBackToStandard = () => {
    // Navigate to standard user dashboard
    navigate('/user/dashboard');
  };

  // Function to fetch all notifications (role-based + requester)
  const fetchAllNotifications = async () => {
    if (!user?.email || !user?.id) return;
    
    try {
      // Fetch unsigned requisitions (pending action for reviewer/approver/authorizer roles)
      const unsignedResponse = await fetch(`http://localhost:5000/api/requisitions/unsigned?unseen=true&user_id=${user.id}`);
      const unsignedResult = await unsignedResponse.json();
      
      // Fetch finalized requisitions (for requester notification)
      const finalizedResponse = await fetch(`http://localhost:5000/api/requisitions/finalized?email=${encodeURIComponent(user.email)}&unseen=true&user_id=${user.id}`);
      const finalizedResult = await finalizedResponse.json();
      
      // Fetch rejected requisitions (for requester notification)
      const rejectedResponse = await fetch(`http://localhost:5000/api/requisitions/rejected?email=${encodeURIComponent(user.email)}&unseen=true&user_id=${user.id}`);
      const rejectedResult = await rejectedResponse.json();
      
      let totalCount = 0;
      
      // Only add unsigned count if user has requisition roles
      // Standard users without roles will get empty array from backend
      if (unsignedResult.success && unsignedResult.requisitions && unsignedResult.requisitions.length > 0) {
        totalCount += unsignedResult.requisitions.length;
      }
      
      // Always add finalized count (for requesters)
      if (finalizedResult.success && finalizedResult.requisitions && finalizedResult.requisitions.length > 0) {
        totalCount += finalizedResult.requisitions.length;
      }
      
      // Add rejected count (for requesters)
      if (rejectedResult.success && rejectedResult.requisitions && rejectedResult.requisitions.length > 0) {
        totalCount += rejectedResult.requisitions.length;
      }
      
      setNewRequisitionCount(totalCount);
      // Save to sessionStorage for persistence
      sessionStorage.setItem('notificationCount', totalCount.toString());
      console.log('Notification count updated:', totalCount, '(unsigned:', unsignedResult.requisitions?.length || 0, ', finalized:', finalizedResult.requisitions?.length || 0, ', rejected:', rejectedResult.requisitions?.length || 0, ')');
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    }
  };

  // Poll for all notifications every 30 seconds - TRIGGERED BY userLoaded
  useEffect(() => {
    if (!userLoaded) {
      console.log('[StandardUserLayout] ⏳ Waiting for user to load before fetching notifications...');
      return;
    }
    
    console.log('[StandardUserLayout] 🚀 User loaded! Starting notification fetch...');

    // Check immediately on load
    fetchAllNotifications();
    
    // Set up polling interval
    const interval = setInterval(fetchAllNotifications, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [userLoaded]);

  // Helper function to check permissions
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.is_admin === 1 || user.is_admin === true || user.is_admin === '1') {
      return true;
    }
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    return false;
  };

  // Standard User Menu - Role-based with permission checks
  const getMenuItems = () => {
    const items = [];
    
    // Always show Dashboard
    items.push({ icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/user/dashboard' });
    
    // Show Inventory with submenu based on permissions
    if (hasPermission('inventory_view')) {
      const inventorySubmenu = [
        { text: 'View Inventory', route: '/user/inventory' }
      ];
      
      // Add "Request Item" for all users who can view
      inventorySubmenu.push({ text: 'Request Item', route: '/user/inventory/request' });
      
      // Add "Add Item", "Transaction Log", and "Request Approvals" only for users with inventory_manage or finance role
      const userRole = user?.role?.toLowerCase() || '';
      const isFinanceUser = userRole === 'finance';
      
      if (hasPermission('inventory_manage') || isFinanceUser) {
        inventorySubmenu.push({ text: 'Add New Item', route: '/user/inventory/add' });
        inventorySubmenu.push({ text: 'Transaction Log', route: '/user/inventory/transactions' });
        inventorySubmenu.push({ text: 'Request Approvals', route: '/user/inventory/approvals' });
        inventorySubmenu.push({ text: 'Returnable Items', route: '/user/inventory/returnable' });
      }
      
      items.push({ 
        icon: 'bx bxl-dropbox', 
        text: 'Inventory',
        route: '/user/inventory',
        submenu: inventorySubmenu
      });
    }
    
    // Show Child Profiles only if user has permission
    if (hasPermission('child_view')) {
      items.push({ 
        icon: 'bx bx-user', 
        text: 'Child Profiles',
        route: '/user/children'
      });
    }
    
    // Show Employees only for HR role
    const userRole = user?.role_name?.toLowerCase() || '';
    const isHRUser = userRole === 'hr';
    
    if (isHRUser && hasPermission('employee_view')) {
      items.push({ 
        icon: 'bx bx-group', 
        text: 'Employees',
        route: '/user/employees'
      });
    }
    
    // Show My Requisitions
    items.push({ 
      icon: 'bx bx-receipt', 
      text: 'My Requisitions',
      route: '/user/my-requisitions',
      submenu: [
        { text: 'Create New', route: '/user/my-requisitions/create' },
        { text: 'View My Requests', route: '/user/my-requisitions/list' }
      ]
    });
    
    // Show Settings with submenu
    items.push({ 
      icon: 'bx bx-cog', 
      text: 'Settings',
      route: '/user/settings',
      submenu: [
        { text: 'Notification Settings', route: '/user/settings/notifications' },
        { text: 'Profile Settings', route: '/user/settings/profile' },
        { text: 'Account Settings', route: '/user/settings/account' }
      ]
    });
    
    // Add Organization menu for all standard users
    items.push({ 
      icon: 'bx bx-buildings', 
      text: 'Organization',
      route: '/user/organization',
      submenu: [
        { text: 'Shamida News', route: '/user/shamida-news' },
        { text: 'Resources', route: '/user/resources' },
        { text: 'Organization Calendar', route: '/user/organization/calendar' },
        { text: 'Lookup Editor', route: '/user/organization/lookup' }
      ]
    });
    
    return items;
  };

  // Standard User Dashboard Component
  const StandardDashboard = () => {
    // Use employeeData from parent scope - no need to fetch again

    // Show message if no employee data found
    if (!employeeData) {
      return (
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Welcome, {user?.full_name || user?.username || 'User'}</h1>
            <p>Standard User Dashboard</p>
          </div>
          <div className="no-data-message">
            <i className='bx bx-info-circle'></i>
            <p>No employee record found for your email ({user?.email}).</p>
            <p>Please contact HR to set up your employee profile.</p>
          </div>
        </div>
      );
    }

    // Calculate leave days remaining
    const annualLeaveLeft = employeeData ? 
      (parseInt(employeeData.annual_leave_days) || 0) - (parseInt(employeeData.used_annual_leave) || 0) : 0;
    const sickLeaveLeft = employeeData ? 
      (parseInt(employeeData.sick_leave_days) || 0) - (parseInt(employeeData.used_sick_leave) || 0) : 0;

    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="user-profile-header">
            {employeeData?.profile_image ? (
              <img 
                src={employeeData.profile_image} 
                alt="Profile" 
                className="dashboard-profile-image"
              />
            ) : (
              <div className="dashboard-profile-placeholder">
                <i className='bx bx-user'></i>
              </div>
            )}
            <div className="user-info">
              <h1>Welcome, {employeeData?.full_name || user?.full_name || user?.username || 'User'}</h1>
              <p>Standard User Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-stats">
          {/* Leave Balance */}
          <div className="stat-card">
            <div className="stat-icon leave-icon">
              <i className='bx bx-calendar-check'></i>
            </div>
            <div className="stat-info">
              <h3>Leave Balance</h3>
              <p>{annualLeaveLeft} days annual leave left</p>
              <p className="sub-text">{sickLeaveLeft} sick days remaining</p>
            </div>
          </div>
          
          {/* Recognition */}
          {employeeData?.recognition && (
            <div className="stat-card recognition-card">
              <div className="stat-icon recognition-icon">
                <i className='bx bx-award'></i>
              </div>
              <div className="stat-info">
                <h3>Recognition</h3>
                <p>{employeeData.recognition}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="dashboard-content">
          <div className="content-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => navigate('/user/attendance-tracker')}>
                <i className='bx bx-time-five'></i>
                Attendance Tracker
              </button>
            </div>
          </div>
          
          <div className="content-section">
            <h2>Recent Activity</h2>
            <p className="no-activity">No recent activity to display.</p>
          </div>
        </div>
      </div>
    );
  };

  // Separate component for Attendance Tracker that uses employee data
  const AttendanceTrackerPage = () => {
    // Use employeeData from parent scope - no need to fetch again
    if (loadingEmployee) {
      return (
        <div className="dashboard-container">
          <div className="loading-message">Loading attendance data...</div>
        </div>
      );
    }
  
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Attendance Tracker</h1>
          <p>Clock In/Out Management</p>
        </div>
        <AttendanceWidget user={user} employeeData={employeeData} />
      </div>
    );
  };

  return (
    <div className="App">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
        handleLogout={handleLogout}
        activeItem={location.pathname}
        setActiveItem={() => {}}
        customMenuItems={getMenuItems()}
        user={user}
      />
      
      <div className={`content ${sidebarOpen ? '' : 'sidebar-close'}`}>
        <Nav
          toggleSidebar={toggleSidebar}
          user={user}
          employeeData={employeeData}
          onSwitchToStandard={handleBackToStandard}
          onBackToAdmin={handleSwitchToAdmin}
          isStandardView={true}
          onLogout={handleLogout}
          onSwitchAccount={() => alert('Switch Account - To be implemented')}
          notificationCount={newRequisitionCount}
          onNotificationClick={() => {
            console.log('[StandardUserLayout] Bell clicked, opening panel');
            panelJustOpenedRef.current = true;
            setShowNotifications(true);
            setTimeout(() => {
              panelJustOpenedRef.current = false;
              console.log('[StandardUserLayout] Reset panelJustOpenedRef');
            }, 200);
          }}
          onProgramChange={setSelectedProgram}
        />
        
        {/* Unified Notification Center Panel */}
        <NotificationCenter 
          isOpen={showNotifications}
          onClose={() => {
            console.log('[StandardUserLayout] onClose called! showNotifications:', showNotifications, 'panelJustOpened:', panelJustOpenedRef.current);
            if (panelJustOpenedRef.current) {
              console.log('[StandardUserLayout] ⛔ Blocking close - panel just opened');
              return;
            }
            console.log('[StandardUserLayout] ✅ Allowing close');
            setShowNotifications(false);
          }}
          onRequisitionClick={(reqId) => {
            console.log('[StandardUserLayout] Notification clicked, navigating to:', reqId);
            navigate(`/user/my-requisitions/${reqId}`);
            fetchAllNotifications(); // Refresh count
          }}
          onCountChange={(count) => {
            console.log('[StandardUserLayout] onCountChange received:', count);
            setNewRequisitionCount(count);
          }}
          currentUser={user}
        />
        
        {/* CONTENT - Direct route-to-component mapping */}
        <main>
          <Routes>
            {/* Default route */}
            <Route path="/" element={<StandardDashboard selectedProgram={selectedProgram} />} />
            <Route path="/dashboard" element={<StandardDashboard selectedProgram={selectedProgram} />} />
            
            {/* Attendance Tracker Route */}
            <Route path="/attendance-tracker" element={<AttendanceTrackerPage />} />
            
            {/* Child Profiles Routes */}
            <Route path="/children" element={<ChildList user={user} basePath="/user" selectedProgram={selectedProgram} />} />
            <Route path="/children/new" element={<ChildForm mode="create" user={user} onBack={() => navigate('/user/children')} />} />
            <Route path="/children/:id" element={<ChildLayout user={user} basePath="/user" />} />
            <Route path="/children/:id/edit" element={<ChildForm mode="edit" user={user} onBack={() => navigate('/user/children')} />} />
            
            {/* Employees Route - HR Only */}
            <Route path="/employees" element={<EmployeeManagement isOpen={true} selectedProgram={null} />} />
            
            {/* Inventory Routes */}
            <Route path="/inventory" element={<Inventory Inventoryopen={true} user={user} hasManagePermission={hasPermission('inventory_manage')} viewMode="view" />} />
            <Route path="/inventory/add" element={<Inventory Inventoryopen={true} user={user} hasManagePermission={hasPermission('inventory_manage') || user?.role?.toLowerCase() === 'finance'} viewMode="add" />} />
            <Route path="/inventory/request" element={<Inventory Inventoryopen={true} user={user} hasManagePermission={false} viewMode="request" />} />
            <Route path="/inventory/transactions" element={<Inventory Inventoryopen={true} user={user} hasManagePermission={hasPermission('inventory_manage')} viewMode="transactions" />} />
            <Route path="/inventory/approvals" element={<InventoryRequestApproval user={user} hasManagePermission={hasPermission('inventory_manage')} />} />
            <Route path="/inventory/returnable" element={<ReturnableItems user={user} hasManagePermission={hasPermission('inventory_manage')} />} />
            
            {/* My Requisitions Routes */}
            <Route path="/my-requisitions" element={
              <FormAccessWrapper formName="Requisition Form">
                <RequisitionList onCreateNew={() => navigate('/user/my-requisitions/create')} onEditRequisition={(reqId) => navigate(`/user/my-requisitions/${reqId}`)} userOnly={true} currentUser={user} selectedProgram={selectedProgram} />
              </FormAccessWrapper>
            } />
            <Route path="/my-requisitions/create" element={
              <div style={{padding: '20px'}}>
                <h2>Creating Requisition...</h2>
                <FormAccessWrapper formName="Requisition Form">
                  <Requisition isOpen={true} mode="create" onBack={() => navigate('/user/my-requisitions')} currentUser={user} />
                </FormAccessWrapper>
              </div>
            } />
            <Route path="/my-requisitions/list" element={
              <FormAccessWrapper formName="Requisition Form">
                <RequisitionList onCreateNew={() => navigate('/user/my-requisitions/create')} onEditRequisition={(reqId) => navigate(`/user/my-requisitions/${reqId}`)} userOnly={true} currentUser={user} selectedProgram={selectedProgram} />
              </FormAccessWrapper>
            } />
            {/* View/Edit individual requisition (for users with requisition roles) */}
            <Route path="/my-requisitions/:id" element={
              <ViewRequisitionPage currentUser={user} />
            } />
            
            {/* Settings Routes */}
            <Route path="/settings" element={<Settings settinopen={true} user={user} defaultSection='notifications' />} />
            <Route path="/settings/notifications" element={<Settings settinopen={true} user={user} defaultSection='notifications' />} />
            <Route path="/settings/profile" element={<Settings settinopen={true} user={user} defaultSection='profile' />} />
            <Route path="/settings/account" element={<Settings settinopen={true} user={user} defaultSection='account' />} />
            
            {/* Organization Routes - SPECIFIC ROUTES FIRST */}
            <Route path="organization/calendar" element={
              (() => {
                console.log('[ROUTE] organization/calendar matched! Rendering Appointments');
                return <Appointments user={user} />;
              })()
            } />
            <Route path="organization/lookup" element={<Organization user={user} />} />
            <Route path="shamida-news" element={<Organization user={user} />} />
            <Route path="resources" element={<ResourcesPage user={user} />} />
            <Route path="organization" element={<Organization user={user} />} />
            
            {/* Fallback - redirect to dashboard */}
            <Route path="*" element={<StandardDashboard />} />
          </Routes>
        </main>
        
        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <NotificationSettings 
            user={user}
            onClose={() => setShowNotificationSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

export default StandardUserLayout;
