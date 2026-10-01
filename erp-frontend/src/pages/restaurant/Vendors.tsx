import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';

import { useNavigate } from 'react-router-dom';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: 0, name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' });

  const fetchVendors = () => {
    setIsLoading(true);
    apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors')
      .then(res => res.json())
      .then(data => { setVendors(data); setIsLoading(false); })
      .catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => {
    fetchVendors();
  }, []);

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
      fetchVendors();
    });
  };

  const deleteVendor = (id: number) => {
    if (!window.confirm("Delete vendor?")) return;
    apiFetch(`https://erp-api.neurolinx.in/api/inventory/vendors/${id}`, { method: 'DELETE' }).then(fetchVendors);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Vendor Management</h2>
        <button onClick={() => navigate('/res-purchases')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginRight: '1rem' }}>View Purchase Orders</button>
        <button onClick={() => { setIsEditing(false); setForm({ id: 0, name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Add Vendor
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Vendor Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Contact Person</label>
              <input type="text" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>GST Number</label>
              <input type="text" value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem' }}>Vendor Name</th>
              <th style={{ padding: '1rem' }}>Contact</th>
              <th style={{ padding: '1rem' }}>Phone</th>
              <th style={{ padding: '1rem' }}>GST Number</th>
              <th style={{ padding: '1rem' }}>Balance</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{v.name}</td>
                <td style={{ padding: '1rem' }}>{v.contactPerson || '-'}</td>
                <td style={{ padding: '1rem' }}>{v.phone || '-'}</td>
                <td style={{ padding: '1rem' }}>{v.gstNumber || '-'}</td>
                <td style={{ padding: '1rem', color: v.balance > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>₹{v.balance?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => { setForm(v); setIsEditing(true); setShowForm(true); }} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteVendor(v.id)} style={{ color: '#ef4444', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No vendors found.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
