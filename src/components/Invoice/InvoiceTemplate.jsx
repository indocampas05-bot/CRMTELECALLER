import React from 'react';
import './InvoiceTemplate.css';
import { INVOICE_DEFAULTS } from './invoiceDefaults';

const money = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const split = (value) =>
  String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (value) => {
  if (!value) return '—';

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate
    .toLocaleDateString('en-GB')
    .replace(/\//g, '-');
};

const amountInWords = (value) => {
  const number = Math.round(Number(value || 0));

  if (!number) {
    return 'Zero only';
  }

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convert = (amount) => {
    if (amount < 20) {
      return ones[amount];
    }

    if (amount < 100) {
      return (
        tens[Math.floor(amount / 10)] +
        (amount % 10 ? ` ${ones[amount % 10]}` : '')
      );
    }

    return (
      `${ones[Math.floor(amount / 100)]} Hundred` +
      (amount % 100 ? ` and ${convert(amount % 100)}` : '')
    );
  };

  let remaining = number;
  const parts = [];

  if (remaining >= 10000000) {
    parts.push(
      `${convert(Math.floor(remaining / 10000000))} Crore`
    );
    remaining %= 10000000;
  }

  if (remaining >= 100000) {
    parts.push(
      `${convert(Math.floor(remaining / 100000))} Lakh`
    );
    remaining %= 100000;
  }

  if (remaining >= 1000) {
    parts.push(
      `${convert(Math.floor(remaining / 1000))} Thousand`
    );
    remaining %= 1000;
  }

  if (remaining > 0) {
    parts.push(convert(remaining));
  }

  return `${parts.join(' ')} only`;
};

export default function InvoiceTemplate({
  invoice = {},
  qrDataUrl,
  logoDataUrl,
  signatureDataUrl,
  thankYouDataUrl,
}) {
  const payment = invoice || {};

  // Every text on the invoice is editable; missing values fall back to the defaults.
  const txt = (key) =>
    payment[key] !== undefined && payment[key] !== null
      ? String(payment[key])
      : INVOICE_DEFAULTS[key] || '';

  const lines = (value) =>
    String(value || '')
      .split(/\n/)
      .map((item) => item.trim())
      .filter(Boolean);

  // ----- items -----
  const rawItems =
    Array.isArray(payment.items) && payment.items.length
      ? payment.items
      : [
          {
            description:
              payment.description ||
              `${payment.paymentType || 'Service'} charges`,
            quantity: 1,
            rate: Number(payment.totalAmount || 0),
          },
        ];

  const items = rawItems.map((item) => {
    const quantity = Number(item.quantity ?? 1);
    const rate = Number(item.rate ?? 0);
    return {
      description: item.description || '',
      quantity,
      rate,
      amount: quantity * rate,
    };
  });

  // ----- totals -----
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discount = Number(payment.discountAmount || 0);
  const rate = Number(payment.taxRate ?? 18); // default GST 18% (editable per invoice)
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * rate) / 100;
  const grandTotal = taxable + tax;
  const paid = Number(payment.amountPaid || 0);
  const balance = Math.max(0, grandTotal - paid);

  const billName = payment.organizationName || '';
  const billAddress = split(payment.address);
  const shipName = txt('shippingName').trim() || billName;
  const shipAddress = txt('shippingAddress').trim()
    ? split(txt('shippingAddress'))
    : billAddress;

  const invoiceNumber = payment.invoiceNumber || '—';
  const invoiceDate = payment.invoiceDate || payment.paymentDate;
  const paymentStatus =
    payment.paymentStatus || (balance <= 0 ? 'Paid' : 'Partial Paid');

  const companyAddress = split(txt('companyAddress'));

  return (
    <div className="invoice-print-root">
      <article className="invoice-sheet">
        <header className="invoice-title-bar">INVOICE</header>

        {/* COMPANY HEADER */}
        <section className="invoice-company">
          <div className="invoice-company-copy">
            <h1>{txt('companyName')}</h1>

            {companyAddress.length > 0 && (
              <div className="company-row">
                <span>●</span>
                <div>
                  {companyAddress.map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < companyAddress.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {txt('companyEmail') && (
              <div className="company-row">
                <span>✉</span>
                <div>Email Address: {txt('companyEmail')}</div>
              </div>
            )}

            {txt('companyMobile') && (
              <div className="company-row">
                <span>⌕</span>
                <div>Mobile: {txt('companyMobile')}</div>
              </div>
            )}

            {txt('companyWebsite') && (
              <div className="company-row">
                <span>◎</span>
                <div>Website: {txt('companyWebsite')}</div>
              </div>
            )}
          </div>

          <div className="invoice-brand">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Company logo" />
            ) : (
              <div className="logo-fallback">
                <b>▥</b>
                <span>IC</span>
                <b>♧</b>
                <strong>INDO</strong>
                <em>CAMPAS</em>
              </div>
            )}
          </div>
        </section>

        <div className="invoice-rule" />

        {/* BILLING DETAILS */}
        <section className="invoice-address-grid">
          <div>
            <h3>BILL TO</h3>
            <b>{billName || '—'}</b>
            {billAddress.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
            {payment.phone && <p>Contact: {payment.phone}</p>}
            {payment.customerGstin && <p>GSTIN: {payment.customerGstin}</p>}
          </div>

          <div>
            <h3>SHIPPING ADDRESS</h3>
            <b>{shipName || '—'}</b>
            {shipAddress.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>

          <div className="invoice-meta">
            <p>
              <b>Invoice No:</b> {invoiceNumber}
            </p>
            <p>
              <b>Invoice Date:</b> {formatDate(invoiceDate)}
            </p>
            <p>
              <b>STATUS:</b> {paymentStatus}
            </p>
          </div>
        </section>

        {/* ITEMS */}
        <table className="invoice-items">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{money(item.rate)}</td>
                <td>{money(item.amount)}</td>
              </tr>
            ))}

            <tr>
              <td>{items.length + 1}</td>
              <td>{payment.paymentType || 'Advance'} Received</td>
              <td>1</td>
              <td>{money(paid)}</td>
              <td>{money(paid)}</td>
            </tr>
          </tbody>
        </table>

        {/* TOTALS */}
        <section className="invoice-lower">
          <div className="invoice-declaration">
            {lines(txt('declaration')).map((line, index, all) => (
              <React.Fragment key={index}>
                {line}
                {index < all.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>

          <div className="invoice-totals">
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>

            <div>
              <span>Discount</span>
              <b>{money(discount)}</b>
            </div>

            <div className="dotted">
              <span>Subtotal Less Discount</span>
              <b>{money(taxable)}</b>
            </div>

            <div>
              <span>Tax Rate(%)</span>
              <b>{money(rate)}</b>
            </div>

            <div>
              <span>Total Tax</span>
              <b>{money(tax)}</b>
            </div>

            <div className="dotted">
              <span>Total</span>
              <b>{money(grandTotal)}</b>
            </div>

            <div className="paid-total">
              <span>PAID</span>
              <b>{money(paid)}</b>
            </div>

            <div
              className="balance-due"
              style={{ background: '#b8cce4', fontWeight: 700, padding: '4px 8px' }}
            >
              <span>Balance Due</span>
              <b>{money(balance)}</b>
            </div>
          </div>
        </section>

        {/* AMOUNT IN WORDS */}
        <div className="invoice-words">
          <b>IN WORDS:</b> {amountInWords(paid)}
        </div>

        <div className="invoice-bottom-rule" />

        {/* FOOTER */}
        <footer className="invoice-footer">
          <div className="payment-instructions">
            <h3>Payment Instructions</h3>

            {txt('bankName') && <p>Bank Name: {txt('bankName')}</p>}
            {txt('bankBranch') && <p>Branch Name: {txt('bankBranch')}</p>}
            {txt('bankIfsc') && <p>IFSC Code: {txt('bankIfsc')}</p>}
            {txt('bankAccountNo') && <p>Account No: {txt('bankAccountNo')}</p>}

            {qrDataUrl && (
              <img className="invoice-qr" src={qrDataUrl} alt="Scan to pay" />
            )}
          </div>

          {thankYouDataUrl ? (
            <div className="invoice-paid-image">
              <img
                className="thank-you-image"
                src={thankYouDataUrl}
                alt="Paid - Thank You"
              />
            </div>
          ) : (
            <div className="paid-stamp">
              <div className="stamp-ring">THANK YOU</div>
              <div className="stamp-bar">PAID</div>
              <div className="stamp-bottom">PAID</div>
            </div>
          )}

          <div className="invoice-sign">
            <b>{txt('signatoryFor')}</b>

            {signatureDataUrl ? (
              <img
                className="signature-image"
                src={signatureDataUrl}
                alt="Authorized signature"
              />
            ) : (
              <div className="signature-fallback">{txt('signatoryName')}</div>
            )}

            <strong>{txt('signatoryName')}</strong>
            <b>{txt('signatoryTitle')}</b>

            <hr />

            <span>Authorized Signatory</span>
          </div>
        </footer>

        <div className="thank-you">
          <span />
          <em>Thank You!</em>
          <span />
        </div>
      </article>
    </div>
  );
}