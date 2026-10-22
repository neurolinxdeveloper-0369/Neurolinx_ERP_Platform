import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function WasteManagement() {
  const [wasteEntries, setWasteEntries] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    ingredientId: '',
    quantity: '',
    unit: 'kg',
    reason: 'Spoilage',
    costLost: '',
    staffName: '',
    dateRecorded: new Date().toISOString().split('T')[0]
  });
  const [dateFilter, setDateFilter] = useState('');

  const fetchData = () => {
    setIsLoading(true);
    let url = 'https://erp-api.neurolinx.in/api/inventory/waste';
    if (dateFilter) url += `?date=${dateFilter}`;
    
    Promise.all([
      apiFetch(url).then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json())
    ]).then(([w, i]) => {
      setWasteEntries(Array.isArray(w) ? w : []);
      setIngredients(Array.isArray(i) ? i : []);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [dateFilter]);

  const handleIngredientSelect = (ingId: string) => {
    const ing = ingredients.find(i => i.id === parseInt(ingId));
    if (ing) {
      const unit = ing.unit || 'kg';
      const qty = parseFloat(form.quantity) || 0;
      const unitCost = ing.costPerUnit || 0;
      setForm({
        ...form,
        ingredientId: ingId,
        unit,
        costLost: (qty * unitCost).toFixed(2)
      });
    } else {
      setForm({ ...form, ingredientId: ingId });
    }
  };

  const handleQuantityChange = (qtyStr: string) => {
    const qty = parseFloat(qtyStr) || 0;
    const ing = ingredients.find(i => i.id === parseInt(form.ingredientId));
    const unitCost = ing ? (ing.costPerUnit || 0) : 0;
    setForm({
      ...form,
      quantity: qtyStr,
      costLost: (qty * unitCost).toFixed(2)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ingredientId) return;

    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/inventory/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
        alert("Waste logged and stock deducted successfully!");
      } else {
        alert("Failed to log waste entry");
      }
    } catch (e: any) {
      alert(e?.message || "Error logging waste entry");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Waste & Spoilage Management</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Record damaged, expired, or spoiled ingredients and track financial loss</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              style={{ padding: '0.6rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={() => {
              setForm({
                ingredientId: '',
                quantity: '',
                unit: 'kg',
                reason: 'Spoilage',
                costLost: '',
                staffName: '',
                dateRecorded: new Date().toISOString().split('T')[0]
              });
              setShowForm(true);
            }}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Icons.Plus size={18} /> Log Waste
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#fee2e2', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <h3 style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.TrendingDown size={18} /> Total Cost Lost
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold', color: '#7f1d1d' }}>
            ₹{wasteEntries.reduce((sum, w) => sum + (parseFloat(w?.costLost) || 0), 0).toFixed(2)}
          </p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Waste Incidents</span>
          <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem', color: '#0f172a' }}>{wasteEntries.length}</h3>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Primary Reason</span>
          <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', color: '#334155' }}>
            {wasteEntries.length > 0 ? 'Spoilage / Prep Loss' : 'None Recorded'}
          </h3>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '10px', width: '90%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Log Waste / Spoilage</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Raw Material Ingredient *</label>
                <select
                  required
                  value={form.ingredientId}
                  onChange={e => handleIngredientSelect(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select Raw Material</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.stockLevel} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Quantity Wasted *</label>
                  <input
                    required
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={form.quantity}
                    onChange={e => handleQuantityChange(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Unit</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reason Code *</label>
                  <select
                    required
                    value={form.reason}
                    onChange={e => setForm({...form, reason: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Spoilage">Spoilage</option>
                    <option value="Spilled">Spilled</option>
                    <option value="Expired">Expired</option>
                    <option value="Burnt/Overcooked">Burnt/Overcooked</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Responsible Staff Member</label>
                  <input
                    type="text"
                    placeholder="Staff name"
                    value={form.staffName}
                    onChange={e => setForm({...form, staffName: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Estimated Cost Lost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.costLost}
                    onChange={e => setForm({...form, costLost: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Date *</label>
                  <input
                    required
                    type="date"
                    value={form.dateRecorded}
                    onChange={e => setForm({...form, dateRecorded: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save Waste Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waste Entries Table */}
      {isLoading ? <div>Loading Waste Records...</div> : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Raw Material</th>
                <th style={{ padding: '1rem' }}>Quantity Wasted</th>
                <th style={{ padding: '1rem' }}>Reason</th>
                <th style={{ padding: '1rem' }}>Responsible Staff</th>
                <th style={{ padding: '1rem' }}>Estimated Cost Lost</th>
              </tr>
            </thead>
            <tbody>
              {wasteEntries.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{w.dateRecorded || 'N/A'}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{w.ingredient?.name || 'N/A'}</td>
                  <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 600 }}>
                    {w.quantity} {w.unit || w.ingredient?.unit || 'kg'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {w.reason || 'Spoilage'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#475569' }}>{w.staffName || 'Staff'}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#dc2626' }}>
                    ₹{Number(w?.costLost || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {wasteEntries.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No waste entries found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
