import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FiDownload, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';

import InvoiceTemplate from './InvoiceTemplate';
import { INVOICE_DEFAULTS, TEXT_KEYS } from './invoiceDefaults';
import paymentAdminService from '../../services/paymentAdminService';
import invoiceAssetService from '../../services/invoiceAssetService';

import './InvoiceEditorModal.css';
import './InvoiceEditorExtras.css';

const NUMBER_FORMAT = /^INV-IC\/\d{5,}$/;
const GSTIN_FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;
const PHONE_FORMAT = /^[0-9+\-\s]{7,15}$/;
const STATUS_OPTIONS = ['Paid', 'Partial Paid', 'Pending', 'Fully Paid', 'Verified'];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return String(value).slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
};

/** Backend invoice -> editor form (every field editable). */
const formFromInvoice = (inv) => {
  const form = {
    invoiceNumber: inv.invoiceNumber || '',
    invoiceDate: toInputDate(inv.invoiceDate || inv.paymentDate),
    paymentStatus: inv.paymentStatus || 'Paid',
    paymentType: inv.paymentType || '',
    organizationName: inv.organizationName || '',
    address: inv.address || '',
    phone: inv.phone || '',
    customerGstin: inv.customerGstin || '',
    email: inv.email || '',
    discountAmount: inv.discountAmount ?? 0,
    taxRate: inv.taxRate ?? 18,
    amountPaid: inv.amountPaid ?? 0,
  };

  // company / bank / declaration / signature: saved value, else the template default
  TEXT_KEYS.forEach((key) => {
    form[key] = inv[key] !== undefined && inv[key] !== null ? inv[key] : INVOICE_DEFAULTS[key];
  });

  form.items =
    Array.isArray(inv.items) && inv.items.length
      ? inv.items.map((i) => ({
          description: i.description || '',
          quantity: i.quantity ?? 1,
          rate: i.rate ?? 0,
        }))
      : [
          {
            description: inv.description || `${inv.paymentType || 'Service'} charges`,
            quantity: 1,
            rate: inv.totalAmount ?? 0,
          },
        ];

  return form;
};

/** Editor form -> object understood by InvoiceTemplate / printInvoicePdf (numbers cleaned). */
const toInvoiceView = (form) => ({
  ...form,
  discountAmount: num(form.discountAmount),
  taxRate: num(form.taxRate),
  amountPaid: num(form.amountPaid),
  items: form.items.map((i) => ({
    description: i.description,
    quantity: num(i.quantity),
    rate: num(i.rate),
  })),
});

