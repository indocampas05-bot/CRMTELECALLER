import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  FaUsers, FaPhone, FaRedo, FaTrophy, FaSearch,
  FaFileExcel, FaPrint, FaCheckCircle, FaPhoneSlash, FaSyncAlt
} from "react-icons/fa";
import { reportService } from "../../services/reportService";
import "./Reports.css";

const PERIODS = [
  { value: "TODAY", label: "Today" },
  { value: "WEEK", label: "This Week" },
  { value: "MONTH", label: "This Month" },
  { value: "ALL", label: "All Time" },
];

const exportCsv = (rows, filename) => {
  const keys = Object.keys(rows[0] || {});
  const csv = [
    keys.join(","),
    ...rows.map(row => keys.map(key => {
      const value = String(row[key] ?? "").replaceAll('"', '""');
      return `"${value}"`;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const ReportView = ({ admin = false }) => {
  const [period, setPeriod] = useState("MONTH");
  const [report, setReport] = useState(null);
  const [telecallers, setTelecallers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (admin) {
        const [overall, rows] = await Promise.all([
          reportService.getOverallReport(period),
          reportService.getTelecallerReports(period),
        ]);
        setReport(overall);
        setTelecallers(Array.isArray(rows) ? rows : []);
        setSelectedUsername("");
        setSelectedReport(null);
      } else {
        setReport(await reportService.getMyReport(period));
      }
    } catch (e) {
      setError(e.message || "Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const openTelecaller = async username => {
    if (!username) {
      setSelectedUsername("");
      setSelectedReport(null);
      return;
    }

    setLoadingDetail(true);
    setError("");
    try {
      setSelectedUsername(username);
      setSelectedReport(await reportService.getTelecallerReport(username, period));
    } catch (e) {
      setError(e.message || "Unable to load telecaller report.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const activeReport = selectedReport || report;
  const summary = activeReport?.summary || {};
  const today = activeReport?.today || {};
  const leadStatus = activeReport?.leadStatus || [];
  const outcomes = activeReport?.callOutcomes || [];
  const trend = activeReport?.performanceTrend || [];

  const cards = [
    { label: "Total Leads", value: summary.totalLeads ?? 0, icon: <FaUsers />, color: "#7b1113" },
    { label: "Calls Made", value: summary.callsMade ?? 0, icon: <FaPhone />, color: "#2563eb" },
    { label: "Follow-ups", value: summary.followUps ?? 0, icon: <FaRedo />, color: "#d97706" },
    { label: "Connected Calls", value: summary.connectedCalls ?? 0, icon: <FaCheckCircle />, color: "#16a34a" },
    { label: "Missed Calls", value: summary.missedCalls ?? 0, icon: <FaPhoneSlash />, color: "#dc2626" },
    { label: "Interested Leads", value: summary.interestedLeads ?? 0, icon: <FaUsers />, color: "#7c3aed" },
    { label: "Clients Converted", value: summary.clientsConverted ?? 0, icon: <FaTrophy />, color: "#0891b2" },
    { label: "Conversion Rate", value: `${summary.conversionRate ?? 0}%`, icon: <FaTrophy />, color: "#db2777" },
  ];

  const filteredTelecallers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return telecallers;
    return telecallers.filter(row =>
      [row.fullName, row.username, row.employeeId]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(needle))
    );
  }, [search, telecallers]);

  if (loading) {
    return <div className="rp-root"><div className="rp-panel">Loading report data...</div></div>;
  }

  return (
    <div className="rp-root">
      <div className="rp-page-header">
        <div>
          <h1 className="rp-page-title">
            {admin ? "Reports & Telecaller Performance" : "My Reports"}
          </h1>
          <div className="rp-breadcrumb">
            {admin
              ? "Centralized performance reporting for all telecallers"
              : "Your own performance data from the backend"}
          </div>
        </div>

        <div className="rp-header-actions">
          <select
            className="rp-select"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            {PERIODS.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <button className="rp-btn rp-btn-outline" onClick={load}>
            <FaSyncAlt /> Refresh
          </button>

          <button
            className="rp-btn rp-btn-outline"
            onClick={() => exportCsv(
              cards.map(card => ({ Metric: card.label, Value: card.value })),
              "reports-summary.csv"
            )}
          >
            <FaFileExcel /> Export
          </button>

          <button className="rp-btn rp-btn-primary" onClick={() => window.print()}>
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {error && <div className="rp-error">{error}</div>}

      {admin && (
        <div className="rp-panel">
          <div className="rp-panel-header">
            <div>
              <h3>Telecaller Comparison</h3>
              <p>Select a telecaller to view their individual report.</p>
            </div>
            <div className="rp-search-wrap">
              <FaSearch />
              <input
                placeholder="Search telecaller"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Telecaller</th>
                  <th>Leads</th>
                  <th>Calls</th>
                  <th>Connected</th>
                  <th>Follow-ups</th>
                  <th>Converted</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {filteredTelecallers.map(row => {
                  const item = row.report?.summary || {};
                  return (
                    <tr
                      key={row.id || row.username}
                      className={selectedUsername === row.username ? "rp-selected-row" : ""}
                      onClick={() => openTelecaller(row.username)}
                    >
                      <td>
                        <b>{row.fullName || row.username}</b>
                        <small>{row.username}</small>
                      </td>
                      <td>{item.assignedLeads ?? item.totalLeads ?? 0}</td>
                      <td>{item.callsMade ?? 0}</td>
                      <td>{item.connectedCalls ?? 0}</td>
                      <td>{item.followUps ?? 0}</td>
                      <td>{item.clientsConverted ?? 0}</td>
                      <td>{item.conversionRate ?? 0}%</td>
                    </tr>
                  );
                })}
                {!filteredTelecallers.length && (
                  <tr><td colSpan="7" className="rp-empty">No telecallers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {loadingDetail && <div className="rp-loading-inline">Loading individual report...</div>}
        </div>
      )}

      {selectedUsername && (
        <div className="rp-panel rp-selected-report">
          Viewing individual report for <b>{selectedUsername}</b>
          <button className="rp-link-btn" onClick={() => openTelecaller("")}>Back to overall report</button>
        </div>
      )}

      <div className="rp-cards-grid">
        {cards.map(card => (
          <div className="stats-card" key={card.label}>
            <div className="stat-icon" style={{ color: card.color }}>{card.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rp-two-col">
        <div className="rp-panel">
          <div className="rp-panel-title">Performance Trend</div>
          <div className="rp-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" name="Calls Made" stroke="#7b1113" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rp-panel">
          <div className="rp-panel-title">Lead Status</div>
          <div className="rp-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Leads" fill="#7b1113" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rp-two-col">
        <div className="rp-panel">
          <div className="rp-panel-title">Call Outcomes</div>
          <div className="rp-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={outcomes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="outcome" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Calls" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rp-panel">
          <div className="rp-panel-title">Today's Performance</div>
          <div className="rp-today-list">
            {[
              ["Calls Made", today.callsMade ?? 0],
              ["Connected Calls", today.connectedCalls ?? 0],
              ["Missed Calls", today.missedCalls ?? 0],
              ["New Leads Contacted", today.newLeadsContacted ?? 0],
              ["Follow-ups Completed", today.followUpsCompleted ?? 0],
              ["Interested Leads", today.interestedLeads ?? 0],
            ].map(([label, value]) => (
              <div className="rp-today-row" key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Reports() { return <ReportView />; }
