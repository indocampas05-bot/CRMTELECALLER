import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './Clients.css';
import {
  Users,
  UserPlus,
  UserCheck,
  Target,
  Building2,
  GraduationCap,
  Landmark,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  Cake,
  Briefcase,
  DollarSign,
  Users as UsersIcon,
  FileText,
  FileSignature,
  FileSpreadsheet,
  File,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Send,
  MessageSquare,
  BookOpen,
  ClipboardList,
  Activity,
  ArrowLeft,
  User,
  PhoneCall,
  Calendar as CalendarIcon,
  Bell,
  MoreVertical,
  Copy,
  RefreshCw,
  Settings2,
  Volume2,
  History,
  ArrowRightLeft,
  Bluetooth,
  BluetoothConnected,
  Smartphone,
  Loader,
  RotateCcw,
  CheckCircle2,
  Save,
  Pencil,
  ChevronDown,
} from "lucide-react";

// ─── ERP-focused mock data ─────────────────────────────────────────────────────
const CLIENTS_DATA = [
  {
    id: 'CL-5268', name: 'ABC Public School', initials: 'AP', status: 'Active Client',
    phone: '+91 98765 43210', email: 'ravi.kumar@abcschool.edu', location: 'Chennai, Tamil Nadu',
    clientId: 'CL-5268', source: 'Website', campaign: 'School ERP - May 2024',
    assigned: 'Arun Kumar', clientSince: '10 May 2024', lastContact: '12 May 2024',
    clientStatus: 'Interested', priority: 'Medium', totalGoals: '--',
    totalCalls: 5, totalSpent: '₹0.00', conversionStage: 2,
    contactPerson: 'Ravi Kumar', designation: 'Principal', industry: 'Education - School',
    annualRevenue: '₹50 - 100 Lakhs', employees: '50-100', dob: '15 Aug 1975',
    address: 'No. 45, Anna Nagar, Chennai, Tamil Nadu - 600040',
    preferredTime: '10:00 AM - 01:00 PM',
    remarks: 'Looking for comprehensive School ERP with fee management and attendance.',
    category: 'School',
    notes: 'Customer is interested in School ERP - Premium Plan. Asked for sum insured details of 10 Lakhs. Need to share benefits and fee module details in next call.\n\nUpdated by Arun Kumar on 12 May 2024 10:30 AM',
    family: [
      { name: 'Sita Kumar', relation: 'Wife', dob: '12 Jan 1988', occupation: 'Doctor' },
      { name: 'Aarav Kumar', relation: 'Son', dob: '05 Mar 2015', occupation: 'Student' },
      { name: 'Ananya Kumar', relation: 'Daughter', dob: '18 Jul 2018', occupation: 'Student' },
    ],
    communication: { calls: 5, emails: 2, whatsapp: 3, sms: 1 },
    activities: [
      { type: 'call', label: 'Outgoing Call', badge: 'Interested', color:'#16a34a', bg:'#dcfce7', desc: 'Discussed about School ERP Premium plan. Customer showed interest and asked for quotation.', date: '12 May 2024', time: '10:30 AM', by: 'Arun Kumar' },
      { type: 'quotation', label: 'Quotation Sent', badge: null, desc: 'School ERP Premium Plan quotation sent via email.', date: '12 May 2024', time: '10:45 AM', by: 'Arun Kumar' },
      { type: 'note', label: 'Note Added', badge: null, desc: 'Customer wants to compare with other plans. Follow up next week.', date: '11 May 2024', time: '04:20 PM', by: 'Arun Kumar' },
      { type: 'call', label: 'Outgoing Call', badge: 'Not Answered', color:'#dc2626', bg:'#fee2e2', desc: 'Called customer, but no response.', date: '11 May 2024', time: '11:15 AM', by: 'Arun Kumar' },
      { type: 'lead', label: 'New Lead Created', badge: null, desc: 'Lead added to the system.', date: '10 May 2024', time: '09:30 AM', by: 'Arun Kumar' },
    ],
    documents: [
      { name: 'School_Agreement.pdf', date: '10 May 2024', type: 'pdf' },
      { name: 'Quotation_Draft.pdf', date: '10 May 2024', type: 'pdf' },
      { name: 'Address_Proof.pdf', date: '10 May 2024', type: 'pdf' },
    ],
    quotations: [
      { id: 'QT-001', product: 'School ERP Basic', amount: '₹1,20,000', date: '12 May 2024', status: 'Sent' },
      { id: 'QT-002', product: 'School ERP Premium', amount: '₹2,50,000', date: '13 May 2024', status: 'Pending' },
    ],
    agreements: [
      { id: 'AG-001', product: 'School ERP Basic', amount: '₹1,20,000', date: '14 May 2024', status: 'Draft' },
    ],
    followUps: [
      { date: '15 May 2024', time: '10:00 AM', type: 'Call Back', note: 'Discuss Premium plan pricing.' },
      { date: '20 May 2024', time: '02:00 PM', type: 'Demo', note: 'Live ERP demo scheduled.' },
    ],
    callHistory: [
      { date: '12 May 2024', time: '10:30 AM', duration: '05:24', outcome: 'Interested', by: 'Arun Kumar' },
      { date: '11 May 2024', time: '11:15 AM', duration: '00:00', outcome: 'Not Answered', by: 'Arun Kumar' },
      { date: '10 May 2024', time: '09:30 AM', duration: '02:10', outcome: 'In Progress', by: 'Arun Kumar' },
    ],
  },
  {
    id: 'CL-5267', name: 'St. John College of Arts', initials: 'SJ', status: 'Active Client',
    phone: '+91 91234 56789', email: 'meena.s@stjohncollege.edu', location: 'Bengaluru, Karnataka',
    clientId: 'CL-5267', source: 'Referral', campaign: 'College ERP - May 2024',
    assigned: 'Priya Sharma', clientSince: '08 May 2024', lastContact: '11 May 2024',
    clientStatus: 'In Progress', priority: 'High', totalGoals: '--',
    totalCalls: 3, totalSpent: '₹0.00', conversionStage: 3,
    contactPerson: 'Dr. Meena Suresh', designation: 'Dean', industry: 'Education - College',
    annualRevenue: '₹1 - 5 Cr', employees: '200-500', dob: '22 Mar 1970',
    address: 'MG Road, Bengaluru, Karnataka - 560001',
    preferredTime: '02:00 PM - 05:00 PM',
    remarks: 'Needs integrated College ERP with student portal and exam management.',
    category: 'College',
    notes: 'Dean is looking for end-to-end College ERP. Specifically interested in exam management module.',
    family: [],
    communication: { calls: 3, emails: 4, whatsapp: 1, sms: 0 },
    activities: [
      { type: 'call', label: 'Outgoing Call', badge: 'Interested', color:'#16a34a', bg:'#dcfce7', desc: 'Discussed about College ERP modules. Very interested in exam management.', date: '11 May 2024', time: '02:30 PM', by: 'Priya Sharma' },
      { type: 'note', label: 'Note Added', badge: null, desc: 'Requested product brochure for all modules.', date: '10 May 2024', time: '10:00 AM', by: 'Priya Sharma' },
    ],
    documents: [
      { name: 'College_Brochure.pdf', date: '09 May 2024', type: 'pdf' },
    ],
    quotations: [
      { id: 'QT-003', product: 'College ERP Enterprise', amount: '₹5,00,000', date: '11 May 2024', status: 'Sent' },
    ],
    agreements: [],
    followUps: [
      { date: '18 May 2024', time: '03:00 PM', type: 'Demo', note: 'Online demo for Dean and IT team.' },
    ],
    callHistory: [
      { date: '11 May 2024', time: '02:30 PM', duration: '08:12', outcome: 'Interested', by: 'Priya Sharma' },
    ],
  },
  {
    id: 'CL-5266', name: 'Delhi Public School', initials: 'DP', status: 'Prospect',
    phone: '+91 99887 66554', email: 'vikram.s@delhipublicschool.edu', location: 'Delhi, NCR',
    clientId: 'CL-5266', source: 'Cold Call', campaign: 'School ERP - Apr 2024',
    assigned: 'Arun Kumar', clientSince: '05 Apr 2024', lastContact: '09 May 2024',
    clientStatus: 'Call Back', priority: 'Low', totalGoals: '--',
    totalCalls: 7, totalSpent: '₹0.00', conversionStage: 1,
    contactPerson: 'Vikram Singh', designation: 'Vice Principal', industry: 'Education - School',
    annualRevenue: '₹50 - 100 Lakhs', employees: '100-200', dob: '10 Jun 1980',
    address: 'Sector 12, Dwarka, Delhi - 110075',
    preferredTime: '08:00 AM - 10:00 AM',
    remarks: 'Interested in fee management and parent communication module.',
    category: 'School',
    notes: 'VP wants to compare pricing with competitors before deciding.',
    family: [],
    communication: { calls: 7, emails: 1, whatsapp: 5, sms: 2 },
    activities: [],
    documents: [],
    quotations: [],
    agreements: [],
    followUps: [],
    callHistory: [],
  },
];

