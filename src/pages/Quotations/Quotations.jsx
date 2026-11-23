// src/pages/Quotations/Quotations.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './Quotations.css';
import leadService from '../../services/leadService';
import quotationService from '../../services/quotationService';
import templateService from '../../services/templateService';
import {
  FiFileText, FiPlus, FiSearch, FiDownload,
  FiEdit2, FiTrash2, FiEye, FiX, FiCheck,
  FiChevronLeft, FiChevronRight, FiSend, FiRefreshCw,
  FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle,
  FiUser, FiTag, FiMessageCircle, FiMail,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import QuotationDocumentEditor, { kindOfTemplate, defaultDoc, parseDoc } from './QuotationDocumentEditor';

// ─── Constants ──────────────────────────────────────────────────────────────
// These are the ONLY statuses the backend (QuotationService) understands.
// Draft / Rejected / Revision Required -> editable + submittable by the telecaller.
// Pending Confirmation -> awaiting Super Admin action, locked for editing.
// Approved -> the telecaller (and only the telecaller) can send it to the client.
// Sent to Client -> terminal, read-only reflection for everyone.
const QT_STATUSES = ['Draft', 'Pending Confirmation', 'Approved', 'Rejected', 'Revision Required', 'Sent to Client'];
const EDITABLE_STATUSES = new Set(['Draft', 'Rejected', 'Revision Required']);
const ROWS_OPTIONS = [10, 20, 50];

const AVATAR_COLORS = ['#7b1113', '#2563eb', '#16a34a', '#7c3aed', '#c2410c', '#0369a1', '#4338ca', '#be185d'];

const STATUS_CONFIG = {
  'Draft':                { cls: 'qt-status-draft',    label: 'Draft' },
  'Pending Confirmation':  { cls: 'qt-status-sent',      label: 'Pending Approval' },
  'Approved':              { cls: 'qt-status-approved',  label: 'Approved' },
  'Rejected':              { cls: 'qt-status-rejected',  label: 'Rejected' },
  'Revision Required':     { cls: 'qt-status-revised',   label: 'Revision Required' },
  'Sent to Client':        { cls: 'qt-status-viewed',    label: 'Sent to Client' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const currentUserName = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').name || 'You'; } catch { return 'You'; }
};

// ─── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`qt-toast qt-toast-${type}`} onClick={onClose}>
    {type === 'success' ? <FiCheck /> : type === 'error' ? <FiX /> : <FiRefreshCw />}
    {msg}
  </div>
);

// ─── Status Pill ────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { cls: '', label: status || '—' };
  return <span className={`qt-status-pill ${cfg.cls}`}>{cfg.label}</span>;
};

