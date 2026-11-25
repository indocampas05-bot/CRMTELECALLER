// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Leads from './pages/Leads/Leads';
import Reports from './pages/Reports/Reports';
import Followups from './pages/Followups/Followups';
import Quotations from './pages/Quotations/Quotations';
import Agreements from './pages/Agreements/Agreements';
import Settings from './pages/Settings/Settings';
import CallPanel from './pages/CallPanel/CallPanel';
import Calendar from './pages/Calendar/Calendar';
import Users from './pages/Users/Users';
import Help from './pages/Help/Help';
import Demo from './pages/Demo/Demo';
import Communications from './pages/Communications/Communications';
import Payment from './pages/Payment/Payment';
import Categories from './pages/Categories/Categories';
import LeavePermissions from './pages/LeavePermissions/LeavePermissions';
import Login from './pages/Login/Login';
import './layouts/MainLayout.css';

// Main App Content with Auth
const AppContent = () => {
  const { isAuthenticated, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [navigationState, setNavigationState] = useState(null);

  const handleNavigate = (page, options = {}) => {
    if (page === "logout") {
      logout();
      setActivePage("dashboard");
      return;
    }
    if (options.state) {
      setNavigationState(options.state);
    } else {
      setNavigationState(null);
    }
    setActivePage(page);
  };

  const renderPage = () => {
    const pageMap = {
      dashboard: <Dashboard />,
      leads: <Leads onNavigate={handleNavigate} />,
      callpanel: <CallPanel onNavigate={handleNavigate} navigationState={navigationState} />,
      followups: <Followups onNavigate={handleNavigate} />,
      quotations: <Quotations />,
      agreements: <Agreements />,
      reports: <Reports />,
      calendar: <Calendar />,
      communications: <Communications />,
      leavepermissions: <LeavePermissions />,
      settings: <Settings onNavigate={handleNavigate} />,
      'settings-profile': <Settings onNavigate={handleNavigate} activeTab="profile" />,
      'settings-security': <Settings onNavigate={handleNavigate} activeTab="security" />,
      'settings-notifications': <Settings onNavigate={handleNavigate} activeTab="notifications" />,
      'settings-calls': <Settings onNavigate={handleNavigate} activeTab="calls" />,
      'settings-about': <Settings onNavigate={handleNavigate} activeTab="about" />,
      users: <Users />,
      help: <Help />,
      demo: <Demo onNavigate={handleNavigate} />,
      payment: <Payment />,
      categories: <Categories />,
    };
    return pageMap[activePage] || <Dashboard />;
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <MainLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
};

// Root App
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            <Route path="/login" element={<Login onLogin={() => {}} />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;