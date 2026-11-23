// src/pages/Demo/Demo.jsx 
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'; 
import './Demo.css'; 
import leadService from '../../services/leadService'; 
import demoService from '../../services/demoService'; 
import { 
  FiMonitor, FiPlus, FiSearch, FiCalendar, FiClock, 
  FiVideo, FiPhone, FiMapPin, FiLink, FiCopy, 
  FiExternalLink, FiEdit2, FiTrash2, FiEye, 
  FiX, FiCheck, FiChevronLeft, FiChevronRight, 
  FiUser, FiMail, FiRefreshCw, FiZap, FiMessageCircle, 
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa'; 
 
// ─── Constants ──────────────────────────────────────────────────────────────── 
const DEMO_STATUSES = ['Scheduled', 'Live', 'Completed', 'Cancelled', 'Rescheduled']; 
const MEETING_TYPES = [ 
  { id: 'meet',   label: 'Google Meet', icon: <FiVideo size={14}/> }, 
  { id: 'office', label: 'Office Visit', icon: <FiMapPin size={14}/> }, 
  { id: 'phone',  label: 'Phone Call',   icon: <FiPhone size={14}/> }, 
]; 
const ROWS_OPTIONS = [10, 20, 50]; 
 
const AVATAR_COLORS = [ 
  '#7b1113','#2563eb','#16a34a','#7c3aed', 
  '#c2410c','#0369a1','#4338ca','#be185d', 
]; 
 
const STATUS_CONFIG = { 
  Scheduled:   { cls: 'dm-status-scheduled',   label: 'Scheduled'   }, 
  Live:        { cls: 'dm-status-live',        label: 'Live'        }, 
  Completed:   { cls: 'dm-status-completed',   label: 'Meet Completed' }, 
  Cancelled:   { cls: 'dm-status-cancelled',   label: 'Cancelled'   }, 
  Rescheduled: { cls: 'dm-status-rescheduled', label: 'Rescheduled' }, 
}; 
 
// Demo records and leads are loaded from the backend. 
 
// ─── Helpers ────────────────────────────────────────────────────────────────── 
const avatarColor = (name) => 
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]; 
 
const initials = (name) => 
  name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'; 
 
const fmtDate = (d) => { 
  if (!d) return '—'; 
  const dt = new Date(d); 
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }); 
}; 
 