// ─── Create / Edit Modal ────────────────────────────────────────────────────
const QuotationFormModal = ({ initial, leads, templates, onClose, onSave }) => {
  const isEdit = !!initial?.id;
  const [leadSearch, setLeadSearch] = useState('');
  const [form, setForm] = useState({
    leadId: initial?.leadId || '', templateId: initial?.templateId || (templates.find(t => !t.serviceType || String(t.serviceType).toLowerCase() === String(initial?.serviceType || 'ERP').toLowerCase())?.id || ''),
    serviceType: initial?.serviceType || 'ERP', clientName: initial?.clientName || '',
    organization: initial?.organization || '', email: initial?.email || '', phone: initial?.phone || '', address: initial?.address || '',
    subject: initial?.subject || '', validTill: initial?.validTill || '', notes: initial?.notes || '', fieldValues: initial?.fieldValues || {},
  });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const filteredLeads = useMemo(() => { const q = leadSearch.trim().toLowerCase(); return !q ? leads : leads.filter(l => Object.values(l || {}).some(v => String(v ?? '').toLowerCase().includes(q))); }, [leads, leadSearch]);
  const selectedLead = leads.find(l => l.leadId === form.leadId);
  const leadLabel = l => `${l.name || 'Unnamed'} — ${l.mobile || l.phoneNumber || l.phone || 'No mobile'}${l.email ? ` — ${l.email}` : ''}`;
  const availableTemplates = useMemo(() => templates.filter(t => !t.serviceType || String(t.serviceType).toLowerCase() === String(form.serviceType).toLowerCase()), [templates, form.serviceType]);
  const selectedTemplate = availableTemplates.find(t => t.id === form.templateId);
  const AUTO_KEYS = new Set(['clientName','organization','email','phone','subject','validTill','notes','leadId','date']);
  const customFields = (selectedTemplate?.fields || []).filter(f => f.mapsTo && !AUTO_KEYS.has(f.mapsTo));
  // Built-in IndoCampas templates use the WYSIWYG document editor instead of simple fields.
  const builtinKind = kindOfTemplate(selectedTemplate);
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    if (!builtinKind) { setDoc(null); return; }
    setDoc(prev => (prev && prev.__kind === builtinKind) ? prev : (parseDoc(form.fieldValues, builtinKind) || defaultDoc(builtinKind)));
  }, [builtinKind]);
  useEffect(() => {
    if (!builtinKind || !doc) return;
    if (builtinKind === 'erp') {
      const n = Math.round(parseFloat(doc.strength));
      if (n > 0 && (!form.subject.trim() || /^ERP(, Student Strength \( \d+ \))?$/.test(form.subject.trim()))) set('subject', `ERP, Student Strength ( ${n} )`);
    } else if (!form.subject.trim()) set('subject', 'Digital Marketing Services');
  }, [builtinKind, doc?.strength, !!doc]);
  useEffect(() => {
    if (!form.templateId || !availableTemplates.some(t => t.id === form.templateId)) {
      set('templateId', availableTemplates[0]?.id || '');
    }
  }, [form.serviceType, availableTemplates]);
  const selectLead = leadId => { const l = leads.find(x => x.leadId === leadId); if (!l) return set('leadId', leadId); setLeadSearch(leadLabel(l)); setForm(f => ({ ...f, leadId, clientName:l.name||'', organization:l.school||l.organization||l.company||l.name||'', email:l.email||'', phone:l.mobile||l.phoneNumber||l.phone||'', address:l.schoolAddress||l.address||l.area||'' })); };
  const handleLeadSearchChange = value => { setLeadSearch(value); const match = leads.find(l => leadLabel(l) === value || l.leadId === value); if (match) selectLead(match.leadId); };
  const handleSave = async () => { setError(''); if (!form.leadId) return setError('Please select a client / lead.'); if (!form.templateId) return setError('Please select a quotation template.'); if (!form.subject.trim()) return setError('Subject is required.'); if (!form.clientName.trim()) return setError('Client name is required.'); setSaving(true); try { const payload = { leadId:form.leadId, templateId:form.templateId, serviceType:form.serviceType, clientName:form.clientName, organization:form.organization, email:form.email, phone:form.phone, address:form.address, subject:form.subject, validTill:form.validTill, notes:form.notes, fieldValues:(builtinKind&&doc)?{...form.fieldValues,doc:JSON.stringify(doc)}:form.fieldValues }; const saved=isEdit?await quotationService.update(initial.id,payload):await quotationService.create(payload); onSave(saved,isEdit); } catch(e){ setError(e.message||'Unable to save quotation.'); } finally { setSaving(false); } };
  return <div className="qt-modal-overlay" onClick={onClose}><div className="qt-modal-box qt-modal-box-wide" onClick={e=>e.stopPropagation()}><div className="qt-modal-header"><div className="qt-modal-title">{isEdit?`Edit ${initial.id}`:'New Quotation'}</div><button className="qt-modal-close" onClick={onClose}><FiX /></button></div><div className="qt-modal-body"><div className="qt-form">
    {error&&<div className="qt-client-autofill" style={{borderColor:'#fecaca',background:'#fef2f2'}}><div className="qt-client-autofill-label" style={{color:'#b91c1c'}}><FiAlertCircle size={12}/> {error}</div></div>}
    <div className="qt-form-section"><div className="qt-form-section-title">Client / Lead</div><div className="qt-form-group"><label>Lead Selection *</label><input list="quotation-leads" placeholder="Click and search by name, mobile or email" value={leadSearch} onChange={e=>handleLeadSearchChange(e.target.value)} disabled={isEdit}/><datalist id="quotation-leads">{filteredLeads.map(l=><option key={l.leadId} value={leadLabel(l)} />)}</datalist></div>{selectedLead&&<div className="qt-client-autofill"><div className="qt-client-autofill-label">Lead selected — details can be edited below before submission</div></div>}<div className="qt-form-row"><div className="qt-form-group"><label>Client Name *</label><input value={form.clientName} onChange={e=>set('clientName',e.target.value)}/></div><div className="qt-form-group"><label>Mobile Number</label><input value={form.phone} onChange={e=>set('phone',e.target.value)}/></div></div><div className="qt-form-row"><div className="qt-form-group"><label>Email Address</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div><div className="qt-form-group"><label>Company / Organization</label><input value={form.organization} onChange={e=>set('organization',e.target.value)}/></div></div><div className="qt-form-group"><label>Address</label><textarea value={form.address} onChange={e=>set('address',e.target.value)}/></div></div>
    <div className="qt-form-section"><div className="qt-form-section-title">Quotation Details</div><div className="qt-form-row"><div className="qt-form-group"><label>Service Type *</label><select value={form.serviceType} onChange={e=>set('serviceType',e.target.value)}><option value="ERP">ERP</option><option value="Digital Marketing">Digital Marketing</option><option value="Online Admission">Online Admission</option></select></div><div className="qt-form-group"><label>Template *</label><select value={availableTemplates.some(t=>t.id===form.templateId) ? form.templateId : ''} onChange={e=>set('templateId',e.target.value)}><option value="">— Select a template —</option>{availableTemplates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div></div><div className="qt-form-row"><div className="qt-form-group"><label>Subject *</label><input placeholder={`Quotation for ${form.serviceType}`} value={form.subject} onChange={e=>set('subject',e.target.value)}/></div><div className="qt-form-group"><label>Valid Till</label><input type="date" value={form.validTill} onChange={e=>set('validTill',e.target.value)}/></div></div>{!builtinKind&&<div className="qt-form-group"><label>Notes / Service Details</label><textarea placeholder="Scope, inclusions, service details and terms…" value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>}</div>
    {builtinKind&&doc&&<QuotationDocumentEditor kind={builtinKind} doc={doc} setDoc={setDoc} form={form} set={set} quotationNo={initial?.quotationNo}/>}
    {customFields.length>0&&!builtinKind&&<div className="qt-form-section"><div className="qt-form-section-title">Template Fields</div>{customFields.map(f=><div className="qt-form-group" key={f.id}><label>{f.label||f.id}</label><input value={form.fieldValues[f.id]||''} onChange={e=>set('fieldValues',{...form.fieldValues,[f.id]:e.target.value})}/></div>)}</div>}
    <div className="qt-form-actions"><button className="qt-btn-outline" onClick={onClose} disabled={saving}>Cancel</button><button className="qt-btn-primary" onClick={handleSave} disabled={saving}><FiCheck size={13}/> {saving?'Saving…':isEdit?'Save Changes':'Create Quotation (Draft)'}</button></div>
  </div></div></div></div>;
};

