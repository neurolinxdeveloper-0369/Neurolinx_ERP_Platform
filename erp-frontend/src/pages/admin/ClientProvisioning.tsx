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
      if (res.ok) fetchCompanies();
    } catch (err) {
      console.error(err);
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Client Provisioning</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Manage client companies, roles, and module access.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          <Plus size={18} />
          Create Client
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {companies.map((company, index) => (
          <div key={index} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => openEditModal(company)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(company.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: company.isActive ? '#eff6ff' : '#f3f4f6', width: '56px', height: '56px', borderRadius: '8px', color: company.isActive ? '#3b82f6' : '#9ca3af', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {company.logoBase64 ? (
                  <img src={company.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Building2 size={24} />
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827', textDecoration: company.isActive ? 'none' : 'line-through' }}>{company.name}</h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{company.industryType}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
              <button onClick={() => openRolesModal(company)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <Users size={16} /> Roles
              </button>
              <button onClick={() => openModulesModal(company)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <Settings size={16} /> Modules
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Manage Roles</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>For {selectedCompanyName}</p>
              </div>
              <button onClick={() => setShowRolesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="New Role Name (e.g. Waitstaff)"
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
              <button onClick={handleAddRole} disabled={isSubmitting || !newRoleName.trim()} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Adding...' : 'Add Role'}
              </button>
            </div>
            <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr><th style={{ padding: '0.75rem', textAlign: 'left' }}>Role Name</th></tr>
                </thead>
                <tbody>
                  {companyRoles.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>{r.name}</td>
                    </tr>
                  ))}
                  {companyRoles.length === 0 && <tr><td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No roles yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modules Assignment Modal */}
      {showModulesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Assign Modules</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>For {selectedCompanyName}</p>
              </div>
              <button onClick={() => setShowModulesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
              <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(() => {
                  if (allModules.length === 0) {
                    return <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>No global modules found. Please create some in Settings first.</p>;
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
                      <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div 
                          onClick={() => toggleModule(mod.id)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            padding: '0.75rem', 
                            border: '1px solid', 
                            borderColor: isChecked ? '#3b82f6' : '#d1d5db', 
                            borderRadius: '6px', 
                            backgroundColor: isChecked ? '#eff6ff' : 'white',
                            cursor: 'pointer'
                          }}>
                          {isChecked ? <CheckSquare size={20} color="#3b82f6" /> : <Square size={20} color="#9ca3af" />}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: '#111827' }}>
                              {mod.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{mod.frontendRoute}</div>
                          </div>
                        </div>
                        
                        {children.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '2rem', marginTop: '0.25rem' }}>
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
                                    padding: '0.5rem 0.75rem', 
                                    border: '1px solid', 
                                    borderColor: isChildChecked ? '#3b82f6' : '#e5e7eb', 
                                    borderRadius: '6px', 
                                    backgroundColor: isChildChecked ? '#eff6ff' : '#f9fafb',
                                    cursor: 'pointer'
                                  }}>
                                  {isChildChecked ? <CheckSquare size={16} color="#3b82f6" /> : <Square size={16} color="#9ca3af" />}
                                  <div>
                                    <div style={{ fontWeight: '500', color: '#4b5563', fontSize: '0.875rem' }}>
                                      {child.name}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{child.frontendRoute}</div>
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
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isSubmitting ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Client Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>
                {editingId ? 'Edit Client Details' : 'Create New Client'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Branding Section */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #d1d5db', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>Upload<br/>Logo</span>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Company Name (e.g. Joe's Cafe)"
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Client Name (e.g. John Doe)"
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                  <select 
                    value={industryType}
                    onChange={e => setIndustryType(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Hybrid (Hotel & Restaurant)">Hybrid (Hotel & Restaurant)</option>
                    <option value="Software">Software</option>
                    <option value="Hybrid (Software & Hardware)">Hybrid (Software & Hardware)</option>
                    <option value="Electronics (Manufacturing & Assembly)">Electronics (Manufacturing & Assembly)</option>
                    <option value="Ecommerce">Ecommerce</option>
                  </select>
                  <input 
                    type="text" 
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="Website URL (e.g. one.neurolinx.in/spice-nation)"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="number" 
                    value={totalTables}
                    onChange={e => setTotalTables(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Total Tables (for Restaurant/Hotel)"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Contact Number</label>
                  <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Address / City</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {editingId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={e => setIsActive(e.target.checked)} 
                    id="isActive"
                  />
                  <label htmlFor="isActive" style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>Active Client (Can log in)</label>
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#374151' }}>Client Admin Account</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* OTP Email Flow */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Email Address</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="email" 
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="admin@client.com"
                          disabled={otpVerified}
                          required
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: otpVerified ? '#f3f4f6' : 'white' }}
                        />
                        {!otpVerified && (
                          <button type="button" onClick={sendRegistrationOtp} disabled={isSubmitting || !email} style={{ padding: '0 1rem', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            {otpSent ? 'Resend OTP' : 'Send OTP'}
                          </button>
                        )}
                        {otpVerified && (
                          <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', padding: '0 0.5rem' }}>
                            <CheckCircle size={20} />
                          </div>
                        )}
                      </div>
                    </div>

                    {otpSent && !otpVerified && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Enter 6-Digit Code</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            placeholder="123456"
                            style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                          />
                          <button type="button" onClick={verifyRegistrationOtp} disabled={isSubmitting || !otp} style={{ padding: '0 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            Verify
                          </button>
                        </div>
                      </div>
                    )}

                    {otpVerified && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Password</label>
                          <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter a secure password"
                            required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Confirm Password</label>
                          <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-type password"
                            required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || (!editingId && !otpVerified)}
                style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: (isSubmitting || (!editingId && !otpVerified)) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? 'Saving...' : 'Save Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
