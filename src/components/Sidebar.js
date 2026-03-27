import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ sidebarOpen, darkMode, toggleDarkMode, handleLogout, activeItem, setActiveItem, customMenuItems, user, toggleSidebar }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to check if current path matches item or its submenu
  const isCurrentPathMatch = (item) => {
    const currentPath = location.pathname;
    
    if (item.route && currentPath === item.route) {
      return true;
    }
    
    if (item.submenu) {
      return item.submenu.some(sub => sub.route && currentPath.startsWith(sub.route));
    }
    
    return false;
  };

  // Check if a menu item or its submenu is active based on current pathname
  const isActive = (item) => {
    return isCurrentPathMatch(item);
  };

  const defaultMenuItems = [
    { icon: 'bx bxs-dashboard', text: 'Dashboard', route: '/' },
    { 
      icon: 'bx bxl-dropbox', 
      text: 'Inventory',
      route: '/inventory',
      submenu: [
        { text: 'View Inventory', route: '/inventory' },
        { text: 'Add New Item', route: '/inventory/add' },
        { text: 'Returnable Items', route: '/inventory/returnable' },
        { text: 'Approvals', route: '/inventory/approvals' }
      ]
    },
    { 
      icon: 'bx bx-user', 
      text: 'Child Profiles',
      route: '/children'
    },
    { icon: 'bx bxs-pen', text: 'Design Form', route: '/forms' },
    { icon: 'bx bxs-report', text: 'Report', route: '/reports' },
    { icon: 'bx bx-folder-plus', text: 'Record Management', route: '/records' },
    { icon: 'bx bx-user', text: 'User Access Control', route: '/users' },
    { 
      icon: 'bx bx-buildings', 
      text: 'Organization',
      route: '/organization',
      submenu: [
        { text: 'Shamida News', route: '/shamida-news' },
        { text: 'Resources', route: '/resources' },
        { text: 'System Calendar', route: '/system-calendar' },
        { text: 'My Appointments', route: '/appointments' },
        { text: 'Lookup Editor', route: '/organization/lookup' }
      ]
    },
    { 
      icon: 'bx bx-cog', 
      text: 'Settings',
      route: '/settings'
    },
    { 
      icon: 'bx bx-receipt', 
      text: 'Requisition',
      submenu: [
        { text: 'Create New', route: '/requisitions/create' },
        { text: 'Edit Existing', route: '/requisitions/list' }
      ]
    },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  const handleMenuClick = (e, item) => {
    e.preventDefault();
    console.log('Sidebar menu clicked:', item.text);
    
    // If item has a submenu, toggle expansion
    if (item.submenu) {
      // If sidebar is closed, open it first and wait for animation
      if (!sidebarOpen && toggleSidebar) {
        // Open sidebar first
        toggleSidebar();
        // Wait for sidebar to open before expanding submenu (300ms matches CSS transition)
        setTimeout(() => {
          setExpandedMenu(expandedMenu === item.text ? null : item.text);
        }, 300);
        return;
      }
      // Sidebar is already open, just toggle submenu
      setExpandedMenu(expandedMenu === item.text ? null : item.text);
      return;
    }
    
    // If item has a route, use React Router navigation
    if (item.route) {
      console.log('Navigating to route:', item.route);
      navigate(item.route);
      return;
    }
  };

  const handleSubmenuClick = (e, submenuItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Submenu clicked:', submenuItem);
    console.log('Has route:', !!submenuItem.route);
    console.log('Has action:', !!submenuItem.action);
    
    // Ensure sidebar is open when clicking submenu items
    if (!sidebarOpen && toggleSidebar) {
      toggleSidebar();
    }
    
    // Handle action property (sets activeItem in parent)
    if (submenuItem.action && setActiveItem) {
      console.log('Setting activeItem to:', submenuItem.action);
      setActiveItem(submenuItem.action);
      // Also navigate to a corresponding URL if needed
      if (submenuItem.action === 'Requisition-List') {
        navigate('/admin/requisitions');
      } else if (submenuItem.action === 'Requisition-Create') {
        navigate('/admin/requisitions/create');
      }
    }
    // Navigate directly to the submenu item's route
    else if (submenuItem.route) {
      console.log('Navigating to submenu route:', submenuItem.route);
      navigate(submenuItem.route);
    }
  };

  // Auto-expand menu if current path matches submenu item on mount/route change
  React.useEffect(() => {
    const matchedItem = menuItems.find(item => isCurrentPathMatch(item));
    if (matchedItem && matchedItem.submenu) {
      setExpandedMenu(matchedItem.text);
    }
  }, [location.pathname]);

  const displayMenuItems = menuItems;

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'close'}`}>
      <a href="/" className="logo">
        <img src="/Logo/logo-favicon.png" alt="Logo" />
        <span>
          <img src="/Logo/logo-1-primary.png" alt="SOKAPP" />
        </span>
      </a>
      
      <div className="side-menu-scrollable">
        <ul className="side-menu-list">
          {displayMenuItems.map((item, index) => (
            <li key={index} className={`${isActive(item) ? 'active' : ''} ${item.submenu ? 'menu-with-submenu' : ''}`}>
              <a href="#" onClick={(e) => handleMenuClick(e, item)}>
                <i className={item.icon}></i>
                {item.text}
                {item.submenu && (
                  <i className={`bx bx-chevron-${expandedMenu === item.text ? 'up' : 'down'} submenu-arrow`}></i>
                )}
              </a>
              {item.submenu && expandedMenu === item.text && (
                <ul className="submenu">
                  {item.submenu.map((sub, subIndex) => (
                    <li key={subIndex} className={location.pathname === sub.route ? 'active' : ''}>
                      <a href="#" onClick={(e) => handleSubmenuClick(e, sub)}>
                        {sub.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="side-menu-bottom">
        <ul>
          <li>
            <a href="#" className="dark-mode-toggle" onClick={(e) => {
              e.preventDefault();
              toggleDarkMode();
            }}>
              <i className='bx bx-moon'></i>dark / light
            </a>
          </li>
          <li>
            <a href="#" className="logout" onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}>
              <i className='bx bx-log-out-circle'></i>Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
