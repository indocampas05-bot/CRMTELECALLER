// src/pages/Payment/Payment.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import './Payment.css';


import {
  FiSearch,
  FiDownload,
  FiMail,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiActivity,
  FiPlus,
  FiEdit2,
  FiMessageCircle,
  FiDollarSign,
  FiSend,
  FiFileText,
  FiInfo,
} from 'react-icons/fi';
import { FaWhatsapp, FaRupeeSign } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import invoiceAssetService from '../../services/invoiceAssetService';
import { printInvoicePdf } from '../../components/Invoice/printInvoice';

// ─── Constants ────────────────────────────────────────────────
const ROWS_OPTIONS = [5, 10, 20, 50];
const PAYMENT_TYPES = ['Full', 'Partial', 'Advance'];

const STATUSES = [
  'All Status',
  'No Payment',
  'Recorded',
  'Verified',
  'Invoice Generated',
  'Invoice Sent to Telecaller',
  'Completed',
  'Fully Paid',
];

const AVATAR_COLORS = [
  '#7b1113',
  '#2563eb',
  '#16a34a',
  '#7c3aed',
  '#c2410c',
  '#0369a1',
  '#4338ca',
  '#be185d',
];

const STATUS_META = {
  Recorded: {
    cls: 'pay-badge-processing',
  },
  Verified: {
    cls: 'pay-badge-partial',
  },
  'Invoice Generated': {
    cls: 'pay-badge-partial',
  },
  'Invoice Sent to Telecaller': {
    cls: 'pay-badge-processing',
  },
  Completed: {
    cls: 'pay-badge-paid',
  },
  'Fully Paid': {
    cls: 'pay-badge-paid',
  },
  'No Payment': {
    cls: 'pay-badge-nopayment',
  },
};

// ─── Helpers ──────────────────────────────────────────────────
const avatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const initials = (name) =>
  name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

const firstNonBlank = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text && text !== '--') return text;
  }
  return '';
};

const normalizeLeadKey = (key) =>
  String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const excelValue = (lead, ...keys) => {
  const excelData = lead?.excelData;
  if (!excelData || typeof excelData !== 'object') return '';

  for (const expectedKey of keys) {
    const normalizedExpected = normalizeLeadKey(expectedKey);
    const actualKey = Object.keys(excelData).find(
      (key) => normalizeLeadKey(key) === normalizedExpected
    );

    if (actualKey) {
      const value = excelData[actualKey];
      const text = value === null || value === undefined
        ? ''
        : String(value).trim();
      if (text) return text;
    }
  }

  return '';
};

const leadOrganizationName = (lead) =>
  firstNonBlank(
    lead?.school,
    lead?.schoolName,
    lead?.organizationName,
    lead?.organization,
    lead?.company,
    lead?.name,
    excelValue(
      lead,
      'school',
      'school name',
      'organization',
      'organization name',
      'company',
      'name'
    )
  );

const findImportedAddress = (value, depth = 0) => {
  if (!value || depth > 3) return '';

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImportedAddress(item, depth + 1);
      if (found) return found;
    }
    return '';
  }

  if (typeof value !== 'object') return '';

  const entries = Object.entries(value);

  for (const [key, raw] of entries) {
    const normalized = normalizeLeadKey(key);
    const isAddressKey =
      normalized === 'address' ||
      normalized === 'schooladdress' ||
      normalized === 'fulladdress' ||
      normalized === 'clientaddress' ||
      normalized === 'schoolcurrentlocation' ||
      normalized === 'currentlocation' ||
      normalized === 'location' ||
      normalized.includes('address') ||
      normalized.includes('location');

    if (isAddressKey && raw !== null && raw !== undefined) {
      if (typeof raw === 'string' || typeof raw === 'number') {
        const text = String(raw).trim();
        if (text) return text;
      }

      const nested = findImportedAddress(raw, depth + 1);
      if (nested) return nested;
    }
  }

  for (const [, raw] of entries) {
    if (raw && typeof raw === 'object') {
      const nested = findImportedAddress(raw, depth + 1);
      if (nested) return nested;
    }
  }

  return '';
};

const leadAddress = (lead) => {
  const importedAddress = firstNonBlank(
    findImportedAddress(lead?.excelData),
    findImportedAddress(lead?.importedData),
    findImportedAddress(lead?.rawData),
    findImportedAddress(lead?.data)
  );

  const directAddress = firstNonBlank(
    lead?.schoolAddress,
    lead?.address,
    lead?.fullAddress,
    lead?.clientAddress,
    lead?.schoolCurrentLocation,
    lead?.currentLocation,
    excelValue(
      lead,
      'school address',
      'schooladdress',
      'address',
      'full address',
      'client address',
      'school current location',
      'current location',
      'location'
    ),
    importedAddress
  );

  if (directAddress) return directAddress;

  return [
    lead?.area,
    lead?.district,
    excelValue(lead, 'area'),
    excelValue(lead, 'district'),
  ]
    .map((value) => String(value || '').trim())
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(', ');
};

const leadPhone = (lead) =>
  firstNonBlank(lead?.phoneNumber, lead?.mobile, lead?.phone);

const leadEmail = (lead) =>
  firstNonBlank(lead?.email, lead?.emailAddress);

const fmtINR = (n) =>
  !n ? '₹0' : '₹' + Number(n).toLocaleString('en-IN');

const getTimelineIcon = (iconName) => {
  const iconMap = {
    document: <FiFileText size={13} />,
    mail: <FiMail size={13} />,
    message: <FiMessageCircle size={13} />,
    eye: <FiEye size={13} />,
    check: <FiCheckCircle size={13} />,
    edit: <FiEdit2 size={13} />,
    clock: <FiClock size={13} />,
    x: <FiX size={13} />,
    send: <FiSend size={13} />,
    activity: <FiActivity size={13} />,
  };

  return iconMap[iconName] || <FiFileText size={13} />;
};

