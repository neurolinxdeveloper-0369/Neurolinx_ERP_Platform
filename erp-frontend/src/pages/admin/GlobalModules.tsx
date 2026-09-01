import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import { Edit2, Trash2, CheckCircle, XCircle, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';

export default function GlobalModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [frontendRoute, setFrontendRoute] = useState('');
  const [icon, setIcon] = useState('');
  const [industryType, setIndustryType] = useState('All');
  const [isMasterEnabled, setIsMasterEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sub Modules State
  const [subModules, setSubModules] = useState<{id?: number, name: string, frontendRoute: string}[]>([]);
  const [deletedSubModules, setDeletedSubModules] = useState<number[]>([]);

  const [filterType, setFilterType] = useState('All');
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setName('');
    setFrontendRoute('');
    setIcon('');
    setIndustryType(filterType !== 'All' ? filterType : 'All');
    setIsMasterEnabled(true);
    setSubModules([]);
    setDeletedSubModules([]);
    setShowModal(true);
  };

  const openEditModal = (mod: any) => {
    setEditingId(mod.id);
    setName(mod.name);
    setFrontendRoute(mod.frontendRoute);
    setIcon(mod.icon);
    setIndustryType(mod.industryType || 'All');
    setIsMasterEnabled(mod.isMasterEnabled);
    
    // Load existing sub-modules
    const existingSubModules = modules.filter(m => m.parentId === mod.id);
    setSubModules(existingSubModules.map(sm => ({ id: sm.id, name: sm.name, frontendRoute: sm.frontendRoute })));
    setDeletedSubModules([]);
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this module? This will break any clients using it!")) return;
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items/' + id, { method: 'DELETE' });
      if (res.ok) fetchModules();
    } catch (err) {
      console.error(err);
    }
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
        
        // Save sub-modules
        if (subModules.length > 0) {
          for (const sm of subModules) {
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
        }
        
        // Delete removed sub-modules
        if (deletedSubModules.length > 0) {
          for (const id of deletedSubModules) {
            await apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items/' + id, { method: 'DELETE' });
          }
        }
        
        setShowModal(false);
        fetchModules();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubModuleRow = () => {
    setSubModules([...subModules, { name: '', frontendRoute: '' }]);
  };

  const updateSubModule = (index: number, field: string, value: string) => {
    const updated = [...subModules];
    updated[index] = { ...updated[index], [field]: value };
    setSubModules(updated);
  };

  const removeSubModuleRow = (index: number) => {
    const updated = [...subModules];
    const removed = updated.splice(index, 1)[0];
    if (removed.id) {
      setDeletedSubModules(prev => [...prev, removed.id!]);
    }
    setSubModules(updated);
  };

  const toggleParent = (parentId: number) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  const industries = ['All', 'Restaurant', 'Hotel', 'Hybrid (Hotel & Restaurant)', 'Software', 'Hybrid (Software & Hardware)', 'Electronics (Manufacturing & Assembly)', 'Ecommerce'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Global Modules</h1>
        <button 
          onClick={openNewModal}
          style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Add Module
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
        {industries.map(ind => (
          <button 
            key={ind}
            onClick={() => setFilterType(ind)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: filterType === ind ? '#3b82f6' : '#d1d5db',
              backgroundColor: filterType === ind ? '#ebf5ff' : 'white',
              color: filterType === ind ? '#1d4ed8' : '#4b5563',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {ind}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'left' }}>Module Name</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'left' }}>Route</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'left' }}>Icon</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'left' }}>Industry Type</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Master Status</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filteredModules = modules.filter(m => filterType === 'All' || m.industryType === filterType || (!m.industryType && filterType === 'All') || m.industryType === 'All');
              const parentModules = filteredModules.filter(m => !m.parentId || m.parentId === 0);
              
              if (parentModules.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No modules found. Click "Add Module" to create one.</td>
                  </tr>
                );
              }

              return parentModules.map((mod, index) => {
                const children = filteredModules.filter(m => m.parentId === mod.id);
                const isExpanded = expandedParents[mod.id];
                return (
                  <React.Fragment key={index}>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem', color: '#111827', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {children.length > 0 && (
                            <button 
                              onClick={() => toggleParent(mod.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6b7280' }}
                            >
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          )}
                          {mod.name}
                          {children.length > 0 && (
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#e5e7eb', color: '#374151', padding: '0.125rem 0.375rem', borderRadius: '9999px', fontWeight: 'bold' }}>
                              {children.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.frontendRoute}</td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.icon}</td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.industryType || 'All'}</td>
                      <td style={{ padding: '1rem' }}>
                        {mod.isMasterEnabled ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', backgroundColor: '#d1fae5', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                            <XCircle size={14} /> Disabled
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => openEditModal(mod)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', marginRight: '0.5rem' }}><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(mod.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                    {isExpanded && children.map(child => (
                      <tr key={child.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '1rem', color: '#475569', paddingLeft: '3rem', fontSize: '0.9rem' }}>
                          ↳ {child.name}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{child.frontendRoute}</td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{child.icon}</td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{child.industryType || 'All'}</td>
                        <td style={{ padding: '1rem' }}>
                          {child.isMasterEnabled ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', backgroundColor: '#d1fae5', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                              <XCircle size={12} /> Disabled
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button onClick={() => openEditModal(child)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(child.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>
                {editingId ? 'Edit Global Module' : 'Create Global Module'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Module Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. POS System"
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Frontend Route</label>
                <input
                  type="text"
                  value={frontendRoute}
                  onChange={e => setFrontendRoute(e.target.value)}
                  placeholder="e.g. /pos"
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Icon</label>
                <input
                  type="text"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="e.g. settings"
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Industry Type</label>
                <select
                  value={industryType}
                  onChange={e => setIndustryType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
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
              <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>Sub Modules (Optional)</label>
                  <button type="button" onClick={addSubModuleRow} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', backgroundColor: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                    <Plus size={14} /> Add Sub Module
                  </button>
                </div>
                
                {subModules.map((sm, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={sm.name}
                        onChange={e => updateSubModule(idx, 'name', e.target.value)}
                        placeholder="Sub Module Name"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '0.25rem', fontSize: '0.875rem' }}
                      />
                      <input
                        type="text"
                        value={sm.frontendRoute}
                        onChange={e => updateSubModule(idx, 'frontendRoute', e.target.value)}
                        placeholder="Sub Frontend Route (e.g. /pos/settings)"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.875rem' }}
                      />
                    </div>
                    <button type="button" onClick={() => removeSubModuleRow(idx)} style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {subModules.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Click + to quickly create nested child modules under this module.</p>
                )}
              </div>

              {editingId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={isMasterEnabled}
                    onChange={e => setIsMasterEnabled(e.target.checked)}
                    id="masterEnabled"
                  />
                  <label htmlFor="masterEnabled" style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>Master Enabled (If unchecked, NO client can use this)</label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? 'Saving...' : 'Save Module'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
