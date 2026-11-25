import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { leadService } from '../../services/leadService';
import { useAuth } from '../../context/AuthContext';

/**
 * Global follow-up reminder.
 * Mounted once in MainLayout, so it works on EVERY page (not only Follow-ups).
 *
 * - Loads this telecaller's leads that have a follow-up date (tcNextRefollowupDate)
 * - When that date/time arrives -> popup + sound + browser notification
 * - Also shows follow-ups that became due while the telecaller was away (last 24h)
 * - Actions: Call Now (opens Call Panel and starts the call), Snooze 5 min, Dismiss
 */

const CHECK_EVERY_MS = 1000;             // compare "now" with due times every second (in-memory, very cheap)
const REFRESH_EVERY_MS = 3 * 60 * 1000;  // how often we re-read follow-ups from the server
const SNOOZE_MS = 5 * 60 * 1000;
const OVERDUE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_VISIBLE = 3;

// ─── helpers (same rules as Followups.jsx) ────────────────────────────────────
const unwrapRows = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.leads)) return value.leads;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  return [];
};

const parseLeadNotes = (lead) => {
  const raw = lead?.notes;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const firstValue = (...values) =>
  values.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
// same, but returns '' instead of undefined (so we never print the word "undefined")
const textOf = (...values) => String(firstValue(...values) ?? '');

// "2026-11-24T14:30" -> that local time. Date only ("2026-11-24") -> 09:00 local.
const toDueDate = (raw) => {
  if (!raw) return null;
  const text = String(raw).trim();
  const hasTime = /[T ]\d{1,2}:\d{2}/.test(text);
  if (!hasTime) {
    const m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return { due: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9, 0, 0), hasTime: false };
  }
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : { due: d, hasTime: true };
};

const mapLeadToReminder = (lead) => {
  const rawDate = firstValue(
    lead?.tcNextRefollowupDate, lead?.nextFollowupDate, lead?.followUpDate, lead?.followupDate
  );
  const parsed = toDueDate(rawDate);
  if (!parsed) return null;

  const notes = parseLeadNotes(lead);
  const fuStatus = String(notes.TC_NEXT_FOLLOWUP_STATUS || '');
  // Already handled -> never remind
  if (['Completed', 'Missed', 'Cancelled'].includes(fuStatus)) return null;

  const leadKey = String(firstValue(lead?.leadId, lead?.businessLeadId, lead?.id, lead?._id, ''));
  if (!leadKey) return null;

  return {
    key: `${leadKey}|${String(rawDate).trim()}`,   // changes when the follow-up is rescheduled
    leadId: leadKey,
    rawLead: lead,
    organization: textOf(lead?.organization, lead?.schoolName, lead?.school, lead?.name) || 'Unknown organization',
    contactPerson: textOf(lead?.contactPerson, lead?.contactName),
    mobile: textOf(lead?.mobile, lead?.phoneNumber, lead?.phone),
    note: textOf(notes.TC_NEXT_FOLLOWUP_NOTE, notes.tcNextRefollowupNote, lead?.tcNextRefollowupNote, lead?.followupNote),
    due: parsed.due,
    hasTime: parsed.hasTime,
  };
};

const fmtDue = (r) => {
  const date = r.due.toLocaleDateString([], { day: '2-digit', month: 'short' });
  return r.hasTime ? `${date}, ${r.due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : date;
};

const dueLabel = (r, now) => {
  const mins = Math.floor((now - r.due.getTime()) / 60000);
  if (mins < 2) return 'Due now';
  if (mins < 60) return `Overdue by ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `Overdue by ${hrs} hr${hrs > 1 ? 's' : ''}`;
};

// ─── sound + browser notification ─────────────────────────────────────────────
const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.32);
    });
    setTimeout(() => ctx.close?.(), 1500);
  } catch { /* autoplay blocked - popup still shows */ }
};

