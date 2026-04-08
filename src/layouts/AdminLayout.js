import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Nav from '../components/Nav';
import Dashboard from '../components/Dashboard';
import Inventory from '../components/inventory';
import ReturnableItems from '../components/ReturnableItems';
import Report from '../components/Report';
import Record_Managment from '../components/Record_Managment';
import UserControle from '../components/usercontrole';
import Settings from '../components/Settings';
import Requisition from '../components/Requisition/Requisition';
import RequisitionList from '../components/Requisition/RequisitionList';
import NotificationCenter from '../components/NotificationCenter';
import EmployeeManagement from '../components/EmployeeForm/EmployeeManagement';
import Organization from '../components/Organization';
import ResourcesPage from '../components/organization/resources/ResourcesPage';
import InventoryRequestApproval from '../components/InventoryRequestApproval';
import ManageOfficeIPs from '../components/admin/ManageOfficeIPs';
import NotificationSettings from '../components/NotificationSettings';
import Appointments from '../components/Appointments';
import SystemCalendar from '../components/SystemCalendar';
import API_CONFIG from '../config/api';

// Child Profile Components
import ChildList from '../components/childProfile/ChildList';
import ChildLayout from '../components/childProfile/ChildLayout';
import ChildForm from '../components/childProfile/ChildForm';

// Wrapper component for edit requisition route to extract ID from params
const RequisitionWithParams = ({ mode, currentUser, onBack }) => {
  const { id } = useParams();
  return <Requisition isOpen={true} mode={mode} requisitionId={id} currentUser={currentUser} onBack={onBack} />;
};

// Helper function to check permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.is_admin === 1 || user.is_admin === true || user.is_admin === '1') {
    return true;
  }
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  return false;
};

