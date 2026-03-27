import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrograms } from '../services/programService';

const Nav = ({ toggleSidebar, user, employeeData, onSwitchToStandard, onBackToAdmin, isStandardView, onLogout, onSwitchAccount, notificationCount: propNotificationCount = 0, onNotificationClick, onProgramChange }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('none');
  const [programs, setPrograms] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  // Use sessionStorage as backup to prevent flicker
  const [notificationCount, setNotificationCount] = useState(() => {
    const saved = sessionStorage.getItem('notificationCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // Sync with prop but prioritize sessionStorage
  useEffect(() => {
    if (propNotificationCount > 0) {
      console.log('[Nav] Updating count from prop:', propNotificationCount);
      setNotificationCount(propNotificationCount);
      sessionStorage.setItem('notificationCount', propNotificationCount.toString());
    }
  }, [propNotificationCount]);
  
  const isAdmin = user?.is_admin === 1 || user?.is_admin === true || user?.is_admin === '1';

  // Fetch programs on mount
  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.programs);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for profile picture updates from Settings
  useEffect(() => {
    const handleProfilePictureUpdate = (event) => {
      console.log('[Nav] Profile picture updated event received');
      // Force a re-render by updating state or the component will automatically pick up the change
      // The user object should be updated by the parent component
    };
    
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    return () => window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
  }, []);

  const handleSearch = (e) => {
   e.preventDefault();
    // Handle search logic here
   console.log('Search:', searchQuery, 'Program:', selectedProgram);
 };

  const handleProgramChange = (e) => {
    const programId = e.target.value;
    setSelectedProgram(programId);
    if (onProgramChange && typeof onProgramChange === 'function') {
      onProgramChange(programId === 'none' ? null : programId);
    }
  };

  return (
    <nav>
      {console.log('[Nav] Rendering with notificationCount:', notificationCount, 'type:', typeof notificationCount)}
      {console.log('[Nav] Should show badge?', notificationCount > 0)}
      <i className="bx bx-menu" onClick={toggleSidebar}></i>
      <form >
        <div className="form-input">
          <select 
            name="Select Program" 
            id="program"
            value={selectedProgram}
            onChange={handleProgramChange}
          >
            <option value="none">All Programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
          {/*<input 
            type="search" 
            placeholder="Search......"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <i className='bx bx-search'></i>
          </button>*/}
        </div>
      </form>
      {/* Admin Switch Toggle - Show Switch when in Admin, Show Back when in Standard View */}
      {isAdmin && (
        <div className="nav-switch-toggle">
          <span className="switch-label">
            {isStandardView ? 'Standard' : 'Admin'}
          </span>
          <button 
            className="switch-btn-nav" 
            onClick={() => {
              if (isStandardView) {
                onBackToAdmin && onBackToAdmin();
              } else {
                onSwitchToStandard && onSwitchToStandard();
              }
            }}
            title={isStandardView ? "Back to Admin" : "Switch to Standard User View"}
          >
            <i className={isStandardView ? 'bx bx-arrow-back' : 'bx bx-transfer'}></i>
            <span>{isStandardView ? 'Back' : 'Switch'}</span>
          </button>
        </div>
      )}
      
      <a 
        href="#" 
        className="notification" 
        title={`${notificationCount} new requisition${notificationCount !== 1 ? 's' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          console.log('[Nav] Notification bell clicked, count:', notificationCount);
          if (onNotificationClick && typeof onNotificationClick === 'function') {
            onNotificationClick();
          }
        }}
      >
        <i className='bx bx-bell'></i>
        {notificationCount > 0 && (
          <span className="num">{notificationCount}</span>
        )}
      </a>
      
      {/* Debug: Show raw prop value */}
      {console.log('[Nav Badge] Rendering - state count:', notificationCount, 'prop count:', propNotificationCount)}
      
      {/* Calendar Icon - Navigate to Organization Calendar */}
      <a 
        href="#" 
        className="calendar-icon"
        title="Organization Calendar"
        onClick={(e) => {
          e.preventDefault();
          // Navigate based on user type
          if (isAdmin) {
            navigate('/admin/organization/calendar');
          } else {
            navigate('/user/organization/calendar');
          }
        }}
      >
        <i className='bx bxs-calendar' style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
      </a>
      
      <div className="profile-menu-container" ref={profileRef}>
        <div 
          className="profile" 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          style={{ cursor: 'pointer' }}
        >
          <img 
            src={employeeData?.profile_image || user?.profile_image || "/Logo/logo-favicon.png"} 
            alt="Profile" 
            onError={(e) => { e.target.src = "/Logo/logo-favicon.png"; }}
          />
        </div>
        {showProfileMenu && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-header">
              <img 
                src={employeeData?.profile_image || user?.profile_image || "/Logo/logo-favicon.png"} 
                alt="Profile" 
                className="dropdown-profile-img"
                onError={(e) => { e.target.src = "/Logo/logo-favicon.png"; }}
              />
              <div className="profile-info">
                <span className="profile-name">{employeeData?.full_name || user?.full_name || user?.name || 'User'}</span>
                <span className="profile-email">{user?.email || ''}</span>
              </div>
            </div>
            <div className="profile-dropdown-divider"></div>
            {onSwitchAccount && (
              <button className="dropdown-item" onClick={() => { onSwitchAccount(); setShowProfileMenu(false); }}>
                <i className='bx bx-transfer-alt'></i>
                <span>Switch Account</span>
              </button>
            )}
            {onLogout && (
              <button className="dropdown-item logout" onClick={() => { onLogout(); setShowProfileMenu(false); }}>
                <i className='bx bx-log-out'></i>
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Nav;
