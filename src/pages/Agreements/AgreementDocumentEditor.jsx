// src/pages/Agreements/AgreementDocumentEditor.jsx
// WYSIWYG editor that looks like the approved IndoCampas agreement PDFs
// (same idea as QuotationDocumentEditor). Every text is editable; clauses,
// bullet points and table rows can be added / removed / moved.
import React, { useEffect, useRef, useState } from 'react';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';
import { LOGO_MARK_B64, RIBBON_TOP_B64, RIBBON_BOTTOM_B64 } from './Brandassets';
import agreementBrandingService from '../../services/agreementBrandingService';
import { PAGE_W, PAGE_H, PAD_TOP, PAD_SIDE, pageBackground, usePageFlow, PageOverlays } from './pageFlow';
import './AgreementDocumentEditor.css';

// auto-growing textarea
const TA = ({ value, onChange, className = '', placeholder }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} rows={1} className={`ade-t ${className}`} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
};
const IN = ({ value, onChange, className = '', ...r }) => (
  <input className={`ade-t ade-in ${className}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...r} />
);

export default function AgreementDocumentEditor({ doc, setDoc }) {
  // Letterpad / logo / footer uploaded by the Super Admin (Quotations page) - shared with Agreements.
  const [brand, setBrand] = useState(null);
  const bodyRef = useRef(null);
  useEffect(() => {
    let alive = true;
    agreementBrandingService.get().then((b) => { if (alive) setBrand(b); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const pad = brand?.letterpadDataUrl || '';
  const logo = brand?.hasLogo ? brand.logoDataUrl : '';
  const footerPhone = brand?.phone || '8925811993 / 8925811994';
  const footerWeb = brand?.website || 'www.indocampas.com';
  const footerAddress = (brand?.address || 'TIDEL NEO - Thiruchitrambalam\nKoot Road, Tamil Nadu 605111').split('\n');

  const paged = !!(pad || logo);
  const pages = usePageFlow(bodyRef, paged);

  const up = (patch) => setDoc((d) => ({ ...d, ...patch }));
  const setBlock = (i, patch) => setDoc((d) => ({ ...d, blocks: d.blocks.map((b, k) => (k === i ? { ...b, ...patch } : b)) }));
  const delBlock = (i) => setDoc((d) => ({ ...d, blocks: d.blocks.filter((_, k) => k !== i) }));
  const addAfter = (i, block) => setDoc((d) => { const b = [...d.blocks]; b.splice(i + 1, 0, block); return { ...d, blocks: b }; });
  const move = (i, dir) => setDoc((d) => {
    const j = i + dir; if (j < 0 || j >= d.blocks.length) return d;
    const b = [...d.blocks]; [b[i], b[j]] = [b[j], b[i]]; return { ...d, blocks: b };
  });

  const Tools = ({ i }) => (
    <span className="ade-tools">
      <button type="button" title="Move up" onClick={() => move(i, -1)}><FiArrowUp size={12} /></button>
      <button type="button" title="Move down" onClick={() => move(i, 1)}><FiArrowDown size={12} /></button>
      <button type="button" title="Add paragraph below" onClick={() => addAfter(i, { t: 'p', text: '' })}><FiPlus size={12} /></button>
      <button type="button" title="Add heading below" onClick={() => addAfter(i, { t: 'h2', text: '' })}>H</button>
      <button type="button" title="Add bullet list below" onClick={() => addAfter(i, { t: 'ul', items: [''] })}>•</button>
      <button type="button" className="ade-del" title="Remove this block" onClick={() => delBlock(i)}><FiTrash2 size={12} /></button>
    </span>
  );

  const renderBlock = (b, i) => {
    if (b.t === 'h1') return <div className="ade-row" key={i}><TA className="ade-h1" value={b.text} onChange={(v) => setBlock(i, { text: v })} /><Tools i={i} /></div>;
    if (b.t === 'h2') return <div className="ade-row" key={i}><TA className="ade-h2" value={b.text} onChange={(v) => setBlock(i, { text: v })} /><Tools i={i} /></div>;
    if (b.t === 'p') return <div className="ade-row" key={i}><TA className="ade-p" value={b.text} onChange={(v) => setBlock(i, { text: v })} /><Tools i={i} /></div>;
    if (b.t === 'ul') {
      return (
        <div className="ade-row" key={i}>
          <div className="ade-ul">
            {(b.items || []).map((it, k) => (
              <div className="ade-li" key={k}>
                <span className="ade-dot">•</span>
                <TA value={it} onChange={(v) => setBlock(i, { items: b.items.map((x, n) => (n === k ? v : x)) })} />
                <button type="button" className="ade-x" title="Remove point" onClick={() => setBlock(i, { items: b.items.filter((_, n) => n !== k) })}><FiTrash2 size={11} /></button>
              </div>
            ))}
            <button type="button" className="ade-add" onClick={() => setBlock(i, { items: [...(b.items || []), ''] })}><FiPlus size={11} /> Add point</button>
          </div>
          <Tools i={i} />
        </div>
      );
    }
    if (b.t === 'table') {
      return (
        <div className="ade-row" key={i}>
          <div className="ade-table">
            {b.rows.map((r, ri) => (
              <div className="ade-tr" key={ri}>
                {r.map((c, ci) => (
                  <IN key={ci} className={ri === 0 || ri === b.rows.length - 1 ? 'ade-b' : ''} value={c}
                    onChange={(v) => setBlock(i, { rows: b.rows.map((rr, a) => (a === ri ? rr.map((cc, z) => (z === ci ? v : cc)) : rr)) })} />
                ))}
                <button type="button" className="ade-x" onClick={() => setBlock(i, { rows: b.rows.filter((_, a) => a !== ri) })}><FiTrash2 size={11} /></button>
              </div>
            ))}
            <button type="button" className="ade-add" onClick={() => setBlock(i, { rows: [...b.rows.slice(0, -1), ['', ''], b.rows[b.rows.length - 1]] })}><FiPlus size={11} /> Add row</button>
          </div>
          <Tools i={i} />
        </div>
      );
    }
    return null;
  };

  const SignBox = ({ title, k }) => (
    <div className="ade-sign-box">
      <div className="ade-b">{title}</div>
      <div>Signature: ______________</div>
      <div className="ade-inline">Name: <IN value={doc[k]?.name} onChange={(v) => up({ [k]: { ...doc[k], name: v } })} /></div>
      <div className="ade-inline">Designation: <IN value={doc[k]?.designation} onChange={(v) => up({ [k]: { ...doc[k], designation: v } })} /></div>
      <div className="ade-inline">Date: <IN value={doc[k]?.date} onChange={(v) => up({ [k]: { ...doc[k], date: v } })} /></div>
    </div>
  );

  return (
    <div className="ade-wrap">
  <div className="ade-page"
          style={paged ? { width: PAGE_W, maxWidth: 'none', height: pages * PAGE_H, minHeight: 0, padding: 0, boxSizing: 'border-box', position: 'relative', margin: '0 auto', ...pageBackground(pad) } : undefined}>
        {paged && <PageOverlays pages={pages} logo={logo} footerPhone={footerPhone} footerWeb={footerWeb} footerAddress={footerAddress} />}
        {!pad && !paged && <img className="ade-ribbon-tr" src={RIBBON_TOP_B64} alt="" />}
        {paged ? null : logo ? (
          <div className="ade-head">
            <img src={logo} alt="Company logo" style={{ height: 64, maxWidth: '46%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div className="ade-head">
            <img className="ade-logo" src={LOGO_MARK_B64} alt="" />
            <div className="ade-indo">INDO</div>
            <div className="ade-brand"><div className="ade-brand1">CAMPAS TECH</div><div className="ade-brand2">Private Limited</div></div>
          </div>
        )}
        <div className="ade-body" ref={bodyRef} style={paged ? { position: 'relative', zIndex: 2, boxSizing: 'border-box', padding: `${PAD_TOP}px ${PAD_SIDE}px 0`, margin: 0, width: '100%' } : undefined}>
          {doc.intro !== '' && <IN className="ade-center" value={doc.intro} onChange={(v) => up({ intro: v })} />}
          <div className="ade-inline"><b>Agreement Date:</b> <IN type="date" value={doc.date} onChange={(v) => up({ date: v })} style={{ width: 150 }} /></div>
          <TA className="ade-b" value={doc.providerText} onChange={(v) => up({ providerText: v })} />
          <div className="ade-center ade-b"><u>AND</u></div>
          <IN className="ade-b ade-org" value={doc.clientName} onChange={(v) => up({ clientName: v })} placeholder="SCHOOL / INSTITUTION NAME" />
          <TA value={doc.clientTail} onChange={(v) => up({ clientTail: v })} />
          <div className="ade-inline"><b>Address ({'{{address}}'}):</b> <IN value={doc.clientAddress} onChange={(v) => up({ clientAddress: v })} placeholder="School address" /></div>

          {doc.blocks.map(renderBlock)}

          <div className="ade-row"><div className="ade-h1 ade-static">SIGNATURES</div></div>
          <div className="ade-p ade-static">IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above.</div>
          <div className="ade-signs">
            <SignBox title="For INDOCAMPAS TECH PRIVATE LIMITED" k="providerSign" />
            <SignBox title={`For ${(doc.clientName || 'THE INSTITUTION').toUpperCase()}`} k="clientSign" />
          </div>
        </div>
        {!paged && <img className="ade-ribbon-bl" src={RIBBON_BOTTOM_B64} alt="" />}
        {!paged && <div className="ade-foot">
          <div><span className="ade-ico"><FiPhone size={12} /></span> {footerPhone}</div>
          <div><span className="ade-ico ade-ico-dark"><FiGlobe size={12} /></span> <span className="ade-link">{footerWeb}</span></div>
          <div><span className="ade-ico"><FiMapPin size={12} /></span> {footerAddress.map((line, i) => (<React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>))}</div>
        </div>}
      </div>
    </div>
  );
}