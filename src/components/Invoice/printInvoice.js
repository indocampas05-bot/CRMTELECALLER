import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import InvoiceTemplate from './InvoiceTemplate';

// local fallbacks, used only when the Super Admin has not uploaded these images yet
import fallbackLogo from '../../assets/invoice/indo-logo.jpg';
import fallbackSignature from '../../assets/invoice/authorized-signature.png';
import fallbackThankYou from '../../assets/invoice/thank-you-paid.png';

const nextPaint = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
};

/**
 * Renders the exact React invoice DOM and downloads it as a single A4 PDF.
 * The browser print dialog is not used, so clicking Save / Print PDF produces
 * a real .pdf file immediately.
 */
export async function printInvoicePdf(
  invoice,
  { qrDataUrl, logoDataUrl, signatureDataUrl, thankYouDataUrl } = {}
) {
  logoDataUrl = logoDataUrl || fallbackLogo;
  signatureDataUrl = signatureDataUrl || fallbackSignature;
  thankYouDataUrl = thankYouDataUrl || fallbackThankYou;

  const mount = document.createElement('div');
  mount.className = 'invoice-pdf-mode';
  mount.style.position = 'fixed';
  mount.style.left = '-20000px';
  mount.style.top = '0';
  mount.style.width = '794px';
  mount.style.background = '#ffffff';
  mount.style.zIndex = '-1';
  document.body.appendChild(mount);

  const root = createRoot(mount);

  try {
    root.render(
      React.createElement(InvoiceTemplate, {
        invoice,
        qrDataUrl,
        logoDataUrl,
        signatureDataUrl,
        thankYouDataUrl,
      })
    );

    await nextPaint();
    await waitForImages(mount);
    await nextPaint();

    const sheet = mount.querySelector('.invoice-sheet');
    if (!sheet) throw new Error('Invoice template could not be rendered.');

    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imageData = canvas.toDataURL('image/png');
    const imageRatio = canvas.width / canvas.height;

    let renderWidth = pageWidth;
    let renderHeight = renderWidth / imageRatio;
    if (renderHeight > pageHeight) {
      renderHeight = pageHeight;
      renderWidth = renderHeight * imageRatio;
    }

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    pdf.addImage(imageData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');

    const rawNumber =
      invoice?.editedInvoiceNumber ||
      invoice?.invoiceNumber ||
      invoice?.invoiceNo ||
      invoice?.invoiceRecord?.invoiceNumber ||
      'invoice';

    const safeNumber = String(rawNumber).replace(/[^a-z0-9_-]+/gi, '-');
    pdf.save(`${safeNumber}.pdf`);
  } finally {
    root.unmount();
    mount.remove();
  }
}