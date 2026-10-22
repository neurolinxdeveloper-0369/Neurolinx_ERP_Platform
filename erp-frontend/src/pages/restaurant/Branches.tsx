import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', location: '', contactNumber: '', email: '', isActive: true });

  const fetchData = () => {
    setIsLoading(true);
    apiFetch('https://erp-api.neurolinx.in/api/branches')
      .then(res => res.json())
      .then(data => { setBranches(data); setIsLoading(false); })
      .catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/branches/${form.id}` : 'https://erp-api.neurolinx.in/api/branches';
    const method = isEditing ? 'PUT' : 'POST';
    
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(() => {
      setShowForm(false);
      fetchData();
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Branch Management</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Configure and manage multiple physical restaurant locations.</p>
        </div>
        <button onClick={() => { setIsEditing(false); setForm({ id: 0, name: '', location: '', contactNumber: '', email: '', isActive: true }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', height: 'fit-content' }}>
          <Icons.Store size={18} /> Add Branch
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Branch Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="e.g. Downtown, Mall of India" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Location / Address</label>
                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Contact Number</label>
                <input type="text" value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Status</label>
                <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="true">Active (Open)</option>
                  <option value="false">Inactive (Closed)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{isEditing ? 'Update Branch' : 'Save Branch'}</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {branches.map(b => (
            <div key={b.id} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{b.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Branch ID: #{b.id}</span>
                </div>
                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: b.isActive ? '#d1fae5' : '#fee2e2', color: b.isActive ? '#10b981' : '#ef4444' }}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.MapPin size={16} /> {b.location || 'No location set'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Phone size={16} /> {b.contactNumber || 'No phone set'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Mail size={16} /> {b.email || 'No email set'}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button onClick={() => { setIsEditing(true); setForm(b); setShowForm(true); }} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f8fafc', color: '#0284c7', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Edit size={16} /> Edit
                </button>
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <Icons.Store size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No branches configured yet. Add your first branch above to start multi-location management.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
