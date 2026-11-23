import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CallPanel.css';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Loader,
  RotateCcw,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { leadService } from '../../services/leadService';
import { swr } from '../../services/cache';
import { callService } from '../../services/callService';
import { localSimCallService } from "../../services/localSimCallService";
import { useAuth } from '../../context/AuthContext';

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
  'Completed': { bg: '#d1fae5', color: '#065f46' },
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

const avatarColor = n => {
  if (!n || typeof n !== 'string') return AVATAR_COLORS[0];
  return AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
};

// Excel imports are stored as a JSON object in lead.notes. Keep that object
// intact and append telecaller updates as the next UPn property.
const parseLeadUpdateRecord = (lead) => {
  const record = {};
  if (lead?.notes) {
    try {
      const parsed = JSON.parse(lead.notes);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) Object.assign(record, parsed);
      else record['Legacy Note'] = String(lead.notes);
    } catch {
      record['Legacy Note'] = String(lead.notes);
    }
  }
  Object.keys(lead || {}).forEach((key) => {
    if (/^UP\s*\d+$/i.test(key) && lead[key] != null && String(lead[key]).trim()) record[key] = lead[key];
  });
  return record;
};

const getLeadUpdates = (lead) => Object.entries(parseLeadUpdateRecord(lead))
  .map(([label, value]) => {
    const match = label.match(/^UP\s*(\d+)$/i);
    return match ? { label: `UP${Number(match[1])}`, number: Number(match[1]), value: String(value ?? '') } : null;
  })
  .filter((item) => item && item.value.trim())
  .sort((a, b) => b.number - a.number);

// Resolve the business Lead ID used by LeadService (not MongoDB's _id).
// Keep raw backend identifiers intact; never overwrite the original lead object.
const getBusinessLeadId = (lead) => {
  if (!lead) return '';
  // API contract: PUT /api/leads/{leadId} looks up Lead.leadId, not Mongo _id.
  const businessId = lead.businessLeadId || lead.leadId;
  if (businessId != null && String(businessId).trim()) return String(businessId).trim();
  // Safe fallback only when the API response has no business leadId.
  const fallback = lead.id || lead._id;
  const value = fallback == null ? '' : String(fallback).trim();
  return value && !/^[a-f0-9]{24}$/i.test(value) ? value : '';
};


// ─── Queue grouping ───────────────────────────────────────────────────────────
// A lead is a FOLLOW-UP only when the telecaller really scheduled one:
//   • status is Call Back / Follow-up, or
//   • the telecaller saved a follow-up note (TC_NEXT_FOLLOWUP_NOTE) with a valid date, or
//   • a valid follow-up date exists AND the lead is already past the "New" stage.
// A pre-filled Excel date on a still-New lead does NOT hide it from the New Leads tab any more.
const NEW_STAGE_STATUSES = ['', 'New', 'In Progress', 'Contacted'];
const NO_RESPONSE_STATUSES = ['No Response', 'Not Answered', 'Not answering', 'No Answer'];
const DONE_STATUSES = ['Converted', 'Not Interested', 'Completed', 'Not Existing', 'Demo Scheduled'];

const hasValidFollowupDate = (value) => {
  if (value == null) return false;
  const s = String(value).trim();
  if (!s || s === 'Pending' || s === '-' || s.toLowerCase() === 'null') return false;
  return !Number.isNaN(new Date(s).getTime());
};

const computeIsFollowUp = (lead) => {
  const status = (lead.status || '').trim();
  if (status === 'Call Back' || status === 'Follow-up') return true;
  if (!hasValidFollowupDate(lead.tcNextRefollowupDate)) return false;
  const record = parseLeadUpdateRecord(lead);
  if (record.TC_NEXT_FOLLOWUP_NOTE && String(record.TC_NEXT_FOLLOWUP_NOTE).trim()) return true;
  return !NEW_STAGE_STATUSES.includes(status);
};

const getQueueGroup = (lead) => {
  if (lead.isFollowUp) return 'Follow-ups';
  if (NO_RESPONSE_STATUSES.includes(lead.status)) return 'No Response';
  if (DONE_STATUSES.includes(lead.status)) return 'Done';
  return 'New Leads';
};

const normalizeLead = (lead) => {
  const base = {
    ...lead,
    businessLeadId: lead.leadId || lead.businessLeadId || '',
    id: lead.leadId || lead.id,
    _id: lead.id || lead._id || '',
    name: lead.name || lead.school || 'Unknown',
    mobile: lead.mobile || lead.phoneNumber || 'N/A',
    category: lead.category || 'School',
    status: lead.status || 'New',
    contactPerson: lead.contactPerson || lead.name || '',
    source: lead.source || 'Excel Import',
    location: lead.district || 'Unknown',
    district: lead.district || '',
    notes: lead.notes || '',
    prevNotes: lead.notes || '',
    assignedTo: lead.assignedTo || 'Unassigned',
    time: lead.lastContact || '',
    initials: lead.name?.split(' ').map(w => w[0]).join('') || '??',
    organization: lead.organization || lead.school || lead.name || '',
    address: lead.schoolAddress || lead.address || '',
    area: lead.area || '',
    campaign: lead.campaign || '',
    nextFollowUp: lead.tcNextRefollowupDate || '',
    nextVisit: lead.meNextVisitDate || '',
  };
  base.isFollowUp = computeIsFollowUp(base);
  return base;
};

const getReadableFollowupNote = (lead) => {
  const record = parseLeadUpdateRecord(lead);
  const dedicated = record.TC_NEXT_FOLLOWUP_NOTE || record.tcNextRefollowupNote || lead?.tcNextRefollowupNote;
  if (dedicated && String(dedicated).trim()) return String(dedicated).trim();
  return 'Follow-up scheduled';
};

