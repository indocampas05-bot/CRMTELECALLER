import { swr } from './cache';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://scanning-unused-dash.ngrok-free.dev/api';
const request = async (endpoint, options={}) => {
  const token=localStorage.getItem('token');
  const headers={'Content-Type':'application/json','ngrok-skip-browser-warning':'true',...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  const res=await fetch(`${API_BASE}${endpoint}`,{...options,headers});
  if(res.status===401){localStorage.removeItem('token');localStorage.removeItem('user');throw new Error('Session expired. Please login again.');}
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.message||e.error||`API error: ${res.status}`);}
  return res.json();
};
const attendanceService={
  login:(deviceInfo)=>request('/attendance/login',{method:'POST',body:JSON.stringify({deviceInfo})}),
  logout:()=>request('/attendance/logout',{method:'POST'}),
  heartbeat:()=>request('/attendance/heartbeat',{method:'POST'}),
  reconnect:(deviceInfo)=>request('/attendance/reconnect',{method:'POST',body:JSON.stringify({deviceInfo})}),
  today:()=>request('/attendance/today'),
  mine:()=>request('/attendance/mine'),
  // Used by Dashboard.jsx: cached value first, fresh value right after.
  todaySWR:(onData)=>swr('attendance-today',()=>request('/attendance/today'),{ttl:10000,onData}),
};
export default attendanceService;