// ─── SendModal removed — WhatsApp/Email now send directly from the row actions
// (see handleWhatsAppSend / handleEmailSend below) without a channel-picker modal.


// ─── View / Timeline Drawer ─────────────────────────────────────────────────
const ViewModal = ({ quotation, onClose, onDownload }) => (
  <div className="qt-modal-overlay" onClick={onClose}>
    <div className="qt-modal-box qt-modal-box-wide" onClick={e => e.stopPropagation()}>
      <div className="qt-modal-header">
        <div className="qt-modal-title">{quotation.id}</div>
        <button className="qt-modal-close" onClick={onClose}><FiX /></button>
      </div>
      <div className="qt-view-hero">
        <div className="qt-view-avatar" style={{ background: avatarColor(quotation.clientName) }}>{initials(quotation.clientName)}</div>
        <div className="qt-view-hero-info">
          <div className="qt-view-client-name">{quotation.clientName}</div>
          <div className="qt-view-quote-id">{quotation.organization}</div>
        </div>
        <StatusPill status={quotation.status} />
      </div>
      <div className="qt-view-grid">
        <div className="qt-view-row"><span className="qt-view-key">Subject</span><span className="qt-view-val">{quotation.subject}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Service Type</span><span className="qt-view-val">{quotation.serviceType || 'ERP'}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Valid Till</span><span className="qt-view-val">{quotation.validTill || '—'}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Email</span><span className="qt-view-val">{quotation.email || '—'}</span></div>
        <div className="qt-view-row"><span className="qt-view-key">Phone</span><span className="qt-view-val">{quotation.phone || '—'}</span></div>
        {quotation.status === 'Rejected' && <div className="qt-view-row"><span className="qt-view-key">Rejection Reason</span><span className="qt-view-val">{quotation.rejectionReason}</span></div>}
        {quotation.status === 'Revision Required' && <div className="qt-view-row"><span className="qt-view-key">Revision Notes</span><span className="qt-view-val">{quotation.revisionReason}</span></div>}
        {quotation.approvalRemark && <div className="qt-view-row"><span className="qt-view-key">Approval Remark</span><span className="qt-view-val">{quotation.approvalRemark}</span></div>}
        {quotation.sent && <div className="qt-view-row"><span className="qt-view-key">Sent</span><span className="qt-view-val">{quotation.sentChannel} · {fmtDateTime(quotation.sentAt)}</span></div>}
      </div>
      {quotation.notes && (
        <div className="qt-view-note">
          <div className="qt-view-note-label">Notes</div>
          <div className="qt-view-note-text">{quotation.notes}</div>
        </div>
      )}
      <div className="qt-timeline">
        <div className="qt-timeline-title">History</div>
        <div className="qt-timeline-list">
          {(quotation.timeline || []).map((t, i) => (
            <div className="qt-timeline-item" key={i}>
              <div className="qt-timeline-left">
                <div className="qt-timeline-dot" style={{ background: t.bg, color: t.color }}>•</div>
                {i < quotation.timeline.length - 1 && <div className="qt-timeline-line" />}
              </div>
              <div className="qt-timeline-content">
                <div className="qt-timeline-action">{t.action}</div>
                <div className="qt-timeline-time">{t.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="qt-form-actions" style={{ padding: '0 24px 24px' }}>
        {quotation.generatedPdfPath && (
          <button className="qt-btn-outline" onClick={() => onDownload(quotation)}><FiDownload size={13} /> Download PDF</button>
        )}
      </div>
    </div>
  </div>
);

// ─── Main Quotations Page ───────────────────────────────────────────────────
const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterServiceType, setFilterServiceType] = useState('All');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editQt, setEditQt] = useState(null);
  const [viewQt, setViewQt] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch every page instead of assuming that all eligible leads fit in one
      // fixed page. This keeps the quotation lead selector in sync with Leads.
      const fetchAllLeads = async () => {
        const first = await leadService.getLeads(0, 1000);
        if (Array.isArray(first)) return first;

        const all = [...(Array.isArray(first?.content) ? first.content : [])];
        const totalPages = Number(first?.totalPages || 1);
        if (totalPages <= 1) return all;

        const pages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            leadService.getLeads(index + 1, 1000)
          )
        );
        pages.forEach(result => {
          if (Array.isArray(result?.content)) all.push(...result.content);
        });

        // Avoid duplicate lead entries when the backend returns overlapping data.
        const seen = new Set();
        return all.filter(lead => {
          const key = lead?.leadId || lead?.id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      const [allLeads, quoteList, templateList] = await Promise.all([
        fetchAllLeads(),
        quotationService.getAll(),
        templateService.list(),
      ]);
      setLeads(allLeads);
      setQuotations(Array.isArray(quoteList) ? quoteList : []);
      setTemplates(Array.isArray(templateList) ? templateList : []);
    } catch (e) {
      showToast(e.message || 'Failed to load quotations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const upsert = (q) => setQuotations(prev => {
    const exists = prev.some(x => x.id === q.id);
    return exists ? prev.map(x => x.id === q.id ? q : x) : [q, ...prev];
  });

  // ── Stats ──
  const stats = useMemo(() => ({
    total: quotations.length,
    pendingApproval: quotations.filter(q => q.status === 'Pending Approval' || q.status === 'Pending Confirmation').length,
    approved: quotations.filter(q => q.status === 'Approved').length,
    sent: quotations.filter(q => q.status === 'Sent' || q.status === 'Sent to Client').length,
    value: quotations
      .filter(q => q.status === 'Sent' || q.status === 'Sent to Client')
      .reduce((s, q) => s + (q.amount || 0), 0),
  }), [quotations]);

  const TABS = [
    { id: 'All', label: 'All', count: quotations.length },
    { id: 'Draft', label: 'Draft', count: quotations.filter(q => q.status === 'Draft').length },
    { id: 'Pending Approval', label: 'Pending Approval', count: stats.pendingApproval },
    { id: 'Approved', label: 'Approved', count: stats.approved },
    { id: 'Rejected', label: 'Rejected', count: quotations.filter(q => q.status === 'Rejected').length },
    { id: 'Revision Required', label: 'Revision Required', count: quotations.filter(q => q.status === 'Revision Required').length },
    { id: 'Sent', label: 'Sent to Client', count: stats.sent },
  ];

  const filtered = useMemo(() => {
    let d = [...quotations];
    if (filterStatus !== 'All') {
      d = d.filter(q => {
        if (filterStatus === 'Sent') return q.status === 'Sent' || q.status === 'Sent to Client';
        if (filterStatus === 'Pending Approval') return q.status === 'Pending Approval' || q.status === 'Pending Confirmation';
        return q.status === filterStatus;
      });
    }
    if (filterServiceType !== 'All') {
      d = d.filter(x => (x.serviceType || 'ERP') === filterServiceType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        (x.id || '').toLowerCase().includes(q) ||
        (x.clientName || '').toLowerCase().includes(q) ||
        (x.subject || '').toLowerCase().includes(q) ||
        (x.email || '').toLowerCase().includes(q)
      );
    }
    return d;
  }, [quotations, filterStatus, filterServiceType, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageNums = () => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '...') nums.push('...');
    }
    return nums;
  };

  // ── Actions ──
  const handleSaved = (q, isEdit) => {
    upsert(q);
    setShowForm(false);
    setEditQt(null);
    showToast(isEdit ? 'Quotation updated.' : `${q.id} created as Draft.`);
  };

  const handleSubmitForApproval = async (id) => {
    try {
      const saved = await quotationService.submit(id);
      upsert(saved);
      showToast('Sent to Super Admin for confirmation.');
    } catch (e) { showToast(e.message || 'Unable to submit.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quotation permanently?')) return;
    try {
      await quotationService.remove(id);
      setQuotations(prev => prev.filter(x => x.id !== id));
      showToast('Quotation deleted.', 'error');
    } catch (e) { showToast(e.message || 'Unable to delete.', 'error'); }
  };

  const handleSend = async (id, channel) => {
    try {
      const saved = await quotationService.markSent(id, channel);
      upsert(saved);
      showToast(`Sent to ${saved.clientName} via ${channel}.`);
    } catch (e) { showToast(e.message || 'Unable to send.', 'error'); throw e; }
  };

  // WhatsApp / Email are sent straight from the browser — no backend WhatsApp/SMTP
  // integration involved. We download the PDF for the telecaller to attach, open
  // WhatsApp Web / the mail client with the message pre-filled, then mark the
  // quotation as Sent so Super Admin + telecaller both see it move to "Sent".
  const handleWhatsAppSend = async (q) => {
    try {
      await handleDownload(q);
      const digits = (q.phone || '').replace(/\D/g, '');
      const phone = digits.length === 10 ? `91${digits}` : digits;
      const msg = `Hi ${q.clientName || ''}, please find your ${q.serviceType || 'ERP'} quotation "${q.subject || ''}" attached. (Ref: ${q.id})`; 
      if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      else showToast('No phone number on this quotation — opening WhatsApp Web without a recipient.', 'error');
      await handleSend(q.id, 'WhatsApp');
    } catch (e) { /* handleSend already toasts */ }
  };

  const handleEmailSend = async (q) => {
    try {
      await handleDownload(q);
      const subject = `Quotation ${q.id} — ${q.subject || ''}`;
      const body = `Hi ${q.clientName || ''},\n\nPlease find your quotation attached (downloaded to your device — attach it to this email).\n\nService Type: ${q.serviceType || 'ERP'}\nSubject: ${q.subject || ''}\nRef: ${q.id}\n\nRegards.`;
      if (q.email) window.open(`mailto:${q.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      else showToast('No email address on this quotation — opening mail client without a recipient.', 'error');
      await handleSend(q.id, 'Email');
    } catch (e) { /* handleSend already toasts */ }
  };

  const handleDownload = async (q) => {
    try {
      const blob = await quotationService.downloadPdfBlob(q.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = q.generatedPdfFileName || `Quotation_${q.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { showToast(e.message || 'Unable to download PDF.', 'error'); }
  };

  return (
    <div className="qt-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="qt-page-header">
        <div>
          <div className="qt-page-title">Quotations</div>
          <div className="qt-breadcrumb">Prepare a quotation, send it for Super Admin confirmation, then deliver it to the client once approved.</div>
        </div>
        <div className="qt-header-actions">
          <button className="qt-btn-primary" onClick={() => setShowForm(true)}>
            <FiPlus size={15} /> New Quotation
          </button>
        </div>
      </div>

      <div className="qt-stats-row">
        <div className="qt-stat-card" style={{ borderTop: '3px solid #7b1113' }}>
          <div className="qt-stat-icon" style={{ background: '#fce8e8', color: '#7b1113' }}><FiFileText /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">{stats.total}</div><div className="qt-stat-label">Total Quotes</div></div>
        </div>
        <div className="qt-stat-card" style={{ borderTop: '3px solid #1d4ed8' }}>
          <div className="qt-stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><FiClock /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">{stats.pendingApproval}</div><div className="qt-stat-label">Awaiting Super Admin</div></div>
        </div>
        <div className="qt-stat-card" style={{ borderTop: '3px solid #15803d' }}>
          <div className="qt-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}><FiCheckCircle /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">{stats.approved}</div><div className="qt-stat-label">Ready to Send</div></div>
        </div>
        <div className="qt-stat-card" style={{ borderTop: '3px solid #4338ca' }}>
          <div className="qt-stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><FiDollarSign /></div>
          <div className="qt-stat-info"><div className="qt-stat-val">₹{stats.value.toLocaleString('en-IN')}</div><div className="qt-stat-label">Sent to Clients</div></div>
        </div>
      </div>

      <div className="qt-table-card">
        <div className="qt-tabs-row">
          {TABS.map(t => (
            <div key={t.id} className={`qt-tab ${filterStatus === t.id ? 'active' : ''}`} onClick={() => { setFilterStatus(t.id); setPage(1); }}>
              {t.label} <span className="qt-tab-badge">{t.count}</span>
            </div>
          ))}
        </div>

        <div className="qt-filter-bar">
          <select value={filterServiceType} onChange={e => { setFilterServiceType(e.target.value); setPage(1); }} aria-label="Filter by service type">
            <option value="All">All Services</option><option value="ERP">ERP</option><option value="Digital Marketing">Digital Marketing</option><option value="Online Admission">Online Admission</option>
          </select>
          <div className="qt-search-wrap">
            <FiSearch className="qt-search-ico" />
            <input className="qt-search-input" placeholder="Search by client, subject or ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="qt-table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Loading leads, templates and quotations…</div>
          ) : (
            <table className="qt-table">
              <thead>
                <tr>
                  <th>Quote #</th><th>Client</th><th>Subject</th><th>Service Type</th><th>Status</th><th>Updated</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr className="qt-empty-row"><td colSpan={7}>No quotations found.</td></tr>
                )}
                {paginated.map(q => (
                  <tr key={q.id}>
                    <td className="qt-quote-no">{q.id}</td>
                    <td>
                      <div className="qt-client-cell">
                        <div className="qt-client-avatar" style={{ background: avatarColor(q.clientName) }}>{initials(q.clientName)}</div>
                        <div>
                          <div className="qt-client-name">{q.clientName}</div>
                          <div className="qt-client-email">{q.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{q.subject}</td>
                    <td>{q.serviceType || 'ERP'}</td>
                    <td><StatusPill status={q.status} /></td>
                    <td>{fmtDateTime(q.updatedAt)}</td>
                    <td>
                      <div className="qt-action-group">
                        <button className="qt-act-btn view" title="View" onClick={() => setViewQt(q)}><FiEye size={14} /></button>
                        {EDITABLE_STATUSES.has(q.status) && (
                          <button className="qt-act-btn edit" title="Edit" onClick={() => setEditQt(q)}><FiEdit2 size={14} /></button>
                        )}
                        {EDITABLE_STATUSES.has(q.status) && (
                          <button className="qt-act-btn email" title="Send for Super Admin confirmation" onClick={() => handleSubmitForApproval(q.id)}><FiSend size={14} /></button>
                        )}
                        {(q.status === 'Approved' || q.status === 'Sent' || q.status === 'Sent to Client') && (
                          <>
                            <button className="qt-act-btn whatsapp" title="Send / Resend via WhatsApp" onClick={() => handleWhatsAppSend(q)}><FaWhatsapp size={14} /></button>
                            <button className="qt-act-btn mail" title="Send / Resend via Email" onClick={() => handleEmailSend(q)}><FiMail size={14} /></button>
                          </>
                        )}
                        {q.generatedPdfPath && (
                          <button className="qt-act-btn download" title="Download PDF" onClick={() => handleDownload(q)}><FiDownload size={14} /></button>
                        )}
                        {EDITABLE_STATUSES.has(q.status) && (
                          <button className="qt-act-btn del" title="Delete" onClick={() => handleDelete(q.id)}><FiTrash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="qt-pagination-bar">
          <div className="qt-rows-select">
            Rows per page:
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="qt-page-nums">
            <button className="qt-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft /></button>
            {pageNums().map((n, i) => n === '...'
              ? <span key={`e${i}`}>…</span>
              : <button key={n} className={`qt-pg-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>)}
            <button className="qt-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><FiChevronRight /></button>
          </div>
        </div>
      </div>

      {showForm && (
        <QuotationFormModal
          initial={null}
          leads={leads}
          templates={templates}
          onClose={() => setShowForm(false)}
          onSave={handleSaved}
        />
      )}
      {editQt && (
        <QuotationFormModal
          initial={editQt}
          leads={leads}
          templates={templates}
          onClose={() => setEditQt(null)}
          onSave={handleSaved}
        />
      )}
      {viewQt && (
        <ViewModal quotation={viewQt} onClose={() => setViewQt(null)} onDownload={handleDownload} />
      )}
    </div>
  );
};

export default Quotations;