const money = (v) => num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoiceEditorModal({ payment, onClose, onPrint, onSaved }) {
  const [form, setForm] = useState(null);
  const [assets, setAssets] = useState({ qrDataUrl: '', logoDataUrl: '', signatureDataUrl: '', thankYouDataUrl: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const previewRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(0.45);

  const hydrate = (inv) => {
    const f = formFromInvoice(inv);
    setForm(f);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [invoice, qr, brand] = await Promise.all([
          paymentAdminService.getInvoice(payment.id),
          paymentAdminService.getSharedQr().catch(() => null),
          invoiceAssetService.getAssets().catch(() => ({})),
        ]);
        if (!active) return;
        hydrate(invoice);
        setAssets({
          qrDataUrl: qr?.dataUrl || '',
          logoDataUrl: brand?.logoDataUrl || '',
          signatureDataUrl: brand?.signatureDataUrl || '',
          thankYouDataUrl: brand?.thankYouDataUrl || '',
        });
      } catch (e) {
        if (active) setLoadError(e.message || 'Unable to load the invoice. Generate the invoice first.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [payment.id]);

  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return undefined;
    const fit = () => {
      const w = Math.max(1, el.clientWidth - 48);
      const h = Math.max(1, el.clientHeight - 48);
      const s = Math.min(w / 1024, h / 1518, 1);
      setPreviewScale(Number.isFinite(s) ? Math.max(0.08, s) : 0.45);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setItem = (index, key, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));

  // Copy the Bill To name + address into the Shipping fields (both stay editable afterwards).
  const copyBillToShipping = () =>
    setForm((f) => ({ ...f, shippingName: f.organizationName, shippingAddress: f.address }));

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { description: '', quantity: 1, rate: 0 }] }));

  const removeItem = (index) =>
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== index) : f.items }));

  // what the preview + PDF show
  const view = useMemo(() => {
    if (!form) return {};
    return toInvoiceView(form);
  }, [form]);

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, taxable: 0, tax: 0, grand: 0, balance: 0 };
    const subtotal = form.items.reduce((s, i) => s + num(i.quantity) * num(i.rate), 0);
    const taxable = Math.max(0, subtotal - num(form.discountAmount));
    const tax = (taxable * num(form.taxRate)) / 100;
    const grand = taxable + tax;
    return { subtotal, taxable, tax, grand, balance: Math.max(0, grand - num(form.amountPaid)) };
  }, [form]);

  const validate = () => {
    if (!NUMBER_FORMAT.test(form.invoiceNumber.trim())) return 'Invoice number format must be INV-IC/00760.';
    if (!form.organizationName.trim()) return 'Client / organization name is required.';
    if (form.phone.trim() && !PHONE_FORMAT.test(form.phone.trim())) return 'Contact number must be 7-15 digits (digits, +, - and spaces only).';
    if (form.customerGstin.trim() && !GSTIN_FORMAT.test(form.customerGstin.trim().toUpperCase())) return 'GSTIN must be a valid 15-character GST number (e.g. 33ABCDE1234F1Z5).';
    if (!form.items.length) return 'Add at least one item.';
    for (const [i, item] of form.items.entries()) {
      if (!String(item.description).trim()) return `Item ${i + 1}: description is required.`;
      if (num(item.quantity) <= 0) return `Item ${i + 1}: quantity must be greater than 0.`;
      if (num(item.rate) < 0) return `Item ${i + 1}: rate cannot be negative.`;
    }
    if (num(form.discountAmount) < 0 || num(form.discountAmount) > totals.subtotal) return 'Discount must be between 0 and the subtotal.';
    if (num(form.taxRate) < 0 || num(form.taxRate) > 100) return 'Tax rate must be between 0 and 100.';
    if (num(form.amountPaid) < 0) return 'Paid amount cannot be negative.';
    if (num(form.amountPaid) > totals.grand + 0.005) return 'Paid amount cannot be more than the invoice total.';
    return '';
  };

  const save = async () => {
    const problem = validate();
    if (problem) { setNotice({ type: 'err', text: problem }); return null; }
    setSaving(true);
    setNotice(null);
    try {
      const payload = { ...view, invoiceNumber: form.invoiceNumber.trim(), customerGstin: form.customerGstin.trim().toUpperCase() };
      const saved = await paymentAdminService.updateInvoice(payment.id, payload);
      hydrate(saved);
      setNotice({ type: 'ok', text: 'Invoice saved.' });
      onSaved?.(saved);
      return saved;
    } catch (e) {
      setNotice({ type: 'err', text: e.message || 'Unable to save the invoice.' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    if (printing) return;
    const saved = await save(); // download exactly what is stored
    if (!saved) return;
    setPrinting(true);
    try {
      await onPrint(toInvoiceView(formFromInvoice(saved)));
    } finally {
      setPrinting(false);
    }
  };

  const text = (key, label, props = {}) => (
    <label>
      <span>{label}</span>
      <input value={form[key] ?? ''} onChange={set(key)} {...props} />
    </label>
  );

  const area = (key, label, rows = 3) => (
    <label>
      <span>{label}</span>
      <textarea rows={rows} value={form[key] ?? ''} onChange={set(key)} />
    </label>
  );

  return (
    <div className="invoice-editor-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="invoice-editor-modal">
        <div className="invoice-editor-header">
          <div>
            <h2>Edit Invoice</h2>
            <p>Everything on the invoice can be edited. Changes are saved and used for every PDF / Excel download.</p>
          </div>
          <div className="invoice-editor-actions">
            <button className="iee-save-btn" type="button" onClick={save} disabled={loading || saving || !form}>
              <FiSave size={16} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="invoice-editor-print-btn" type="button" onClick={download} disabled={loading || printing || saving || !form}>
              <FiDownload size={17} /> {printing ? 'Generating PDF…' : 'Save & Download PDF'}
            </button>
            <button className="invoice-editor-close-btn" type="button" onClick={onClose} aria-label="Close">
              <FiX size={22} />
            </button>
          </div>
        </div>

        {loading && <div className="iee-state">Loading invoice…</div>}
        {!loading && loadError && <div className="iee-state iee-err">{loadError}</div>}

        {!loading && form && (
          <div className="invoice-editor-body">
            <aside className="invoice-editor-form">
              <h3>Invoice</h3>
              {text('invoiceNumber', 'Invoice Number', { placeholder: 'INV-IC/00760' })}
              <small className="invoice-number-hint">Format: INV-IC/00000 (auto sequence, must be unique)</small>
              <div className="iee-row">
                <label>
                  <span>Invoice Date</span>
                  <input type="date" value={form.invoiceDate} onChange={set('invoiceDate')} />
                </label>
                <label>
                  <span>Status</span>
                  <select value={form.paymentStatus} onChange={set('paymentStatus')}>
                    {[...new Set([form.paymentStatus, ...STATUS_OPTIONS])].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              {text('paymentType', 'Received row label (shows as "<label> Received", e.g. Advance / Full)')}

              <h3>Company (invoice header)</h3>
              {text('companyName', 'Company Name')}
              {area('companyAddress', 'Company Address', 3)}
              {text('companyEmail', 'Company Email')}
              <div className="iee-row">
                {text('companyMobile', 'Mobile')}
                {text('companyWebsite', 'Website')}
              </div>

              <h3>Bill To</h3>
              {text('organizationName', 'Customer Name')}
              {area('address', 'Billing Address', 3)}
              <div className="iee-row">
                {text('customerGstin', 'GSTIN (optional)', {
                  placeholder: '33ABCDE1234F1Z5',
                  maxLength: 15,
                  style: { textTransform: 'uppercase' },
                })}
                {text('phone', 'Contact Number', { placeholder: 'Optional', inputMode: 'tel' })}
              </div>

              <h3>Shipping Address</h3>
              <button type="button" className="iee-add-btn" onClick={copyBillToShipping}>
                Copy billing address to shipping
              </button>
              {text('shippingName', 'Ship To Name')}
              {area('shippingAddress', 'Shipping Address', 3)}
              <small className="invoice-number-hint">Leave both blank to print the Bill To details as the shipping address.</small>

              <h3>Items</h3>
              {form.items.map((item, index) => (
                <div className="iee-item" key={index}>
                  <div className="iee-item-head">
                    <b>Item {index + 1}</b>
                    <button type="button" className="iee-icon-btn" onClick={() => removeItem(index)} disabled={form.items.length === 1} title="Remove item">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  <textarea rows={2} placeholder="Description" value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} />
                  <div className="iee-row3">
                    <label><span>Qty</span><input type="number" min="0" step="any" value={item.quantity} onChange={(e) => setItem(index, 'quantity', e.target.value)} /></label>
                    <label><span>Rate (₹)</span><input type="number" min="0" step="any" value={item.rate} onChange={(e) => setItem(index, 'rate', e.target.value)} /></label>
                    <label><span>Amount</span><input readOnly value={money(num(item.quantity) * num(item.rate))} /></label>
                  </div>
                </div>
              ))}
              <button type="button" className="iee-add-btn" onClick={addItem}><FiPlus size={14} /> Add item</button>

              <h3>Amounts</h3>
              <div className="iee-row3">
                <label><span>Discount (₹)</span><input type="number" min="0" step="any" value={form.discountAmount} onChange={set('discountAmount')} /></label>
                <label><span>Tax rate (%)</span><input type="number" min="0" max="100" step="any" value={form.taxRate} onChange={set('taxRate')} /></label>
                <label><span>Paid (₹)</span><input type="number" min="0" step="any" value={form.amountPaid} onChange={set('amountPaid')} /></label>
              </div>
              <div className="iee-readonly">
                <div><span>Subtotal</span><b>₹{money(totals.subtotal)}</b></div>
                <div><span>Tax</span><b>₹{money(totals.tax)}</b></div>
                <div><span>Total</span><b>₹{money(totals.grand)}</b></div>
                <div><span>Balance due</span><b>₹{money(totals.balance)}</b></div>
                <small>These amounts are for this invoice only. Payment records are not changed.</small>
              </div>

              <h3>Payment Instructions</h3>
              <div className="iee-row">
                {text('bankName', 'Bank Name')}
                {text('bankBranch', 'Branch Name')}
              </div>
              <div className="iee-row">
                {text('bankIfsc', 'IFSC Code')}
                {text('bankAccountNo', 'Account No')}
              </div>

              <h3>Declaration &amp; Signature</h3>
              {area('declaration', 'Declaration text', 3)}
              {text('signatoryFor', '"For ..." line')}
              <div className="iee-row">
                {text('signatoryName', 'Signatory Name')}
                {text('signatoryTitle', 'Designation')}
              </div>

              {notice && <div className={`iee-notice ${notice.type}`}>{notice.text}</div>}
            </aside>

            <main className="invoice-editor-preview" ref={previewRef}>
              <div
                className="invoice-editor-preview-scale"
                style={{
                  '--preview-scale': previewScale,
                  '--preview-width': `${1024 * previewScale}px`,
                  '--preview-height': `${1518 * previewScale}px`,
                }}
              >
                <InvoiceTemplate
                  invoice={view}
                  qrDataUrl={assets.qrDataUrl}
                  logoDataUrl={assets.logoDataUrl}
                  signatureDataUrl={assets.signatureDataUrl}
                  thankYouDataUrl={assets.thankYouDataUrl}
                />
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}