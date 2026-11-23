import React, { useCallback, useEffect, useState } from 'react';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiMenu,
  FiShield,
  FiX
} from 'react-icons/fi';
import './Navbar.css';
import notificationService from '../../services/notificationService';

const Navbar = ({ toggleSidebar }) => {
  const [user, setUser] = useState({
    fullName: '',
    username: '',
    role: ''
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadUser = useCallback(() => {
    try {
      const raw =
        localStorage.getItem('user') ||
        localStorage.getItem('currentUser') ||
        localStorage.getItem('authUser');

      if (raw) {
        const u = JSON.parse(raw);

        setUser({
          fullName: u.fullName || u.name || u.username || '',
          username: u.username || '',
          role: u.role || ''
        });
      } else {
        setUser({
          fullName:
            localStorage.getItem('fullName') ||
            localStorage.getItem('name') ||
            localStorage.getItem('username') ||
            '',
          username: localStorage.getItem('username') || '',
          role: localStorage.getItem('role') || ''
        });
      }
    } catch (e) {
      console.error('Unable to load logged-in user', e);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    const refresh = () => {
      loadUser();
      loadNotifications();
    };

    window.addEventListener('auth-changed', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [loadUser, loadNotifications]);

  const initials = (user.fullName || user.username || 'User')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(x => x[0])
    .join('')
    .toUpperCase();

  const roleLabel = (user.role || '')
    .replace('ROLE_', '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, x => x.toUpperCase());

  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (n) => {
    if (n.read) return;

    try {
      await notificationService.markAsRead(n.id);

      setNotifications(prev =>
        prev.map(x =>
          x.id === n.id
            ? { ...x, read: true }
            : x
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications(prev =>
        prev.map(x => ({
          ...x,
          read: true
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="navbar">

      <button
        className="menu-btn"
        onClick={toggleSidebar}
      >
        <FiMenu />
      </button>

      <div className="navbar-right">

        {/* Notification */}
        <div className="notification-wrapper">

          <button
            className="nav-btn notification-btn"
            onClick={() =>
              setShowNotifications(prev => !prev)
            }
            aria-label="Notifications"
          >
            <FiBell />

            {unread > 0 && (
              <span className="notification-badge">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">

              {/* Header */}
              <div className="notification-header">

                <div className="notification-title">
                  <h3>Notifications</h3>
                  <span>{unread} unread</span>
                </div>

                <div className="notification-actions">

                  {unread > 0 && (
                    <button
                      className="mark-all-btn"
                      onClick={markAll}
                    >
                      <FiCheck />
                      Mark all read
                    </button>
                  )}

                  {/* X / Close */}
                  <button
                    className="notification-close-btn"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                    title="Close"
                  >
                    <FiX />
                  </button>

                </div>
              </div>

              {/* Notification List */}
              <div className="notification-list">

                {notifications.length === 0 ? (

                  <div className="notification-empty">
                    <FiCheckCircle />
                    <span>No notifications</span>
                  </div>

                ) : (

                  notifications.map(n => (

                    <button
                      key={n.id}
                      className={`notification-item ${
                        n.read ? 'read' : 'unread'
                      }`}
                      onClick={() => markRead(n)}
                    >

                      <div className="notification-icon">
                        <FiBell />
                      </div>

                      <div className="notification-content">

                        <strong>{n.title}</strong>

                        <p>{n.message}</p>

                        <small>
                          {n.createdAt
                            ? new Date(
                                n.createdAt
                              ).toLocaleString()
                            : ''}
                        </small>

                      </div>

                      {!n.read && (
                        <span className="unread-dot" />
                      )}

                    </button>

                  ))

                )}

              </div>
            </div>
          )}

        </div>

       

        {/* User */}
        <div className="user-avatar">

          <div className="avatar-circle">
            {initials}
          </div>

          <div className="user-info">

            <span className="user-name">
              {user.fullName || user.username || 'User'}
            </span>

            <span className="user-role">
              {roleLabel}
            </span>

          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;