const ALL_CLIENTS = [...CLIENTS_DATA, ...Array.from({length: 12}, (_, i) => ({
  ...CLIENTS_DATA[i % 3],
  id: `CL-${5265 - i}`,
  clientId: `CL-${5265 - i}`,
  name: ['ABC Public School', 'City College', 'Delhi Public School', 'Mumbai University', 'Oakridge School', 'Kristu Jayanti College', 'Bishop Cotton School', 'Bangalore University', 'Chennai Public School', 'St. Xavier\'s College', 'Narayana School', 'Presidency College'][i],
  initials: ['AB','CC','DP','MU','OS','KJ','BC','BU','CP','SX','NS','PC'][i],
  category: ['School','College','School','University','School','College','School','University','School','College','School','College'][i],
  status: ['Active Client','Prospect','Active Client','Converted','Prospect','Active Client','Converted','Prospect','Active Client','Active Client','Prospect','Converted'][i],
  contactPerson: ['Suresh Rajan', 'Kavitha P', 'Mohan Lal', 'Preethi S', 'Arjun T', 'Deepika R', 'Kiran M', 'Anita B', 'Sanjay K', 'Lakshmi N', 'Gopal V', 'Nirmala C'][i],
}))];

const DEFAULT_STAGES = [
  { id: 1, label: 'Lead' },
  { id: 2, label: 'Demo' },
  { id: 3, label: 'Proposal' },
  { id: 4, label: 'Agreement' },
  {id:5,label:'Payment'},
  {id:6,label:'Regularfollow-up'},
];

const PRIORITY_STYLE = { High:{ bg:'#fee2e2',color:'#b91c1c' }, Medium:{ bg:'#fef9c3',color:'#92400e' }, Low:{ bg:'#f0fdf4',color:'#15803d' } };
const STATUS_STYLE   = { 'Active Client':{ bg:'#dcfce7',color:'#15803d' }, 'Prospect':{ bg:'#e0f2fe',color:'#0369a1' }, 'Converted':{ bg:'#ede9fe',color:'#6d28d9' }, 'Inactive':{ bg:'#f1f5f9',color:'#64748b' } };
const CALL_STATUS    = { Interested:{ bg:'#dcfce7',color:'#15803d' }, 'Not Answered':{ bg:'#fee2e2',color:'#b91c1c' }, 'In Progress':{ bg:'#fef9c3',color:'#92400e' }, Converted:{ bg:'#ede9fe',color:'#6d28d9' } };
const ACTIVITY_ICON  = { call: PhoneCall, quotation: FileText, note: File, lead: UserPlus, agreement: FileSignature, email: Mail };
const DOC_ICON       = { pdf: FileText, docx: File, xlsx: FileSpreadsheet };
const PIE_COLORS     = ['#7b1113','#2563eb','#16a34a','#d97706'];
const CATEGORIES     = ['All','School','College','University'];
const STATUSES       = ['All Status','Active Client','Prospect','Converted','Inactive'];
const TABS           = ['Overview','Call History','Notes & Activities','Quotations','Agreements','Documents','Follow Ups','Payments'];

const STAGE_COLORS = ['#64748b','#2563eb','#d97706','#16a34a','#7c3aed','#db2777','#0891b2','#b91c1c'];

// ─── Helper: clean phone number for WhatsApp ───────────────────────────────────
function cleanPhoneForWhatsApp(phone) {
  return phone.replace(/[^0-9]/g, '');
}

// ─── Navigation helpers ────────────────────────────────────────────────────────
const navigateToCallPanel = (client) => {
  window.location.href = `/call-panel?client=${client.id}&phone=${encodeURIComponent(client.phone)}&name=${encodeURIComponent(client.name)}`;
};

const navigateToEmail = (client) => {
  const subject = encodeURIComponent(`Regarding ${client.campaign || 'Our Services'}`);
  const body = encodeURIComponent(`Dear ${client.contactPerson || client.name},\n\nThank you for your interest in our ERP solutions.\n\nBest regards,\nSales Team`);
  window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
};

const navigateToWhatsApp = (client) => {
  const cleanPhone = cleanPhoneForWhatsApp(client.phone);
  let phone = cleanPhone;
  if (phone.startsWith('91') && phone.length === 12) {
    phone = phone;
  } else if (!phone.startsWith('91') && phone.length === 10) {
    phone = '91' + phone;
  }
  const message = encodeURIComponent(`Hi ${client.contactPerson || client.name},\n\nThank you for your interest in our ERP solutions. We would love to discuss further.\n\nBest regards`);
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};

const navigateToQuotation = (client) => {
  window.location.href = `/quotations?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}&contactPerson=${encodeURIComponent(client.contactPerson || '')}&phone=${encodeURIComponent(client.phone)}&email=${encodeURIComponent(client.email)}`;
};

const navigateToAgreement = (client) => {
  window.location.href = `/agreements?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}&contactPerson=${encodeURIComponent(client.contactPerson || '')}&phone=${encodeURIComponent(client.phone)}&email=${encodeURIComponent(client.email)}`;
};

const navigateToInvoice = (client) => {
  window.location.href = `/invoices?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}&contactPerson=${encodeURIComponent(client.contactPerson || '')}`;
};

const navigateToPayment = (client) => {
  window.location.href = `/payments?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}&contactPerson=${encodeURIComponent(client.contactPerson || '')}`;
};

const navigateToSchedule = (client) => {
  window.location.href = `/schedule?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}&contactPerson=${encodeURIComponent(client.contactPerson || '')}`;
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ initials, name, size = 60 }) => {
  const COLORS = ['#7b1113','#2563eb','#7c3aed','#d97706','#16a34a','#0891b2','#db2777'];
  const bg = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:size*0.33, flexShrink:0, fontFamily:'Public Sans,sans-serif' }}>
      {initials}
    </div>
  );
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`cl-toast cl-toast-${type}`} onClick={onClose}>
    {msg}
  </div>
);

