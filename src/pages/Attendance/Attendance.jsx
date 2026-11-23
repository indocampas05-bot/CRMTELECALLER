import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FiClock, FiLogIn, FiLogOut, FiWifi, FiWifiOff, FiCalendar, FiShield, FiRefreshCw} from 'react-icons/fi';
import attendanceService from '../../services/attendanceService';
import './Attendance.css';

const fmt=(seconds=0)=>{seconds=Math.max(0,Math.floor(seconds)); const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60; return [h,m,s].map((v,i)=>i===0?String(v).padStart(2,'0'):String(v).padStart(2,'0')).join(':');};
const time=(v)=>v?new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}):'—';

export default function Attendance(){
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [tick,setTick]=useState(Date.now()); const [offset,setOffset]=useState(0);
  const load=useCallback(async()=>{try{const d=await attendanceService.today();setData(d);if(d.serverNow)setOffset(new Date(d.serverNow).getTime()-Date.now());setError('');}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load(); const i=setInterval(load,15000); return()=>clearInterval(i);},[load]);
  useEffect(()=>{const on=()=>load();window.addEventListener('attendance:update',on);return()=>window.removeEventListener('attendance:update',on);},[load]);
  useEffect(()=>{const i=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(i);},[]);
  const serverNow=tick+offset;
  const permissionEnd=data?.permission?.end?new Date(data.permission.end).getTime():0;
  const remaining=data?.permission?.status==='Active'?Math.max(0,Math.floor((permissionEnd-serverNow)/1000)):0;
  const working=data?.workingSeconds||0;
  const liveWorking=useMemo(()=>{if(!data)return 0;if(data.online && ['Present','Late'].includes(data.status) && data.serverNow){return working+Math.max(0,Math.floor((serverNow-new Date(data.serverNow).getTime())/1000));}return working;},[data,working,serverNow]);
  if(loading)return <div className="att-page"><div className="att-loading">Loading attendance…</div></div>;
  return <div className="att-page">
    <div className="att-head"><div><h1>Attendance</h1><p>Daily attendance is tied to your employee and server date. Re-login and network reconnects continue the same day.</p></div><button className="att-refresh" onClick={load}><FiRefreshCw/> Refresh</button></div>
    {error&&<div className="att-error">{error}</div>}
    <div className="att-grid">
      <div className={`att-status-card ${String(data?.status||'').toLowerCase()}`}><div className="att-card-label">Current Status</div><div className="att-status">{data?.status||'Not Marked'}</div><div className="att-online">{data?.online?<><FiWifi/> Connected</>:data?.disconnected?<><FiWifiOff/> Disconnected — attendance preserved</>:<><FiWifiOff/> Logged out</>}</div></div>
      <div className="att-card"><div className="att-card-label">First Login</div><div className="att-big"><FiLogIn/>{time(data?.firstLoginAt)}</div><small>Server time</small></div>
      <div className="att-card"><div className="att-card-label">Working Time</div><div className="att-big"><FiClock/>{fmt(liveWorking)}</div><small>Permission/leave time excluded</small></div>
      <div className="att-card"><div className="att-card-label">Sessions</div><div className="att-big"><FiRefreshCw/>{data?.sessionCount||0}</div><small>Login/logout sessions today</small></div>
    </div>
    <div className="att-detail-grid">
      <section className="att-panel"><h2><FiShield/> Permission</h2>{data?.permission?<><div className="permission-row"><strong>{time(data.permission.start)}</strong><span>→</span><strong>{time(data.permission.end)}</strong></div><div className="permission-state">{data.permission.status==='Active'?<>Remaining: <b>{fmt(remaining)}</b></>:<>Completed</>}</div><p>{data.permission.reason||'Approved permission'}</p></>:<div className="att-empty">No approved permission for today.</div>}</section>
      <section className="att-panel"><h2><FiCalendar/> Leave</h2>{data?.leave?<div className="leave-active"><b>{data.leave.leaveType}</b><span>Active</span></div>:<div className="att-empty">No active approved leave.</div>}</section>
      <section className="att-panel"><h2><FiRefreshCw/> Session History</h2><div className="session-list">{(data?.sessions||[]).map(s=><div className="session-row" key={s.id}><div><b>{time(s.loginAt)}</b>{s.logoutAt?` → ${time(s.logoutAt)}`:' → Active'}</div><span>{s.manuallyLoggedOut?'Logout':s.connected?'Connected':'Disconnected'}</span></div>)}</div></section>
    </div>
  </div>;
}