const fmtTime = (t) => { 
  if (!t) return '—'; 
  const [h, m] = t.split(':'); 
  const hr = parseInt(h, 10); 
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`; 
}; 
 
 
 
const isToday = (d) => { 
  const today = new Date().toISOString().slice(0, 10); 
  return d === today; 
}; 
 
const isUpcoming = (d) => d > new Date().toISOString().slice(0, 10); 
 
// ─── Empty Demo Template ────────────────────────────────────────────────────── 
const emptyDemo = () => ({
  id: '', organization: '', contactPerson: '', leadId: '', email: '', phone: '', whatsappNumber: '',
  topic: '', date: '', time: '', duration: '60 min',
  status: 'Scheduled', meetType: 'meet', meetLink: '', notes: '', createdOn: '', timeline: [],
});

const CONTACT_OVERRIDE_STORAGE = 'demo_contact_overrides_v1';
const readContactOverrides = () => { try { const raw = localStorage.getItem(CONTACT_OVERRIDE_STORAGE); return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
const saveContactOverrides = (overrides) => { try { localStorage.setItem(CONTACT_OVERRIDE_STORAGE, JSON.stringify(overrides)); } catch {} };
const getDurationMinutes = (duration = '') => { const value = String(duration).toLowerCase().trim(); if (value.includes('2 hrs')) return 120; const match = value.match(/(\d+(?:\.\d+)?)\s*min/); return match ? Number(match[1]) : 60; };
const getDemoEndTime = (demo) => { if (!demo?.date || !demo?.time) return null; const start = new Date(`${demo.date}T${demo.time}`); if (Number.isNaN(start.getTime())) return null; return new Date(start.getTime() + getDurationMinutes(demo.duration) * 60000); };
const hasDemoEnded = (demo, now = new Date()) => { const end = getDemoEndTime(demo); return !!end && end.getTime() <= now.getTime(); }; 
 
// ─── Toast ──────────────────────────────────────────────────────────────────── 
const Toast = ({ msg, type, onClose }) => ( 
  <div className={`dm-toast dm-toast-${type}`} onClick={onClose}> 
    {type === 'success' ? <FiCheck /> : type === 'error' ? <FiX /> : <FiZap />} 
    {msg} 
  </div> 
); 
 
// ─── Status Pill ───────────────────────────────────────────────────────────── 
const StatusPill = ({ status }) => { 
  const cfg = STATUS_CONFIG[status] || { cls: '', label: status }; 
  return ( 
    <span className={`dm-status-pill ${cfg.cls}`}> 
      {status === 'Live' && <span className="dm-live-dot" />} 
      {cfg.label} 
    </span> 
  ); 
}; 
 
// ─── Join / Meeting Button ──────────────────────────────────────────────────── 
const MeetBtn = ({ demo }) => { 
  if (demo.status === 'Cancelled') return null; 
  if (demo.meetType === 'phone') { 
    return ( 
      <a href={`tel:${demo.phone}`} className="dm-join-btn"> 
        <FiPhone size={12}/> Call 
      </a> 
    ); 
  } 
  if (demo.meetType === 'office') { 
    return <span className="dm-join-btn-disabled"><FiMapPin size={12}/> In-Person</span>; 
  } 
  if (demo.meetLink) { 
    return ( 
      <a href={demo.meetLink} target="_blank" rel="noreferrer" className="dm-join-btn"> 
        <FiVideo size={12}/> Join 
      </a> 
    ); 
  } 
  return <span className="dm-join-btn-disabled"><FiVideo size={12}/> No Link</span>; 
}; 
 
// ─── Schedule / Edit Modal ──────────────────────────────────────────────────── 
const DemoFormModal = ({ initial, onSave, onClose, allDemos, leads = [] }) => { 
  const isEdit = !!initial?.id; 
  const [form, setForm] = useState(() => {
    const base = isEdit ? { ...initial } : emptyDemo();
    const overrides = readContactOverrides();
    return isEdit && initial?.id ? { ...base, ...(overrides[initial.id] || {}) } : base;
  }); 
  const [linkCopied, setLinkCopied] = useState(false); 
  const [saving, setSaving] = useState(false); 
  const [generatingLink, setGeneratingLink] = useState(false); 
  const [formError, setFormError] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(lead => {
      const name = String(lead.name || '').toLowerCase();
      const school = String(lead.school || '').toLowerCase();
      const mobile = String(lead.mobile || lead.phoneNumber || '').toLowerCase();
      const email = String(lead.email || '').toLowerCase();
      const leadId = String(lead.leadId || '').toLowerCase();
      return name.includes(q) || school.includes(q) || mobile.includes(q) || email.includes(q) || leadId.includes(q);
    });
  }, [leads, leadSearch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v })); 
 
  const handleLeadChange = (leadId) => { 
    const lead = leads.find(l => l.leadId === leadId); 
    if (!lead) { set('leadId', leadId); return; } 
    setForm(f => ({ 
      ...f, 
      leadId: lead.leadId || '', 
      organization: lead.school || lead.name || '', 
      contactPerson: lead.name || '', 
      email: lead.email || '', 
      phone: lead.mobile || lead.phoneNumber || '',
      whatsappNumber: lead.whatsappNumber || lead.whatsAppNumber || lead.whatsapp || lead.mobile || lead.phoneNumber || '',
    })); 
  }; 
 
  const handleGenerateLink = async () => { 
    if (generatingLink) return; 
    try { 
      setGeneratingLink(true); setFormError(''); 
      const data = await demoService.createMeeting(); 
      set('meetLink', data.meetingUri); 
      set('meetType', 'meet'); 
    } catch (error) { 
      if (error?.data?.authorizationUrl) { 
        const popup = window.open(error.data.authorizationUrl, 'googleMeetOAuth', 'width=600,height=700'); 
        if (!popup) setFormError('Please allow popups and click Generate Link again.'); 
        else setFormError('Complete Google authorization in the new window, then click Generate Link again.'); 
      } else { 
        setFormError(error.message || 'Unable to generate Google Meet link.'); 
      } 
    } finally { setGeneratingLink(false); } 
  }; 
 
  const handleCopyLink = () => { 
    if (!form.meetLink) return; 
    navigator.clipboard.writeText(form.meetLink).catch(() => {}); 
    setLinkCopied(true); 
    setTimeout(() => setLinkCopied(false), 2000); 
  }; 
 
  const handleSave = async () => { 
    if (!form.leadId) { setFormError('Please select a lead.'); return; } 
    if (!form.topic.trim()) { setFormError('Please enter a demo topic.'); return; } 
    if (!form.date || !form.time) { setFormError('Please select demo date and time.'); return; } 
    if (form.meetType === 'meet' && !form.meetLink) { 
      setFormError('Generate the Google Meet link before scheduling the demo.'); return; 
    } 
    try { 
      setSaving(true); setFormError(''); 
      await onSave({ ...form }); 
    } catch (error) { 
      setFormError(error.message || 'Unable to save demo.'); 
    } finally { setSaving(false); } 
  }; 
 
  return ( 
    <div className="dm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}> 
      <div className="dm-modal-box dm-modal-box-wide"> 
        <div className="dm-modal-header"> 
          <span className="dm-modal-title">{isEdit ? 'Edit Demo' : 'Schedule New Demo'}</span> 
          <button className="dm-modal-close" onClick={onClose}><FiX /></button> 
        </div> 
        <div className="dm-modal-body"> 
          <div className="dm-form"> 
 
            {/* Organization & Contact Info */} 
            <div className="dm-form-section"> 
              <div className="dm-form-section-title">Organization & Contact Information</div> 
              <div className="dm-form-group"> 
                <label>Select Lead *</label>
                <div className="dm-lead-picker">
                  <button type="button" className={`dm-lead-picker-trigger ${showLeadDropdown ? 'active' : ''}`} onClick={() => !isEdit && setShowLeadDropdown(v => !v)} disabled={isEdit}>
                    <span className="dm-lead-selected-text">
                      {form.leadId ? (() => {
                        const selected = leads.find(l => l.leadId === form.leadId);
                        return selected ? `${selected.leadId} — ${selected.school || selected.name || 'Unnamed Lead'}` : form.leadId;
                      })() : 'Select a lead from Leads'}
                    </span>
                    <FiChevronRight size={15} className={showLeadDropdown ? 'rotate-90' : ''} />
                  </button>
                  {showLeadDropdown && !isEdit && (
                    <div className="dm-lead-dropdown">
                      <div className="dm-lead-search">
                        <FiSearch size={14} />
                        <input type="text" placeholder="Search lead, name, mobile, email..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)} autoFocus />
                      </div>
                      <div className="dm-lead-options">
                        {filteredLeads.length === 0 ? <div className="dm-lead-empty">No matching leads found</div> : filteredLeads.map(lead => (
                          <button key={lead.leadId} type="button" className={`dm-lead-option ${form.leadId === lead.leadId ? 'selected' : ''}`} onClick={() => { handleLeadChange(lead.leadId); setLeadSearch(''); setShowLeadDropdown(false); }}>
                            <div className="dm-lead-option-main">
                              <strong>{lead.school || lead.name || 'Unnamed Lead'}</strong>
                              <span>{lead.name && lead.school ? lead.name : lead.leadId}</span>
                            </div>
                            <div className="dm-lead-option-meta">
                              <span>{lead.leadId}</span>
                              {(lead.mobile || lead.phoneNumber) && <span>{lead.mobile || lead.phoneNumber}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div> 
              </div> 
              <div className="dm-form-row"> 
                <div className="dm-form-group"><label>Organization Name</label><input value={form.organization} readOnly /></div> 
                <div className="dm-form-group"><label>Contact Person</label><input value={form.contactPerson} readOnly /></div> 
              </div> 
              <div className="dm-form-row"> 
                <div className="dm-form-group"><label>Lead ID</label><input value={form.leadId} readOnly /></div> 
                <div className="dm-form-group"><label>Email</label><input type="email" value={form.email} readOnly /></div> 
              </div> 
              <div className="dm-form-row">
                <div className="dm-form-group">
                  <label>Phone Number {isEdit && <span className="dm-edit-hint">(editable)</span>}</label>
                  <input type="tel" value={form.phone || ''} onChange={e => isEdit && set('phone', e.target.value)} readOnly={!isEdit} placeholder="Lead phone number" />
                </div>
                <div className="dm-form-group">
                  <label>WhatsApp Number {isEdit && <span className="dm-edit-hint">(editable)</span>}</label>
                  <input type="tel" value={form.whatsappNumber || ''} onChange={e => isEdit && set('whatsappNumber', e.target.value)} readOnly={!isEdit} placeholder="WhatsApp number for Meet link" />
                </div>
              </div> 
            </div> 
 
            {/* Demo Details */} 
            <div className="dm-form-section"> 
              <div className="dm-form-section-title">Demo Details</div> 
              <div className="dm-form-group"> 
                <label>Demo Topic</label> 
                <input value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. School ERP – Admission & Fee Module" /> 
              </div> 
              <div className="dm-form-row"> 
                <div className="dm-form-group"> 
                  <label>Demo Date *</label> 
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} /> 
                </div> 
                <div className="dm-form-group"> 
                  <label>Demo Time *</label> 
                  <input type="time" value={form.time} onChange={e => set('time', e.target.value)} /> 
                </div> 
              </div> 
              <div className="dm-form-row"> 
                <div className="dm-form-group"> 
                  <label>Duration</label> 
                  <select value={form.duration} onChange={e => set('duration', e.target.value)}> 
                    {['15 min','30 min','45 min','60 min','90 min','2 hrs'].map(d => <option key={d}>{d}</option>)} 
                  </select> 
                </div> 
              </div> 
              {isEdit && ( 
                <div className="dm-form-group"> 
                  <label>Status</label> 
                  <select value={form.status} onChange={e => set('status', e.target.value)}> 
                    {DEMO_STATUSES.map(s => <option key={s} value={s}>{s === 'Completed' ? 'Meet Completed' : s}</option>)} 
                  </select> 
                </div> 
              )} 
            </div> 
 
            {/* Meeting Details */} 
            <div className="dm-form-section"> 
              <div className="dm-form-section-title">Meeting Details</div> 
              <div className="dm-form-group"> 
                <label>Meeting Type</label> 
                <div className="dm-meeting-types"> 
                  {MEETING_TYPES.map(mt => ( 
                    <button 
                      key={mt.id} 
                      className={`dm-meeting-type-btn ${form.meetType === mt.id ? 'active' : ''}`} 
                      onClick={() => set('meetType', mt.id)} 
                      type="button" 
                    > 
                      {mt.icon} {mt.label} 
                    </button> 
                  ))} 
                </div> 
              </div> 
 
              {form.meetType === 'meet' && ( 
                <div className="dm-form-group"> 
                  <label>Google Meet Link</label> 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}> 
                    <div className="dm-meet-link-row"> 
                      <input 
                        className="dm-meet-link-input" 
                        value={form.meetLink} 
                        onChange={e => set('meetLink', e.target.value)} 
                        placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                      /> 
                    </div> 
                    <div className="dm-meet-actions"> 
                      <button className="dm-generate-btn" onClick={handleGenerateLink} type="button" disabled={generatingLink}> 
                        <FiRefreshCw size={12}/> {generatingLink ? 'Creating...' : 'Generate Link'} 
                      </button> 
                      {form.meetLink && ( 
                        <> 
                          <button className="dm-copy-btn" onClick={handleCopyLink} type="button"> 
                            {linkCopied ? <FiCheck size={12}/> : <FiCopy size={12}/>} 
                            {linkCopied ? 'Copied!' : 'Copy Link'} 
                          </button> 
                          <a href={form.meetLink} target="_blank" rel="noreferrer" className="dm-open-btn"> 
                            <FiExternalLink size={12}/> Open Meeting 
                          </a> 
                        </> 
                      )} 
                    </div> 
                  </div> 
                </div> 
              )} 
            </div> 
 
            {/* Notes */} 
            <div className="dm-form-section"> 
              <div className="dm-form-section-title">Notes</div> 
              <div className="dm-form-group"> 
                <label>Internal Notes</label> 
                <textarea 
                  rows={3} 
                  value={form.notes} 
                  onChange={e => set('notes', e.target.value)} 
                  placeholder="Add any notes, preparation details, or client requirements..." 
                /> 
              </div> 
            </div> 
 
            {formError && <div className="dm-toast dm-toast-error" style={{ position: 'static', marginBottom: 12 }}>{formError}</div>} 
 
            <div className="dm-form-actions"> 
              <button className="dm-btn-outline" onClick={onClose} type="button">Cancel</button> 
              <button className="dm-btn-primary" onClick={handleSave} type="button" disabled={saving}> 
                <FiCheck size={14}/> {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Schedule Demo')} 
              </button> 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}; 
 
// ─── View Demo Modal ────────────────────────────────────────────────────────── 
const DemoViewModal = ({ demo, onClose, onEdit }) => { 
  const [linkCopied, setLinkCopied] = useState(false); 
  const [saving, setSaving] = useState(false); 
  const [generatingLink, setGeneratingLink] = useState(false); 
  const [formError, setFormError] = useState(''); 
 
  const copyLink = () => { 
    if (!demo.meetLink) return; 
    navigator.clipboard.writeText(demo.meetLink).catch(() => {}); 
    setLinkCopied(true); 
    setTimeout(() => setLinkCopied(false), 2000); 
  }; 
 
  const infoRows = [ 
    ['Lead ID',    demo.leadId  || '—'], 
    ['Organization', demo.organization || '—'], 
    ['Contact Person', demo.contactPerson || '—'], 
    ['Email',      demo.email   || '—'], 
    ['Phone',      demo.phone   || '—'],
    ['WhatsApp',   demo.whatsappNumber || demo.phone || '—'], 
    ['Topic',      demo.topic   || '—'], 
    ['Date',       fmtDate(demo.date)], 
    ['Time',       fmtTime(demo.time)], 
    ['Duration',   demo.duration || '—'], 
    ['Status',     <StatusPill key="s" status={demo.status} />], 
    ['Meeting',    demo.meetType === 'meet' ? 'Google Meet' : demo.meetType === 'office' ? 'Office Visit' : 'Phone Call'], 
    ['Created On', demo.createdOn || '—'], 
    ['Demo ID',    demo.id], 
  ]; 
 
  return ( 
    <div className="dm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}> 
      <div className="dm-modal-box dm-modal-box-wide"> 
        <div className="dm-modal-header"> 
          <span className="dm-modal-title">Demo Information</span> 
          <button className="dm-modal-close" onClick={onClose}><FiX /></button> 
        </div> 
 
        <div className="dm-view-body"> 
          {/* Hero */} 
          <div className="dm-view-hero"> 
            <div className="dm-view-avatar" style={{ background: avatarColor(demo.organization) }}> 
              {initials(demo.organization)} 
            </div> 
            <div className="dm-view-hero-info"> 
              <div className="dm-view-client-name">{demo.organization}</div> 
              {demo.contactPerson && <div className="dm-view-contact-person">Contact: {demo.contactPerson}</div>} 
              <div className="dm-view-demo-id">{demo.id} · {demo.topic}</div> 
            </div> 
            <StatusPill status={demo.status} /> 
          </div> 
 
          {/* Info Grid */} 
          <div className="dm-view-grid"> 
            {infoRows.map(([k, v]) => ( 
              <div className="dm-view-row" key={k}> 
                <div className="dm-view-key">{k}</div> 
                <div className="dm-view-val">{v}</div> 
              </div> 
            ))} 
          </div> 
 
          {/* Join Bar */} 
          {demo.meetType === 'meet' && demo.meetLink && ( 
            <div className="dm-view-join-bar"> 
              <a href={demo.meetLink} target="_blank" rel="noreferrer" className="dm-btn-primary" style={{ textDecoration: 'none' }}> 
                <FiVideo size={14}/> Join Meeting 
              </a> 
              <button className="dm-btn-outline" onClick={copyLink}> 
                {linkCopied ? <FiCheck size={13}/> : <FiCopy size={13}/>} 
                {linkCopied ? 'Copied!' : 'Copy Link'} 
              </button> 
            </div> 
          )} 
 
          {/* Notes */} 
          {demo.notes && ( 
            <div className="dm-view-notes"> 
              <div className="dm-view-notes-title">Notes</div> 
              <div className="dm-view-notes-text">{demo.notes}</div> 
            </div> 
          )} 
 
          {/* Timeline */} 
          {demo.timeline?.length > 0 && ( 
            <div className="dm-timeline"> 
              <div className="dm-timeline-title">Activity Timeline</div> 
              <div className="dm-timeline-list"> 
                {demo.timeline.map((t, i) => ( 
                  <div className="dm-timeline-item" key={i}> 
                    <div className="dm-timeline-left"> 
                      <div className="dm-timeline-dot" style={{ background: t.bg, color: t.color, fontSize: 14 }}> 
                        {t.icon} 
                      </div> 
                      <div className="dm-timeline-line" /> 
                    </div> 
                    <div className="dm-timeline-content"> 
                      <div className="dm-timeline-action">{t.action}</div> 
                      <div className="dm-timeline-time">{t.time}</div> 
                    </div> 
                  </div> 
                ))} 
              </div> 
            </div> 
          )} 
 
          {/* Actions */} 
          <div className="dm-form-actions" style={{ padding: '14px 24px 24px', borderTop: '1px solid var(--border)' }}> 
            <button className="dm-btn-outline" onClick={onClose}>Close</button> 
            <button className="dm-btn-primary" onClick={() => { onClose(); onEdit(demo); }}> 
              <FiEdit2 size={13}/> Edit Demo 
            </button> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}; 
 
// ─── Main Demo Page ─────────────────────────────────────────────────────────── 
const Demo = () => { 
  const [demos, setDemos]         = useState([]); 
  const [leads, setLeads]         = useState([]); 
  const [loading, setLoading]     = useState(true); 
  const [activeTab, setActiveTab] = useState('All'); 
  const [search, setSearch]       = useState(''); 
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [filterExec, setFilterExec]     = useState('All'); 
  const [filterDate, setFilterDate]     = useState(''); 
  const [page, setPage]           = useState(1); 
  const [rowsPerPage, setRowsPerPage] = useState(10); 
 
  const [showSchedule, setShowSchedule] = useState(false); 
  const [editDemo, setEditDemo]         = useState(null); 
  const [viewDemo, setViewDemo]         = useState(null); 
  const [toast, setToast]               = useState(null);
  const [contactOverrides, setContactOverrides] = useState(() => readContactOverrides());
  const autoCompletingIds = useRef(new Set()); 
 
  const showToast = useCallback((msg, type = 'success') => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast(null), 3000); 
  }, []); 
 
  useEffect(() => { 
    let mounted = true; 
    (async () => { 
      try { 
        setLoading(true); 
        const [leadPage, demoRows] = await Promise.all([ 
          leadService.getLeads(0, 1000), 
          demoService.getAll(), 
        ]); 
        if (!mounted) return; 
        setLeads(Array.isArray(leadPage?.content) ? leadPage.content : (Array.isArray(leadPage) ? leadPage : [])); 
        setDemos(Array.isArray(demoRows) ? demoRows : []); 
      } catch (error) { 
        if (mounted) showToast(error.message || 'Unable to load Demo data.', 'error'); 
      } finally { if (mounted) setLoading(false); } 
    })(); 
    return () => { mounted = false; }; 
  }, [showToast]); 
 
  const getContactOverride = useCallback((demo) => {
    const override = contactOverrides[demo?.id] || {};
    return {
      phone: override.phone || demo?.phone || '',
      whatsappNumber: override.whatsappNumber || demo?.whatsappNumber || demo?.whatsAppNumber || demo?.whatsapp || demo?.phone || '',
    };
  }, [contactOverrides]);

  const persistContactOverride = useCallback((demoId, values) => {
    if (!demoId) return;
    setContactOverrides(prev => {
      const next = {
        ...prev,
        [demoId]: {
          ...(prev[demoId] || {}),
          phone: values.phone ?? prev[demoId]?.phone ?? '',
          whatsappNumber: values.whatsappNumber ?? prev[demoId]?.whatsappNumber ?? '',
        },
      };
      saveContactOverrides(next);
      return next;
    });
  }, []);

  // Automatically mark a Google Meet demo as Completed after its scheduled end time.
  // Uses the existing demoService.update API; no backend changes are required.
  useEffect(() => {
    if (!demos.length) return undefined;
    let cancelled = false;

    const completeEndedDemos = async () => {
      const ended = demos.filter(demo =>
        demo.status !== 'Completed' &&
        demo.status !== 'Cancelled' &&
        demo.meetType === 'meet' &&
        !!demo.meetLink &&
        hasDemoEnded(demo) &&
        !autoCompletingIds.current.has(demo.id)
      );

      for (const demo of ended) {
        autoCompletingIds.current.add(demo.id);
        try {
          const saved = await demoService.update(demo.id, {
            leadId: demo.leadId,
            topic: demo.topic,
            date: demo.date,
            time: demo.time,
            duration: demo.duration,
            meetType: demo.meetType,
            meetLink: demo.meetLink,
            status: 'Completed',
            notes: demo.notes,
          });
          if (!cancelled) {
            setDemos(prev => prev.map(x => x.id === saved.id ? saved : x));
          }
        } catch {
          // Keep the page usable if an automatic status update fails.
        } finally {
          autoCompletingIds.current.delete(demo.id);
        }
      }
    };

    completeEndedDemos();
    const timer = setInterval(completeEndedDemos, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [demos]);

  // ── Computed Stats ── 
  const stats = useMemo(() => { 
    const today = new Date().toISOString().slice(0, 10); 
    return { 
      total:    demos.length, 
      todayDemos: demos.filter(d => d.date === today).length, 
      upcoming: demos.filter(d => isUpcoming(d.date) && d.status === 'Scheduled').length, 
      completed:demos.filter(d => d.status === 'Completed').length, 
      cancelled:demos.filter(d => d.status === 'Cancelled').length, 
    }; 
  }, [demos]); 
 
  const TABS = [ 
    { id: 'All',       label: 'All',       count: demos.length }, 
    { id: 'Today',     label: "Today's",   count: demos.filter(d => isToday(d.date)).length }, 
    { id: 'Upcoming',  label: 'Upcoming',  count: demos.filter(d => isUpcoming(d.date) && d.status === 'Scheduled').length }, 
    { id: 'Completed', label: 'Meet Completed', count: demos.filter(d => d.status === 'Completed').length }, 
    { id: 'Cancelled', label: 'Cancelled', count: demos.filter(d => d.status === 'Cancelled').length }, 
  ]; 
 
  // ── Filtered & Paginated ── 
  const filtered = useMemo(() => { 
    let d = [...demos]; 
    if (activeTab === 'Today')     d = d.filter(x => isToday(x.date)); 
    if (activeTab === 'Upcoming')  d = d.filter(x => isUpcoming(x.date) && x.status === 'Scheduled'); 
    if (activeTab === 'Completed') d = d.filter(x => x.status === 'Completed'); 
    if (activeTab === 'Cancelled') d = d.filter(x => x.status === 'Cancelled'); 
    if (filterStatus !== 'All')   d = d.filter(x => x.status === filterStatus); 
    if (filterDate)               d = d.filter(x => x.date === filterDate); 
    if (search.trim()) { 
      const q = search.toLowerCase(); 
      d = d.filter(x => 
        x.organization.toLowerCase().includes(q) || 
        (x.contactPerson && x.contactPerson.toLowerCase().includes(q)) || 
        x.id.toLowerCase().includes(q) || 
        x.leadId.toLowerCase().includes(q) || 
        x.topic.toLowerCase().includes(q) 
      ); 
    } 
    return d; 
  }, [demos, activeTab, filterStatus, filterExec, filterDate, search]); 
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage)); 
  const paginated  = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage); 
 
  const pageNums = () => { 
    const nums = []; 
    for (let i = 1; i <= totalPages; i++) { 
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i); 
      else if (nums[nums.length - 1] !== '...') nums.push('...'); 
    } 
    return nums; 
  }; 
 
  // ── CRUD ── 
  const handleAddSave = async (d) => { 
    const saved = await demoService.create({ leadId:d.leadId, topic:d.topic, date:d.date, time:d.time, duration:d.duration, meetType:d.meetType, meetLink:d.meetLink, status:d.status, notes:d.notes }); 
    persistContactOverride(saved.id, { phone: d.phone, whatsappNumber: d.whatsappNumber });
    setDemos(prev => [saved, ...prev]); setShowSchedule(false); showToast(`Demo ${saved.id} scheduled successfully!`); 
  }; 
 
  const handleEditSave = async (d) => {
    const saved = await demoService.update(d.id, { leadId:d.leadId, topic:d.topic, date:d.date, time:d.time, duration:d.duration, meetType:d.meetType, meetLink:d.meetLink, status:d.status, notes:d.notes });
    persistContactOverride(d.id, { phone: d.phone, whatsappNumber: d.whatsappNumber });
    setDemos(prev => prev.map(x => x.id === saved.id ? { ...x, phone: d.phone } : x)); setEditDemo(null); showToast('Demo updated successfully!');
  }; 
 
  const handleDelete = async (id) => { 
    if (!window.confirm('Delete this demo permanently?')) return; 
    try { await demoService.remove(id); setDemos(prev => prev.filter(x => x.id !== id)); showToast('Demo deleted.', 'error'); } 
    catch(e) { showToast(e.message || 'Unable to delete demo.', 'error'); } 
  }; 
 
  const handleCancel = async (id) => { 
    try { const saved = await demoService.cancel(id); setDemos(prev => prev.map(x => x.id === saved.id ? saved : x)); showToast('Demo cancelled.', 'warn'); } 
    catch(e) { showToast(e.message || 'Unable to cancel demo.', 'error'); } 
  }; 
 
  const handleCopyLink = (demo) => { 
    if (!demo.meetLink) { showToast('No meet link for this demo.', 'error'); return; } 
    navigator.clipboard.writeText(demo.meetLink).catch(() => {}); 
    showToast('Meet link copied!', 'info'); 
  }; 
 
  const handleCall = (demo) => { const { phone } = getContactOverride(demo); if (!phone) { showToast('No phone number available for this lead.', 'error'); return; } window.open(`tel:${String(phone).replace(/[^0-9+]/g, '')}`, '_self'); }; 
 

  const handleExport = () => {
    if (!filtered.length) { showToast('No demos available to export.', 'warn'); return; }
    const headers = ['Demo ID','Lead ID','Organization','Contact Person','Email','Phone','WhatsApp Number','Topic','Date','Time','Duration','Meeting Type','Meet Link','Status','Notes'];
    const rows = filtered.map(demo => { const contact = getContactOverride(demo); return [demo.id||'',demo.leadId||'',demo.organization||'',demo.contactPerson||'',demo.email||'',contact.phone||'',contact.whatsappNumber||'',demo.topic||'',demo.date||'',demo.time||'',demo.duration||'',demo.meetType==='meet'?'Google Meet':demo.meetType==='office'?'Office Visit':'Phone Call',demo.meetLink||'',demo.status==='Completed'?'Meet Completed':(demo.status||''),demo.notes||'']; });
    const csv=[headers,...rows].map(row=>row.map(value=>`"${String(value ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url;
    link.download=`demo_export_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    showToast('Demos exported successfully!','success');
  };

  const handleWhatsAppShare = (demo) => {
    if (!demo.meetLink) { showToast('No Google Meet link available.','error'); return; }
    const { whatsappNumber, phone: contactPhone } = getContactOverride(demo);
    const targetNumber = whatsappNumber || contactPhone;
    if (!targetNumber) { showToast('No WhatsApp number available for this lead.','error'); return; }
    let phone=String(targetNumber).replace(/\D/g,''); if(phone.length===10) phone=`91${phone}`;
    const message=[`Hello ${demo.contactPerson || demo.organization || 'there'},`,'','Your Google Meet demo has been scheduled.','',`📅 Date: ${fmtDate(demo.date)}`,`⏰ Time: ${fmtTime(demo.time)}`,`⏱ Duration: ${demo.duration || '60 min'}`,'',`🔗 Google Meet: ${demo.meetLink}`,'','Thank you.'].join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
  };

  const handleMeetCompleted = async (demo) => {
    if (demo.status === 'Completed' || demo.status === 'Cancelled') return;
    try {
      const saved=await demoService.update(demo.id,{leadId:demo.leadId,topic:demo.topic,date:demo.date,time:demo.time,duration:demo.duration,meetType:demo.meetType,meetLink:demo.meetLink,status:'Completed',notes:demo.notes});
      setDemos(prev=>prev.map(x=>x.id===saved.id?saved:x)); showToast('Meet marked as completed successfully!','success');
    } catch(error) { showToast(error.message || 'Unable to mark meet as completed.','error'); }
  };

  const handleTabChange = (t) => { setActiveTab(t); setPage(1); }; 
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); }; 
 
  return ( 
    <div className="dm-page"> 
 
      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Loading leads and demos...</div>} 
 
      {/* Toast */} 
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />} 
 
      {/* Header */} 
      <div className="dm-page-header"> 
        <div> 
          <div className="dm-page-title">Demo Management</div> 
        </div> 
        <div className="dm-header-actions"> 
          <button className="dm-btn-outline" onClick={handleExport}> 
            <FiCalendar size={14}/> Export 
          </button> 
          <button className="dm-btn-primary" onClick={() => setShowSchedule(true)}> 
            <FiPlus size={15}/> Schedule Demo 
          </button> 
        </div> 
      </div> 
 
      {/* Stats Row */} 
      <div className="dm-stats-row"> 
        <div className="dm-stat-card" style={{ borderTop: '3px solid #7b1113' }}> 
          <div className="dm-stat-icon" style={{ background: '#fce8e8', color: '#7b1113' }}><FiMonitor /></div> 
          <div className="dm-stat-info"> 
            <div className="dm-stat-val">{stats.total}</div> 
            <div className="dm-stat-label">Total Demos</div> 
          </div> 
        </div> 
        <div className="dm-stat-card" style={{ borderTop: '3px solid #2563eb' }}> 
          <div className="dm-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><FiCalendar /></div> 
          <div className="dm-stat-info"> 
            <div className="dm-stat-val">{stats.todayDemos}</div> 
            <div className="dm-stat-label">Today's Demos</div> 
          </div> 
        </div> 
        <div className="dm-stat-card" style={{ borderTop: '3px solid #16a34a' }}> 
          <div className="dm-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><FiClock /></div> 
          <div className="dm-stat-info"> 
            <div className="dm-stat-val">{stats.upcoming}</div> 
            <div className="dm-stat-label">Upcoming</div> 
          </div> 
        </div> 
        <div className="dm-stat-card" style={{ borderTop: '3px solid #4338ca' }}> 
          <div className="dm-stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><FiCheck /></div> 
          <div className="dm-stat-info"> 
            <div className="dm-stat-val">{stats.completed}</div> 
            <div className="dm-stat-label">Meet Completed</div> 
          </div> 
        </div> 
        <div className="dm-stat-card" style={{ borderTop: '3px solid #dc2626' }}> 
          <div className="dm-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><FiX /></div> 
          <div className="dm-stat-info"> 
            <div className="dm-stat-val">{stats.cancelled}</div> 
            <div className="dm-stat-label">Cancelled</div> 
          </div> 
        </div> 
      </div> 
 
      {/* Table Card */} 
      <div className="dm-table-card"> 
 
        {/* Tabs */} 
        <div className="dm-tabs-row"> 
          {TABS.map(t => ( 
            <button 
              key={t.id} 
              className={`dm-tab ${activeTab === t.id ? 'active' : ''}`} 
              onClick={() => handleTabChange(t.id)} 
            > 
              {t.label} 
              <span className="dm-tab-badge">{t.count}</span> 
            </button> 
          ))} 
        </div> 
 
        {/* Filters */} 
        <div className="dm-filter-bar"> 
          <div className="dm-search-wrap"> 
            <FiSearch className="dm-search-ico" /> 
            <input 
              className="dm-search-input" 
              placeholder="Search organization, contact person, demo ID, lead ID…" 
              value={search} 
              onChange={handleSearch} 
            /> 
          </div> 
          <select 
            className="dm-filter-select" 
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }} 
          > 
            <option value="All">All Status</option> 
            {DEMO_STATUSES.map(s => <option key={s} value={s}>{s === 'Completed' ? 'Meet Completed' : s}</option>)} 
          </select> 
          
          <input 
            type="date" 
            className="dm-filter-select" 
            value={filterDate} 
            onChange={e => { setFilterDate(e.target.value); setPage(1); }} 
            style={{ minWidth: 140 }} 
          /> 
          {(filterStatus !== 'All' || filterExec !== 'All' || filterDate || search) && ( 
            <button className="dm-btn-ghost" onClick={() => { 
              setFilterStatus('All'); setFilterExec('All'); 
              setFilterDate(''); setSearch(''); setPage(1); 
            }}> 
              <FiX size={13}/> Clear 
            </button> 
          )} 
        </div> 
 
        {/* Schedule button row (table header) */} 
        <div className="dm-schedule-row"> 
          <span className="dm-schedule-label"> 
            Demo List 
            <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 12.5, marginLeft: 8 }}> 
              ({filtered.length} record{filtered.length !== 1 ? 's' : ''}) 
            </span> 
          </span> 
          
        </div> 
 
        {/* Table */} 
        <div className="dm-table-wrap"> 
          <table className="dm-table"> 
            <thead> 
              <tr> 
                <th>Demo ID</th> 
                <th>Organization / Contact</th> 
                <th>Date</th> 
                <th>Time</th> 
                <th>Meeting</th> 
                <th>Status</th> 
                <th>Actions</th> 
              </tr> 
            </thead> 
            <tbody> 
              {paginated.length === 0 ? ( 
                <tr className="dm-empty-row"> 
                  <td colSpan={7}> 
                    {search ? `No demos found matching "${search}"` : 'No demos found. Try adjusting your filters.'} 
                  </td> 
                </tr> 
              ) : paginated.map(demo => ( 
                <tr key={demo.id}> 
                  <td><span className="dm-id">{demo.id}</span></td> 
                  <td> 
                    <div className="dm-client-cell"> 
                      <div className="dm-client-avatar" style={{ background: avatarColor(demo.organization) }}> 
                        {initials(demo.organization)} 
                      </div> 
                      <div> 
                        <div className="dm-client-name">{demo.organization}</div> 
                        {demo.contactPerson && <div className="dm-contact-person">{demo.contactPerson}</div>} 
                        <div className="dm-client-lead">{demo.leadId}</div> 
                      </div> 
                    </div> 
                  </td> 
                  <td> 
                    <div className="dm-date-cell">{fmtDate(demo.date)}</div> 
                    <div className="dm-time-cell" style={{ fontSize: 11, color: 'var(--text-light)' }}>{demo.duration}</div> 
                  </td> 
                  <td> 
                    <div className="dm-date-cell">{fmtTime(demo.time)}</div> 
                  </td> 
                 
                  <td> 
                    <MeetBtn demo={demo} /> 
                  </td> 
                  <td> 
                    <StatusPill status={demo.status} /> 
                  </td> 
                  <td> 
                    <div className="dm-action-group"> 
                      <button className="dm-act-btn view" title="View" onClick={() => setViewDemo({ ...demo, ...getContactOverride(demo) })}> 
                        <FiEye /> 
                      </button> 
                      <button className="dm-act-btn edit" title="Edit" onClick={() => setEditDemo({ ...demo, ...getContactOverride(demo) })}> 
                        <FiEdit2 /> 
                      </button> 
                      {demo.meetLink && ( 
                        <button className="dm-act-btn copy" title="Copy Link" onClick={() => handleCopyLink(demo)}> 
                          <FiCopy /> 
                        </button> 
                      )}
                      {demo.meetLink && demo.meetType === 'meet' && demo.status !== 'Cancelled' && (
                        <button className="dm-act-btn whatsapp" title="Share Google Meet on WhatsApp" onClick={() => handleWhatsAppShare(demo)}>
                          <FaWhatsapp />
                        </button>
                      )}
                      <button className="dm-act-btn call" title="Call Client" onClick={() => handleCall(demo)}> 
                        <FiPhone /> 
                      </button> 
                      {demo.meetLink && demo.meetType === 'meet' && demo.status !== 'Cancelled' && ( 
                        <button className="dm-act-btn join" title="Join Meet" 
                          onClick={() => window.open(demo.meetLink, '_blank')}> 
                          <FiVideo /> 
                        </button> 
                      )} 
                      {demo.status !== 'Cancelled' && demo.status !== 'Completed' && (
                        <button className="dm-act-btn complete" title="Mark Meet Completed" onClick={() => handleMeetCompleted(demo)}>
                          <FiCheck />
                        </button>
                      )}
                      {demo.status !== 'Cancelled' && demo.status !== 'Completed' && ( 
                        <button className="dm-act-btn cancel" title="Cancel Demo" 
                          onClick={() => handleCancel(demo.id)}> 
                          <FiX /> 
                        </button> 
                      )} 
                      <button className="dm-act-btn del" title="Delete" onClick={() => handleDelete(demo.id)}> 
                        <FiTrash2 /> 
                      </button> 
                    </div> 
                  </td> 
                </tr> 
              ))} 
            </tbody> 
          </table> 
        </div> 
 
        {/* Pagination */} 
        <div className="dm-pagination-bar"> 
          <div className="dm-rows-select"> 
            Rows per page: 
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}> 
              {ROWS_OPTIONS.map(r => <option key={r}>{r}</option>)} 
            </select> 
          </div> 
          <div className="dm-page-nums"> 
            <button className="dm-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}> 
              <FiChevronLeft size={13}/> 
            </button> 
            {pageNums().map((p, i) => 
              p === '...' 
                ? <span key={i} style={{ padding: '0 4px', color: 'var(--text-light)' }}>…</span> 
                : <button key={p} className={`dm-pg-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button> 
            )} 
            <button className="dm-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}> 
              <FiChevronRight size={13}/> 
            </button> 
          </div> 
        </div> 
      </div> 
 
      {/* Modals */} 
      {showSchedule && ( 
        <DemoFormModal 
          allDemos={demos} 
          leads={leads} 
          onSave={handleAddSave} 
          onClose={() => setShowSchedule(false)} 
        /> 
      )} 
 
      {editDemo && ( 
        <DemoFormModal 
          initial={editDemo} 
          allDemos={demos} 
          leads={leads} 
          onSave={handleEditSave} 
          onClose={() => setEditDemo(null)} 
        /> 
      )} 
 
      {viewDemo && ( 
        <DemoViewModal 
          demo={viewDemo} 
          onClose={() => setViewDemo(null)} 
          onEdit={(d) => setEditDemo(d)} 
        /> 
      )} 
    </div> 
  ); 
}; 
 
export default Demo; 
