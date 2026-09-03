import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';

interface Category { id: number; name: string; }
interface Dish { id: number; name: string; price: number; isAvailable: boolean; category: Category | null; }

export default function RestaurantInventory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [activeTab, setActiveTab] = useState<'Dishes' | 'Categories'>('Dishes');
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newDish, setNewDish] = useState({ name: '', price: '', categoryId: '' });

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/categories').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.json())
    ]).then(([cats, items]) => {
      setCategories(cats);
      setDishes(items);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    apiFetch('https://erp-api.neurolinx.in/api/pos/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName })
    }).then(() => {
      setNewCategoryName('');
      setShowForm(false);
      fetchData();
    });
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    apiFetch('https://erp-api.neurolinx.in/api/pos/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newDish.name, 
        price: parseFloat(newDish.price), 
        categoryId: parseInt(newDish.categoryId) 
      })
    }).then(() => {
      setNewDish({ name: '', price: '', categoryId: '' });
      setShowForm(false);
      fetchData();
    });
  };

  const toggleAvailability = (dishId: number, currentStatus: boolean) => {
    apiFetch(`https://erp-api.neurolinx.in/api/pos/dishes/${dishId}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !currentStatus })
    }).then(fetchData);
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading Menu Management...</div>;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>Menu Management</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage your restaurant's dishes and categories.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          <Icons.Plus size={18} /> Add {activeTab === 'Dishes' ? 'Dish' : 'Category'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('Dishes')} style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', fontWeight: 600, color: activeTab === 'Dishes' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'Dishes' ? '2px solid #0284c7' : '2px solid transparent', cursor: 'pointer' }}>
          Dishes ({dishes.length})
        </button>
        <button onClick={() => setActiveTab('Categories')} style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', fontWeight: 600, color: activeTab === 'Categories' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'Categories' ? '2px solid #0284c7' : '2px solid transparent', cursor: 'pointer' }}>
          Categories ({categories.length})
        </button>
      </div>

      {/* Forms */}
      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Create New {activeTab === 'Dishes' ? 'Dish' : 'Category'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icons.X size={20} /></button>
          </div>
          
          {activeTab === 'Categories' ? (
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Category Name</label>
                <input required type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Main Course" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Category</button>
            </form>
          ) : (
            <form onSubmit={handleCreateDish} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Dish Name</label>
                <input required type="text" value={newDish.name} onChange={e => setNewDish({ ...newDish, name: e.target.value })} placeholder="e.g. Butter Chicken" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div style={{ width: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Price (₹)</label>
                <input required type="number" step="0.01" value={newDish.price} onChange={e => setNewDish({ ...newDish, price: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div style={{ width: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Category</label>
                <select required value={newDish.categoryId} onChange={e => setNewDish({ ...newDish, categoryId: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Dish</button>
            </form>
          )}
        </div>
      )}

      {/* Lists */}
      {activeTab === 'Categories' ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {categories.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No categories created yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Category Name</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Items Count</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{dishes.filter(d => d.category?.id === c.id).length} dishes</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Icons.Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {dishes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No dishes created yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Dish Name</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Price</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Availability</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{d.category?.name || 'Uncategorized'}</td>
                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 600 }}>₹{d.price}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ backgroundColor: d.isAvailable ? '#dcfce7' : '#fee2e2', color: d.isAvailable ? '#166534' : '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {d.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => toggleAvailability(d.id, d.isAvailable)}
                        style={{ background: d.isAvailable ? 'none' : '#0284c7', border: d.isAvailable ? '1px solid #e2e8f0' : 'none', color: d.isAvailable ? '#64748b' : 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
                        {d.isAvailable ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
