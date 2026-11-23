// src/pages/CallPanel/CallPanel.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CallPanel.css';
import {
  Search,
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Send,
  FileText,
  FileSignature,
  Calendar,
  Bell,
  Copy,
  RefreshCw,
  MoreVertical,
  Settings2,
  Clock,
  User,
  Users,
  Mail,
  MapPin,
  Smartphone,
  Loader,
  RotateCcw,
  CheckCircle2,
  Info,
  AlertCircle,
  Volume2,
  ClipboardList,
  History,
  ArrowRightLeft,
  Bluetooth,
  BluetoothConnected,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone as SmartphoneIcon,
  X,
  Radio,
  Activity,
  PhoneForwarded,
  PhoneIncoming,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { leadService } from '../../services/leadService';
import { callService } from '../../services/callService';
import { useAuth } from '../../context/AuthContext';
import { telecallerService } from '../../services/telecallerService';

// Status colors
const STATUS_COLORS = {
  'New': { bg: '#e0f2fe', color: '#0369a1' },
  'In Progress': { bg: '#fef9c3', color: '#92400e' },
  'Interested': { bg: '#dcfce7', color: '#15803d' },
  'Not Interested': { bg: '#fee2e2', color: '#b91c1c' },
  'Call Back': { bg: '#fef3c7', color: '#b45309' },
  'Converted': { bg: '#d1fae5', color: '#065f46' },
  'Demo Scheduled': { bg: '#e0e7ff', color: '#4338ca' },
  'Not Existing': { bg: '#f3f4f6', color: '#6b7280' },
  'No Response': { bg: '#f3f4f6', color: '#6b7280' },
  'Contacted': { bg: '#fef9c3', color: '#92400e' },
  'Follow-up': { bg: '#fef3c7', color: '#b45309' },
};

const AGENT_STATUSES = {
  'Available': { label: 'Available', bg: '#dcfce7', canCall: true },
  'Busy': { label: 'Busy', bg: '#fef9c3', canCall: false },
  'Away': { label: 'Away', bg: '#ffedd5', canCall: false },
  'Break': { label: 'Break', bg: '#ede9fe', canCall: false },
  'Lunch': { label: 'Lunch', bg: '#fce7f3', canCall: false },
  'Offline': { label: 'Offline', bg: '#fee2e2', canCall: false },
};

const AVATAR_COLORS = ['#7b1113','#2563eb','#7c3aed','#d97706','#16a34a','#0891b2','#db2777','#ea580c'];
const avatarColor = n => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const fmtTime = s => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return h>0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`cp-toast cp-toast-${type}`} onClick={onClose}>{msg}</div>
);

const Avatar = ({ initials, name, size=44 }) => (
  <div className="cp-avatar" style={{ width:size, height:size, background:avatarColor(name), fontSize:size*0.36 }}>
    {initials}
  </div>
);

const IdleCountdown = ({ seconds, total, onCancel }) => {
  const pct = ((total - seconds) / total) * 100;
  return (
    <div className="idle-countdown">
      <div className="idle-top">
        <span className="idle-label">⏳ Auto-connecting next call in</span>
        <button className="idle-cancel" onClick={onCancel}>Cancel</button>
      </div>
      <div className="idle-secs">{seconds}s</div>
      <div className="idle-bar-bg"><div className="idle-bar-fill" style={{ width:`${pct}%` }}></div></div>
    </div>
  );
};

const FollowUpBanner = ({ notes }) => (
  <div className="followup-banner">
    <div className="fu-banner-header">📋 Previous Call Notes — Follow-Up Lead</div>
    <p className="fu-banner-text">{notes}</p>
  </div>
);

