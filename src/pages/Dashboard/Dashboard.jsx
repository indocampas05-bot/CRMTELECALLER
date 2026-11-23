import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import {
  FiUsers, FiPhoneCall, FiRefreshCw, FiTrendingUp,
  FiFileText, FiDollarSign, FiCheckCircle, FiActivity,
  FiPhoneMissed, FiClock, FiWifi, FiWifiOff
} from "react-icons/fi";
import attendanceService from "../../services/attendanceService";
import { dashboardService } from "../../services/dashboardService";
import "./Dashboard.css";

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setData(await dashboardService.getDashboard());
    } catch (e) {
      setError(e.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try { setAttendance(await attendanceService.today()); } catch (_) {}
  }, []);

  useEffect(() => {
    loadDashboard();
    loadAttendance();
    const timer = setInterval(() => {
      loadDashboard(true);
      loadAttendance();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadDashboard, loadAttendance]);

  const summary = data?.summary || {};
  const today = data?.today || {};

  const cards = useMemo(() => [
    { label: "My Leads", value: summary.totalLeads ?? 0, icon: <FiUsers />, page: "leads", color: "#2563eb", bg: "#eff6ff" },
    { label: "Calls Made", value: summary.callsMade ?? 0, icon: <FiPhoneCall />, page: "callpanel", color: "#7b1113", bg: "#fdf2f2" },
    { label: "Connected", value: summary.connectedCalls ?? 0, icon: <FiCheckCircle />, page: "reports", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Missed / No Answer", value: summary.missedCalls ?? 0, icon: <FiPhoneMissed />, page: "callpanel", color: "#dc2626", bg: "#fef2f2" },
    { label: "Follow-ups", value: summary.followUps ?? 0, icon: <FiRefreshCw />, page: "followups", color: "#d97706", bg: "#fffbeb" },
    { label: "Converted", value: summary.clientsConverted ?? 0, icon: <FiTrendingUp />, page: "clients", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Payments", value: money(summary.paymentsCollected), icon: <FiDollarSign />, page: "payments", color: "#059669", bg: "#ecfdf5" },
    { label: "Conversion Rate", value: `${summary.conversionRate ?? 0}%`, icon: <FiActivity />, page: "reports", color: "#0891b2", bg: "#ecfeff" },
  ], [summary]);

  if (loading) {
    return <div className="role-dashboard db-loading">Loading your live dashboard...</div>;
  }

  return (
    <div className="role-dashboard">
      <div className="db-header">
        <div>
          <h1 className="db-title">My Dashboard</h1>
          <p className="db-subtitle">Your assigned leads, calls, follow-ups, payments, quotations, agreements, and activity.</p>
          <div className="db-live"><span className="db-live-dot" />Your dashboard refreshes automatically every 30 seconds</div>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-primary" onClick={() => onNavigate?.("callpanel")}><FiPhoneCall /> Call Panel</button>
          <button className="db-btn" onClick={() => { setRefreshing(true); loadDashboard(true); }} disabled={refreshing}>
            <FiRefreshCw /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="db-error">{error}</div>}

      <div className="db-card" style={{ marginBottom: 18 }}>
        <div className="db-card-head">
          <h3 className="db-card-title">Today's Attendance</h3>
          <p className="db-card-desc">
            {attendance?.online ? <><FiWifi /> Connected</> : <><FiWifiOff /> {attendance?.status || "Not connected"}</>}
          </p>
        </div>
        <div className="db-today-list">
          <div className="db-today-row"><span>Status</span><b>{attendance?.status || "—"}</b></div>
          <div className="db-today-row">
            <span>First Login</span>
            <b>{attendance?.firstLoginAt ? new Date(attendance.firstLoginAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</b>
          </div>
          <div className="db-today-row">
            <span>Working Time</span>
            <b>{attendance ? new Date((attendance.workingSeconds || 0) * 1000).toISOString().slice(11, 19) : "—"}</b>
          </div>
        </div>
      </div>

      <div className="db-summary-grid">
        {cards.map(card => (
          <div className="db-stat-card" key={card.label} onClick={() => onNavigate?.(card.page)}>
            <div className="db-stat-top"><span className="db-stat-icon" style={{ color: card.color, background: card.bg }}>{card.icon}</span></div>
            <div className="db-stat-value">{card.value}</div>
            <div className="db-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="db-layout">
        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">My 7-Day Calling Performance</h3>
            <p className="db-card-desc">Your calling and successful connection activity.</p>
          </div>
          <div className="db-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.performanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" name="Calls Made" stroke="#7b1113" strokeWidth={3} />
                <Line type="monotone" dataKey="connected" name="Connected" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">My Work Today</h3>
            <p className="db-card-desc">Live summary of your activity today.</p>
          </div>
          <div className="db-today-list">
            {[
              ["Calls Made", today.callsMade],
              ["Connected Calls", today.connectedCalls],
              ["Missed Calls", today.missedCalls],
              ["New Leads", today.newLeads],
              ["Follow-ups", today.followUps],
              ["Interested", today.interestedLeads],
              ["Converted", today.clientsConverted],
              ["Quotations", today.quotations],
              ["Agreements", today.agreements],
              ["Payments", money(today.paymentsCollected)],
            ].map(([label, value]) => (
              <div className="db-today-row" key={label}><span>{label}</span><b>{value ?? 0}</b></div>
            ))}
          </div>
        </div>
      </div>

      <div className="db-layout">
        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">My Lead Status</h3>
            <p className="db-card-desc">Only the leads available to your logged-in account are shown.</p>
          </div>
          <div className="db-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.leadStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Leads" fill="#7b1113" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-head">
            <h3 className="db-card-title">My Recent Calls</h3>
            <p className="db-card-desc">Your latest recorded call activity.</p>
          </div>
          <div className="db-call-list">
            {(data?.recentCalls || []).slice(0, 8).map(call => (
              <div className="db-call-item" key={call.id}>
                <div>
                  <div className="db-call-name">{call.leadName}</div>
                  <div className="db-call-meta">{call.leadMobile || "No mobile"} · {call.outcome || call.status || "Recorded"}</div>
                </div>
                <span className="db-call-status">{call.status || "Recorded"}</span>
              </div>
            ))}
            {!data?.recentCalls?.length && <div className="db-empty">No calls recorded yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
