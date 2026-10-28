import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';

interface Category { id: number; name: string; }
interface Dish { 
  id: number; 
  name: string; 
  price: number; 
  isAvailable: boolean; 
  category: Category | null;
  imageBase64?: string;
  isTodaysSpecial?: boolean;
}

interface DishCostSummary {
  dishId: number;
  dishName: string;
  price: number;
  categoryName: string;
  hasRecipe: boolean;
  recipeCost: number;
  grossMargin: number;
  grossMarginPercent: number;
  servingsAvailable: number;
  stockStatus: string;
  itemCount: number;
}

export default function RestaurantInventory() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [costSummaries, setCostSummaries] = useState<DishCostSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'Dishes' | 'Categories'>('Dishes');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'NO_RECIPE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'READY'>('ALL');

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Dish Form State
  const [dishForm, setDishForm] = useState({ id: 0, name: '', price: '', categoryId: '', imageBase64: '', isTodaysSpecial: false });
  const [isEditingDish, setIsEditingDish] = useState(false);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/categories')
        .then(res => res.ok ? res.json() : [])
        .catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes')
        .then(res => res.ok ? res.json() : [])
        .catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/recipes/dish-cost-summary')
        .then(res => res.ok ? res.json() : [])
        .catch(() => [])
    ]).then(([cats, items, summaries]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setDishes(Array.isArray(items) ? items : []);
      setCostSummaries(Array.isArray(summaries) ? summaries : []);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setCategories([]);
      setDishes([]);
      setCostSummaries([]);
      setIsLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const deleteCategory = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await apiFetch(`https://erp-api.neurolinx.in/api/pos/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteDish = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    try {
      await apiFetch(`https://erp-api.neurolinx.in/api/pos/dishes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

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

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isEditingDish ? `https://erp-api.neurolinx.in/api/pos/dishes/${dishForm.id}` : 'https://erp-api.neurolinx.in/api/pos/dishes';
    const method = isEditingDish ? 'PUT' : 'POST';
    
    apiFetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: dishForm.name, 
        price: parseFloat(dishForm.price), 
        categoryId: parseInt(dishForm.categoryId),
        imageBase64: dishForm.imageBase64,
        isTodaysSpecial: dishForm.isTodaysSpecial
      })
    }).then(() => {
      resetDishForm();
      fetchData();
    });
  };

  const resetDishForm = () => {
    setDishForm({ id: 0, name: '', price: '', categoryId: '', imageBase64: '', isTodaysSpecial: false });
    setIsEditingDish(false);
    setShowForm(false);
  };

  const handleEditDish = (dish: Dish) => {
    setDishForm({
      id: dish.id,
      name: dish.name,
      price: dish.price.toString(),
      categoryId: dish.category ? dish.category.id.toString() : '',
      imageBase64: dish.imageBase64 || '',
      isTodaysSpecial: dish.isTodaysSpecial || false
    });
    setIsEditingDish(true);
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDishForm({ ...dishForm, imageBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAvailability = (dishId: number, currentStatus: boolean) => {
    apiFetch(`https://erp-api.neurolinx.in/api/pos/dishes/${dishId}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !currentStatus })
    }).then(fetchData);
  };

  // Safe array references
  const safeCostSummaries = Array.isArray(costSummaries) ? costSummaries : [];
  const safeDishes = Array.isArray(dishes) ? dishes : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Map summaries by dishId
  const summaryMap = new Map<number, DishCostSummary>();
  safeCostSummaries.forEach(s => {
    if (s && s.dishId) summaryMap.set(s.dishId, s);
  });

  // Compute KPI metrics
  const totalDishes = safeDishes.length;
  const configuredRecipesCount = safeCostSummaries.filter(s => s && s.hasRecipe).length;
  const outOfStockRecipesCount = safeCostSummaries.filter(s => s && s.hasRecipe && s.servingsAvailable <= 0).length;
  const lowStockRecipesCount = safeCostSummaries.filter(s => s && s.hasRecipe && s.servingsAvailable > 0 && s.servingsAvailable <= 5).length;
  
  const avgGrossMargin = configuredRecipesCount > 0 
    ? (safeCostSummaries.filter(s => s && s.hasRecipe).reduce((acc, curr) => acc + (curr.grossMarginPercent || 0), 0) / configuredRecipesCount).toFixed(1)
    : '0.0';

  // Filter dishes
  const filteredDishes = safeDishes.filter(d => {
    if (!d) return false;
    const matchesSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const summary = summaryMap.get(d.id);
    if (filterMode === 'NO_RECIPE') return !summary?.hasRecipe;
    if (filterMode === 'OUT_OF_STOCK') return summary?.hasRecipe && summary.servingsAvailable <= 0;
    if (filterMode === 'LOW_STOCK') return summary?.hasRecipe && summary.servingsAvailable > 0 && summary.servingsAvailable <= 5;
    if (filterMode === 'READY') return summary?.hasRecipe && summary.servingsAvailable > 5;
    return true;
  });

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading Menu & Inventory Intelligence...</div>;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>Menu & Food Cost Intelligence</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Sync dishes with recipes, live raw material stock, and profit margins.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/res-recipes')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', color: '#334155', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, cursor: 'pointer' }}>
            <Icons.BookOpen size={18} /> Manage Recipes
          </button>
          <button 
            onClick={() => { resetDishForm(); setShowForm(!showForm); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            <Icons.Plus size={18} /> Add {activeTab === 'Dishes' ? 'Dish' : 'Category'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Total Menu Dishes</span>
            <Icons.UtensilsCrossed size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{totalDishes}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Across {categories.length} categories</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Recipes Configured</span>
            <Icons.Layers size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
            {configuredRecipesCount} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>/ {totalDishes}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: configuredRecipesCount === totalDishes ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>
            {totalDishes - configuredRecipesCount} dishes without recipe
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Avg Gross Margin</span>
            <Icons.TrendingUp size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{avgGrossMargin}%</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Based on active recipe costs</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Kitchen Stock Readiness</span>
            <Icons.AlertTriangle size={18} color={outOfStockRecipesCount > 0 ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: outOfStockRecipesCount > 0 ? '#ef4444' : '#10b981' }}>
            {outOfStockRecipesCount} Out of Stock
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {lowStockRecipesCount} items low stock
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Icons.Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search dishes by name or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {activeTab === 'Dishes' && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setFilterMode('ALL')}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: filterMode === 'ALL' ? '#1e293b' : 'white', color: filterMode === 'ALL' ? 'white' : '#64748b' }}>
              All ({dishes.length})
            </button>
            <button 
              onClick={() => setFilterMode('READY')}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: filterMode === 'READY' ? '#10b981' : 'white', color: filterMode === 'READY' ? 'white' : '#64748b' }}>
              Ready to Cook
            </button>
            <button 
              onClick={() => setFilterMode('LOW_STOCK')}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: filterMode === 'LOW_STOCK' ? '#f59e0b' : 'white', color: filterMode === 'LOW_STOCK' ? 'white' : '#64748b' }}>
              Low Stock ({lowStockRecipesCount})
            </button>
            <button 
              onClick={() => setFilterMode('OUT_OF_STOCK')}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: filterMode === 'OUT_OF_STOCK' ? '#ef4444' : 'white', color: filterMode === 'OUT_OF_STOCK' ? 'white' : '#64748b' }}>
              Out of Stock ({outOfStockRecipesCount})
            </button>
            <button 
              onClick={() => setFilterMode('NO_RECIPE')}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: filterMode === 'NO_RECIPE' ? '#6366f1' : 'white', color: filterMode === 'NO_RECIPE' ? 'white' : '#64748b' }}>
              No Recipe ({totalDishes - configuredRecipesCount})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => { setActiveTab('Dishes'); setShowForm(false); }} style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', fontWeight: 600, color: activeTab === 'Dishes' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'Dishes' ? '2px solid #0284c7' : '2px solid transparent', cursor: 'pointer' }}>
          Dishes ({safeDishes.length})
        </button>
        <button onClick={() => { setActiveTab('Categories'); setShowForm(false); }} style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', fontWeight: 600, color: activeTab === 'Categories' ? '#0284c7' : '#64748b', borderBottom: activeTab === 'Categories' ? '2px solid #0284c7' : '2px solid transparent', cursor: 'pointer' }}>
          Categories ({safeCategories.length})
        </button>
      </div>

      {/* Forms */}
      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>{isEditingDish ? 'Edit Dish' : `Create New ${activeTab === 'Dishes' ? 'Dish' : 'Category'}`}</h3>
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
            <form onSubmit={handleSaveDish} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Dish Name</label>
                  <input required type="text" value={dishForm.name} onChange={e => setDishForm({ ...dishForm, name: e.target.value })} placeholder="e.g. Butter Chicken" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ width: '150px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Selling Price (₹)</label>
                  <input required type="number" step="0.01" value={dishForm.price} onChange={e => setDishForm({ ...dishForm, price: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ width: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Category</label>
                  <select required value={dishForm.categoryId} onChange={e => setDishForm({ ...dishForm, categoryId: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select Category</option>
                    {safeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Dish Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {dishForm.imageBase64 && (
                      <img src={dishForm.imageBase64} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                    )}
                    <label style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', border: '1px dashed #cbd5e1' }}>
                      <Icons.Upload size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Upload Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={dishForm.isTodaysSpecial} onChange={e => setDishForm({ ...dishForm, isTodaysSpecial: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Mark as Today's Special</span>
                </label>
                
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <button type="submit" style={{ backgroundColor: '#0284c7', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    {isEditingDish ? 'Update Dish' : 'Save Dish'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Lists */}
      {activeTab === 'Categories' ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {safeCategories.length === 0 ? (
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
                {safeCategories.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{safeDishes.filter(d => d.category?.id === c.id).length} dishes</td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => deleteCategory(c.id)} title="Delete Category" style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                        <Icons.Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {filteredDishes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              {searchQuery || filterMode !== 'ALL' ? 'No dishes match the selected filter.' : 'No dishes created yet.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Dish</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Selling Price</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Recipe Cost</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Gross Margin</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Kitchen Readiness</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Menu Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.map(d => {
                  const summary = summaryMap.get(d.id);
                  const hasRecipe = summary?.hasRecipe;
                  const recipeCost = summary ? Number(summary.recipeCost || 0) : 0;
                  const grossMargin = summary ? Number(summary.grossMargin || 0) : 0;
                  const marginPercent = summary ? Number(summary.grossMarginPercent || 0) : 0;
                  const servingsAvailable = summary ? summary.servingsAvailable : 0;

                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {d.imageBase64 ? (
                          <img src={d.imageBase64} alt={d.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icons.Utensils size={18} color="#94a3b8" />
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{d.name}</span>
                            {d.isTodaysSpecial && (
                              <span style={{ backgroundColor: '#fef08a', color: '#854d0e', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>
                                SPECIAL
                              </span>
                            )}
                          </div>
                          {hasRecipe ? (
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{summary?.itemCount} ingredients linked</span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No ingredients linked</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                        {d.category?.name || 'Uncategorized'}
                      </td>

                      <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>
                        ₹{Number(d.price).toFixed(2)}
                      </td>

                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {hasRecipe ? (
                          <span style={{ color: '#475569', fontWeight: 600 }}>
                            ₹{recipeCost.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                            Unconfigured
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {hasRecipe ? (
                          <div>
                            <span style={{ color: grossMargin >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                              ₹{grossMargin.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.35rem' }}>
                              ({marginPercent.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {hasRecipe ? (
                          servingsAvailable <= 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <Icons.AlertOctagon size={14} /> 0 Servings (Stock Out)
                            </span>
                          ) : servingsAvailable <= 5 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <Icons.AlertTriangle size={14} /> {servingsAvailable} Servings (Low)
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <Icons.CheckCircle size={14} /> {servingsAvailable} Servings Ready
                            </span>
                          )
                        ) : (
                          <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
                            Recipe Missing
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span 
                          style={{ 
                            backgroundColor: d.isAvailable ? '#dcfce7' : '#fee2e2', 
                            color: d.isAvailable ? '#166534' : '#991b1b', 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '999px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            cursor: 'pointer' 
                          }} 
                          onClick={() => toggleAvailability(d.id, d.isAvailable)}
                          title="Click to toggle availability"
                        >
                          {d.isAvailable ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            onClick={() => navigate('/res-recipes')} 
                            title="Configure / View Recipe" 
                            style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f3e8ff', color: '#7e22ce', border: 'none', cursor: 'pointer' }}
                          >
                            <Icons.BookOpen size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditDish(d)} 
                            title="Edit Dish" 
                            style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', cursor: 'pointer' }}
                          >
                            <Icons.Edit size={16} />
                          </button>
                          <button 
                            onClick={() => deleteDish(d.id)} 
                            title="Delete Dish" 
                            style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                          >
                            <Icons.Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
