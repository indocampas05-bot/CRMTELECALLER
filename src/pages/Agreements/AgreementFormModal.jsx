// src/pages/Agreements/AgreementFormModal.jsx
// New / Edit Agreement. Works like the Quotation form:
//   1. pick the lead  2. click a category (Digital Marketing / Admin Dashboard /
//   Pro / Pro Plus / Pro Max)  3. the exact agreement opens in the WYSIWYG editor
//   4. edit anything  5. Save as Draft  ->  Submit for Super Admin verification.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiX, FiSave, FiDownload } from 'react-icons/fi';
import agreementService from '../../services/agreementService';
import AgreementDocumentEditor from './AgreementDocumentEditor';
import { CATEGORIES, categoryOf, defaultDoc, parseDoc, docToHtml } from './agreementDocs';

const firstNonBlank = (...v) => v.find((x) => x != null && String(x).trim() !== '') ?? '';
const leadKey = (l) => String(l?.leadId ?? l?.id ?? l?._id ?? '');
const leadName = (l) => firstNonBlank(l?.school, l?.schoolName, l?.name, l?.clientName);
const leadAddress = (l) => firstNonBlank(l?.schoolAddress, l?.address, l?.schoolCurrentLocation, l?.area);
const leadPincode = (l) => firstNonBlank(l?.pincode, l?.pinCode, l?.postalCode, l?.zipCode);

export default function AgreementFormModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial && initial !== 'new';
  const [leads, setLeads] = useState([]);
  const [leadId, setLeadId] = useState('');
  const [pincode, setPincode] = useState('');
  const [kind, setKind] = useState('');
  const [doc, setDoc] = useState(null);
  const drafts = useRef({});            // keeps edits when the user switches category and comes back
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const lead = useMemo(() => leads.find((l) => leadKey(l) === String(leadId)), [leads, leadId]);

  const loadLeads = async () => {
    try {
      setLoading(true); setError('');
      const list = await agreementService.leads();
      setLeads(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message || 'Unable to load leads'); } finally { setLoading(false); }
  };

  useEffect(() => {
    loadLeads();
    if (isEdit && typeof initial === 'object') {
      const k = initial.mergeValues?.category || 'pro';
      const d = parseDoc(initial.mergeValues, k);
      setLeadId(initial.leadId || ''); setPincode(initial.pincode || '');
      setKind(k);
      if (d) { setDoc(d); drafts.current[k] = d; }
      else setDoc(defaultDoc(k, { clientName: initial.clientName, clientAddress: initial.address }));
    }
    // eslint-disable-next-line
  }, []);

  const pickLead = (id) => {
    setLeadId(id);
    const l = leads.find((x) => leadKey(x) === String(id));
    if (!l) return;
    setPincode(leadPincode(l));
    // refresh client details in every open draft
    const patch = { clientName: leadName(l), clientAddress: leadAddress(l) };
    Object.keys(drafts.current).forEach((k) => { drafts.current[k] = { ...drafts.current[k], ...patch }; });
    setDoc((d) => (d ? { ...d, ...patch } : d));
  };

  const pickCategory = (k) => {
    if (doc && kind) drafts.current[kind] = doc;          // stash current edits
    setKind(k); setError(''); setSuccess('');
    setDoc(drafts.current[k] || defaultDoc(k, { clientName: leadName(lead), clientAddress: leadAddress(lead) }));
  };

  const resetToOriginal = () => {
    if (!window.confirm('Ella changes-um pooyidum. Original agreement-ku reset pannalaama?')) return;
    const d = defaultDoc(kind, { clientName: doc.clientName, clientAddress: doc.clientAddress });
    drafts.current[kind] = d; setDoc(d);
  };

  const validate = () => {
    if (!leadId) return 'Please select a lead / client';
    if (!kind || !doc) return 'Please click an agreement category';
    if (!String(doc.clientName || '').trim()) return 'Client / School name is required';
    if (!String(doc.clientAddress || '').trim()) return 'Client / School address is required';
    return '';
  };

  const save = async () => {
    const msg = validate(); if (msg) { setError(msg); return; }
    const cat = categoryOf(kind);
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        leadId, templateId: `builtin-${kind}`, agreementType: cat.agreementType, serviceType: cat.label,
        title: `${cat.label} Agreement`, pincode, agreementDate: doc.date,
        authorizedPersonName: doc.clientSign?.name || '', authorizedPersonDesignation: doc.clientSign?.designation || '',
        contentHtml: docToHtml(doc),
        mergeValues: { category: kind, client_name: doc.clientName.trim(), client_address: doc.clientAddress.trim(), pincode, doc: JSON.stringify(doc) },
      };
      const res = isEdit ? await agreementService.update(initial.id, payload) : await agreementService.create(payload);
      if (!res?.id) throw new Error('Server returned an invalid response.');
      setSaved(res); setSuccess('Agreement saved as Draft.');
      onSaved?.(res, false);
    } catch (e) { setError(e.message || 'Unable to save agreement'); } finally { setLoading(false); }
  };

  const openPdf = async () => {
    try { window.open(await agreementService.pdfBlobUrl(saved.id), '_blank', 'noopener,noreferrer'); }
    catch (e) { setError(e.message || 'Unable to load PDF'); }
  };

  return (
    <div className="agr-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="agr-modal-box agr-modal-box-wide" role="dialog" aria-modal="true">
        <div className="agr-modal-header">
          <span className="agr-modal-title">{isEdit ? 'Edit Agreement' : 'New Agreement'}</span>
          <button type="button" className="agr-close" onClick={onClose} disabled={loading}><FiX /></button>
        </div>
        <div className="agr-modal-body">
          {error && <div className="agr-error" role="alert">{error}{leads.length === 0 && <button type="button" className="agr-btn secondary" style={{ marginLeft: 12 }} onClick={loadLeads}>Retry</button>}</div>}
          {success && <div className="agr-success" role="status">{success}</div>}

          <div className="agr-form-row">
            <div className="agr-form-group"><label>Lead / Client</label>
              <select value={leadId} onChange={(e) => pickLead(e.target.value)} disabled={loading || isEdit}>
                <option value="">Select lead</option>
                {leads.map((l) => <option key={leadKey(l)} value={leadKey(l)}>{leadName(l) || leadKey(l)}</option>)}
              </select></div>
            <div className="agr-form-group"><label>Pincode</label><input value={pincode} onChange={(e) => setPincode(e.target.value)} /></div>
          </div>

          <div className="ade-section-title">Agreement Category (click one)</div>
          <div className="ade-cats">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.key} className={`ade-cat ${kind === c.key ? 'active' : ''}`} onClick={() => pickCategory(c.key)} disabled={loading}>
                <strong>{c.label}</strong><small>{c.sub}</small>
              </button>
            ))}
          </div>

          {doc && <AgreementDocumentEditor doc={doc} setDoc={setDoc} />}
        </div>
        <div className="agr-modal-footer">
          <button type="button" className="agr-btn secondary" onClick={onClose} disabled={loading}><FiX /> Close</button>
          {doc && <button type="button" className="agr-btn secondary" onClick={resetToOriginal} disabled={loading}>Reset to original</button>}
          <button type="button" className="agr-btn primary" onClick={save} disabled={loading || !doc}><FiSave /> {loading ? 'Saving...' : 'Save Agreement'}</button>
          {saved && <button type="button" className="agr-btn secondary" onClick={openPdf}><FiDownload /> PDF</button>}
        </div>
      </div>
    </div>
  );
}
