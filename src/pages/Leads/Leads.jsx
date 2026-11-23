import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leadService } from '../../services/leadService';
import { FaArrowLeft, FaPhone, FaSearch, FaMapMarkerAlt, FaEye, FaTimes, FaSyncAlt } from 'react-icons/fa';
import './Leads.css';

/* Keep these labels and colors aligned with Superadmin Leads.jsx. */
const STATUS_STYLE = {
  New: { bg: '#e0f2fe', color: '#0369a1' },
  Contacted: { bg: '#fef9c3', color: '#92400e' },
  Interested: { bg: '#dcfce7', color: '#15803d' },
  'Not Interested': { bg: '#fee2e2', color: '#b91c1c' },
  'Follow-up': { bg: '#fef3c7', color: '#b45309' },
  Converted: { bg: '#d1fae5', color: '#065f46' },
  'No Response': { bg: '#e0e7ff', color: '#4338ca' },
};
const STATUSES = ['All Status', 'New', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 'Converted', 'No Response'];

const fmt = value => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// ─── Telecaller "UP" updates (UP1, UP2, …) ───────────────────────────────────
// The Call Panel saves every call update as UPn inside lead.notes (JSON) and the
// backend now mirrors it into excelData. We read BOTH here, so the district table
// always shows every update - even for leads saved before the backend sync existed.
const UP_KEY_RE = /^up\s*[-_ ]?\s*(\d{1,4})$/i;
const upNumber = key => {
  const match = String(key ?? '').trim().match(UP_KEY_RE);
  return match ? Number(match[1]) : null;
};
const hasValue = value => value !== null && value !== undefined && String(value).trim() !== '';

const parseNotesObject = notes => {
  if (!notes || typeof notes !== 'string') return null;
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null; // normal telecalling note (plain text)
  }
};

// The Excel snapshot is still the source of truth for the table columns, just
// as in Superadmin Leads.jsx. On top of it we add the telecaller's UPn updates.
// Priority for a given UPn: Excel value > notes JSON > lead.up1..up5 field.
const getLeadRecord = lead => {
  const notesObject = parseNotesObject(lead?.notes);
  let record = {};

  if (
    lead?.excelData &&
    typeof lead.excelData === 'object' &&
    !Array.isArray(lead.excelData) &&
    Object.keys(lead.excelData).length > 0
  ) {
    record = { ...lead.excelData };            // PRIMARY: complete Excel row
  } else if (notesObject) {
    record = { ...notesObject };               // BACKWARD COMPATIBILITY: old leads
  }

  const updates = {};
  const collect = (key, value) => {
    const n = upNumber(key);
    if (n !== null && hasValue(value) && !hasValue(updates[n])) updates[n] = String(value).trim();
  };
  if (notesObject) Object.entries(notesObject).forEach(([key, value]) => collect(key, value));
  [1, 2, 3, 4, 5].forEach(n => collect(`up${n}`, lead?.[`up${n}`]));

  Object.entries(updates).forEach(([number, value]) => {
    const n = Number(number);
    const existingKey = Object.keys(record).find(key => upNumber(key) === n);
    if (existingKey === undefined) record[`UP${n}`] = value;
    else if (!hasValue(record[existingKey])) record[existingKey] = value;
  });

  return record;
};

// Read one table cell. UP columns match by number, so "UP1", "up1" and "UP 1" are the same column.
const getCellValue = (record, column) => {
  const n = upNumber(column);
  if (n === null) return record[column];
  const key = Object.keys(record).find(k => upNumber(k) === n);
  return key === undefined ? undefined : record[key];
};

