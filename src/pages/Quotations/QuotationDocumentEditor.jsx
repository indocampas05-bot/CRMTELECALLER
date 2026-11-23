// src/pages/Quotations/QuotationDocumentEditor.jsx
// A WYSIWYG editor that looks like the approved IndoCampas quotation PDFs.
// Every text is editable and rows / notes can be added or removed.
import React from 'react';
import { FiPlus, FiTrash2, FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';
import './QuotationDocumentEditor.css';

// ─── helpers shared with the form ───────────────────────────────────────────
export const kindOfTemplate = (t) => {
  if (!t || !String(t.id || '').startsWith('builtin-')) return null;
  return String(t.id).includes('erp') ? 'erp' : 'dm';
};

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const SIGN = { signCompany: 'For INDOCAMPAS TECH PRIVATE LIMITED', signName: 'R. Aravinda Raj', signTitle: 'Chief Executive Officer' };

export const defaultDoc = (kind) => kind === 'erp'
  ? {
      __kind: 'erp', title: 'QUOTATION', date: today(), attn: 'The Principal', strength: '', gstPercent: '18',
      plans: [
        { name: 'ERP PRO – Per Student/Year', rate: '60' },
        { name: 'ERP PRO PLUS – Per Student/Year', rate: '120' },
        { name: 'ERP PRO MAX – Per Student/Year', rate: '200' },
      ],
      freeRows: [
        { label: 'Admission Dashboard', text: 'Online Dashboard absolutely FREE' },
        { label: 'Digital Marketing', text: 'Digital Marketing: 2 Videos absolutely FREE' },
      ],
      notes: [
        { label: 'Admission Dashboard:', text: 'Online admissions, student data management and reports.' },
        { label: 'Digital Marketing:', text: 'Social media promotions and admission lead generation.' },
        { label: 'Admission Charges:', text: '₹2,000 per student admitted through our platform.' },
        { label: 'Special Offer:', text: 'ERP PRO free with the combined Admission Dashboard and Digital Marketing package, subject to confirmation.' },
      ],
      ...SIGN,
    }
  : {
      __kind: 'dm', title: 'DIGITAL MARKETING QUOTATION', date: today(), attn: 'The Principal', gstPercent: '18',
      services: [
        { name: 'Promotional Videos', qty: '' },
        { name: 'Social Media Posters', qty: '' },
        { name: 'Duration', qty: '1 Month' },
      ],
      package: '', discount: '', extras: [], payment: '100% Advance.', notes: [],
      ...SIGN,
    };

// Reads the saved document (fieldValues.doc) of an existing quotation, or null.
export const parseDoc = (fieldValues, kind) => {
  try {
    const raw = fieldValues && fieldValues.doc;
    if (!raw) return null;
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return d && typeof d === 'object' ? { ...defaultDoc(kind), ...d, __kind: kind } : null;
  } catch { return null; }
};

const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
const inr = (n) => {
  const abs = Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}₹${abs}`;
};

// ─── tiny inline inputs ─────────────────────────────────────────────────────
const T = ({ value, onChange, className = '', ...rest }) => (
  <input className={`qde-t ${className}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
);
const TA = ({ value, onChange, className = '' }) => (
  <textarea className={`qde-t qde-ta ${className}`} rows={2} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
);
const Del = ({ onClick, title = 'Remove row' }) => (
  <button type="button" className="qde-x" onClick={onClick} title={title}><FiTrash2 size={13} /></button>
);
const Add = ({ onClick, children }) => (
  <button type="button" className="qde-add" onClick={onClick}><FiPlus size={12} /> {children}</button>
);