const formatFollowupDate = (value) => {
  if (!value || value === 'Pending') return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtTime = s => {
  if (!s && s !== 0) return '00:00';
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return h>0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

const Avatar = ({ initials, name, size=44 }) => {
  const safeName = name || 'Unknown';
  const safeInitials = initials || safeName?.split(' ').map(w => w[0]).join('') || '??';
  return (
    <div className="cp-avatar" style={{ width:size, height:size, background:avatarColor(safeName), fontSize:size*0.36 }}>
      {safeInitials.slice(0, 2).toUpperCase()}
    </div>
  );
};

const Toast = ({ msg, type, onClose }) => (
  <div className={`cp-toast cp-toast-${type}`} onClick={onClose}>{msg}</div>
);

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
              className={`status-option ${status === key ? 'active' : ''}`}
              onClick={() => handleStatusChange(key)}
              style={{
                background: status === key ? value.bg : 'transparent',
                borderLeft: status === key ? '3px solid #7b1113' : '3px solid transparent'
              }}
              disabled={isCallActive && !value.canCall}
            >
              <span className="status-option-label">{value.label}</span>
              {status === key && <span className="status-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Call Initiation Modal ────────────────────────────────────────────────────
const CallInitiationModal = ({ lead, onClose, onCall, canCall }) => {
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
          <div className="call-lead-info" style={{display:'flex', alignItems:'center', gap:'16px', padding:'12px 0', borderBottom:'1px solid #f3f4f6', marginBottom:'16px'}}>
            <Avatar
              initials={lead?.initials || lead?.name?.split(' ').map(w => w[0]).join('') || '??'}
              name={lead?.name || 'Unknown'}
              size={48}
            />
            <div>
              <div className="call-lead-name" style={{fontWeight:'600', color:'#1a1a1a', fontSize:'1.1rem'}}>{lead?.name || 'Unknown'}</div>
              {lead?.contactPerson && <div className="call-contact-person" style={{color:'#6b7280', fontSize:'0.9rem'}}>Contact: {lead.contactPerson}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Select Number to Call</label>
            <select
              className="number-select"
              value={selectedNumber}
              onChange={e => setSelectedNumber(e.target.value)}
              style={{width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'0.9rem'}}
            >
              {availableNumbers.map((contact, idx) => (
                <option key={idx} value={contact.number}>
                  {contact.label}: {contact.number} {contact.person ? `(${contact.person})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="call-methods" style={{display:'flex', flexDirection:'column', gap:'10px', margin:'16px 0'}}>
            <div style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderRadius:'10px', border:'2px solid #7b1113', background:'#fff5f5'}}>
              <PhoneCall size={20} color="#7b1113" />
              <span>Local SIM Call — sends a call request to the paired phone bridge</span>
            </div>
          </div>

          {!canCall && (
            <div className="call-blocked-warning" style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'#fee2e2', borderRadius:'8px', color:'#b91c1c', fontSize:'12.5px', margin:'8px 0'}}>
              <AlertTriangle size={16} />
              <span>You are currently not available to make calls. Please change your status to Available.</span>
            </div>
          )}

          <div className="call-actions" style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #f3f4f6'}}>
            <button
              className={`call-initiate-btn ${!canCall ? 'disabled' : ''}`}
              onClick={async () => {
                if (!canCall) {
                  alert('Please change your status to Available to make calls.');
                  return;
                }
                setIsLoading(true);
                await onCall(selectedNumber);
                setIsLoading(false);
                onClose();
              }}
              disabled={isLoading || !canCall}
              style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 24px', background: !canCall ? '#ccc' : '#7b1113', color:'white', border:'none', borderRadius:'8px', fontWeight:'600', cursor: !canCall ? 'not-allowed' : 'pointer', opacity: !canCall ? '0.6' : '1'}}
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
            <button className="btn-outline" onClick={onClose} style={{padding:'10px 24px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'transparent', color:'#1a1a1a', cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Outcome Modal ────────────────────────────────────────────────────────────
const OutcomeModal = ({ lead, onClose, onSave, loading }) => {
  const [outcome, setOutcome] = useState('Interested');
  const [remarks, setRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
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
          <div className="outcome-lead" style={{display:'flex', justifyContent:'space-between', padding:'10px 0', marginBottom:'16px', borderBottom:'1px solid #f3f4f6', color:'#1a1a1a', fontWeight:'500'}}>
            <span>{lead?.name || 'Unknown'}</span>
            <span className="outcome-number" style={{color:'#6b7280', fontWeight:'400'}}>{lead?.mobile || 'No number'}</span>
          </div>
          <div className="form-group">
            <label>Call Outcome</label>
            <select
              value={outcome}
              onChange={e=>setOutcome(e.target.value)}
              style={{width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'0.9rem'}}
              disabled={loading}
            >
              {['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Converted', 'In Progress'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {(outcome === 'Interested' || outcome === 'Converted') && (
            <div className="form-group">
              <label>Interested In</label>
              <div className="product-tags" style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                {categories.map(c => (
                  <button
                    key={c}
                    className={`product-tag ${selectedCategories.includes(c) ? 'selected' : ''}`}
                    onClick={() => setSelectedCategories(prev =>
                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                    )}
                    style={{padding:'4px 12px', borderRadius:'16px', border:`1px solid ${selectedCategories.includes(c) ? '#7b1113' : '#e5e7eb'}`, background: selectedCategories.includes(c) ? '#fff5f5' : '#fafafa', color: selectedCategories.includes(c) ? '#7b1113' : '#1a1a1a', fontSize:'0.8rem', cursor:'pointer'}}
                    disabled={loading}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Next Follow-up Date & Time *</label>
            <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} disabled={loading} required style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb'}} />
          </div>
          <div className="form-group">
            <label>Follow-up Note *</label>
            <textarea rows={2} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} disabled={loading} required placeholder="What should the telecaller follow up about?" /> 
          </div>
          <div className="form-group">
            <label>Remarks</label>
            <textarea
              rows={4}
              value={remarks}
              onChange={e=>setRemarks(e.target.value)}
              placeholder="Notes about the call..."
              style={{width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'0.9rem', resize:'vertical'}}
              disabled={loading}
            />
          </div>
          <div className="form-actions" style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #f3f4f6'}}>
            <button className="btn-outline" onClick={onClose} disabled={loading} style={{padding:'8px 20px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'transparent', color:'#1a1a1a', cursor:'pointer'}}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => { onSave({ outcome, remarks, followUpDate, followUpNote, selectedCategories }); }}
              disabled={loading}
              style={{padding:'8px 20px', borderRadius:'8px', border:'none', background:'#7b1113', color:'white', cursor:'pointer', fontWeight:'500'}}
            >
              {loading ? 'Saving...' : 'Save Outcome'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CallPanel = ({ onNavigate, isMobile = false, navigationState = null }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [lastCallDuration, setLastCallDuration] = useState(0);
  const [detailTab, setDetailTab] = useState('Customer Details');
  const [outcome, setOutcome] = useState('Interested');
  const [interestedIn, setInterestedIn] = useState(['School']);
  const [sentiment, setSentiment] = useState('Positive');
  const [remarks, setRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [notes, setNotes] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('ta-IN');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [autoNext, setAutoNext] = useState(true);
  const [agentStatus, setAgentStatus] = useState('Available');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueSegment, setQueueSegment] = useState('New Leads');
  const [callStats, setCallStats] = useState({ totalCalls: 0, answered: 0, notAnswered: 0, interested: 0, notInterested: 0, talkSecs: 0 });
  const [toast, setToast] = useState(null);
  const [showCallInit, setShowCallInit] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [leadStatus, setLeadStatus] = useState('New');
  const [idleCountdown, setIdleCountdown] = useState(null);
  const [todaySummary, setTodaySummary] = useState({ total:0, answered:0, notAnswered:0, interested:0, notInterested:0, callBack:0, talkSecs:0 });
  const [loading, setLoading] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [endedLeadId, setEndedLeadId] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [controlBusy, setControlBusy] = useState(false);

  const timerRef = useRef(null);
  const idleRef = useRef(null);

  const canAgentCall = useCallback(() => {
    const statusObj = AGENT_STATUSES[agentStatus];
    return statusObj?.canCall || false;
  }, [agentStatus]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Local SIM call status ──────────────────────────────────────────────────
  // The backend is the single source of truth. We ask it for the status of OUR call
  // every second (works through ngrok/proxies; no websocket subscription needed).
  const wasConnectedRef = useRef(false);
  const lastSeenStatusRef = useRef('');
  const applyStatusRef = useRef(() => {});

  applyStatusRef.current = (cmd) => {
    if (!cmd || !cmd.status) return;
    const st = String(cmd.status).toUpperCase();
    const leadName = activeLead?.name || 'Lead';
    const duration = Number(cmd.duration) || 0;
    const changed = lastSeenStatusRef.current !== st;
    lastSeenStatusRef.current = st;
    if (typeof cmd.muted === 'boolean') setIsMuted(cmd.muted);

    if (st === 'PENDING' || st === 'DISPATCHED') {
      setCallState('connecting');
      setIsCallActive(false);
      return;
    }

    if (st === 'RINGING') {
      setCallState(prev => (prev === 'connected' || prev === 'muted' || prev === 'onhold') ? prev : 'ringing');
      setIsCallActive(true);
      if (changed) showToast(`Phone is dialing ${leadName}...`, 'info');
      return;
    }

    if (st === 'CONNECTED') {
      wasConnectedRef.current = true;
      if (changed && Number.isFinite(duration)) setElapsed(duration);
      setCallState('connected');
      setIsCallActive(true);
      if (changed) showToast(`Call connected with ${leadName}.`, 'success');
      return;
    }

    if (st === 'ON_HOLD') {
      wasConnectedRef.current = true;
      if (changed && Number.isFinite(duration)) setElapsed(duration);
      setCallState('onhold');
      setIsCallActive(true);
      if (changed) showToast('Phone call is on hold. Talk-time timer paused.', 'info');
      return;
    }

    // Final states: COMPLETED, NO_ANSWER, BUSY, REJECTED, FAILED, CANCELLED
    const answered = wasConnectedRef.current || (st === 'COMPLETED' && duration > 0);
    setCallState('idle');
    setIsCallActive(false);
    setLastCallDuration(duration || elapsed);
    setElapsed(0);
    setCurrentCallId(null);
    wasConnectedRef.current = false;

    if (activeLead) setEndedLeadId(activeLead.id || activeLead._id);

    setTodaySummary(prev => ({
      ...prev,
      total: prev.total + (st === 'FAILED' || st === 'CANCELLED' ? 0 : 1),
      answered: prev.answered + (answered ? 1 : 0),
      notAnswered: prev.notAnswered + (!answered && st !== 'FAILED' && st !== 'CANCELLED' ? 1 : 0),
      talkSecs: prev.talkSecs + (answered ? duration : 0),
    }));

    if (st === 'COMPLETED') showToast('Call ended.', 'info');
    else if (st === 'NO_ANSWER') showToast('No answer.', 'info');
    else if (st === 'BUSY') showToast('Number is busy.', 'info');
    else if (st === 'REJECTED') showToast('Call was rejected.', 'info');
    else if (st === 'CANCELLED' && /^Cancelled before/i.test(cmd.message || '')) showToast('Call cancelled.', 'info');
    else showToast(cmd.message || 'Call could not be placed.', 'error');
  };

  const callInFlight = callState !== 'idle';
  useEffect(() => { if (callState === 'idle') setIsMuted(false); }, [callState]);
  useEffect(() => {
    if (!currentCallId || !callInFlight) return undefined;

    let stopped = false;
    let failures = 0;
    const callId = currentCallId;

    const tick = async () => {
      try {
        const cmd = await localSimCallService.getCall(callId);
        failures = 0;
        if (!stopped) applyStatusRef.current(cmd);
      } catch (error) {
        failures += 1;
        // 404 = the server forgot the call (restart / expiry): do not leave the UI stuck.
        if (!stopped && /not found/i.test(error.message || '')) {
          applyStatusRef.current({ status: 'FAILED', message: 'The call request was lost. Please call again.' });
        } else if (!stopped && failures === 6) {
          showToast('Lost contact with the CRM server while checking the call.', 'error');
        }
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [currentCallId, callInFlight]);

  // ── Is MY Windows companion online and my phone connected? ─────────────────
  const [bridgeHealth, setBridgeHealth] = useState({ state: 'UNKNOWN', message: '' });
  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const h = await localSimCallService.companionStatus();
        if (!stopped) setBridgeHealth(h);
      } catch {
        if (!stopped) setBridgeHealth({ state: 'UNKNOWN', message: 'Could not check the phone bridge.' });
      }
    };
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, 8000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  const handleSaveOutcome = async (data) => {
    if (!activeLead) { showToast('Select a lead first.', 'error'); return; }
    const {
      outcome: selectedOutcome,
      remarks: callRemarks,
      followUpDate: selectedFollowUpDate,
      followUpNote: selectedFollowUpNote,
      selectedCategories
    } = data;

    if (!selectedFollowUpDate || !selectedFollowUpNote?.trim()) {
      showToast('Please enter the next follow-up date, time and note for this status.', 'error');
      return;
    }
    const followupAt = new Date(selectedFollowUpDate);
    if (Number.isNaN(followupAt.getTime()) || followupAt.getTime() <= Date.now()) {
      showToast('Please select a valid future follow-up date and time.', 'error');
      return;
    }

    const businessLeadId = getBusinessLeadId(activeLead);
    if (!businessLeadId) {
      showToast('Business Lead ID is missing. Refresh the lead list and try again.', 'error');
      return;
    }

    setSavingOutcome(true);
    try {
      const existingRecord = parseLeadUpdateRecord(activeLead);
      const nextRecord = { ...existingRecord, TC_NEXT_FOLLOWUP_NOTE: selectedFollowUpNote.trim() };
      const leadPayload = {
        status: selectedOutcome,
        tcNextRefollowupDate: selectedFollowUpDate,
        notes: JSON.stringify(nextRecord),
      };

      const durationSeconds = Math.max(0, Number(lastCallDuration || elapsed || 0));
      const endedAt = new Date();
      const callData = {
        leadId: businessLeadId,
        leadName: activeLead.name || activeLead.school || '',
        leadMobile: activeLead.mobile || activeLead.phoneNumber || '',
        contactPerson: activeLead.contactPerson || '',
        category: activeLead.category || 'School',
        calledNumber: activeLead.mobile || activeLead.phoneNumber || '',
        callMethod: 'local_sim',
        callStatus: 'ended',
        outcome: selectedOutcome,
        duration: durationSeconds,
        notes: callRemarks || '',
        remarks: callRemarks || '',
        interestedIn: selectedCategories || [],
        agentUsername: user?.username || 'admin',
        agentName: user?.fullName || user?.name || 'Admin',
        startedAt: new Date(endedAt.getTime() - durationSeconds * 1000).toISOString(),
        endedAt: endedAt.toISOString(),
      };

      await leadService.updateLead(businessLeadId, leadPayload);
      await callService.create(callData);

      const updatedLead = {
        ...activeLead,
        status: selectedOutcome,
        tcNextRefollowupDate: selectedFollowUpDate,
        notes: leadPayload.notes,
      };
      setActiveLead(updatedLead);
      setLeadStatus(selectedOutcome);
      setRemarks(callRemarks || '');
      setQueue(current => current.map(lead =>
        getBusinessLeadId(lead) === businessLeadId ? { ...lead, ...updatedLead } : lead
      ));
      await Promise.all([loadCallHistory(), loadCallStats(), loadLeads(true)]);
      showToast(`Outcome, remarks and next follow-up saved: ${selectedOutcome}`, 'success');
      setShowOutcome(false);
    } catch (error) {
      console.error('Failed to save outcome:', error);
      showToast(`Outcome could not be saved: ${error?.message || 'Please try again.'}`, 'error');
    } finally {
      setSavingOutcome(false);
    }
  };

  // Refs let loadLeads keep a STABLE identity (the old version depended on `activeLead`,
  // so every lead click / first load re-created it and re-fired the 500-lead download).
  const activeLeadRef = useRef(null);
  const queueLenRef = useRef(0);
  const segmentPickedRef = useRef(false);
  useEffect(() => { activeLeadRef.current = activeLead; }, [activeLead]);

  const applyLeadsResponse = useCallback((response) => {
    if (!response || !Array.isArray(response.content)) return;
    const leads = response.content.map(normalizeLead);
    queueLenRef.current = leads.length;
    setQueue(leads);
    setFollowUps(leads.filter(l => l.isFollowUp).map(l => ({
      id: getBusinessLeadId(l) || l._id || l.id,
      lead: l.name,
      date: formatFollowupDate(l.nextFollowUp || l.nextVisit || 'Pending'),
      time: '',
      type: l.status === 'Call Back' ? 'Call Back' : 'Follow-up',
      note: getReadableFollowupNote(l),
      status: l.status || 'Pending',
    })));

    if (leads.length > 0 && !activeLeadRef.current) {
      activeLeadRef.current = leads[0];
      setActiveLead(leads[0]);
      setLeadStatus(leads[0].status || 'New');
    }

    // First load only: open the tab that really contains leads (New Leads preferred).
    if (!segmentPickedRef.current && leads.length > 0) {
      segmentPickedRef.current = true;
      const has = (g) => leads.some(l => getQueueGroup(l) === g);
      const firstWithLeads = ['New Leads', 'Follow-ups', 'No Response'].find(has);
      if (firstWithLeads) setQueueSegment(firstWithLeads);
    }
  }, []);

  // force=true -> skip the 15s cache (used after saving an outcome / pressing refresh).
  // Cached leads are painted instantly; fresh leads replace them when they arrive.
  const loadLeads = useCallback(async (force = false) => {
    try {
      if (queueLenRef.current === 0) setLoading(true);
      await swr('callpanel-leads', () => leadService.getLeads(0, 500, '', '', '', ''), {
        ttl: 15000,
        force,
        onData: (response) => { applyLeadsResponse(response); setLoading(false); },
      });
    } catch (error) {
      console.error('Failed to load leads:', error);
      showToast('Failed to load leads: ' + error.message, 'error');
    } finally { setLoading(false); }
  }, [applyLeadsResponse]);

  const loadCallHistory = useCallback(async () => {
    try {
      const calls = await callService.getMyCalls();
      if (calls && Array.isArray(calls)) {
        setCallHistory(calls.map(call => ({
          id: call.id || `call-${Math.random().toString(36).substr(2, 9)}`,
          leadId: call.leadId || '',
          name: call.leadName || 'Unknown',
          mobile: call.leadMobile || '',
          contactPerson: call.contactPerson || '',
          category: call.category || '',
          status: call.outcome || call.callStatus || 'Completed',
          time: call.startedAt ? new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          duration: call.duration ? fmtTime(call.duration) : '00:00',
          notes: call.notes || '',
          outcome: call.outcome || call.callStatus || 'Completed',
          endTime: call.endedAt ? new Date(call.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          initials: call.leadName?.split(' ').map(w => w[0]).join('') || '??',
        })));
      }
    } catch (error) {
      console.error('Failed to load call history:', error);
    }
  }, []);

  const loadCallStats = useCallback(async () => {
    try {
      if (typeof callService.getStats !== 'function') return;
      const stats = await callService.getStats();
      if (stats) {
        setCallStats({
          totalCalls: Number(stats.totalCalls || 0),
          answered: Number(stats.answered || 0),
          notAnswered: Number(stats.notAnswered || 0),
          interested: Number(stats.interested || 0),
          notInterested: Number(stats.notInterested || 0),
          talkSecs: Number(stats.talkSecs || 0),
        });
      }
    } catch (error) {
      console.warn('Failed to load call statistics:', error);
    }
  }, []);

  const loadActivityHistory = useCallback(async (lead) => {
    if (!lead) { setActivityHistory([]); return; }
    try {
      const id = getBusinessLeadId(lead);
      if (!id) { setActivityHistory([]); return; }
      const history = await leadService.getLeadHistory(id);
      setActivityHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Failed to load lead activity history:', error);
      setActivityHistory([]);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    loadCallHistory();
    loadCallStats();
  }, [loadLeads, loadCallHistory, loadCallStats]);

  useEffect(() => {
    loadActivityHistory(activeLead);
  }, [activeLead, loadActivityHistory]);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

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

  
const makeCall = async (number) => {
  if (!canAgentCall()) {
    showToast(
      'You are not available to make calls. Please change status to Available.',
      'error'
    );
    return;
  }

  if (!number) {
    showToast('No number to call.', 'error');
    return;
  }

  try {
    // Do not mark the call as active before the bridge confirms it.
    setCallState('connecting');
    setIsCallActive(false);
    setElapsed(0);
    wasConnectedRef.current = false;
    lastSeenStatusRef.current = '';

    // The backend takes the telecaller from the login token, so the call always goes to
    // THIS telecaller's own Windows companion.
    const result = await localSimCallService.call({
      leadId: getBusinessLeadId(activeLead),
      leadName: activeLead?.name || 'Unknown',
      leadMobile: number,
    });

    if (!result?.requestId) {
      throw new Error('The CRM server did not accept the call request.');
    }
    setCurrentCallId(result.requestId);

    showToast(`Calling ${activeLead?.name || number} from your phone...`, 'info');
  } catch (error) {
    console.error('Local SIM call request failed:', error);

    showToast(
      'Call request failed: ' + error.message,
      'error'
    );

    setCallState('idle');
    setIsCallActive(false);
    setCurrentCallId(null);
  }
};


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
    setFollowUpDate(lead.tcNextRefollowupDate || '');
    setFollowUpNote(getReadableFollowupNote(lead) === 'Follow-up scheduled' ? '' : getReadableFollowupNote(lead));
    setInterestedIn([]);
    setDetailTab('Customer Details');
    setShowCallInit(true);
  };

  const selectLeadForPanel = (lead) => {
    setActiveLead(lead);
    setLeadStatus(lead.status || 'New');
    setDetailTab('Customer Details');
    setOutcome(lead.status && ['Interested','Not Interested','Call Back','No Answer','Converted','In Progress'].includes(lead.status) ? lead.status : 'Interested');
    setRemarks('');
    setFollowUpDate(lead.tcNextRefollowupDate || '');
    setFollowUpNote(getReadableFollowupNote(lead) === 'Follow-up scheduled' ? '' : getReadableFollowupNote(lead));
    setNotes(''); // editor is for the next UP entry, not the imported JSON payload
  };


  // Opened from Follow-ups / Leads with { lead, action }: select THAT lead (and start the call).
  const handledNavRef = useRef(null);
  useEffect(() => {
    const target = navigationState?.lead;
    if (!target || handledNavRef.current === navigationState) return;
    if (loading && queue.length === 0) return; // wait for the first lead load
    handledNavRef.current = navigationState;

    const wanted = [navigationState.leadId, target.leadId, target.businessLeadId, target._id, target.id]
      .filter(Boolean).map(String);
    const sameLead = (l) => [getBusinessLeadId(l), l.leadId, l.businessLeadId, l._id, l.id]
      .filter(Boolean).map(String).some(k => wanted.includes(k));

    const openLead = (lead) => {
      setQueueSegment(getQueueGroup(lead));
      selectLeadForPanel(lead);
      if (navigationState.action === 'startCall') startCall(lead);
    };

    const found = queue.find(sameLead);
    if (found) { openLead(found); return; }

    // Not in the loaded queue (e.g. beyond the first 500) -> fetch it by business leadId.
    (async () => {
      try {
        const businessId = getBusinessLeadId(target) || wanted[0];
        const fresh = await leadService.getLead(businessId);
        const lead = normalizeLead(fresh);
        setQueue(current => current.some(sameLead) ? current : [lead, ...current]);
        openLead(lead);
      } catch (error) {
        showToast(`Could not open that lead: ${error?.message || 'Please try again.'}`, 'error');
      }
    })();
  }, [navigationState, queue, loading]);

  const handleInitiateCall = async (number) => {
    if (!canAgentCall()) {
      showToast('You are not available to make calls. Please change status to Available.', 'error');
      return;
    }
    await makeCall(number);
  };

  const finaliseCall = async () => {
    // A call is in flight: ask the phone (through the companion) to hang up. The panel
    // goes idle when the backend reports the call as finished (see the polling effect).
    if (currentCallId && callState !== 'idle') {
      try {
        const result = await localSimCallService.hangup(currentCallId);
        if (result?.status) applyStatusRef.current(result);
        else showToast('Ending call...', 'info');
      } catch (error) {
        showToast('Could not end the call: ' + error.message, 'error');
      }
      return;
    }

    clearInterval(timerRef.current);
    setLastCallDuration(elapsed);
    setCallState('idle');
    setIsCallActive(false);
    setCurrentCallId(null);
    setShowOutcome(false);
  };

  // Sends HOLD / RESUME / MUTE / UNMUTE to the phone (CRM -> backend -> Windows companion -> Bluetooth -> phone)
  // and waits for the phone to confirm. Returns true only when the phone confirmed it.
  const runCallControl = async (action) => {
    if (!currentCallId) { showToast('No active call to control.', 'error'); return false; }
    if (controlBusy) return false;
    setControlBusy(true);
    try {
      const res = await localSimCallService[action.toLowerCase()](currentCallId);
      // Already in the requested state: the backend sends nothing to the phone.
      if (!res?.followUpRequestId) return true;
      const result = await localSimCallService.waitForAction(res.followUpRequestId);
      if (!result.ok) {
        showToast(`${action} failed: ${result.message}`, 'error');
        return false;
      }
      return true;
    } catch (error) {
      showToast(error?.message || `${action} failed.`, 'error');
      return false;
    } finally {
      setControlBusy(false);
    }
  };

  const handleMute = async () => {
    const action = isMuted ? 'UNMUTE' : 'MUTE';
    if (await runCallControl(action)) {
      setIsMuted(action === 'MUTE');
      showToast(action === 'MUTE' ? 'Microphone muted.' : 'Microphone unmuted.', 'info');
    }
  };

  const handleHold = async () => {
    const action = callState === 'onhold' ? 'RESUME' : 'HOLD';
    if (await runCallControl(action)) {
      setCallState(action === 'HOLD' ? 'onhold' : 'connected');
      showToast(action === 'HOLD' ? 'Call put on hold.' : 'Call resumed.', 'info');
    }
  };

  const handleSaveDisposition = async () => {
    if (!activeLead) { showToast('Select a lead first.', 'error'); return; }
    if (!followUpDate) { showToast('Please select the next follow-up date and time.', 'error'); return; }
    if (!followUpNote.trim()) { showToast('Please enter the follow-up note.', 'error'); return; }
    const selectedDate = new Date(followUpDate);
    if (Number.isNaN(selectedDate.getTime())) { showToast('Please enter a valid follow-up date and time.', 'error'); return; }
    if (selectedDate.getTime() <= Date.now()) { showToast('Follow-up date and time must be in the future.', 'error'); return; }

    const businessLeadId = getBusinessLeadId(activeLead);
    if (!businessLeadId) {
      showToast('Business Lead ID is missing. Refresh the lead list and try again.', 'error');
      return;
    }

    setSavingOutcome(true);
    try {
      // Preserve all imported Excel columns and the existing UP1...UPn history.
      const existingRecord = parseLeadUpdateRecord(activeLead);
      const nextRecord = { ...existingRecord };
      nextRecord.TC_NEXT_FOLLOWUP_NOTE = followUpNote.trim();

      const leadPayload = {
        status: outcome,
        // Existing Spring LeadRequest accepts this String field and persists it to MongoDB.
        tcNextRefollowupDate: followUpDate,
        notes: JSON.stringify(nextRecord),
      };

      const durationSeconds = Math.max(0, Number(lastCallDuration || elapsed || 0));
      const endedAt = new Date();
      const callData = {
        leadId: businessLeadId,
        leadName: activeLead.name || activeLead.school || '',
        leadMobile: activeLead.mobile || activeLead.phoneNumber || '',
        contactPerson: activeLead.contactPerson || '',
        category: activeLead.category || 'School',
        calledNumber: activeLead.mobile || activeLead.phoneNumber || '',
        callMethod: 'local_sim',
        callStatus: 'ended',
        outcome,
        duration: durationSeconds,
        notes: remarks.trim(),
        remarks: remarks.trim(),
        sentiment,
        interestedIn,
        agentUsername: user?.username || 'admin',
        agentName: user?.fullName || user?.name || 'Admin',
        startedAt: new Date(endedAt.getTime() - durationSeconds * 1000).toISOString(),
        endedAt: endedAt.toISOString(),
      };

      // Both writes must succeed before showing a success message.
      // Existing backend has separate Lead and Call endpoints (not one transaction).
      const [leadResponse, callResponse] = await Promise.all([
        leadService.updateLead(businessLeadId, leadPayload),
        callService.create(callData),
      ]);

      const savedLead = leadResponse?.data || leadResponse || {};
      const updatedLead = {
        ...activeLead,
        ...savedLead,
        status: outcome,
        tcNextRefollowupDate: followUpDate,
        notes: leadPayload.notes,
      };

      setActiveLead(updatedLead);
      setQueue(current => current.map(lead =>
        getBusinessLeadId(lead) === businessLeadId ? { ...lead, ...updatedLead } : lead
      ));
      setLeadStatus(outcome);
      setFollowUps(current => {
        const withoutCurrent = current.filter(item => String(item.id) !== String(businessLeadId));
        return [{
          id: businessLeadId,
          lead: updatedLead.name || updatedLead.school || 'Lead',
          date: formatFollowupDate(followUpDate),
          time: '',
          type: outcome,
          note: followUpNote.trim(),
          status: 'Pending',
        }, ...withoutCurrent];
      });

      await Promise.all([loadCallHistory(), loadCallStats()]);
      loadLeads(true); // refresh in the background, do not block the UI
      setFollowUpDate('');
      setFollowUpNote('');
      setRemarks('');
      showToast('Call outcome, remarks and next follow-up saved successfully.', 'success');
    } catch (error) {
      console.error('Failed to save call disposition:', error);
      showToast(`Save failed: ${error?.message || 'Please try again.'}`, 'error');
    } finally {
      setSavingOutcome(false);
    }
  };

  const handleSaveNotes = async () => {
    const updateText = notes.trim();
    if (!updateText) { showToast('Please enter an update.', 'error'); return; }
    const businessLeadId = getBusinessLeadId(activeLead);
    if (!businessLeadId) {
      showToast('Business Lead ID is missing. Refresh the lead list and select the lead again.', 'error');
      return;
    }
    try {
      // Merge UPn into the existing imported JSON; do not discard Excel columns.
      const record = parseLeadUpdateRecord(activeLead);
      // Include imported top-level up1..up5 fields and UPn values inside notes JSON.
      const existingNumbers = getLeadUpdates(activeLead).map(item => item.number);
      const nextNumber = (existingNumbers.length ? Math.max(...existingNumbers) : 0) + 1;
      const updateKey = `UP${nextNumber}`;
      const updatedNotes = JSON.stringify({ ...record, [updateKey]: updateText });
      await leadService.updateLead(businessLeadId, { notes: updatedNotes });

      const updatedLead = { ...activeLead, notes: updatedNotes };
      setActiveLead(updatedLead);
      setQueue(current => current.map(lead => getBusinessLeadId(lead) === businessLeadId ? { ...lead, notes: updatedNotes } : lead));
      setNotes('');
      stopVoiceRecognition();
      showToast(`Saved successfully as ${updateKey}.`, 'success');
      // Update follow-up preview from the same lead without displaying raw JSON.
      setFollowUps(current => current.map(item => item.id === businessLeadId ? { ...item, note: updateText } : item));
    } catch (error) {
      console.error('Failed to save UP update:', error);
      showToast(`Update could not be saved: ${error.message}`, 'error');
    }
  };

  const stopVoiceRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try { recognition.stop(); } catch (error) { /* already stopped */ }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startVoiceRecognition = () => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      showToast('Voice typing is not supported in this browser. Please use the latest Google Chrome.', 'error');
      return;
    }
    if (!activeLead) {
      showToast('Select a lead before recording a voice update.', 'error');
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (error) { /* ignore */ }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
      showToast(`Listening (${voiceLanguage})… speak clearly.`, 'info');
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || '';
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        setNotes((previous) => {
          const prefix = previous.trim();
          return `${prefix ? `${prefix} ` : ''}${finalText.trim()}`.slice(0, 2000);
        });
      }
      setInterimTranscript(interimText);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript('');
      const messages = {
        'not-allowed': 'Microphone permission is blocked. Allow microphone access for localhost and try again.',
        'audio-capture': 'No microphone was detected. Connect or select a microphone and try again.',
        'network': 'Speech recognition network error. Check your internet connection and try again.',
        'no-speech': 'No speech was detected. Press Start Speaking and try again.',
      };
      showToast(messages[event.error] || `Voice recognition error: ${event.error}`, 'error');
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      setIsListening(false);
      showToast(`Could not start microphone: ${error.message}`, 'error');
    }
  };

  useEffect(() => () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (error) { /* ignore during unmount */ }
      recognitionRef.current = null;
    }
  }, []);

  const handleCopyMobile = () => {
    navigator.clipboard?.writeText(activeLead?.mobile || '').catch(()=>{});
    showToast('📋 Mobile number copied!');
  };

  const refreshQueue = async () => {
    await loadLeads(true);
    showToast('Queue refreshed!', 'info');
  };

  const filteredQueue = queue.filter(l =>
    l.name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
    l.mobile?.includes(queueSearch) ||
    (l.contactPerson && l.contactPerson.toLowerCase().includes(queueSearch.toLowerCase()))
  );

  const callStateLabel = { connecting:'Sending call request…', connected:'Call Connected', ringing:'Ringing…', onhold:'On Hold (phone)', muted:'Muted (UI only)', ended:'Call Ended', idle:'Idle' };
  const canControl = (callState === 'connected' || callState === 'muted' || callState === 'onhold') && canAgentCall();

  const totalCalls = callStats.totalCalls || todaySummary.total || callHistory.length;
  const answeredCalls = callStats.answered || todaySummary.answered;
  const interestedCalls = callStats.interested || callHistory.filter(c => c.outcome === 'Interested').length;
  const convertedCalls = callHistory.filter(c => c.outcome === 'Converted').length;
  const talkSeconds = callStats.talkSecs || todaySummary.talkSecs || callHistory.reduce((sum, c) => sum + (Number(c.durationSeconds) || 0), 0);
  const answerRate = totalCalls ? Math.round((answeredCalls / totalCalls) * 100) : 0;
  const interestedRate = totalCalls ? Math.round((interestedCalls / totalCalls) * 100) : 0;
  const convertedRate = totalCalls ? Math.round((convertedCalls / totalCalls) * 100) : 0;

  const queueCounts = { 'Follow-ups': 0, 'New Leads': 0, 'No Response': 0 };
  queue.forEach(l => { const g = getQueueGroup(l); if (queueCounts[g] !== undefined) queueCounts[g] += 1; });

  const segmentLeads = filteredQueue.filter(lead => getQueueGroup(lead) === queueSegment);

  const renderStatus = (status) => {
    const key = status || 'New';
    return <span className="ref-status" style={STATUS_COLORS[key] || STATUS_COLORS.New}>{key}</span>;
  };

  return (
    <div className="cp-page ref-call-panel">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <header className="ref-header">
        <div className="ref-brand">
          <div className="ref-brand-icon"><PhoneCall size={24} /></div>
          <div>
            <h1>CALL PANEL</h1>
            <p>Telecaller Workspace</p>
          </div>
        </div>
        <div className="ref-header-actions">
          <AgentStatusSelector status={agentStatus} onChange={setAgentStatus} isCallActive={isCallActive} />
          <div className="ref-user-chip">
            <Avatar initials={user?.fullName?.split(' ').map(w => w[0]).join('') || user?.username?.slice(0,2) || 'TC'} name={user?.fullName || user?.username || 'Telecaller'} size={38} />
            <div><strong>{user?.fullName || user?.username || 'Telecaller'}</strong><span>Telecaller</span></div>
          </div>
        </div>
      </header>

      <section className="ref-performance">
        <div className="ref-section-title">TODAY'S PERFORMANCE</div>
        <div className="ref-performance-row">
          <div className="ref-metric"><span className="metric-icon blue">⌕</span><div><small>TOTAL CALLS</small><b>{totalCalls}</b><em>+{Math.max(0, totalCalls - Math.max(0, totalCalls - 12))} today</em></div></div>
          <div className="ref-metric"><span className="metric-icon green">✓</span><div><small>ANSWERED</small><b>{answeredCalls}</b><em>{answerRate}%</em></div></div>
          <div className="ref-metric"><span className="metric-icon yellow">★</span><div><small>INTERESTED</small><b>{interestedCalls}</b><em>{interestedRate}%</em></div></div>
          <div className="ref-metric"><span className="metric-icon purple">♟</span><div><small>CONVERTED</small><b>{convertedCalls}</b><em>{convertedRate}%</em></div></div>
          <div className="ref-metric"><span className="metric-icon orange">◷</span><div><small>TALK TIME</small><b>{fmtTime(talkSeconds)}</b><span className="metric-sub">Total</span></div></div>
          <div className="ref-agent-status-card"><small>AGENT STATUS</small><div><span className="status-dot-sm dot-green"></span><strong>{agentStatus}</strong></div><span>Since {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><button onClick={() => setAgentStatus(agentStatus === 'Available' ? 'Away' : 'Available')}>Change Status</button></div>
        </div>
      </section>

      <StatusWarningBanner status={agentStatus} />

      <div className="ref-main-grid">
        <section className="ref-card ref-queue-card">
          <div className="ref-card-title-row"><h2>CALL QUEUE <span>({queue.length})</span></h2><button className="ref-filter-btn" onClick={refreshQueue}><RefreshCw size={16} /></button></div>
          <div className="ref-search"><span>⌕</span><input placeholder="Search leads..." value={queueSearch} onChange={e => setQueueSearch(e.target.value)} /></div>
          <div className="ref-queue-tabs">
            {[
              ['Follow-ups', queueCounts['Follow-ups'], 'red'],
              ['New Leads', queueCounts['New Leads'], 'green'],
              ['No Response', queueCounts['No Response'], 'orange']
            ].map(([label,count,tone]) => <button key={label} className={queueSegment === label ? 'active' : ''} onClick={() => setQueueSegment(label)}>{label} <span className={`count ${tone}`}>{count}</span></button>)}
          </div>
          <div className="ref-queue-list">
            {loading ? <div className="cp-empty">Loading leads...</div> : segmentLeads.length === 0 ? <div className="cp-empty">No leads found.</div> : segmentLeads.map(lead => (
              <div key={lead.id} className={`ref-lead-row ${activeLead?.id === lead.id ? 'selected' : ''}`} onClick={() => selectLeadForPanel(lead)}>
                <Avatar initials={lead.initials} name={lead.name} size={40} />
                <div className="ref-lead-main"><strong>{lead.name}</strong><span>{lead.contactPerson || '--'}</span><small>☎ {lead.mobile || 'N/A'}</small></div>
                <div className="ref-lead-side"><span className={`ref-queue-state ${getQueueGroup(lead) === 'Follow-ups' ? 'follow' : getQueueGroup(lead) === 'No Response' ? 'no-response' : 'new'}`}>{getQueueGroup(lead) === 'Follow-ups' ? 'Follow-up' : getQueueGroup(lead) === 'No Response' ? 'No Response' : 'New'}</span><button onClick={e => {e.stopPropagation(); startCall(lead)}} disabled={!canAgentCall()}><PhoneCall size={18} /></button></div>
              </div>
            ))}
          </div>
          <button className="ref-load-more" onClick={refreshQueue}>Refresh Leads <span>⟳</span></button>
        </section>

        <section className="ref-card ref-active-card">
          <div className="ref-card-title-row"><h2>ACTIVE CALL</h2><span className={`ref-live ${callState === 'connected' ? 'on' : ''}`}><i></i>{callState === 'idle' ? 'Ready' : `${callStateLabel[callState]}${isMuted ? ' • Muted' : ''}`}</span></div>
          <div
            title={bridgeHealth.message || ''}
            style={{
              margin: '0 0 10px', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: bridgeHealth.state === 'READY' ? '#dcfce7' : bridgeHealth.state === 'UNKNOWN' ? '#f3f4f6' : '#fee2e2',
              color: bridgeHealth.state === 'READY' ? '#15803d' : bridgeHealth.state === 'UNKNOWN' ? '#6b7280' : '#b91c1c',
            }}
          >
            {bridgeHealth.state === 'READY' && 'Phone bridge ready - calls will dial from your phone'}
            {bridgeHealth.state === 'PHONE_NOT_CONNECTED' && 'Companion online, but your phone is not connected over Bluetooth'}
            {bridgeHealth.state === 'OFFLINE' && 'Windows companion is offline - open IndoCRM Companion on your PC'}
            {bridgeHealth.state === 'UNKNOWN' && (bridgeHealth.message || 'Checking phone bridge...')}
          </div>
          <div className="ref-active-body">
            <div className="ref-active-identity">
              <Avatar initials={activeLead?.initials} name={activeLead?.name || 'Lead'} size={52} />
              <h3>{activeLead?.name || 'No lead selected'}</h3>
              <span>{activeLead?.contactPerson || '--'}</span>
              <span>☎ {activeLead?.mobile || 'No number'}</span>
              <strong className={callState === 'connected' ? 'connected' : ''}><i></i>{callState === 'connected' ? 'CONNECTED' : callState === 'ringing' ? 'RINGING' : callState === 'connecting' ? 'REQUEST PENDING' : 'READY'}</strong>
              <div className="ref-active-timer">{fmtTime(elapsed)}</div>
            </div>
            <div className="ref-call-controls">
              <button onClick={handleMute} disabled={!canControl || controlBusy}>{isMuted ? <MicOff size={18}/> : <Mic size={18}/>}<span>{isMuted ? 'Unmute' : 'Mute'}</span></button>
              <button onClick={handleHold} disabled={!canControl || controlBusy}>{callState === 'onhold' ? <Play size={18}/> : <Pause size={18}/>}<span>{callState === 'onhold' ? 'Resume' : 'Phone Hold'}</span></button>
              <button className="end" onClick={finaliseCall} disabled={callState === 'idle'}><PhoneOff size={18}/><span>End Call</span></button>
            </div>
          </div>
          <div className="ref-recording"><span><i></i> REC</span><span>Not recording (recording integration unavailable)</span><button disabled>Recording unavailable</button></div>
          <div className="ref-current-number"><span>☎</span><div><small>Current Number</small><strong>{activeLead?.mobile || '--'}</strong></div><button onClick={handleCopyMobile}>⧉</button></div>
        </section>

        <section className="ref-card ref-disposition-card">
          <h2>CALL DISPOSITION</h2>
          <div className="ref-form-group"><label>Outcome <b>*</b></label><select value={outcome} onChange={e => setOutcome(e.target.value)}>{['Interested','Not Interested','Call Back','No Answer','Converted','In Progress'].map(o => <option key={o}>{o}</option>)}</select></div>
          <div className="ref-form-group"><label>Interested In</label><div className="ref-check-row">{['School','College','Both'].map(item => <label key={item}><input type="checkbox" checked={interestedIn.includes(item)} onChange={() => setInterestedIn(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item])}/>{item}</label>)}</div></div>
          <div className="ref-form-group"><label>Customer Sentiment</label><div className="ref-sentiments">{[['😊','Positive'],['😐','Neutral'],['😡','Negative']].map(([icon,label]) => <button key={label} className={sentiment === label ? 'active' : ''} onClick={() => setSentiment(label)}><span>{icon}</span>{label}</button>)}</div></div>
          <div className="ref-form-group"><label>Next Follow-up Date & Time *</label><input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} required /></div>
          <div className="ref-form-group"><label>Follow-up Note *</label><textarea rows={2} maxLength={1000} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="What should be discussed in the next follow-up?" required /></div>
          <div className="ref-form-group"><label>Remarks</label><textarea rows={4} maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Type remarks about this call..."/><small>{remarks.length}/500</small></div>
          <button className="ref-save-outcome" onClick={handleSaveDisposition} disabled={savingOutcome || !activeLead}>{savingOutcome ? 'Saving...' : 'SAVE OUTCOME & CONTINUE'}</button>
        </section>
      </div>

      <section className="ref-bottom-card">
        <div className="ref-detail-tabs">
          {['Customer Details','Updates','Call History','Follow-ups'].map(tab => <button key={tab} className={detailTab === tab ? 'active' : ''} onClick={() => setDetailTab(tab)}>{tab}{tab === 'Follow-ups' && followUps.length ? ` (${followUps.length})` : ''}</button>)}
        </div>
        <div className="ref-bottom-grid">
          <div className="ref-customer-panel">
            {activeLead ? <>
              <div className="ref-info-col">
                {[['Lead ID', activeLead.leadId || activeLead.id],['Organization', activeLead.organization || activeLead.name],['Contact Person', activeLead.contactPerson || '--'],['Mobile', activeLead.mobile || '--'],['Email', activeLead.email || '--']].map(([k,v]) => <div className="ref-info-row" key={k}><span>{k}</span><strong>{v}</strong></div>)}
              </div>
              <div className="ref-info-col">
                {[['District', activeLead.district || '--'],['Area', activeLead.area || '--'],['Category', activeLead.category || 'School'],['Source', activeLead.source || '--'],['Campaign', activeLead.campaign || '--']].map(([k,v]) => <div className="ref-info-row" key={k}><span>{k}</span><strong>{v}</strong></div>)}
              </div>
            </> : <div className="cp-empty">Select a lead to view customer details.</div>}
          </div>

          <div className="ref-update-panel">
            {detailTab === 'Customer Details' && <>
              <div className="ref-panel-title">Voice Update</div>
              <div className="ref-voice-controls" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',margin:'8px 0'}}>
                <select aria-label="Voice recognition language" value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)} disabled={isListening} style={{padding:'8px',border:'1px solid #d1d5db',borderRadius:6}}>
                  <option value="ta-IN">Tamil</option>
                  <option value="en-IN">English (India)</option>
                 
                </select>
                {!isListening
                  ? <button className="ref-outline-btn" onClick={startVoiceRecognition}><Mic size={15}/> Start Speaking</button>
                  : <button className="ref-outline-btn" onClick={stopVoiceRecognition} style={{borderColor:'#dc2626',color:'#dc2626'}}><MicOff size={15}/> Stop Listening</button>}
              </div>
              {isListening && <p role="status" style={{color:'#b91c1c',fontSize:12,margin:'4px 0'}}>● Listening… speak now</p>}
              {interimTranscript && <p style={{fontSize:12,color:'#64748b',margin:'4px 0'}}>Recognising: {interimTranscript}</p>}
              <p className="ref-update-hint">Voice text is added to the Updates editor. Review or edit it, then save as the next UP entry.</p>
              <button className="ref-view-all" onClick={() => setDetailTab('Updates')}>Open Updates to review and save</button>
            </>}
            {detailTab === 'Updates' && <div className="ref-updates-view">
              <div className="ref-panel-title">Voice Update</div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',margin:'6px 0 10px'}}>
                <select aria-label="Voice recognition language" value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)} disabled={isListening} style={{padding:'8px',border:'1px solid #d1d5db',borderRadius:6}}>
                  <option value="ta-IN">Tamil</option><option value="en-IN">English (India)</option><option value="hi-IN">Hindi</option>
                </select>
                {!isListening
                  ? <button className="ref-outline-btn" onClick={startVoiceRecognition}><Mic size={15}/> Start Speaking</button>
                  : <button className="ref-outline-btn" onClick={stopVoiceRecognition} style={{borderColor:'#dc2626',color:'#dc2626'}}><MicOff size={15}/> Stop Listening</button>}
              </div>
              {isListening && <p role="status" style={{color:'#b91c1c',fontSize:12,margin:'4px 0'}}>● Listening… speak now</p>}
              {interimTranscript && <p style={{fontSize:12,color:'#64748b',margin:'4px 0'}}>Recognising: {interimTranscript}</p>}
              <div className="ref-panel-title">Updates <span>{getLeadUpdates(activeLead).length} saved</span></div>
              <div className="ref-updates-list">
                {getLeadUpdates(activeLead).length ? getLeadUpdates(activeLead).map((item) => (
                  <article className="ref-up-item" key={item.number}>
                    <strong>{item.label}</strong><p>{item.value}</p>
                  </article>
                )) : <p className="ref-updates-empty">No UP updates have been uploaded for this lead yet.</p>}
              </div>
              <div className="ref-up-editor">
                <label htmlFor="telecaller-new-update">Add next update</label>
                <textarea id="telecaller-new-update" value={notes} onChange={e => setNotes(e.target.value)} maxLength={2000} placeholder="Enter the latest customer update..." rows={3}/>
                <div className="ref-note-footer"><span>{notes.length}/2000 · Next: UP{getLeadUpdates(activeLead).reduce((max, item) => Math.max(max, item.number), 0) + 1}</span><button onClick={handleSaveNotes} disabled={!activeLead || !notes.trim()}>Save Update</button></div>
              </div>
            </div>}
            {detailTab === 'Call History' && <div className="ref-scroll-panel"><strong>Call History</strong>{callHistory.slice(0,6).map((c,i)=><div className="ref-call-history-row" key={c.id || i}><span>{c.time || c.endTime}</span><b>{c.duration}</b>{renderStatus(c.status)}<button onClick={() => {const lead = queue.find(l => l.id === c.leadId || l._id === c.leadId) || {...c}; startCall(lead)}}><PhoneCall size={15}/></button></div>)}{callHistory.length === 0 && <p>No call history yet.</p>}</div>}
            {detailTab === 'Follow-ups' && <div className="ref-scroll-panel"><strong>Upcoming Follow-ups</strong>{followUps.length ? followUps.slice(0,6).map((f,i)=><div className="ref-followup-row" key={f.id || i}><div><b>{f.lead || 'Lead'} · {f.date}{f.time ? ` | ${f.time}` : ''}</b><span>{f.note || 'Follow-up scheduled'}</span></div><em>{f.type || f.status || 'Pending'}</em></div>) : <p>No follow-ups scheduled.</p>}</div>}
          </div>

          <div className="ref-mini-history">
            <div className="ref-panel-title">Call History</div>
            {callHistory.slice(0,3).map((c,i)=><div className="ref-mini-row" key={c.id || i}><div><b>{c.time || c.endTime || '--'}</b><span>{c.duration}</span></div>{renderStatus(c.status)}</div>)}
            <button className="ref-view-all" onClick={() => setDetailTab('Call History')}>View All History</button>
          </div>
          <div className="ref-mini-history">
            <div className="ref-panel-title">Follow-ups</div>
            {followUps.slice(0,2).map((f,i)=><div className="ref-mini-follow" key={f.id || i}><b>{f.lead || 'Lead'} · {f.date}</b><span>{f.note || 'Follow-up scheduled'}</span><em>{f.type || f.status || 'Pending'}</em></div>)}
            <button className="ref-view-all" onClick={() => setDetailTab('Follow-ups')}>View All Follow-ups</button>
          </div>
        </div>
      </section>

      {showCallInit && (
        <CallInitiationModal
          lead={activeLead}
          onClose={() => setShowCallInit(false)}
          onCall={handleInitiateCall}
          canCall={canAgentCall()}
        />
      )}

      {showOutcome && (
        <OutcomeModal lead={activeLead} onClose={() => setShowOutcome(false)} onSave={handleSaveOutcome} loading={savingOutcome} />
      )}
    </div>
  );
};

export default CallPanel;