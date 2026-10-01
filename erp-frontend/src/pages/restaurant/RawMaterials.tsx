import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function RawMaterials() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'forecasting'>('overview');
  
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', unit: 'kg', stockLevel: 0, reorderLevel: 0 });

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/batches').then(res => res.json())
    ]).then(([i, b]) => {
      setIngredients(i); setBatches(b); setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/inventory/ingredients/${form.id}` : 'https://erp-api.neurolinx.in/api/inventory/ingredients';
    const method = isEditing ? 'PUT' : 'POST';
    const payload = isEditing ? { ...form } : { name: form.name, unit: form.unit, stockLevel: form.stockLevel, reorderLevel: form.reorderLevel };
    apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(() => { setShowForm(false); fetchData(); });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) { apiFetch(`https://erp-api.neurolinx.in/api/inventory/ingredients/${id}`, { method: 'DELETE' }).then(fetchData); }
  };

  // Forecasting Logic
  const expiringBatches = batches.filter(b => {
    if (!b.expiryDate) return false;
    const daysLeft = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const suggestedReorders = ingredients.filter(i => i.stockLevel <= i.reorderLevel).map(i => ({
    ...i,
    deficit: i.reorderLevel - i.stockLevel,
    urgency: i.stockLevel === 0 ? 'Critical' : 'High'
  })).sort((a, b) => a.stockLevel - b.stockLevel);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Raw Materials Inventory</h2>
        <button onClick={() => { setIsEditing(false); setForm({ id: 0, name: '', unit: 'kg', stockLevel: 0, reorderLevel: 0 }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.Plus size={18} /> Add Ingredient
        </button>
      </div>
      
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('overview')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'overview' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Global Stock Overview</button>
        <button onClick={() => setActiveTab('batches')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'batches' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'batches' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Purchase Batches (FIFO)</button>
        <button onClick={() => setActiveTab('forecasting')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'forecasting' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'forecasting' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.TrendingUp size={18}/> Insights & Forecasting</button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ingredient Name</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unit</label><select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}><option value="kg">kg</option><option value="g">g</option><option value="L">L</option><option value="ml">ml</option><option value="pcs">pcs</option></select></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Stock</label><input required type="number" step="0.01" value={form.stockLevel} onChange={e => setForm({...form, stockLevel: parseFloat(e.target.value)})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Reorder Level</label><input required type="number" step="0.01" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: parseFloat(e.target.value)})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{isEditing ? 'Update' : 'Save'}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <>
          {activeTab === 'overview' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <thead><tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '1rem' }}>Ingredient</th><th style={{ padding: '1rem' }}>Stock Level</th><th style={{ padding: '1rem' }}>Reorder Level</th><th style={{ padding: '1rem' }}>Status</th><th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{ing.name}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{ing.stockLevel?.toFixed(2)} {ing.unit}</td>
                    <td style={{ padding: '1rem' }}>{ing.reorderLevel?.toFixed(2)} {ing.unit}</td>
                    <td style={{ padding: '1rem' }}>{ing.stockLevel <= ing.reorderLevel ? (<span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444' }}>Low Stock</span>) : (<span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#d1fae5', color: '#10b981' }}>Sufficient</span>)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}><button onClick={() => { setIsEditing(true); setForm(ing); setShowForm(true); }} style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}><Icons.Edit size={18} /></button><button onClick={() => handleDelete(ing.id)} style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Icons.Trash2 size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {activeTab === 'batches' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <thead><tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '1rem' }}>Batch ID</th><th style={{ padding: '1rem' }}>Ingredient</th><th style={{ padding: '1rem' }}>PO / Invoice No.</th><th style={{ padding: '1rem' }}>Received Qty</th><th style={{ padding: '1rem' }}>Cost per Unit</th><th style={{ padding: '1rem' }}>Expiry Date</th></tr></thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>BCH-{String(b.id).padStart(4, '0')}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{b.ingredient?.name}</td>
                    <td style={{ padding: '1rem', color: '#0284c7' }}>{b.purchaseOrder?.invoiceNumber || 'N/A'}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{b.initialQuantity} {b.ingredient?.unit}</td>
                    <td style={{ padding: '1rem' }}>₹{b.costPerUnit?.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{b.expiryDate ? (<span style={{ color: new Date(b.expiryDate) < new Date() ? '#ef4444' : '#64748b', fontWeight: new Date(b.expiryDate) < new Date() ? 600 : 400 }}>{b.expiryDate} {new Date(b.expiryDate) < new Date() ? '(Expired)' : ''}</span>) : (<span style={{ color: '#94a3b8' }}>None</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'forecasting' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}><Icons.AlertTriangle size={20} /> Expiring Soon (Next 7 Days)</h3>
                {expiringBatches.length > 0 ? (
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                    {expiringBatches.map(b => (
                      <li key={b.id} style={{ padding: '1rem 0', borderBottom: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{b.ingredient?.name}</strong> (BCH-{b.id})
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Expires: {b.expiryDate}</div>
                        </div>
                        <button style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Waste</button>
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: '#10b981' }}>No batches expiring in the next 7 days.</p>}
              </div>

              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}><Icons.ShoppingCart size={20} /> Suggested Reorders</h3>
                {suggestedReorders.length > 0 ? (
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                    {suggestedReorders.map((i, idx) => (
                      <li key={i.id} style={{ padding: '1rem 0', borderBottom: idx === suggestedReorders.length -1 ? 'none' : '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{i.name}</strong>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Current: {i.stockLevel} {i.unit} (Target: {i.reorderLevel * 2} {i.unit})</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontWeight: 600, color: i.urgency === 'Critical' ? '#ef4444' : '#f59e0b' }}>{i.urgency}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Order {(i.reorderLevel * 2 - i.stockLevel).toFixed(2)} {i.unit}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: '#10b981' }}>All stock levels are optimal.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
