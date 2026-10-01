import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Recipes() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json())
    ]).then(([d, i]) => {
      setDishes(d); setIngredients(i); setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const loadRecipe = (dish: any) => {
    setSelectedDish(dish);
    apiFetch(`https://erp-api.neurolinx.in/api/inventory/recipes/${dish.id}`)
      .then(res => res.json())
      .then(data => {
        const items = data.map((d: any) => ({ ingredientId: d.ingredient.id, quantityRequired: d.quantityRequired }));
        setRecipeItems(items.length > 0 ? items : [{ ingredientId: '', quantityRequired: 0 }]);
      });
  };

  const handleAddItem = () => {
    setRecipeItems([...recipeItems, { ingredientId: '', quantityRequired: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...recipeItems];
    newItems[index][field] = value;
    setRecipeItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDish) return;
    
    // Filter out empty items
    const validItems = recipeItems.filter(item => item.ingredientId !== '' && item.quantityRequired > 0);
    
    apiFetch(`https://erp-api.neurolinx.in/api/inventory/recipes/${selectedDish.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validItems)
    }).then(() => {
      alert("Recipe saved successfully!");
      setSelectedDish(null);
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Recipe & Cost Management</h2>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Left Side: Dish List */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Select Dish</h3>
          {isLoading ? <div>Loading...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => loadRecipe(dish)}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: selectedDish?.id === dish.id ? '#e0f2fe' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{dish.name}</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>₹{dish.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Recipe Builder */}
        <div style={{ flex: 2, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          {selectedDish ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0 }}>Recipe for {selectedDish.name}</h3>
                <button type="button" onClick={handleAddItem} style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Plus size={16} /> Add Ingredient
                </button>
              </div>

              {recipeItems.length === 0 && <div style={{ color: '#64748b', marginBottom: '2rem' }}>No ingredients mapped yet.</div>}

              {recipeItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Ingredient</label>
                    <select required value={item.ingredientId} onChange={e => handleItemChange(idx, 'ingredientId', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option value="">Select Ingredient</option>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Quantity Required</label>
                    <input required type="number" step="0.001" min="0" value={item.quantityRequired} onChange={e => handleItemChange(idx, 'quantityRequired', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginTop: '1.25rem' }}>
                    <button type="button" onClick={() => handleRemoveItem(idx)} style={{ padding: '0.75rem', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Icons.Trash2 size={20} /></button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="submit" style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save Recipe Mapping</button>
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem', color: '#475569' }}>
                <Icons.Info size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                When a customer orders <b>{selectedDish.name}</b>, the exact quantities mapped here will be automatically deducted from your Raw Materials stock in real-time.
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <Icons.ChefHat size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Select a dish from the left to build its recipe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