// ─── Edit Client Page (Full Page View) ────────────────────────────────────────
function EditClientPage({ client, stages, onSave, onCancel, showToast }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    contactPerson: client?.contactPerson || '',
    location: client?.location || '',
    designation: client?.designation || '',
    category: client?.category || 'School',
    status: client?.status || 'Prospect',
    priority: client?.priority || 'Medium',
    conversionStage: client?.conversionStage || 1,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    onSave({ ...client, ...formData });
    showToast('Client updated successfully!');
  };

  return (
    <div className="cl-edit-page">
      <div className="cl-edit-header">
        <button className="cl-edit-back" onClick={onCancel}>
          <ArrowLeft size={20} /> Back to Clients
        </button>
        <h1 className="cl-page-title">Edit Client</h1>
      </div>

      <div className="cl-edit-card">
        <div className="cl-edit-form-grid">
          <div className="form-group">
            <label>Organization Name <span className="cl-required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Organization Name"
            />
          </div>
          <div className="form-group">
            <label>Phone <span className="cl-required">*</span></label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="Phone Number"
            />
          </div>
          <div className="form-group">
            <label>Email <span className="cl-required">*</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="Email Address"
            />
          </div>
          <div className="form-group">
            <label>Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={e => handleChange('contactPerson', e.target.value)}
              placeholder="Contact Person"
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="Location"
            />
          </div>
          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={e => handleChange('designation', e.target.value)}
              placeholder="Designation"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={formData.category} onChange={e => handleChange('category', e.target.value)}>
              {['School','College','University'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status} onChange={e => handleChange('status', e.target.value)}>
              {['Active Client','Prospect','Converted','Inactive'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={formData.priority} onChange={e => handleChange('priority', e.target.value)}>
              {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Conversion Stage Selector */}
        <div className="cl-edit-stage-section">
          <label className="cl-edit-stage-label">Conversion Stage</label>
          <div className="cl-edit-stage-buttons">
            {stages.map((stage, i) => {
              const sc = STAGE_COLORS[i % STAGE_COLORS.length];
              const isSelected = formData.conversionStage === i + 1;
              const isPast = i + 1 < formData.conversionStage;
              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    onClick={() => handleChange('conversionStage', i + 1)}
                    className={`cl-stage-btn ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                    style={{
                      borderColor: isSelected ? sc : isPast ? '#16a34a' : '#e5e7eb',
                      background: isSelected ? sc + '18' : isPast ? '#f0fdf4' : '#fff',
                      color: isSelected ? sc : isPast ? '#15803d' : '#64748b',
                    }}
                  >
                    <span className="cl-stage-number" style={{
                      background: isSelected ? sc : isPast ? '#16a34a' : '#e5e7eb',
                      color: isSelected || isPast ? '#fff' : '#9ca3af',
                    }}>
                      {isPast && !isSelected ? <CheckCircle size={14} /> : i + 1}
                    </span>
                    <span className="cl-stage-label-text">{stage.label}</span>
                  </button>
                  {i < stages.length - 1 && (
                    <div className={`cl-stage-connector ${i + 1 < formData.conversionStage ? 'completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="cl-edit-stage-hint">
            Click a stage to set it as the client's current conversion stage.
          </div>
        </div>

        <div className="cl-edit-actions">
          <button className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            <Save size={16} /> Update Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stage Manager Modal ──────────────────────────────────────────────────────
function StageManagerModal({ stages, setStages, onClose, showToast }) {
  const [editingStage, setEditingStage] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [editLabel, setEditLabel] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) { showToast('Stage name is required', 'error'); return; }
    if (stages.some(s => s.label.toLowerCase() === newLabel.trim().toLowerCase())) {
      showToast('Stage with this name already exists', 'error'); return;
    }
    const newId = stages.length > 0 ? Math.max(...stages.map(s => s.id)) + 1 : 1;
    setStages([...stages, { id: newId, label: newLabel.trim() }]);
    setNewLabel('');
    showToast('Stage added successfully!');
  };

  const handleEdit = (stage) => {
    if (!editLabel.trim()) { showToast('Stage name is required', 'error'); return; }
    if (stages.some(s => s.id !== stage.id && s.label.toLowerCase() === editLabel.trim().toLowerCase())) {
      showToast('Stage with this name already exists', 'error'); return;
    }
    setStages(stages.map(s => s.id === stage.id ? { ...s, label: editLabel.trim() } : s));
    setEditingStage(null);
    setEditLabel('');
    showToast('Stage updated successfully!');
  };

  const handleDelete = (stage) => {
    if (stages.length <= 1) { showToast('At least one stage is required', 'error'); return; }
    if (window.confirm(`Delete stage "${stage.label}"? Clients on this stage will be moved to the first stage.`)) {
      setStages(stages.filter(s => s.id !== stage.id));
      showToast(`Stage "${stage.label}" deleted`, 'info');
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newArr = [...stages];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setStages(newArr);
  };

  const handleMoveDown = (index) => {
    if (index === stages.length - 1) return;
    const newArr = [...stages];
    [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
    setStages(newArr);
  };

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-box cl-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="cl-modal-header">
          <span className="cl-modal-title">Manage Conversion Stages</span>
          <button className="cl-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="cl-modal-body">
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            Add, edit, delete, or reorder conversion stages. The order defines the pipeline flow.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="New stage name..."
              style={{
                flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
                fontSize: 14, outline: 'none', fontFamily: 'inherit'
              }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: '8px 16px', background: '#7b1113', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit'
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: STAGE_COLORS[index % STAGE_COLORS.length],
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0
                  }}
                >
                  {index + 1}
                </div>
                {editingStage === stage.id ? (
                  <input
                    autoFocus
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEdit(stage);
                      if (e.key === 'Escape') setEditingStage(null);
                    }}
                    style={{
                      flex: 1, padding: '6px 10px', border: '1px solid #7b1113', borderRadius: 6,
                      fontSize: 14, outline: 'none', fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{stage.label}</span>
                )}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {editingStage === stage.id ? (
                    <>
                      <button
                        onClick={() => handleEdit(stage)}
                        title="Save"
                        style={{
                          padding: 6, background: '#16a34a', color: '#fff', border: 'none',
                          borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => setEditingStage(null)}
                        title="Cancel"
                        style={{
                          padding: 6, background: '#64748b', color: '#fff', border: 'none',
                          borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                        style={{
                          padding: 6, background: index === 0 ? '#e5e7eb' : '#f1f5f9', color: index === 0 ? '#9ca3af' : '#475569',
                          border: '1px solid #e5e7eb', borderRadius: 6, cursor: index === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center'
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === stages.length - 1}
                        title="Move Down"
                        style={{
                          padding: 6, background: index === stages.length - 1 ? '#e5e7eb' : '#f1f5f9',
                          color: index === stages.length - 1 ? '#9ca3af' : '#475569',
                          border: '1px solid #e5e7eb', borderRadius: 6,
                          cursor: index === stages.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center'
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => { setEditingStage(stage.id); setEditLabel(stage.label); }}
                        title="Edit"
                        style={{
                          padding: 6, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd',
                          borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(stage)}
                        title="Delete"
                        style={{
                          padding: 6, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca',
                          borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions Dropdown ────────────────────────────────────────────────────
function QuickActionsDropdown({ client, onClose, showToast }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const actions = [
    { 
      label: 'Call Now', 
      icon: <Phone size={15} />, 
      color: '#2563eb', 
      bg: '#e0f2fe', 
      onClick: () => navigateToCallPanel(client) 
    },
    { 
      label: 'Send Email', 
      icon: <Mail size={15} />, 
      color: '#0891b2', 
      bg: '#ecfeff', 
      onClick: () => navigateToEmail(client) 
    },
    { 
      label: 'Send WhatsApp', 
      icon: <MessageCircle size={15} />, 
      color: '#16a34a', 
      bg: '#dcfce7', 
      onClick: () => navigateToWhatsApp(client) 
    },
    { 
      label: 'Create Quotation', 
      icon: <FileText size={15} />, 
      color: '#d97706', 
      bg: '#fef9c3', 
      onClick: () => navigateToQuotation(client) 
    },
    { 
      label: 'Create Agreement', 
      icon: <FileSignature size={15} />, 
      color: '#7c3aed', 
      bg: '#ede9fe', 
      onClick: () => navigateToAgreement(client) 
    },
    { 
      label: 'Create Invoice', 
      icon: <FileSpreadsheet size={15} />, 
      color: '#dc2626', 
      bg: '#fee2e2', 
      onClick: () => navigateToInvoice(client) 
    },
    { 
      label: 'Record Payment', 
      icon: <DollarSign size={15} />, 
      color: '#16a34a', 
      bg: '#dcfce7', 
      onClick: () => navigateToPayment(client) 
    },
    { 
      label: 'Schedule Meeting', 
      icon: <Calendar size={15} />, 
      color: '#7c3aed', 
      bg: '#ede9fe', 
      onClick: () => navigateToSchedule(client) 
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', right: 0, top: '100%', zIndex: 1000,
        background: '#fff', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb', padding: 6, minWidth: 200, marginTop: 4
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => {
            a.onClick();
            onClose();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '9px 12px', border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 600,
            color: '#1a1a2e', fontFamily: 'inherit', textAlign: 'left',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f7'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{
            width: 30, height: 30, borderRadius: 8, background: a.bg, color: a.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {a.icon}
          </span>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Conversion Stage Selector (inline in table) ──────────────────────────────
function StageSelector({ client, stages, clients, setClients, showToast }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentStageIndex = client.conversionStage - 1;
  const currentStage = stages[currentStageIndex];
  const stageColor = STAGE_COLORS[currentStageIndex % STAGE_COLORS.length];

  const handleSelect = (index) => {
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, conversionStage: index + 1 } : c));
    setOpen(false);
    showToast(`${client.name} moved to "${stages[index].label}"`);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
          background: stageColor + '18', color: stageColor, border: `1px solid ${stageColor}40`,
          borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
          fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap'
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: stageColor, flexShrink: 0
        }} />
        {currentStage ? currentStage.label : `Stage ${client.conversionStage}`}
        <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', left: 0, top: '100%', zIndex: 999,
          background: '#fff', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', padding: 6, minWidth: 180, marginTop: 4
        }}>
          {stages.map((stage, i) => {
            const sc = STAGE_COLORS[i % STAGE_COLORS.length];
            const isActive = i === currentStageIndex;
            return (
              <button
                key={stage.id}
                onClick={() => handleSelect(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 12px', border: 'none',
                  background: isActive ? sc + '15' : 'transparent',
                  cursor: 'pointer', borderRadius: 6, fontSize: 13,
                  fontWeight: isActive ? 700 : 500, color: isActive ? sc : '#374151',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s'
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f5f5f7'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', background: isActive ? sc : '#f1f5f9',
                  color: isActive ? '#fff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0
                }}>
                  {i + 1}
                </span>
                {stage.label}
                {isActive && <CheckCircle size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Client Detail View ────────────────────────────────────────────────────────
function ClientDetail({ client, stages, onBack, onEdit, showToast }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [actFilter, setActFilter] = useState('All Activities');
  const [showNote, setShowNote]   = useState(false);
  const [noteText, setNoteText]   = useState('');
  const [showCall, setShowCall]   = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showWA, setShowWA]       = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showAgree, setShowAgree] = useState(false);
  const [showFU, setShowFU]       = useState(false);
  const [fuDate, setFuDate]       = useState('');
  const [fuTime, setFuTime]       = useState('');
  const [fuNote, setFuNote]       = useState('');
  const [fuType, setFuType]       = useState('Call Back');
  const [emailTo, setEmailTo]     = useState(client.email);
  const [emailSub, setEmailSub]   = useState(`Regarding ${client.campaign}`);
  const [emailBody, setEmailBody] = useState(`Dear ${client.contactPerson || client.name},\n\nThank you for your interest in our ERP solutions.\n\nBest regards,\nArun Kumar`);
  const [waMessage, setWaMessage] = useState(`Hi ${client.contactPerson || client.name},\n\nThank you for your interest in our ERP solutions. We would love to discuss further.\n\nBest regards`);

  const catColor = { School:'#7b1113', College:'#2563eb', University:'#7c3aed' };

  return (
    <div className="cl-detail">
      {/* Modals */}
      {showNote && (
        <div className="cl-modal-overlay" onClick={() => setShowNote(false)}>
          <div className="cl-modal-box" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Add Note</span>
              <button className="cl-modal-close" onClick={() => setShowNote(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div className="form-group">
                <label>Note</label>
                <textarea rows={5} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Write your note here…" />
              </div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowNote(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => { showToast('Note added successfully!'); setShowNote(false); setNoteText(''); }}>
                  <File size={16} /> Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCall && (
        <div className="cl-modal-overlay" onClick={() => setShowCall(false)}>
          <div className="cl-modal-box" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Call Now</span>
              <button className="cl-modal-close" onClick={() => setShowCall(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div style={{textAlign:'center',padding:'16px 0'}}>
                <Avatar initials={client.initials} name={client.name} size={64} />
                <div style={{fontSize:18,fontWeight:800,marginTop:12}}>{client.name}</div>
                <div style={{fontSize:14,color:'#4a4a6a',margin:'4px 0 20px'}}>{client.phone}</div>
                <button className="btn-primary" style={{width:'100%',fontSize:15,padding:12}} onClick={() => navigateToCallPanel(client)}>
                  <Phone size={18} /> Navigate to Call Panel & Start Call
                </button>
                <div style={{fontSize:12,color:'#64748b',marginTop:10}}>You will be redirected to the Call Panel to make the call.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmail && (
        <div className="cl-modal-overlay" onClick={() => setShowEmail(false)}>
          <div className="cl-modal-box cl-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Send Email</span>
              <button className="cl-modal-close" onClick={() => setShowEmail(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div className="form-group"><label>To</label><input value={emailTo} onChange={e=>setEmailTo(e.target.value)} /></div>
              <div className="form-group"><label>Subject</label><input value={emailSub} onChange={e=>setEmailSub(e.target.value)} /></div>
              <div className="form-group"><label>Message</label><textarea rows={6} value={emailBody} onChange={e=>setEmailBody(e.target.value)} /></div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowEmail(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => navigateToEmail(client)}>
                  <Send size={16} /> Send Email Now
                </button>
              </div>
              <div style={{fontSize:12,color:'#64748b',marginTop:8}}>This will open your default email client with the details pre-filled.</div>
            </div>
          </div>
        </div>
      )}

      {showWA && (
        <div className="cl-modal-overlay" onClick={() => setShowWA(false)}>
          <div className="cl-modal-box" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Send WhatsApp</span>
              <button className="cl-modal-close" onClick={() => setShowWA(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div style={{marginBottom:12}}>
                <div style={{fontSize:13,color:'#64748b',marginBottom:6}}>Sending to: <strong>{client.phone}</strong></div>
              </div>
              <div className="form-group"><label>Message</label><textarea rows={5} value={waMessage} onChange={e=>setWaMessage(e.target.value)} placeholder="Type your WhatsApp message…" /></div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowWA(false)}>Cancel</button>
                <button className="btn-primary" style={{background:'#16a34a'}} onClick={() => navigateToWhatsApp(client)}>
                  <MessageCircle size={16} /> Open WhatsApp & Send
                </button>
              </div>
              <div style={{fontSize:12,color:'#64748b',marginTop:8}}>WhatsApp Web will open with this message ready to send to {client.contactPerson || client.name}.</div>
            </div>
          </div>
        </div>
      )}

      {showQuote && (
        <div className="cl-modal-overlay" onClick={() => setShowQuote(false)}>
          <div className="cl-modal-box cl-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Create Quotation</span>
              <button className="cl-modal-close" onClick={() => setShowQuote(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div style={{
                padding: 16, background: '#e0f2fe', borderRadius: 10, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#0369a1'
              }}>
                <Info size={18} />
                You will be redirected to the Quotation page to create a quotation for <strong>{client.name}</strong>.
              </div>
              <div className="form-group"><label>Organization</label><input value={client.name} readOnly /></div>
              <div className="form-group"><label>Contact Person</label><input value={client.contactPerson} readOnly /></div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowQuote(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => navigateToQuotation(client)}>
                  <ArrowRightLeft size={16} /> Go to Quotation Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAgree && (
        <div className="cl-modal-overlay" onClick={() => setShowAgree(false)}>
          <div className="cl-modal-box cl-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Create Agreement</span>
              <button className="cl-modal-close" onClick={() => setShowAgree(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div style={{
                padding: 16, background: '#ede9fe', borderRadius: 10, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#6d28d9'
              }}>
                <Info size={18} />
                You will be redirected to the Agreement page to create an agreement for <strong>{client.name}</strong>.
              </div>
              <div className="form-group"><label>Organization</label><input value={client.name} readOnly /></div>
              <div className="form-group"><label>Contact Person</label><input value={client.contactPerson} readOnly /></div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowAgree(false)}>Cancel</button>
                <button className="btn-primary" style={{background:'#7c3aed'}} onClick={() => navigateToAgreement(client)}>
                  <ArrowRightLeft size={16} /> Go to Agreement Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFU && (
        <div className="cl-modal-overlay" onClick={() => setShowFU(false)}>
          <div className="cl-modal-box" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <span className="cl-modal-title">Schedule Follow Up</span>
              <button className="cl-modal-close" onClick={() => setShowFU(false)}><X size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div className="form-group"><label>Type</label>
                <select value={fuType} onChange={e=>setFuType(e.target.value)}>
                  {['Call Back','Demo','Meeting','Send Quotation','Other'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div className="form-group"><label>Date</label><input type="date" value={fuDate} onChange={e=>setFuDate(e.target.value)} /></div>
                <div className="form-group"><label>Time</label><input type="time" value={fuTime} onChange={e=>setFuTime(e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Note</label><textarea rows={3} value={fuNote} onChange={e=>setFuNote(e.target.value)} placeholder="Describe the follow-up…" /></div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowFU(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => { if(!fuDate||!fuTime){alert('Pick date & time'); return;} showToast(`Follow-up scheduled for ${fuDate} at ${fuTime}`); setShowFU(false); }}>
                  <Calendar size={16} /> Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="cl-detail-header">
        <div>
          <h1 className="cl-page-title">Client Details</h1>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-outline" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Clients
          </button>
          <button className="btn-primary" onClick={() => onEdit(client)}>
            <Edit size={16} /> Edit Client
          </button>
        </div>
      </div>

      {/* Profile card - shortened for brevity, same as before */}
      <div className="cl-profile-card">
        <div className="cl-profile-left">
          <Avatar initials={client.initials} name={client.name} size={72} />
          <div className="cl-profile-info">
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span className="cl-profile-name">{client.name}</span>
              <span className="cl-status-badge" style={STATUS_STYLE[client.status]}>{client.status}</span>
              <span className="cl-cat-badge" style={{background: catColor[client.category]+'22', color: catColor[client.category]}}>{client.category}</span>
            </div>
            <div className="cl-profile-row"><Phone size={14} /><span>{client.phone}</span></div>
            <div className="cl-profile-row"><Mail size={14} /><span>{client.email}</span></div>
            <div className="cl-profile-row"><MapPin size={14} /><span>{client.location}</span></div>
          </div>
        </div>

        <div className="cl-profile-meta">
          {[['Client ID',client.clientId],['Source',client.source],['Campaign',client.campaign],['Client Since',client.clientSince],['Last Contact',client.lastContact]].map(([k,v])=>(
            <div key={k} className="cl-meta-row"><span className="cl-meta-key">{k}</span><span className="cl-meta-val">{v}</span></div>
          ))}
        </div>

        <div className="cl-profile-status">
          {[['Client Status', <span className="cl-status-badge" style={{background:'#dcfce7',color:'#15803d'}}>{client.clientStatus}</span>],
            ['Priority', <span className="cl-status-badge" style={PRIORITY_STYLE[client.priority]}>{client.priority}</span>],
            ['Total Goals', client.totalGoals]].map(([k,v])=>(
            <div key={k} className="cl-meta-row"><span className="cl-meta-key">{k}</span><span className="cl-meta-val">{v}</span></div>
          ))}
        </div>

        <div className="cl-profile-stats">
          {[['Total Calls', <span><Phone size={12} /> {client.totalCalls}</span>],
            ['Total Spent', client.totalSpent]].map(([k,v])=>(
            <div key={k} className="cl-meta-row"><span className="cl-meta-key">{k}</span><span className="cl-meta-val">{v}</span></div>
          ))}
          <div className="cl-meta-row"><span className="cl-meta-key">Conversion Stage</span></div>
          <div className="cl-stage-track">
            {stages.map((s,i)=>(
              <React.Fragment key={s.id}>
                <div className={`cl-stage-node ${i < client.conversionStage ? 'done' : i === client.conversionStage - 1 ? 'current' : ''}`}>
                  <div className="cl-stage-circle">{i+1}</div>
                  <div className="cl-stage-label">{s.label}</div>
                </div>
                {i < stages.length - 1 && <div className={`cl-stage-line ${i < client.conversionStage - 1 ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs and tab content - same as before */}
      <div className="cl-tabs-row">
        {TABS.map(t => {
          const cnt = t==='Quotations'?client.quotations.length:t==='Agreements'?client.agreements.length:t==='Documents'?client.documents.length:t==='Follow Ups'?client.followUps.length:null;
          return (
            <button key={t} className={`cl-tab ${activeTab===t?'active':''}`} onClick={() => setActiveTab(t)}>
              {t}{cnt!==null?` (${cnt})`:''}
            </button>
          );
        })}
      </div>

      <div className="cl-tab-content">
        {/* Overview tab - same as before */}
        {activeTab === 'Overview' && (
          <div className="cl-overview-grid">
            <div className="cl-ov-left">
              <div className="cl-section-card">
                <div className="cl-section-title">Contact Information</div>
                {[['Phone',client.phone,'whatsapp'],['Email',client.email,'email'],['Address',client.address],['Date of Birth',client.dob],['Preferred Time',client.preferredTime]].map(([icon,val,wa],i)=>(
                  <div key={i} className="cl-contact-row">
                    {icon === 'Phone' && <Phone size={14} className="cl-contact-icon" />}
                    {icon === 'Email' && <Mail size={14} className="cl-contact-icon" />}
                    {icon === 'Address' && <MapPin size={14} className="cl-contact-icon" />}
                    {icon === 'Date of Birth' && <Cake size={14} className="cl-contact-icon" />}
                    {icon === 'Preferred Time' && <Clock size={14} className="cl-contact-icon" />}
                    <span className="cl-contact-val">{val}</span>
                    {wa === 'whatsapp' && <button className="cl-wa-btn" onClick={() => navigateToWhatsApp(client)}><MessageCircle size={14} /></button>}
                    {wa === 'email' && <button className="cl-wa-btn" onClick={() => navigateToEmail(client)}><Send size={14} /></button>}
                  </div>
                ))}
              </div>
              <div className="cl-section-card">
                <div className="cl-section-title">Additional Information</div>
                {[['Organization',client.name],['Contact Person',client.contactPerson],['Designation',client.designation],['Industry',client.industry],['Annual Revenue',client.annualRevenue],['No. of Employees',client.employees],['Remarks',client.remarks]].map(([k,v])=>(
                  <div key={k} className="cl-add-row">
                    <div className="cl-add-key">{k}</div>
                    <div className="cl-add-val">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cl-ov-centre">
              <div className="cl-section-card">
                <div className="cl-act-header">
                  <span className="cl-section-title">Recent Activities</span>
                  <select className="cl-act-filter" value={actFilter} onChange={e=>setActFilter(e.target.value)}>
                    {['All Activities','Calls','Notes','Quotations','Agreements'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                {client.activities.filter(a => actFilter==='All Activities' || (actFilter==='Calls'&&a.type==='call') || (actFilter==='Notes'&&a.type==='note') || (actFilter==='Quotations'&&a.type==='quotation')).map((a,i)=>{
                  const Icon = ACTIVITY_ICON[a.type] || File;
                  return (
                    <div key={i} className="cl-activity-row">
                      <div className="cl-act-icon-wrap" style={{background: a.bg||'#f5f5f7'}}><Icon size={18} /></div>
                      <div className="cl-act-body">
                        <div className="cl-act-top">
                          <span className="cl-act-label">{a.label}</span>
                          {a.badge && <span className="cl-act-badge" style={{background:a.bg,color:a.color}}>{a.badge}</span>}
                        </div>
                        <div className="cl-act-desc">{a.desc}</div>
                      </div>
                      <div className="cl-act-meta">
                        <span className="cl-act-date">{a.date}</span>
                        <span className="cl-act-time">{a.time}</span>
                        <span className="cl-act-by">{a.by}</span>
                      </div>
                    </div>
                  );
                })}
                <button className="cl-view-all-link">View All Activities</button>
              </div>

              <div className="cl-section-card">
                <div className="cl-section-title">Communication History</div>
                {[['Calls Made',client.communication.calls, Phone],['Emails Sent',client.communication.emails, Mail],['WhatsApp Messages',client.communication.whatsapp, MessageCircle],['SMS Sent',client.communication.sms, Smartphone]].map(([label,count,Icon])=>(
                  <div key={label} className="cl-comm-row">
                    <span><Icon size={14} /> {label}</span>
                    <span className="cl-comm-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cl-ov-right">
              <div className="cl-section-card">
                <div className="cl-section-title">Quick Actions</div>
                <div className="cl-qa-grid">
                  <button className="cl-qa-btn cl-qa-blue" onClick={() => navigateToCallPanel(client)}><Phone size={14} /> Call Now</button>
                  <button className="cl-qa-btn cl-qa-teal" onClick={() => navigateToEmail(client)}><Mail size={14} /> Send Email</button>
                  <button className="cl-qa-btn cl-qa-green" onClick={() => navigateToWhatsApp(client)}><MessageCircle size={14} /> Send WhatsApp</button>
                  <button className="cl-qa-btn cl-qa-orange" onClick={() => navigateToQuotation(client)}><FileText size={14} /> Create Quotation</button>
                  <button className="cl-qa-btn cl-qa-purple" onClick={() => navigateToAgreement(client)}><FileSignature size={14} /> Create Agreement</button>
                  <button className="cl-qa-btn cl-qa-red" onClick={()=>setShowFU(true)}><Calendar size={14} /> Schedule Follow Up</button>
                </div>
                <button className="cl-add-note-btn" onClick={()=>setShowNote(true)}>
                  <File size={16} /> Add Note
                </button>
              </div>

              <div className="cl-section-card">
                <div className="cl-section-title">Notes</div>
                <p className="cl-notes-text">{client.notes}</p>
                <button className="cl-view-all-link" onClick={()=>setActiveTab('Notes & Activities')}>View All Notes</button>
              </div>

              <div className="cl-section-card">
                <div className="cl-section-title">Documents</div>
                {client.documents.map((d,i)=>(
                  <div key={i} className="cl-doc-row">
                    <span>
                      {d.type === 'pdf' ? <FileText size={14} /> : <File size={14} />}
                      {' '}{d.name}
                    </span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span className="cl-doc-date">{d.date}</span>
                      <button className="cl-doc-dl" onClick={()=>showToast(`Downloading ${d.name}…`,'info')}>
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {client.documents.length === 0 && <div className="cl-empty">No documents yet.</div>}
                <button className="cl-view-all-link" onClick={()=>setActiveTab('Documents')}>View All Documents</button>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs - Call History, Notes & Activities, Quotations, Agreements, Documents, Follow Ups, Payments */}
        {activeTab === 'Call History' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Call History</span>
              <button className="btn-primary" onClick={() => navigateToCallPanel(client)}>
                <Phone size={16} /> Call Now
              </button>
            </div>
            {client.callHistory.length === 0
              ? <div className="cl-empty">No call history yet.</div>
              : <table className="cl-generic-table">
                  <thead><tr><th>Date</th><th>Time</th><th>Duration</th><th>Outcome</th><th>Agent</th></tr></thead>
                  <tbody>{client.callHistory.map((c,i)=>(
                    <tr key={i}>
                      <td>{c.date}</td><td>{c.time}</td><td>{c.duration}</td>
                      <td><span className="cl-status-badge" style={CALL_STATUS[c.outcome]||{}}>{c.outcome}</span></td>
                      <td>{c.by}</td>
                    </tr>
                  ))}</tbody>
                </table>
            }
          </div>
        )}

        {activeTab === 'Notes & Activities' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Notes & Activities</span>
              <button className="btn-primary" onClick={()=>setShowNote(true)}>
                <Plus size={16} /> Add Note
              </button>
            </div>
            {client.activities.map((a,i)=>{
              const Icon = ACTIVITY_ICON[a.type] || File;
              return (
                <div key={i} className="cl-activity-row">
                  <div className="cl-act-icon-wrap" style={{background:a.bg||'#f5f5f7'}}><Icon size={18} /></div>
                  <div className="cl-act-body">
                    <div className="cl-act-top">
                      <span className="cl-act-label">{a.label}</span>
                      {a.badge && <span className="cl-act-badge" style={{background:a.bg,color:a.color}}>{a.badge}</span>}
                    </div>
                    <div className="cl-act-desc">{a.desc}</div>
                  </div>
                  <div className="cl-act-meta">
                    <span className="cl-act-date">{a.date}</span>
                    <span className="cl-act-time">{a.time}</span>
                    <span className="cl-act-by">{a.by}</span>
                  </div>
                </div>
              );
            })}
            {client.activities.length === 0 && <div className="cl-empty">No activities yet.</div>}
          </div>
        )}

        {activeTab === 'Quotations' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Quotations</span>
              <button className="btn-primary" onClick={() => navigateToQuotation(client)}>
                <Plus size={16} /> Create Quotation
              </button>
            </div>
            {client.quotations.length === 0
              ? <div className="cl-empty">No quotations yet.</div>
              : <table className="cl-generic-table">
                  <thead><tr><th>ID</th><th>Product</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{client.quotations.map((q,i)=>(
                    <tr key={i}>
                      <td className="cl-id-cell">{q.id}</td><td>{q.product}</td><td>{q.amount}</td><td>{q.date}</td>
                      <td><span className="cl-status-badge" style={{background:'#e0f2fe',color:'#0369a1'}}>{q.status}</span></td>
                      <td><button className="cl-act-sm" onClick={()=>showToast('Downloading quotation…','info')}><Download size={14} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
            }
          </div>
        )}

        {activeTab === 'Agreements' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Agreements</span>
              <button className="btn-primary" onClick={() => navigateToAgreement(client)}>
                <Plus size={16} /> Create Agreement
              </button>
            </div>
            {client.agreements.length === 0
              ? <div className="cl-empty">No agreements yet.</div>
              : <table className="cl-generic-table">
                  <thead><tr><th>ID</th><th>Product</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{client.agreements.map((a,i)=>(
                    <tr key={i}>
                      <td className="cl-id-cell">{a.id}</td><td>{a.product}</td><td>{a.amount}</td><td>{a.date}</td>
                      <td><span className="cl-status-badge" style={{background:'#fef9c3',color:'#92400e'}}>{a.status}</span></td>
                      <td><button className="cl-act-sm" onClick={()=>showToast('Downloading agreement…','info')}><Download size={14} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
            }
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Documents</span>
              <button className="btn-primary" onClick={()=>showToast('Upload feature coming soon.','info')}>
                <Upload size={16} /> Upload
              </button>
            </div>
            {client.documents.length === 0
              ? <div className="cl-empty">No documents uploaded yet.</div>
              : client.documents.map((d,i)=>(
                <div key={i} className="cl-doc-row cl-doc-row-lg">
                  <span>
                    {d.type === 'pdf' ? <FileText size={14} /> : <File size={14} />}
                    {' '}{d.name}
                  </span>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span className="cl-doc-date">{d.date}</span>
                    <button className="cl-doc-dl" onClick={()=>showToast(`Downloading ${d.name}…`,'info')}>
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Follow Ups' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Follow Ups</span>
              <button className="btn-primary" onClick={()=>setShowFU(true)}>
                <Plus size={16} /> Schedule Follow Up
              </button>
            </div>
            {client.followUps.length === 0
              ? <div className="cl-empty">No follow-ups scheduled.</div>
              : client.followUps.map((f,i)=>(
                <div key={i} className="cl-fu-item">
                  <div className="cl-fu-top">
                    <span className="cl-fu-type">{f.type}</span>
                    <span className="cl-fu-date"><Calendar size={12} /> {f.date} at {f.time}</span>
                  </div>
                  <div className="cl-fu-note"><File size={12} /> {f.note}</div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Payments' && (
          <div className="cl-section-card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span className="cl-section-title">Payments</span>
              <button className="btn-primary" onClick={() => navigateToPayment(client)}>
                <Plus size={16} /> Add Payment
              </button>
            </div>
            <div className="cl-empty">No payment records found.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Client Modal ──────────────────────────────────────────────────────────
const AddClientModal = ({ stages, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', contactPerson: '', location: '', designation: '',
    category: 'School', status: 'Prospect', priority: 'Medium', assigned: 'Arun Kumar',
    conversionStage: 1,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    onSave(formData);
    showToast('Client added successfully!');
    onClose();
  };

  return (
    <div className="cl-modal-overlay" onClick={onClose}>
      <div className="cl-modal-box cl-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="cl-modal-header">
          <span className="cl-modal-title">Add New Client</span>
          <button className="cl-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="cl-modal-body">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[
              ['Organization Name *', 'name', 'text'], ['Phone *', 'phone', 'tel'],
              ['Email *', 'email', 'email'], ['Contact Person', 'contactPerson', 'text'],
              ['Location', 'location', 'text'], ['Designation', 'designation', 'text']
            ].map(([label, key, type]) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input
                  type={type}
                  value={formData[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={label.replace(' *','')}
                />
              </div>
            ))}
            <div className="form-group">
              <label>Category</label>
              <select value={formData.category} onChange={e => handleChange('category', e.target.value)}>
                {['School','College','University'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={e => handleChange('status', e.target.value)}>
                {['Active Client','Prospect','Converted','Inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={formData.priority} onChange={e => handleChange('priority', e.target.value)}>
                {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Conversion Stage
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {stages.map((stage, i) => {
                const sc = STAGE_COLORS[i % STAGE_COLORS.length];
                const isSelected = formData.conversionStage === i + 1;
                return (
                  <React.Fragment key={stage.id}>
                    <button
                      type="button"
                      onClick={() => handleChange('conversionStage', i + 1)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', border: isSelected ? `2px solid ${sc}` : '2px solid #e5e7eb',
                        background: isSelected ? sc + '18' : '#fff',
                        color: isSelected ? sc : '#64748b',
                        borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: isSelected ? 700 : 500,
                        fontFamily: 'inherit', transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: isSelected ? sc : '#e5e7eb',
                        color: isSelected ? '#fff' : '#9ca3af',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0
                      }}>
                        {i + 1}
                      </span>
                      <span>{stage.label}</span>
                    </button>
                    {i < stages.length - 1 && (
                      <div style={{ width: 32, height: 2, flexShrink: 0, background: '#e5e7eb', margin: '0 -1px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="form-actions" style={{marginTop:20}}>
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              <Plus size={16} /> Add Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Clients List View ─────────────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients]       = useState(ALL_CLIENTS);
  const [stages, setStages]         = useState(DEFAULT_STAGES);
  const [search,  setSearch]        = useState('');
  const [catFilter, setCatFilter]   = useState('All');
  const [statusFilter, setStatus]   = useState('All Status');
  const [selectedClient, setSelected] = useState(null);
  const [editClient,  setEditClient]  = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [showStageManager, setShowStageManager] = useState(false);
  const [toast, setToast]             = useState(null);
  const [page, setPage]               = useState(1);
  const [openQA, setOpenQA]           = useState(null);
  const rowsPerPage = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const filtered = useMemo(() => clients.filter(c => {
    const q = search.toLowerCase();
    const mQ = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q);
    const mC = catFilter === 'All' || c.category === catFilter;
    const mS = statusFilter === 'All Status' || c.status === statusFilter;
    return mQ && mC && mS;
  }), [clients, search, catFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((page-1)*rowsPerPage, page*rowsPerPage);

  useEffect(() => { setPage(1); }, [search, catFilter, statusFilter]);

  const handleViewClient = (client) => {
    setSelected(client);
  };

  const handleEditClient = (client) => {
    setEditClient(client);
  };

  const handleDeleteClient = (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
      setClients(cs => cs.filter(c => c.id !== client.id));
      showToast(`Client ${client.name} deleted successfully!`, 'info');
    }
  };

  const handleSaveEdit = (updatedClient) => {
    setClients(cs => cs.map(c => c.id === updatedClient.id ? updatedClient : c));
    setEditClient(null);
  };

  const handleAddClient = (formData) => {
    const newId = `CL-${10000 + clients.length + 1}`;
    const initials = formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newClient = {
      ...CLIENTS_DATA[0],
      ...formData,
      id: newId,
      clientId: newId,
      initials,
      clientSince: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      lastContact: '--',
      clientStatus: 'New',
      totalGoals: '--',
      totalCalls: 0,
      totalSpent: '₹0.00',
      activities: [],
      documents: [],
      quotations: [],
      agreements: [],
      followUps: [],
      callHistory: [],
      family: [],
      communication: { calls: 0, emails: 0, whatsapp: 0, sms: 0 },
      notes: 'New client added.',
      remarks: '',
      industry: '',
      annualRevenue: '',
      employees: '',
      dob: '',
      address: '',
      preferredTime: '',
      source: '',
      campaign: '',
    };
    setClients(cs => [newClient, ...cs]);
  };

  const handleExport = () => {
    const csv = ['ID,Organization,Phone,Email,Contact Person,Category,Status,Stage,Assigned'].concat(
      filtered.map(c => {
        const stageLabel = stages[c.conversionStage - 1]?.label || `Stage ${c.conversionStage}`;
        return `${c.id},${c.name},${c.phone},${c.email},${c.contactPerson},${c.category},${c.status},${stageLabel},${c.assigned}`;
      })
    ).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'clients.csv';
    a.click();
    showToast('Clients exported successfully!');
  };

  if (editClient) {
    return (
      <EditClientPage
        client={editClient}
        stages={stages}
        onSave={handleSaveEdit}
        onCancel={() => setEditClient(null)}
        showToast={showToast}
      />
    );
  }

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        stages={stages}
        onBack={() => setSelected(null)}
        onEdit={() => {
          setEditClient(selectedClient);
          setSelected(null);
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="cl-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {showStageManager && (
        <StageManagerModal
          stages={stages}
          setStages={setStages}
          onClose={() => setShowStageManager(false)}
          showToast={showToast}
        />
      )}

      {showAdd && (
        <AddClientModal
          stages={stages}
          onClose={() => setShowAdd(false)}
          onSave={handleAddClient}
          showToast={showToast}
        />
      )}

      <div className="cl-list-header">
        <div>
          <h1 className="cl-page-title">Clients</h1>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-outline" onClick={() => setShowStageManager(true)} title="Manage Conversion Stages">
            <Settings2 size={16} /> Manage Stages
          </button>
          <button className="btn-outline-primary" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      <div className="cl-stats-bar">
        {[
          {label:'Total Clients', val:clients.length, color:'#7b1113', icon:<Users size={22} />},
          {label:'Active', val:clients.filter(c=>c.status==='Active Client').length, color:'#16a34a', icon:<UserCheck size={22} />},
          {label:'Prospects', val:clients.filter(c=>c.status==='Prospect').length, color:'#2563eb', icon:<Target size={22} />},
          {label:'Converted', val:clients.filter(c=>c.status==='Converted').length, color:'#7c3aed', icon:<CheckCircle2 size={22} />},
          {label:'Schools', val:clients.filter(c=>c.category==='School').length, color:'#7b1113', icon:<Building2 size={22} />},
          {label:'Colleges', val:clients.filter(c=>c.category==='College').length, color:'#d97706', icon:<GraduationCap size={22} />},
          {label:'Universities', val:clients.filter(c=>c.category==='University').length, color:'#0891b2', icon:<Landmark size={22} />},
        ].map(s=>(
          <div key={s.label} className="cl-stat-chip">
            <div className="cl-stat-icon" style={{color:s.color}}>{s.icon}</div>
            <div>
              <div className="cl-stat-val" style={{color:s.color}}>{s.val}</div>
              <div className="cl-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="cl-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="cl-filter-bar">
            <div className="cl-search-wrap">
              <Search size={16} />
              <input
                placeholder="Search by organization, phone, email, contact person…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="cl-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="cl-filter-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Showing {paginated.length} of {filtered.length} clients
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
            <table className="cl-table-full" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
              <thead>
                <tr style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
                  {['Organization','Phone','Email','Contact Person','Category','Status','Conversion Stage','Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
                      borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, idx) => (
                  <tr key={c.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f7'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar initials={c.initials} name={c.name} size={36} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', cursor: 'pointer' }}
                            onClick={() => handleViewClient(c)}
                            onMouseEnter={e => e.target.style.color = '#7b1113'}
                            onMouseLeave={e => e.target.style.color = '#1a1a2e'}
                          >
                            {c.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{c.clientId}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                        {c.phone}
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.email}
                    </td>

                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.contactPerson}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: { School: '#7b1113', College: '#2563eb', University: '#7c3aed' }[c.category] + '18',
                        color: { School: '#7b1113', College: '#2563eb', University: '#7c3aed' }[c.category]
                      }}>
                        {c.category}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span className="cl-status-badge" style={STATUS_STYLE[c.status] || {}}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <StageSelector
                        client={c}
                        stages={stages}
                        clients={clients}
                        setClients={setClients}
                        showToast={showToast}
                      />
                    </td>

                    <td style={{ padding: '10px 14px', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          title="View Details"
                          onClick={() => handleViewClient(c)}
                          style={{
                            padding: 6, background: '#e0f2fe', color: '#0369a1', border: 'none',
                            borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          title="Edit Client"
                          onClick={() => handleEditClient(c)}
                          style={{
                            padding: 6, background: '#fef9c3', color: '#92400e', border: 'none',
                            borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          title="Delete Client"
                          onClick={() => handleDeleteClient(c)}
                          style={{
                            padding: 6, background: '#fee2e2', color: '#b91c1c', border: 'none',
                            borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          title="More Actions"
                          onClick={() => setOpenQA(openQA === c.id ? null : c.id)}
                          style={{
                            padding: 6, background: '#f1f5f9', color: '#475569', border: '1px solid #e5e7eb',
                            borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                      {openQA === c.id && (
                        <QuickActionsDropdown
                          client={c}
                          onClose={() => setOpenQA(null)}
                          showToast={showToast}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>
                      No clients found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', flexShrink: 0
          }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 8,
                  background: page === 1 ? '#f9fafb' : '#fff', color: page === 1 ? '#9ca3af' : '#374151',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit'
                }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    style={{
                      width: 36, height: 36, border: page === pageNum ? 'none' : '1px solid #e5e7eb',
                      borderRadius: 8, background: page === pageNum ? '#7b1113' : '#fff',
                      color: page === pageNum ? '#fff' : '#374151', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 8,
                  background: page === totalPages ? '#f9fafb' : '#fff',
                  color: page === totalPages ? '#9ca3af' : '#374151',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit'
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}