import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function RawMaterials() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalIngredients: 0, totalValuation: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [vendors, setVendors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any>({ criticalAlerts: [], lowStockCount: 0, outOfStockCount: 0, nearExpiryBatchesCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: overview, alerts, transfers, audits, batches, ledger
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'transfers' | 'audits' | 'batches' | 'ledger'>('overview');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [barcodeQuery, setBarcodeQuery] = useState('');

  // Ingredient Form Modal
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    name: '',
    unit: 'kg',
    stockLevel: 0,
    reorderLevel: 5,
    parLevel: 10,
    costPerUnit: 0,
    storageZone: 'Dry Storage',
    barcode: '',
    preferredVendorId: ''
  });

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ ingredientId: '', currentStock: 0, newStock: 0, unit: '', reason: '' });

  // Transfer Modal & State (Phase 3)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFilter, setTransferFilter] = useState('ALL');
  const [selectedTransferForView, setSelectedTransferForView] = useState<any>(null);
  const [transferForm, setTransferForm] = useState({
    sourceBranchId: '',
    destinationBranchId: '',
    notes: '',
    items: [{ ingredientId: '', quantity: 1 }]
  });

  // Audit Modal & Count Sheet State (Phase 4)
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({ storageZone: 'All', notes: '' });
  const [activeAuditSheet, setActiveAuditSheet] = useState<any>(null);
  const [auditCounts, setAuditCounts] = useState<{ [key: number]: { physicalQuantity: number; discrepancyReason: string } }>({});

  // Auto-PO Modal State (Phase 1)
  const [autoPOResult, setAutoPOResult] = useState<any>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/batches').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/movements').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/summary').then(res => res.ok ? res.json() : null).catch(() => null),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/branches').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/alerts').then(res => res.ok ? res.json() : null).catch(() => null),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/transfers').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/audits').then(res => res.ok ? res.json() : []).catch(() => [])
    ]).then(([ings, bats, movs, summ, vens, brans, alts, trans, auds]) => {
      setIngredients(Array.isArray(ings) ? ings : []);
      setBatches(Array.isArray(bats) ? bats : []);
      setMovements(Array.isArray(movs) ? movs : []);
      if (summ) setSummary(summ);
      setVendors(Array.isArray(vens) ? vens : []);
      setBranches(Array.isArray(brans) ? brans : []);
      if (alts) setAlertsData(alts);
      setTransfers(Array.isArray(trans) ? trans : []);
      setAudits(Array.isArray(auds) ? auds : []);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Barcode Lookup (Phase 5)
  const handleBarcodeSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || barcodeQuery).trim();
    if (!code) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/barcode/${encodeURIComponent(code)}`);
      if (res.ok) {
        const item = await res.json();
        setSearchQuery(item.name);
      } else {
        alert(`No raw material found with barcode: ${code}`);
      }
    } catch (e: any) {
      alert(e?.message || 'Error searching barcode');
    }
  };

  // 1-Click Auto-PO Generation (Phase 1)
  const handleAutoGeneratePOs = async () => {
    if (!window.confirm('Auto-generate purchase orders for all depleted & low-stock raw materials based on Par Levels and Preferred Vendors?')) return;
    setIsAutoGenerating(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases/auto-generate', {
        method: 'POST'
      });
      const data = await res.json();
      setIsAutoGenerating(false);
      if (res.ok) {
        setAutoPOResult(data);
        fetchData();
      } else {
        alert(data.message || 'Failed to auto-generate purchase orders');
      }
    } catch (e: any) {
      setIsAutoGenerating(false);
      alert(e?.message || 'Error during auto-PO generation');
    }
  };

  // Save / Update Ingredient
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `https://erp-api.neurolinx.in/api/inventory/ingredients/${form.id}` : 'https://erp-api.neurolinx.in/api/inventory/ingredients';
    const method = isEditing ? 'PUT' : 'POST';
    const payload = {
      name: form.name,
      unit: form.unit,
      stockLevel: parseFloat(form.stockLevel.toString()),
      reorderLevel: parseFloat(form.reorderLevel.toString()),
      parLevel: parseFloat(form.parLevel.toString()),
      costPerUnit: parseFloat(form.costPerUnit.toString()),
      storageZone: form.storageZone,
      barcode: form.barcode,
      preferredVendorId: form.preferredVendorId ? parseInt(form.preferredVendorId) : null
    };

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save raw material');
      }
    } catch (e: any) {
      alert(e?.message || 'Error saving raw material');
    }
  };

  // Stock Adjustment Submit
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
          reason: adjustForm.reason || 'Physical count audit adjustment'
        })
      });
      if (res.ok) {
        setShowAdjustModal(false);
        fetchData();
        alert('Stock adjusted and recorded in audit ledger successfully!');
      } else {
        alert('Failed to adjust stock');
      }
    } catch (e: any) {
      alert(e?.message || 'Error adjusting stock');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/ingredients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete ingredient');
      }
    } catch (e: any) {
      alert(e?.message || 'Error deleting ingredient');
    }
  };

  // Inter-Branch Transfer Order (ITO) Handlers (Phase 3)
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.destinationBranchId) {
      alert('Please select a destination branch.');
      return;
    }
    const validItems = transferForm.items.filter(i => i.ingredientId && parseFloat(i.quantity.toString()) > 0);
    if (validItems.length === 0) {
      alert('Please select at least one raw material to transfer.');
      return;
    }

    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBranchId: transferForm.sourceBranchId ? parseInt(transferForm.sourceBranchId) : null,
          destinationBranchId: parseInt(transferForm.destinationBranchId),
          notes: transferForm.notes,
          items: validItems.map(i => ({
            ingredientId: parseInt(i.ingredientId),
            quantity: parseFloat(i.quantity.toString())
          }))
        })
      });
      if (res.ok) {
        setShowTransferModal(false);
        setTransferForm({
          sourceBranchId: '',
          destinationBranchId: '',
          notes: '',
          items: [{ ingredientId: '', quantity: 1 }]
        });
        fetchData();
        alert('Internal Transfer Order created successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create transfer order');
      }
    } catch (e: any) {
      alert(e?.message || 'Error creating transfer order');
    }
  };

  const handleDispatchTransfer = async (transferId: number) => {
    if (!window.confirm('Dispatch this transfer order? Stock will be deducted from the source branch and marked In-Transit.')) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/transfers/${transferId}/dispatch`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchData();
        alert('Transfer dispatched successfully into transit!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to dispatch transfer');
      }
    } catch (e: any) {
      alert(e?.message || 'Error dispatching transfer');
    }
  };

  const handleReceiveTransfer = async (transferId: number) => {
    if (!window.confirm('Receive this transfer order? Stock will be added to the destination branch inventory.')) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/transfers/${transferId}/receive`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchData();
        alert('Transfer received and inventory balances updated successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to receive transfer');
      }
    } catch (e: any) {
      alert(e?.message || 'Error receiving transfer');
    }
  };

  // Physical Audit Handlers (Phase 4)
  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/inventory/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageZone: auditForm.storageZone,
          notes: auditForm.notes
        })
      });
      if (res.ok) {
        const newAudit = await res.json();
        setShowAuditModal(false);
        fetchData();
        openAuditCountSheet(newAudit);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to initiate audit');
      }
    } catch (e: any) {
      alert(e?.message || 'Error creating audit');
    }
  };

  const openAuditCountSheet = (audit: any) => {
    setActiveAuditSheet(audit);
    const initialCounts: any = {};
    if (audit.items) {
      audit.items.forEach((item: any) => {
        initialCounts[item.id] = {
          physicalQuantity: item.physicalQuantity !== null && item.physicalQuantity !== undefined ? item.physicalQuantity : item.systemQuantity,
          discrepancyReason: item.discrepancyReason || 'COUNTING_ERROR'
        };
      });
    }
    setAuditCounts(initialCounts);
  };

  const handleReconcileAudit = async (auditId: number) => {
    if (!window.confirm('Confirm and reconcile this stock audit? Stock discrepancies will be booked to the inventory ledger and physical balances will overwrite system counts.')) return;

    const itemsPayload = Object.keys(auditCounts).map(itemId => ({
      id: parseInt(itemId),
      physicalQuantity: parseFloat(auditCounts[parseInt(itemId)].physicalQuantity.toString()) || 0,
      discrepancyReason: auditCounts[parseInt(itemId)].discrepancyReason
    }));

    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/audits/${auditId}/reconcile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload })
      });
      if (res.ok) {
        setActiveAuditSheet(null);
        fetchData();
        alert('Stock audit successfully reconciled! Inventory balances and movements have been synchronized.');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to reconcile audit');
      }
    } catch (e: any) {
      alert(e?.message || 'Error reconciling audit');
    }
  };

  // Helper generators
  const generateBarcode = () => {
    const code = 'RAW-' + Math.floor(100000 + Math.random() * 900000);
    setForm({ ...form, barcode: code });
  };

  // Filtering ingredients
  const filteredIngredients = ingredients.filter(i => {
    const matchesQuery = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.barcode && i.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesZone = zoneFilter === 'ALL' || (i.storageZone || 'Dry Storage').toLowerCase() === zoneFilter.toLowerCase();
    return matchesQuery && matchesZone;
  });

  // Filter transfers
  const filteredTransfers = transfers.filter(t => {
    if (transferFilter === 'ALL') return true;
    return (t.status || '').toLowerCase() === transferFilter.toLowerCase();
  });

  const storageZonesList = ['Dry Storage', 'Walk-in Cooler', 'Freezer', 'Bar & Cellar', 'Prep Station', 'Main Commissary'];

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 700 }}>Raw Materials & Commissary</h2>
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
              Enterprise ERP v2.0
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Multi-zone storage, automated par-level procurement, inter-branch transfers (ITO), and cycle count audits
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleAutoGeneratePOs}
            disabled={isAutoGenerating}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Generate Restock POs for all low or depleted stock items"
          >
            <Icons.Zap size={18} /> {isAutoGenerating ? 'Generating...' : '⚡ 1-Click Auto-PO'}
          </button>

          <button
            onClick={() => {
              setShowAuditModal(true);
            }}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600
            }}
          >
            <Icons.ClipboardCheck size={18} /> New Cycle Audit
          </button>

          <button
            onClick={() => {
              setIsEditing(false);
              setForm({
                id: 0,
                name: '',
                unit: 'kg',
                stockLevel: 0,
                reorderLevel: 5,
                parLevel: 10,
                costPerUnit: 0,
                storageZone: 'Dry Storage',
                barcode: '',
                preferredVendorId: ''
              });
              setShowForm(true);
            }}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600
            }}
          >
            <Icons.Plus size={18} /> Add Material
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Inventory Valuation</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 700 }}>₹{(summary.totalValuation || 0).toFixed(2)}</h3>
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
            <Icons.Boxes size={14} /> Active Balance
          </span>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tracked Materials</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 700 }}>{summary.totalIngredients || ingredients.length}</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>Across {storageZonesList.length} Storage Zones</span>
        </div>

        <div 
          onClick={() => setActiveTab('alerts')}
          style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #fed7aa', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'transform 0.15s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>Low Stock (≤ Reorder)</span>
            <Icons.AlertTriangle size={16} color="#b45309" />
          </div>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#b45309', fontSize: '1.5rem', fontWeight: 700 }}>{alertsData.lowStockCount || summary.lowStockCount || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.35rem', display: 'block' }}>Click to view alerts</span>
        </div>

        <div 
          onClick={() => setActiveTab('alerts')}
          style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #fecaca', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>Out of Stock</span>
            <Icons.AlertOctagon size={16} color="#dc2626" />
          </div>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#dc2626', fontSize: '1.5rem', fontWeight: 700 }}>{alertsData.outOfStockCount || summary.outOfStockCount || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.35rem', display: 'block' }}>Zero stock deficit</span>
        </div>

        <div 
          onClick={() => setActiveTab('transfers')}
          style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #bfdbfe', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>In-Transit Transfers</span>
            <Icons.Truck size={16} color="#1d4ed8" />
          </div>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#1d4ed8', fontSize: '1.5rem', fontWeight: 700 }}>
            {transfers.filter(t => t.status === 'In-Transit' || t.status === 'Pending Approval').length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.35rem', display: 'block' }}>Branch ITO Workflow</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'overview' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Icons.LayoutGrid size={16} /> Stock Overview & Par Levels
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'alerts' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'alerts' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Icons.Zap size={16} color="#f59e0b" /> Restock Alerts & Auto-PO ({alertsData.criticalAlerts?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'transfers' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'transfers' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Icons.ArrowRightLeft size={16} /> Inter-Branch Transfers ({transfers.length})
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audits' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'audits' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Icons.ClipboardList size={16} /> Cycle Counts & Audits ({audits.length})
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'batches' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'batches' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Icons.Layers size={16} /> FIFO Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'ledger' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Icons.FileSpreadsheet size={16} /> Audit Trail Ledger
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <Icons.RefreshCw size={28} style={{ margin: '0 auto 0.5rem auto' }} />
          <div>Synchronizing inventory state...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: STOCK OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Filter & Barcode Search Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Icons.Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search by material name or barcode..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <select
                    value={zoneFilter}
                    onChange={e => setZoneFilter(e.target.value)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                  >
                    <option value="ALL">All Storage Zones</option>
                    {storageZonesList.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>

                {/* Phase 5 Barcode Scanner Input */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Icons.ScanBarcode size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                    <input
                      type="text"
                      placeholder="Scan Barcode / SKU..."
                      value={barcodeQuery}
                      onChange={e => setBarcodeQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleBarcodeSearch(); }}
                      style={{ width: '100%', padding: '0.6rem 0.5rem 0.6rem 2rem', borderRadius: '6px', border: '1px solid #0284c7', fontSize: '0.8rem', backgroundColor: '#f0f9ff' }}
                    />
                  </div>
                  <button
                    onClick={() => handleBarcodeSearch()}
                    style={{ padding: '0.6rem 0.9rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Scan
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Raw Material</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Storage Zone</th>
                      <th style={{ padding: '0.85rem 1rem' }}>In Stock</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Par Level</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Reorder</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Unit Cost</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Valuation</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Preferred Vendor</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Barcode</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map(ing => {
                      const stock = ing.stockLevel || 0;
                      const reorder = ing.reorderLevel || 0;
                      const par = ing.parLevel || 0;
                      const cost = ing.costPerUnit || 0;
                      const val = stock * cost;

                      let statusBadge;
                      if (stock <= 0) {
                        statusBadge = <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>Out of Stock</span>;
                      } else if (stock <= reorder) {
                        statusBadge = <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600 }}>Low Stock</span>;
                      } else {
                        statusBadge = <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#d1fae5', color: '#059669', fontWeight: 600 }}>Optimal</span>;
                      }

                      return (
                        <tr key={ing.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                            <div>{ing.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Unit: {ing.unit}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                              {ing.storageZone || 'Dry Storage'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: stock <= 0 ? '#dc2626' : stock <= reorder ? '#b45309' : '#0f172a' }}>
                            {stock.toFixed(2)} {ing.unit}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                            {par > 0 ? `${par.toFixed(2)} ${ing.unit}` : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                            {reorder.toFixed(2)} {ing.unit}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>₹{cost.toFixed(2)}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{val.toFixed(2)}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                            {ing.preferredVendor?.name || '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                            {ing.barcode ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f8fafc', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                <Icons.Barcode size={14} color="#64748b" /> {ing.barcode}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>{statusBadge}</td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  setAdjustForm({
                                    ingredientId: ing.id.toString(),
                                    currentStock: ing.stockLevel || 0,
                                    newStock: ing.stockLevel || 0,
                                    unit: ing.unit || 'kg',
                                    reason: ''
                                  });
                                  setShowAdjustModal(true);
                                }}
                                title="Adjust Stock Count"
                                style={{ padding: '0.35rem 0.6rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                              >
                                Adjust
                              </button>

                              <button
                                onClick={() => {
                                  setIsEditing(true);
                                  setForm({
                                    id: ing.id,
                                    name: ing.name || '',
                                    unit: ing.unit || 'kg',
                                    stockLevel: ing.stockLevel || 0,
                                    reorderLevel: ing.reorderLevel || 0,
                                    parLevel: ing.parLevel || 0,
                                    costPerUnit: ing.costPerUnit || 0,
                                    storageZone: ing.storageZone || 'Dry Storage',
                                    barcode: ing.barcode || '',
                                    preferredVendorId: ing.preferredVendor?.id ? ing.preferredVendor.id.toString() : ''
                                  });
                                  setShowForm(true);
                                }}
                                title="Edit Raw Material"
                                style={{ padding: '0.35rem', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}
                              >
                                <Icons.Edit size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(ing.id)}
                                title="Delete Raw Material"
                                style={{ padding: '0.35rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              >
                                <Icons.Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredIngredients.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No raw materials found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RESTOCK ALERTS & AUTO-PO (Phase 1) */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Action Banner */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#92400e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Zap size={22} color="#d97706" /> 1-Click Automated Replenishment
                  </h3>
                  <p style={{ margin: '0.35rem 0 0 0', color: '#78350f', fontSize: '0.875rem' }}>
                    Auto-create vendor purchase orders for raw materials below reorder thresholds, ordering up to defined Par Levels.
                  </p>
                </div>

                <button
                  onClick={handleAutoGeneratePOs}
                  disabled={isAutoGenerating}
                  style={{
                    padding: '0.8rem 1.6rem',
                    backgroundColor: '#d97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  <Icons.Zap size={18} /> {isAutoGenerating ? 'Generating Orders...' : '⚡ Generate Restock POs Now'}
                </button>
              </div>

              {/* Created POs notification */}
              {autoPOResult && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#065f46', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Icons.CheckCircle2 size={18} /> {autoPOResult.message}
                      </h4>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#047857', fontSize: '0.85rem' }}>
                        {autoPOResult.generatedCount} purchase orders prepared in Draft status for your review.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/res-purchases')}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Go to Purchase Orders →
                    </button>
                  </div>
                </div>
              )}

              {/* Critical Alerts Table */}
              <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>
                    Stock Depletion & Reorder Requirements ({alertsData.criticalAlerts?.length || 0})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Targeting Par Levels</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Raw Material</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Storage Zone</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Available Stock</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Par Level</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Reorder Deficit</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Est. Restock Cost</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Preferred Vendor</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertsData.criticalAlerts?.map((alt: any) => {
                      const urgencyColors: any = {
                        CRITICAL: { bg: '#fee2e2', color: '#dc2626' },
                        HIGH: { bg: '#ffedd5', color: '#c2410c' },
                        MEDIUM: { bg: '#fef3c7', color: '#b45309' }
                      };
                      const color = urgencyColors[alt.urgency] || { bg: '#f1f5f9', color: '#475569' };

                      return (
                        <tr key={alt.ingredientId} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{alt.name}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{alt.storageZone || 'Dry Storage'}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: alt.stockLevel <= 0 ? '#dc2626' : '#b45309' }}>
                            {alt.stockLevel} {alt.unit}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>{alt.parLevel} {alt.unit}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            +{alt.deficit} {alt.unit}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{(alt.deficit * (alt.costPerUnit || 0)).toFixed(2)}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{alt.preferredVendor || 'Any Vendor'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }}>
                              {alt.urgency}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!alertsData.criticalAlerts || alertsData.criticalAlerts.length === 0) && (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                          <Icons.CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                          <div>All raw materials are currently at or above par stocking levels!</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Expiring Batches Preview */}
              {alertsData.expiringBatches?.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #fecaca', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', backgroundColor: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Clock size={18} color="#dc2626" />
                    <h4 style={{ margin: 0, color: '#b91c1c', fontSize: '0.95rem', fontWeight: 600 }}>
                      Batches Expiring in Next 7 Days ({alertsData.expiringBatches.length})
                    </h4>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Batch Lot</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Raw Material</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Remaining Balance</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertsData.expiringBatches.map((b: any) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>BATCH-{b.id}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{b.ingredient?.name}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#dc2626' }}>
                            {b.currentQuantity} {b.ingredient?.unit}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#dc2626', fontWeight: 600 }}>{b.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTER-BRANCH TRANSFERS (ITO) (Phase 3) */}
          {activeTab === 'transfers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Filter Status:</span>
                  <select
                    value={transferFilter}
                    onChange={e => setTransferFilter(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Transfers</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="In-Transit">In-Transit</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowTransferModal(true)}
                  style={{ padding: '0.7rem 1.25rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  <Icons.Plus size={18} /> New Inter-Branch Transfer
                </button>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Transfer #</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Source Branch / Commissary</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Destination Branch</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Items Transferred</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Created At</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map(tr => {
                      const statusMap: any = {
                        'Pending Approval': { bg: '#fef3c7', color: '#b45309' },
                        'In-Transit': { bg: '#e0f2fe', color: '#0369a1' },
                        'Received': { bg: '#d1fae5', color: '#047857' },
                        'Cancelled': { bg: '#fee2e2', color: '#b91c1c' }
                      };
                      const sStyle = statusMap[tr.status] || { bg: '#f1f5f9', color: '#475569' };

                      return (
                        <tr key={tr.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{tr.transferNumber || `ITO-${tr.id}`}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                              <Icons.Building2 size={15} color="#64748b" />
                              {tr.sourceBranch?.name || 'Central Commissary / Main Store'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#0f172a' }}>
                              <Icons.Store size={15} color="#0284c7" />
                              {tr.destinationBranch?.name || 'Branch'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {tr.items?.length || 0} line items
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: sStyle.bg, color: sStyle.color }}>
                              {tr.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                            {tr.createdAt ? new Date(tr.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => setSelectedTransferForView(tr)}
                                style={{ padding: '0.35rem 0.65rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                View
                              </button>

                              {tr.status === 'Pending Approval' && (
                                <button
                                  onClick={() => handleDispatchTransfer(tr.id)}
                                  style={{ padding: '0.35rem 0.65rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                  Dispatch
                                </button>
                              )}

                              {tr.status === 'In-Transit' && (
                                <button
                                  onClick={() => handleReceiveTransfer(tr.id)}
                                  style={{ padding: '0.35rem 0.65rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                  Receive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTransfers.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No inter-branch transfer orders recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CYCLE COUNTS & STOCK AUDITS (Phase 4) */}
          {activeTab === 'audits' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Storage Zone Audits & Physical Reconciliation</h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                    Reconcile physical stock counts against system book inventory and book discrepancy variances
                  </p>
                </div>
                <button
                  onClick={() => setShowAuditModal(true)}
                  style={{ padding: '0.7rem 1.25rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  <Icons.Plus size={18} /> Start New Cycle Audit
                </button>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Audit #</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Storage Zone Target</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Items Audited</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Total Variance Value</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Auditor</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map(aud => {
                      const isReconciled = aud.status === 'Reconciled';
                      const varVal = aud.totalVarianceValue || 0;
                      return (
                        <tr key={aud.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{aud.auditNumber || `AUD-${aud.id}`}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {aud.storageZone || 'All Zones'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>{aud.items?.length || 0} items</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: varVal < 0 ? '#dc2626' : varVal > 0 ? '#059669' : '#64748b' }}>
                            {varVal !== 0 ? `₹${varVal.toFixed(2)}` : '₹0.00'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: isReconciled ? '#d1fae5' : '#fef3c7', color: isReconciled ? '#047857' : '#b45309' }}>
                              {aud.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{aud.auditedBy || 'Staff'}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                            {aud.createdAt ? new Date(aud.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => openAuditCountSheet(aud)}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: isReconciled ? '#f1f5f9' : '#4f46e5',
                                color: isReconciled ? '#0f172a' : 'white',
                                border: isReconciled ? '1px solid #cbd5e1' : 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              {isReconciled ? 'View Counts' : 'Count & Reconcile'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {audits.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                          No physical stock audits conducted yet. Click "Start New Cycle Audit" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FIFO BATCHES */}
          {activeTab === 'batches' && (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Batch Lot #</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Raw Material</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Initial Inward</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Remaining Balance</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Cost / Unit</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Inward Date</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>BATCH-{b.id}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{b.ingredient?.name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{b.initialQuantity} {b.ingredient?.unit}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: b.currentQuantity <= 0 ? '#ef4444' : '#10b981' }}>
                        {b.currentQuantity} {b.ingredient?.unit}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>₹{(b.costPerUnit || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: b.expiryDate ? '#dc2626' : '#64748b', fontWeight: b.expiryDate ? 600 : 400 }}>{b.expiryDate || '—'}</td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No inwarded batches recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Movement Type</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Raw Material</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Qty Moved</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Balance Before → After</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Reference #</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Reason / Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => {
                    const isPositive = m.quantity > 0;
                    const typeColors: any = {
                      PURCHASE_RECEIPT: { bg: '#d1fae5', color: '#047857' },
                      SALE_CONSUMPTION: { bg: '#e0f2fe', color: '#0369a1' },
                      WASTE_DEDUCTION: { bg: '#fee2e2', color: '#b91c1c' },
                      TRANSFER_OUT: { bg: '#fef3c7', color: '#b45309' },
                      TRANSFER_IN: { bg: '#dbeafe', color: '#1e40af' },
                      AUDIT_RECONCILIATION: { bg: '#f3e8ff', color: '#7e22ce' },
                      MANUAL_ADJUSTMENT: { bg: '#fef3c7', color: '#b45309' }
                    };
                    const color = typeColors[m.movementType] || { bg: '#f1f5f9', color: '#475569' };

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }}>
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{m.ingredient?.name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444' }}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ color: '#64748b' }}>{m.previousStock}</span> → <b>{m.newStock} {m.unit}</b>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {m.referenceId || m.referenceType || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div>{m.reason || 'N/A'}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>By: {m.createdByName || 'System'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No stock ledger transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD / EDIT RAW MATERIAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{isEditing ? 'Edit Raw Material' : 'Add New Raw Material'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <Icons.X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Ingredient Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Unit of Measure *</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Litres)</option>
                    <option value="ml">ml (Millilitres)</option>
                    <option value="pcs">pcs (Pieces / Units)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Storage Zone *</label>
                  <select
                    value={form.storageZone}
                    onChange={e => setForm({ ...form, storageZone: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {storageZonesList.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Current Stock *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.stockLevel}
                    onChange={e => setForm({ ...form, stockLevel: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reorder Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.reorderLevel}
                    onChange={e => setForm({ ...form, reorderLevel: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Par Level (Target)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optimal target"
                    value={form.parLevel}
                    onChange={e => setForm({ ...form, parLevel: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.costPerUnit}
                    onChange={e => setForm({ ...form, costPerUnit: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Preferred Vendor</label>
                  <select
                    value={form.preferredVendorId}
                    onChange={e => setForm({ ...form, preferredVendorId: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- None / General Supplier --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Barcode / SKU Code</label>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Auto-Generate SKU
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Icons.Barcode size={18} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="e.g. RAW-894102 or vendor EAN"
                    value={form.barcode}
                    onChange={e => setForm({ ...form, barcode: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isEditing ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Physical Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Icons.X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Current Recorded Balance</label>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>{adjustForm.currentStock} {adjustForm.unit}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Actual Counted Stock *</label>
                <input
                  required
                  type="number"
                  step="0.001"
                  value={adjustForm.newStock}
                  onChange={e => setAdjustForm({ ...adjustForm, newStock: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reason for Variance / Correction *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Physical count discrepancy or spoilage"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.65rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INTER-BRANCH TRANSFER (Phase 3) */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>New Inter-Branch Transfer Order (ITO)</h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Icons.X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Source Location</label>
                  <select
                    value={transferForm.sourceBranchId}
                    onChange={e => setTransferForm({ ...transferForm, sourceBranchId: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Central Commissary / Warehouse</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Destination Branch *</label>
                  <select
                    required
                    value={transferForm.destinationBranchId}
                    onChange={e => setTransferForm({ ...transferForm, destinationBranchId: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Select Target Branch --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.location || 'Location'})</option>)}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Raw Materials to Transfer</label>
                  <button
                    type="button"
                    onClick={() => setTransferForm({ ...transferForm, items: [...transferForm.items, { ingredientId: '', quantity: 1 }] })}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Add Item
                  </button>
                </div>

                {transferForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <select
                      required
                      value={item.ingredientId}
                      onChange={e => {
                        const updated = [...transferForm.items];
                        updated[idx].ingredientId = e.target.value;
                        setTransferForm({ ...transferForm, items: updated });
                      }}
                      style={{ flex: 3, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- Select Material --</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} (Available: {ing.stockLevel} {ing.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...transferForm.items];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setTransferForm({ ...transferForm, items: updated });
                      }}
                      style={{ flex: 1.5, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />

                    {transferForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = transferForm.items.filter((_, i) => i !== idx);
                          setTransferForm({ ...transferForm, items: updated });
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Transfer Notes / Vehicle Info</label>
                <input
                  type="text"
                  placeholder="e.g. Van #4 delivery or morning replenishment"
                  value={transferForm.notes}
                  onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.65rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Create Transfer Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW TRANSFER DETAILS */}
      {selectedTransferForView && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Transfer {selectedTransferForView.transferNumber}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Status: {selectedTransferForView.status}</span>
              </div>
              <button onClick={() => setSelectedTransferForView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><b>Source:</b> {selectedTransferForView.sourceBranch?.name || 'Central Commissary'}</div>
              <div><b>Destination:</b> {selectedTransferForView.destinationBranch?.name || 'Branch'}</div>
              <div><b>Notes:</b> {selectedTransferForView.notes || 'None'}</div>
              {selectedTransferForView.dispatchedAt && <div><b>Dispatched:</b> {new Date(selectedTransferForView.dispatchedAt).toLocaleString()} by {selectedTransferForView.dispatchedBy}</div>}
              {selectedTransferForView.receivedAt && <div><b>Received:</b> {new Date(selectedTransferForView.receivedAt).toLocaleString()} by {selectedTransferForView.receivedBy}</div>}
            </div>

            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Transferred Line Items</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.5rem' }}>Material</th>
                  <th style={{ padding: '0.5rem' }}>Qty Dispatched</th>
                  <th style={{ padding: '0.5rem' }}>Qty Received</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransferForView.items?.map((ti: any) => (
                  <tr key={ti.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{ti.ingredient?.name}</td>
                    <td style={{ padding: '0.5rem' }}>{ti.quantityDispatched} {ti.unit}</td>
                    <td style={{ padding: '0.5rem' }}>{ti.quantityReceived} {ti.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedTransferForView(null)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: START NEW CYCLE AUDIT (Phase 4) */}
      {showAuditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Initiate Stock Audit</h3>
              <button onClick={() => setShowAuditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <form onSubmit={handleStartAudit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Target Storage Zone *</label>
                <select
                  value={auditForm.storageZone}
                  onChange={e => setAuditForm({ ...auditForm, storageZone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="All">All Storage Zones (Full Restaurant Audit)</option>
                  {storageZonesList.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                  A snapshot of current system stock balances will be captured for verification.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Audit Notes / Shift Reference</label>
                <input
                  type="text"
                  placeholder="e.g. End of month physical inventory count"
                  value={auditForm.notes}
                  onChange={e => setAuditForm({ ...auditForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAuditModal(false)} style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.65rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Create Count Sheet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / SHEET: ACTIVE AUDIT COUNT & RECONCILIATION SHEET */}
      {activeAuditSheet && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '950px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>
                  Physical Count Sheet: {activeAuditSheet.auditNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Zone: <b>{activeAuditSheet.storageZone || 'All'}</b> | Status: <b>{activeAuditSheet.status}</b>
                </span>
              </div>
              <button onClick={() => setActiveAuditSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={22} /></button>
            </div>

            <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.75rem' }}>Raw Material</th>
                    <th style={{ padding: '0.75rem' }}>Storage Zone</th>
                    <th style={{ padding: '0.75rem' }}>System Book Stock</th>
                    <th style={{ padding: '0.75rem', width: '140px' }}>Actual Physical Count *</th>
                    <th style={{ padding: '0.75rem' }}>Variance Qty</th>
                    <th style={{ padding: '0.75rem' }}>Discrepancy Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAuditSheet.items?.map((item: any) => {
                    const currentPhys = auditCounts[item.id]?.physicalQuantity !== undefined
                      ? auditCounts[item.id].physicalQuantity
                      : item.physicalQuantity;
                    const systemQty = item.systemQuantity || 0;
                    const diff = (parseFloat(currentPhys) || 0) - systemQty;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.ingredient?.name}</td>
                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{item.ingredient?.storageZone || 'Dry Storage'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{systemQty} {item.unit}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            disabled={activeAuditSheet.status === 'Reconciled'}
                            type="number"
                            step="0.01"
                            value={currentPhys}
                            onChange={e => {
                              setAuditCounts({
                                ...auditCounts,
                                [item.id]: {
                                  ...auditCounts[item.id],
                                  physicalQuantity: parseFloat(e.target.value) || 0
                                }
                              });
                            }}
                            style={{ width: '100px', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: diff < 0 ? '#dc2626' : diff > 0 ? '#059669' : '#64748b' }}>
                          {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} {item.unit}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <select
                            disabled={activeAuditSheet.status === 'Reconciled'}
                            value={auditCounts[item.id]?.discrepancyReason || item.discrepancyReason || 'COUNTING_ERROR'}
                            onChange={e => {
                              setAuditCounts({
                                ...auditCounts,
                                [item.id]: {
                                  ...auditCounts[item.id],
                                  discrepancyReason: e.target.value
                                }
                              });
                            }}
                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                          >
                            <option value="COUNTING_ERROR">Counting Error / Correction</option>
                            <option value="SPOILAGE">Spoilage / Expired</option>
                            <option value="THEFT_SHRINKAGE">Shrinkage / Unrecorded Loss</option>
                            <option value="SPILLAGE">Spillage / Breakage</option>
                            <option value="PORTION_OVERCOOKING">Portion Overcooking / Kitchen Waste</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setActiveAuditSheet(null)}
                style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>

              {activeAuditSheet.status !== 'Reconciled' && (
                <button
                  type="button"
                  onClick={() => handleReconcileAudit(activeAuditSheet.id)}
                  style={{ padding: '0.65rem 1.75rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Icons.CheckCircle2 size={18} /> Reconcile & Overwrite Stock Balances
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
