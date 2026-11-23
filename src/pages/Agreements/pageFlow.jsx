// src/pages/Agreements/pageFlow.jsx
// Shared by the Telecaller editor and the Super Admin viewer.
// Lays the agreement out on real A4 pages so it matches the generated PDF
// (AgreementPdfService: @page margin 42mm 20mm 52mm 20mm, letterpad stamped on every page):
//   * the letterpad is drawn once per page (never stretched / repeated through the text)
//   * a block that would run into the bottom ribbon/footer area is pushed to the next page
//   * logo + footer are drawn on every page at the same positions the PDF uses
import React, { useCallback, useEffect, useState } from 'react';
import { FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';

export const PAGE_W = 794;                 // A4 @96dpi
export const PAGE_H = 1123;
export const PAD_TOP = Math.round(42 * 3.7795);      // 42mm  (logo ends ~39.5mm)
export const PAD_BOTTOM = Math.round(52 * 3.7795);   // 52mm  (footer starts ~249mm)
export const PAD_SIDE = Math.round(20 * 3.7795);     // 20mm

export const pageBackground = (pad) =>
  pad
    ? { backgroundImage: `url(${pad})`, backgroundSize: `100% ${PAGE_H}px`, backgroundRepeat: 'repeat-y' }
    : {};

// Moves whole blocks (direct children of the body element) to the next page when they
// would cross into the bottom margin. Returns the number of pages.
export function usePageFlow(bodyRef, enabled) {
  const [pages, setPages] = useState(1);

  const run = useCallback(() => {
    const body = bodyRef.current;
    if (!body || !enabled) return;
    const kids = Array.from(body.children);
    kids.forEach((k) => { k.style.paddingTop = ''; });
    const bases = kids.map((k) => parseFloat(getComputedStyle(k).paddingTop) || 0);
    const contentH = PAGE_H - PAD_TOP - PAD_BOTTOM;

    kids.forEach((k, i) => {
      const top = k.offsetTop;
      const h = k.offsetHeight;
      const page = Math.floor(top / PAGE_H);
      const limit = (page + 1) * PAGE_H - PAD_BOTTOM;
      const pageStart = page * PAGE_H + PAD_TOP;
      if (top + h > limit && h <= contentH && top > pageStart + 2) {
        k.style.paddingTop = `${(page + 1) * PAGE_H + PAD_TOP - top + bases[i]}px`;
      }
    });

    const last = kids[kids.length - 1];
    const end = last ? last.offsetTop + last.offsetHeight : PAD_TOP;
    const n = Math.max(1, Math.ceil((end + PAD_BOTTOM) / PAGE_H));
    setPages((p) => (p === n ? p : n));
  }, [bodyRef, enabled]);

  // after every render (children's effects, e.g. auto-growing textareas, have already run)
  useEffect(() => { run(); });

  useEffect(() => {
    if (!enabled || !bodyRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => run());
    ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [enabled, bodyRef, run]);

  return pages;
}

// Logo + footer for every page, same coordinates as the PDF (fractions of the A4 page).
export function PageOverlays({ pages, logo, brand, footerPhone, footerWeb, footerAddress }) {
  const iconStyle = (top) => ({
    position: 'absolute', left: 0.14 * PAGE_W, top: top * PAGE_H, width: 19, height: 19, borderRadius: '50%',
    background: '#7b1113', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  const textStyle = (top, color) => ({
    position: 'absolute', left: 0.185 * PAGE_W, top: top * PAGE_H, height: 0.028 * PAGE_H, lineHeight: `${0.028 * PAGE_H}px`,
    fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 13, color, whiteSpace: 'nowrap',
  });
  return Array.from({ length: pages }, (_, i) => (
    <div key={i} aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: i * PAGE_H, width: PAGE_W, height: PAGE_H, pointerEvents: 'none', zIndex: 1 }}>
      {logo && (
        <div style={{ position: 'absolute', left: 0.094 * PAGE_W, top: 0.028 * PAGE_H, width: 0.46 * PAGE_W, height: 0.105 * PAGE_H, display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}
      <span style={iconStyle(0.842)}><FiPhone size={11} /></span>
      <span style={textStyle(0.838, '#111827')}>{footerPhone}</span>
      <span style={{ ...iconStyle(0.880), background: '#111827' }}><FiGlobe size={11} /></span>
      <span style={textStyle(0.876, '#1d4ed8')}>{footerWeb}</span>
      <span style={iconStyle(0.914)}><FiMapPin size={11} /></span>
      <div style={{ position: 'absolute', left: 0.185 * PAGE_W, top: 0.910 * PAGE_H, fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 13, lineHeight: '16px', color: '#c8102e', whiteSpace: 'nowrap' }}>
        {footerAddress.slice(0, 3).map((line, k) => (<div key={k}>{line}</div>))}
      </div>
    </div>
  ));
}