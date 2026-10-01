import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({ vendorId: '', invoiceNumber: '', invoiceDate: '', totalAmount: 0, amountPaid: 0, items: [] as any[] });

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json())
    ]).then(([p, v, i]) => {
      setPurchases(p); setVendors(v); setIngredients(i); setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { ingredientId: '', quantity: 0, costPerUnit: 0, expiryDate: '' }] });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases', {
      method: 'POST',
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
        <h2>Purchase Orders (Goods Receipt)</h2>
        <button onClick={() => { setForm({ vendorId: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0], totalAmount: 0, amountPaid: 0, items: [] }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Receive Stock
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Vendor</label>
                <select required value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Invoice Number</label>
                <input required type="text" value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Invoice Date</label>
                <input required type="date" value={form.invoiceDate} onChange={e => setForm({...form, invoiceDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Amount</label>
                <input required type="number" step="0.01" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: parseFloat(e.target.value)})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Amount Paid (Now)</label>
                <input required type="number" step="0.01" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: parseFloat(e.target.value)})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Items Received</h4>
                <button type="button" onClick={handleAddItem} style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <select required value={item.ingredientId} onChange={e => handleItemChange(idx, 'ingredientId', e.target.value)} style={{ flex: 2, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Ingredient</option>
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input required type="number" step="0.01" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input required type="number" step="0.01" placeholder="Cost per Unit" value={item.costPerUnit} onChange={e => handleItemChange(idx, 'costPerUnit', e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input type="date" placeholder="Expiry Date" value={item.expiryDate} onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button type="button" onClick={() => handleRemoveItem(idx)} style={{ padding: '0.75rem', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Icons.Trash2 size={20} /></button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Purchase Order</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem' }}>Invoice #</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Vendor</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.invoiceNumber}</td>
                <td style={{ padding: '1rem' }}>{p.invoiceDate}</td>
                <td style={{ padding: '1rem' }}>{p.vendor?.name}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>₹{p.totalAmount?.toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: p.status === 'Paid' ? '#d1fae5' : '#fee2e2', color: p.status === 'Paid' ? '#10b981' : '#ef4444' }}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {purchases.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>No purchase orders found.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
