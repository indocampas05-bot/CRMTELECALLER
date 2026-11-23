// src/pages/Settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import './Settings.css';
import {
  FiUser,
  FiLock,
  FiBell,
  FiPhone,
  FiFileText,
  FiInfo,
  FiSave,
  FiEdit2,
  FiCheck,
  FiX,
  FiBriefcase,
  FiUsers,
  FiShield,
  FiSliders,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiArrowLeft,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Settings = ({ activeTab: propActiveTab, onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(propActiveTab || 'profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update active tab when prop changes (from sidebar navigation)
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  // --- Company Profile ---
  const [companyProfile, setCompanyProfile] = useState({
    name: 'Indocampas Tech Private Limited',
    email: 'indocampaspvt@gmail.com',
    phone: '+91 98765 43210',
    address: 'Chennai, Tamil Nadu, India',
    website: 'www.indocampas.com',
    gst: '33AABCU1234D1Z1',
    pan: 'AABCU1234D',
  });

  // --- Security ---
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    loginAttempts: 5,
    ipWhitelisting: false,
  });

  // --- Notifications ---
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leadAssigned: true,
    followUpReminders: true,
    paymentReceived: true,
    quotationApproved: true,
    agreementSigned: true,
    systemUpdates: false,
  });

  // --- Call Settings ---
  const [callSettings, setCallSettings] = useState({
    autoDial: true,
    callRecording: true,
    maxCallDuration: 300,
    callTimeout: 60,
    disableCallerId: false,
    defaultCallerId: '+91 98765 43210',
  });

  // --- API Integration ---
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (section) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSwitch = (setting, value, setter) => {
    setter(prev => ({ ...prev, [setting]: !value }));
  };

  const updateField = (setter, field, value) => {
    setter(prev => ({ ...prev, [field]: value }));
  };

  // Tab configuration - these match sidebar sub-menu IDs
  const tabItems = [
    { id: 'profile', label: 'Company Profile', icon: FiBriefcase },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'calls', label: 'Call Settings', icon: FiPhone },
    { id: 'about', label: 'About', icon: FiInfo },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigate) {
      onNavigate(`settings-${tabId}`);
    }
  };

  // Go back to main settings page
  const handleBackToSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Get current tab label
  const currentTabLabel = tabItems.find(tab => tab.id === activeTab)?.label || 'Settings';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderCompanyProfile();
      case 'security':
        return renderSecurity();
      case 'notifications':
        return renderNotifications();
      case 'calls':
        return renderCallSettings();
      case 'about':
        return renderAbout();
      default:
        return renderCompanyProfile();
    }
  };

  // --- Company Profile Render ---
  const renderCompanyProfile = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Company Profile</h3>
        <p className="section-desc">Manage your company information and branding</p>
      </div>
      <div className="settings-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={companyProfile.name}
              onChange={(e) => updateField(setCompanyProfile, 'name', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={companyProfile.email}
              onChange={(e) => updateField(setCompanyProfile, 'email', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={companyProfile.phone}
              onChange={(e) => updateField(setCompanyProfile, 'phone', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              value={companyProfile.website}
              onChange={(e) => updateField(setCompanyProfile, 'website', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label>Address</label>
            <textarea
              value={companyProfile.address}
              onChange={(e) => updateField(setCompanyProfile, 'address', e.target.value)}
              className="form-input"
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input
              type="text"
              value={companyProfile.gst}
              onChange={(e) => updateField(setCompanyProfile, 'gst', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>PAN Number</label>
            <input
              type="text"
              value={companyProfile.pan}
              onChange={(e) => updateField(setCompanyProfile, 'pan', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
        <button
          className="btn-primary settings-save-btn"
          onClick={() => handleSave('profile')}
          disabled={saving}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Company Profile'}
        </button>
      </div>
    </div>
  );

  // --- Security Render ---
  const renderSecurity = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Security Settings</h3>
        <p className="section-desc">Configure security policies and authentication</p>
      </div>
      <div className="settings-form">
        <div className="security-grid">
          <div className="security-item">
            <div className="security-item-left">
              <div className="security-icon-wrapper">
                <FiShield />
              </div>
              <div>
                <div className="security-label">Two-Factor Authentication</div>
                <div className="security-desc">Require 2FA for all admin users</div>
              </div>
            </div>
            <button
              className={`toggle-btn ${securitySettings.twoFactorAuth ? 'active' : ''}`}
              onClick={() => toggleSwitch('twoFactorAuth', securitySettings.twoFactorAuth, setSecuritySettings)}
            >
              {securitySettings.twoFactorAuth ? <FiCheck /> : <FiX />}
              {securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="security-item">
            <div className="security-item-left">
              <div className="security-icon-wrapper">
                <FiLock />
              </div>
              <div>
                <div className="security-label">Session Timeout</div>
                <div className="security-desc">Auto logout after inactivity</div>
              </div>
            </div>
            <div className="security-input-group">
              <input
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => updateField(setSecuritySettings, 'sessionTimeout', parseInt(e.target.value))}
                className="form-input"
                style={{ width: '80px' }}
              />
              <span className="input-suffix">minutes</span>
            </div>
          </div>

          <div className="security-item">
            <div className="security-item-left">
              <div className="security-icon-wrapper">
                <FiSliders />
              </div>
              <div>
                <div className="security-label">Password Policy</div>
                <div className="security-desc">Minimum password strength requirements</div>
              </div>
            </div>
            <select
              value={securitySettings.passwordPolicy}
              onChange={(e) => updateField(setSecuritySettings, 'passwordPolicy', e.target.value)}
              className="form-input"
              style={{ width: '160px' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="security-item">
            <div className="security-item-left">
              <div className="security-icon-wrapper">
                <FiRefreshCw />
              </div>
              <div>
                <div className="security-label">Login Attempts</div>
                <div className="security-desc">Max failed attempts before lockout</div>
              </div>
            </div>
            <div className="security-input-group">
              <input
                type="number"
                value={securitySettings.loginAttempts}
                onChange={(e) => updateField(setSecuritySettings, 'loginAttempts', parseInt(e.target.value))}
                className="form-input"
                style={{ width: '80px' }}
              />
              <span className="input-suffix">attempts</span>
            </div>
          </div>
        </div>
        <button
          className="btn-primary settings-save-btn"
          onClick={() => handleSave('security')}
          disabled={saving}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );

  // --- Notifications Render ---
  const renderNotifications = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Notification Settings</h3>
        <p className="section-desc">Configure what notifications you receive and how</p>
      </div>
      <div className="settings-form">
        <div className="notification-grid">
          <div className="notification-group">
            <h4 className="notification-group-title">Channels</h4>
            <div className="notification-item">
              <span>Email Notifications</span>
              <button
                className={`toggle-small ${notificationSettings.emailNotifications ? 'active' : ''}`}
                onClick={() => toggleSwitch('emailNotifications', notificationSettings.emailNotifications, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <div className="notification-item">
              <span>Push Notifications</span>
              <button
                className={`toggle-small ${notificationSettings.pushNotifications ? 'active' : ''}`}
                onClick={() => toggleSwitch('pushNotifications', notificationSettings.pushNotifications, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
          </div>

          <div className="notification-group">
            <h4 className="notification-group-title">Events</h4>
            <div className="notification-item">
              <span>Lead Assigned</span>
              <button
                className={`toggle-small ${notificationSettings.leadAssigned ? 'active' : ''}`}
                onClick={() => toggleSwitch('leadAssigned', notificationSettings.leadAssigned, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <div className="notification-item">
              <span>Follow-up Reminders</span>
              <button
                className={`toggle-small ${notificationSettings.followUpReminders ? 'active' : ''}`}
                onClick={() => toggleSwitch('followUpReminders', notificationSettings.followUpReminders, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <div className="notification-item">
              <span>Payment Received</span>
              <button
                className={`toggle-small ${notificationSettings.paymentReceived ? 'active' : ''}`}
                onClick={() => toggleSwitch('paymentReceived', notificationSettings.paymentReceived, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <div className="notification-item">
              <span>Quotation Approved</span>
              <button
                className={`toggle-small ${notificationSettings.quotationApproved ? 'active' : ''}`}
                onClick={() => toggleSwitch('quotationApproved', notificationSettings.quotationApproved, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <div className="notification-item">
              <span>Agreement Signed</span>
              <button
                className={`toggle-small ${notificationSettings.agreementSigned ? 'active' : ''}`}
                onClick={() => toggleSwitch('agreementSigned', notificationSettings.agreementSigned, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <div className="notification-item">
              <span>System Updates</span>
              <button
                className={`toggle-small ${notificationSettings.systemUpdates ? 'active' : ''}`}
                onClick={() => toggleSwitch('systemUpdates', notificationSettings.systemUpdates, setNotificationSettings)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
          </div>
        </div>
        <button
          className="btn-primary settings-save-btn"
          onClick={() => handleSave('notifications')}
          disabled={saving}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );

  // --- Call Settings Render ---
  const renderCallSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Call Settings</h3>
        <p className="section-desc">Configure call handling and telephony preferences</p>
      </div>
      <div className="settings-form">
        <div className="call-grid">
          <div className="call-item">
            <span>Auto Dial</span>
            <button
              className={`toggle-small ${callSettings.autoDial ? 'active' : ''}`}
              onClick={() => toggleSwitch('autoDial', callSettings.autoDial, setCallSettings)}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>
          <div className="call-item">
            <span>Call Recording</span>
            <button
              className={`toggle-small ${callSettings.callRecording ? 'active' : ''}`}
              onClick={() => toggleSwitch('callRecording', callSettings.callRecording, setCallSettings)}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>
          <div className="call-item">
            <span>Disable Caller ID</span>
            <button
              className={`toggle-small ${callSettings.disableCallerId ? 'active' : ''}`}
              onClick={() => toggleSwitch('disableCallerId', callSettings.disableCallerId, setCallSettings)}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>
          <div className="call-item">
            <label>Max Call Duration</label>
            <div className="call-input-group">
              <input
                type="number"
                value={callSettings.maxCallDuration}
                onChange={(e) => updateField(setCallSettings, 'maxCallDuration', parseInt(e.target.value))}
                className="form-input"
                style={{ width: '100px' }}
              />
              <span className="input-suffix">seconds</span>
            </div>
          </div>
          <div className="call-item">
            <label>Call Timeout</label>
            <div className="call-input-group">
              <input
                type="number"
                value={callSettings.callTimeout}
                onChange={(e) => updateField(setCallSettings, 'callTimeout', parseInt(e.target.value))}
                className="form-input"
                style={{ width: '100px' }}
              />
              <span className="input-suffix">seconds</span>
            </div>
          </div>
          <div className="call-item">
            <label>Default Caller ID</label>
            <input
              type="text"
              value={callSettings.defaultCallerId}
              onChange={(e) => updateField(setCallSettings, 'defaultCallerId', e.target.value)}
              className="form-input"
              style={{ width: '200px' }}
            />
          </div>
        </div>
        <button
          className="btn-primary settings-save-btn"
          onClick={() => handleSave('calls')}
          disabled={saving}
        >
          <FiSave /> {saving ? 'Saving...' : 'Save Call Settings'}
        </button>
      </div>
    </div>
  );

  // --- About Render ---
  const renderAbout = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>About IndoCRM</h3>
        <p className="section-desc">Software information and legal details</p>
      </div>
      <div className="about-grid">
        <div className="about-card">
          <div className="about-card-icon">🏢</div>
          <div className="about-card-content">
            <h4>Software Version</h4>
            <p className="version-text">v2.0.0</p>
            <p className="version-date">Released: July 2026</p>
          </div>
        </div>

        <div className="about-card">
          <div className="about-card-icon">📄</div>
          <div className="about-card-content">
            <h4>Terms & Conditions</h4>
            <p className="about-text">
              By using this CRM Software, you confirm acceptance of these Terms and Conditions. 
              All business data entered remains the property of the Client.
            </p>
            <button className="btn-outline btn-sm">View Full Terms</button>
          </div>
        </div>

        <div className="about-card">
          <div className="about-card-icon">🔒</div>
          <div className="about-card-content">
            <h4>Data Security</h4>
            <p className="about-text">
              Reasonable security measures are implemented; however, no internet-based system is completely secure.
            </p>
          </div>
        </div>

        <div className="about-card">
          <div className="about-card-icon">📧</div>
          <div className="about-card-content">
            <h4>Contact Support</h4>
            <p className="about-text">
              For any queries or support, please reach out to us at:
            </p>
            <a href="mailto:indocampuspvt@gmail.com" className="support-email">
              indocampuspvt@gmail.com
            </a>
          </div>
        </div>
      </div>
      <div className="about-footer">
        <p>© 2024 Indocampus Tech Private Limited. All rights reserved.</p>
        <p>Governing Law: Laws of India. Disputes subject to competent courts at Chennai, Tamil Nadu.</p>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-header-left">
          {/* Back button when in sub-tab */}
          {propActiveTab && (
            <button 
              className="btn-back-settings" 
              onClick={handleBackToSettings}
            >
              <FiArrowLeft /> Back
            </button>
          )}
          <div className="settings-title-group">
            <h1 className="page-title">Settings</h1>
            {propActiveTab && (
              <span className="settings-breadcrumb">/ {currentTabLabel}</span>
            )}
          </div>
          <p className="page-subtitle">
            {propActiveTab 
              ? `Configure ${currentTabLabel.toLowerCase()} preferences`
              : 'Configure your CRM application preferences'}
          </p>
        </div>
        {saveSuccess && (
          <div className="save-success-banner">
            <FiCheck /> Settings saved successfully!
          </div>
        )}
      </div>

      {/* Single Column Content - No Left Tabs */}
      <div className="settings-content-wrapper">
        {loading ? (
          <div className="settings-loading">Loading settings...</div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default Settings;