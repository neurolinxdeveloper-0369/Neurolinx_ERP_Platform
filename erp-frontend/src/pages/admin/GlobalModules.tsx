import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import { apiFetch } from '../../api';

export default function GlobalModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [frontendRoute, setFrontendRoute] = useState('');
  const [icon, setIcon] = useState('circle');
  const [isMasterEnabled, setIsMasterEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = () => {
    apiFetch('http://erp-api.neurolinx.in/api/admin/menu-items')
      .then(res => res.json())
      .then(data => setModules(data))
      .catch(err => console.error("Failed to load modules", err));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setFrontendRoute('');
    setIcon('circle');
    setIsMasterEnabled(true);
    setShowModal(true);
  };

  const openEditModal = (mod: any) => {
    setEditingId(mod.id);
    setName(mod.name);
    setFrontendRoute(mod.frontendRoute);
    setIcon(mod.icon);
    setIsMasterEnabled(mod.isMasterEnabled);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this module? This will break any clients using it!")) return;
    try {
      const res = await apiFetch(`http://erp-api.neurolinx.in/api/admin/menu-items/${id}`, { method: 'DELETE' });
      if (res.ok) fetchModules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingId 
      ? `http://erp-api.neurolinx.in/api/admin/menu-items/${editingId}`
      : 'http://erp-api.neurolinx.in/api/admin/menu-items';
      
    const method = editingId ? 'PUT' : 'POST';
    
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, frontendRoute, icon, isMasterEnabled })
      });
      
      if (res.ok) {
        fetchModules();
        setShowModal(false);
      } else {
        alert('Failed to save module');
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
          <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Global Modules</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Manage all available menu items in the ERP system.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          <Plus size={18} />
          Add Module
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Module Name</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Route</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Icon</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Master Status</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', color: '#111827', fontWeight: '500' }}>{mod.name}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.frontendRoute}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.icon}</td>
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
            ))}
            {modules.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No modules found. Click "Add Module" to create one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Icon (lucide-react name)</label>
                <input 
                  type="text" 
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="e.g. shopping-cart, layout-dashboard, users"
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                />
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
