import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiX, FiSave, FiTrash2, FiType, FiImage, FiMinus, FiTable,
  FiFileText, FiUpload, FiCopy, FiLayout, FiPlus, FiChevronLeft,
  FiChevronRight, FiCopy as FiDuplicate
} from 'react-icons/fi';
import templateService from '../../services/templateService';

const MAPS = [
  ['', 'Static / manual text'],
  ['clientName', 'Client name'], ['organization', 'Organization'],
  ['email', 'Email'], ['phone', 'Phone'], ['subject', 'Subject'],
  ['amount', 'Amount'], ['validTill', 'Valid till'], ['notes', 'Notes'],
  ['leadId', 'Lead ID'], ['quotationId', 'Quotation ID'],
];

const PAGE = { width: 595.28, height: 841.89 };

const makeBlock = (type, index, y = 0.30) => ({
  id: `b_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
  type, x: 0.08, y, width: 0.84,
  height: type === 'heading' ? 0.06 : type === 'divider' ? 0.015 : type === 'table' ? 0.18 : 0.09,
  text: type === 'heading' ? 'Section Heading' : type === 'divider' ? '' : type === 'table' ? '' : 'Enter quotation content here...',
  mapsTo: '', fontSize: type === 'heading' ? 16 : 11, fontFamily: 'Helvetica', fontDataUrl: '',
  fontWeight: type === 'heading' ? 'bold' : 'normal', color: '#111827', backgroundColor: 'transparent',
  align: 'left', verticalAlign: 'top', padding: 5, borderWidth: 0, borderColor: '#D1D5DB',
  borderRadius: 0, bold: type === 'heading', italic: false, underline: false,
  imageDataUrl: '', tableRows: type === 'table' ? [['Description', 'Amount'], ['{{subject}}', '{{amount}}']] : [],
});

const makePage = (index, blocks = []) => ({
  id: `page_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 5)}`,
  name: `Page ${index + 1}`,
  backgroundColor: '#FFFFFF',
  headerEnabled: true, headerHeight: 0.16, headerLayout: 'logo-left',
  footerEnabled: true, footerHeight: 0.12, footerLayout: 'contact-left',
  blocks,
});

const normalize = (template) => {
  const d = template.design || {};
  let pages = Array.isArray(d.pages) && d.pages.length ? d.pages : [];
  if (!pages.length) pages = [makePage(0, Array.isArray(d.blocks) ? d.blocks : [])];
  pages = pages.map((p, i) => ({
    ...makePage(i), ...p,
    id: p.id || `page_${i + 1}`,
    name: p.name || `Page ${i + 1}`,
    backgroundColor: p.backgroundColor || d.backgroundColor || '#FFFFFF',
    headerEnabled: p.headerEnabled !== false,
    headerHeight: Number(p.headerHeight ?? d.headerHeight ?? 0.16),
    headerLayout: p.headerLayout || d.headerLayout || 'logo-left',
    footerEnabled: p.footerEnabled !== false,
    footerHeight: Number(p.footerHeight ?? d.footerHeight ?? 0.12),
    footerLayout: p.footerLayout || d.footerLayout || 'contact-left',
    blocks: Array.isArray(p.blocks) ? p.blocks : [],
  }));
  return {
    mode: d.mode || (template.storedOriginalPath ? 'BACKGROUND' : 'BUILDER'),
    pageSize: d.pageSize || 'A4', orientation: d.orientation || 'PORTRAIT',
    backgroundColor: d.backgroundColor || '#FFFFFF', primaryColor: d.primaryColor || '#7B1113',
    secondaryColor: d.secondaryColor || '#172554', accentColor: d.accentColor || '#DC2626',
    textColor: d.textColor || '#111827', headingColor: d.headingColor || '#111827',
    fontFamily: d.fontFamily || 'Helvetica', fontDataUrl: d.fontDataUrl || '', logoDataUrl: d.logoDataUrl || '',
    companyName: d.companyName || 'Your Company Name', companySubtitle: d.companySubtitle || '',
    companyAddress: d.companyAddress || '', companyPhone: d.companyPhone || '', companyEmail: d.companyEmail || '',
    companyWebsite: d.companyWebsite || '', companyGstNumber: d.companyGstNumber || '',
    headerEnabled: d.headerEnabled !== false, headerHeight: Number(d.headerHeight ?? 0.16),
    headerLayout: d.headerLayout || 'logo-left', footerEnabled: d.footerEnabled !== false,
    footerHeight: Number(d.footerHeight ?? 0.12), footerLayout: d.footerLayout || 'contact-left',
    marginLeft: Number(d.marginLeft ?? 0.08), marginRight: Number(d.marginRight ?? 0.08),
    marginTop: Number(d.marginTop ?? 0.05), marginBottom: Number(d.marginBottom ?? 0.05),
    blocks: Array.isArray(d.blocks) ? d.blocks : [], pages,
  };
};

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number(v) || 0));
const readImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
});

const DesignerInput = ({ label, value, onChange, type = 'text', ...props }) => (
  <label style={{ display: 'block', marginBottom: 9 }}>
    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>{label}</span>
    <input type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} {...props}
      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 8px', fontSize: 12 }} />
  </label>
);

const DesignerSelect = ({ label, value, onChange, children }) => (
  <label style={{ display: 'block', marginBottom: 9 }}>
    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4b5563', marginBottom: 4 }}>{label}</span>
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 8px', fontSize: 12, background: '#fff' }}>{children}</select>
  </label>
);

const QuotationTemplateDesigner = ({ template, onClose, onSaved, showToast }) => {
  const [name, setName] = useState(template.name || 'Quotation Template');
  const [design, setDesign] = useState(() => normalize(template));
  const [fields, setFields] = useState(template.fields || []);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('design');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const dragRef = useRef(null); const logoRef = useRef(null); const blockImageRef = useRef(null); const fontRef = useRef(null);
  const fieldDragRef = useRef(null);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const pages = design.pages || [];
  const currentPage = pages[pageIndex] || pages[0];
  const blocks = currentPage?.blocks || [];
  const selectedBlock = useMemo(() => blocks.find(b => b.id === selectedId) || null, [blocks, selectedId]);
  const selectedField = useMemo(() => fields.find(f => f.id === selectedFieldId) || null, [fields, selectedFieldId]);
  const isBuilder = design.mode === 'BUILDER';
  const pageRatio = design.orientation === 'LANDSCAPE' ? PAGE.height / PAGE.width : PAGE.width / PAGE.height;

  useEffect(() => { if (pageIndex >= pages.length) setPageIndex(Math.max(0, pages.length - 1)); }, [pages.length, pageIndex]);
  useEffect(() => {
    let url;
    if (template.storedPreviewPath) templateService.previewUrl(template.id).then(u => { url = u; setPreviewUrl(u); }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [template.id, template.storedPreviewPath]);

  const updateDesign = patch => setDesign(prev => ({ ...prev, ...patch }));
  const LOCKED_LETTERHEAD_KEYS = new Set([
    'headerEnabled', 'headerHeight', 'headerLayout',
    'footerEnabled', 'footerHeight', 'footerLayout',
  ]);
  const updatePage = patch => {
    const editablePatch = Object.fromEntries(
      Object.entries(patch).filter(([key]) => !LOCKED_LETTERHEAD_KEYS.has(key))
    );
    setDesign(prev => ({
      ...prev,
      pages: prev.pages.map((p, i) => i === pageIndex ? { ...p, ...editablePatch } : p)
    }));
  };
  const updateBlock = (id, patch) => updatePage({ blocks: blocks.map(b => b.id === id ? { ...b, ...patch } : b) });
  const deleteBlock = id => { updatePage({ blocks: blocks.filter(b => b.id !== id) }); if (selectedId === id) setSelectedId(null); };

  const addPage = () => {
    const p = makePage(pages.length, []); setDesign(prev => ({ ...prev, pages: [...prev.pages, p] })); setPageIndex(pages.length); setSelectedId(null);
  };
  const duplicatePage = () => {
    if (!currentPage) return;
    const clone = JSON.parse(JSON.stringify(currentPage)); clone.id = `page_${Date.now()}`; clone.name = `${currentPage.name} Copy`;
    clone.blocks = clone.blocks.map((b, i) => ({ ...b, id: `b_${Date.now()}_${i}_${Math.random().toString(36).slice(2,5)}` }));
    const next = [...pages]; next.splice(pageIndex + 1, 0, clone); setDesign(prev => ({ ...prev, pages: next })); setPageIndex(pageIndex + 1); setSelectedId(null);
  };
  const deletePage = () => {
    if (pages.length <= 1) { showToast('At least one page is required.', 'error'); return; }
    const next = pages.filter((_, i) => i !== pageIndex); setDesign(prev => ({ ...prev, pages: next })); setPageIndex(Math.min(pageIndex, next.length - 1)); setSelectedId(null);
  };
  const renamePage = nameValue => updatePage({ name: nameValue || `Page ${pageIndex + 1}` });

  const addBlock = type => {
    const b = makeBlock(type, blocks.length, type === 'heading' ? 0.28 : 0.32);
    if (type === 'heading') b.color = design.headingColor;
    if (type === 'table') { b.height = 0.18; b.text = ''; }
    if (type === 'image') { b.height = 0.12; b.width = 0.24; b.text = ''; }
    updatePage({ blocks: [...blocks, b] }); setSelectedId(b.id); setTab('blocks');
  };
  const duplicateBlock = () => {
    if (!selectedBlock) return;
    const copy = { ...selectedBlock, id: `b_${Date.now()}`, x: clamp(selectedBlock.x + 0.02), y: clamp(selectedBlock.y + 0.02) };
    updatePage({ blocks: [...blocks, copy] }); setSelectedId(copy.id);
  };
  const startDrag = (e, block) => {
    if (!isBuilder || e.button !== 0) return; e.stopPropagation();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    dragRef.current = { id: block.id, startX: e.clientX, startY: e.clientY, x: block.x, y: block.y, rect };
    setSelectedId(block.id);
    const move = ev => { const r = dragRef.current; if (!r) return; updateBlock(r.id, { x: clamp(r.x + (ev.clientX-r.startX)/r.rect.width), y: clamp(r.y + (ev.clientY-r.startY)/r.rect.height) }); };
    const up = () => { dragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  // ── Fields (amount overlays like svc_erpPro, svc_admissionDashboard) ──
  // These are separate from "blocks": blocks are used in BUILDER mode content;
  // fields are precise x/y/width/height overlay spots — used on top of an
  // uploaded PDF/DOCX background (BACKGROUND mode) — and they double up as
  // the extra input boxes shown in the telecaller's "New Quotation" form
  // (see Quotations.jsx -> customFields) so whatever gets typed there is
  // what should land on that exact spot when the final PDF is generated.
  const makeField = (index) => ({
    id: `fld_${Date.now()}_${index}`,
    label: 'New Field',
    mapsTo: `fld_${Date.now()}_${index}`,
    x: 0.35, y: 0.30 + index * 0.03, width: 0.35, height: 0.024,
    fontSize: 11, align: 'left', verticalAlign: 'middle',
    fontFamily: 'Helvetica', fontWeight: 'normal', color: '#111827',
    bold: false, italic: false, defaultValue: '',
  });
  const addField = () => {
    const f = makeField(fields.length);
    setFields(prev => [...prev, f]);
    setSelectedFieldId(f.id);
    setTab('fields');
  };
  const updateField = (id, patch) => setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  const deleteField = (id) => { setFields(prev => prev.filter(f => f.id !== id)); if (selectedFieldId === id) setSelectedFieldId(null); };

  const startDragField = (e, field) => {
    if (e.button !== 0) return; e.stopPropagation();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    fieldDragRef.current = { id: field.id, startX: e.clientX, startY: e.clientY, x: field.x, y: field.y, rect };
    setSelectedFieldId(field.id); setTab('fields');
    const move = ev => {
      const r = fieldDragRef.current; if (!r) return;
      updateField(r.id, { x: clamp(r.x + (ev.clientX - r.startX) / r.rect.width), y: clamp(r.y + (ev.clientY - r.startY) / r.rect.height) });
    };
    const up = () => { fieldDragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const importFields = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.fields) ? parsed.fields : null;
      if (!list) throw new Error('JSON must be an array of fields, or an object with a "fields" array.');
      const cleaned = list.map((f, i) => ({
        id: f.id || f.mapsTo || `fld_${Date.now()}_${i}`,
        label: f.label || f.id || `Field ${i + 1}`,
        mapsTo: f.mapsTo || f.id || `fld_${Date.now()}_${i}`,
        x: clamp(f.x ?? 0.3), y: clamp(f.y ?? 0.3), width: clamp(f.width ?? 0.3, 0.02, 1), height: clamp(f.height ?? 0.024, 0.01, 1),
        fontSize: f.fontSize ?? 11, align: f.align || 'left', verticalAlign: f.verticalAlign || 'middle',
        fontFamily: f.fontFamily || 'Helvetica', fontWeight: f.fontWeight || 'normal', color: f.color || '#111827',
        bold: !!f.bold, italic: !!f.italic, defaultValue: f.defaultValue ?? '',
      }));
      setFields(cleaned);
      setImportText('');
      showToast(`${cleaned.length} field(s) imported. Drag them onto the exact blank spots, then Save.`);
    } catch (err) {
      setImportError(err.message || 'Invalid JSON.');
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const normalizedDesign = { ...design, blocks: pages[0]?.blocks || [], pages };
      const saved = await templateService.saveDesign(template.id, { name, design: normalizedDesign, fields });
      showToast('Quotation template saved successfully.'); onSaved(saved);
    } catch (e) { showToast(e.message || 'Unable to save template.', 'error'); }
    finally { setSaving(false); }
  };
  const handleLogo = async e => { const file=e.target.files?.[0]; if(!file)return; try{updateDesign({logoDataUrl:await readImage(file)});}catch{showToast('Unable to read logo.','error');} e.target.value=''; };
  const handleFont = async e => { const file=e.target.files?.[0]; if(!file)return; try{updateDesign({fontDataUrl:await readImage(file),fontFamily:file.name.replace(/\.[^.]+$/,'')});}catch{showToast('Unable to read font file.','error');} e.target.value=''; };
  const handleBlockImage = async e => { const file=e.target.files?.[0]; if(!file||!selectedBlock)return; try{updateBlock(selectedBlock.id,{imageDataUrl:await readImage(file)});}catch{showToast('Unable to read image.','error');} e.target.value=''; };

  const pageStyle = { width:'100%', aspectRatio:`${pageRatio}`, position:'relative', overflow:'hidden', background:currentPage?.backgroundColor || design.backgroundColor, boxShadow:'0 10px 30px rgba(15,23,42,.15)', border:'1px solid #d1d5db', userSelect:'none' };
  const backgroundStyle = !isBuilder && previewUrl ? {backgroundImage:`url(${previewUrl})`,backgroundSize:'100% 100%',backgroundPosition:'center',backgroundRepeat:'no-repeat'} : {};

  return (
    <div className="qt-modal-overlay" style={{zIndex:2000}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="qt-modal-box" style={{width:'min(1500px,98vw)',maxWidth:'1500px',height:'95vh',display:'flex',flexDirection:'column'}}>
        <div className="qt-modal-header"><span className="qt-modal-title"><FiLayout size={16} style={{marginRight:6}}/> Quotation Template Designer — Multi Page</span><button className="qt-modal-close" onClick={onClose}><FiX/></button></div>
        <div style={{padding:'9px 14px',borderBottom:'1px solid #e5e7eb',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name" style={{width:230,border:'1px solid #d1d5db',borderRadius:7,padding:'8px 10px',fontWeight:700}}/>
          {['design','pages','blocks','fields'].map(t=><button key={t} className={`qt-btn-outline ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t==='design'?'Branding & Layout':t==='pages'?'Pages':t==='blocks'?'Content Blocks':`Fields (${fields.length})`}</button>)}
          <span style={{flex:1}}/><button className="qt-btn-primary" onClick={save} disabled={saving}><FiSave size={13}/> {saving?'Saving…':'Save Template'}</button>
        </div>
        <div style={{display:'flex',flex:1,minHeight:0}}>
          <div style={{flex:'1 1 auto',overflow:'auto',padding:18,background:'#f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:10}}>
              <button className="qt-btn-outline" disabled={pageIndex===0} onClick={()=>{setPageIndex(pageIndex-1);setSelectedId(null)}}><FiChevronLeft/></button>
              <select value={pageIndex} onChange={e=>{setPageIndex(Number(e.target.value));setSelectedId(null)}} style={{padding:'7px 12px',border:'1px solid #cbd5e1',borderRadius:7,fontWeight:700}}>{pages.map((p,i)=><option key={p.id} value={i}>{i+1}. {p.name}</option>)}</select>
              <button className="qt-btn-outline" disabled={pageIndex===pages.length-1} onClick={()=>{setPageIndex(pageIndex+1);setSelectedId(null)}}><FiChevronRight/></button>
            </div>
            <div style={{maxWidth:760,margin:'0 auto'}}>
              {/* FIX: backgroundStyle (the uploaded template's rendered preview
                  image) was calculated above but never applied here — the
                  canvas only used pageStyle, so an uploaded DOC/DOCX/PDF
                  template's actual look never showed up. Spreading it in
                  makes the uploaded template's format visible again. */}
              <div style={{ ...pageStyle, ...backgroundStyle }}>
                {isBuilder && currentPage?.headerEnabled && <div style={{position:'absolute',inset:'0 0 auto 0',height:`${currentPage.headerHeight*100}%`,background:design.secondaryColor,display:'flex',alignItems:'center',padding:'0 4%',boxSizing:'border-box',color:'#fff',gap:18}}>
                  {design.logoDataUrl && <img src={design.logoDataUrl} alt="logo" style={{width:'10%',maxWidth:72,maxHeight:70,objectFit:'contain'}}/>}
                  <div><div style={{fontSize:22,fontWeight:800}}>{design.companyName||'Your Company Name'}</div>{design.companySubtitle&&<div style={{fontSize:11,opacity:.9}}>{design.companySubtitle}</div>}</div>
                </div>}
                {isBuilder && currentPage?.footerEnabled && <div style={{position:'absolute',inset:'auto 0 0 0',height:`${currentPage.footerHeight*100}%`,background:design.primaryColor,color:'#fff',padding:'1.8% 5%',boxSizing:'border-box',fontSize:9}}><div style={{fontWeight:700}}>{[design.companyPhone,design.companyEmail,design.companyWebsite].filter(Boolean).join(' • ')}</div><div>{design.companyAddress}</div><div style={{opacity:.85}}>{design.companyGstNumber&&`GST: ${design.companyGstNumber}`}</div></div>}
                {blocks.map(block=>{
                  const selected=selectedId===block.id;
                  return <div key={block.id} onMouseDown={e=>startDrag(e,block)} onClick={e=>{e.stopPropagation();setSelectedId(block.id)}} style={{position:'absolute',left:`${block.x*100}%`,top:`${block.y*100}%`,width:`${block.width*100}%`,height:`${block.height*100}%`,boxSizing:'border-box',padding:block.padding,border:selected?`2px solid ${design.accentColor}`:`${block.borderWidth||0}px solid ${block.borderColor||'#d1d5db'}`,borderRadius:block.borderRadius||0,background:block.backgroundColor==='transparent'?'transparent':block.backgroundColor,color:block.color,fontFamily:block.fontFamily||design.fontFamily,fontSize:block.fontSize,fontWeight:block.bold?700:400,fontStyle:block.italic?'italic':'normal',textDecoration:block.underline?'underline':'none',textAlign:block.align,display:'flex',alignItems:block.verticalAlign==='middle'?'center':block.verticalAlign==='bottom'?'flex-end':'flex-start',overflow:'hidden',cursor:isBuilder?'move':'default'}}>
                    {block.type==='image'&&block.imageDataUrl?<img src={block.imageDataUrl} alt="block" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:block.type==='divider'?<div style={{width:'100%',borderTop:`${Math.max(1,block.borderWidth||1)}px solid ${block.color}`}}/>:block.type==='table'?<table style={{width:'100%',height:'100%',borderCollapse:'collapse',fontSize:'inherit'}}><tbody>{(block.tableRows||[]).map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c} style={{border:`1px solid ${block.borderColor}`,padding:4,background:r===0?design.primaryColor:'#fff',color:r===0?'#fff':block.color}}>{cell}</td>)}</tr>)}</tbody></table>:<div style={{width:'100%',whiteSpace:'pre-wrap'}}>{block.text||'Text block'}</div>}
                    {selected&&<span style={{position:'absolute',right:3,top:2,background:design.accentColor,color:'#fff',fontSize:8,padding:'1px 4px',borderRadius:3}}>{block.type}</span>}
                  </div>;
                })}
                {fields.map(field=>{
                  const fSelected=selectedFieldId===field.id;
                  return <div key={field.id} onMouseDown={e=>startDragField(e,field)} onClick={e=>{e.stopPropagation();setSelectedFieldId(field.id);setTab('fields')}} title={field.label}
                    style={{position:'absolute',left:`${field.x*100}%`,top:`${field.y*100}%`,width:`${field.width*100}%`,height:`${field.height*100}%`,boxSizing:'border-box',display:'flex',alignItems:field.verticalAlign==='middle'?'center':field.verticalAlign==='bottom'?'flex-end':'flex-start',justifyContent:field.align==='center'?'center':field.align==='right'?'flex-end':'flex-start',padding:'0 3px',background:'rgba(37,99,235,0.10)',border:fSelected?'2px solid #2563eb':'1.5px dashed #2563eb',color:field.color||'#111827',fontFamily:field.fontFamily,fontSize:field.fontSize,fontWeight:field.bold?700:400,fontStyle:field.italic?'italic':'normal',overflow:'hidden',cursor:'move'}}>
                    <span style={{fontSize:10,fontWeight:700,color:'#1d4ed8',whiteSpace:'nowrap'}}>{field.label}</span>
                    {fSelected&&<span style={{position:'absolute',right:2,top:-18,background:'#2563eb',color:'#fff',fontSize:8,padding:'1px 4px',borderRadius:3,whiteSpace:'nowrap'}}>field · {field.mapsTo}</span>}
                  </div>;
                })}
              </div>
              <div style={{marginTop:8,textAlign:'center',fontSize:11,color:'#64748b'}}>Page {pageIndex+1} of {pages.length} · Drag blocks/fields to position them. Blue dashed boxes = amount fields. Use the right panel for exact layout.</div>
            </div>
          </div>

          <div style={{width:390,overflow:'auto',borderLeft:'1px solid #e5e7eb',background:'#fff'}}>
            {tab==='design'&&<div style={{padding:16}}>
              <h4 style={{margin:'0 0 12px'}}>Branding</h4>
              {['companyName','companySubtitle','companyAddress','companyPhone','companyEmail','companyWebsite','companyGstNumber'].map(k=><DesignerInput key={k} label={k.replace(/^company/,'').replace(/([A-Z])/g,' $1')} value={design[k]} onChange={v=>updateDesign({[k]:v})}/>)}
              <div style={{marginBottom:12}}><span style={{display:'block',fontSize:11,fontWeight:700,marginBottom:5}}>Logo</span><button className="qt-btn-outline" onClick={()=>logoRef.current?.click()}><FiUpload size={12}/> Upload Logo</button><input ref={logoRef} hidden type="file" accept="image/*" onChange={handleLogo}/>{design.logoDataUrl&&<button className="qt-btn-outline" style={{marginLeft:6}} onClick={()=>updateDesign({logoDataUrl:''})}>Remove</button>}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{['primaryColor','secondaryColor','accentColor','textColor','headingColor','backgroundColor'].map(key=><label key={key} style={{fontSize:11,fontWeight:700,color:'#4b5563'}}>{key.replace('Color','')}<input type="color" value={design[key]||'#000000'} onChange={e=>updateDesign({[key]:e.target.value})} style={{display:'block',width:'100%',height:34,marginTop:4}}/></label>)}</div>
              <div style={{marginTop:12}}><DesignerSelect label="Default Font" value={design.fontFamily} onChange={v=>updateDesign({fontFamily:v})}><option>Helvetica</option><option>Times</option><option>Courier</option>{design.fontDataUrl&&<option value={design.fontFamily}>{design.fontFamily} (uploaded)</option>}</DesignerSelect><button className="qt-btn-outline" onClick={()=>fontRef.current?.click()}><FiUpload size={12}/> Upload TTF/OTF</button><input ref={fontRef} hidden type="file" accept=".ttf,.otf,font/ttf,font/otf" onChange={handleFont}/></div>
              <div style={{borderTop:'1px solid #e5e7eb',margin:'14px 0',paddingTop:14}}><h4 style={{margin:'0 0 10px'}}>Document</h4><DesignerSelect label="Template Mode" value={design.mode} onChange={v=>updateDesign({mode:v})}><option value="BUILDER">Builder — fully editable</option><option value="BACKGROUND">Uploaded background + fields</option></DesignerSelect><DesignerSelect label="Orientation" value={design.orientation} onChange={v=>updateDesign({orientation:v})}><option>PORTRAIT</option><option>LANDSCAPE</option></DesignerSelect></div>
            </div>}

            {tab==='pages'&&<div style={{padding:16}}>
              <h4 style={{margin:'0 0 10px'}}>Pages</h4>
              <div style={{display:'flex',gap:6,marginBottom:12}}><button className="qt-btn-primary" onClick={addPage}><FiPlus/> Add Page</button><button className="qt-btn-outline" onClick={duplicatePage}><FiDuplicate/> Duplicate</button><button className="qt-btn-outline" style={{color:'#dc2626'}} onClick={deletePage}><FiTrash2/></button></div>
              <DesignerInput label="Page Name" value={currentPage?.name} onChange={renamePage}/>
              <label style={{display:'block',fontSize:11,fontWeight:700,marginBottom:10}}>Page Background<input type="color" value={currentPage?.backgroundColor||'#ffffff'} onChange={e=>updatePage({backgroundColor:e.target.value})} style={{display:'block',width:'100%',height:34,marginTop:4}}/></label>
              <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,fontWeight:700,marginBottom:10}}><input type="checkbox" checked={currentPage?.headerEnabled!==false} onChange={e=>updatePage({headerEnabled:e.target.checked})}/> Header on this page</label>
              <DesignerInput label="Header Height (0–1)" type="number" min="0.05" max="0.35" step="0.01" value={currentPage?.headerHeight} onChange={v=>updatePage({headerHeight:clamp(v,.05,.35)})}/>
              <DesignerSelect label="Header Layout" value={currentPage?.headerLayout} onChange={v=>updatePage({headerLayout:v})}><option value="logo-left">Logo Left</option><option value="logo-center">Logo Center</option><option value="logo-right">Logo Right</option></DesignerSelect>
              <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,fontWeight:700,marginBottom:10}}><input type="checkbox" checked={currentPage?.footerEnabled!==false} onChange={e=>updatePage({footerEnabled:e.target.checked})}/> Footer on this page</label>
              <DesignerInput label="Footer Height (0–1)" type="number" min="0.05" max="0.25" step="0.01" value={currentPage?.footerHeight} onChange={v=>updatePage({footerHeight:clamp(v,.05,.25)})}/>
              <DesignerSelect label="Footer Layout" value={currentPage?.footerLayout} onChange={v=>updatePage({footerLayout:v})}><option value="contact-left">Contact Left</option><option value="contact-center">Contact Center</option><option value="contact-right">Contact Right</option></DesignerSelect>
              <div style={{marginTop:12,padding:10,background:'#f8fafc',borderRadius:8,fontSize:11,color:'#64748b'}}>Each page has its own blocks, background, header/footer visibility, height and layout. Page 1 and Page 2 can therefore have completely different content.</div>
            </div>}

            {tab==='blocks'&&<div style={{padding:16}}>
              <h4 style={{margin:'0 0 10px'}}>Page {pageIndex+1} Content</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}><button className="qt-btn-outline" onClick={()=>addBlock('text')}><FiType/> Text</button><button className="qt-btn-outline" onClick={()=>addBlock('heading')}><FiFileText/> Heading</button><button className="qt-btn-outline" onClick={()=>addBlock('image')}><FiImage/> Image</button><button className="qt-btn-outline" onClick={()=>addBlock('divider')}><FiMinus/> Divider</button><button className="qt-btn-outline" onClick={()=>addBlock('table')}><FiTable/> Table</button><button className="qt-btn-outline" onClick={()=>addBlock('signature')}><FiFileText/> Signature</button></div>
              <div style={{borderTop:'1px solid #e5e7eb',margin:'15px 0',paddingTop:14}}/><h4 style={{margin:'0 0 8px'}}>Blocks</h4>
              {blocks.length===0&&<div style={{fontSize:12,color:'#6b7280'}}>No blocks on this page.</div>}
              {blocks.map(b=><div key={b.id} onClick={()=>setSelectedId(b.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 7px',marginBottom:5,border:selectedId===b.id?`1px solid ${design.accentColor}`:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer'}}><span style={{flex:1,fontSize:11,fontWeight:700}}>{b.type} — {(b.text||'').slice(0,28)}</span><button className="qt-btn-ghost" onClick={e=>{e.stopPropagation();deleteBlock(b.id)}}><FiTrash2 size={12}/></button></div>)}
            </div>}

            {tab==='fields'&&<div style={{padding:16}}>
              <h4 style={{margin:'0 0 6px'}}>Amount / Merge Fields</h4>
              <div style={{fontSize:11,color:'#64748b',marginBottom:10}}>
                These are the exact spots (blue dashed boxes on the canvas) where a telecaller's typed value
                gets placed on the final PDF — e.g. ERP Pro Plan amount. Drag a box onto the blank space in
                the uploaded template, or type X/Y/Width/Height directly below.
              </div>
              <button className="qt-btn-primary" style={{width:'100%',marginBottom:12}} onClick={addField}><FiPlus size={13}/> Add Field</button>

              <div style={{border:'1px solid #e5e7eb',borderRadius:8,padding:10,marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,marginBottom:6}}>Import fields from JSON</div>
                <textarea value={importText} onChange={e=>{setImportText(e.target.value);setImportError('')}} placeholder='Paste your fields JSON here'
                  style={{width:'100%',minHeight:70,boxSizing:'border-box',border:'1px solid #d1d5db',borderRadius:6,padding:'7px 8px',fontSize:11,fontFamily:'monospace'}}/>
                {importError && <div style={{color:'#b91c1c',fontSize:11,marginTop:4}}>{importError}</div>}
                <button className="qt-btn-outline" style={{width:'100%',marginTop:6}} onClick={importFields} disabled={!importText.trim()}><FiUpload size={12}/> Import (replaces current fields)</button>
              </div>

              <h4 style={{margin:'0 0 8px'}}>Fields on this template ({fields.length})</h4>
              {fields.length===0&&<div style={{fontSize:12,color:'#6b7280'}}>No fields yet — add one or import JSON above.</div>}
              {fields.map(f=><div key={f.id} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 7px',marginBottom:5,border:selectedFieldId===f.id?'1px solid #2563eb':'1px solid #e5e7eb',borderRadius:7}}>
                <span onClick={()=>setSelectedFieldId(f.id)} style={{flex:'1 1 auto',fontSize:11,fontWeight:700,cursor:'pointer'}}>{f.label} <span style={{color:'#9ca3af',fontWeight:400}}>({f.mapsTo})</span></span>
                <input placeholder="Default ₹" value={f.defaultValue||''} onChange={e=>updateField(f.id,{defaultValue:e.target.value})}
                  style={{width:88,border:'1px solid #d1d5db',borderRadius:6,padding:'5px 6px',fontSize:11}}/>
                <button className="qt-btn-ghost" onClick={()=>deleteField(f.id)}><FiTrash2 size={12}/></button>
              </div>)}
            </div>}

            {selectedField&&<div style={{borderTop:'1px solid #e5e7eb',padding:16}}>
              <div style={{display:'flex',alignItems:'center',marginBottom:10}}><h4 style={{margin:0,flex:1}}>Selected Field</h4><button className="qt-btn-ghost" style={{color:'#dc2626'}} onClick={()=>deleteField(selectedField.id)}><FiTrash2 size={13}/></button></div>
              <DesignerInput label="Label (shown to telecaller)" value={selectedField.label} onChange={v=>updateField(selectedField.id,{label:v})}/>
              <DesignerInput label="Field key (mapsTo)" value={selectedField.mapsTo} onChange={v=>updateField(selectedField.id,{mapsTo:v})}/>
              <DesignerInput label="Default value (standard price — telecaller only changes this if the quote differs)" value={selectedField.defaultValue||''} onChange={v=>updateField(selectedField.id,{defaultValue:v})}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                <DesignerInput label="X" type="number" min="0" max="1" step="0.001" value={selectedField.x} onChange={v=>updateField(selectedField.id,{x:clamp(v)})}/>
                <DesignerInput label="Y" type="number" min="0" max="1" step="0.001" value={selectedField.y} onChange={v=>updateField(selectedField.id,{y:clamp(v)})}/>
                <DesignerInput label="Width" type="number" min="0.01" max="1" step="0.001" value={selectedField.width} onChange={v=>updateField(selectedField.id,{width:clamp(v,.01,1)})}/>
                <DesignerInput label="Height" type="number" min="0.005" max="1" step="0.001" value={selectedField.height} onChange={v=>updateField(selectedField.id,{height:clamp(v,.005,1)})}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                <DesignerInput label="Font Size" type="number" min="5" max="48" value={selectedField.fontSize} onChange={v=>updateField(selectedField.id,{fontSize:v})}/>
                <DesignerSelect label="Align" value={selectedField.align} onChange={v=>updateField(selectedField.id,{align:v})}><option>left</option><option>center</option><option>right</option></DesignerSelect>
                <DesignerSelect label="Vertical" value={selectedField.verticalAlign} onChange={v=>updateField(selectedField.id,{verticalAlign:v})}><option>top</option><option>middle</option><option>bottom</option></DesignerSelect>
                <label style={{fontSize:11,fontWeight:700}}>Text Color<input type="color" value={selectedField.color||'#111827'} onChange={e=>updateField(selectedField.id,{color:e.target.value})} style={{display:'block',width:'100%',height:32}}/></label>
              </div>
              <div style={{display:'flex',gap:12,margin:'4px 0 10px',fontSize:11}}>
                <label><input type="checkbox" checked={!!selectedField.bold} onChange={e=>updateField(selectedField.id,{bold:e.target.checked})}/> Bold</label>
                <label><input type="checkbox" checked={!!selectedField.italic} onChange={e=>updateField(selectedField.id,{italic:e.target.checked})}/> Italic</label>
              </div>
            </div>}

            {selectedBlock&&<div style={{borderTop:'1px solid #e5e7eb',padding:16}}>
              <div style={{display:'flex',alignItems:'center',marginBottom:10}}><h4 style={{margin:0,flex:1}}>Selected: {selectedBlock.type}</h4><button className="qt-btn-ghost" onClick={duplicateBlock}><FiCopy size={13}/></button><button className="qt-btn-ghost" style={{color:'#dc2626'}} onClick={()=>deleteBlock(selectedBlock.id)}><FiTrash2 size={13}/></button></div>
              {selectedBlock.type!=='divider'&&selectedBlock.type!=='image'&&selectedBlock.type!=='table'&&<DesignerInput label="Content / placeholders" value={selectedBlock.text} onChange={v=>updateBlock(selectedBlock.id,{text:v})}/>} {selectedBlock.type!=='divider'&&selectedBlock.type!=='image'&&<DesignerSelect label="Auto-fill" value={selectedBlock.mapsTo} onChange={v=>updateBlock(selectedBlock.id,{mapsTo:v})}>{MAPS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</DesignerSelect>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}><DesignerInput label="X" type="number" min="0" max="1" step="0.01" value={selectedBlock.x} onChange={v=>updateBlock(selectedBlock.id,{x:clamp(v)})}/><DesignerInput label="Y" type="number" min="0" max="1" step="0.01" value={selectedBlock.y} onChange={v=>updateBlock(selectedBlock.id,{y:clamp(v)})}/><DesignerInput label="Width" type="number" min="0.01" max="1" step="0.01" value={selectedBlock.width} onChange={v=>updateBlock(selectedBlock.id,{width:clamp(v,.01,1)})}/><DesignerInput label="Height" type="number" min="0.005" max="1" step="0.01" value={selectedBlock.height} onChange={v=>updateBlock(selectedBlock.id,{height:clamp(v,.005,1)})}/></div>
              {selectedBlock.type==='image'&&<><button className="qt-btn-outline" onClick={()=>blockImageRef.current?.click()}><FiUpload size={12}/> Upload Image</button><input ref={blockImageRef} hidden type="file" accept="image/*" onChange={handleBlockImage}/></>}
              {selectedBlock.type==='table'&&<DesignerInput label="Table rows JSON" value={JSON.stringify(selectedBlock.tableRows||[])} onChange={v=>{try{const rows=JSON.parse(v);if(Array.isArray(rows))updateBlock(selectedBlock.id,{tableRows:rows})}catch{}}}/>} 
              {selectedBlock.type!=='image'&&selectedBlock.type!=='divider'&&<><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}><DesignerInput label="Font Size" type="number" min="5" max="48" value={selectedBlock.fontSize} onChange={v=>updateBlock(selectedBlock.id,{fontSize:v})}/><DesignerSelect label="Font" value={selectedBlock.fontFamily} onChange={v=>updateBlock(selectedBlock.id,{fontFamily:v})}><option>Helvetica</option><option>Times</option><option>Courier</option>{design.fontDataUrl&&<option value={design.fontFamily}>{design.fontFamily} (uploaded)</option>}</DesignerSelect><DesignerSelect label="Align" value={selectedBlock.align} onChange={v=>updateBlock(selectedBlock.id,{align:v})}><option>left</option><option>center</option><option>right</option></DesignerSelect><DesignerSelect label="Vertical" value={selectedBlock.verticalAlign} onChange={v=>updateBlock(selectedBlock.id,{verticalAlign:v})}><option>top</option><option>middle</option><option>bottom</option></DesignerSelect></div><div style={{display:'flex',gap:12,margin:'4px 0 10px',fontSize:11}}><label><input type="checkbox" checked={!!selectedBlock.bold} onChange={e=>updateBlock(selectedBlock.id,{bold:e.target.checked})}/> Bold</label><label><input type="checkbox" checked={!!selectedBlock.italic} onChange={e=>updateBlock(selectedBlock.id,{italic:e.target.checked})}/> Italic</label><label><input type="checkbox" checked={!!selectedBlock.underline} onChange={e=>updateBlock(selectedBlock.id,{underline:e.target.checked})}/> Underline</label></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><label style={{fontSize:11,fontWeight:700}}>Text<input type="color" value={selectedBlock.color||'#111827'} onChange={e=>updateBlock(selectedBlock.id,{color:e.target.value})} style={{display:'block',width:'100%',height:32}}/></label><label style={{fontSize:11,fontWeight:700}}>Background<input type="color" value={selectedBlock.backgroundColor==='transparent'?'#ffffff':selectedBlock.backgroundColor} onChange={e=>updateBlock(selectedBlock.id,{backgroundColor:e.target.value})} style={{display:'block',width:'100%',height:32}}/></label></div></>}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationTemplateDesigner;
