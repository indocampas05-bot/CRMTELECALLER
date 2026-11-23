const API_BASE=import.meta.env.VITE_API_BASE||'https://crmbackend-5d2o.onrender.com/api';
const headers=()=>{const t=localStorage.getItem('token');return {'ngrok-skip-browser-warning':'true',...(t?{Authorization:`Bearer ${t}`}:{})}};
const handle=async r=>{if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.message||'Request failed')}return r};
const upload=async(path,file)=>{const fd=new FormData();fd.append('file',file);const r=await fetch(`${API_BASE}${path}`,{method:'POST',headers:headers(),body:fd});return (await handle(r)).json()};
const get=async path=>{const r=await fetch(`${API_BASE}${path}`,{headers:headers()});return (await handle(r)).json()};
export default { uploadLogo:file=>upload('/payments/admin/invoice-assets/logo',file), uploadSignature:file=>upload('/payments/admin/invoice-assets/signature',file), getAssets:()=>get('/payments/invoice-assets/data') };