// ─── Agent Status Selector ────────────────────────────────────────────────────
const AgentStatusSelector = ({ status, onChange, isCallActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentStatus = AGENT_STATUSES[status] || AGENT_STATUSES['Available'];
  const canCall = currentStatus.canCall;

  const handleStatusChange = (newStatus) => {
    const newStatusObj = AGENT_STATUSES[newStatus];
    if (!newStatusObj.canCall && isCallActive) {
      if (!window.confirm('You have an active call. Changing to this status will not end the current call, but you won\'t be able to make new calls. Continue?')) {
        return;
      }
    }
    onChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div className="agent-status-selector" ref={dropdownRef}>
      <button 
        className="agent-status-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: currentStatus.bg }}
      >
        <span className="status-label">{currentStatus.label}</span>
        <span className="status-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="agent-status-dropdown">
          {Object.entries(AGENT_STATUSES).map(([key, value]) => (
            <button
              key={key}
              className={`status-option ${status === key ? 'active' : ''} ${!value.canCall ? 'no-call' : ''}`}
              onClick={() => handleStatusChange(key)}
              style={{ 
                background: status === key ? value.bg : 'transparent',
                borderLeft: status === key ? '3px solid #7b1113' : '3px solid transparent'
              }}
              disabled={isCallActive && !value.canCall}
            >
              <span className="status-option-label">
                {value.label}
                {!value.canCall && <span className="status-block-badge">🚫 No Calls</span>}
              </span>
              {status === key && <span className="status-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Add Contact Number Modal ──────────────────────────────────────────────
const AddContactModal = ({ onClose, onSave, leadName }) => {
  const [number, setNumber] = useState('');
  const [label, setLabel] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-add-contact-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">➕ Add Additional Contact</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-lead-name">Organization: <strong>{leadName}</strong></div>
          <div className="form-group">
            <label>Contact Number *</label>
            <input 
              type="text" 
              value={number} 
              onChange={e=>setNumber(e.target.value)} 
              placeholder="Enter phone number with country code"
            />
          </div>
          <div className="form-group">
            <label>Label (Optional)</label>
            <input 
              type="text" 
              value={label} 
              onChange={e=>setLabel(e.target.value)} 
              placeholder="e.g., Office, Reception, HR"
            />
          </div>
          <div className="form-group">
            <label>Contact Person (Optional)</label>
            <input 
              type="text" 
              value={contactPerson} 
              onChange={e=>setContactPerson(e.target.value)} 
              placeholder="Name of the contact person"
            />
          </div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={() => {
                if (!number.trim()) {
                  alert('Please enter a contact number.');
                  return;
                }
                onSave({ number: number.trim(), label: label.trim(), contactPerson: contactPerson.trim() });
                onClose();
              }}
            >
              Add Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Contact Numbers Display Component ──────────────────────────────────────
const ContactNumbersDisplay = ({ lead, onCallNumber, onAddContact, onRemoveContact, canCall }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Build contacts list from all available numbers
  const contacts = [
    { number: lead?.mobile, label: 'Primary', person: lead?.contactPerson, type: 'primary' },
    { number: lead?.mobile2, label: 'Secondary', person: lead?.contactPerson2, type: 'secondary' },
    { number: lead?.mobile3, label: 'Tertiary', person: lead?.contactPerson3, type: 'tertiary' },
    ...(lead?.additionalMobiles || []).map((item, index) => ({
      number: typeof item === 'string' ? item : item.number,
      label: typeof item === 'string' ? `Additional ${index + 1}` : (item.label || `Additional ${index + 1}`),
      person: typeof item === 'string' ? '' : (item.contactPerson || ''),
      type: 'additional',
      id: typeof item === 'string' ? index : (item.id || index),
    })),
  ].filter(c => c.number && c.number.trim() !== '');

  const additionalCount = (lead?.additionalMobiles || []).length;
  const visibleContacts = expanded ? contacts : contacts.slice(0, 2);

  const handleAddContact = (data) => {
    const newContact = {
      number: data.number,
      label: data.label || `Additional ${additionalCount + 1}`,
      contactPerson: data.contactPerson || '',
      id: Date.now(),
    };
    onAddContact(newContact);
  };

  const handleRemoveContact = (contactId) => {
    if (window.confirm('Remove this additional contact number?')) {
      onRemoveContact(contactId);
    }
  };

  return (
    <div className="contact-numbers-display">
      <div className="contact-numbers-header">
        <span className="contact-label">📞 Contact Numbers</span>
        <div className="contact-header-actions">
          {canCall && (
            <button className="add-contact-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              Add
            </button>
          )}
          {contacts.length > 2 && (
            <button className="toggle-contacts-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show Less' : `Show ${contacts.length - 2} More`}
            </button>
          )}
        </div>
      </div>
      <div className="contact-numbers-list">
        {visibleContacts.map((contact, index) => (
          <div key={index} className={`contact-number-item ${contact.type === 'additional' ? 'additional-contact' : ''}`}>
            <span className="contact-badge" style={{ 
              background: contact.type === 'primary' ? '#7b1113' : 
                          contact.type === 'secondary' ? '#2563eb' :
                          contact.type === 'tertiary' ? '#d97706' : '#7c3aed',
              color: 'white'
            }}>
              {contact.label}
            </span>
            <span className="contact-number">{contact.number}</span>
            {contact.person && <span className="contact-person">({contact.person})</span>}
            <div className="contact-actions">
              <button 
                className="contact-call-btn"
                onClick={() => onCallNumber(contact.number)}
                title={`Call ${contact.label} number`}
                disabled={!canCall}
              >
                <PhoneCall size={14} />
              </button>
              {contact.type === 'additional' && (
                <button 
                  className="contact-remove-btn"
                  onClick={() => handleRemoveContact(contact.id)}
                  title="Remove this contact"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="no-contacts-message">
            <span>No contact numbers available</span>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddContactModal 
          onClose={() => setShowAddModal(false)}
          onSave={handleAddContact}
          leadName={lead?.name}
        />
      )}
    </div>
  );
};

// ─── Status Warning Banner ────────────────────────────────────────────────────
const StatusWarningBanner = ({ status }) => {
  const statusObj = AGENT_STATUSES[status];
  if (statusObj?.canCall) return null;
  
  return (
    <div className="status-warning-banner">
      <AlertTriangle size={18} />
      <span>
        You are currently <strong>{statusObj?.label || status}</strong>. 
        Please change your status to <strong>Available</strong> to make or receive calls.
      </span>
    </div>
  );
};

// ─── Dialpad Modal ────────────────────────────────────────────────────────────
const DialpadModal = ({ onClose, onDial }) => {
  const [num, setNum] = useState('');
  const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-dialpad-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Dialpad</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="dp-display">{num||<span style={{color:'#aaa'}}>Enter number</span>}</div>
        <div className="dp-grid">
          {keys.map(k=><button key={k} className="dp-key" onClick={()=>setNum(n=>n+k)}>{k}</button>)}
        </div>
        <div className="dp-actions">
          <button className="dp-backspace" onClick={()=>setNum(n=>n.slice(0,-1))}>⌫</button>
          <button className="dp-call-btn" onClick={()=>{if(num){onDial(num);onClose();}}}>📞 Call</button>
        </div>
      </div>
    </div>
  );
};

const ScheduleModal = ({ onClose, onSave, leadName }) => {
  const [date,setDate]=useState('');
  const [time,setTime]=useState('');
  const [note,setNote]=useState('');
  const [type,setType]=useState('Call Back');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-schedule-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📅 Schedule Follow Up</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-lead-name">Organization: <strong>{leadName}</strong></div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e=>setType(e.target.value)}>
              {['Call Back','Follow-Up Call','Demo','Meeting','Send Quotation','Other'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div className="form-group"><label>Time</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Note</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Describe the follow-up…" /></div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={()=>{if(!date||!time){alert('Please pick date and time.');return;}onSave({type,date,time,note});onClose();}}>Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReminderModal = ({ onClose, onSave }) => {
  const [mins,setMins]=useState('15');
  const [msg,setMsg]=useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-schedule-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🔔 Add Reminder</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Remind me in</label>
            <select value={mins} onChange={e=>setMins(e.target.value)}>
              {['5','10','15','30','60','120'].map(m=><option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
          <div className="form-group"><label>Message</label><textarea rows={2} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Reminder message…" /></div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={()=>{onSave({mins,msg});onClose();}}>Set Reminder</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SendDocModal = ({ type, lead, onClose, onSent }) => {
  const [to,setTo]=useState(lead?.email||'');
  const [subject,setSubject]=useState(
    type==='Quotation'?`Quotation for ${lead?.name}`:
    type==='Agreement'?`Agreement - ${lead?.name}`:`Following up - ${lead?.name}`
  );
  const [body,setBody]=useState(
    type==='Quotation'?`Dear ${lead?.contactPerson || lead?.name},\n\nPlease find attached the quotation for ${lead?.name}.\n\nBest regards,\nArun Kumar`:
    type==='Agreement'?`Dear ${lead?.contactPerson || lead?.name},\n\nKindly review and sign the attached agreement for ${lead?.name}.\n\nBest regards,\nArun Kumar`:
    `Dear ${lead?.contactPerson || lead?.name},\n\nThank you for your time. I'm following up on our discussion regarding ${lead?.name}.\n\nBest regards,\nArun Kumar`
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-send-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {type==='Quotation'?'📄 Send Quotation':type==='Agreement'?'📝 Send Agreement':'✉ Send Email'}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label>To</label><input value={to} onChange={e=>setTo(e.target.value)} /></div>
          <div className="form-group"><label>Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} /></div>
          <div className="form-group"><label>Message</label><textarea rows={6} value={body} onChange={e=>setBody(e.target.value)} /></div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={()=>{onSent({type,to,subject,body});onClose();}}>
              {type==='Quotation'?'Send Quotation':type==='Agreement'?'Send Agreement':'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Bluetooth Scanner Popup ──────────────────────────────────────────────────
// ─── Bluetooth Scanner Popup ──────────────────────────────────────────────────
const BluetoothScannerPopup = ({ 
  isOpen, 
  onClose, 
  onDeviceSelect,
  isScanning,
  devices,
  onRefresh,
  scanError,
  onManualAdd
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bt-scanner-content" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <Bluetooth size={20} />
            Bluetooth Devices
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="bt-scanner-status">
            {isScanning ? (
              <>
                <Activity size={16} className="spinning" />
                <span>Scanning for devices...</span>
              </>
            ) : (
              <>
                <Radio size={16} />
                <span>{devices.length} device{devices.length !== 1 ? 's' : ''} found</span>
              </>
            )}
          </div>

          {scanError && (
            <div className="bt-scan-error">
              <AlertCircle size={16} />
              <span>{scanError}</span>
            </div>
          )}

          <div className="bt-scanner-list">
            {devices.length === 0 && !isScanning && (
              <div className="bt-scanner-empty">
                <div className="bt-empty-icon">📡</div>
                <div className="bt-empty-text">No devices found</div>
                <div className="bt-empty-sub">Make sure your device is in pairing mode</div>
                <button 
                  className="bt-retry-btn"
                  onClick={onRefresh}
                >
                  🔄 Scan Again
                </button>
              </div>
            )}
            
            {devices.map((device, index) => (
              <div key={index} className="bt-scanner-item" onClick={() => onDeviceSelect(device)}>
                <div className="bt-device-icon">
                  <Smartphone size={20} />
                </div>
                <div className="bt-device-details">
                  <div className="bt-device-name">
                    {device.name || 'Unknown Device'}
                    {device.isPaired && <span className="bt-paired-badge">✓ Paired</span>}
                  </div>
                  <div className="bt-device-address">{device.address || 'XX:XX:XX:XX:XX:XX'}</div>
                </div>
                <button className="bt-device-pair-btn">
                  {device.isPaired ? 'Connect' : 'Pair'}
                </button>
              </div>
            ))}
            
            {isScanning && (
              <div className="bt-scanning-indicator">
                <div className="bt-scanning-dots">
                  <span></span><span></span><span></span>
                </div>
                <span>Searching...</span>
              </div>
            )}
          </div>

          {/* Manual Device Entry */}
          <div className="bt-manual-entry">
            <div className="bt-manual-divider">
              <span>Or enter manually</span>
            </div>
            <div className="bt-manual-form">
              <input 
                type="text" 
                placeholder="Enter device name (e.g., iPhone 15)"
                className="bt-manual-input"
                id="manualDeviceName"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = e.target.value.trim();
                    if (name) {
                      onManualAdd(name);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <button 
                className="bt-manual-add-btn"
                onClick={() => {
                  const input = document.getElementById('manualDeviceName');
                  const name = input?.value?.trim();
                  if (name) {
                    onManualAdd(name);
                    input.value = '';
                  }
                }}
              >
                <Plus size={16} />
                Add Device
              </button>
            </div>
            <div className="bt-manual-hint">
              <small>💡 Enter your phone's name (e.g., "iPhone 15" or "Samsung Galaxy")</small>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-outline" onClick={onRefresh} disabled={isScanning}>
            <RefreshCw size={16} className={isScanning ? 'spinning' : ''} />
            {isScanning ? 'Scanning...' : 'Refresh'}
          </button>
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bluetooth Status Popup ────────────────────────────────────────────────────
const BluetoothStatusPopup = ({ isConnected, deviceName, onClose }) => {
  return (
    <div className="bt-status-popup">
      <div className="bt-status-popup-content">
        <div className="bt-status-popup-header">
          <span className="bt-popup-icon">
            {isConnected ? <BluetoothConnected size={24} /> : <Bluetooth size={24} />}
          </span>
          <span className="bt-popup-title">
            {isConnected ? 'Bluetooth Connected' : 'Bluetooth Disconnected'}
          </span>
          <button className="bt-popup-close" onClick={onClose}>×</button>
        </div>
        <div className="bt-status-popup-body">
          <div className="bt-popup-device">
            <span className="bt-popup-label">Device:</span>
            <span className="bt-popup-value">
              {isConnected ? (deviceName || 'Connected Device') : 'No device connected'}
            </span>
          </div>
          <div className="bt-popup-status">
            <span className="bt-popup-label">Status:</span>
            <span className={`bt-popup-status-badge ${isConnected ? 'popup-connected' : 'popup-disconnected'}`}>
              {isConnected ? 'Connected ✓' : 'Disconnected ✗'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Bluetooth Status Component ───────────────────────────────────────────────
const BluetoothStatus = ({ 
  isConnected, 
  deviceName, 
  isMobile, 
  onConnect, 
  onDisconnect,
  isConnecting,
  showScanner,
  showStatusPopup,
  onCloseScanner,
  onCloseStatusPopup,
  isScanning,
  devices,
  onDeviceSelect,
  onRefresh
}) => {
  return (
    <div className="bluetooth-wrapper">
      <div className={`bluetooth-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="bt-header">
          <span className="bt-icon">
            {isConnected ? <BluetoothConnected size={20} /> : <Bluetooth size={20} />}
          </span>
          <span className="bt-title">Bluetooth</span>
          <span className={`bt-dot ${isConnected ? 'bt-connected' : 'bt-disconnected'}`}></span>
        </div>
        
        <div className="bt-device-info">
          {isConnected ? (
            <>
              <span className="bt-device-name">{deviceName || 'Connected Device'}</span>
              <span className="bt-status-label">Connected</span>
            </>
          ) : (
            <span className="bt-device-name">No device connected</span>
          )}
        </div>
        
        <div className="bt-actions">
          {!isConnected && (
            <button 
              className="bt-connect-btn" 
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader size={16} className="spinning" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth size={16} />
                  Connect Device
                </>
              )}
            </button>
          )}
          {isConnected && (
            <button className="bt-disconnect-btn" onClick={onDisconnect}>
              Disconnect
            </button>
          )}
        </div>
      </div>

      <BluetoothScannerPopup
        isOpen={showScanner}
        onClose={onCloseScanner}
        onDeviceSelect={onDeviceSelect}
        isScanning={isScanning}
        devices={devices}
        onRefresh={onRefresh}
      />

      {showStatusPopup && (
        <BluetoothStatusPopup
          isConnected={isConnected}
          deviceName={deviceName}
          onClose={onCloseStatusPopup}
        />
      )}
    </div>
  );
};

// ─── Call Initiation Modal ────────────────────────────────────────────────────
const CallInitiationModal = ({ lead, onClose, onCall, isMobile, canCall }) => {
  const [selectedMethod, setSelectedMethod] = useState('bluetooth');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(lead?.mobile || '');
  
  const availableNumbers = [
    { number: lead?.mobile, label: 'Primary', person: lead?.contactPerson },
    { number: lead?.mobile2, label: 'Secondary', person: lead?.contactPerson2 },
    { number: lead?.mobile3, label: 'Tertiary', person: lead?.contactPerson3 },
    ...(lead?.additionalMobiles || []).map((item, index) => ({
      number: typeof item === 'string' ? item : item.number,
      label: typeof item === 'string' ? `Additional ${index + 1}` : (item.label || `Additional ${index + 1}`),
      person: typeof item === 'string' ? '' : (item.contactPerson || ''),
    })),
  ].filter(c => c.number && c.number.trim() !== '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-call-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📞 Initiate Call</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="call-lead-info">
            <Avatar initials={lead?.initials || lead?.name?.split(' ').map(w=>w[0]).join('') || '??'} name={lead?.name || 'Unknown'} size={48} />
            <div>
              <div className="call-lead-name">{lead?.name || 'Unknown'}</div>
              {lead?.contactPerson && <div className="call-contact-person">Contact: {lead.contactPerson}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Select Number to Call</label>
            <select 
              className="number-select"
              value={selectedNumber} 
              onChange={e => setSelectedNumber(e.target.value)}
            >
              {availableNumbers.map((contact, idx) => (
                <option key={idx} value={contact.number}>
                  {contact.label}: {contact.number} {contact.person ? `(${contact.person})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="call-methods">
            <label className={`call-method ${selectedMethod === 'bluetooth' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="callMethod" 
                value="bluetooth" 
                checked={selectedMethod === 'bluetooth'}
                onChange={() => setSelectedMethod('bluetooth')}
                disabled={!canCall}
              />
              <BluetoothConnected size={20} />
              <span>Bluetooth Call</span>
              <small>Call via connected mobile</small>
            </label>
            {isMobile && (
              <label className={`call-method ${selectedMethod === 'direct' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="callMethod" 
                  value="direct" 
                  checked={selectedMethod === 'direct'}
                  onChange={() => setSelectedMethod('direct')}
                  disabled={!canCall}
                />
                <PhoneCall size={20} />
                <span>Direct Call</span>
                <small>Call from this device</small>
              </label>
            )}
          </div>

          {!canCall && (
            <div className="call-blocked-warning">
              <AlertTriangle size={16} />
              <span>You are currently not available to make calls. Please change your status to Available.</span>
            </div>
          )}

          <div className="call-actions">
            <button 
              className={`btn-primary call-initiate-btn ${!canCall ? 'disabled' : ''}`}
              onClick={async () => {
                if (!canCall) {
                  alert('Please change your status to Available to make calls.');
                  return;
                }
                setIsLoading(true);
                await onCall(selectedNumber, selectedMethod);
                setIsLoading(false);
                onClose();
              }}
              disabled={isLoading || !canCall}
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="spinning" />
                  Connecting...
                </>
              ) : (
                <>
                  <PhoneCall size={18} />
                  Call Now
                </>
              )}
            </button>
            <button className="btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Outcome Modal ────────────────────────────────────────────────────────────
const OutcomeModal = ({ lead, onClose, onSave }) => {
  const [outcome, setOutcome] = useState('Interested');
  const [remarks, setRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const categories = ['School', 'College', 'Both'];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cp-outcome-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📊 Update Call Outcome</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="outcome-lead">
            <span>{lead?.name || 'Unknown'}</span>
            <span className="outcome-number">{lead?.mobile || 'No number'}</span>
            {lead?.contactPerson && <span className="outcome-contact">({lead.contactPerson})</span>}
          </div>
          <div className="form-group">
            <label>Call Outcome</label>
            <select value={outcome} onChange={e=>setOutcome(e.target.value)}>
              {['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Converted', 'In Progress'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {(outcome === 'Interested' || outcome === 'Converted') && (
            <div className="form-group">
              <label>Interested In</label>
              <div className="product-tags">
                {categories.map(c => (
                  <button
                    key={c}
                    className={`product-tag ${selectedCategories.includes(c) ? 'selected' : ''}`}
                    onClick={() => setSelectedCategories(prev => 
                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {outcome === 'Call Back' && (
            <div className="form-group">
              <label>Next Follow-up Date</label>
              <input type="datetime-local" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label>Remarks</label>
            <textarea rows={4} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Notes about the call..." />
          </div>
          <div className="form-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => { 
              onSave({ outcome, remarks, followUpDate, selectedCategories }); 
              onClose(); 
            }}>
              Save Outcome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CallPanel = ({ onNavigate, isMobile = false, backendUrl = '' }) => {
  const { user } = useAuth();
  
  // ── State ──────────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState('Call Queue');
  const [detailTab, setDetailTab] = useState('Customer Details');
  const [outcome, setOutcome] = useState('Interested');
  const [interestedIn, setInterestedIn] = useState(['School']);
  const [sentiment, setSentiment] = useState('Positive');
  const [remarks, setRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [autoNext, setAutoNext] = useState(true);
  const [agentStatus, setAgentStatus] = useState('Available');
  const [queueSearch, setQueueSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showDialpad, setShowDialpad] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showCallInit, setShowCallInit] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [sendDoc, setSendDoc] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [leadStatus, setLeadStatus] = useState('New');
  const [idleCountdown, setIdleCountdown] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [todaySummary, setTodaySummary] = useState({ total:0, answered:0, notAnswered:0, interested:0, notInterested:0, callBack:0, talkSecs:0 });
  const [callNumber, setCallNumber] = useState('');
  const [dialingAttempt, setDialingAttempt] = useState(0);
  const [autoDialing, setAutoDialing] = useState(false);
  const [callAttempts, setCallAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telecallers, setTelecallers] = useState([]);

  // ── Bluetooth State ──────────────────────────────────────────────────────
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callMethod, setCallMethod] = useState('bluetooth');
  const [showScanner, setShowScanner] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState([]);

  const timerRef = useRef(null);
  const idleRef = useRef(null);
  const reminderRefs = useRef([]);
  const wsRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const autoDialTimerRef = useRef(null);

  // ── Mock Bluetooth Scan ──────────────────────────────────────────────────────
  const mockDevices = [
    { name: 'iPhone 15 Pro', address: '3F:28:58:69:E3:06', type: 'mobile' },
    { name: 'Samsung Galaxy S24', address: '05:24:37:AF:FF:97', type: 'mobile' },
    { name: 'Pixel 8 Pro', address: '07:D4:2C:D0:0A:70', type: 'mobile' },
    { name: 'OnePlus 12', address: '4F:5E:75:08:AC:C2', type: 'mobile' },
  ];

  // ── Get Cloudflare tunnel URL ──────────────────────────────────────────────
  const getCloudflareUrl = async () => {
    try {
      // Try to get ngrok URL from backend config
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/config/ngrok-url`);
      if (response.ok) {
        const data = await response.json();
        return data.url || import.meta.env.VITE_API_BASE.replace('/api', '');
      }
    } catch (error) {
      console.error('Failed to get tunnel URL:', error);
    }
    return import.meta.env.VITE_API_BASE.replace('/api', '');
  };

  // ── Check if agent can make calls ──────────────────────────────────────────
  const canAgentCall = useCallback(() => {
    const statusObj = AGENT_STATUSES[agentStatus];
    return statusObj?.canCall || false;
  }, [agentStatus]);

  // ── Load Leads from Backend ──────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      // Get leads with pagination - get all leads for call queue
      const response = await leadService.getLeads(0, 100, '', '', '', '');
      
      if (response && response.content) {
        const leads = response.content.map(lead => ({
          id: lead.leadId || lead.id,
          _id: lead.id,
          name: lead.name,
          mobile: lead.mobile,
          email: lead.email,
          category: lead.category || 'School',
          status: lead.status || 'New',
          contactPerson: lead.contactPerson || lead.name,
          source: lead.source || 'Website',
          location: lead.district || 'Unknown',
          district: lead.district || '',
          notes: lead.notes || '',
          isFollowUp: lead.status === 'Call Back' || lead.status === 'Follow-up',
          prevNotes: lead.notes || '',
          assignedTo: lead.assignedTo || 'Unassigned',
          time: lead.lastContact || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          initials: lead.name?.split(' ').map(w => w[0]).join('') || '??',
        }));
        setQueue(leads);
        
        // Set first lead as active if available
        if (leads.length > 0 && !activeLead) {
          setActiveLead(leads[0]);
          setLeadStatus(leads[0].status || 'New');
        }
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      showToast('Failed to load leads: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeLead]);

  // ── Load Call History ──────────────────────────────────────────────────────
  const loadCallHistory = useCallback(async () => {
    try {
      const calls = await callService.getMyCalls();
      if (calls && Array.isArray(calls)) {
        setCallHistory(calls.map(call => ({
          id: call.id,
          name: call.leadName || 'Unknown',
          mobile: call.leadMobile || '',
          contactPerson: call.contactPerson || '',
          category: call.category || '',
          status: call.outcome || call.callStatus || 'Completed',
          time: call.startedAt ? new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          duration: call.duration ? fmtTime(call.duration) : '00:00',
          notes: call.notes || '',
          outcome: call.outcome || call.callStatus || 'Completed',
          initials: call.leadName?.split(' ').map(w => w[0]).join('') || '??',
        })));
      }
    } catch (error) {
      console.error('Failed to load call history:', error);
    }
  }, []);

  // ── Load Telecallers ──────────────────────────────────────────────────────
  const loadTelecallers = useCallback(async () => {
    try {
      const data = await telecallerService.getAll();
      setTelecallers(data);
    } catch (error) {
      console.error('Failed to load telecallers:', error);
    }
  }, []);

  // ── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadLeads();
    loadCallHistory();
    loadTelecallers();
  }, []);

  // ── Live Call Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // ── Update Talk Time Summary ──────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      const id = setInterval(() => setTodaySummary(s => ({ ...s, talkSecs: s.talkSecs + 1 })), 1000);
      return () => clearInterval(id);
    }
  }, [callState]);

  // ── Idle Auto-Next Countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (idleCountdown === null) { clearInterval(idleRef.current); return; }
    if (idleCountdown <= 0) {
      clearInterval(idleRef.current);
      setIdleCountdown(null);
      connectNextLead();
      return;
    }
    idleRef.current = setInterval(() => setIdleCountdown(c => c - 1), 1000);
    return () => clearInterval(idleRef.current);
  }, [idleCountdown]);

  // ── Reminder Pop-ups ──────────────────────────────────────────────────────
  useEffect(() => {
    reminders.forEach((r, i) => {
      if (!reminderRefs.current[i]) {
        reminderRefs.current[i] = setTimeout(() => {
          showToast(`🔔 Reminder: ${r.msg || 'Time to follow up!'}`, 'info');
        }, r.mins * 60 * 1000);
      }
    });
  }, [reminders]);

  // ── Cleanup timeouts ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (autoDialTimerRef.current) clearTimeout(autoDialTimerRef.current);
    };
  }, []);

  // ── Show Toast ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Navigation Handler ──────────────────────────────────────────────────────
  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
      showToast(`Navigating to ${page}...`, 'info');
    } else {
      showToast(`Would navigate to ${page}`, 'info');
    }
  };

  // ── Bluetooth Operations ────────────────────────────────────────────────────
  const openScanner = () => {
    if (!canAgentCall()) {
      showToast('Please change status to Available to connect Bluetooth', 'error');
      return;
    }
    setShowScanner(true);
    setShowStatusPopup(false);
    setFoundDevices([]);
    startScanning();
  };

  const startScanning = () => {
    setIsScanning(true);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    
    scanTimeoutRef.current = setTimeout(() => {
      setFoundDevices(mockDevices);
      setIsScanning(false);
    }, 2000);
  };

  const refreshScan = () => {
    setFoundDevices([]);
    startScanning();
  };

// ─── Handle Device Selection ────────────────────────────────────────────────────
const handleDeviceSelect = async (device) => {
  if (!canAgentCall()) {
    showToast('Please change status to Available to connect Bluetooth', 'error');
    return;
  }
  
  setIsConnecting(true);
  setShowScanner(false);
  
  try {
    // Check if device is already paired or has a device object
    if (device.device || device.isPaired) {
      try {
        // Try to connect using GATT
        const deviceObj = device.device || device;
        if (deviceObj.gatt) {
          const server = await deviceObj.gatt.connect();
          if (server) {
            showToast(`✅ Connected to ${device.name || 'Device'}`, 'success');
            setBluetoothConnected(true);
            setBluetoothDevice(device.name || 'Connected Device');
          } else {
            throw new Error('Failed to establish connection');
          }
        } else if (device.isPaired) {
          // Device is already paired but we don't have the device object
          // Use a direct connection attempt
          try {
            // Try to request the device again to get the GATT object
            const newDevice = await navigator.bluetooth.requestDevice({
              filters: [{ name: device.name }],
              optionalServices: ['battery_service', 'device_information']
            });
            
            if (newDevice) {
              const server = await newDevice.gatt.connect();
              if (server) {
                showToast(`✅ Connected to ${newDevice.name || 'Device'}`, 'success');
                setBluetoothConnected(true);
                setBluetoothDevice(newDevice.name || 'Connected Device');
              }
            }
          } catch (err) {
            // If we can't connect via GATT, still allow the connection
            showToast(`✅ Device paired: ${device.name || 'Device'} (GATT not available)`, 'success');
            setBluetoothConnected(true);
            setBluetoothDevice(device.name || 'Connected Device');
          }
        } else {
          throw new Error('No GATT service available');
        }
      } catch (error) {
        console.error('GATT connection error:', error);
        // Fallback - still allow connection for manual/paird devices
        if (device.isPaired) {
          showToast(`✅ Device connected (paired): ${device.name || 'Device'}`, 'success');
          setBluetoothConnected(true);
          setBluetoothDevice(device.name || 'Connected Device');
        } else {
          showToast('Failed to connect: ' + error.message, 'error');
          setIsConnecting(false);
          return;
        }
      }
    } else {
      // Manual or demo device
      await new Promise(resolve => setTimeout(resolve, 1500));
      setBluetoothConnected(true);
      setBluetoothDevice(device.name);
      showToast(`✅ Connected to ${device.name}`, 'success');
    }
    
    setShowStatusPopup(true);
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => setShowStatusPopup(false), 4000);
    
  } catch (error) {
    showToast('Failed to connect: ' + error.message, 'error');
  } finally {
    setIsConnecting(false);
  }
};

  const disconnectBluetooth = async () => {
    setBluetoothConnected(false);
    setBluetoothDevice(null);
    setShowStatusPopup(true);
    setShowScanner(false);
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => setShowStatusPopup(false), 3000);
    showToast('Bluetooth disconnected', 'info');
  };

  const closeScanner = () => {
    setShowScanner(false);
    setFoundDevices([]);
    setIsScanning(false);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
  };

  const closeStatusPopup = () => {
    setShowStatusPopup(false);
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
  };

  // ── Make Call ───────────────────────────────────────────────────────────────
  const makeCall = async (number, method = 'bluetooth') => {
    if (!canAgentCall()) {
      showToast('You are not available to make calls. Please change status to Available.', 'error');
      return;
    }

    if (!number) {
      showToast('No number to call.', 'error');
      return;
    }

    setCallMethod(method);
    if (method === 'bluetooth' && !bluetoothConnected) {
      showToast('Please connect a Bluetooth device first', 'error');
      return;
    }
    setCallState('ringing');
    setCallInProgress(true);
    setElapsed(0);
    
    const attempt = {
      number,
      time: new Date().toLocaleTimeString(),
      status: 'ringing'
    };
    setCallAttempts(prev => [...prev, attempt]);

    try {
      // Create call record in backend
      const callData = {
        leadId: activeLead?._id || activeLead?.id,
        leadName: activeLead?.name || 'Unknown',
        leadMobile: activeLead?.mobile || number,
        contactPerson: activeLead?.contactPerson || '',
        category: activeLead?.category || 'School',
        calledNumber: number,
        callMethod: method,
        callStatus: 'ringing',
        agentUsername: user?.username || 'admin',
        agentName: user?.fullName || 'Admin',
        startedAt: new Date().toISOString(),
      };
      
      await callService.create(callData);
      
      // Simulate call connection
      setTimeout(() => { 
        setCallState('connected'); 
        showToast('Call connected', 'success');
        setCallAttempts(prev => prev.map(a => 
          a.number === number ? { ...a, status: 'connected' } : a
        ));
        setTodaySummary(s => ({ ...s, total: s.total + 1, answered: s.answered + 1 }));
        setAutoDialing(false);
        setDialingAttempt(0);
      }, 2000);
      
    } catch (error) {
      showToast(`Call failed: ${error.message}`, 'error');
      setCallState('idle');
      setCallInProgress(false);
      setCallAttempts(prev => prev.map(a => 
        a.number === number ? { ...a, status: 'failed' } : a
      ));
      handleCallFailed();
    }
  };

  // ── Find Next Lead ──────────────────────────────────────────────────────────
  const connectNextLead = useCallback(() => {
    if (!canAgentCall()) {
      showToast('Cannot auto-connect. Agent status is not Available.', 'error');
      setIdleCountdown(null);
      return;
    }
    
    const idx = queue.findIndex(l => l.id === activeLead?.id);
    const next = queue[idx + 1];
    if (next) { 
      startCall(next); 
    } else { 
      showToast('All leads in queue completed!', 'info'); 
      setCallState('idle'); 
    }
  }, [queue, activeLead, canAgentCall]);

  // ── Start a New Call ────────────────────────────────────────────────────────
  const startCall = (lead) => {
    if (!canAgentCall()) {
      showToast('Cannot start call. Agent status is not Available.', 'error');
      return;
    }
    
    clearInterval(idleRef.current);
    setIdleCountdown(null);
    setActiveLead(lead);
    setLeadStatus(lead.status || 'New');
    setNotes('');
    setOutcome('Interested');
    setRemarks('');
    setSentiment('Positive');
    setInterestedIn([]);
    setDetailTab('Customer Details');
    setDialingAttempt(0);
    setCallAttempts([]);
    setAutoDialing(false);
    setShowCallInit(true);
  };

  const handleSelectLead = (lead) => {
    if (callState === 'connected' || callState === 'muted' || callState === 'onhold') {
      if (!window.confirm(`End current call with ${activeLead?.name} and call ${lead.name}?`)) return;
      finaliseCall();
    }
    startCall(lead);
  };

  // ── Handle Call Initiation from Modal ──────────────────────────────────────
  const handleInitiateCall = async (number, method) => {
    if (!canAgentCall()) {
      showToast('You are not available to make calls. Please change status to Available.', 'error');
      return;
    }
    await makeCall(number, method);
  };

  // ── Handle Adding Additional Contact ────────────────────────────────────────
  const handleAddAdditionalContact = (contactData) => {
    setQueue(prevQueue => 
      prevQueue.map(lead => {
        if (lead.id === activeLead?.id) {
          const currentAdditional = lead.additionalMobiles || [];
          const newContact = {
            id: contactData.id || Date.now(),
            number: contactData.number,
            label: contactData.label || `Additional ${currentAdditional.length + 1}`,
            contactPerson: contactData.contactPerson || '',
          };
          return {
            ...lead,
            additionalMobiles: [...currentAdditional, newContact]
          };
        }
        return lead;
      })
    );
    setActiveLead(prev => {
      if (!prev) return prev;
      const currentAdditional = prev.additionalMobiles || [];
      const newContact = {
        id: contactData.id || Date.now(),
        number: contactData.number,
        label: contactData.label || `Additional ${currentAdditional.length + 1}`,
        contactPerson: contactData.contactPerson || '',
      };
      return {
        ...prev,
        additionalMobiles: [...currentAdditional, newContact]
      };
    });
    showToast(`✅ Additional contact ${contactData.number} added!`, 'success');
  };

  // ── Handle Removing Additional Contact ──────────────────────────────────────
  const handleRemoveAdditionalContact = (contactId) => {
    setQueue(prevQueue => 
      prevQueue.map(lead => {
        if (lead.id === activeLead?.id) {
          return {
            ...lead,
            additionalMobiles: (lead.additionalMobiles || []).filter(c => c.id !== contactId)
          };
        }
        return lead;
      })
    );
    setActiveLead(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        additionalMobiles: (prev.additionalMobiles || []).filter(c => c.id !== contactId)
      };
    });
    showToast('Contact removed', 'info');
  };

  // ── Handle Call Failure - Auto Dial Next Number ────────────────────────────
  const handleCallFailed = useCallback(() => {
    if (!activeLead) return;
    
    const numbers = [
      { number: activeLead.mobile, label: 'Primary' },
      { number: activeLead.mobile2, label: 'Secondary' },
      { number: activeLead.mobile3, label: 'Tertiary' },
    ].filter(c => c.number && c.number.trim() !== '');

    const currentAttempt = dialingAttempt;
    const nextIndex = currentAttempt + 1;

    if (nextIndex < numbers.length && canAgentCall()) {
      setAutoDialing(true);
      showToast(`Calling ${numbers[nextIndex].label} number: ${numbers[nextIndex].number}...`, 'info');
      
      if (autoDialTimerRef.current) clearTimeout(autoDialTimerRef.current);
      autoDialTimerRef.current = setTimeout(() => {
        setCallNumber(numbers[nextIndex].number);
        setDialingAttempt(nextIndex);
        makeCall(numbers[nextIndex].number, callMethod);
      }, 2000);
    } else {
      setAutoDialing(false);
      setDialingAttempt(0);
      showToast('All primary numbers dialed. No answer.', 'error');
    }
  }, [activeLead, dialingAttempt, callMethod, canAgentCall]);

  // ── Finalise Call ───────────────────────────────────────────────────────────
  const finaliseCall = () => {
    clearInterval(timerRef.current);
    
    if (activeLead) {
      const rec = {
        ...activeLead,
        duration: fmtTime(elapsed),
        endTime: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
        outcome: outcome || 'Completed',
        notes: notes || '',
        calledNumber: callNumber || activeLead?.mobile,
      };
      
      setCallHistory(h => [rec, ...h]);
      setTodaySummary(s => {
        const update = { answered: s.answered + 1 };
        if (outcome === 'Interested') update.interested = s.interested + 1;
        else if (outcome === 'Not Interested') update.notInterested = s.notInterested + 1;
        else if (outcome === 'Call Back') update.callBack = s.callBack + 1;
        return { ...s, ...update };
      });
      
      // Update lead status in queue
      setQueue(q => q.map(l => 
        l.id === activeLead.id ? { ...l, status: outcome || l.status, prevNotes: notes || l.prevNotes } : l
      ));
      
      // Update lead status in backend
      if (activeLead._id) {
        leadService.updateLead(activeLead._id, {
          status: outcome || 'In Progress',
          notes: notes || activeLead.notes || '',
        }).catch(err => console.error('Failed to update lead status:', err));
      }
    }
    
    setCallState('idle');
    setCallInProgress(false);
    setCallNumber('');
    setDialingAttempt(0);
    setAutoDialing(false);
    setShowOutcome(true);
  };

  const handleEndCall = () => {
    finaliseCall();
    showToast('Call ended.', 'info');
    if (autoNext && canAgentCall()) {
      setIdleCountdown(300);
      showToast('Auto-connecting next call in 5 min if idle…', 'info');
    }
  };

  const cancelAutoNext = () => {
    clearInterval(idleRef.current);
    setIdleCountdown(null);
    showToast('Auto-next cancelled.', 'info');
  };

  // ── Call Controls ───────────────────────────────────────────────────────────
  const handleMute = () => { 
    setCallState(s => s === 'muted' ? 'connected' : 'muted');  
    showToast(callState === 'muted' ? 'Unmuted' : 'Muted', 'info'); 
  };
  
  const handleHold = () => { 
    setCallState(s => s === 'onhold' ? 'connected' : 'onhold'); 
    showToast(callState === 'onhold' ? 'Call Resumed' : 'Call on Hold', 'info'); 
  };

  // ── Save Disposition ─────────────────────────────────────────────────────────
  const handleSaveDisposition = () => {
    setQueue(q => q.map(l => l.id === activeLead?.id ? { ...l, status: outcome } : l));
    if (activeLead) {
      setLeadStatus(outcome);
      // Update in backend
      if (activeLead._id) {
        leadService.updateLead(activeLead._id, {
          status: outcome,
          notes: remarks || activeLead.notes || '',
        }).catch(err => console.error('Failed to update lead:', err));
      }
    }
    showToast('✅ Disposition saved!');
  };

  // ── Save Notes ──────────────────────────────────────────────────────────────
  const handleSaveNotes = () => {
    if (!notes.trim()) { showToast('Please enter a note.', 'error'); return; }
    // Update notes in backend
    if (activeLead?._id) {
      leadService.updateLead(activeLead._id, {
        notes: notes,
      }).catch(err => console.error('Failed to save notes:', err));
    }
    showToast('📝 Notes saved!');
  };

  // ── Handle Document Sent ────────────────────────────────────────────────────
  const handleDocSent = ({ type, to }) => {
    const pageMap = { 'Quotation': 'quotations', 'Agreement': 'agreements', 'Email': 'email' };
    const page = pageMap[type];
    showToast(`✅ ${type} sent to ${to}!`);
    if (page && onNavigate) setTimeout(() => handleNavigate(page), 1000);
  };

  // ── Handle Schedule ─────────────────────────────────────────────────────────
  const handleScheduleSave = (data) => {
    const fu = { ...data, lead: activeLead?.name || 'Unknown', leadId: activeLead?.id };
    setFollowUps(f => [fu, ...f]);
    setQueue(q => q.map(l => l.id === activeLead?.id ? { ...l, isFollowUp: true, prevNotes: notes || l.prevNotes } : l));
    showToast(`📅 Follow-up scheduled for ${data.date} at ${data.time}`);
    setTimeout(() => handleNavigate('followups'), 1500);
  };

  // ── Handle Reminder ─────────────────────────────────────────────────────────
  const handleReminderSave = (data) => {
    setReminders(r => [...r, data]);
    showToast(`🔔 Reminder set for ${data.mins} minutes!`);
  };

  // ── Handle Copy Mobile ──────────────────────────────────────────────────────
  const handleCopyMobile = () => {
    navigator.clipboard?.writeText(activeLead?.mobile || '').catch(()=>{});
    showToast('📋 Mobile number copied!');
  };

  // ── Handle Load More ──────────────────────────────────────────────────────
  const handleLoadMore = () => showToast('All leads loaded.', 'info');

  // ── Handle Call Number from Contact Display ────────────────────────────────
  const handleCallNumber = (number) => {
    if (!canAgentCall()) {
      showToast('You are not available to make calls. Please change status to Available.', 'error');
      return;
    }
    setCallNumber(number);
    setDialingAttempt(0);
    setAutoDialing(false);
    setShowCallInit(true);
  };

  // ── Computed Values ──────────────────────────────────────────────────────────
  const filteredQueue = queue.filter(l =>
    l.name?.toLowerCase().includes(queueSearch.toLowerCase()) || 
    l.mobile?.includes(queueSearch) ||
    (l.contactPerson && l.contactPerson.toLowerCase().includes(queueSearch.toLowerCase()))
  );

  const callStateLabel = { connected:'Call Connected', ringing:'Ringing…', onhold:'On Hold', muted:'Muted', ended:'Call Ended', idle:'Idle' };
  const callStateColor = { connected:'#16a34a', ringing:'#d97706', onhold:'#2563eb', muted:'#6b7280', ended:'#dc2626', idle:'#6b7280' };
  const canControl = (callState === 'connected' || callState === 'muted' || callState === 'onhold') && canAgentCall();

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="cp-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      {showDialpad && <DialpadModal onClose={()=>setShowDialpad(false)} onDial={num=>{makeCall(num, callMethod);}} />}
      {showSchedule && <ScheduleModal onClose={()=>setShowSchedule(false)} onSave={handleScheduleSave} leadName={activeLead?.name} />}
      {showReminder && <ReminderModal onClose={()=>setShowReminder(false)} onSave={handleReminderSave} />}
      {sendDoc && <SendDocModal type={sendDoc} lead={activeLead} onClose={()=>setSendDoc(null)} onSent={handleDocSent} />}
      {showCallInit && (
        <CallInitiationModal 
          lead={activeLead} 
          onClose={() => { setShowCallInit(false); if (callState === 'ringing') setCallState('idle'); }}
          onCall={handleInitiateCall}
          isMobile={isMobile}
          canCall={canAgentCall()}
        />
      )}
      {showOutcome && (
        <OutcomeModal 
          lead={activeLead} 
          onClose={() => setShowOutcome(false)}
          onSave={(data) => { 
            setOutcome(data.outcome); 
            setRemarks(data.remarks); 
            if (data.selectedCategories && data.selectedCategories.length > 0) setInterestedIn(data.selectedCategories); 
            handleSaveDisposition(); 
          }}
        />
      )}

      <div className="cp-page-header">
        <div><h1 className="cp-page-title">📞 Call Panel</h1></div>
        <div className="cp-header-right">
          <div className="cp-agent-status">
            <AgentStatusSelector 
              status={agentStatus} 
              onChange={setAgentStatus} 
              isCallActive={callInProgress}
            />
          </div>
        </div>
      </div>

      <StatusWarningBanner status={agentStatus} />

      <BluetoothStatus
        isConnected={bluetoothConnected}
        deviceName={bluetoothDevice}
        isMobile={isMobile}
        onConnect={openScanner}
        onDisconnect={disconnectBluetooth}
        isConnecting={isConnecting}
        showScanner={showScanner}
        showStatusPopup={showStatusPopup}
        onCloseScanner={closeScanner}
        onCloseStatusPopup={closeStatusPopup}
        isScanning={isScanning}
        devices={foundDevices}
        onDeviceSelect={handleDeviceSelect}
        onRefresh={refreshScan}
      />

      <div className="cp-grid">
        {/* LEFT: Queue */}
        <div className="cp-left">
          <div className="cp-tabs-row">
            {['Call Queue','Recent Calls'].map(t=>(
              <button key={t} className={`cp-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>
                {t}{t==='Call Queue'?` (${queue.length})`:''}
              </button>
            ))}
          </div>
          <div className="cp-queue-search">
            <span>🔍</span>
            <input 
              placeholder="Search organization, number or contact person…" 
              value={queueSearch} 
              onChange={e=>setQueueSearch(e.target.value)} 
            />
            <button className="icon-btn" title="Refresh" onClick={() => { loadLeads(); showToast('Queue refreshed', 'info'); }}>
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="cp-queue-list">
            {activeTab === 'Call Queue' ? (
              loading ? (
                <div className="cp-empty">Loading leads...</div>
              ) : filteredQueue.length === 0 ? (
                <div className="cp-empty">No leads in queue. Add leads from the Leads page.</div>
              ) : filteredQueue.map(lead => (
                <div key={lead.id} className={`queue-item ${activeLead?.id===lead.id?'active':''}`} onClick={()=>handleSelectLead(lead)}>
                  <div className="qi-avatar-wrap">
                    <Avatar initials={lead.initials || lead.name?.split(' ').map(w=>w[0]).join('') || '??'} name={lead.name || 'Unknown'} size={40} />
                    {lead.isFollowUp && <span className="fu-badge" title="Follow-Up Lead"><RotateCcw size={14} /></span>}
                  </div>
                  <div className="qi-info">
                    <div className="qi-name">{lead.name || 'Unknown'}</div>
                    {lead.contactPerson && <div className="qi-contact-person">{lead.contactPerson}</div>}
                    <div className="qi-mobile">{lead.mobile || 'No number'}</div>
                    <div className="qi-category">{lead.category || 'School'}</div>
                    <span className="qi-status" style={STATUS_COLORS[lead.status] || STATUS_COLORS['New']}>{lead.status || 'New'}</span>
                  </div>
                  <div className="qi-right">
                    <span className="qi-time">{lead.time || '--:--'}</span>
                    <button 
                      className={`qi-call-btn ${!canAgentCall() ? 'disabled' : ''}`} 
                      onClick={e=>{e.stopPropagation();handleSelectLead(lead);}} 
                      disabled={callInProgress && activeLead?.id !== lead.id || !canAgentCall()}
                      title={!canAgentCall() ? 'Status must be Available to call' : 'Call this lead'}
                    >
                      <PhoneCall size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              callHistory.length === 0 ? (
                <div className="cp-empty">No call history yet.</div>
              ) : callHistory.map((c,i) => (
                <div key={i} className="queue-item">
                  <Avatar initials={c.initials||c.name?.split(' ').map(w=>w[0]).join('')||'??'} name={c.name || 'Unknown'} size={40} />
                  <div className="qi-info">
                    <div className="qi-name">{c.name || 'Unknown'}</div>
                    {c.contactPerson && <div className="qi-contact-person">{c.contactPerson}</div>}
                    <div className="qi-mobile">{c.mobile || 'No number'}</div>
                    <div className="qi-category">{c.category || 'School'}</div>
                    <span className="qi-status" style={STATUS_COLORS[c.status] || STATUS_COLORS['New']}>{c.status || 'Completed'}</span>
                  </div>
                  <div className="qi-right">
                    <span className="qi-time">{c.endTime||c.time||'--:--'}</span>
                    <span className="qi-duration">{c.duration||'00:00'}</span>
                    <button 
                      className={`qi-call-btn ${!canAgentCall() ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!canAgentCall()) {
                          showToast('Status must be Available to call', 'error');
                          return;
                        }
                        const lead = queue.find(l => l.id === c.id) || {...c, isFollowUp: true, prevNotes: c.notes || ''};
                        handleSelectLead(lead);
                      }}
                      disabled={!canAgentCall()}
                      title={!canAgentCall() ? 'Status must be Available to call' : 'Call this lead'}
                    >
                      <PhoneCall size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="load-more-btn" onClick={handleLoadMore}>Load More Leads ↻</button>
          <div className="target-box">
            <div className="target-title">Today's Target</div>
            <div className="target-row"><span>Calls</span><span className="target-val">{todaySummary.answered} / {todaySummary.total}</span></div>
            <div className="target-bar-bg"><div className="target-bar-fill" style={{width:`${Math.min(100,Math.round(todaySummary.answered/ (todaySummary.total || 1)*100))}%`}}></div></div>
            <div className="target-pct">{Math.min(100,Math.round(todaySummary.answered/ (todaySummary.total || 1)*100))}%</div>
          </div>
        </div>

        {/* CENTRE: Active Call */}
        <div className="cp-centre">
          <div className="active-call-card">
            <div className="ac-header">
              <div className="ac-status-row">
                <span className={`ac-live-dot ${callState==='connected'?'dot-pulse-green':callState==='ringing'?'dot-pulse-amber':'dot-grey'}`}></span>
                <span className="ac-live-label" style={{color: callStateColor[callState]}}>{callStateLabel[callState]}</span>
                {callInProgress && (
                  <span className="ac-call-method">
                    {callMethod === 'bluetooth' ? <BluetoothConnected size={14} /> : <PhoneCall size={14} />}
                    {callMethod === 'bluetooth' ? 'Bluetooth' : 'Direct'}
                  </span>
                )}
                {autoDialing && (
                  <span className="ac-auto-dial-badge">
                    <Loader size={14} className="spinning" />
                    Auto-dialing next number...
                  </span>
                )}
              </div>
              <div className="ac-header-right">
                <span className="auto-next-label">Auto Next Call</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <button className="icon-btn" onClick={()=>showToast('Options coming soon.','info')}>⋮</button>
              </div>
            </div>

            {!canAgentCall() && (
              <div className="status-blocked-banner">
                <AlertCircle size={18} />
                <span>Calls are blocked. Status: <strong>{AGENT_STATUSES[agentStatus]?.label || agentStatus}</strong></span>
              </div>
            )}

            {idleCountdown !== null && <IdleCountdown seconds={idleCountdown} total={300} onCancel={cancelAutoNext} />}
            {activeLead?.isFollowUp && activeLead?.prevNotes && <FollowUpBanner notes={activeLead.prevNotes} />}

            <div className="ac-contact">
              <div className="ac-avatar-wrap">
                <Avatar 
                  initials={activeLead?.initials || activeLead?.name?.split(' ').map(w=>w[0]).join('') || '??'} 
                  name={activeLead?.name || 'Unknown'} 
                  size={68} 
                />
                {activeLead?.isFollowUp && <span className="ac-fu-tag">Follow-Up</span>}
              </div>
              <div className="ac-contact-info">
                <div className="ac-name">{activeLead?.name || 'No lead selected'}</div>
                {activeLead?.contactPerson && <div className="ac-contact-person">Contact: {activeLead.contactPerson}</div>}
                <div className="ac-mobile">{activeLead?.mobile || 'No number'}</div>
                <div className="ac-category">{activeLead?.category || 'School'}</div>
              </div>
            </div>

            <ContactNumbersDisplay 
              lead={activeLead} 
              onCallNumber={handleCallNumber}
              onAddContact={handleAddAdditionalContact}
              onRemoveContact={handleRemoveAdditionalContact}
              canCall={canAgentCall()}
            />

            <div className="ac-via-row">
              <span className="via-label">Calling via</span>
              <span className="via-icon">{bluetoothConnected ? '🔵' : '⚪'}</span>
              <span className="via-device">{bluetoothConnected ? (bluetoothDevice || 'Bluetooth Device') : 'No Device'}</span>
              <span className={`via-status ${callState==='connected'?'via-connected':callState==='onhold'?'via-hold':'via-ringing'}`}>
                {callState==='connected'?'Connected':callState==='onhold'?'On Hold':callState==='muted'?'Muted':callState==='ringing'?'Ringing…':'Ended'}
              </span>
              {callNumber && callState !== 'idle' && (
                <span className="called-number">📞 {callNumber}</span>
              )}
            </div>

            {callAttempts.length > 0 && (
              <div className="call-attempts-display">
                <span className="attempts-label">Call Attempts:</span>
                {callAttempts.map((attempt, idx) => (
                  <span key={idx} className={`attempt-status ${attempt.status}`}>
                    {attempt.number}
                    {attempt.status === 'connected' && ' ✓'}
                    {attempt.status === 'failed' && ' ✗'}
                    {attempt.status === 'ringing' && ' ⏳'}
                  </span>
                ))}
              </div>
            )}

            <div className="ac-timer">{fmtTime(elapsed)}</div>
            <div className="ac-state-label" style={{color:callStateColor[callState]}}>{callStateLabel[callState]}</div>

            <div className="ac-controls">
              <button className={`ctrl-btn ${callState==='muted'?'ctrl-active':''}`} onClick={handleMute} disabled={!canControl}>
                <span className="ctrl-icon">{callState === "muted" ? <MicOff size={22}/> : <Mic size={22}/>}</span>
                <span className="ctrl-label">{callState==='muted'?'Unmute':'Mute'}</span>
              </button>
              <button className={`ctrl-btn ${callState==='onhold'?'ctrl-active':''}`} onClick={handleHold} disabled={!canControl}>
                <span className="ctrl-icon">{callState==="onhold" ? <Play size={22}/> : <Pause size={22}/>}</span>
                <span className="ctrl-label">{callState==='onhold'?'Resume':'Hold'}</span>
              </button>
              <button className="ctrl-btn ctrl-end" onClick={handleEndCall} disabled={!canControl}>
                <span className="ctrl-icon"><PhoneOff size={22}/></span>
                <span className="ctrl-label">End Call</span>
              </button>
              <button className="ctrl-btn" onClick={()=>setShowDialpad(true)} disabled={!bluetoothConnected && !isMobile || !canAgentCall()}>
                <span className="ctrl-icon"><Phone size={22}/></span>
                <span className="ctrl-label">Dialpad</span>
              </button>
              <button className="ctrl-btn" onClick={()=>showToast('Transfer feature coming soon.','info')} disabled={!canControl}>
                <span className="ctrl-icon"><ArrowRightLeft size={22}/></span>
                <span className="ctrl-label">Transfer</span>
              </button>
            </div>

            <div className="detail-tabs">
              {['Customer Details','Call Notes','History','Follow Ups'].map(t=>(
                <button key={t} className={`detail-tab ${detailTab===t?'active':''}`} onClick={()=>setDetailTab(t)}>
                  {t}{t==='Follow Ups'&&followUps.length>0?` (${followUps.length})`:''}
                </button>
              ))}
            </div>

            <div className="detail-content">
              {detailTab==='Customer Details' && activeLead && (
                <div className="customer-grid">
                  <div className="cg-col">
                    {[
                      ['Lead ID', activeLead.id],
                      ['Organization', activeLead.name],
                      ['Contact Person', activeLead.contactPerson || '--'],
                      ['Mobile', activeLead.mobile, true],
                      ['Email', activeLead.email || '--'],
                      ['Category', activeLead.category || 'School'],
                      ['Source', activeLead.source || '--'],
                      ['District', activeLead.district || activeLead.location || '--']
                    ].map(([k,v,copy])=>(
                      <div key={k} className="cg-row">
                        <span className="cg-key">{k}</span>
                        <span className="cg-val">{v}{copy&&<button className="copy-btn" onClick={handleCopyMobile}>⧉</button>}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cg-col">
                    <div className="cg-row">
                      <span className="cg-key">Lead Status</span>
                      <select className="inline-select" value={leadStatus} onChange={e=>setLeadStatus(e.target.value)}>
                        {Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="cg-row"><span className="cg-key">Last Contact</span><span className="cg-val">{activeLead.time || '--'}</span></div>
                    <div className="cg-row"><span className="cg-key">Assigned To</span><span className="cg-val">{activeLead.assignedTo || 'Unassigned'}</span></div>
                    {activeLead?.isFollowUp && (
                      <div className="cg-row fu-row">
                        <span className="cg-key">Type</span>
                        <span className="fu-tag-inline">🔁 Follow-Up</span>
                      </div>
                    )}
                    <div className="cg-row">
                      <span className="cg-key">Alt Numbers</span>
                      <span className="cg-val">
                        {activeLead.mobile2 && <span className="alt-number">{activeLead.mobile2}</span>}
                        {activeLead.mobile3 && <span className="alt-number">{activeLead.mobile3}</span>}
                        {(activeLead.additionalMobiles || []).map((item, idx) => (
                          <span key={idx} className="alt-number additional">
                            {typeof item === 'string' ? item : item.number}
                          </span>
                        ))}
                        {!activeLead.mobile2 && !activeLead.mobile3 && (!activeLead.additionalMobiles || activeLead.additionalMobiles.length === 0) && <span>--</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab==='Call Notes' && (
                <div className="notes-tab">
                  {activeLead?.isFollowUp && activeLead?.prevNotes && (
                    <div className="prev-notes-block">
                      <div className="pn-label">📋 Previous Notes</div>
                      <p className="pn-text">{activeLead.prevNotes}</p>
                    </div>
                  )}
                  <div className="notes-hint">Current call notes:</div>
                  {callHistory.filter(c=>c.id===activeLead?.id).map((c,i)=>(
                    <div key={i} className="note-item">
                      <span className="note-date">{c.endTime || c.time}</span>
                      <span className="note-text">{c.notes||'No notes added.'}</span>
                    </div>
                  ))}
                  {callHistory.filter(c=>c.id===activeLead?.id).length===0 && <div className="cp-empty" style={{paddingTop:8}}>No previous call notes for this lead.</div>}
                </div>
              )}

              {detailTab==='History' && (
                <div className="history-tab">
                  {callHistory.length===0 ? <div className="cp-empty">No call history yet.</div>
                  : callHistory.map((c,i)=>(
                    <div key={i} className="history-item">
                      <span className="hi-name">{c.name}</span>
                      {c.contactPerson && <span className="hi-contact">({c.contactPerson})</span>}
                      <span className="hi-time">{c.endTime||c.time}</span>
                      <span className="hi-duration">{c.duration}</span>
                      <span className="hi-outcome">{c.outcome||c.status}</span>
                      <span className="hi-status" style={STATUS_COLORS[c.status] || STATUS_COLORS['New']}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab==='Follow Ups' && (
                <div className="followups-tab">
                  <button className="btn-primary" style={{marginBottom:12}} onClick={() => { setShowSchedule(true); }}>
                    + Schedule Follow Up
                  </button>
                  {followUps.length===0 ? <div className="cp-empty">No follow-ups scheduled.</div>
                  : followUps.map((f,i)=>(
                    <div key={i} className="fu-item">
                      <div className="fu-item-top">
                        <span className="fu-lead">{f.lead}</span>
                        <span className="fu-type-badge">{f.type}</span>
                      </div>
                      <div className="fu-date">📅 {f.date} at {f.time}</div>
                      {f.note&&<div className="fu-note">📝 {f.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="quick-notes-section">
              <div className="qn-header">Quick Notes</div>
              <textarea className="qn-textarea" placeholder="Write notes about this call…" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500} rows={3} />
              <div className="qn-footer">
                <span className="qn-count">{notes.length}/500</span>
                <button className="btn-primary" onClick={handleSaveNotes}>Save Notes</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Disposition + Quick Actions */}
        <div className="cp-right">
          <div className="disp-card">
            <div className="disp-title">Disposition</div>
            <div className="disp-section">
              <label className="disp-label">Call Outcome</label>
              <select className="disp-select" value={outcome} onChange={e=>setOutcome(e.target.value)}>
                {['Interested','Not Interested','Call Back','No Answer','Converted','In Progress'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="disp-section">
              <label className="disp-label">Interested In</label>
              {['School','College','Both'].map(item=>(
                <label key={item} className="disp-check">
                  <input type="checkbox" checked={interestedIn.includes(item)} onChange={()=>setInterestedIn(prev => prev.includes(item) ? prev.filter(i=>i!==item) : [...prev,item])} />{item}
                </label>
              ))}
            </div>
            <div className="disp-section">
              <label className="disp-label">Customer Sentiment</label>
              <div className="sentiment-row">
                {[['😊','Positive'],['😐','Neutral'],['😡','Negative']].map(([icon,s])=>(
                  <button key={s} className={`sent-btn ${sentiment===s?'sent-active':''}`} onClick={()=>setSentiment(s)}>
                    <span>{icon}</span><span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="disp-section">
              <label className="disp-label">Remarks</label>
              <textarea className="disp-textarea" value={remarks} onChange={e=>setRemarks(e.target.value)} rows={4} maxLength={500} />
              <div className="disp-count">{remarks.length}/500</div>
            </div>
            <button className="save-disp-btn" onClick={handleSaveDisposition}>Save Disposition</button>
          </div>

          <div className="qa-card">
            <div className="qa-title">Quick Actions</div>
            <div className="qa-nav-links">
              <div className="qa-nav-label">Go to page</div>
              <div className="qa-nav-row">
                {[
                  { icon:'📄', label:'Quotations', page:'quotations' },
                  { icon:'📝', label:'Agreements', page:'agreements' },
                  { icon:'📊', label:'Reports',    page:'reports'    },
                  { icon:'🔁', label:'Follow Ups', page:'followups'  },
                ].map(n=>(
                  <button key={n.page} className="qa-nav-btn" onClick={() => handleNavigate(n.page)}>
                    {n.icon} {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPanel;