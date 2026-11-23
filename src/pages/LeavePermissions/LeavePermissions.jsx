import React, { useEffect, useMemo, useRef, useState } from 'react';
import './LeavePermissions.css';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiSend, FiPaperclip, FiTrash2, FiUser, FiBriefcase, FiBell } from 'react-icons/fi';
import leavePermissionService from '../../services/leavePermissionService';

const initialLeave = { leaveType: 'annual', fromDate: '', toDate: '', reason: '', attachment: null, days: 0 };
const initialPermission = { date: '', permissionType: '1_HOUR', fromTime: '', toTime: '', reason: '', duration: '' };

const LeavePermissions = () => {
  const [activeTab, setActiveTab] = useState('apply-leave');
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({ totalLeave: 24, usedLeave: 0, remainingLeave: 24, pendingRequests: 0, approvedPermissions: 0 });
  const [leaveForm, setLeaveForm] = useState(initialLeave);
  const [permissionForm, setPermissionForm] = useState(initialPermission);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const notify = (message, type = 'success') => {
    setNotificationMessage(message); setNotificationType(type); setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const [list, stats] = await Promise.all([leavePermissionService.getMine(), leavePermissionService.getSummary()]);
      setRequests(Array.isArray(list) ? list : []); setSummary(stats || {});
    } catch (e) { notify(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, []);

  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    const a = new Date(start), b = new Date(end); let count = 0;
    for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) if (d.getDay() !== 0) count++;
    return count;
  };
  useEffect(() => setLeaveForm(f => ({ ...f, days: calculateWorkingDays(f.fromDate, f.toDate) })), [leaveForm.fromDate, leaveForm.toDate]);
  useEffect(() => {
    if (!permissionForm.fromTime || !permissionForm.toTime) return;
    const from = new Date(`1970-01-01T${permissionForm.fromTime}:00`), to = new Date(`1970-01-01T${permissionForm.toTime}:00`);
    if (to > from) { const mins = (to - from) / 60000; setPermissionForm(f => ({ ...f, duration: `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim() })); }
  }, [permissionForm.fromTime, permissionForm.toTime]);

  const resetForms = () => { setLeaveForm(initialLeave); setPermissionForm(initialPermission); setEditingRequest(null); };

  const submitLeave = async e => {
    e.preventDefault();
    if (!leaveForm.days) return notify('Select valid From and To dates.', 'error');
    if (leaveForm.days > Number(summary.remainingLeave || 0) && !editingRequest) return notify('Insufficient leave balance.', 'error');
    const payload = { type: 'Leave', leaveType: ({ annual: 'Annual Leave', sick: 'Sick Leave', casual: 'Casual Leave', personal: 'Personal Leave', medical: 'Medical Leave', unpaid: 'Unpaid Leave', half: 'Half-day', morning: 'Morning Leave', afternoon: 'Afternoon Leave' })[leaveForm.leaveType], fromDate: leaveForm.fromDate, toDate: leaveForm.toDate, reason: leaveForm.reason, duration: `${leaveForm.days} Days` };
    try {
      setSaving(true);
      if (editingRequest) await leavePermissionService.update(editingRequest.id, payload); else await leavePermissionService.create(payload);
      notify(editingRequest ? 'Leave request updated.' : 'Leave request submitted.'); resetForms(); setActiveTab('my-requests'); await load();
    } catch (e2) { notify(e2.message, 'error'); } finally { setSaving(false); }
  };

  useEffect(() => {
    const presets = { '1_HOUR': 60, '2_HOURS': 120, 'HALF_DAY': 240 };
    const mins = presets[permissionForm.permissionType];
    if (!mins || !permissionForm.fromTime) return;
    const [h,m]=permissionForm.fromTime.split(':').map(Number);
    const end=h*60+m+mins;
    const eh=Math.floor(end/60)%24, em=end%60;
    setPermissionForm(f=>({...f,toTime:`${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`}));
  }, [permissionForm.permissionType, permissionForm.fromTime]);

  const submitPermission = async e => {
    e.preventDefault();
    if (!permissionForm.date || !permissionForm.fromTime || !permissionForm.toTime) return notify('Complete all permission fields.', 'error');
    const payload = { type: 'Permission', permissionType: permissionForm.permissionType, date: permissionForm.date, fromTime: permissionForm.fromTime, toTime: permissionForm.toTime, reason: permissionForm.reason, duration: permissionForm.duration };
    try {
      setSaving(true);
      if (editingRequest) await leavePermissionService.update(editingRequest.id, payload); else await leavePermissionService.create(payload);
      notify(editingRequest ? 'Permission request updated.' : 'Permission request submitted.'); resetForms(); setActiveTab('my-requests'); await load();
    } catch (e2) { notify(e2.message, 'error'); } finally { setSaving(false); }
  };

  const edit = r => {
    setEditingRequest(r);
    if (r.type === 'Leave') { const lt = (r.leaveType || '').toLowerCase(); setLeaveForm({ ...initialLeave, leaveType: lt.includes('morning') ? 'morning' : lt.includes('afternoon') ? 'afternoon' : lt.includes('half') ? 'half' : lt.includes('sick') ? 'sick' : lt.includes('casual') ? 'casual' : lt.includes('medical') ? 'medical' : lt.includes('personal') ? 'personal' : lt.includes('unpaid') ? 'unpaid' : 'annual', fromDate: r.fromDate || '', toDate: r.toDate || '', reason: r.reason || '', days: parseInt(r.duration) || 0 }); setActiveTab('apply-leave'); }
    else { setPermissionForm({ ...initialPermission, date: r.date || '', permissionType: r.permissionType || 'CUSTOM', fromTime: r.fromTime || '', toTime: r.toTime || '', reason: r.reason || '', duration: r.duration || '' }); setActiveTab('apply-permission'); }
  };

  const remove = async id => { if (!window.confirm('Delete this pending request?')) return; try { await leavePermissionService.remove(id); notify('Request deleted.'); await load(); } catch (e) { notify(e.message, 'error'); } };
  const statusIcon = s => s === 'Approved' ? <FiCheckCircle size={14}/> : s === 'Rejected' ? <FiXCircle size={14}/> : <FiClock size={14}/>;
  const workingDaysThisMonth = useMemo(() => calculateWorkingDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10), new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).toISOString().slice(0,10)), []);

  return <div className="lp-page">
    {showNotification && <div className={`lp-notification-toast ${notificationType}`}>{notificationMessage}</div>}
    <div className="lp-header"><div><div className="lp-title">Leave &amp; Permissions</div><div className="lp-subtitle">Create requests and track Super Admin decisions</div></div><button className="lp-btn-icon" onClick={load}><FiBell size={20}/></button></div>
    <div className="lp-summary-grid">
      <Summary label="Leave Balance" value={`${summary.remainingLeave ?? 0}/${summary.totalLeave ?? 24}`} icon={<FiCalendar/>}/>
      <Summary label="Leave Taken" value={summary.usedLeave ?? 0} icon={<FiBriefcase/>}/>
      <Summary label="Approved Permissions" value={summary.approvedPermissions ?? 0} icon={<FiClock/>}/>
      <Summary label="Working Days" value={workingDaysThisMonth} icon={<FiUser/>}/>
      <Summary label="Pending Requests" value={summary.pendingRequests ?? 0} icon={<FiClock/>}/>
    </div>
    <div className="lp-tabs">
      <button className={`lp-tab ${activeTab==='apply-leave'?'active':''}`} onClick={()=>setActiveTab('apply-leave')}>Apply Leave</button>
      <button className={`lp-tab ${activeTab==='apply-permission'?'active':''}`} onClick={()=>setActiveTab('apply-permission')}>Apply Permission</button>
      <button className={`lp-tab ${activeTab==='my-requests'?'active':''}`} onClick={()=>setActiveTab('my-requests')}>My Requests</button>
    </div>
    <div className="lp-content">
      {activeTab==='apply-leave' && <section className="lp-form-section"><h3>{editingRequest?'Edit Leave Request':'Apply Leave'}</h3><form onSubmit={submitLeave}><div className="lp-form-grid">
        <Field label="Leave Type"><select value={leaveForm.leaveType} onChange={e=>setLeaveForm({...leaveForm,leaveType:e.target.value})}><option value="annual">Annual Leave</option><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="personal">Personal Leave</option><option value="medical">Medical Leave</option><option value="unpaid">Unpaid Leave</option><option value="half">Half-day Leave</option><option value="morning">Morning Leave</option><option value="afternoon">Afternoon Leave</option></select></Field>
        <Field label="From Date"><input type="date" min={todayStr} value={leaveForm.fromDate} onChange={e=>setLeaveForm({...leaveForm,fromDate:e.target.value})} required/></Field>
        <Field label="To Date"><input type="date" min={leaveForm.fromDate||todayStr} value={leaveForm.toDate} onChange={e=>setLeaveForm({...leaveForm,toDate:e.target.value})} required/></Field>
        <Field label="Working Days"><input readOnly value={leaveForm.days||0} className="lp-input-readonly"/></Field>
        <Field label="Reason" wide><textarea rows="3" value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm,reason:e.target.value})} required placeholder="Enter reason..."/></Field>
        <Field label="Attachment (optional)" wide><div className="lp-file-upload"><input type="file" ref={fileInputRef} style={{display:'none'}} onChange={e=>setLeaveForm({...leaveForm,attachment:e.target.files?.[0]||null})}/><button type="button" className="lp-btn-outline" onClick={()=>fileInputRef.current?.click()}><FiPaperclip/> Choose File</button>{leaveForm.attachment&&<span className="lp-file-name">{leaveForm.attachment.name}</span>}</div></Field>
      </div><div className="lp-form-actions"><button type="button" className="lp-btn-outline" onClick={resetForms}>Cancel</button><button className="lp-btn-primary" disabled={saving}><FiSend/> {saving?'Saving...':editingRequest?'Update Leave':'Submit Leave'}</button></div></form></section>}
      {activeTab==='apply-permission' && <section className="lp-form-section"><h3>{editingRequest?'Edit Permission Request':'Apply Permission'}</h3><form onSubmit={submitPermission}><div className="lp-form-grid">
        <Field label="Permission Type"><select value={permissionForm.permissionType} onChange={e=>setPermissionForm({...permissionForm,permissionType:e.target.value})}><option value="1_HOUR">1 Hour</option><option value="2_HOURS">2 Hours</option><option value="CUSTOM">Custom</option><option value="HALF_DAY">Half Day</option></select></Field><Field label="Date"><input type="date" min={todayStr} value={permissionForm.date} onChange={e=>setPermissionForm({...permissionForm,date:e.target.value})} required/></Field><Field label="From Time"><input type="time" value={permissionForm.fromTime} onChange={e=>setPermissionForm({...permissionForm,fromTime:e.target.value})} required/></Field><Field label="To Time"><input type="time" value={permissionForm.toTime} onChange={e=>setPermissionForm({...permissionForm,toTime:e.target.value})} required/></Field><Field label="Duration"><input readOnly value={permissionForm.duration} className="lp-input-readonly"/></Field><Field label="Reason" wide><textarea rows="3" value={permissionForm.reason} onChange={e=>setPermissionForm({...permissionForm,reason:e.target.value})} required placeholder="Enter reason..."/></Field>
      </div><div className="lp-form-actions"><button type="button" className="lp-btn-outline" onClick={resetForms}>Cancel</button><button className="lp-btn-primary" disabled={saving}><FiSend/> {saving?'Saving...':editingRequest?'Update Permission':'Submit Permission'}</button></div></form></section>}
      {activeTab==='my-requests' && <section className="lp-form-section"><div className="lp-section-header"><h3>My Requests</h3><button className="lp-btn-outline" onClick={load}>Refresh</button></div>{loading?<p>Loading...</p>:!requests.length?<p>No requests found.</p>:<div className="lp-table-wrap"><table className="lp-table"><thead><tr><th>Type</th><th>Period</th><th>Duration</th><th>Reason</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td>{r.type}</td><td>{r.type==='Leave'?`${r.fromDate} → ${r.toDate}`:`${r.date} ${r.fromTime} → ${r.toTime}`}</td><td>{r.duration||'-'}</td><td>{r.reason||'-'}</td><td><span className={`lp-status ${String(r.status).toLowerCase()}`}>{statusIcon(r.status)} {r.status}</span>{r.rejectionReason&&<small className="lp-rejection">{r.rejectionReason}</small>}</td><td>{r.submittedAt?new Date(r.submittedAt).toLocaleString('en-IN'):'-'}</td><td>{r.status==='Pending'?<><button className="lp-action-btn" onClick={()=>edit(r)}>Edit</button><button className="lp-action-btn danger" onClick={()=>remove(r.id)}><FiTrash2/></button></>:<button className="lp-action-btn" onClick={()=>setSelectedRequest(r)}>View</button>}</td></tr>)}</tbody></table></div>}</section>}
    </div>
    {selectedRequest&&<div className="lp-modal-overlay" onClick={()=>setSelectedRequest(null)}><div className="lp-modal" onClick={e=>e.stopPropagation()}><h3>Request Details</h3><p><b>Type:</b> {selectedRequest.type}</p><p><b>Status:</b> {selectedRequest.status}</p><p><b>Reason:</b> {selectedRequest.reason}</p>{selectedRequest.rejectionReason&&<p><b>Rejection reason:</b> {selectedRequest.rejectionReason}</p>}<button className="lp-btn-primary" onClick={()=>setSelectedRequest(null)}>Close</button></div></div>}
  </div>;
};

const Summary=({label,value,icon})=><div className="lp-summary-card"><div className="lp-summary-icon" style={{background:'#3498db'}}>{icon}</div><div className="lp-summary-content"><div className="lp-summary-label">{label}</div><div className="lp-summary-value">{value}</div></div></div>;
const Field=({label,children,wide})=><div className="lp-form-group" style={wide?{gridColumn:'span 2'}:undefined}><label>{label} *</label>{children}</div>;
export default LeavePermissions;
