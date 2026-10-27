import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSimulating, setIsSimulating] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    id: 0,
    name: '',
    location: '',
    contactNumber: '',
    email: '',
    isActive: true,
    swiggyOutletId: '',
    zomatoRestaurantId: '',
    urbanpiperStoreId: '',
    autoAcceptOrders: true,
    onlineOrderingActive: true
  });

  const fetchData = () => {
    setIsLoading(true);
    apiFetch('https://erp-api.neurolinx.in/api/branches')
      .then(res => res.ok ? res.json() : [])
      .catch(() => [])
      .then(data => { setBranches(Array.isArray(data) ? data : []); setIsLoading(false); })
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

  const handleSimulateOrder = async (branchId: number, channel: 'Swiggy' | 'Zomato') => {
    setIsSimulating(branchId);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/aggregators/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, channel })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Test ${channel} Order #${data.orderNumber} sent directly to Kitchen Display System (KDS) & Billing!`);
      } else {
        alert(`Error: ${data.message || 'Failed to simulate order'}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setIsSimulating(null);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Branch Management & Online Integrations</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Configure physical locations and link Swiggy / Zomato outlet IDs via Middleware.</p>
        </div>
        <button onClick={() => {
          setIsEditing(false);
          setForm({
            id: 0,
            name: '',
            location: '',
            contactNumber: '',
            email: '',
            isActive: true,
            swiggyOutletId: '',
            zomatoRestaurantId: '',
            urbanpiperStoreId: '',
            autoAcceptOrders: true,
            onlineOrderingActive: true
          });
          setShowForm(true);
        }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', height: 'fit-content', fontWeight: 600 }}>
          <Icons.Store size={18} /> Add Branch
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.125rem', color: '#0f172a' }}>
            {isEditing ? 'Edit Branch Details' : 'Create New Branch Profile'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Branch Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="e.g. ECIL Outlet, Downtown" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Location / Address</label>
                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="e.g. ECIL, Hyderabad" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Contact Number</label>
                <input type="text" value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="+91 9999999999" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Branch Status</label>
                <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="true">Active (Open for Business)</option>
                  <option value="false">Inactive (Temporarily Closed)</option>
                </select>
              </div>
            </div>

            {/* Online Delivery / Aggregator Middleware Integration Section */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Icons.Layers size={18} color="#0284c7" />
                <h4 style={{ margin: 0, fontSize: '0.9375rem', color: '#0f172a' }}>Online Aggregators (Swiggy / Zomato via UrbanPiper Middleware)</h4>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
                Map this physical branch to your online delivery merchant identifiers.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.375rem', color: '#d97706', fontWeight: 600 }}>
                    Swiggy Outlet ID
                  </label>
                  <input type="text" value={form.swiggyOutletId || ''} onChange={e => setForm({...form, swiggyOutletId: e.target.value})} placeholder="e.g. 541203" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.375rem', color: '#dc2626', fontWeight: 600 }}>
                    Zomato Restaurant ID
                  </label>
                  <input type="text" value={form.zomatoRestaurantId || ''} onChange={e => setForm({...form, zomatoRestaurantId: e.target.value})} placeholder="e.g. 1849201" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.375rem', color: '#475569', fontWeight: 600 }}>
                    UrbanPiper Store Ref ID
                  </label>
                  <input type="text" value={form.urbanpiperStoreId || ''} onChange={e => setForm({...form, urbanpiperStoreId: e.target.value})} placeholder="e.g. SPICE_ECIL" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.onlineOrderingActive} onChange={e => setForm({...form, onlineOrderingActive: e.target.checked})} style={{ width: '1rem', height: '1rem', accentColor: '#0284c7' }} />
                  <span>Accept Online Orders (Swiggy / Zomato ON)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.autoAcceptOrders} onChange={e => setForm({...form, autoAcceptOrders: e.target.checked})} style={{ width: '1rem', height: '1rem', accentColor: '#10b981' }} />
                  <span>Auto-accept incoming orders to Kitchen (KDS)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>{isEditing ? 'Update Branch' : 'Save Branch'}</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading branches...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {branches.map(b => (
            <div key={b.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{b.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Branch ID: #{b.id}</span>
                </div>
                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: b.isActive ? '#d1fae5' : '#fee2e2', color: b.isActive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', color: '#475569', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.MapPin size={16} color="#64748b" /> {b.location || 'No location set'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Phone size={16} color="#64748b" /> {b.contactNumber || 'No phone set'}</div>
              </div>

              {/* Aggregator Badges */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Aggregator Channels (Option 2 Middleware)</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: b.swiggyOutletId ? '#fff7ed' : '#f1f5f9', color: b.swiggyOutletId ? '#ea580c' : '#94a3b8', border: `1px solid ${b.swiggyOutletId ? '#fed7aa' : '#e2e8f0'}`, fontWeight: 600 }}>
                    Swiggy: {b.swiggyOutletId || 'Not Linked'}
                  </span>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: b.zomatoRestaurantId ? '#fef2f2' : '#f1f5f9', color: b.zomatoRestaurantId ? '#dc2626' : '#94a3b8', border: `1px solid ${b.zomatoRestaurantId ? '#fecaca' : '#e2e8f0'}`, fontWeight: 600 }}>
                    Zomato: {b.zomatoRestaurantId || 'Not Linked'}
                  </span>
                </div>
              </div>

              {/* Simulation Quick Testing Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Test Live Aggregator Ingestion:</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    disabled={isSimulating === b.id}
                    onClick={() => handleSimulateOrder(b.id, 'Swiggy')}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Icons.Zap size={14} /> Simulate Swiggy
                  </button>
                  <button 
                    disabled={isSimulating === b.id}
                    onClick={() => handleSimulateOrder(b.id, 'Zomato')}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Icons.Zap size={14} /> Simulate Zomato
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button onClick={() => { setIsEditing(true); setForm(b); setShowForm(true); }} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f8fafc', color: '#0284c7', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <Icons.Edit size={16} /> Edit Settings
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