const Toast = ({ msg, type, onClose }) => (
  <div className={`pay-toast pay-toast-${type}`} onClick={onClose}>
    {type === 'success' ? (
      <FiCheckCircle size={15} />
    ) : type === 'error' ? (
      <FiX size={15} />
    ) : (
      <FiActivity size={15} />
    )}
    {msg}
  </div>
);

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || { cls: '' };

  return (
    <span className={`pay-badge ${m.cls}`}>
      {status}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// LEAD PICKER
// ═══════════════════════════════════════════════════════════════
const LeadPicker = ({ onPick }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const runSearch = (val) => {
    setQ(val);

    clearTimeout(timer.current);

    if (!val.trim()) {
      setResults([]);
      return;
    }

    timer.current = setTimeout(async () => {
      try {
        const page = await paymentService.searchLeads(val.trim());

        setResults(page?.content || []);
        setOpen(true);
      } catch {
        // ignore
      }
    }, 300);
  };

  return (
    <div
      className="pay-form-group"
      style={{ position: 'relative' }}
    >
      <label className="pay-form-label">
        Search Lead / Client *
      </label>

      <input
        className="pay-form-input"
        placeholder="Type organization name, mobile or lead ID…"
        value={q}
        onChange={(e) => runSearch(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />

      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 8,
            maxHeight: 220,
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            marginTop: 4,
          }}
        >
          {results.map((l) => (
            <div
              key={l.leadId}
              onClick={() => {
                onPick(l);
                setQ(l.school || l.name || l.leadId);
                setOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 13,
                borderBottom: '1px solid #f1f1f1',
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div style={{ fontWeight: 600 }}>
                {l.school || l.name || l.leadId}
              </div>

              <div
                style={{
                  color: 'var(--text-light)',
                  fontSize: 11.5,
                }}
              >
                {l.phoneNumber || l.mobile} · {l.leadId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PREVIOUS PAYMENTS OF A CLIENT (all earlier payments + their records)
// ═══════════════════════════════════════════════════════════════
const PreviousPayments = ({
  payments = [],
  title = 'Previous Payments',
}) => {
  if (!payments.length) return null;

  return (
    <div style={{ margin: '0 0 16px' }}>
      <div className="pay-view-note-label">{title}</div>

      {payments.map((p) => (
        <div
          key={p.id}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              fontSize: 13,
            }}
          >
            <b>
              {p.paymentType || 'Payment'} · {p.status || '--'}
            </b>
            <span>
              Total {fmtINR(p.totalAmount)} · Paid {fmtINR(p.amountPaid)} · Balance{' '}
              {fmtINR(p.balanceAmount)}
            </span>
          </div>

          {(p.paymentHistory || []).length > 0 && (
            <table className="pay-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {p.paymentHistory.map((r, i) => (
                  <tr key={r.id || i}>
                    <td>{fmtINR(r.amount)}</td>
                    <td>{r.paymentType}</td>
                    <td>{r.paymentDate || '--'}</td>
                    <td>{r.paymentMethod || '--'}</td>
                    <td>{r.status || 'Paid'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RECORD / EDIT PAYMENT MODAL
// ═══════════════════════════════════════════════════════════════
const PaymentFormModal = ({
  initial,
  presetLead,
  paymentsByLead = {},
  onClose,
  onSave,
}) => {
  const isEdit = !!initial;

  const LOCKED_STATUSES = [
    'Verified',
    'Invoice Generated',
    'Invoice Sent to Telecaller',
    'Completed',
    'Fully Paid',
  ];

  const amountLocked =
    isEdit && LOCKED_STATUSES.includes(initial?.status);

  const [form, setForm] = useState(
    initial
      ? { ...initial }
      : presetLead
        ? {
            leadId: presetLead.leadId,
            organizationName: leadOrganizationName(presetLead),
            address: leadAddress(presetLead),
            phone: leadPhone(presetLead),
            email: leadEmail(presetLead),
            paymentType: 'Full',
            totalAmount: '',
            amountPaid: '',
            gstPercent: '0',
            discountAmount: '0',
            paymentMethod: 'UPI',
            transactionReferenceNumber: '',
            paymentDate: new Date()
              .toISOString()
              .split('T')[0],
            notes: '',
          }
        : {
            leadId: '',
            organizationName: '',
            address: '',
            phone: '',
            email: '',
            paymentType: 'Full',
            totalAmount: '',
            amountPaid: '',
            gstPercent: '0',
            discountAmount: '0',
            paymentMethod: 'UPI',
            transactionReferenceNumber: '',
            paymentDate: new Date()
              .toISOString()
              .split('T')[0],
            notes: '',
          }
  );

  const [saving, setSaving] = useState(false);

  const set = (k, v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  const handlePick = (lead) => {
    setForm((f) => ({
      ...f,
      leadId: lead.leadId || lead.id || f.leadId,
      organizationName:
        leadOrganizationName(lead) || f.organizationName,
      address:
        leadAddress(lead) || f.address,
      phone:
        leadPhone(lead) || f.phone,
      email:
        leadEmail(lead) || f.email,
    }));
  };

  const handleSave = async () => {
    if (!isEdit && !form.leadId) {
      alert(
        'Please pick a lead/client to record a payment for.'
      );
      return;
    }

    if (!form.organizationName || !form.totalAmount) {
      alert(
        'Organization Name and Total Amount are required.'
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        leadId: form.leadId,
        organizationName: form.organizationName,
        address: form.address,
        phone: form.phone,
        email: form.email,
        paymentType: form.paymentType,
        totalAmount: Number(form.totalAmount) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        gstPercent: Number(form.gstPercent) || 0,
        discountAmount: Number(form.discountAmount) || 0,
        paymentMethod: form.paymentMethod || '',
        transactionReferenceNumber: form.transactionReferenceNumber || '',
        paymentDate: form.paymentDate,
        notes: form.notes,
      };

      await onSave(
        payload,
        isEdit ? form.id : null
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="pay-modal-overlay"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="pay-modal-box pay-modal-lg">
        <div className="pay-modal-header">
          <span className="pay-modal-title">
            <FiPlus
              size={16}
              style={{ marginRight: 6 }}
            />

            {isEdit
              ? 'Edit Payment'
              : presetLead
                ? `Record Payment — ${
                    presetLead.school ||
                    presetLead.name
                  }`
                : 'Record Payment'}
          </span>

          <button
            className="pay-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="pay-modal-body">
          {!isEdit && !presetLead && (
            <LeadPicker onPick={handlePick} />
          )}

          {!isEdit && (
            <PreviousPayments
              payments={paymentsByLead[form.leadId] || []}
              title="Previous payments of this client"
            />
          )}

          <div className="pay-add-grid">
            <div className="pay-form-group">
              <label className="pay-form-label">
                Organization Name *
              </label>

              <input
                className="pay-form-input"
                value={form.organizationName || ''}
                onChange={(e) =>
                  set(
                    'organizationName',
                    e.target.value
                  )
                }
              />
            </div>

            <div className="pay-form-group pay-form-group-full">
              <label className="pay-form-label">
                Complete Address
              </label>

              <textarea
                className="pay-form-textarea pay-address-textarea"
                value={form.address || ''}
                onChange={(e) =>
                  set('address', e.target.value)
                }
                placeholder="Client address will be automatically fetched from Lead details"
                rows={4}
              />

              <span className="pay-form-hint">
                Auto-filled from Lead details. You can edit it before saving.
              </span>
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Phone Number
              </label>

              <input
                className="pay-form-input"
                value={form.phone || ''}
                onChange={(e) =>
                  set('phone', e.target.value)
                }
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Email Address
              </label>

              <input
                className="pay-form-input"
                value={form.email || ''}
                onChange={(e) =>
                  set('email', e.target.value)
                }
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment Type
              </label>

              <select
                className="pay-form-select"
                value={form.paymentType}
                onChange={(e) =>
                  set(
                    'paymentType',
                    e.target.value
                  )
                }
                disabled={amountLocked}
              >
                {PAYMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment Date
              </label>

              <input
                className="pay-form-input"
                type="date"
                value={form.paymentDate || ''}
                onChange={(e) =>
                  set(
                    'paymentDate',
                    e.target.value
                  )
                }
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Total Amount *
              </label>

              <input
                className="pay-form-input"
                type="number"
                value={form.totalAmount ?? ''}
                onChange={(e) =>
                  set(
                    'totalAmount',
                    e.target.value
                  )
                }
                disabled={amountLocked}
              />

              {amountLocked && (
                <span className="pay-form-lock-note">
                  Locked after Super Admin verification —
                  ask them to change the total or allow
                  more payments.
                </span>
              )}
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">GST (%)</label>
              <input
                className="pay-form-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.gstPercent ?? ''}
                onChange={(e) => set('gstPercent', e.target.value)}
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">Discount</label>
              <input
                className="pay-form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.discountAmount ?? ''}
                onChange={(e) => set('discountAmount', e.target.value)}
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">Payment Method</label>
              <select
                className="pay-form-select"
                value={form.paymentMethod || ''}
                onChange={(e) => set('paymentMethod', e.target.value)}
              >
                <option value="">Select method</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">Transaction / Reference No.</label>
              <input
                className="pay-form-input"
                value={form.transactionReferenceNumber || ''}
                onChange={(e) => set('transactionReferenceNumber', e.target.value)}
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Amount Paid
              </label>

              <input
                className="pay-form-input"
                type="number"
                value={form.amountPaid ?? ''}
                onChange={(e) =>
                  set(
                    'amountPaid',
                    e.target.value
                  )
                }
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="pay-form-group">
            <label className="pay-form-label">
              Notes
            </label>

            <textarea
              className="pay-form-textarea"
              value={form.notes || ''}
              onChange={(e) =>
                set('notes', e.target.value)
              }
              rows={3}
            />
          </div>
        </div>

        <div
          className="pay-form-actions"
          style={{
            padding: '14px 24px 24px',
            borderTop:
              '1px solid var(--border)',
          }}
        >
          <button
            className="pay-btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="pay-btn-primary"
            disabled={saving}
            onClick={handleSave}
          >
            <FiCheckCircle size={13} />

            {saving
              ? 'Saving…'
              : isEdit
                ? 'Save Changes'
                : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SEND MODAL
// ═══════════════════════════════════════════════════════════════
const SendModal = ({
  payment,
  mode,
  qr,
  onClose,
  onSent,
}) => {
  const isInvoice = mode === 'invoice';
  const showQr = !isInvoice;

  const [channel, setChannel] =
    useState('WhatsApp');

  const [message, setMessage] = useState(
    isInvoice
      ? `Dear ${payment.organizationName},

Please find attached your invoice.

Total Amount : ${fmtINR(payment.totalAmount)}
Amount Paid  : ${fmtINR(payment.amountPaid)}
Balance      : ${fmtINR(payment.balanceAmount)}

Thank you.`
      : `Dear ${payment.organizationName},

Here are your payment details.

Payment Type : ${payment.paymentType}
Total Amount : ${fmtINR(payment.totalAmount)}
Amount Paid  : ${fmtINR(payment.amountPaid)}
Balance Due  : ${fmtINR(payment.balanceAmount)}${
          qr
            ? '\n\n(Payment QR code attached separately — please scan to pay.)'
            : ''
        }

Thank you.`
  );

  const [sending, setSending] = useState(false);
  const [invoice, setInvoice] = useState(null);

  // Invoice mode: build the message from the invoice the Super Admin saved (edited totals + balance).
  useEffect(() => {
    if (!isInvoice) return undefined;
    let active = true;
    const num = (v) => Number(v) || 0;
    paymentService
      .getInvoice(payment.id)
      .then((inv) => {
        if (!active) return;
        setInvoice(inv);
        const taxable = Math.max(0, num(inv.totalAmount) - num(inv.discountAmount));
        const grand = taxable + (taxable * num(inv.taxRate)) / 100;
        setMessage(
          `Dear ${inv.organizationName || payment.organizationName},

Please find your invoice ${inv.invoiceNumber || ''}.

Invoice Total : ${fmtINR(grand)}
Amount Paid   : ${fmtINR(inv.amountPaid)}
Balance Due   : ${fmtINR(inv.balanceAmount)}

Thank you.`
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isInvoice, payment.id]);

  const handleDownloadQr = () => {
    if (!qr?.dataUrl) return;

    const link = document.createElement('a');

    link.href = qr.dataUrl;
    link.download =
      qr.fileName || 'payment-qr.png';

    link.click();
  };

  const handleSend = async () => {
    setSending(true);

    try {
      // WhatsApp / mail links cannot attach files, so download the invoice PDF first;
      // the user attaches it in the chat / email that opens next.
      if (isInvoice) {
        try {
          const inv = invoice || (await paymentService.getInvoice(payment.id));
          const [sharedQr, assets] = await Promise.all([
            paymentService.getSharedQr().catch(() => null),
            invoiceAssetService.getAssets().catch(() => ({})),
          ]);
          await printInvoicePdf(inv, { qrDataUrl: sharedQr?.dataUrl, ...assets });
        } catch (e) {
          /* the message can still be sent */
        }
      }

      await onSent(channel);

      if (channel === 'WhatsApp') {
        const rawPhone = (
          payment.phone || ''
        ).replace(/\D/g, '');
        // wa.me needs the country code; assume India (+91) for 10-digit numbers
        const waPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

        window.open(
          `https://wa.me/${waPhone}?text=${encodeURIComponent(
            message
          )}`,
          '_blank'
        );
      } else {
        window.open(
          `mailto:${payment.email}?subject=${encodeURIComponent(
            isInvoice
              ? 'Your Invoice'
              : 'Payment Details'
          )}&body=${encodeURIComponent(
            message
          )}`,
          '_blank'
        );
      }

      onClose();
    } catch (e) {
      window.alert(e?.message || 'Unable to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="pay-modal-overlay"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="pay-modal-box pay-modal-box-sm">
        <div className="pay-modal-header">
          <span className="pay-modal-title">
            {channel === 'WhatsApp' ? (
              <FaWhatsapp
                size={16}
                style={{
                  marginRight: 6,
                  color: '#25D366',
                }}
              />
            ) : (
              <FiMail
                size={16}
                style={{ marginRight: 6 }}
              />
            )}

            Send{' '}
            {isInvoice
              ? 'Invoice'
              : 'Payment Details'}
          </span>

          <button
            className="pay-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="pay-modal-body">
          <div className="pay-form-group">
            <label className="pay-form-label">
              Channel
            </label>

            <select
              className="pay-form-select"
              value={channel}
              onChange={(e) =>
                setChannel(e.target.value)
              }
            >
              <option value="WhatsApp">
                WhatsApp (
                {payment.phone || 'no number'})
              </option>

              <option value="Email">
                Email (
                {payment.email || 'no email'})
              </option>
            </select>
          </div>

          {showQr && (
            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment QR Code
              </label>

              {qr?.dataUrl ? (
                <div className="pay-qr-send-box">
                  <img
                    src={qr.dataUrl}
                    alt="Payment QR code"
                    className="pay-qr-send-img"
                  />

                  <div className="pay-qr-send-note">
                    <div>
                      {channel} can't auto-attach
                      images. Download the QR, then
                      attach it in the chat/email
                      before sending.
                    </div>

                    <button
                      type="button"
                      className="pay-btn-outline"
                      onClick={
                        handleDownloadQr
                      }
                    >
                      <FiDownload size={12} />
                      Download QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pay-qr-send-empty">
                  No payment QR code has been
                  uploaded by the Super Admin yet.
                </div>
              )}
            </div>
          )}

          {isInvoice && (
            <div className="pay-qr-send-note" style={{ marginBottom: 10 }}>
              The invoice PDF downloads when you click Send. Attach it in the
              WhatsApp chat / email that opens, then send.
            </div>
          )}

          <div className="pay-wa-msg-area">
            <div className="pay-wa-msg-label">
              Message
            </div>

            <textarea
              className="pay-wa-msg-textarea"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              rows={8}
            />
          </div>
        </div>

        <div
          className="pay-form-actions"
          style={{
            padding: '14px 24px 24px',
            borderTop:
              '1px solid var(--border)',
          }}
        >
          <button
            className="pay-btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="pay-btn-primary"
            disabled={sending}
            onClick={handleSend}
          >
            <FiSend size={13} />

            {sending
              ? 'Sending…'
              : `Send via ${channel}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAYMENT RECORD MODAL
// ═══════════════════════════════════════════════════════════════
const PaymentRecordModal = ({
  payment,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    paymentAmount: '',
    paymentType: 'Partial',
    paymentDate: new Date()
      .toISOString()
      .slice(0, 10),
    paymentMethod: 'UPI',
    transactionReferenceNumber: '',
    notes: '',
    status: 'Paid',
  });

  const [saving, setSaving] =
    useState(false);

  const set = (k, v) =>
    setForm((x) => ({
      ...x,
      [k]: v,
    }));

  const history =
    payment.paymentHistory || [];

  const lastRecord = history.length
    ? history[history.length - 1]
    : null;

  const save = async () => {
    if (!(Number(form.paymentAmount) > 0)) {
      return alert(
        'Enter a valid payment amount'
      );
    }

    if (
      Number(form.paymentAmount) >
        Number(payment.balanceAmount || 0) &&
      form.status !== 'Pending'
    ) {
      return alert(
        'Amount cannot exceed remaining balance'
      );
    }

    setSaving(true);

    try {
      await onSave({
        ...form,
        paymentAmount: Number(
          form.paymentAmount
        ),
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="pay-modal-overlay"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="pay-modal-box pay-modal-lg">
        <div className="pay-modal-header">
          <span className="pay-modal-title">
            <FiPlus
              size={16}
              style={{ marginRight: 6 }}
            />

            Add Payment Record —{' '}
            {payment.organizationName}
          </span>

          <button
            className="pay-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="pay-modal-body">
          <div className="pay-view-note-label">
            Previous Payment Information
          </div>

          <div
            className="pay-amount-summary"
            style={{ marginBottom: 16 }}
          >
            <div className="pay-summary-item">
              <span className="pay-summary-label">
                Total Amount
              </span>

              <span className="pay-summary-value">
                {fmtINR(payment.totalAmount)}
              </span>
            </div>

            <div className="pay-summary-item">
              <span className="pay-summary-label">
                Total Paid So Far
              </span>

              <span className="pay-summary-value pay-summary-paid">
                {fmtINR(payment.amountPaid)}
              </span>
            </div>

            <div className="pay-summary-item">
              <span className="pay-summary-label">
                Remaining Balance
              </span>

              <span
                className={`pay-summary-value ${
                  payment.balanceAmount > 0
                    ? 'pay-summary-balance'
                    : ''
                }`}
              >
                {fmtINR(payment.balanceAmount)}
              </span>
            </div>
          </div>

          {lastRecord && (
            <div
              className="pay-amount-summary"
              style={{ marginBottom: 16 }}
            >
              <div className="pay-summary-item">
                <span className="pay-summary-label">
                  Previous Payment Amount
                </span>

                <span className="pay-summary-value">
                  {fmtINR(lastRecord.amount)}
                </span>
              </div>

              <div className="pay-summary-item">
                <span className="pay-summary-label">
                  Previous Payment Date
                </span>

                <span className="pay-summary-value">
                  {lastRecord.paymentDate ||
                    '--'}
                </span>
              </div>

              <div className="pay-summary-item">
                <span className="pay-summary-label">
                  Previous Payment Type
                </span>

                <span className="pay-summary-value">
                  {lastRecord.paymentType ||
                    '--'}
                </span>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div className="pay-view-note-label">
                Payment History
              </div>

              <table className="pay-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((r, i) => (
                    <tr key={r.id || i}>
                      <td>{fmtINR(r.amount)}</td>
                      <td>{r.paymentType}</td>
                      <td>
                        {r.paymentDate || '--'}
                      </td>
                      <td>
                        {r.paymentMethod || '--'}
                      </td>
                      <td>
                        {r.status || 'Paid'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pay-view-note-label">
            New Payment
          </div>

          <div className="pay-add-grid">
            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment Amount *
              </label>

              <input
                className="pay-form-input"
                type="number"
                value={form.paymentAmount}
                onChange={(e) =>
                  set(
                    'paymentAmount',
                    e.target.value
                  )
                }
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment Type
              </label>

              <select
                className="pay-form-select"
                value={form.paymentType}
                onChange={(e) =>
                  set(
                    'paymentType',
                    e.target.value
                  )
                }
              >
                <option>Advance</option>
                <option>Partial</option>
                <option>Full</option>
              </select>
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment Date
              </label>

              <input
                className="pay-form-input"
                type="date"
                value={form.paymentDate}
                onChange={(e) =>
                  set(
                    'paymentDate',
                    e.target.value
                  )
                }
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Payment Method
              </label>

              <input
                className="pay-form-input"
                value={form.paymentMethod}
                onChange={(e) =>
                  set(
                    'paymentMethod',
                    e.target.value
                  )
                }
                placeholder="UPI / Cash / Bank Transfer"
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Transaction / Reference No.
              </label>

              <input
                className="pay-form-input"
                value={
                  form.transactionReferenceNumber
                }
                onChange={(e) =>
                  set(
                    'transactionReferenceNumber',
                    e.target.value
                  )
                }
              />
            </div>

            <div className="pay-form-group">
              <label className="pay-form-label">
                Status
              </label>

              <select
                className="pay-form-select"
                value={form.status}
                onChange={(e) =>
                  set(
                    'status',
                    e.target.value
                  )
                }
              >
                <option>Paid</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <div className="pay-form-group">
            <label className="pay-form-label">
              Payment Notes
            </label>

            <textarea
              className="pay-form-textarea"
              value={form.notes}
              onChange={(e) =>
                set('notes', e.target.value)
              }
            />
          </div>
        </div>

        <div
          className="pay-form-actions"
          style={{
            padding: '14px 24px 24px',
            borderTop:
              '1px solid var(--border)',
          }}
        >
          <button
            className="pay-btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="pay-btn-primary"
            disabled={saving}
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VIEW PAYMENT MODAL
// ═══════════════════════════════════════════════════════════════
const ViewPaymentModal = ({
  payment,
  previous = [],
  qr,
  onClose,
  onDownloadInvoice,
  onSendPayment,
  onSendInvoice,
  onAddRecord,
}) => {
  const pct =
    payment.totalAmount > 0
      ? Math.round(
          (payment.amountPaid /
            payment.totalAmount) *
            100
        )
      : 0;

  const progressColor =
    pct === 100
      ? '#15803d'
      : pct > 0
        ? '#d97706'
        : '#b91c1c';

  const canSendInvoice =
    payment.invoiceId &&
    (payment.status ===
      'Invoice Sent to Telecaller' ||
      payment.status === 'Completed');

  const infoRows = [
    [
      'Organization',
      payment.organizationName,
    ],
    ['Address', payment.address || '--'],
    ['Phone', payment.phone || '--'],
    ['Email', payment.email || '--'],
    ['Payment Type', payment.paymentType],
    [
      'Payment Date',
      payment.paymentDate || '--',
    ],
    [
      'Status',
      <StatusBadge
        key="s"
        status={payment.status}
      />,
    ],
  ];

  return (
    <div
      className="pay-modal-overlay"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="pay-modal-box pay-modal-lg">
        <div className="pay-modal-header">
          <span className="pay-modal-title">
            <FiCreditCard
              size={16}
              style={{ marginRight: 6 }}
            />
            Payment Details
          </span>

          <button
            className="pay-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="pay-view-hero">
          <div
            className="pay-view-avatar"
            style={{
              background: avatarColor(
                payment.organizationName
              ),
            }}
          >
            {initials(
              payment.organizationName
            )}
          </div>

          <div className="pay-view-hero-info">
            <div className="pay-view-client-name">
              {payment.organizationName}
            </div>

            <div className="pay-view-company">
              {payment.address}
            </div>
          </div>

          <StatusBadge
            status={payment.status}
          />
        </div>

        <div className="pay-amount-summary">
          {[
            {
              label: 'Total Amount',
              val: fmtINR(
                payment.totalAmount
              ),
              cls: '',
            },
            {
              label: 'Amount Paid',
              val: fmtINR(
                payment.amountPaid
              ),
              cls: 'pay-summary-paid',
            },
            {
              label: 'Balance Due',
              val: fmtINR(
                payment.balanceAmount
              ),
              cls:
                payment.balanceAmount > 0
                  ? 'pay-summary-balance'
                  : '',
            },
          ].map((c) => (
            <div
              className="pay-summary-item"
              key={c.label}
            >
              <span className="pay-summary-label">
                {c.label}
              </span>

              <span
                className={`pay-summary-value ${c.cls}`}
              >
                {c.val}
              </span>
            </div>
          ))}
        </div>

        <div className="pay-progress-wrap">
          <div className="pay-progress-label">
            <span>Payment Progress</span>

            <span
              style={{
                color: progressColor,
              }}
            >
              {pct}% Paid
            </span>
          </div>

          <div className="pay-progress-track">
            <div
              className="pay-progress-fill"
              style={{
                width: `${pct}%`,
                background: progressColor,
              }}
            />
          </div>
        </div>

        {Number(payment.balanceAmount) > 0 &&
          payment.status !== 'Fully Paid' && (
            <button
              className="pay-btn-primary"
              style={{
                margin: '0 24px 14px',
              }}
              onClick={onAddRecord}
            >
              <FiPlus size={13} />
              Add Payment Record
            </button>
          )}

        {payment.paymentHistory?.length >
          0 && (
          <div
            style={{
              padding: '0 24px 14px',
            }}
          >
            <div className="pay-view-note-label">
              Payment History
            </div>

            <table className="pay-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payment.paymentHistory.map(
                  (r, i) => (
                    <tr key={r.id || i}>
                      <td>
                        {fmtINR(r.amount)}
                      </td>

                      <td>
                        {r.paymentType}
                      </td>

                      <td>
                        {r.paymentDate ||
                          '--'}
                      </td>

                      <td>
                        {r.paymentMethod ||
                          '--'}
                      </td>

                      <td>
                        {r.status || 'Paid'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {previous.length > 0 && (
          <div style={{ padding: '0 24px 14px' }}>
            <PreviousPayments
              payments={previous}
              title="Previous payments of this client"
            />
          </div>
        )}

        <div className="pay-view-grid">
          {infoRows.map(([k, v]) => (
            <div
              className="pay-view-row"
              key={k}
            >
              <div className="pay-view-key">
                {k}
              </div>

              <div className="pay-view-val">
                {v}
              </div>
            </div>
          ))}
        </div>

        <div className="pay-view-qr-section">
          <div className="pay-view-note-label">
            Payment QR Code / Scanner
          </div>

          {qr?.dataUrl ? (
            <div className="pay-view-qr-box">
              <img
                src={qr.dataUrl}
                alt="Payment QR code"
                className="pay-view-qr-img"
              />

              <span className="pay-view-qr-hint">
                Uploaded by Super Admin — shown
                to every Telecaller.
              </span>
            </div>
          ) : (
            <div className="pay-view-qr-empty">
              The Super Admin hasn't uploaded a
              payment QR code yet.
            </div>
          )}
        </div>

        {payment.notes && (
          <div className="pay-view-note">
            <div className="pay-view-note-label">
              <FiInfo size={12} />
              Notes
            </div>

            <div className="pay-view-note-text">
              {payment.notes}
            </div>
          </div>
        )}

        {payment.timeline?.length > 0 && (
          <div className="pay-timeline">
            <div className="pay-timeline-title">
              <FiClock
                size={14}
                style={{ marginRight: 6 }}
              />
              Activity Timeline
            </div>

            <div className="pay-timeline-list">
              {payment.timeline.map(
                (t, i) => (
                  <div
                    className="pay-timeline-item"
                    key={i}
                  >
                    <div className="pay-timeline-left">
                      <div
                        className="pay-timeline-dot"
                        style={{
                          background: t.bg,
                          color: t.color,
                        }}
                      >
                        {getTimelineIcon(
                          t.icon
                        )}
                      </div>

                      <div className="pay-timeline-line" />
                    </div>

                    <div className="pay-timeline-content">
                      <div className="pay-timeline-action">
                        {t.action}
                      </div>

                      <div className="pay-timeline-time">
                        {t.time}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div
          className="pay-form-actions"
          style={{
            padding: '14px 24px 24px',
            borderTop:
              '1px solid var(--border)',
          }}
        >
          <button
            className="pay-btn-outline"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="pay-btn-outline"
            onClick={onSendPayment}
          >
            <FiSend size={13} />
            Send Payment Details
          </button>

          {payment.invoiceId && (
            <button
              className="pay-btn-outline"
              onClick={() =>
                onDownloadInvoice(payment)
              }
            >
              <FiDownload size={13} />
              Download Invoice
            </button>
          )}

          {canSendInvoice && (
            <button
              className="pay-btn-primary"
              onClick={onSendInvoice}
            >
              <FaWhatsapp size={13} />
              Send Invoice to Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Payments = () => {
  const [payments, setPayments] =
    useState([]);

  const [leads, setLeads] =
    useState([]);

  const [leadsLoading, setLeadsLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [filterStatus, setFilterStatus] =
    useState('All Status');

  const [page, setPage] =
    useState(1);

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  const [viewPay, setViewPay] =
    useState(null);

  const [formPay, setFormPay] =
    useState(undefined);

  const [formPresetLead, setFormPresetLead] =
    useState(null);

  const [sendModal, setSendModal] =
    useState(null);

  const [recordPay, setRecordPay] =
    useState(null);

  const [toast, setToast] =
    useState(null);

  const [qr, setQr] =
    useState(null);

  const showToast = useCallback(
    (msg, type = 'success') => {
      setToast({
        msg,
        type,
      });

      setTimeout(
        () => setToast(null),
        3000
      );
    },
    []
  );

  useEffect(() => {
    paymentService
      .getSharedQr()
      .then((data) => setQr(data))
      .catch(() => setQr(null));
  }, []);

  const load = useCallback(
    async () => {
      setLoading(true);

      try {
        const data =
          await paymentService.getAll();

        setPayments(data || []);
      } catch (e) {
        showToast(
          e.message ||
            'Failed to load payments',
          'error'
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const loadLeads = useCallback(
    async () => {
      setLeadsLoading(true);

      try {
        const pageData =
          await paymentService.listAllClients();

        setLeads(
          pageData?.content || []
        );
      } catch (e) {
        showToast(
          e.message ||
            'Failed to load clients',
          'error'
        );
      } finally {
        setLeadsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    load();
    loadLeads();
  }, [load, loadLeads]);

  const paymentByLead = useMemo(() => {
    const map = {};

    for (const p of payments) {
      if (p.leadId) {
        map[p.leadId] = p;
      }
    }

    return map;
  }, [payments]);

  // every payment of a client (newest first); paymentByLead above only keeps one
  const paymentsByLead = useMemo(() => {
    const map = {};

    for (const p of payments) {
      if (!p.leadId) continue;
      (map[p.leadId] = map[p.leadId] || []).push(p);
    }

    const stamp = (p) =>
      new Date(p.createdAt || p.recordedAt || p.paymentDate || 0).getTime() || 0;

    Object.values(map).forEach((list) => list.sort((a, b) => stamp(b) - stamp(a)));
    return map;
  }, [payments]);

  const rows = useMemo(
    () =>
      leads.map((lead) => ({
        lead,
        payment:
          paymentByLead[lead.leadId] ||
          null,
      })),
    [leads, paymentByLead]
  );

  const stats = useMemo(
    () => ({
      totalClients: leads.length,

      total: payments.length,

      completed:
        payments.filter(
          (p) =>
            p.status === 'Completed'
        ).length,

      pending:
        payments.filter(
          (p) =>
            p.status === 'Recorded' ||
            p.status === 'Verified'
        ).length,

      totalCollected:
        payments.reduce(
          (s, p) =>
            s +
            Number(
              p.amountPaid || 0
            ),
          0
        ),

      totalBalance:
        payments.reduce(
          (s, p) =>
            s +
            Number(
              p.balanceAmount || 0
            ),
          0
        ),
    }),
    [payments, leads]
  );

  const filtered = useMemo(() => {
    let d = [...rows];

    if (filterStatus !== 'All Status') {
      d =
        filterStatus === 'No Payment'
          ? d.filter(
              (r) => !r.payment
            )
          : d.filter(
              (r) =>
                r.payment?.status ===
                filterStatus
            );
    }

    if (search.trim()) {
      const q =
        search.toLowerCase();

      d = d.filter(
        ({ lead, payment }) =>
          (
            payment?.organizationName ||
            lead.school ||
            lead.name ||
            ''
          )
            .toLowerCase()
            .includes(q) ||
          (
            payment?.phone ||
            lead.phoneNumber ||
            lead.mobile ||
            ''
          )
            .toLowerCase()
            .includes(q) ||
          (
            payment?.email ||
            lead.email ||
            ''
          )
            .toLowerCase()
            .includes(q)
      );
    }

    return d;
  }, [
    rows,
    filterStatus,
    search,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length /
        rowsPerPage
    )
  );

  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const pgRange = () => {
    const nums = [];

    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      if (
        i === 1 ||
        i === totalPages ||
        Math.abs(i - page) <= 1
      ) {
        nums.push(i);
      } else if (
        nums[nums.length - 1] !==
        '...'
      ) {
        nums.push('...');
      }
    }

    return nums;
  };

  const handleSaveForm = async (
    payload,
    editId
  ) => {
    try {
      if (editId) {
        await paymentService.update(
          editId,
          payload
        );

        showToast(
          'Payment updated successfully.'
        );
      } else {
        await paymentService.create(
          payload
        );

        showToast(
          'Payment recorded successfully.'
        );
      }

      setFormPay(undefined);
      setFormPresetLead(null);

      load();
    } catch (e) {
      showToast(
        e.message ||
          'Failed to save payment',
        'error'
      );
    }
  };

  const handleAddRecord = async (
    payment,
    payload
  ) => {
    try {
      await paymentService.addPaymentRecord(
        payment.id,
        payload
      );

      await load();

      setViewPay(null);

      showToast(
        'Payment record saved and balance recalculated.'
      );
    } catch (e) {
      showToast(
        e.message ||
          'Failed to add payment record',
        'error'
      );
    }
  };

  const handleSendPaymentDetails =
    async (payment, channel) => {
      await paymentService.sendPaymentDetails(
        payment.id,
        channel
      );

      showToast(
        `Payment details shared via ${channel}.`
      );

      load();
    };

  const handleSendInvoice = async (
    payment,
    channel
  ) => {
    await paymentService.sendInvoiceToClient(
      payment.id,
      channel
    );

    showToast(
      `Invoice sent to client via ${channel}.`
    );

    load();
  };

  // Same invoice template + data as the Super Admin; PDF is generated in the browser.
  const handleDownloadInvoice = async (
    payment
  ) => {
    try {
      // Always print the invoice the Super Admin generated / edited (real number, items, bank details...)
      const [invoice, qr, assets] = await Promise.all([
        paymentService.getInvoice(payment.id),
        paymentService.getSharedQr().catch(() => null),
        invoiceAssetService.getAssets().catch(() => ({})),
      ]);
      await printInvoicePdf(invoice, { qrDataUrl: qr?.dataUrl, ...assets });
      showToast('Invoice PDF downloaded.');
    } catch (e) {
      showToast(
        e.message ||
          'Unable to download the invoice PDF.',
        'error'
      );
    }
  };

  return (
    <div className="pay-page">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() =>
            setToast(null)
          }
        />
      )}

      <div className="pay-page-header">
        <div>
          <h1 className="pay-page-title">
            Payments
          </h1>
        </div>

        <div className="pay-header-actions">
          <button
            className="pay-btn-primary"
            onClick={() => {
              setFormPresetLead(null);
              setFormPay(null);
            }}
          >
            <FiPlus size={13} />
            Record Payment
          </button>
        </div>
      </div>

      <div className="pay-stats-row">
        {[
          {
            icon: <FiCreditCard />,
            label: 'Total Clients',
            val: stats.totalClients,
            color: '#4338ca',
            bg: '#e0e7ff',
          },
          {
            icon: <FiCheckCircle />,
            label: 'Completed',
            val: stats.completed,
            color: '#15803d',
            bg: '#dcfce7',
          },
          {
            icon: <FiClock />,
            label: 'In Progress',
            val: stats.pending,
            color: '#92400e',
            bg: '#fef9c3',
          },
          {
            icon: <FiDollarSign />,
            label: 'Collected',
            val: fmtINR(
              stats.totalCollected
            ),
            color: '#1d4ed8',
            bg: '#dbeafe',
          },
          {
            icon: <FaRupeeSign />,
            label: 'Balance Due',
            val: fmtINR(
              stats.totalBalance
            ),
            color: '#b91c1c',
            bg: '#fee2e2',
          },
        ].map((s) => (
          <div
            className="pay-stat-card"
            key={s.label}
          >
            <div
              className="pay-stat-icon"
              style={{
                background: s.bg,
                color: s.color,
              }}
            >
              {s.icon}
            </div>

            <div className="pay-stat-info">
              <div className="pay-stat-val">
                {s.val}
              </div>

              <div className="pay-stat-label">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pay-table-card">
        <div className="pay-filter-bar">
          <div className="pay-search-wrap">
            <FiSearch className="pay-search-ico" />

            <input
              className="pay-search-input"
              placeholder="Search by organization, phone, email…"
              value={search}
              onChange={(e) => {
                setSearch(
                  e.target.value
                );
                setPage(1);
              }}
            />
          </div>

          <select
            className="pay-filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(
                e.target.value
              );
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s}>
                {s}
              </option>
            ))}
          </select>

          {(filterStatus !==
            'All Status' ||
            search) && (
            <button
              className="pay-btn-ghost"
              onClick={() => {
                setFilterStatus(
                  'All Status'
                );
                setSearch('');
                setPage(1);
              }}
            >
              <FiX size={13} />
              Clear
            </button>
          )}
        </div>

        <div className="pay-table-header-row">
          <div className="pay-table-label">
            Clients{' '}
            <span className="pay-record-count">
              ({filtered.length} of{' '}
              {leads.length})
            </span>
          </div>
        </div>

        <div className="pay-table-wrap">
          <table className="pay-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Type</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ||
              leadsLoading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="pay-empty-row"
                  >
                    Loading clients…
                  </td>
                </tr>
              ) : paginated.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="pay-empty-row"
                  >
                    No clients found.
                  </td>
                </tr>
              ) : (
                paginated.map(
                  ({
                    lead,
                    payment: pay,
                  }) => {
                    const orgName =
                      pay?.organizationName ||
                      leadOrganizationName(lead) ||
                      '--';

                    const address =
                      pay?.address ||
                      leadAddress(lead) ||
                      '--';

                    const phone =
                      pay?.phone ||
                      leadPhone(lead) ||
                      '--';

                    const email =
                      pay?.email ||
                      leadEmail(lead) ||
                      '--';

                    return (
                      <tr
                        key={
                          lead.leadId
                        }
                      >
                        <td>
                          <div className="pay-client-cell">
                            <div
                              className="pay-client-avatar"
                              style={{
                                background:
                                  avatarColor(
                                    orgName
                                  ),
                              }}
                            >
                              {initials(
                                orgName
                              )}
                            </div>

                            <div>
                              <div className="pay-client-name">
                                {orgName}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="pay-address-cell">
                          <div className="pay-address-text" title={address}>
                            {address}
                          </div>
                        </td>

                        <td>
                          {phone}
                        </td>

                        <td>
                          {email}
                        </td>

                        <td>
                          {pay?.paymentType ||
                            '--'}
                        </td>

                        <td>
                          <span className="pay-amount">
                            {pay
                              ? fmtINR(
                                  pay.totalAmount
                                )
                              : '--'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              pay?.amountPaid >
                              0
                                ? 'pay-amount-paid'
                                : 'pay-amount-zero'
                            }
                          >
                            {pay
                              ? fmtINR(
                                  pay.amountPaid
                                )
                              : '--'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              pay?.balanceAmount >
                              0
                                ? 'pay-amount-balance'
                                : 'pay-amount-zero'
                            }
                          >
                            {pay
                              ? fmtINR(
                                  pay.balanceAmount
                                )
                              : '--'}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              pay?.status ||
                              'No Payment'
                            }
                          />
                        </td>

                        <td>
                          <div className="pay-action-group">
                            {pay ? (
                              <>
                                <button
                                  className="pay-act-btn view"
                                  title="View Details"
                                  aria-label="View Details"
                                  onClick={() =>
                                    setViewPay(
                                      pay
                                    )
                                  }
                                >
                                  <FiEye />
                                </button>

                                <button
                                  className="pay-act-btn edit"
                                  title="Edit"
                                  aria-label="Edit Payment"
                                  onClick={() =>
                                    setFormPay(
                                      pay
                                    )
                                  }
                                >
                                  <FiEdit2 />
                                </button>

                                <button
                                  className="pay-act-btn email"
                                  title="Send Payment Details"
                                  aria-label="Send Payment Details"
                                  onClick={() =>
                                    setSendModal(
                                      {
                                        payment:
                                          pay,
                                        mode: 'payment',
                                      }
                                    )
                                  }
                                >
                                  <FiSend />
                                </button>

                                {pay.invoiceId &&
                                  (pay.status ===
                                    'Invoice Sent to Telecaller' ||
                                    pay.status ===
                                      'Completed') && (
                                    <button
                                      className="pay-act-btn whatsapp"
                                      title="Send Invoice to Client"
                                      aria-label="Send Invoice to Client"
                                      onClick={() =>
                                        setSendModal(
                                          {
                                            payment:
                                              pay,
                                            mode: 'invoice',
                                          }
                                        )
                                      }
                                    >
                                      <FaWhatsapp />
                                    </button>
                                  )}

                                {pay.invoiceId && (
                                  <button
                                    className="pay-act-btn download"
                                    title="Download Invoice"
                                    aria-label="Download Invoice"
                                    onClick={() =>
                                      handleDownloadInvoice(
                                        pay
                                      )
                                    }
                                  >
                                    <FiDownload />
                                  </button>
                                )}
                              </>
                            ) : (
                              // ─────────────────────────────
                              // ONLY UI CHANGE:
                              // "Start Payment" text removed.
                              // Existing functionality is unchanged.
                              // ─────────────────────────────
                              <button
                                className="pay-act-btn view"
                                title="Start Payment Request"
                                aria-label="Start Payment Request"
                                onClick={() => {
                                  setFormPresetLead(
                                    lead
                                  );
                                  setFormPay(
                                    null
                                  );
                                }}
                              >
                                <FiPlus />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="pay-pagination-bar">
          <div className="pay-rows-select">
            Rows per page:

            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(
                  Number(e.target.value)
                );
                setPage(1);
              }}
            >
              {ROWS_OPTIONS.map((r) => (
                <option key={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="pay-page-nums">
            <button
              className="pay-pg-btn"
              disabled={page === 1}
              onClick={() =>
                setPage(
                  (p) => p - 1
                )
              }
            >
              <FiChevronLeft
                size={13}
              />
            </button>

            {pgRange().map(
              (p, i) =>
                p === '...' ? (
                  <span
                    key={`d${i}`}
                    style={{
                      padding: '0 4px',
                      color:
                        'var(--text-light)',
                    }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`pay-pg-btn${
                      page === p
                        ? ' active'
                        : ''
                    }`}
                    onClick={() =>
                      setPage(p)
                    }
                  >
                    {p}
                  </button>
                )
            )}

            <button
              className="pay-pg-btn"
              disabled={
                page === totalPages
              }
              onClick={() =>
                setPage(
                  (p) => p + 1
                )
              }
            >
              <FiChevronRight
                size={13}
              />
            </button>
          </div>
        </div>
      </div>

      {viewPay && (
        <ViewPaymentModal
          payment={viewPay}
          previous={(paymentsByLead[viewPay.leadId] || []).filter(
            (p) => p.id !== viewPay.id
          )}
          qr={qr}
          onClose={() =>
            setViewPay(null)
          }
          onDownloadInvoice={
            handleDownloadInvoice
          }
          onSendPayment={() => {
            setSendModal({
              payment: viewPay,
              mode: 'payment',
            });

            setViewPay(null);
          }}
          onSendInvoice={() => {
            setSendModal({
              payment: viewPay,
              mode: 'invoice',
            });

            setViewPay(null);
          }}
          onAddRecord={() =>
            setRecordPay(viewPay)
          }
        />
      )}

      {formPay !== undefined && (
        <PaymentFormModal
          initial={formPay}
          paymentsByLead={paymentsByLead}
          presetLead={
            formPay
              ? null
              : formPresetLead
          }
          onClose={() => {
            setFormPay(undefined);
            setFormPresetLead(null);
          }}
          onSave={handleSaveForm}
        />
      )}

      {recordPay && (
        <PaymentRecordModal
          payment={recordPay}
          onClose={() =>
            setRecordPay(null)
          }
          onSave={(payload) =>
            handleAddRecord(
              recordPay,
              payload
            )
          }
        />
      )}

      {sendModal && (
        <SendModal
          payment={
            sendModal.payment
          }
          mode={sendModal.mode}
          qr={qr}
          onClose={() =>
            setSendModal(null)
          }
          onSent={(channel) =>
            sendModal.mode ===
            'invoice'
              ? handleSendInvoice(
                  sendModal.payment,
                  channel
                )
              : handleSendPaymentDetails(
                  sendModal.payment,
                  channel
                )
          }
        />
      )}
    </div>
  );
};

export default Payments;