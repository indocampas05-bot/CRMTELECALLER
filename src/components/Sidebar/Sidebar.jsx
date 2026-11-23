// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import logo from "../../assets/icons/logo.png";
import {
  FiGrid,
  FiUserPlus,
  FiPhoneCall,
  FiUsers,
  FiRefreshCw,
  FiFileText,
  FiFile,
  FiBarChart2,
  FiCalendar,
  FiSettings,
  FiUser,
  FiHelpCircle,
  FiLogOut,
  FiMonitor,
  FiCreditCard,
  FiChevronDown,
  FiChevronRight,
  FiBriefcase,
  FiLock,
  FiBell,
  FiInfo,
  FiShield,
  FiMessageSquare,
  FiClipboard,
  FiClock,
} from "react-icons/fi";

// Settings sub-menu items
const settingsSubItems = [
  { icon: <FiBriefcase />, label: "Company Profile", id: "settings-profile" },
  { icon: <FiLock />, label: "Security", id: "settings-security" },
  { icon: <FiBell />, label: "Notifications", id: "settings-notifications" },
  { icon: <FiPhoneCall />, label: "Call Settings", id: "settings-calls" },
  { icon: <FiInfo />, label: "About", id: "settings-about" },
];

const navItems = [
  { icon: <FiGrid />, label: "Dashboard", id: "dashboard" },
  { icon: <FiUserPlus />, label: "Leads", id: "leads" },
  { icon: <FiPhoneCall />, label: "Call Panel", id: "callpanel" },
 // { icon: <FiUsers />, label: "Clients", id: "clients" },
  { icon: <FiRefreshCw />, label: "Follow Ups", id: "followups" },
  { icon: <FiMonitor />, label: "Demo", id: "demo" },
  { icon: <FiFileText />, label: "Quotations", id: "quotations" },
  { icon: <FiFile />, label: "Agreements", id: "agreements" },
  { icon: <FiCreditCard />, label: "Payment", id: "payment" },
  { icon: <FiBarChart2 />, label: "Reports", id: "reports" },
 // { icon: <FiCalendar />, label: "Calendar", id: "calendar" },
  //{ icon: <FiClock />, label: "Attendance", id: "attendance" },
  { icon: <FiClipboard />, label: "Leave & Permissions", id: "leavepermissions" },
  { icon: <FiMessageSquare />, label: "Communications", id: "communications" },
 // { 
   // icon: <FiSettings />, 
  //  label: "Settings", 
  //  id: "settings",
   // isParent: true,
   // subItems: settingsSubItems
 // },
  //{ icon: <FiHelpCircle />, label: "Help & Support", id: "help" },
];

const Sidebar = ({ activePage, onNavigate, collapsed }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  // Find the settings menu item
  const settingsItem = navItems.find(item => item.isParent);

  // Auto-expand settings if a sub-item is active or if we're on the settings page
  useEffect(() => {
    if (settingsItem) {
      const isSubActive = settingsItem.subItems?.some(sub => activePage === sub.id);
      const isSettingsPage = activePage === 'settings';
      
      // If a sub-item is active or we're on the settings page, expand the settings menu
      if (isSubActive || isSettingsPage) {
        setExpandedMenus(prev => ({
          ...prev,
          [settingsItem.id]: true
        }));
      }
    }
  }, [activePage, settingsItem]);

  // Toggle sub-menu expansion
  const toggleSubMenu = (menuId) => {
    if (collapsed) return;
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Check if a sub-item is active
  const isSubItemActive = (subItemId) => {
    return activePage === subItemId;
  };

  // Check if any sub-item of a menu is active
  const isMenuActive = (menu) => {
    if (activePage === menu.id) return true;
    if (menu.subItems) {
      return menu.subItems.some(sub => activePage === sub.id);
    }
    return false;
  };

  // Check if menu has sub-items
  const hasSubItems = (item) => {
    return item.subItems && item.subItems.length > 0;
  };

  // Handle navigation
  const handleNavigate = (id, e) => {
    if (id === "logout") {
      onNavigate(id);
      return;
    }
    onNavigate(id);
  };

  // Handle parent menu click - just toggle, don't navigate
  const handleParentClick = (item) => {
    if (hasSubItems(item)) {
      toggleSubMenu(item.id);
    } else {
      handleNavigate(item.id);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <img
          src={logo}
          alt="INDOCRM Logo"
          className="logo-image"
        />
        {!collapsed && (
          <span className="logo-text">INDOCRM</span>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = isMenuActive(item);
          const isExpanded = expandedMenus[item.id];
          const hasChildren = hasSubItems(item);

          // When collapsed, only show icons
          if (collapsed) {
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigate(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
              </button>
            );
          }

          return (
            <div key={item.id} className="nav-item-wrapper">
              {/* Parent Menu Item */}
              <button
                className={`nav-item ${isActive ? "active" : ""} ${hasChildren ? "has-submenu" : ""}`}
                onClick={() => handleParentClick(item)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {hasChildren && (
                  <span className="nav-chevron">
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                )}
              </button>

              {/* Sub Menu Items */}
              {hasChildren && isExpanded && (
                <div className="sub-menu-container">
                  {item.subItems.map((subItem) => {
                    const isSubActive = isSubItemActive(subItem.id);
                    return (
                      <button
                        key={subItem.id}
                        className={`nav-item sub-nav-item ${isSubActive ? "active" : ""}`}
                        onClick={() => handleNavigate(subItem.id)}
                      >
                        <span className="nav-icon sub-icon">{subItem.icon}</span>
                        <span className="nav-label">{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout button placed at the bottom */}
      <div className="sidebar-footer">
        <button
          className={`nav-item ${activePage === "logout" ? "active" : ""}`}
          onClick={() => onNavigate("logout")}
        >
          <span className="nav-icon"><FiLogOut /></span>
          {!collapsed && (
            <span className="nav-label">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