const LeadDetails = ({ lead, onClose, onCall }) => {
  if (!lead) return null;
  const excel = getLeadRecord(lead);
  const notesObject = parseNotesObject(lead.notes);
  // never show the raw JSON payload as "Notes"
  const plainNotes = notesObject ? notesObject.TC_NEXT_FOLLOWUP_NOTE : lead.notes;
  const known = {
    'Lead ID': lead.leadId || lead.id,
    Name: lead.name,
    Mobile: lead.mobile,
    'Phone Number': lead.phoneNumber,
    Email: lead.email,
    District: lead.district,
    Area: lead.area,
    Status: lead.status,
    Source: lead.source,
    Campaign: lead.campaign,
    Category: lead.category,
    Address: lead.schoolAddress,
    'School Current Location': lead.schoolCurrentLocation,
    Notes: plainNotes,
  };
  const knownKeys = Object.keys(known).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const entries = Object.entries(excel).filter(([key]) =>
    upNumber(key) === null && !knownKeys.includes(key.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const updateEntries = Object.entries(excel)
    .filter(([key, value]) => upNumber(key) !== null && hasValue(value))
    .sort((a, b) => upNumber(a[0]) - upNumber(b[0]))
    .map(([key, value]) => [`UP${upNumber(key)}`, value]);
  return (
    <div className="lead-modal-overlay" onClick={onClose}>
      <div className="lead-modal" onClick={e => e.stopPropagation()}>
        <div className="lead-modal-header">
          <div><h2>{lead.name || 'Lead Details'}</h2><span>{lead.district || 'Unknown District'}</span></div>
          <button onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>
        <div className="lead-modal-actions"><button className="lead-call-btn" onClick={() => onCall(lead)}><FaPhone /> Call Customer</button></div>
        <div className="lead-detail-grid">
          {Object.entries(known).map(([key, value]) => <div className="lead-detail-field" key={key}><label>{key}</label><div>{fmt(value)}</div></div>)}
          {entries.map(([key, value]) => <div className="lead-detail-field" key={`excel-${key}`}><label>{key}</label><div>{fmt(value)}</div></div>)}
          {updateEntries.map(([key, value]) => <div className="lead-detail-field" key={`up-${key}`}><label>{key}</label><div>{fmt(value)}</div></div>)}
        </div>
        <div className="lead-modal-footer"><small>Last updated: {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('en-IN') : '—'}</small><button onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
};

const Leads = ({ onNavigate }) => {
  const { user } = useAuth();
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('All Status');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewLead, setViewLead] = useState(null);
  // Kept to match Superadmin's table row selection geometry. Telecallers do
  // not receive destructive bulk actions; selection is intentionally local.
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  const loadDistricts = useCallback(async () => {
    try {
      setDistrictLoading(true); setError('');
      const data = await leadService.getMyDistricts();
      setDistricts((Array.isArray(data) ? data : []).map(d => ({ ...d, district: d.district || d.name })));
    } catch (e) { setError(e.message || 'Failed to load assigned districts'); }
    finally { setDistrictLoading(false); }
  }, []);

  // silent = background refresh (no spinner, keeps current page and filters)
  const loadLeads = useCallback(async (district, silent = false) => {
    if (!district) { setLeads([]); setLoading(false); return; }
    try {
      if (!silent) { setLoading(true); setError(''); }
      const data = await leadService.getMyLeadsByDistrict(district);
      setLeads(Array.isArray(data) ? data : []);
      if (!silent) setPage(1);
    } catch (e) {
      if (!silent) { setLeads([]); setError(e.message || 'Failed to load district leads'); }
    } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { loadDistricts(); }, [loadDistricts]);
  useEffect(() => { if (selectedDistrict) loadLeads(selectedDistrict); }, [selectedDistrict, loadLeads]);

  // Pick up new call-panel updates (UP1, UP2…) when the telecaller comes back to this tab/window.
  useEffect(() => {
    if (!selectedDistrict) return undefined;
    const refresh = () => { if (document.visibilityState === 'visible') loadLeads(selectedDistrict, true); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [selectedDistrict, loadLeads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(lead => {
      const record = getLeadRecord(lead);
      const allValues = [...Object.values(record), ...Object.values(lead || {})];
      const matchesSearch = !q || allValues.some(value => fmt(value).toLowerCase().includes(q));
      const matchesStatus = statusF === 'All Status' || lead.status === statusF;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusF]);

  useEffect(() => { setPage(1); }, [search, statusF, rowsPerPage]);

  // Same dynamic-column algorithm as Superadmin DistrictView (stored Excel keys, first-seen order).
  // UP columns are merged by number (UP1, UP2 … UPn) and kept together, in order, where the
  // first UP column sits - so every update saved from the Call Panel gets its own column.
  const columns = useMemo(() => {
    const seen = new Set();
    const base = [];
    const upNumbers = new Set();
    let upIndex = -1;
    leads.forEach(lead => Object.keys(getLeadRecord(lead)).forEach(key => {
      const column = String(key ?? '').trim();
      if (!column) return;
      const n = upNumber(column);
      if (n !== null) {
        if (!upNumbers.has(n)) { upNumbers.add(n); if (upIndex === -1) upIndex = base.length; }
        return;
      }
      const normalized = column.toLowerCase();
      if (!seen.has(normalized)) { seen.add(normalized); base.push(column); }
    }));
    if (upIndex === -1) return base;
    const upColumns = [...upNumbers].sort((a, b) => a - b).map(n => `UP${n}`);
    return [...base.slice(0, upIndex), ...upColumns, ...base.slice(upIndex)];
  }, [leads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const stats = useMemo(() => ({
    total: leads.length,
    interested: leads.filter(l => l.status === 'Interested').length,
    followup: leads.filter(l => l.status === 'Follow-up').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    notInterested: leads.filter(l => l.status === 'Not Interested').length,
    pending: leads.filter(l => l.status === 'New' || l.status === 'Contacted').length,
  }), [leads]);

  const handleCall = lead => onNavigate?.('callpanel', { state: { lead, action: 'startCall' } });
  const toggleSelect = id => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const toggleAll = () => {
    const visibleIds = paginated.map(lead => lead.id || lead.leadId);
    setSelected(current => visibleIds.length > 0 && visibleIds.every(id => current.includes(id))
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };
  const backToDistricts = () => { setSelectedDistrict(''); setLeads([]); setSearch(''); setStatusF('All Status'); setPage(1); setSelected([]); };

  if (!selectedDistrict) return (
    <div className="leads-page">
      <div className="leads-header"><div><h1 className="leads-title">My Leads</h1><p className="breadcrumb"><FaMapMarkerAlt /> {user?.fullName || user?.username || 'Telecaller'} · Assigned districts</p></div><button className="btn-primary" onClick={() => onNavigate?.('dashboard')}><FaArrowLeft /> Back</button></div>
      {error && <div className="lead-error">{error}</div>}
      {districtLoading ? <div className="lead-loading">Loading assigned districts…</div> : districts.length === 0 ? <div className="lead-empty"><h3>No districts assigned</h3><p>Ask the Super Admin to assign districts to your telecaller account.</p></div> : <div className="district-grid">
        {districts.map(d => <button className="district-card" key={d.district} onClick={() => setSelectedDistrict(d.district)}><div className="district-card-icon"><FaMapMarkerAlt /></div><div className="district-card-name">{d.district}</div><div className="district-card-badge badge-assigned">{Number(d.leadCount || 0).toLocaleString()} Leads</div><span className="district-card-link">View Leads →</span></button>)}
      </div>}
    </div>
  );

  return (
    <div className="leads-page district-view">
      <div className="district-view-header"><button className="btn-back" onClick={backToDistricts}><FaArrowLeft /> Districts</button><h1 className="district-view-title"><FaMapMarkerAlt /> {selectedDistrict}</h1><div className="header-actions"><button className="btn-outline-primary" onClick={() => loadLeads(selectedDistrict)}><FaSyncAlt /> Refresh</button><button className="btn-primary" onClick={() => onNavigate?.('dashboard')}><FaArrowLeft /> Back</button></div></div>
      {error && <div className="lead-error">{error}</div>}
      {!loading && <div className="stats-bar"><div className="stat-chip"><span className="stat-chip-icon">📊</span><div><div className="stat-chip-label">Total Leads</div><div className="stat-chip-val">{stats.total}</div></div></div><div className="stat-chip"><span className="stat-chip-icon">💚</span><div><div className="stat-chip-label">Interested</div><div className="stat-chip-val">{stats.interested}</div></div></div><div className="stat-chip"><span className="stat-chip-icon">🔄</span><div><div className="stat-chip-label">Follow-up</div><div className="stat-chip-val">{stats.followup}</div></div></div><div className="stat-chip"><span className="stat-chip-icon">✅</span><div><div className="stat-chip-label">Converted</div><div className="stat-chip-val">{stats.converted}</div></div></div><div className="stat-chip"><span className="stat-chip-icon">⏳</span><div><div className="stat-chip-label">Pending</div><div className="stat-chip-val">{stats.pending}</div></div></div></div>}
      <div className="leads-main">
        <div className="filter-bar"><div className="search-wrap"><FaSearch className="search-ico" /><input className="filter-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complete lead data..." /></div><select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select><button className="btn-reset" onClick={() => { setSearch(''); setStatusF('All Status'); }}>Reset</button></div>
        <div className="table-toolbar"><div className="total-count">Showing <strong>{filtered.length.toLocaleString()}</strong> of <strong>{leads.length.toLocaleString()}</strong> leads</div><div className="toolbar-right"><span className="table-note">Excel columns match Superadmin</span></div></div>
        <div className="table-wrap">{loading ? <div className="lead-loading">Loading leads…</div> : <table className="leads-table" style={{ minWidth: Math.max(900, (columns.length + 2) * 150) }}><thead><tr><th className="select-col"><input type="checkbox" aria-label="Select visible leads" checked={paginated.length > 0 && paginated.every(lead => selected.includes(lead.id || lead.leadId))} onChange={toggleAll} /></th>{columns.map(column => <th key={column}>{column}</th>)}<th className="actions-col">Actions</th></tr></thead><tbody>{paginated.length === 0 ? <tr><td colSpan={columns.length + 2} className="empty-row">No leads found.</td></tr> : paginated.map(lead => { const record = getLeadRecord(lead); const id = lead.id || lead.leadId; return <tr key={id}><td className="select-col"><input type="checkbox" aria-label={`Select lead ${id}`} checked={selected.includes(id)} onChange={() => toggleSelect(id)} /></td>{columns.map(column => { const cell = getCellValue(record, column); return <td className="dyn-cell" key={column} title={fmt(cell)}>{fmt(cell)}</td>; })}<td><div className="action-group"><button className="act-btn" title="View complete lead" onClick={() => setViewLead(lead)}><FaEye /></button><button className="act-btn" title="Call" onClick={() => handleCall(lead)}><FaPhone /></button></div></td></tr>; })}</tbody></table>}</div>
        {!loading && <div className="pagination-bar"><div className="rows-select">Rows per page: <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></div><div className="pagination-controls"><button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button><span>Page {page} of {totalPages}</span><button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button></div></div>}
      </div>
      {!loading && filtered.length > 0 && <div className="lead-data-note">Showing every Excel column uploaded by the Super Admin for this district; use View for the complete record or Call to start a call.</div>}
      <LeadDetails lead={viewLead} onClose={() => setViewLead(null)} onCall={handleCall} />
    </div>
  );
};

export default Leads;

