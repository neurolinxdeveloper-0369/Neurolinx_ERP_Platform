import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function WasteManagement() {
  const [wasteEntries, setWasteEntries] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({ ingredientId: '', quantity: '', reason: 'Spoilage', costLost: '', dateRecorded: new Date().toISOString().split('T')[0] });
  const [dateFilter, setDateFilter] = useState('');

  const fetchData = () => {
    setIsLoading(true);
    let url = 'https://erp-api.neurolinx.in/api/inventory/waste';
    if (dateFilter) url += `?date=${dateFilter}`;
    
    Promise.all([
      apiFetch(url).then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json())
    ]).then(([w, i]) => {
      setWasteEntries(w); setIngredients(i); setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, [dateFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apiFetch('https://erp-api.neurolinx.in/api/inventory/waste', {
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
        <h2>Waste & Spoilage Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <button onClick={() => { setDateFilter(''); fetchData(); }} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { setForm({ ingredientId: '', quantity: '', reason: 'Spoilage', costLost: '', dateRecorded: new Date().toISOString().split('T')[0] }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Log Waste
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ingredient</label>
              <select required value={form.ingredientId} onChange={e => setForm({...form, ingredientId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <option value="">Select Ingredient</option>
                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Quantity</label>
              <input required type="number" step="0.01" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Reason Code</label>
              <select required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <option value="Spoilage">Spoilage</option>
                <option value="Spilled">Spilled</option>
                <option value="Expired">Expired</option>
                <option value="Burnt/Overcooked">Burnt/Overcooked</option>
                <option value="Dropped">Dropped</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Est. Cost Lost</label>
              <input type="number" step="0.01" value={form.costLost} onChange={e => setForm({...form, costLost: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Date</label>
              <input required type="date" value={form.dateRecorded} onChange={e => setForm({...form, dateRecorded: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Entry</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </form>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, backgroundColor: '#fee2e2', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.TrendingDown size={18} /> Total Cost Lost</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#7f1d1d' }}>
                ₹{wasteEntries.reduce((sum, w) => sum + (w.costLost || 0), 0).toFixed(2)}
              </p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
              <h3 style={{ margin: 0, color: '#b45309', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.AlertTriangle size={18} /> Total Incidents</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
                {wasteEntries.length} entries
              </p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Ingredient</th>
                <th style={{ padding: '1rem' }}>Quantity Lost</th>
                <th style={{ padding: '1rem' }}>Reason</th>
                <th style={{ padding: '1rem' }}>Cost Lost</th>
              </tr>
            </thead>
            <tbody>
              {wasteEntries.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>{w.dateRecorded}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{w.ingredient?.name}</td>
                  <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 600 }}>-{w.quantity} {w.ingredient?.unit}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {w.reason}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>₹{w.costLost?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
              {wasteEntries.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>No waste recorded for this period.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