function AdminLayout({ handleLogout, currentUser }) {
  console.log('[AdminLayout] === COMPONENT RENDERING ===');
  console.log('[AdminLayout] currentUser prop:', currentUser);
  console.log('[AdminLayout] currentUser?.id:', currentUser?.id);
  console.log('[AdminLayout] currentUser?.email:', currentUser?.email);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage on first load
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  const [editingRequisitionId, setEditingRequisitionId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newRequisitionCount, setNewRequisitionCount] = useState(() => {
    // Initialize from sessionStorage if available (persists across component remounts)
    const saved = sessionStorage.getItem('notificationCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [employeeData, setEmployeeData] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [userLoaded, setUserLoaded] = useState(() => {
    // Check immediately if user already exists (from localStorage on page refresh)
    const hasUser = currentUser?.id && currentUser?.email;
    console.log('[AdminLayout] Initial userLoaded check:', hasUser ? '✅ User exists' : '❌ No user');
    return hasUser; // Initialize to true if user already loaded
  });
  const panelJustOpenedRef = useRef(false);
  
  console.log('[AdminLayout] newRequisitionCount state:', newRequisitionCount);
  console.log('[AdminLayout] showNotifications state:', showNotifications);
  
  // Debug: Log whenever newRequisitionCount changes
  useEffect(() => {
    console.log('[AdminLayout] ✅ newRequisitionCount CHANGED to:', newRequisitionCount);
  }, [newRequisitionCount]);

  // Mark user as loaded when currentUser is available - RUNS ON MOUNT AND CHANGE
  useEffect(() => {
    console.log('[AdminLayout] Checking if user is loaded... currentUser:', currentUser);
    if (currentUser?.id && currentUser?.email) {
      console.log('[AdminLayout] ✅ User IS loaded! ID:', currentUser.id, 'Email:', currentUser.email);
      setUserLoaded(true);
    } else {
      console.log('[AdminLayout] ❌ User NOT loaded yet - missing id or email');
    }
  }, [currentUser]); // Depend on entire currentUser object

  // Fetch employee data for profile picture (for admin users who may have employee profiles)
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!currentUser?.email) {
        return;
      }
      
      try {
        // Try to fetch employee by email - handle 404 gracefully
        const response = await fetch(API_CONFIG.getUrl(`/api/employees/by-email/${encodeURIComponent(currentUser.email)}`));
        
        if (response.status === 404) {
          // Employee not found - this is OK, user might not have an employee profile
          console.log('[AdminLayout] No employee profile found for this user');
          setEmployeeData(null);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.employee) {
            setEmployeeData(data.employee);
          }
        } else {
          console.warn('[AdminLayout] Failed to fetch employee data:', response.status);
        }
      } catch (error) {
        // Silently fail - employee data is not critical
        console.log('[AdminLayout] Could not connect to employee API:', error.message);
        setEmployeeData(null);
      }
    };

    fetchEmployeeData();
  }, [currentUser?.email]);

  // Fetch initial notification count and poll every 30 seconds - TRIGGERED BY userLoaded
  useEffect(() => {
    console.log('[AdminLayout] Notification fetch effect triggered. userLoaded:', userLoaded, 'currentUser:', currentUser ? 'exists' : 'null');
    
    if (!userLoaded) {
      console.log('[AdminLayout] ⏳ Waiting for user to load before fetching notifications...');
      return;
    }
    
    console.log('[AdminLayout] 🚀 User loaded! Starting notification fetch...');
    
    const fetchNotificationCount = async () => {
      console.log('[AdminLayout] === FETCHING NOTIFICATION COUNT ===');
      console.log('[AdminLayout] currentUser:', currentUser);
      console.log('[AdminLayout] currentUser?.id:', currentUser?.id);
      console.log('[AdminLayout] currentUser?.email:', currentUser?.email);
      
      if (!currentUser?.id || !currentUser?.email) {
        console.log('[AdminLayout] ❌ Missing user ID or email, skipping fetch');
        return;
      }
      
      try {
        console.log('[AdminLayout] Fetching with user_id:', currentUser.id, 'email:', currentUser.email);
        
        // Fetch unsigned requisitions count (unseen only)
        const unsignedUrl = API_CONFIG.getUrl(`/api/requisitions/unsigned?unseen=true&user_id=${currentUser.id}`);
        console.log('[AdminLayout] Calling:', unsignedUrl);
        const unsignedResponse = await fetch(unsignedUrl);
        const unsignedResult = await unsignedResponse.json();
        console.log('[AdminLayout] Unsigned response:', unsignedResult);
        
        let totalCount = 0;
        
        if (unsignedResult.success) {
          const unsignedCount = unsignedResult.requisitions?.length || 0;
          totalCount = unsignedCount;
          console.log('[AdminLayout] Unsigned count:', unsignedCount);
        }
        
        // Fetch finalized requisitions count (unseen only)
        const finalizedUrl = API_CONFIG.getUrl(`/api/requisitions/finalized?email=${encodeURIComponent(currentUser.email)}&unseen=true&user_id=${currentUser.id}`);
        console.log('[AdminLayout] Calling:', finalizedUrl);
        const finalizedResponse = await fetch(finalizedUrl);
        const finalizedResult = await finalizedResponse.json();
        console.log('[AdminLayout] Finalized response:', finalizedResult);
        
        if (finalizedResult.success) {
          const finalizedCount = finalizedResult.requisitions?.length || 0;
          totalCount += finalizedCount;
          console.log('[AdminLayout] Finalized count:', finalizedCount);
        }
        
        console.log('[AdminLayout] ✓ TOTAL count:', totalCount);
        console.log('[AdminLayout] Current state before update:', newRequisitionCount);
        console.log('[AdminLayout] Setting state to:', totalCount);
        setNewRequisitionCount(totalCount);
        console.log('[AdminLayout] State updated! New value:', totalCount);
        // Also save to sessionStorage for persistence
        sessionStorage.setItem('notificationCount', totalCount.toString());
        console.log('[AdminLayout] ✓ Done fetching notifications');
      } catch (error) {
        console.error('[AdminLayout] ❌ Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();
    
    // Set up polling interval - check every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [userLoaded]); // Now depends on userLoaded flag instead of currentUser

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

  const handleSwitchToStandard = () => {
    // Navigate to standard user dashboard
    navigate('/user/dashboard');
  };

  const handleBackToAdmin = () => {
    // Navigate back to admin dashboard
    navigate('/admin/dashboard');
  };

  // Build menu items with routes
  const getMenuItems = () => {
    const items = [];
    const isAdminUser = currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1';
    
    if (isAdminUser) {
      items.push({ icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/admin/dashboard' });
      items.push({ 
        icon: 'bx bxl-dropbox', 
        text: 'Inventory', 
        route: '/admin/inventory',
        submenu: [
          { text: 'View Inventory', route: '/admin/inventory' },
          { text: 'Add New Item', route: '/admin/inventory/add' },
          { text: 'Request Approvals', route: '/admin/inventory/approvals' },
          { text: 'Returnable Items', route: '/admin/inventory/returnable' }
        ]
      });
      items.push({ icon: 'bx bx-user', text: 'Child Profiles', route: '/admin/children' });
      items.push({ icon: 'bx bxs-report', text: 'Report', route: '/admin/reports' });
      items.push({ icon: 'bx bx-folder-plus', text: 'Record Management', route: '/admin/records' });
      items.push({ icon: 'bx bx-group', text: 'Employees', route: '/admin/employees' });
      items.push({ icon: 'bx bx-user', text: 'User Access Control', route: '/admin/users' });
      items.push({ 
        icon: 'bx bx-receipt', 
        text: 'Requisition',
        route: '/admin/requisitions',
        submenu: [
          { text: 'Create New', route: '/admin/requisitions/create' },
          { text: 'Edit Existing', route: '/admin/requisitions/list' }
        ]
      });
      items.push({
        icon: 'bx bxs-building-house',
        text: 'Organization',
        route: '/admin/organization',
        submenu: [
          { text: 'Shamida News', route: '/admin/shamida-news' },
          { text: 'Resources', route: '/admin/resources' },
          { text: 'Organization Calendar', route: '/admin/organization/calendar' },
          { text: 'WiFi IPs', route: '/admin/organization/wifi-ips' },
          { text: 'Lookup Editor', route: '/admin/organization/lookup' }
        ]
      });
      items.push({ icon: 'bx bx-cog', text: 'Settings', route: '/admin/settings' });
      return items;
    }
    
    // Role-based menu for non-admin users
    const userRole = currentUser?.role?.toLowerCase() || '';
    switch (userRole) {
      case 'finance':
        items.push({ icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/admin/dashboard' });
        items.push({ icon: 'bx bxs-report', text: 'Report', route: '/admin/reports' });
        items.push({ icon: 'bx bx-receipt', text: 'My Requisitions', route: '/admin/my-requisitions' });
        items.push({ icon: 'bx bx-cog', text: 'Settings', route: '/admin/settings' });
        break;
        
      case 'hr':
        items.push({ icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/admin/dashboard' });
        if (hasPermission(currentUser, 'employee_view')) {
          items.push({ icon: 'bx bx-group', text: 'Employees', route: '/admin/employees' });
        }
        if (hasPermission(currentUser, 'child_view')) {
          items.push({ icon: 'bx bx-user', text: 'Child Profiles', route: '/admin/children' });
        }
        items.push({ icon: 'bx bx-receipt', text: 'My Requisitions', route: '/admin/my-requisitions' });
        items.push({ icon: 'bx bx-cog', text: 'Settings', route: '/admin/settings' });
        break;
        
      case 'director':
        items.push({ icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/admin/dashboard' });
        items.push({ icon: 'bx bxs-report', text: 'Report', route: '/admin/reports' });
        if (hasPermission(currentUser, 'employee_view')) {
          items.push({ icon: 'bx bx-group', text: 'Employees', route: '/admin/employees' });
        }
        if (hasPermission(currentUser, 'child_view')) {
          items.push({ icon: 'bx bx-user', text: 'Child Profiles', route: '/admin/children' });
        }
        items.push({ icon: 'bx bx-cog', text: 'Settings', route: '/admin/settings' });
        break;
        
      default:
        items.push({ icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/admin/dashboard' });
        if (hasPermission(currentUser, 'child_view')) {
          items.push({ icon: 'bx bx-user', text: 'Child Profiles', route: '/admin/children' });
        }
        items.push({ icon: 'bx bx-cog', text: 'Settings', route: '/admin/settings' });
        break;
    }
    
    return items;
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
        user={currentUser}
      />
      <div className={`content ${sidebarOpen ? '' : 'sidebar-close'}`}>
        <Nav 
          toggleSidebar={toggleSidebar} 
          user={currentUser}
          employeeData={employeeData}
          onSwitchToStandard={handleSwitchToStandard}
          onBackToAdmin={handleBackToAdmin}
          isStandardView={false}
          onLogout={handleLogout}
          notificationCount={newRequisitionCount}
          onNotificationClick={() => {
            console.log('[AdminLayout] Bell clicked, opening panel');
            console.log('[AdminLayout] Current newRequisitionCount:', newRequisitionCount);
            panelJustOpenedRef.current = true; // Mark that we just opened the panel
            setShowNotifications(true);
            // Reset the flag after 200ms (panel should be stable by then)
            setTimeout(() => {
              panelJustOpenedRef.current = false;
              console.log('[AdminLayout] Reset panelJustOpenedRef');
            }, 200);
            // Don't reset count here - let NotificationCenter handle it via onCountChange
          }}
          onProgramChange={setSelectedProgram}
        />
        
        <NotificationCenter 
          isOpen={showNotifications}
          onClose={() => {
            console.log('[AdminLayout] onClose called! showNotifications:', showNotifications, 'panelJustOpened:', panelJustOpenedRef.current);
            // Prevent closing if panel just opened (within last 100ms)
            if (panelJustOpenedRef.current) {
              console.log('[AdminLayout] ⛔ Blocking close - panel just opened');
              return; // Don't close!
            }
            console.log('[AdminLayout] ✅ Allowing close');
            setShowNotifications(false);
          }}
          onRequisitionClick={(reqId) => {
            console.log('[AdminLayout] Notification clicked, navigating to:', reqId);
            setEditingRequisitionId(reqId);
            // Navigate to view the specific requisition
            navigate(`/admin/requisitions/${reqId}`);
          }}
          onCountChange={(count) => {
            console.log('[AdminLayout] onCountChange received:', count);
            setNewRequisitionCount(count);
          }}
          currentUser={currentUser}
        />
        
        {/* MAIN CONTENT AREA - Direct route-to-component mapping */}
        <main>
          <Routes>
            {/* Default route */}
            <Route path="/" element={<Dashboard selectedProgram={selectedProgram} />} />
            <Route path="/dashboard" element={<Dashboard selectedProgram={selectedProgram} />} />
            
            {/* Inventory */}
            <Route path="/inventory" element={<Inventory Inventoryopen={true} user={currentUser} hasManagePermission={true} />} />
            <Route path="/inventory/add" element={<Inventory Inventoryopen={true} viewMode="add" user={currentUser} hasManagePermission={true} />} />
            <Route path="/inventory/approvals" element={<InventoryRequestApproval user={currentUser} hasManagePermission={true} />} />
            <Route path="/inventory/returnable" element={<ReturnableItems user={currentUser} hasManagePermission={true} />} />
            
            {/* Reports */}
            <Route path="/reports" element={<Report Reportopen={true} selectedProgram={selectedProgram} />} />
            
            {/* Record Management */}
            <Route path="/records" element={<Record_Managment RecordManopen={true} />} />
            
            {/* Employees */}
            <Route path="/employees" element={<EmployeeManagement isOpen={true} />} />
            
            {/* User Access Control */}
            <Route path="/users" element={<UserControle UserControlopen={true} />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings settinopen={true} user={currentUser} />} />
            
            {/* Organization - Shamida News & Notices */}
            <Route path="shamida-news" element={<Organization user={currentUser} />} />
            <Route path="admin/shamida-news" element={<Organization user={currentUser} />} />
            <Route path="organization/lookup" element={<Organization user={currentUser} />} />
            <Route path="admin/organization/lookup" element={<Organization user={currentUser} />} />
            <Route path="organization/calendar" element={<Appointments user={currentUser} />} />
            <Route path="admin/organization/calendar" element={<Appointments user={currentUser} />} />
            <Route path="organization/wifi-ips" element={<ManageOfficeIPs user={currentUser} />} />
            <Route path="admin/organization/wifi-ips" element={<ManageOfficeIPs user={currentUser} />} />
            <Route path="organization" element={<Organization user={currentUser} />} />
            <Route path="admin/organization" element={<Organization user={currentUser} />} />
            
            {/* Organization - Resources Management */}
            <Route path="/resources" element={<ResourcesPage user={currentUser} />} />
            <Route path="/admin/resources" element={<ResourcesPage user={currentUser} />} />
            
            {/* Requisition Routes */}
            <Route path="/requisitions" element={<RequisitionList onCreateNew={() => navigate('/admin/requisitions/create')} onEditRequisition={(reqId) => { console.log('Edit requisition:', reqId); navigate(`/admin/requisitions/${reqId}/edit`); }} currentUser={currentUser} selectedProgram={selectedProgram} />} />
            <Route path="/requisitions/create" element={
              <div style={{padding: '20px'}}>
                <h2>Creating Requisition...</h2>
                <Requisition isOpen={true} mode="create" currentUser={currentUser} onBack={() => navigate('/admin/requisitions')} />
              </div>
            } />
            <Route path="/requisitions/list" element={<RequisitionList onCreateNew={() => navigate('/admin/requisitions/create')} onEditRequisition={(reqId) => { console.log('Edit requisition:', reqId); navigate(`/admin/requisitions/${reqId}/edit`); }} currentUser={currentUser} selectedProgram={selectedProgram} />} />
            {/* View requisition route (for email links) - defaults to view mode */}
            <Route path="/requisitions/:id" element={
              <RequisitionWithParams mode="view" currentUser={currentUser} onBack={() => navigate('/admin/requisitions')} />
            } />
            <Route path="/requisitions/:id/edit" element={
              <RequisitionWithParams mode="edit" currentUser={currentUser} onBack={() => navigate('/admin/requisitions')} />
            } />
            
            {/* Child Profiles Routes */}
            <Route path="/children" element={<ChildList user={currentUser} basePath="/admin" selectedProgram={selectedProgram} />} />
            <Route path="/children/new" element={<ChildForm mode="create" user={currentUser} onBack={() => navigate('/admin/children')} />} />
            <Route path="/children/:id" element={<ChildLayout user={currentUser} basePath="/admin" />} />
            <Route path="/children/:id/edit" element={<ChildForm mode="edit" user={currentUser} onBack={() => navigate('/admin/children')} />} />
            
            {/* Fallback - redirect to dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
        
        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <NotificationSettings 
            user={currentUser}
            onClose={() => setShowNotificationSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

export default AdminLayout;
