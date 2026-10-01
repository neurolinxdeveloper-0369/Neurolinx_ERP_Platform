import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'directory' | 'scorecards'>('directory');

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases').then(res => res.json())
    ]).then(([v, p]) => {
      setVendors(v);
      setPurchaseOrders(p);
      setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/inventory/vendors/${form.id}` : 'https://erp-api.neurolinx.in/api/inventory/vendors';
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

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      apiFetch(`https://erp-api.neurolinx.in/api/inventory/vendors/${id}`, { method: 'DELETE' }).then(fetchData);
    }
  };

  // Scorecard calculations
  const scorecards = vendors.map(v => {
    const vOrders = purchaseOrders.filter(po => po.vendor?.id === v.id);
    const totalSpent = vOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalItems = vOrders.reduce((sum, po) => sum + (po.items?.length || 0), 0);
    return { ...v, orderCount: vOrders.length, totalSpent, totalItems };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Vendor Management & Procurement</h2>
        <div>
          <button onClick={() => navigate('/res-purchases')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginRight: '1rem' }}>View Purchase Orders</button>
          <button onClick={() => { setIsEditing(false); setForm({ id: 0, name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <Icons.Plus size={16} style={{ display: 'inline', marginRight: '5px' }} /> Add Vendor
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('directory')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'directory' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'directory' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Vendor Directory</button>
        <button onClick={() => setActiveTab('scorecards')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'scorecards' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'scorecards' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.BarChart2 size={18} /> Supplier Scorecards</button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div><label>Vendor Name</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><label>Contact Person</label><input type="text" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><label>Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><label>GST/Tax No.</label><input type="text" value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>Address</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none' }}>{isEditing ? 'Update' : 'Save'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading vendors...</div> : (
        <>
          {activeTab === 'directory' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {vendors.map(v => (
                <div key={v.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>{v.name}</h3>
                  <p><strong>Contact:</strong> {v.contactPerson}</p>
                  <p><strong>Phone:</strong> {v.phone}</p>
                  <p><strong>Email:</strong> {v.email}</p>
                  <p><strong>GST:</strong> {v.gstNumber}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setIsEditing(true); setForm(v); setShowForm(true); }} style={{ padding: '0.5rem', flex: 1, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>Edit</button>
                    <button onClick={() => handleDelete(v.id)} style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'scorecards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#64748b' }}>Total Procurement Spend</p>
                  <h2 style={{ margin: '0.5rem 0 0 0' }}>₹{scorecards.reduce((sum, s) => sum + s.totalSpent, 0).toFixed(2)}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#64748b' }}>Active Suppliers</p>
                  <h2 style={{ margin: '0.5rem 0 0 0' }}>{scorecards.filter(s => s.orderCount > 0).length}</h2>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#64748b' }}>Total Purchase Orders</p>
                  <h2 style={{ margin: '0.5rem 0 0 0' }}>{purchaseOrders.length}</h2>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Supplier Rank</th>
                    <th style={{ padding: '1rem' }}>Vendor Name</th>
                    <th style={{ padding: '1rem' }}>Purchase Orders</th>
                    <th style={{ padding: '1rem' }}>Items Supplied</th>
                    <th style={{ padding: '1rem' }}>Total Spent</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecards.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: idx < 3 ? '#0284c7' : '#64748b' }}>#{idx + 1}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '1rem' }}>{s.orderCount} POs</td>
                      <td style={{ padding: '1rem' }}>{s.totalItems} Batches</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>₹{s.totalSpent.toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>
                        {s.orderCount > 0 ? <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#d1fae5', color: '#10b981', borderRadius: '4px', fontSize: '0.75rem' }}>Active</span> : <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '0.75rem' }}>Dormant</span>}
                      </td>
                    </tr>
                  ))}
                  {scorecards.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No vendor data found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
