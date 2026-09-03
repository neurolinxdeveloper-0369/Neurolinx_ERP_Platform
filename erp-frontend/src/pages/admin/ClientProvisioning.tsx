import { useState, useEffect } from 'react';
import { Plus, Users, Settings, Building2, X, Edit2, Trash2, CheckSquare, Square, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../api';

export default function ClientProvisioning() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [companyRoles, setCompanyRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedCompanyType, setSelectedCompanyType] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [industryType, setIndustryType] = useState('Restaurant');
  const [isActive, setIsActive] = useState(true);
  
  // Branding Fields
  const [logoBase64, setLogoBase64] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [totalTables, setTotalTables] = useState<number | ''>('');
  
  // For new clients only
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Module Assignment
  const [allModules, setAllModules] = useState<any[]>([]);
  const [assignedModuleIds, setAssignedModuleIds] = useState<number[]>([]);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');

  useEffect(() => {
    fetchCompanies();
    fetchAllModules();
  }, []);

  const fetchCompanies = () => {
    apiFetch('https://erp-api.neurolinx.in/api/admin/companies')
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error("Failed to load companies", err));
  };

  const fetchAllModules = () => {
    apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items')
      .then(res => res.json())
      .then(data => setAllModules(data.filter((m: any) => m.isMasterEnabled)))
      .catch(err => console.error("Failed to load modules", err));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setLogoBase64(compressedBase64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const sendRegistrationOtp = async () => {
    if (!email) {
      alert("Please enter an email address first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/auth/send-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        alert("Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyRegistrationOtp = async () => {
    if (!otp) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (res.ok) {
        setOtpVerified(true);
      } else {
        alert("Invalid or expired OTP.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setCompanyName('');
    setClientName('');
    setIndustryType('Restaurant');
    setLogoBase64('');
    setContactNumber('');
    setAddress('');
    setWebsiteUrl('');
    setTotalTables('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setShowModal(true);
  };

  const openEditModal = async (comp: any) => {
    try {
      setIsSubmitting(true);
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/companies/' + comp.id);
      if (res.ok) {
        const fullComp = await res.json();
        setEditingId(fullComp.id);
        setCompanyName(fullComp.name);
        setClientName(fullComp.clientName || '');
        setIndustryType(fullComp.industryType);
        setIsActive(fullComp.isActive);
        setLogoBase64(fullComp.logoBase64 || '');
        setContactNumber(fullComp.contactNumber || '');
        setAddress(fullComp.address || '');
        setWebsiteUrl(fullComp.websiteUrl || '');
        setTotalTables(fullComp.totalTables || '');
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModulesModal = async (comp: any) => {
    setEditingId(comp.id);
    setSelectedCompanyName(comp.name);
    setSelectedCompanyType(comp.industryType || '');
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/admin/companies/${comp.id}/modules`);
      const data = await res.json();
      setAssignedModuleIds(data || []);
      setShowModulesModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load assigned modules");
    }
  };

  const toggleModule = (id: number) => {
    if (assignedModuleIds.includes(id)) {
      setAssignedModuleIds(assignedModuleIds.filter(mId => mId !== id));
    } else {
      setAssignedModuleIds([...assignedModuleIds, id]);
    }
  };

  const handleSaveModules = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/admin/companies/${editingId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignedModuleIds)
      });
      if (res.ok) {
        setShowModulesModal(false);
      } else {
        alert("Failed to save modules");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRolesModal = async (comp: any) => {
    setEditingId(comp.id);
    setSelectedCompanyName(comp.name);
    setNewRoleName('');
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/admin/companies/${comp.id}/roles`);
      if (res.ok) {
        const data = await res.json();
        setCompanyRoles(data || []);
        setShowRolesModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/admin/companies/${editingId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName.trim() })
      });
      if (res.ok) {
        setNewRoleName('');
        // Refresh roles
        const refreshRes = await apiFetch(`https://erp-api.neurolinx.in/api/admin/companies/${editingId}/roles`);
        const data = await refreshRes.json();
        setCompanyRoles(data || []);
      } else {
        alert('Failed to add role');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this client? This cannot be undone!")) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/admin/companies/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchCompanies();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(`Failed to delete client! Error: ${errData.message || res.statusText}`);
        }
      } catch (err: any) {
        console.error(err);
        alert("Network Error: " + err.message);
      }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setIsSubmitting(true);
    
    const url = editingId 
      ? `https://erp-api.neurolinx.in/api/admin/companies/${editingId}`
      : 'https://erp-api.neurolinx.in/api/admin/companies';
      
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId 
      ? { name: companyName, clientName, industryType, isActive, logoBase64, contactNumber, address, websiteUrl, totalTables: totalTables === '' ? null : totalTables }
      : { companyName, clientName, industryType, email, password, logoBase64, contactNumber, address, websiteUrl, totalTables: totalTables === '' ? null : totalTables };
    
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchCompanies();
        setShowModal(false);
      } else {
        alert('Failed to save client');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '0.5rem 0 2rem 0', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.625rem', borderRadius: '10px', color: '#2563eb' }}>
              <Building2 size={24} strokeWidth={2.5} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>Client Provisioning</h1>
          </div>
          <p style={{ margin: '0 0 0 3.5rem', color: '#64748b', fontSize: '1rem', maxWidth: '800px' }}>
            Manage client workspaces, roles, and configure their active module subscriptions.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)' }}
          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; }} 
          onMouseOut={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'none'; }}
        >
          <Plus size={18} /> Create Client
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {companies.map((company, index) => (
          <div key={index} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}>
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => openEditModal(company)} style={{ background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(company.id)} style={{ background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}><Trash2 size={16} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: company.isActive ? '#eff6ff' : '#f8fafc', width: '60px', height: '60px', borderRadius: '12px', color: company.isActive ? '#3b82f6' : '#94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: `1px solid ${company.isActive ? '#bfdbfe' : '#e2e8f0'}` }}>
                {company.logoBase64 ? (
                  <img src={company.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Building2 size={28} />
                )}
              </div>
              <div style={{ flex: 1, paddingRight: '4rem' }}>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', color: '#0f172a', fontWeight: 700, textDecoration: company.isActive ? 'none' : 'line-through', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</h3>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.25rem 0.625rem', borderRadius: '999px', fontWeight: 600 }}>{company.industryType || 'Unspecified'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <button onClick={() => openRolesModal(company)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                <Users size={16} color="#64748b" /> Roles
              </button>
              <button onClick={() => openModulesModal(company)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                <Settings size={16} color="#64748b" /> Modules
              </button>
            </div>
          </div>
        ))}
        {companies.length === 0 && (
          <p style={{ color: '#6b7280' }}>No clients found. Click "Create Client" to add one.</p>
        )}
      </div>

      {/* Roles Management Modal */}
      {showRolesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Manage Roles</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>For <span style={{ fontWeight: 600, color: '#334155' }}>{selectedCompanyName}</span></p>
              </div>
              <button onClick={() => setShowRolesModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="New Role Name (e.g. Manager)"
                style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
              <button 
                onClick={handleAddRole}
                disabled={!newRoleName.trim() || isSubmitting}
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1.25rem', cursor: (!newRoleName.trim() || isSubmitting) ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                onMouseOver={e => (!newRoleName.trim() || isSubmitting) || (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={e => (!newRoleName.trim() || isSubmitting) || (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                <Plus size={16} /> Add Role
              </button>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Existing Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {companyRoles.map((r, i) => (
                    <tr key={i} style={{ borderBottom: i === companyRoles.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 500, fontSize: '0.9375rem' }}>{r.name}</td>
                    </tr>
                  ))}
                  {companyRoles.length === 0 && (
                    <tr>
                      <td style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.875rem' }}>No custom roles created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modules Assignment Modal */}
      {showModulesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Assign Modules</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>For <span style={{ fontWeight: 600, color: '#334155' }}>{selectedCompanyName}</span></p>
              </div>
              <button onClick={() => setShowModulesModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
              {(() => {
                if (allModules.length === 0) {
                  return <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>No global modules found. Please create some in Settings first.</div>;
                }
                
                const availableModules = allModules.filter(mod => {
                  if (!mod.industryType || mod.industryType === 'All') return true;
                  if (selectedCompanyType === mod.industryType) return true;
                  if (selectedCompanyType === 'Hybrid (Hotel & Restaurant)' && (mod.industryType === 'Hotel' || mod.industryType === 'Restaurant')) return true;
                  if (selectedCompanyType === 'Hybrid (Software & Hardware)' && (mod.industryType === 'Software' || mod.industryType === 'Hardware' || mod.industryType === 'Electronics (Manufacturing & Assembly)')) return true;
                  return false;
                });
                
                const parentModules = availableModules.filter(m => !m.parentId || m.parentId === 0);
                
                return parentModules.map(mod => {
                  const children = availableModules.filter(m => m.parentId === mod.id);
                  const isChecked = assignedModuleIds.includes(mod.id);
                  
                  return (
                    <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <div 
                        onClick={() => toggleModule(mod.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem', 
                          padding: '1rem', 
                          border: '1px solid', 
                          borderColor: isChecked ? '#3b82f6' : '#e2e8f0', 
                          borderRadius: '12px', 
                          backgroundColor: isChecked ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isChecked ? '0 0 0 1px #3b82f6' : '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={e => !isChecked && (e.currentTarget.style.borderColor = '#cbd5e1')}
                        onMouseOut={e => !isChecked && (e.currentTarget.style.borderColor = '#e2e8f0')}
                      >
                        {isChecked ? <CheckSquare size={22} color="#2563eb" /> : <Square size={22} color="#94a3b8" />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: isChecked ? '#1e3a8a' : '#0f172a', fontSize: '0.9375rem' }}>
                            {mod.name}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: isChecked ? '#3b82f6' : '#64748b' }}>{mod.frontendRoute}</div>
                        </div>
                      </div>
                      
                      {children.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingLeft: '2.5rem', marginTop: '0.125rem' }}>
                          {children.map(child => {
                            const isChildChecked = assignedModuleIds.includes(child.id);
                            return (
                              <div 
                                key={child.id}
                                onClick={() => toggleModule(child.id)}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.75rem', 
                                  padding: '0.75rem 1rem', 
                                  border: '1px solid', 
                                  borderColor: isChildChecked ? '#93c5fd' : '#e2e8f0', 
                                  borderRadius: '10px', 
                                  backgroundColor: isChildChecked ? '#eff6ff' : '#f8fafc',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => !isChildChecked && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseOut={e => !isChildChecked && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              >
                                {isChildChecked ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} color="#cbd5e1" />}
                                <div>
                                  <div style={{ fontWeight: 600, color: isChildChecked ? '#1e40af' : '#475569', fontSize: '0.875rem' }}>
                                    {child.name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: isChildChecked ? '#60a5fa' : '#94a3b8' }}>{child.frontendRoute}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <button 
              onClick={handleSaveModules}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
              onMouseOver={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              {isSubmitting ? 'Saving Assignments...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Client Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
                {editingId ? 'Edit Client Configuration' : 'Create New Client Profile'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Branding Section */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ width: '88px', height: '88px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s, background-color 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.backgroundColor = '#eff6ff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}>
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <Building2 size={24} color="#94a3b8" />
                      <span style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase' }}>Upload Logo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Company Name (e.g. Spice Nation)"
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Contact Person (e.g. John Doe)"
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                  <select 
                    value={industryType}
                    onChange={e => setIndustryType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s', backgroundColor: 'white' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Hybrid (Hotel & Restaurant)">Hybrid (Hotel & Restaurant)</option>
                    <option value="Software">Software</option>
                    <option value="Hybrid (Software & Hardware)">Hybrid (Software & Hardware)</option>
                    <option value="Electronics (Manufacturing & Assembly)">Electronics (Manufacturing & Assembly)</option>
                    <option value="Ecommerce">Ecommerce</option>
                  </select>
                </div>
              </div>

              {(industryType === 'Restaurant' || industryType === 'Hotel') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="App / Website URL (e.g. one.neurolinx.in/spice-nation)"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
                <input 
                  type="number" 
                  value={totalTables}
                  onChange={e => setTotalTables(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Total Tables (for Restaurant/Hotel usage)"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Number</label>
                  <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="+91 9999999999" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location / City</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Bangalore, India" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'} />
                </div>
              </div>

              {editingId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', padding: '1.25rem', backgroundColor: isActive ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}` }}>
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={e => setIsActive(e.target.checked)} 
                    id="isActive"
                    style={{ width: '1.125rem', height: '1.125rem', accentColor: '#16a34a' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="isActive" style={{ fontSize: '0.9375rem', color: isActive ? '#166534' : '#475569', fontWeight: 600, cursor: 'pointer' }}>Active Client Status</label>
                    <span style={{ fontSize: '0.75rem', color: isActive ? '#15803d' : '#64748b' }}>{isActive ? "Client can log in and access system" : "Client is disabled and cannot log in"}</span>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Users size={18} color="#475569" />
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Client Admin Account</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* OTP Email Flow */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input 
                          type="email" 
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="admin@client.com"
                          disabled={otpVerified}
                          required
                          style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid', borderColor: otpVerified ? '#bbf7d0' : '#cbd5e1', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: otpVerified ? '#f0fdf4' : 'white', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.9375rem' }}
                          onFocus={e => !otpVerified && (e.currentTarget.style.borderColor = '#3b82f6')}
                          onBlur={e => !otpVerified && (e.currentTarget.style.borderColor = '#cbd5e1')}
                        />
                        {!otpVerified && (
                          <button type="button" onClick={sendRegistrationOtp} disabled={isSubmitting || !email} style={{ padding: '0 1.25rem', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '8px', cursor: (isSubmitting || !email) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'background-color 0.2s' }} onMouseOver={e => (!isSubmitting && email) && (e.currentTarget.style.backgroundColor = '#334155')} onMouseOut={e => (!isSubmitting && email) && (e.currentTarget.style.backgroundColor = '#475569')}>
                            {otpSent ? 'Resend OTP' : 'Send OTP'}
                          </button>
                        )}
                        {otpVerified && (
                          <div style={{ display: 'flex', alignItems: 'center', color: '#16a34a', padding: '0 0.5rem' }}>
                            <CheckCircle size={24} />
                          </div>
                        )}
                      </div>
                    </div>

                    {otpSent && !otpVerified && (
                      <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enter 6-Digit Code</label>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <input 
                            type="text" 
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            placeholder="123456"
                            style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #bfdbfe', borderRadius: '6px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                            onBlur={e => e.currentTarget.style.borderColor = '#bfdbfe'}
                          />
                          <button type="button" onClick={verifyRegistrationOtp} disabled={isSubmitting || !otp} style={{ padding: '0 1.25rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: (isSubmitting || !otp) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'background-color 0.2s' }} onMouseOver={e => (!isSubmitting && otp) && (e.currentTarget.style.backgroundColor = '#1d4ed8')} onMouseOut={e => (!isSubmitting && otp) && (e.currentTarget.style.backgroundColor = '#2563eb')}>
                            Verify
                          </button>
                        </div>
                      </div>
                    )}

                    {otpVerified && (
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                          <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Secure password"
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                            onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm</label>
                          <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-type password"
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                            onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || (!editingId && !otpVerified)}
                style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: (isSubmitting || (!editingId && !otpVerified)) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                onMouseOver={e => (!isSubmitting && (editingId || otpVerified)) && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={e => (!isSubmitting && (editingId || otpVerified)) && (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                {isSubmitting ? 'Saving Profile...' : 'Save Client Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
