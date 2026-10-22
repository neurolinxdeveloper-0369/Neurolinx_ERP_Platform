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

  // Vendor POs Modal
  const [selectedVendorForPOs, setSelectedVendorForPOs] = useState<any | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases').then(res => res.json())
    ]).then(([v, p]) => {
      setVendors(Array.isArray(v) ? v : []);
      setPurchaseOrders(Array.isArray(p) ? p : []);
      setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/inventory/vendors/${form.id}` : 'https://erp-api.neurolinx.in/api/inventory/vendors';
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        let msg = 'Failed to save vendor';
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch (_) {}
        alert(msg);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to save vendor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vendor? This will also clean up associated purchase records.")) {
      return;
    }
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/vendors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        let msg = `Failed to delete vendor (Status: ${res.status})`;
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch (_) {}
        alert(msg);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete vendor");
    }
  };

  const safeVendors = Array.isArray(vendors) ? vendors : [];
  const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];

  // Scorecard calculations
  const scorecards = safeVendors.map(v => {
    const vOrders = safePOs.filter(po => po?.vendor?.id === v.id);
    const totalSpent = vOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalItems = vOrders.reduce((sum, po) => sum + (po.items?.length || 0), 0);
    return { ...v, orderCount: vOrders.length, totalSpent, totalItems };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Vendor POs
  const vendorPOs = selectedVendorForPOs
    ? purchaseOrders.filter(po => po.vendor?.id === selectedVendorForPOs.id)
    : [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Vendor Management & Procurement</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Manage supplier directory, purchase history, and vendor performance scorecards</p>
        </div>
        <div>
          <button onClick={() => navigate('/res-purchases')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginRight: '1rem', fontWeight: 600 }}>
            View All Purchase Orders
          </button>
          <button onClick={() => { setIsEditing(false); setForm({ id: 0, name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <Icons.Plus size={16} style={{ display: 'inline', marginRight: '5px' }} /> Add Vendor
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('directory')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'directory' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'directory' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Vendor Directory ({vendors.length})</button>
        <button onClick={() => setActiveTab('scorecards')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'scorecards' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'scorecards' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.BarChart2 size={18} /> Supplier Scorecards</button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{isEditing ? 'Edit Vendor Details' : 'Register New Vendor'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vendor Name *</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contact Person</label><input type="text" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>GST/Tax No.</label><input type="text" value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Address</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>{isEditing ? 'Update Vendor' : 'Save Vendor'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading vendors...</div> : (
        <>
          {activeTab === 'directory' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {vendors.map(v => {
                const poCount = purchaseOrders.filter(po => po.vendor?.id === v.id).length;
                return (
                  <div key={v.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{v.name}</h3>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontWeight: 600 }}>
                          {poCount} POs
                        </span>
                      </div>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Contact:</strong> {v.contactPerson || 'N/A'}</p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Phone:</strong> {v.phone || 'N/A'}</p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>Email:</strong> {v.email || 'N/A'}</p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}><strong>GST:</strong> {v.gstNumber || 'N/A'}</p>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSelectedVendorForPOs(v)}
                        style={{ padding: '0.5rem', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <Icons.FileText size={15} /> View Purchase Orders
                      </button>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => { setIsEditing(true); setForm(v); setShowForm(true); }} style={{ padding: '0.45rem', flex: 1, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Edit</button>
                        <button onClick={() => handleDelete(v.id)} style={{ padding: '0.45rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {vendors.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  No vendors registered yet. Click "Add Vendor" to create your first vendor.
                </div>
              )}
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

      {/* VIEW PURCHASE ORDERS MODAL FOR VENDOR */}
      {selectedVendorForPOs && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '2rem', width: '90%', maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Purchase Orders for {selectedVendorForPOs.name}</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Contact: {selectedVendorForPOs.contactPerson || 'N/A'} | Phone: {selectedVendorForPOs.phone || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedVendorForPOs(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>PO #</th>
                  <th style={{ padding: '0.75rem' }}>Expected Date</th>
                  <th style={{ padding: '0.75rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem' }}>Items</th>
                  <th style={{ padding: '0.75rem' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendorPOs.map(po => (
                  <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{po.poNumber || `PO-${po.id}`}</td>
                    <td style={{ padding: '0.75rem' }}>{po.expectedDeliveryDate || po.invoiceDate || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{po.invoiceNumber && !po.invoiceNumber.startsWith('INV-PO-') ? po.invoiceNumber : '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{po.items?.length || 0} items</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{(po.totalAmount || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: po.status === 'Received' ? '#d1fae5' : po.status === 'Cancelled' ? '#fee2e2' : '#e0f2fe', color: po.status === 'Received' ? '#047857' : po.status === 'Cancelled' ? '#b91c1c' : '#0369a1' }}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {vendorPOs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No purchase orders recorded for this vendor yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => {
                  setSelectedVendorForPOs(null);
                  navigate('/res-purchases');
                }}
                style={{ padding: '0.6rem 1.25rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Go to Purchase Orders
              </button>
              <button onClick={() => setSelectedVendorForPOs(null)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