const browserNotify = (r) => {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification('⏰ Follow-up due: ' + r.organization, {
      body: [r.contactPerson, r.mobile, r.note].filter(Boolean).join(' · '),
      tag: r.key,
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* ignore */ }
};

// ─── component ────────────────────────────────────────────────────────────────
const FollowUpReminders = ({ onNavigate }) => {
  const { user } = useAuth();
  const storeKey = `fu-reminders-ack:${user?.username || 'me'}`;

  const [popups, setPopups] = useState([]);      // reminders currently shown
  const [now, setNow] = useState(Date.now());

  const itemsRef = useRef([]);                    // all pending follow-ups
  const shownRef = useRef(new Set());             // keys already popped up this session
  const snoozedRef = useRef(new Map());           // key -> timestamp when to show again
  const loadingRef = useRef(false);

  const readAcked = useCallback(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storeKey) || '[]')); }
    catch { return new Set(); }
  }, [storeKey]);

  const ack = useCallback((key) => {
    try {
      const set = readAcked();
      set.add(key);
      localStorage.setItem(storeKey, JSON.stringify([...set].slice(-500)));
    } catch { /* ignore */ }
  }, [readAcked, storeKey]);

  // ── load follow-ups from the server (same API the Follow-ups page uses) ─────
  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const districts = unwrapRows(await leadService.getMyDistricts());
      const responses = await Promise.all(
        districts.map((item) => {
          const d = typeof item === 'string' ? item : (item?.district || item?.name || item?.districtName);
          return d ? leadService.getMyLeadsByDistrict(d).catch(() => []) : Promise.resolve([]);
        })
      );
      const list = responses.flatMap(unwrapRows).map(mapLeadToReminder).filter(Boolean);
      itemsRef.current = list;
      const upcoming = list.filter((r) => r.due.getTime() > Date.now()).sort((a, b) => a.due - b.due)[0];
      console.info(`[FollowUpReminders] loaded ${list.length} pending follow-ups` + (upcoming ? `, next: ${upcoming.organization} at ${upcoming.due.toLocaleString()}` : ''));

      // drop popups for follow-ups that were completed / rescheduled / removed meanwhile
      const alive = new Set(list.map((r) => r.key));
      setPopups((cur) => cur.filter((p) => alive.has(p.key)));
    } catch (error) {
      /* offline / not a telecaller -> try again next cycle */
      console.warn('[FollowUpReminders] could not load follow-ups:', error?.message || error);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // ── compare "now" with due times ────────────────────────────────────────────
  const check = useCallback(() => {
    const t = Date.now();
    setNow(t);
    const acked = readAcked();
    const fresh = [];

    itemsRef.current.forEach((r) => {
      const dueMs = r.due.getTime();
      if (dueMs > t) return;                                   // not yet
      if (t - dueMs > OVERDUE_WINDOW_MS) return;               // too old
      if (acked.has(r.key)) return;                            // already handled
      const snoozeUntil = snoozedRef.current.get(r.key);
      if (snoozeUntil && snoozeUntil > t) return;              // snoozed
      if (shownRef.current.has(r.key)) return;                 // already on screen
      shownRef.current.add(r.key);
      fresh.push(r);
    });

    if (fresh.length) {
      fresh.sort((a, b) => a.due - b.due);
      setPopups((cur) => [...cur, ...fresh]);
      beep();
      fresh.forEach(browserNotify);
    }
  }, [readAcked]);

  useEffect(() => {
    // ask once for desktop-notification permission (needed when the tab is in background)
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch { /* ignore */ }

    load().then(check);

    // Ticker. Browsers slow down setInterval in background tabs (to ~1 per minute),
    // which made reminders late. A Web Worker is not throttled, so it drives the clock;
    // setInterval stays as a fallback.
    let worker = null;
    let checkTimer = null;
    try {
      const blob = new Blob(
        [`setInterval(function(){ postMessage(1); }, ${CHECK_EVERY_MS});`],
        { type: 'application/javascript' }
      );
      worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = () => check();
    } catch {
      checkTimer = setInterval(check, CHECK_EVERY_MS);
    }

    const loadTimer = setInterval(load, REFRESH_EVERY_MS);
    const onFocus = () => { load().then(check); };
    const onVisible = () => { if (!document.hidden) check(); };
    // Fired by leadService.updateLead -> a follow-up was just created / rescheduled
    const onChanged = () => { load().then(check); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('followups-changed', onChanged);
    return () => {
      if (worker) worker.terminate();
      if (checkTimer) clearInterval(checkTimer);
      clearInterval(loadTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('followups-changed', onChanged);
    };
  }, [load, check]);

  // Test helper: open the browser console on ANY page and run  testFollowUpReminder()
  useEffect(() => {
    window.testFollowUpReminder = () => {
      const due = new Date();
      const r = {
        key: `test|${Date.now()}`, leadId: 'TEST', rawLead: null,
        organization: 'Test School (reminder check)', contactPerson: 'Test Contact', mobile: '9876543210',
        note: 'This is a test follow-up reminder.', due, hasTime: true,
      };
      setPopups((cur) => [...cur, r]);
      beep();
    };
    return () => { delete window.testFollowUpReminder; };
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────
  const remove = (key) => setPopups((cur) => cur.filter((p) => p.key !== key));

  const dismiss = (r) => { ack(r.key); remove(r.key); };

  const snooze = (r) => {
    snoozedRef.current.set(r.key, Date.now() + SNOOZE_MS);
    shownRef.current.delete(r.key);   // allowed to pop up again after the snooze
    remove(r.key);
  };

  const callNow = (r) => {
    ack(r.key);
    remove(r.key);
    if (onNavigate) {
      onNavigate('callpanel', {
        state: { lead: r.rawLead, leadId: r.leadId, phone: r.mobile, name: r.organization, action: 'startCall' },
      });
    }
  };

  if (!popups.length) return null;

  const visible = popups.slice(0, MAX_VISIBLE);
  const hidden = popups.length - visible.length;

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      style={{ position: 'fixed', top: 16, right: 16, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 12, width: 340, maxWidth: 'calc(100vw - 32px)' }}
    >
      {visible.map((r) => (
        <div
          key={r.key}
          style={{ background: '#fff', borderRadius: 12, borderLeft: '5px solid #7b1113', boxShadow: '0 10px 30px rgba(0,0,0,.22)', padding: 14, animation: 'fuPopIn .25s ease-out' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ color: '#7b1113', fontSize: 13 }}>⏰ Follow-up reminder</strong>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#fee2e2', borderRadius: 999, padding: '2px 8px' }}>
              {dueLabel(r, now)}
            </span>
          </div>

          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{r.organization}</div>
          <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 2 }}>
            {[r.contactPerson, r.mobile && `☎ ${r.mobile}`].filter(Boolean).join(' · ') || '--'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Scheduled: {fmtDue(r)}</div>
          {r.note && (
            <div style={{ fontSize: 12.5, color: '#374151', background: '#f9fafb', borderRadius: 8, padding: '6px 8px', marginTop: 8, maxHeight: 64, overflow: 'auto' }}>
              {r.note}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => callNow(r)}
              style={{ flex: 1.3, padding: '8px 0', border: 'none', borderRadius: 8, background: '#7b1113', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >📞 Call Now</button>
            <button
              onClick={() => snooze(r)}
              style={{ flex: 1, padding: '8px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5 }}
            >Snooze 5m</button>
            <button
              onClick={() => dismiss(r)}
              style={{ flex: 0.8, padding: '8px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5 }}
            >Dismiss</button>
          </div>
        </div>
      ))}

      {hidden > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#fff', background: '#7b1113', borderRadius: 999, padding: '4px 10px', alignSelf: 'center' }}>
          +{hidden} more follow-up{hidden > 1 ? 's' : ''} due
        </div>
      )}

      <style>{`@keyframes fuPopIn { from { transform: translateX(30px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
    </div>,
    document.body
  );
};

export default FollowUpReminders;