// ─── main component ─────────────────────────────────────────────────────────
const QuotationDocumentEditor = ({ kind, doc, setDoc, form, set, quotationNo }) => {
  const up = (patch) => setDoc((d) => ({ ...d, ...patch }));
  const upRow = (key, i, patch) => setDoc((d) => ({ ...d, [key]: d[key].map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const addRow = (key, row) => setDoc((d) => ({ ...d, [key]: [...(d[key] || []), row] }));
  const delRow = (key, i) => setDoc((d) => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }));

  const gstRate = num(doc.gstPercent) / 100;

  // ── ERP numbers ──
  const strength = Math.round(num(doc.strength));

  // ── DM numbers ──
  const pkg = num(doc.package);
  const dmGst = pkg * gstRate;
  const discount = num(doc.discount);
  const extrasTotal = (doc.extras || []).reduce((s, r) => s + num(r.amount), 0);
  const finalAmount = pkg + dmGst - discount + extrasTotal;

  const notesBlock = (
    <div className="qde-notes">
      {(doc.notes || []).map((n, i) => (
        <div className="qde-note" key={i}>
          {kind === 'erp' && <T className="qde-b qde-note-label" value={n.label} onChange={(v) => upRow('notes', i, { label: v })} placeholder="Label:" />}
          {kind === 'erp'
            ? <TA value={n.text} onChange={(v) => upRow('notes', i, { text: v })} />
            : <T className="qde-b" value={n.text} onChange={(v) => upRow('notes', i, { text: v })} placeholder="Note (e.g. GST Applicable.)" />}
          <Del onClick={() => delRow('notes', i)} title="Remove line" />
        </div>
      ))}
      <Add onClick={() => addRow('notes', kind === 'erp' ? { label: '', text: '' } : { text: '' })}>Add note line</Add>
    </div>
  );

  return (
    <div className="qde-wrap">
      <div className="qde-hint">Edit the quotation exactly as it will appear in the PDF. Click any text to change it; use + / 🗑 to add or remove rows.</div>
      <div className="qde-page">
        {/* letterhead */}
        <div className="qde-ribbon-tr" />
        <div className="qde-head">
          <div className="qde-logo">INDO</div>
          <div className="qde-brand">
        
          </div>
        </div>

        <div className="qde-body">
          <T className="qde-title qde-b" value={doc.title} onChange={(v) => up({ title: v })} />

          {/* quotation no. + date */}
          <div className={`qde-meta ${kind === 'dm' ? 'qde-meta-right' : ''}`}>
            <div><b>Quotation No.:</b> <span className="qde-auto">{quotationNo || 'auto-generated on save'}</span></div>
            <div className="qde-inline"><b>Date:</b> <T value={doc.date} onChange={(v) => up({ date: v })} style={{ width: 120 }} /></div>
          </div>

          {/* To / org / attn / subject */}
          <div className="qde-inline"><b>To:</b> <T value={doc.attn} onChange={(v) => up({ attn: v })} placeholder="The Principal" /></div>
          {kind === 'erp'
            ? <T className="qde-b qde-org" value={form.organization} onChange={(v) => set('organization', v)} placeholder="SCHOOL / ORGANIZATION NAME" />
            : <>
                <div className="qde-inline"><b>Organization:</b> <T value={form.organization} onChange={(v) => set('organization', v)} /></div>
                <div className="qde-inline"><b>Location:</b> <T value={form.address} onChange={(v) => set('address', v)} placeholder="Address" /></div>
              </>}
          <div className="qde-inline"><b>Subject:</b> <T value={form.subject} onChange={(v) => set('subject', v)}
            placeholder={kind === 'erp' ? 'ERP, Student Strength ( 150 )' : 'Digital Marketing Services'} /></div>

          {kind === 'erp' ? (
            <>
              <div className="qde-inline qde-strength"><b>Student Strength:</b> <T value={doc.strength} onChange={(v) => up({ strength: v })} style={{ width: 90 }} placeholder="150" />
                <b style={{ marginLeft: 16 }}>GST %:</b> <T value={doc.gstPercent} onChange={(v) => up({ gstPercent: v })} style={{ width: 50 }} /></div>

              <div className="qde-table qde-erp">
                <div className="qde-tr qde-th"><div>Service</div><div>Per Student</div><div>Amount</div><div>GST</div><div>Total</div></div>
                {doc.plans.map((p, i) => {
                  const amount = num(p.rate) * strength; const gst = amount * gstRate;
                  return (
                    <div className="qde-tr" key={i}>
                      <div><T className="qde-b" value={p.name} onChange={(v) => upRow('plans', i, { name: v })} /></div>
                      <div className="qde-c"><T className="qde-b qde-c" value={p.rate} onChange={(v) => upRow('plans', i, { rate: v })} /></div>
                      <div className="qde-c">{inr(amount)}</div>
                      <div className="qde-c">{inr(gst)}</div>
                      <div className="qde-c">{inr(amount + gst)}</div>
                      <Del onClick={() => delRow('plans', i)} />
                    </div>
                  );
                })}
                {doc.freeRows.map((r, i) => (
                  <div className="qde-tr qde-free" key={`f${i}`}>
                    <div><T className="qde-b" value={r.label} onChange={(v) => upRow('freeRows', i, { label: v })} /></div>
                    <div className="qde-span"><T className="qde-b" value={r.text} onChange={(v) => upRow('freeRows', i, { text: v })} /></div>
                    <Del onClick={() => delRow('freeRows', i)} />
                  </div>
                ))}
              </div>
              <div className="qde-addrow">
                <Add onClick={() => addRow('plans', { name: 'New Plan – Per Student/Year', rate: '' })}>Add plan row</Add>
                <Add onClick={() => addRow('freeRows', { label: '', text: '' })}>Add free / info row</Add>
              </div>
              {notesBlock}
            </>
          ) : (
            <>
              <div className="qde-table qde-dm">
                <div className="qde-tr qde-th"><div>Service</div><div>Qty</div></div>
                {doc.services.map((s, i) => (
                  <div className="qde-tr" key={i}>
                    <div><T value={s.name} onChange={(v) => upRow('services', i, { name: v })} /></div>
                    <div className="qde-c"><T className="qde-c" value={s.qty} onChange={(v) => upRow('services', i, { qty: v })} /></div>
                    <Del onClick={() => delRow('services', i)} />
                  </div>
                ))}
              </div>
              <div className="qde-addrow"><Add onClick={() => addRow('services', { name: '', qty: '' })}>Add service row</Add></div>

              <div className="qde-b qde-sub">Quotation Amount</div>
              <div className="qde-table qde-dm">
                <div className="qde-tr qde-th"><div>Particulars</div><div>Amount</div></div>
                <div className="qde-tr"><div>Package Amount</div><div className="qde-c"><T className="qde-c" value={doc.package} onChange={(v) => up({ package: v })} placeholder="e.g. 16000" /></div></div>
                <div className="qde-tr"><div>GST @ <T value={doc.gstPercent} onChange={(v) => up({ gstPercent: v })} style={{ width: 38, textAlign: 'center' }} />%</div><div className="qde-c">{inr(dmGst)}</div></div>
                <div className="qde-tr"><div>Package Discount <span className="qde-auto">(optional)</span></div><div className="qde-c"><T className="qde-c" value={doc.discount} onChange={(v) => up({ discount: v })} placeholder="0" /></div></div>
                {(doc.extras || []).map((r, i) => (
                  <div className="qde-tr" key={i}>
                    <div><T value={r.label} onChange={(v) => upRow('extras', i, { label: v })} placeholder="Extra charge / adjustment" /></div>
                    <div className="qde-c"><T className="qde-c" value={r.amount} onChange={(v) => upRow('extras', i, { amount: v })} placeholder="+/- amount" /></div>
                    <Del onClick={() => delRow('extras', i)} />
                  </div>
                ))}
                <div className="qde-tr qde-final"><div className="qde-b">Final Amount</div><div className="qde-c qde-b">{inr(finalAmount)}</div></div>
              </div>
              <div className="qde-addrow"><Add onClick={() => addRow('extras', { label: '', amount: '' })}>Add amount row</Add></div>

              <div className="qde-inline"><b>Payment:</b> <T value={doc.payment} onChange={(v) => up({ payment: v })} /></div>
              {notesBlock}
            </>
          )}

          {/* signature */}
          <div className="qde-sign">
            <T className="qde-b qde-sign-co" value={doc.signCompany} onChange={(v) => up({ signCompany: v })} />
            <T value={doc.signName} onChange={(v) => up({ signName: v })} />
            <T value={doc.signTitle} onChange={(v) => up({ signTitle: v })} />
          </div>
        </div>

        {/* footer */}
        <div className="qde-ribbon-bl" />
        <div className="qde-foot">
          <div><span className="qde-ico"><FiPhone size={12} /></span> 8925811993 / 8925811994</div>
          <div><span className="qde-ico qde-ico-dark"><FiGlobe size={12} /></span> <span className="qde-link">www.indocampas.com</span></div>
          <div><span className="qde-ico"><FiMapPin size={12} /></span> TIDEL NEO - Thiruchitrambalam<br />Koot Road, Tamil Nadu 605111</div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDocumentEditor;