import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Recipes() {
  const [activeTab, setActiveTab] = useState<'recipes' | 'variance' | 'menu-matrix'>('recipes');

  // Recipe Formulation State
  const [dishes, setDishes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [dishSummaries, setDishSummaries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Variance State (Phase 2)
  const [varianceData, setVarianceData] = useState<any>({ summary: null, ingredientVariances: [] });
  const [isLoadingVariance, setIsLoadingVariance] = useState(false);
  const [varianceSearch, setVarianceSearch] = useState('');

  // Menu Engineering Matrix (BCG) State (Phase 2)
  const [matrixData, setMatrixData] = useState<any>({ summary: null, matrix: [] });
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<string>('ALL');

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/recipes/dish-cost-summary').then(res => res.ok ? res.json() : []).catch(() => [])
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

  const fetchVariance = () => {
    setIsLoadingVariance(true);
    apiFetch('https://erp-api.neurolinx.in/api/inventory/analytics/variance')
      .then(res => res.ok ? res.json() : { summary: null, ingredientVariances: [] })
      .then(data => {
        setVarianceData(data || { summary: null, ingredientVariances: [] });
        setIsLoadingVariance(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingVariance(false);
      });
  };

  const fetchMatrix = () => {
    setIsLoadingMatrix(true);
    apiFetch('https://erp-api.neurolinx.in/api/inventory/analytics/menu-matrix')
      .then(res => res.ok ? res.json() : { summary: null, matrix: [] })
      .then(data => {
        setMatrixData(data || { summary: null, matrix: [] });
        setIsLoadingMatrix(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingMatrix(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'variance') {
      fetchVariance();
    } else if (activeTab === 'menu-matrix') {
      fetchMatrix();
    }
  }, [activeTab]);

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

    const validItems = recipeItems.filter(item => item.ingredientId !== '' && parseFloat(item.quantityRequired) > 0);

    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/recipes/${selectedDish.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validItems)
      });
      if (res.ok) {
        alert('Recipe saved successfully!');
        fetchData();
      } else {
        alert('Failed to save recipe');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to save recipe');
    }
  };

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

  const filteredVariances = (varianceData.ingredientVariances || []).filter((v: any) =>
    v.ingredientName.toLowerCase().includes(varianceSearch.toLowerCase())
  );

  const filteredMatrix = (matrixData.matrix || []).filter((m: any) => {
    if (selectedQuadrantFilter === 'ALL') return true;
    return (m.classification || '').toLowerCase() === selectedQuadrantFilter.toLowerCase();
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 700 }}>
              Recipes & Menu Engineering
            </h2>
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
              Phase 2 Intelligence
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Portion mapping, Theoretical vs. Actual COGS variance, and BCG matrix profitability optimization
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('recipes')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'recipes' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'recipes' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icons.ChefHat size={18} /> Recipe Formulation & Costing
        </button>

        <button
          onClick={() => setActiveTab('variance')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'variance' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'variance' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icons.Scale size={18} /> Theoretical vs. Actual COGS Variance
        </button>

        <button
          onClick={() => setActiveTab('menu-matrix')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'menu-matrix' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'menu-matrix' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icons.PieChart size={18} /> Menu Engineering (BCG) Matrix
        </button>
      </div>

      {/* TAB 1: RECIPE FORMULATION */}
      {activeTab === 'recipes' && (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left Side: Dish Selector */}
          <div style={{ flex: '1 1 320px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Select Dish</h3>
              <input
                type="text"
                placeholder="Search dish or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
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
          <div style={{ flex: '2 1 550px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '2rem' }}>
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

                {/* Summary Cards */}
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
      )}

      {/* TAB 2: THEORETICAL VS ACTUAL COGS VARIANCE (Phase 2) */}
      {activeTab === 'variance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Theoretical Food Cost</span>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#0369a1', fontSize: '1.5rem', fontWeight: 700 }}>
                ₹{((varianceData.summary?.totalTheoreticalCost) || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>Expected from POS Sales</span>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Actual Stock Usage Cost</span>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 700 }}>
                ₹{((varianceData.summary?.totalActualUsageCost) || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>Depleted from Inventory</span>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>Net Shrinkage / Variance Value</span>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#dc2626', fontSize: '1.5rem', fontWeight: 700 }}>
                ₹{((varianceData.summary?.totalVarianceCost) || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>Unaccounted Food Loss</span>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
              <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>Overall Variance %</span>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#b45309', fontSize: '1.5rem', fontWeight: 700 }}>
                {((varianceData.summary?.overallVariancePercent) || 0).toFixed(2)}%
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem', display: 'block' }}>Target Industry Benchmark &lt; 3.0%</span>
            </div>
          </div>

          {/* Variance Search & Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Icons.Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search raw material variance..."
                value={varianceSearch}
                onChange={e => setVarianceSearch(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
            <button
              onClick={fetchVariance}
              style={{ padding: '0.6rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Icons.RefreshCw size={14} /> Refresh Analysis
            </button>
          </div>

          {/* Variance Analysis Table */}
          {isLoadingVariance ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Calculating food cost variances...</div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Raw Material</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Unit Cost</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Theoretical Usage</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Actual Usage</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Discrepancy Qty</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Variance Cost (₹)</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Variance %</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Probable Root Cause</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariances.map((v: any) => {
                    const statusColors: any = {
                      CRITICAL_SHRINKAGE: { bg: '#fee2e2', color: '#dc2626' },
                      MODERATE_SHRINKAGE: { bg: '#fef3c7', color: '#b45309' },
                      SURPLUS_USAGE: { bg: '#e0f2fe', color: '#0369a1' },
                      OPTIMAL: { bg: '#d1fae5', color: '#047857' }
                    };
                    const color = statusColors[v.status] || { bg: '#f1f5f9', color: '#475569' };

                    return (
                      <tr key={v.ingredientId} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{v.ingredientName}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>₹{v.unitCost?.toFixed(2)} / {v.unit}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>{v.theoreticalUsage?.toFixed(2)} {v.unit}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{v.actualUsage?.toFixed(2)} {v.unit}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: v.varianceQty > 0 ? '#dc2626' : v.varianceQty < 0 ? '#0284c7' : '#059669' }}>
                          {v.varianceQty > 0 ? `+${v.varianceQty?.toFixed(2)}` : v.varianceQty?.toFixed(2)} {v.unit}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: v.varianceCost > 0 ? '#dc2626' : '#0f172a' }}>
                          ₹{v.varianceCost?.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                          {v.variancePercent?.toFixed(1)}%
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem' }}>
                          {v.possibleCause}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }}>
                            {v.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredVariances.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No variance discrepancy records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Best Practice Advice Card */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Icons.Lightbulb size={24} color="#166534" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
            <div style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
              <b>How to eliminate theoretical vs. actual COGS leakage:</b>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                <li><b>Over-portioning:</b> Enforce calibrated portion ladles, digital gram scales, and line cook training for top meat and cheese ingredients.</li>
                <li><b>Unrecorded Spoilage:</b> Mandate kitchen staff to register all prep trimmings and expired produce through the Waste Management module.</li>
                <li><b>Shrinkage / Pilferage:</b> Implement daily spot-checks and weekly physical cycle audits for high-value proteins and liquor.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MENU ENGINEERING (BCG) MATRIX (Phase 2) */}
      {activeTab === 'menu-matrix' && (
        isLoadingMatrix ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Analyzing menu engineering profitability matrix...</div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div
              onClick={() => setSelectedQuadrantFilter(selectedQuadrantFilter === 'STAR' ? 'ALL' : 'STAR')}
              style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: selectedQuadrantFilter === 'STAR' ? '2px solid #059669' : '1px solid #d1fae5', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>🌟 STARS (High Profit, High Vol)</span>
                <Icons.Star size={18} color="#059669" />
              </div>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#047857', fontSize: '1.6rem', fontWeight: 800 }}>
                {matrixData.summary?.starsCount || 0}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem', display: 'block' }}>Protect recipes & feature prominently</span>
            </div>

            <div
              onClick={() => setSelectedQuadrantFilter(selectedQuadrantFilter === 'PLOWHORSE' ? 'ALL' : 'PLOWHORSE')}
              style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: selectedQuadrantFilter === 'PLOWHORSE' ? '2px solid #0284c7' : '1px solid #bfdbfe', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>🐎 PLOWHORSES (Low Profit, High Vol)</span>
                <Icons.TrendingUp size={18} color="#0284c7" />
              </div>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#0369a1', fontSize: '1.6rem', fontWeight: 800 }}>
                {matrixData.summary?.plowhorsesCount || 0}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.25rem', display: 'block' }}>Re-portion slightly or increase price</span>
            </div>

            <div
              onClick={() => setSelectedQuadrantFilter(selectedQuadrantFilter === 'PUZZLE' ? 'ALL' : 'PUZZLE')}
              style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: selectedQuadrantFilter === 'PUZZLE' ? '2px solid #d97706' : '1px solid #fed7aa', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>❓ PUZZLES (High Profit, Low Vol)</span>
                <Icons.HelpCircle size={18} color="#d97706" />
              </div>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#b45309', fontSize: '1.6rem', fontWeight: 800 }}>
                {matrixData.summary?.puzzlesCount || 0}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem', display: 'block' }}>Promote with servers & combo bundles</span>
            </div>

            <div
              onClick={() => setSelectedQuadrantFilter(selectedQuadrantFilter === 'DOG' ? 'ALL' : 'DOG')}
              style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: selectedQuadrantFilter === 'DOG' ? '2px solid #dc2626' : '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700 }}>🐕 DOGS (Low Profit, Low Vol)</span>
                <Icons.AlertTriangle size={18} color="#dc2626" />
              </div>
              <h3 style={{ margin: '0.4rem 0 0 0', color: '#b91c1c', fontSize: '1.6rem', fontWeight: 800 }}>
                {matrixData.summary?.dogsCount || 0}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem', display: 'block' }}>Re-engineer recipe or drop from menu</span>
            </div>
          </div>

          {/* BCG Matrix 2x2 Visual Grid */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>BCG Menu Engineering Matrix Map</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Benchmark threshold: Average Margin = <b>₹{((matrixData.summary?.avgMargin) || 0).toFixed(2)}</b> | Average Volume = <b>{((matrixData.summary?.avgVolume) || 0).toFixed(0)} orders</b>
                </span>
              </div>
              <button
                onClick={fetchMatrix}
                style={{ padding: '0.5rem 0.85rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Icons.RefreshCw size={14} /> Recalculate
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Top Left: PUZZLES */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>❓ PUZZLES (High Margin, Low Volume)</span>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Profitable Hidden Gems</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'PUZZLE').map((d: any) => (
                    <div key={d.dishId} style={{ backgroundColor: 'white', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '0.8rem' }}>
                      <b>{d.dishName}</b> · Margin ₹{d.margin?.toFixed(0)} ({d.salesVolume} sold)
                    </div>
                  ))}
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'PUZZLE').length === 0 && (
                    <div style={{ color: '#92400e', fontSize: '0.8rem' }}>No dishes currently in this quadrant.</div>
                  )}
                </div>
              </div>

              {/* Top Right: STARS */}
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>🌟 STARS (High Margin, High Volume)</span>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Signature Profit Champions</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'STAR').map((d: any) => (
                    <div key={d.dishId} style={{ backgroundColor: 'white', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.8rem' }}>
                      <b>{d.dishName}</b> · Margin ₹{d.margin?.toFixed(0)} ({d.salesVolume} sold)
                    </div>
                  ))}
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'STAR').length === 0 && (
                    <div style={{ color: '#065f46', fontSize: '0.8rem' }}>No dishes currently in this quadrant.</div>
                  )}
                </div>
              </div>

              {/* Bottom Left: DOGS */}
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>🐕 DOGS (Low Margin, Low Volume)</span>
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Underperforming Menu Items</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'DOG').map((d: any) => (
                    <div key={d.dishId} style={{ backgroundColor: 'white', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '0.8rem' }}>
                      <b>{d.dishName}</b> · Margin ₹{d.margin?.toFixed(0)} ({d.salesVolume} sold)
                    </div>
                  ))}
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'DOG').length === 0 && (
                    <div style={{ color: '#991b1b', fontSize: '0.8rem' }}>No dishes currently in this quadrant.</div>
                  )}
                </div>
              </div>

              {/* Bottom Right: PLOWHORSES */}
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.95rem' }}>🐎 PLOWHORSES (Low Margin, High Volume)</span>
                  <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>Popular Staples</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'PLOWHORSE').map((d: any) => (
                    <div key={d.dishId} style={{ backgroundColor: 'white', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.8rem' }}>
                      <b>{d.dishName}</b> · Margin ₹{d.margin?.toFixed(0)} ({d.salesVolume} sold)
                    </div>
                  ))}
                  {(matrixData.matrix || []).filter((m: any) => m.classification === 'PLOWHORSE').length === 0 && (
                    <div style={{ color: '#1e40af', fontSize: '0.8rem' }}>No dishes currently in this quadrant.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dishes BCG Engineering Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
                Menu Profitability Ranking & Strategic Recommendations
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Showing {filteredMatrix.length} dishes
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Menu Item</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Selling Price</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Recipe Cost</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Gross Margin (₹)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Margin %</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Sales Volume</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Classification</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Strategic Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatrix.map((item: any) => {
                  const badgeMap: any = {
                    STAR: { bg: '#d1fae5', color: '#065f46', label: '🌟 Star' },
                    PLOWHORSE: { bg: '#dbeafe', color: '#1e40af', label: '🐎 Plowhorse' },
                    PUZZLE: { bg: '#fef3c7', color: '#92400e', label: '❓ Puzzle' },
                    DOG: { bg: '#fee2e2', color: '#991b1b', label: '🐕 Dog' }
                  };
                  const badge = badgeMap[item.classification] || { bg: '#f1f5f9', color: '#475569', label: item.classification };

                  return (
                    <tr key={item.dishId} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{item.dishName}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{item.categoryName || 'General'}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{(item.sellingPrice || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>₹{(item.recipeCost || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: item.margin >= 0 ? '#059669' : '#dc2626' }}>
                        ₹{(item.margin || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {(item.marginPercent || 0).toFixed(1)}%
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {item.salesVolume || 0} orders
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', fontSize: '0.8rem' }}>
                        {item.recommendation}
                      </td>
                    </tr>
                  );
                })}
                {filteredMatrix.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No dishes found matching quadrant filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}
    </div>
  );
}
