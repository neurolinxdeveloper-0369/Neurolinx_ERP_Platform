import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function RawMaterials() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalIngredients: 0, totalValuation: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'ledger' | 'forecasting'>('overview');
  
  // Create / Edit Ingredient Form Modal
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', unit: 'kg', stockLevel: 0, reorderLevel: 0, costPerUnit: 0 });

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ ingredientId: '', currentStock: 0, newStock: 0, unit: '', reason: '' });

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/batches').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/movements').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/summary').then(res => res.json())
    ]).then(([i, b, m, s]) => {
      setIngredients(Array.isArray(i) ? i : []);
      setBatches(Array.isArray(b) ? b : []);
      setMovements(Array.isArray(m) ? m : []);
      if (s) setSummary(s);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/inventory/ingredients/${form.id}` : 'https://erp-api.neurolinx.in/api/inventory/ingredients';
    const method = isEditing ? 'PUT' : 'POST';
    const payload = {
      name: form.name,
      unit: form.unit,
      stockLevel: parseFloat(form.stockLevel.toString()),
      reorderLevel: parseFloat(form.reorderLevel.toString()),
      costPerUnit: parseFloat(form.costPerUnit.toString())
    };

    try {
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        alert("Failed to save raw material ingredient");
      }
    } catch (e: any) {
      alert(e?.message || "Error saving raw material");
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.ingredientId) return;

    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: parseInt(adjustForm.ingredientId),
          newStock: parseFloat(adjustForm.newStock.toString()),
          reason: adjustForm.reason || "Physical count audit adjustment"
        })
      });
      if (res.ok) {
        setShowAdjustModal(false);
        fetchData();
        alert("Stock adjusted and recorded in audit ledger successfully!");
      } else {
        alert("Failed to adjust stock");
      }
    } catch (e: any) {
      alert(e?.message || "Error adjusting stock");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/ingredients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete ingredient");
      }
    } catch (e: any) {
      alert(e?.message || "Error deleting ingredient");
    }
  };

  const openAdjustModal = (ing: any) => {
    setAdjustForm({
      ingredientId: ing.id.toString(),
      currentStock: ing.stockLevel || 0,
      newStock: ing.stockLevel || 0,
      unit: ing.unit || 'kg',
      reason: ''
    });
    setShowAdjustModal(true);
  };

  // Forecasting Logic
  const expiringBatches = batches.filter(b => {
    if (!b.expiryDate) return false;
    const daysLeft = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const suggestedReorders = ingredients.filter(i => (i.stockLevel || 0) <= (i.reorderLevel || 0)).map(i => ({
    ...i,
    deficit: Math.max(0, (i.reorderLevel || 0) - (i.stockLevel || 0)),
    urgency: (i.stockLevel || 0) <= 0 ? 'Critical' : 'High'
  })).sort((a, b) => (a.stockLevel || 0) - (b.stockLevel || 0));

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Raw Materials Inventory</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Track ingredient stock balances, batch lots, valuation, and auditable movement ledger</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => {
              setIsEditing(false);
              setForm({ id: 0, name: '', unit: 'kg', stockLevel: 0, reorderLevel: 5, costPerUnit: 0 });
              setShowForm(true);
            }}
            style={{ padding: '0.75rem 1.25rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Icons.Plus size={18} /> Add Ingredient
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Inventory Valuation</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#0f172a', fontSize: '1.4rem' }}>₹{(summary.totalValuation || 0).toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Raw Materials Tracked</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#0f172a', fontSize: '1.4rem' }}>{summary.totalIngredients || ingredients.length}</h3>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>Low Stock Alert</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#b45309', fontSize: '1.4rem' }}>{summary.lowStockCount || 0}</h3>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>Out of Stock</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#dc2626', fontSize: '1.4rem' }}>{summary.outOfStockCount || 0}</h3>
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'overview' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Global Stock Overview
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'batches' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'batches' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Purchase Batches (FIFO)
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'ledger' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'ledger' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Icons.ClipboardList size={17} /> Stock Ledger (Audit Trail)
        </button>
        <button
          onClick={() => setActiveTab('forecasting')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'forecasting' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'forecasting' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Icons.TrendingUp size={17} /> Reorder Alerts ({suggestedReorders.length})
        </button>
      </div>

      {isLoading ? <div>Loading Raw Materials...</div> : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                    <th style={{ padding: '1rem' }}>Raw Material</th>
                    <th style={{ padding: '1rem' }}>Unit</th>
                    <th style={{ padding: '1rem' }}>Available Stock</th>
                    <th style={{ padding: '1rem' }}>Reorder Level</th>
                    <th style={{ padding: '1rem' }}>Unit Cost</th>
                    <th style={{ padding: '1rem' }}>Stock Value</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(ing => {
                    const stock = ing.stockLevel || 0;
                    const reorder = ing.reorderLevel || 0;
                    const cost = ing.costPerUnit || 0;
                    const val = stock * cost;

                    let statusBadge;
                    if (stock <= 0) {
                      statusBadge = <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>Out of Stock</span>;
                    } else if (stock <= reorder) {
                      statusBadge = <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600 }}>Low Stock</span>;
                    } else {
                      statusBadge = <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#d1fae5', color: '#059669', fontWeight: 600 }}>Sufficient</span>;
                    }

                    return (
                      <tr key={ing.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{ing.name}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{ing.unit}</td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{stock.toFixed(2)} {ing.unit}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{reorder.toFixed(2)} {ing.unit}</td>
                        <td style={{ padding: '1rem' }}>₹{cost.toFixed(2)}</td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>₹{val.toFixed(2)}</td>
                        <td style={{ padding: '1rem' }}>{statusBadge}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openAdjustModal(ing)}
                              title="Stock Adjustment"
                              style={{ padding: '0.4rem 0.6rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#0f172a' }}
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => { setIsEditing(true); setForm(ing); setShowForm(true); }}
                              style={{ padding: '0.4rem', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}
                            >
                              <Icons.Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(ing.id)}
                              style={{ padding: '0.4rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Icons.Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {ingredients.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        No raw materials created yet. Click "+ Add Ingredient" to register materials.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: FIFO BATCHES */}
          {activeTab === 'batches' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                    <th style={{ padding: '1rem' }}>Batch Lot #</th>
                    <th style={{ padding: '1rem' }}>Raw Material</th>
                    <th style={{ padding: '1rem' }}>Initial Inward</th>
                    <th style={{ padding: '1rem' }}>Available Balance</th>
                    <th style={{ padding: '1rem' }}>Unit Cost</th>
                    <th style={{ padding: '1rem' }}>Received Date</th>
                    <th style={{ padding: '1rem' }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>BATCH-{b.id}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{b.ingredient?.name}</td>
                      <td style={{ padding: '1rem' }}>{b.initialQuantity} {b.ingredient?.unit}</td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: b.currentQuantity <= 0 ? '#ef4444' : '#10b981' }}>
                        {b.currentQuantity} {b.ingredient?.unit}
                      </td>
                      <td style={{ padding: '1rem' }}>₹{(b.costPerUnit || 0).toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>{b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{b.expiryDate || 'N/A'}</td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No batches inwarded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: AUDITABLE STOCK LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem' }}>Timestamp</th>
                    <th style={{ padding: '0.85rem' }}>Movement Type</th>
                    <th style={{ padding: '0.85rem' }}>Raw Material</th>
                    <th style={{ padding: '0.85rem' }}>Qty Moved</th>
                    <th style={{ padding: '0.85rem' }}>Stock Balance</th>
                    <th style={{ padding: '0.85rem' }}>Reference #</th>
                    <th style={{ padding: '0.85rem' }}>Authorized User / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => {
                    const isPositive = m.quantity > 0;
                    const typeColors: any = {
                      PURCHASE_RECEIPT: { bg: '#d1fae5', color: '#047857' },
                      SALE_CONSUMPTION: { bg: '#e0f2fe', color: '#0369a1' },
                      WASTE_DEDUCTION: { bg: '#fee2e2', color: '#b91c1c' },
                      MANUAL_ADJUSTMENT: { bg: '#fef3c7', color: '#b45309' },
                      ORDER_CANCELLED_RESTORE: { bg: '#f3e8ff', color: '#7e22ce' }
                    };
                    const color = typeColors[m.movementType] || { bg: '#f1f5f9', color: '#475569' };

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem', color: '#64748b' }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }}>
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem', fontWeight: 600 }}>{m.ingredient?.name}</td>
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: isPositive ? '#10b981' : '#ef4444' }}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{ color: '#64748b' }}>{m.previousStock}</span> → <b>{m.newStock} {m.unit}</b>
                        </td>
                        <td style={{ padding: '0.85rem', fontWeight: 500 }}>
                          {m.referenceId || m.referenceType || '—'}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <div>{m.reason || 'N/A'}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>By: {m.createdByName || 'System'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No stock movement ledger transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: REORDER ALERTS */}
          {activeTab === 'forecasting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
                  <Icons.AlertTriangle size={20} /> Low Stock & Reorder Suggestions
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem' }}>Raw Material</th>
                      <th style={{ padding: '0.75rem' }}>Current Stock</th>
                      <th style={{ padding: '0.75rem' }}>Reorder Level</th>
                      <th style={{ padding: '0.75rem' }}>Suggested Reorder Qty</th>
                      <th style={{ padding: '0.75rem' }}>Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestedReorders.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '0.75rem', color: item.stockLevel <= 0 ? '#ef4444' : '#b45309', fontWeight: 600 }}>
                          {item.stockLevel} {item.unit}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{item.reorderLevel} {item.unit}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.deficit > 0 ? `${item.deficit} ${item.unit}` : 'Restock advised'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: item.urgency === 'Critical' ? '#fee2e2' : '#fef3c7', color: item.urgency === 'Critical' ? '#dc2626' : '#b45309' }}>
                            {item.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {suggestedReorders.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                          All raw materials are currently at healthy stock levels!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Batches Expiring Soon */}
              {expiringBatches.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                    <Icons.Clock size={20} /> Batches Expiring in Next 7 Days ({expiringBatches.length})
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <th style={{ padding: '0.75rem' }}>Batch Number</th>
                        <th style={{ padding: '0.75rem' }}>Raw Material</th>
                        <th style={{ padding: '0.75rem' }}>Remaining Qty</th>
                        <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringBatches.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.batchNumber}</td>
                          <td style={{ padding: '0.75rem' }}>{b.ingredient?.name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.currentQuantity} {b.ingredient?.unit}</td>
                          <td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: 600 }}>{b.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT INGREDIENT MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '2rem', width: '90%', maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Raw Material' : 'Add New Raw Material'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Ingredient Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Unit of Measure *</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Litres)</option>
                    <option value="ml">ml (Millilitres)</option>
                    <option value="pcs">pcs (Pieces / Units)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Current Stock Level *</label>
                  <input required type="number" step="0.01" value={form.stockLevel} onChange={e => setForm({...form, stockLevel: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reorder Level</label>
                  <input type="number" step="0.01" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Unit Cost (₹)</label>
                  <input type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm({...form, costPerUnit: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>{isEditing ? 'Update' : 'Save Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '2rem', width: '90%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Physical Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Current Recorded Stock</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>{adjustForm.currentStock} {adjustForm.unit}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Actual Physical Stock Count *</label>
                <input
                  required
                  type="number"
                  step="0.001"
                  value={adjustForm.newStock}
                  onChange={e => setAdjustForm({...adjustForm, newStock: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reason for Adjustment *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Monthly stock take count / audit correction"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
