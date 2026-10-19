import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'orders' | 'receive' | 'receipts'>('orders');

  // Create PO Modal
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({
    vendorId: '',
    poNumber: '',
    expectedDeliveryDate: '',
    notes: '',
    status: 'Ordered',
    items: [] as any[]
  });

  // Receive Stock Screen State
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedPOId, setSelectedPOId] = useState('');
  const [receiveForm, setReceiveForm] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    receiptDate: new Date().toISOString().split('T')[0],
    amountPaid: 0,
    items: [] as any[]
  });
  const [isReceiving, setIsReceiving] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/batches').then(res => res.json())
    ]).then(([p, v, i, b]) => {
      setPurchases(Array.isArray(p) ? p : []);
      setVendors(Array.isArray(v) ? v : []);
      setIngredients(Array.isArray(i) ? i : []);
      setBatches(Array.isArray(b) ? b : []);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When PO is selected in Receive Stock screen, initialize received items from PO
  const handleSelectPOForReceive = (poId: string) => {
    setSelectedPOId(poId);
    const po = purchases.find(p => p.id === parseInt(poId));
    if (po && po.items && po.items.length > 0) {
      const itemsToReceive = po.items.map((item: any) => {
        const remaining = Math.max(0, (item.quantityOrdered || 0) - (item.quantityReceived || 0));
        return {
          ingredientId: item.ingredient?.id,
          ingredientName: item.ingredient?.name,
          unit: item.unit || item.ingredient?.unit || 'kg',
          quantityOrdered: item.quantityOrdered,
          alreadyReceived: item.quantityReceived || 0,
          quantity: remaining, // default to remaining
          costPerUnit: item.unitCost || item.ingredient?.costPerUnit || 0,
          expiryDate: ''
        };
      });
      setReceiveForm({
        ...receiveForm,
        invoiceNumber: po.invoiceNumber && !po.invoiceNumber.startsWith('INV-PO-') ? po.invoiceNumber : '',
        items: itemsToReceive
      });
    } else {
      setReceiveForm({ ...receiveForm, items: [] });
    }
  };

  // Add Item to PO Form
  const handleAddPOItem = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { ingredientId: '', quantity: 1, costPerUnit: 0, unit: 'kg' }]
    });
  };

  const handlePOItemChange = (index: number, field: string, value: any) => {
    const updated = [...poForm.items];
    updated[index][field] = value;
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === parseInt(value));
      if (ing) {
        updated[index].unit = ing.unit || 'kg';
        updated[index].costPerUnit = ing.costPerUnit || 0;
      }
    }
    setPoForm({ ...poForm, items: updated });
  };

  const handleRemovePOItem = (index: number) => {
    setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== index) });
  };

  // Submit PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poForm.items.length === 0) {
      alert("Please add at least one item to the purchase order.");
      return;
    }
    try {
      const totalAmount = poForm.items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.costPerUnit) || 0)), 0);
      const res = await apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...poForm,
          totalAmount
        })
      });
      if (res.ok) {
        setShowPOModal(false);
        setPoForm({ vendorId: '', poNumber: '', expectedDeliveryDate: '', notes: '', status: 'Ordered', items: [] });
        fetchData();
        alert("Purchase Order created successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to create Purchase Order");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to create Purchase Order");
    }
  };

  // Submit Receive Stock
  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOId) {
      alert("Please select a Purchase Order to receive stock against.");
      return;
    }
    if (!receiveForm.invoiceNumber.trim()) {
      alert("Please enter the vendor's invoice number.");
      return;
    }
    const validItems = receiveForm.items.filter(item => parseFloat(item.quantity) > 0);
    if (validItems.length === 0) {
      alert("Please enter a received quantity greater than 0 for at least one item.");
      return;
    }

    setIsReceiving(true);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/purchases/${selectedPOId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: receiveForm.invoiceNumber,
          invoiceDate: receiveForm.invoiceDate,
          receiptDate: receiveForm.receiptDate,
          amountPaid: receiveForm.amountPaid,
          items: validItems
        })
      });
      if (res.ok) {
        alert("Stock received successfully! Raw material inventory and purchase batches have been updated.");
        setSelectedPOId('');
        setReceiveForm({
          invoiceNumber: '',
          invoiceDate: new Date().toISOString().split('T')[0],
          receiptDate: new Date().toISOString().split('T')[0],
          amountPaid: 0,
          items: []
        });
        fetchData();
        setActiveTab('orders');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to receive stock");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to receive stock");
    } finally {
      setIsReceiving(false);
    }
  };

  // Cancel PO
  const handleCancelPO = async (poId: number) => {
    if (!window.confirm("Are you sure you want to cancel this purchase order?")) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/purchases/${poId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to cancel purchase order");
      }
    } catch (e: any) {
      alert(e?.message || "Error cancelling purchase order");
    }
  };

  // Filtered POs
  const filteredPurchases = purchases.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (vendorFilter !== 'ALL' && p.vendor?.id !== parseInt(vendorFilter)) return false;
    return true;
  });

  // Open POs for selected vendor in Receive Stock
  const openPOsForSelectedVendor = selectedVendorId
    ? purchases.filter(p => p.vendor?.id === parseInt(selectedVendorId) && p.status !== 'Cancelled' && p.status !== 'Received')
    : [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Purchase Orders & Goods Receipt</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Manage procurement, vendor purchase orders, and receive raw material stock</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => {
              setSelectedVendorId('');
              setSelectedPOId('');
              setActiveTab('receive');
            }}
            style={{ padding: '0.75rem 1.25rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Icons.PackageCheck size={18} /> Receive Stock
          </button>
          <button
            onClick={() => {
              setPoForm({ vendorId: '', poNumber: 'PO-' + Date.now().toString().slice(-6), expectedDeliveryDate: '', notes: '', status: 'Ordered', items: [] });
              setShowPOModal(true);
            }}
            style={{ padding: '0.75rem 1.25rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Icons.Plus size={18} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'orders' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'orders' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Icons.FileText size={18} /> Purchase Orders ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('receive')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'receive' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'receive' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Icons.PackagePlus size={18} /> Receive Stock Screen
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'receipts' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'receipts' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Icons.History size={18} /> Received Goods Batches ({batches.length})
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Vendor</label>
              <select
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value="ALL">All Vendors</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Ordered">Ordered</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {isLoading ? <div>Loading Purchase Orders...</div> : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#475569' }}>
                    <th style={{ padding: '1rem' }}>PO Number</th>
                    <th style={{ padding: '1rem' }}>Vendor</th>
                    <th style={{ padding: '1rem' }}>Expected Delivery</th>
                    <th style={{ padding: '1rem' }}>Items</th>
                    <th style={{ padding: '1rem' }}>Total Cost</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map(p => {
                    const statusColors: any = {
                      Draft: { bg: '#f1f5f9', color: '#475569' },
                      Ordered: { bg: '#e0f2fe', color: '#0369a1' },
                      'Partially Received': { bg: '#fef3c7', color: '#b45309' },
                      Received: { bg: '#d1fae5', color: '#047857' },
                      Cancelled: { bg: '#fee2e2', color: '#b91c1c' }
                    };
                    const color = statusColors[p.status] || { bg: '#f1f5f9', color: '#475569' };

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>
                          <div>{p.poNumber || `PO-${p.id}`}</div>
                          {p.invoiceNumber && !p.invoiceNumber.startsWith('INV-PO-') && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Inv: {p.invoiceNumber}</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>{p.vendor?.name || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{p.expectedDeliveryDate || p.invoiceDate || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.875rem' }}>{p.items?.length || 0} line items</span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>₹{(p.totalAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {p.status !== 'Received' && p.status !== 'Cancelled' && (
                              <button
                                onClick={() => {
                                  setSelectedVendorId(p.vendor?.id?.toString() || '');
                                  handleSelectPOForReceive(p.id.toString());
                                  setActiveTab('receive');
                                }}
                                style={{ padding: '0.4rem 0.8rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Receive
                              </button>
                            )}
                            {p.status !== 'Received' && p.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelPO(p.id)}
                                style={{ padding: '0.4rem 0.6rem', backgroundColor: '#f1f5f9', color: '#ef4444', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No purchase orders matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: RECEIVE STOCK WORKFLOW SCREEN */}
      {activeTab === 'receive' && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.PackageCheck size={22} color="#0284c7" /> Goods Receipt / Stock Inward
          </h3>

          <form onSubmit={handleReceiveStockSubmit}>
            {/* Step 1: Select Vendor and PO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Select Vendor *</label>
                <select
                  required
                  value={selectedVendorId}
                  onChange={e => {
                    setSelectedVendorId(e.target.value);
                    setSelectedPOId('');
                    setReceiveForm({ ...receiveForm, items: [] });
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.phone || 'No phone'})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Select Purchase Order *</label>
                <select
                  required
                  value={selectedPOId}
                  onChange={e => handleSelectPOForReceive(e.target.value)}
                  disabled={!selectedVendorId}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: !selectedVendorId ? '#f8fafc' : 'white' }}
                >
                  <option value="">-- Choose Open PO --</option>
                  {openPOsForSelectedVendor.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber || `PO-${po.id}`} — Total ₹{(po.totalAmount || 0).toFixed(2)} ({po.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Invoice & Receipt Details */}
            {selectedPOId && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#334155' }}>3. Invoice & Receipt Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vendor Invoice # *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. INV-9042"
                      value={receiveForm.invoiceNumber}
                      onChange={e => setReceiveForm({ ...receiveForm, invoiceNumber: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Invoice Date *</label>
                    <input
                      required
                      type="date"
                      value={receiveForm.invoiceDate}
                      onChange={e => setReceiveForm({ ...receiveForm, invoiceDate: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Stock Receipt Date *</label>
                    <input
                      required
                      type="date"
                      value={receiveForm.receiptDate}
                      onChange={e => setReceiveForm({ ...receiveForm, receiptDate: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Amount Paid (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={receiveForm.amountPaid}
                      onChange={e => setReceiveForm({ ...receiveForm, amountPaid: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Items Received List */}
            {selectedPOId && receiveForm.items.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>4. Items Received (Enter Inward Quantities)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem', color: '#475569' }}>
                      <th style={{ padding: '0.75rem' }}>Raw Material</th>
                      <th style={{ padding: '0.75rem' }}>Ordered</th>
                      <th style={{ padding: '0.75rem' }}>Previously Received</th>
                      <th style={{ padding: '0.75rem' }}>Receiving Now *</th>
                      <th style={{ padding: '0.75rem' }}>Unit Cost (₹) *</th>
                      <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                      <th style={{ padding: '0.75rem' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveForm.items.map((item, idx) => {
                      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.costPerUnit) || 0);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.ingredientName}</td>
                          <td style={{ padding: '0.75rem' }}>{item.quantityOrdered} {item.unit}</td>
                          <td style={{ padding: '0.75rem', color: '#64748b' }}>{item.alreadyReceived} {item.unit}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                required
                                type="number"
                                step="0.001"
                                min="0"
                                value={item.quantity}
                                onChange={e => {
                                  const updated = [...receiveForm.items];
                                  updated[idx].quantity = e.target.value;
                                  setReceiveForm({ ...receiveForm, items: updated });
                                }}
                                style={{ width: '90px', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.unit}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <input
                              required
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costPerUnit}
                              onChange={e => {
                                const updated = [...receiveForm.items];
                                updated[idx].costPerUnit = e.target.value;
                                setReceiveForm({ ...receiveForm, items: updated });
                              }}
                              style={{ width: '90px', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <input
                              type="date"
                              value={item.expiryDate}
                              onChange={e => {
                                const updated = [...receiveForm.items];
                                updated[idx].expiryDate = e.target.value;
                                setReceiveForm({ ...receiveForm, items: updated });
                              }}
                              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedPOId && receiveForm.items.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPOId('');
                    setReceiveForm({ invoiceNumber: '', invoiceDate: '', receiptDate: '', amountPaid: 0, items: [] });
                  }}
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReceiving}
                  style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Icons.CheckCircle size={18} /> {isReceiving ? 'Processing...' : 'Confirm & Inward Stock'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: RECEIVED GOODS BATCHES (FIFO) */}
      {activeTab === 'receipts' && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#475569' }}>
                <th style={{ padding: '1rem' }}>Batch #</th>
                <th style={{ padding: '1rem' }}>Raw Material</th>
                <th style={{ padding: '1rem' }}>Received Qty</th>
                <th style={{ padding: '1rem' }}>Current Qty</th>
                <th style={{ padding: '1rem' }}>Cost / Unit</th>
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
                  <td style={{ padding: '1rem', color: b.currentQuantity <= 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
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
                    No received batches recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '2rem', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Create Purchase Order</h3>
              <button onClick={() => setShowPOModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <form onSubmit={handleCreatePO}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vendor *</label>
                  <select
                    required
                    value={poForm.vendorId}
                    onChange={e => setPoForm({ ...poForm, vendorId: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>PO Number</label>
                  <input
                    type="text"
                    value={poForm.poNumber}
                    onChange={e => setPoForm({ ...poForm, poNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={e => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Raw Materials to Order</h4>
                  <button type="button" onClick={handleAddPOItem} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icons.Plus size={14} /> Add Raw Material
                  </button>
                </div>

                {poForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <select
                      required
                      value={item.ingredientId}
                      onChange={e => handlePOItemChange(idx, 'ingredientId', e.target.value)}
                      style={{ flex: 3, padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Select Raw Material</option>
                      {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                    </select>

                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handlePOItemChange(idx, 'quantity', e.target.value)}
                      style={{ flex: 1.5, padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />

                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={e => handlePOItemChange(idx, 'unit', e.target.value)}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />

                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Cost/Unit"
                      value={item.costPerUnit}
                      onChange={e => handlePOItemChange(idx, 'costPerUnit', e.target.value)}
                      style={{ flex: 1.5, padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />

                    <button type="button" onClick={() => handleRemovePOItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                      <Icons.Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {poForm.items.length === 0 && (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                    Click "+ Add Raw Material" to add items to this order.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Notes</label>
                <textarea
                  rows={2}
                  value={poForm.notes}
                  onChange={e => setPoForm({ ...poForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setShowPOModal(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Create Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
