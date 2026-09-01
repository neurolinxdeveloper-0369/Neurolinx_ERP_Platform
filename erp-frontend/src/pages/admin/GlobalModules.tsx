import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { Edit2, Trash2, Plus, X, LayoutDashboard, Settings2, FolderTree, Folder } from 'lucide-react';

export default function GlobalModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [frontendRoute, setFrontendRoute] = useState('');
  const [icon, setIcon] = useState('');
  const [isMasterEnabled, setIsMasterEnabled] = useState(true);
  const [industryType, setIndustryType] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-modules state for the current editing module
  const [subModules, setSubModules] = useState<{ id?: number, name: string, frontendRoute: string }[]>([]);
  const [deletedSubModules, setDeletedSubModules] = useState<number[]>([]);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setFrontendRoute('');
    setIcon('');
    setIsMasterEnabled(true);
    setIndustryType('All');
    setSubModules([]);
    setDeletedSubModules([]);
    setShowModal(true);
  };

  const openEditModal = (mod: any) => {
    setEditingId(mod.id);
    setName(mod.name);
    setFrontendRoute(mod.frontendRoute);
    setIcon(mod.icon || '');
    setIsMasterEnabled(mod.isMasterEnabled);
    setIndustryType(mod.industryType || 'All');

    // Find children
    const children = modules.filter(m => m.parentId === mod.id).map(m => ({
      id: m.id,
      name: m.name,
      frontendRoute: m.frontendRoute
    }));
    setSubModules(children);
    setDeletedSubModules([]);

    setShowModal(true);
  };

  const addSubModuleRow = () => {
    setSubModules([...subModules, { name: '', frontendRoute: '' }]);
  };

  const updateSubModule = (index: number, field: 'name' | 'frontendRoute', value: string) => {
    const updated = [...subModules];
    updated[index][field] = value;
    setSubModules(updated);
  };

  const removeSubModuleRow = (index: number) => {
    const sm = subModules[index];
    if (sm.id) {
      setDeletedSubModules([...deletedSubModules, sm.id]);
    }
    setSubModules(subModules.filter((_, i) => i !== index));
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = editingId
      ? 'https://erp-api.neurolinx.in/api/admin/menu-items/' + editingId
      : 'https://erp-api.neurolinx.in/api/admin/menu-items';

    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, frontendRoute, icon, isMasterEnabled, industryType })
      });
      if (res.ok) {
        const savedMod = await res.json();
        
        // 1. Process deletes for sub-modules
        for (const id of deletedSubModules) {
          await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items/' + id, { method: 'DELETE' });
        }

        // 2. Process creates/updates for sub-modules
        for (const sm of subModules) {
          if (sm.name.trim() === '' || sm.frontendRoute.trim() === '') continue;
          
          if (sm.id) {
            // Update existing sub-module
            await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items/' + sm.id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: sm.name, 
                frontendRoute: sm.frontendRoute, 
                icon: icon, // inherit icon
                isMasterEnabled: isMasterEnabled, 
                industryType,
                parentId: savedMod.id 
              })
            });
          } else {
            // Create new sub-module
            await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: sm.name, 
                frontendRoute: sm.frontendRoute, 
                icon: icon, // inherit icon
                isMasterEnabled: isMasterEnabled, 
                industryType,
                parentId: savedMod.id 
              })
            });
          }
        }

        fetchModules();
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this module? This will break any clients using it!")) return;
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items/' + id, { method: 'DELETE' });
      if (res.ok) {
        fetchModules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '0.5rem 0 2rem 0', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: '#f5f3ff', padding: '0.625rem', borderRadius: '10px', color: '#7c3aed' }}>
              <Settings2 size={24} strokeWidth={2.5} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>Global Modules</h1>
          </div>
          <p style={{ margin: '0 0 0 3.5rem', color: '#64748b', fontSize: '1rem', maxWidth: '800px' }}>
            Manage the master catalog of all features and screens available in the ERP.
          </p>
        </div>
        
        <button onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'none'; }}>
          <Plus size={18} /> Create Module
        </button>
      </div>

      {/* Modules Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading master modules...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Module Details</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Frontend Route</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Industry</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const parentModules = modules.filter(m => !m.parentId || m.parentId === 0);
                  
                  if (parentModules.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} style={{ padding: '4rem 0', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                            <LayoutDashboard size={32} color="#94a3b8" />
                          </div>
                          <p style={{ color: '#64748b', margin: 0 }}>No global modules found. Create one to get started.</p>
                        </td>
                      </tr>
                    );
                  }

                  return parentModules.map(parent => {
                    const children = modules.filter(m => m.parentId === parent.id);
                    return (
                      <React.Fragment key={parent.id}>
                        {/* Parent Row */}
                        <tr style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', color: '#64748b' }}>
                                <Folder size={18} />
                              </div>
                              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>{parent.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.875rem' }}>{parent.frontendRoute}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {parent.industryType || 'All'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ color: parent.isMasterEnabled ? '#059669' : '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
                              {parent.isMasterEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button onClick={() => openEditModal(parent)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '6px', transition: 'background-color 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#2563eb'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(parent.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '6px', transition: 'background-color 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Children Rows */}
                        {children.map(child => (
                          <tr key={child.id} style={{ backgroundColor: '#fafafa', borderTop: '1px solid #f8fafc' }}>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '2rem' }}>
                                <FolderTree size={16} color="#cbd5e1" />
                                <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>{child.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{child.frontendRoute}</td>
                            <td style={{ padding: '1rem 1.5rem' }}></td>
                            <td style={{ padding: '1rem 1.5rem' }}></td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                              <button onClick={() => handleDelete(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem', borderRadius: '6px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
                {editingId ? 'Edit Global Module' : 'Create Global Module'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>Module Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Inventory Management"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>Frontend Route</label>
                <input
                  type="text"
                  value={frontendRoute}
                  onChange={e => setFrontendRoute(e.target.value)}
                  placeholder="e.g. /inventory"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>Lucide Icon Name</label>
                <input
                  type="text"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="e.g. settings, users, box"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>Industry Compatibility</label>
                <select
                  value={industryType}
                  onChange={e => setIndustryType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s', backgroundColor: 'white' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <option value="All">All</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Hybrid (Hotel & Restaurant)">Hybrid (Hotel & Restaurant)</option>
                  <option value="Software">Software</option>
                  <option value="Hybrid (Software & Hardware)">Hybrid (Software & Hardware)</option>
                  <option value="Electronics (Manufacturing & Assembly)">Electronics (Manufacturing & Assembly)</option>
                  <option value="Ecommerce">Ecommerce</option>
                </select>
              </div>

              {/* Sub Modules Section */}
              <div style={{ marginTop: '0.5rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: 700 }}>Sub Modules (Optional)</label>
                  <button type="button" onClick={addSubModuleRow} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', padding: '0.375rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                    <Plus size={14} /> Add Sub Module
                  </button>
                </div>
                
                {subModules.map((sm, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={sm.name}
                        onChange={e => updateSubModule(idx, 'name', e.target.value)}
                        placeholder="Sub Module Name"
                        required
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', outline: 'none', fontSize: '0.875rem' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      />
                      <input
                        type="text"
                        value={sm.frontendRoute}
                        onChange={e => updateSubModule(idx, 'frontendRoute', e.target.value)}
                        placeholder="Route (e.g. /inventory/stock)"
                        required
                        style={{ width: '100%', padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', outline: 'none', fontSize: '0.875rem' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      />
                    </div>
                    <button type="button" onClick={() => removeSubModuleRow(idx)} style={{ padding: '0.625rem', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef2f2'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {subModules.length === 0 && (
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>No sub-modules defined. Click above to nest features under this module.</p>
                )}
              </div>

              {editingId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <input
                    type="checkbox"
                    checked={isMasterEnabled}
                    onChange={e => setIsMasterEnabled(e.target.checked)}
                    id="masterEnabled"
                    style={{ width: '1rem', height: '1rem', accentColor: '#16a34a' }}
                  />
                  <label htmlFor="masterEnabled" style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600, cursor: 'pointer' }}>
                    Active (Global Access Enabled)
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                onMouseOver={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                {isSubmitting ? 'Saving Configuration...' : (editingId ? 'Update Module' : 'Create Module')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
