
import React, { useEffect, useMemo, useState } from 'react';
import './Agreements.css';

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiEye,
  FiSend,
  FiX,
  FiMail,
  FiMessageCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';

import { agreementService } from '../../services/agreementService';
import AgreementFormModal from './AgreementFormModal';

const fmt = (s) => ({
  PENDING_APPROVAL: 'Pending Verification',
  RESUBMITTED: 'Pending Verification',
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT: 'Sent to Lead'
}[s] || String(s || 'DRAFT').replaceAll('_', ' '));

export default function Agreements() {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState('');

  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // LOAD AGREEMENTS AND TEMPLATES
  const load = async () => {
    setLoading(true);
    setError('');

    const [aRes, tRes] = await Promise.allSettled([
      agreementService.list(),
      agreementService.templates()
    ]);

    if (aRes.status === 'fulfilled') {
      setItems(Array.isArray(aRes.value) ? aRes.value : []);
    }

    if (tRes.status === 'fulfilled') {
      setTemplates(Array.isArray(tRes.value) ? tRes.value : []);
    }

    const failures = [aRes, tRes]
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message)
      .filter(Boolean);

    if (failures.length) {
      setError(
        [...new Set(failures)].join(' ') +
        ' — check that the backend server / tunnel is running and reachable, then retry.'
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // SUBMIT FOR VERIFICATION
  const submit = async (id) => {
    try {
      const saved = await agreementService.submit(id);

      setItems(prev =>
        prev.map(x => x.id === id ? saved : x)
      );
    } catch (e) {
      setError(e.message || 'Unable to submit agreement');
    }
  };

  // PDF PREVIEW
  const openPdf = async (id) => {
    try {
      const url = await agreementService.pdfBlobUrl(id);

      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (e) {
      setError(e.message || 'Unable to load PDF');
    }
  };

  // SEND APPROVED AGREEMENT
  const share = async (a, channel) => {
    try {
      setError('');

      // Validate contact details before marking as sent.
      if (channel === 'Email' && !a.email) {
        setError('This lead has no email address.');
        return;
      }

      if (channel === 'WhatsApp' && !String(a.phone || '').replace(/[^\d]/g, '')) {
        setError('This lead has no WhatsApp number.');
        return;
      }

      const saved = await agreementService.send(a.id, channel);

      setItems(prev =>
        prev.map(x => x.id === a.id ? saved : x)
      );

      const title = encodeURIComponent(
        a.title || 'Approved Agreement'
      );

      const message = encodeURIComponent(
        `Dear ${a.clientName || 'Client'}, your agreement has been approved. Please find the approved agreement attached or use the CRM agreement PDF shared by your Telecaller.`
      );

      if (channel === 'Email') {
        window.location.href =
          `mailto:${encodeURIComponent(a.email)}?subject=${title}&body=${message}`;
      } else {
        const phone = String(a.phone || '').replace(/[^\d]/g, '');

        window.open(
          `https://wa.me/${phone}?text=${message}`,
          '_blank',
          'noopener,noreferrer'
        );
      }

      setSending(null);

    } catch (e) {
      setError(e.message || 'Unable to mark agreement as sent');
    }
  };

  // SEARCH FILTER
  const filtered = useMemo(() => {
    return items.filter(a =>
      [
        a.clientName,
        a.organization,
        a.title,
        a.agreementType,
        fmt(a.status)
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [items, query]);

  return (
    <div className="agreements-page">

      {/* PAGE HEADER */}
      <div className="agr-header">

        <div>
          <h1 className="page-title">
            Agreements
          </h1>

          <p className="page-subtitle">
            Draft → Submit for Verification → Approved/Rejected → Send to Lead
          </p>
        </div>

        <button
          className="agr-btn-primary"
          onClick={() => setEditing('new')}
        >
          <FiPlus />
          New Agreement
        </button>

      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="agr-error-banner">

          <span>{error}</span>

          <button
            onClick={load}
            title="Retry"
            style={{ marginLeft: 8 }}
          >
            <FiRefreshCw />
            Retry
          </button>

          <button onClick={() => setError('')}>
            <FiX />
          </button>

        </div>
      )}

      {/* SEARCH TOOLBAR */}
      <div className="agr-toolbar">

        <div className="agr-search">
          <FiSearch />

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search agreements"
          />
        </div>

      </div>

      {/* AGREEMENTS TABLE */}
      {loading ? (

        <div className="agr-empty">
          Loading...
        </div>

      ) : (

        <div className="agr-table-wrap">

          <table className="agr-table">

            <thead>
              <tr>
                <th>Client</th>
                <th>Category</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(a => (

                <tr key={a.id}>

                  <td>
                    <b>{a.clientName}</b>

                    <div>{a.organization}</div>

                    {a.status === 'REJECTED' &&
                      a.rejectionReason && (
                        <small
                          style={{
                            display: 'block',
                            marginTop: 6
                          }}
                        >
                          <FiAlertCircle />
                          {' '}Rejected: {a.rejectionReason}
                        </small>
                      )}
                  </td>

                  <td>
                    {a.serviceType ||
                      templates.find(t => t.id === a.templateId)?.name ||
                      a.agreementType ||
                      a.templateId}
                  </td>

                  <td>{a.title}</td>

                  <td>
                    <span className="agr-status-pill">
                      {fmt(a.status)}
                    </span>
                  </td>

                  <td>

                    {['DRAFT', 'REJECTED'].includes(a.status) && (
                      <button
                        className="agr-icon-btn"
                        onClick={() => setEditing(a)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                    )}

                    <button
                      className="agr-icon-btn"
                      onClick={() => openPdf(a.id)}
                      title="Preview / Print"
                    >
                      <FiEye />
                    </button>

                    {['DRAFT', 'REJECTED'].includes(a.status) && (
                      <button
                        className="agr-icon-btn"
                        onClick={() => submit(a.id)}
                        title="Submit for Verification"
                      >
                        <FiSend />
                      </button>
                    )}

                    {a.status === 'APPROVED' && (
                      <button
                        className="agr-icon-btn"
                        onClick={() => setSending(a)}
                        title="Send to Lead"
                      >
                        <FiSend />
                      </button>
                    )}

                  </td>

                </tr>

              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan="5" className="agr-empty">
                    No agreements found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      )}

      {/* =====================================
          SEND APPROVED AGREEMENT MODAL
      ====================================== */}

      {sending && (

        <div
          className="agr-modal-overlay agr-send-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSending(null);
            }
          }}
        >

          <div className="agr-modal-box agr-send-modal-box">

            {/* MODAL HEADER */}
            <div className="agr-modal-header">

              <span className="agr-modal-title">
                Send Approved Agreement
              </span>

              <button
                className="agr-modal-close"
                onClick={() => setSending(null)}
                aria-label="Close modal"
              >
                <FiX />
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="agr-modal-body agr-send-modal-body">

              {/* CLIENT DETAILS */}
              <div className="agr-send-client">

                <span className="agr-send-avatar">
                  {(sending.clientName || 'C')
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div>
                  <b>{sending.clientName || 'Client'}</b>

                  <small>
                    {sending.organization || 'Client'}
                  </small>
                </div>

              </div>

              {/* DESCRIPTION */}
              <p className="agr-send-description">
                Your agreement has been approved.
                Choose how you would like to share
                the approved agreement with this client.
              </p>

              {/* CONTACT DETAILS */}
              <div className="agr-send-details">

                <div>
                  <FiMail />

                  <span>
                    {sending.email || 'Email not available'}
                  </span>
                </div>

                <div>
                  <FiMessageCircle />

                  <span>
                    {sending.phone || 'Phone not available'}
                  </span>
                </div>

              </div>

              {/* DELIVERY ACTIONS */}
              <div className="agr-form-actions agr-send-actions">

                <button
                  className="agr-btn-outline"
                  onClick={() => share(sending, 'WhatsApp')}
                  disabled={!sending.phone}
                >
                  <FiMessageCircle />
                  Send via WhatsApp
                </button>

                <button
                  className="agr-btn-primary"
                  onClick={() => share(sending, 'Email')}
                  disabled={!sending.email}
                >
                  <FiMail />
                  Send via Email
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================
          CREATE / EDIT AGREEMENT MODAL
      ====================================== */}

      {editing && (

        <AgreementFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, closeModal = false) => {

            setItems(prev => {

              const exists = prev.some(
                x => x.id === saved.id
              );

              return exists
                ? prev.map(x =>
                    x.id === saved.id ? saved : x
                  )
                : [saved, ...prev];

            });

            if (closeModal) {
              setEditing(null);
            }

          }}
        />

      )}

    </div>
  );
}
