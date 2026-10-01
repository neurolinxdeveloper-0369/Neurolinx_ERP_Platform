import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';


interface Ingredient {
  id: number;
  name: string;
  stockLevel: number;
  unit: string;
}

export default function RawMaterials() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', stockLevel: 0, unit: 'kg' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchIngredients = () => {
    setIsLoading(true);
    apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients')
      .then(res => res.json())
      .then(data => { setIngredients(data); setIsLoading(false); })
      .catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/inventory/ingredients/${form.id}` : 'https://erp-api.neurolinx.in/api/inventory/ingredients';
    const method = isEditing ? 'PUT' : 'POST';
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(() => {
      setShowForm(false);
      fetchIngredients();
    });
  };

  const deleteIngredient = (id: number) => {
    if (!window.confirm("Delete ingredient?")) return;
    apiFetch(`https://erp-api.neurolinx.in/api/inventory/ingredients/${id}`, { method: 'DELETE' }).then(fetchIngredients);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Raw Materials Inventory</h2>
        <button onClick={() => { setIsEditing(false); setForm({ id: 0, name: '', stockLevel: 0, unit: 'kg' }); setShowForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Add Ingredient
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ flex: 1, padding: '0.5rem' }} required />
            <input type="number" step="0.01" placeholder="Stock Level" value={form.stockLevel} onChange={e => setForm({...form, stockLevel: parseFloat(e.target.value)})} style={{ padding: '0.5rem' }} required />
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={{ padding: '0.5rem' }}>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="liter">liter</option>
              <option value="ml">ml</option>
              <option value="pcs">pcs</option>
            </select>
            <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}>Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Stock Level</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ing => (
              <tr key={ing.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem' }}>{ing.name}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{ing.stockLevel} {ing.unit}</td>
                <td style={{ padding: '1rem' }}>
                  {ing.stockLevel < 5 ? <span style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>Low Stock</span> : <span style={{ color: '#10b981', backgroundColor: '#d1fae5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>In Stock</span>}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => { setForm(ing); setIsEditing(true); setShowForm(true); }} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}>Edit</button>
                  <button onClick={() => deleteIngredient(ing.id)} style={{ color: '#ef4444', padding: '0.25rem 0.5rem' }}>Delete</button>
                </td>
              </tr>
            ))}
            {ingredients.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>No ingredients found.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
