import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Recipes() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dishSummaries, setDishSummaries] = useState<any[]>([]);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/recipes/dish-cost-summary').then(res => res.json())
    ]).then(([d, i, s]) => {
      setDishes(Array.isArray(d) ? d : []);
      setIngredients(Array.isArray(i) ? i : []);
      setDishSummaries(Array.isArray(s) ? s : []);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const loadRecipe = (dish: any) => {
    setSelectedDish(dish);
    apiFetch(`https://erp-api.neurolinx.in/api/inventory/recipes/${dish.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const items = data.map((d: any) => ({
            ingredientId: d.ingredient?.id?.toString() || '',
            quantityRequired: d.quantityRequired || 0,
            unit: d.unit || d.ingredient?.unit || 'kg'
          }));
          setRecipeItems(items);
        } else {
          setRecipeItems([{ ingredientId: '', quantityRequired: 0, unit: 'kg' }]);
        }
      })
      .catch(err => {
        console.error(err);
        setRecipeItems([{ ingredientId: '', quantityRequired: 0, unit: 'kg' }]);
      });
  };

  const handleAddItem = () => {
    setRecipeItems([...recipeItems, { ingredientId: '', quantityRequired: 0, unit: 'kg' }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...recipeItems];
    newItems[index][field] = value;
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === parseInt(value));
      if (ing) {
        newItems[index].unit = ing.unit || 'kg';
      }
    }
    setRecipeItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDish) return;
    
    // Filter out empty items
    const validItems = recipeItems.filter(item => item.ingredientId !== '' && parseFloat(item.quantityRequired) > 0);
    
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/recipes/${selectedDish.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validItems)
      });
      if (res.ok) {
        alert("Recipe saved successfully!");
        fetchData();
      } else {
        alert("Failed to save recipe");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to save recipe");
    }
  };

  // Helper unit converter
  const convertUnit = (qty: number, fromUnit: string, toUnit: string): number => {
    let f = (fromUnit || '').trim().toLowerCase();
    let t = (toUnit || '').trim().toLowerCase();
    if (f === t) return qty;
    if (f === 'g' && t === 'kg') return qty / 1000;
    if (f === 'kg' && t === 'g') return qty * 1000;
    if (f === 'ml' && t === 'l') return qty / 1000;
    if (f === 'l' && t === 'ml') return qty * 1000;
    return qty;
  };

  // Live Recipe Calculations
  const calculatedStats = useMemo(() => {
    if (!selectedDish) return { totalCost: 0, margin: 0, marginPct: 0, capacity: 0, itemDetails: [] };

    let totalCost = 0;
    let minCapacity = Infinity;

    const itemDetails = recipeItems.map(item => {
      const ing = ingredients.find(i => i.id === parseInt(item.ingredientId));
      if (!ing) return { ...item, cost: 0, available: 0, hasDeficit: false };

      const qty = parseFloat(item.quantityRequired) || 0;
      const convertedQty = convertUnit(qty, item.unit || ing.unit, ing.unit);
      const unitCost = ing.costPerUnit || 0;
      const lineCost = convertedQty * unitCost;
      totalCost += lineCost;

      const currentStock = ing.stockLevel || 0;
      const possibleServings = convertedQty > 0 ? Math.floor(currentStock / convertedQty) : 0;
      if (possibleServings < minCapacity) minCapacity = possibleServings;

      return {
        ...item,
        ingName: ing.name,
        ingUnit: ing.unit,
        lineCost,
        currentStock,
        possibleServings,
        hasDeficit: currentStock < convertedQty
      };
    });

    const dishPrice = selectedDish.price || 0;
    const margin = dishPrice - totalCost;
    const marginPct = dishPrice > 0 ? (margin / dishPrice) * 100 : 0;
    const capacity = minCapacity === Infinity ? 0 : Math.max(0, minCapacity);

    return { totalCost, margin, marginPct, capacity, itemDetails };
  }, [selectedDish, recipeItems, ingredients]);

  const filteredDishes = dishes.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.category?.name && d.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Recipe & Food Cost Management</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Map raw materials to dishes, track ingredient portions, margins, and prepare readiness</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side: Dish Selector */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Select Dish</h3>
            <input
              type="text"
              placeholder="Search dish or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          {isLoading ? <div>Loading dishes...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
              {filteredDishes.map(dish => {
                const isSelected = selectedDish?.id === dish.id;
                const summary = dishSummaries.find(s => s.dishId === dish.id);

                return (
                  <button
                    key={dish.id}
                    onClick={() => loadRecipe(dish)}
                    style={{
                      padding: '0.85rem',
                      textAlign: 'left',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#f0f9ff' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{dish.name}</span>
                      <span style={{ fontWeight: 600, color: '#0284c7' }}>₹{(dish.price || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>{dish.category?.name || 'General'}</span>
                      {summary && summary.hasRecipe ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>Food Cost: ₹{Number(summary.recipeCost || 0).toFixed(2)} ({Number(summary.grossMarginPercent || 0).toFixed(0)}% Margin)</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No Recipe Mapped</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredDishes.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>No dishes found.</div>}
            </div>
          )}
        </div>

        {/* Right Side: Recipe Builder */}
        <div style={{ flex: 2, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          {selectedDish ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recipe for {selectedDish.name}</h3>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Selling Price: ₹{(selectedDish.price || 0).toFixed(2)} per serving</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <Icons.Plus size={16} /> Add Ingredient
                </button>
              </div>

              {/* Recipe Cost & Profit Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Ingredient Cost</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626' }}>₹{calculatedStats.totalCost.toFixed(2)}</span>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Gross Profit</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669' }}>₹{calculatedStats.margin.toFixed(2)}</span>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Margin %</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: calculatedStats.marginPct < 40 ? '#b45309' : '#059669' }}>
                    {calculatedStats.marginPct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Kitchen Readiness</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: calculatedStats.capacity <= 0 ? '#dc2626' : '#0284c7' }}>
                    {calculatedStats.capacity} servings
                  </span>
                </div>
              </div>

              {recipeItems.length === 0 && (
                <div style={{ color: '#64748b', marginBottom: '1.5rem', textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  No raw materials added yet. Click "+ Add Ingredient" above.
                </div>
              )}

              {/* Items List */}
              {recipeItems.map((item, idx) => {
                const detail = calculatedStats.itemDetails[idx] || {};
                return (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 3 }}>
                      <select
                        required
                        value={item.ingredientId}
                        onChange={e => handleItemChange(idx, 'ingredientId', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">Select Raw Material</option>
                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.stockLevel} {i.unit})</option>)}
                      </select>
                    </div>

                    <div style={{ flex: 1.5 }}>
                      <input
                        required
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="Portion"
                        value={item.quantityRequired}
                        onChange={e => handleItemChange(idx, 'quantityRequired', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <select
                        value={item.unit}
                        onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>

                    <div style={{ flex: 1.5, fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      ₹{(detail.lineCost || 0).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Icons.Trash2 size={18} />
                    </button>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Icons.Save size={18} /> Save Recipe Mapping
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '0.85rem', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '0.85rem', color: '#166534', border: '1px solid #bbf7d0' }}>
                <Icons.CheckCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                When a customer orders <b>{selectedDish.name}</b> in POS or KDS, the mapped portions are automatically deducted from Raw Materials and recorded in the auditable stock ledger.
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#94a3b8' }}>
              <Icons.ChefHat size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Select a dish from the left to configure and manage its recipe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
