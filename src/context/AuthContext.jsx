// CRM-APP (TELECALLERS)/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
// ✅ Change this import
import { authService } from '../services/authService';
import attendanceService from '../services/attendanceService';  // ← Changed from leadService

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        authService.validateToken()
          .then(() => {
            setUser(userData);
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const sendHeartbeat = async () => {
      try {
        const result = await attendanceService.heartbeat();
        if (alive) window.dispatchEvent(new CustomEvent('attendance:update', { detail: result }));
      } catch (_) {}
    };
    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 20000);
    const handleOnline = async () => {
      try {
        const result = await attendanceService.reconnect(`${navigator.userAgent}`);
        if (alive) window.dispatchEvent(new CustomEvent('attendance:update', { detail: result }));
      } catch (_) {}
    };
    const handleOffline = () => window.dispatchEvent(new CustomEvent('attendance:offline'));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [user]);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        username: response.username,
        fullName: response.fullName,
        role: response.role,
        districts: response.districts || []
      }));
      setUser({
        username: response.username,
        fullName: response.fullName,
        role: response.role,
        districts: response.districts || []
      });
      try { const attendance = await attendanceService.today(); window.dispatchEvent(new CustomEvent('attendance:update', { detail: attendance })); } catch (_) {}
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try { await attendanceService.logout(); } catch (_) {}
    try {
      await authService.logout();
    } catch (e) {
      // Ignore errors during logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
