import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<any | null>(null);
  const [receiptsSubTab, setReceiptsSubTab] = useState<'grns' | 'batches'>('grns');
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
    paymentMethod: 'CREDIT',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    items: [] as any[]
  });
  const [isReceiving, setIsReceiving] = useState(false);

  // Invoice Verification & Source of Truth State
  const [invoiceVerificationStatus, setInvoiceVerificationStatus] = useState<
    'IDLE' | 'CHECKING' | 'VERIFIED' | 'INVALID' | 'DUPLICATE' | 'UNVERIFIED' | 'VENDOR_MISMATCH' | 'MISMATCH'
  >('IDLE');
  const [invoiceVerificationMessage, setInvoiceVerificationMessage] = useState('');
  const [verifiedInvoiceData, setVerifiedInvoiceData] = useState<any>(null);

  // Phase 5: Barcode Quick Search in Receiving Screen
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [highlightedIngredientId, setHighlightedIngredientId] = useState<number | null>(null);

  // Phase 5: Invoice Attachment Modal & Viewer State
  const [invoiceModalPO, setInvoiceModalPO] = useState<any>(null);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string>('');
  const [previewDocName, setPreviewDocName] = useState<string>('');

  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/vendors').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/ingredients').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/batches').then(res => res.ok ? res.json() : []).catch(() => []),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/receipts').then(res => res.ok ? res.json() : []).catch(() => [])
    ]).then(([p, v, i, b, r]) => {
      setPurchases(Array.isArray(p) ? p : []);
      setVendors(Array.isArray(v) ? v : []);
      setIngredients(Array.isArray(i) ? i : []);
      setBatches(Array.isArray(b) ? b : []);
      setReceipts(Array.isArray(r) ? r : []);
      setIsLoading(false);
    }).catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When PO is selected in Receive Stock screen, reset verification and enforce invoice verification before items display
  const handleSelectPOForReceive = (poId: string) => {
    setSelectedPOId(poId);
    setInvoiceVerificationStatus('IDLE');
    setInvoiceVerificationMessage('');
    setVerifiedInvoiceData(null);
    if (!poId) {
      setReceiveForm(prev => ({
        ...prev,
        invoiceNumber: '',
        items: []
      }));
      return;
    }
    const po = purchases.find(p => p.id === parseInt(poId));
    setReceiveForm(prev => ({
      ...prev,
      invoiceNumber: '', // Strictly empty until user enters it or document is verified
      invoiceDate: po?.invoiceDate ? po.invoiceDate : prev.invoiceDate,
      items: [] // Items strictly hidden until invoice is validated!
    }));
  };

  // Verify original supplier invoice against backend records, PO, and vendor
  const handleVerifyInvoice = async (forcedInvoiceNumber?: string) => {
    const invNum = (forcedInvoiceNumber !== undefined ? forcedInvoiceNumber : receiveForm.invoiceNumber).trim();
    if (!selectedPOId) {
      alert('Please select a Purchase Order first.');
      return;
    }
    if (!invNum) {
      setInvoiceVerificationStatus('INVALID');
      setInvoiceVerificationMessage('Please enter a Vendor Invoice Number to verify.');
      setReceiveForm(prev => ({ ...prev, items: [] }));
      return;
    }

    setInvoiceVerificationStatus('CHECKING');
    setInvoiceVerificationMessage('Verifying invoice details against supplier records and Purchase Order...');

    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/purchases/${selectedPOId}/verify-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invNum,
          vendorId: selectedVendorId ? parseInt(selectedVendorId) : null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (data.verified) {
        setInvoiceVerificationStatus('VERIFIED');
        setInvoiceVerificationMessage(data.message || 'Invoice successfully verified against original supplier records.');
        setVerifiedInvoiceData(data);
        const mappedItems = Array.isArray(data.items) ? data.items.map((it: any) => {
          const invQty = parseFloat(it.invoiceQuantity !== undefined ? it.invoiceQuantity : it.quantity) || 1;
          const mult = parseFloat(it.multiplier) || 1;
          const inwardQty = it.inwardQuantity !== undefined ? parseFloat(it.inwardQuantity) : (invQty * mult);
          const ordered = it.orderedQuantity !== undefined ? parseFloat(it.orderedQuantity) : inwardQty;
          const rec = it.alreadyReceivedQuantity !== undefined ? parseFloat(it.alreadyReceivedQuantity) : (it.alreadyReceived || 0);
          const rem = Math.max(0, it.remainingQuantity !== undefined ? parseFloat(it.remainingQuantity) : (ordered - rec));
          const receivingQty = it.receivingQuantity !== undefined ? parseFloat(it.receivingQuantity) : inwardQty;
          const lineTotal = it.lineTotal !== undefined ? parseFloat(it.lineTotal) : ((parseFloat(it.unitRate || 0)) * invQty);
          const effectiveUnitCost = inwardQty > 0 ? (lineTotal / inwardQty) : (it.costPerUnit || it.unitRate || 0);

          return {
            ingredientId: it.matchedIngredientId,
            ingredientName: it.matchedIngredientName || it.shortName || it.description,
            itemCode: it.itemCode || '',
            description: it.description || it.shortName || 'Item',
            invoiceQuantity: invQty,
            invoiceUnit: it.invoiceUnit || it.unit || 'pc',
            packSize: it.packSize,
            packUnit: it.packUnit,
            packDisplay: it.packDisplay || `1 ${it.invoiceUnit || it.unit || 'unit'} = ${mult} ${it.baseUnit || 'kg'}`,
            multiplier: mult,
            baseUnit: it.baseUnit || it.unit || 'kg',
            unit: it.baseUnit || it.unit || 'kg',
            inwardQuantity: inwardQty,
            quantityOrdered: ordered,
            alreadyReceived: rec,
            remaining: rem,
            quantity: receivingQty,
            costPerUnit: effectiveUnitCost,
            unitRate: parseFloat(it.unitRate) || 0,
            mrp: it.mrp,
            discountPercent: it.discountPercent || 0,
            discountAmount: it.discountAmount || 0,
            taxRate: it.taxRate || 0,
            taxAmount: it.taxAmount || 0,
            lineTotal: lineTotal,
            mismatchFlag: Boolean(it.mismatchFlag),
            mismatchReason: it.mismatchReason || '',
            expiryDate: it.expiryDate || ''
          };
        }) : [];
        setReceiveForm(prev => ({
          ...prev,
          invoiceNumber: data.invoiceNumber || invNum,
          invoiceDate: data.invoiceDate || prev.invoiceDate,
          items: mappedItems
        }));
      } else {
        setInvoiceVerificationStatus(data.status || 'INVALID');
        setInvoiceVerificationMessage(data.message || 'Invoice verification failed. Please check the invoice number or upload the original document.');
        setVerifiedInvoiceData(null);
        setReceiveForm(prev => ({ ...prev, items: [] }));
      }
    } catch (err: any) {
      setInvoiceVerificationStatus('INVALID');
      setInvoiceVerificationMessage(err?.message || 'Network error verifying invoice.');
      setVerifiedInvoiceData(null);
      setReceiveForm(prev => ({ ...prev, items: [] }));
    }
  };

  // Allow user to review and correct raw material mappings for verified invoice items
  const handleItemMappingChange = (idx: number, newIngredientId: string) => {
    const updated = [...receiveForm.items];
    const targetItem = updated[idx];
    if (!newIngredientId) {
      targetItem.ingredientId = null;
      targetItem.ingredientName = '';
      targetItem.mismatchFlag = true;
      targetItem.mismatchReason = 'Unmapped: Please select an existing raw material from the inventory catalog.';
      setReceiveForm({ ...receiveForm, items: updated });
      return;
    }

    const newIng = ingredients.find(i => i.id === parseInt(newIngredientId));
    if (!newIng) return;

    targetItem.ingredientId = newIng.id;
    targetItem.ingredientName = newIng.name;
    targetItem.baseUnit = newIng.unit || 'kg';
    targetItem.unit = newIng.unit || 'kg';
    targetItem.mismatchFlag = false;
    targetItem.mismatchReason = '';

    // Recompute multiplier based on pack size and new base unit
    const iu = (targetItem.invoiceUnit || 'pc').toLowerCase();
    const bu = (newIng.unit || 'kg').toLowerCase();
    const pu = (targetItem.packUnit || '').toLowerCase();
    const ps = parseFloat(targetItem.packSize) || 0;

    let mult = 1;
    if (bu === 'pcs' || bu === 'units' || bu === 'pc') {
      mult = 1;
    } else if (ps > 0 && pu) {
      if (pu === bu) mult = ps;
      else if (pu === 'g' && bu === 'kg') mult = ps / 1000;
      else if (pu === 'kg' && bu === 'g') mult = ps * 1000;
      else if (pu === 'ml' && bu === 'l') mult = ps / 1000;
      else if (pu === 'l' && bu === 'ml') mult = ps * 1000;
    } else if (iu === bu) {
      mult = 1;
    } else if (iu === 'g' && bu === 'kg') mult = 0.001;
    else if (iu === 'kg' && bu === 'g') mult = 1000;
    else if (iu === 'ml' && bu === 'l') mult = 0.001;
    else if (iu === 'l' && bu === 'ml') mult = 1000;

    targetItem.multiplier = mult;
    targetItem.packDisplay = `1 ${targetItem.invoiceUnit || 'unit'} = ${mult} ${newIng.unit}`;
    const invQty = parseFloat(targetItem.invoiceQuantity) || 1;
    targetItem.inwardQuantity = invQty * mult;
    targetItem.quantity = targetItem.inwardQuantity;
    targetItem.costPerUnit = targetItem.inwardQuantity > 0 ? (targetItem.lineTotal / targetItem.inwardQuantity) : 0;

    // Check PO status
    const poItem = selectedPOObject?.items?.find((p: any) => p.ingredient?.id === newIng.id);
    if (poItem) {
      targetItem.quantityOrdered = poItem.quantityOrdered;
      targetItem.alreadyReceived = poItem.quantityReceived || 0;
      targetItem.remaining = Math.max(0, poItem.quantityOrdered - (poItem.quantityReceived || 0));
    } else {
      targetItem.quantityOrdered = targetItem.inwardQuantity;
      targetItem.alreadyReceived = 0;
      targetItem.remaining = targetItem.inwardQuantity;
    }

    setReceiveForm({ ...receiveForm, items: updated });
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
      alert('Please add at least one item to the purchase order.');
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
        alert('Purchase Order created successfully!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to create Purchase Order');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to create Purchase Order');
    }
  };

  // Submit Receive Stock
  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      alert('Please select a vendor first.');
      return;
    }
    if (!selectedPOId) {
      alert('Please select a Purchase Order to receive stock against.');
      return;
    }
    if (invoiceVerificationStatus !== 'VERIFIED') {
      alert('Please verify the vendor invoice before receiving stock. Unverified or mismatched invoices cannot be inwarded.');
      return;
    }
    if (!receiveForm.invoiceNumber.trim()) {
      alert("Please enter the vendor's invoice number.");
      return;
    }
    if (!receiveForm.invoiceDate) {
      alert('Please enter the invoice date.');
      return;
    }
    if (!receiveForm.receiptDate) {
      alert('Please enter the stock receipt date.');
      return;
    }

    // Check for duplicate invoice on this PO client-side
    const duplicate = receipts.find(
      r => r.purchaseOrder?.id === parseInt(selectedPOId) &&
           r.invoiceNumber?.trim().toLowerCase() === receiveForm.invoiceNumber.trim().toLowerCase()
    );
    if (duplicate) {
      alert(`Invoice #${receiveForm.invoiceNumber.trim()} has already been recorded for this Purchase Order (Receipt: ${duplicate.receiptNumber}). Duplicate submission is prevented.`);
      return;
    }

    // Validate over-receiving
    for (const item of receiveForm.items) {
      const qty = parseFloat(item.quantity) || 0;
      const maxRemaining = item.remaining !== undefined ? item.remaining : Math.max(0, (item.quantityOrdered || 0) - (item.alreadyReceived || 0));
      if (qty > maxRemaining) {
        alert(`Receiving quantity (${qty} ${item.unit}) for ${item.ingredientName} exceeds remaining ordered quantity (${maxRemaining} ${item.unit}). Over-receiving is not permitted.`);
        return;
      }
    }

    const validItems = receiveForm.items.filter(item => parseFloat(item.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please enter a received quantity greater than 0 for at least one item.');
      return;
    }

    setIsReceiving(true);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/purchases/${selectedPOId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: receiveForm.invoiceNumber.trim(),
          invoiceDate: receiveForm.invoiceDate,
          receiptDate: receiveForm.receiptDate,
          invoiceTotal: verifiedInvoiceData?.invoiceTotal || totalInwardAmount,
          taxableAmount: verifiedInvoiceData?.taxableAmount || totalInwardAmount,
          taxAmount: verifiedInvoiceData?.taxAmount || 0,
          items: validItems
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(
          `Stock Received & Inwarded Successfully!\n\n` +
          `• GRN: ${data.receiptNumber || 'Created'}\n` +
          `• Vendor Invoice: #${receiveForm.invoiceNumber.trim()}\n` +
          `• Purchase Order: ${data.poNumber || `PO-${selectedPOId}`} [${data.status}]\n` +
          `• Total Inward Amount: ₹${(data.totalAmount !== undefined ? data.totalAmount : totalInwardAmount).toFixed(2)}\n` +
          `• Verified Supplier Invoice Value: ₹${(verifiedInvoiceData?.invoiceTotal || data.totalAmount || totalInwardAmount).toFixed(2)}\n\n` +
          `Raw Material stock levels and batch ledger have been updated in PostgreSQL.`
        );
        setSelectedPOId('');
        setSelectedVendorId('');
        setInvoiceVerificationStatus('IDLE');
        setInvoiceVerificationMessage('');
        setVerifiedInvoiceData(null);
        setReceiveForm({
          invoiceNumber: '',
          invoiceDate: new Date().toISOString().split('T')[0],
          receiptDate: new Date().toISOString().split('T')[0],
          amountPaid: 0,
          paymentMethod: 'CREDIT',
          paymentReference: '',
          paymentDate: new Date().toISOString().split('T')[0],
          items: []
        });
        fetchData();
        setActiveTab('receipts');
      } else {
        alert(data.message || 'Failed to receive stock');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to receive stock');
    } finally {
      setIsReceiving(false);
    }
  };

  // Cancel PO
  const handleCancelPO = async (poId: number) => {
    if (!window.confirm('Are you sure you want to cancel this purchase order?')) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/purchases/${poId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to cancel purchase order');
      }
    } catch (e: any) {
      alert(e?.message || 'Error cancelling purchase order');
    }
  };

  // Phase 5: Barcode scanner in goods receipt
  const handleBarcodeScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/barcode/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const ing = await res.json();
        setHighlightedIngredientId(ing.id);
        const itemIdx = receiveForm.items.findIndex(it => it.ingredientId === ing.id);
        if (itemIdx >= 0) {
          const el = document.getElementById(`receive-qty-input-${itemIdx}`);
          if (el) el.focus();
        } else {
          alert(`Scanned "${ing.name}", but it is not listed in the selected purchase order.`);
        }
      } else {
        alert(`No raw material found for barcode: ${trimmed}`);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Phase 5: Handle file upload for invoice attachment with automatic extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, poId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setIsUploadingInvoice(true);
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await apiFetch(`https://erp-api.neurolinx.in/api/inventory/purchases/${poId}/attach-invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceAttachmentUrl: base64Data,
            invoiceAttachmentName: file.name
          })
        });
        const updatedPO = await res.json().catch(() => ({}));
        setIsUploadingInvoice(false);
        if (res.ok) {
          alert('Vendor invoice/challan document attached and extracted successfully!');
          setInvoiceModalPO(null);
          fetchData();
          if (selectedPOId === poId.toString() && updatedPO?.invoiceNumber) {
            setReceiveForm(prev => ({ ...prev, invoiceNumber: updatedPO.invoiceNumber }));
            handleVerifyInvoice(updatedPO.invoiceNumber);
          }
        } else {
          alert('Failed to attach invoice document');
        }
      } catch (err: any) {
        setIsUploadingInvoice(false);
        alert(err?.message || 'Error attaching invoice document');
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered POs
  const filteredPurchases = purchases.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (vendorFilter !== 'ALL' && p.vendor?.id !== parseInt(vendorFilter)) return false;
    return true;
  });

  const openPOsForSelectedVendor = selectedVendorId
    ? purchases.filter(p => p.vendor?.id === parseInt(selectedVendorId) && p.status !== 'Cancelled' && p.status !== 'Received')
    : [];

  const selectedPOObject = purchases.find(p => p.id === parseInt(selectedPOId));

  // Receive Stock Step Progression
  const isStep1Complete = Boolean(selectedVendorId);
  const isStep2Complete = Boolean(selectedPOId);
  const isStep3Complete = Boolean(
    isStep1Complete &&
    isStep2Complete &&
    invoiceVerificationStatus === 'VERIFIED' &&
    receiveForm.invoiceNumber.trim() &&
    receiveForm.invoiceDate &&
    receiveForm.receiptDate
  );
  const showItemsReceived = Boolean(
    isStep1Complete &&
    isStep2Complete &&
    isStep3Complete &&
    invoiceVerificationStatus === 'VERIFIED' &&
    Array.isArray(receiveForm.items) &&
    receiveForm.items.length > 0
  );

  const totalInwardAmount = receiveForm.items.reduce(
    (sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.costPerUnit) || 0)),
    0
  );
  const validReceivingItemsCount = receiveForm.items.filter(it => parseFloat(it.quantity) > 0).length;
  const hasOverReceivingError = receiveForm.items.some(it => {
    const maxRemaining = it.remaining !== undefined ? it.remaining : Math.max(0, (it.quantityOrdered || 0) - (it.alreadyReceived || 0));
    return (parseFloat(it.quantity) || 0) > maxRemaining;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 700 }}>Purchase Orders & Goods Receipt</h2>
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
              Phase 5 Verified
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Procurement workflow, vendor invoice cross-verification, and barcode-accelerated stock receiving
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedVendorId('');
              setSelectedPOId('');
              setActiveTab('receive');
            }}
            style={{ padding: '0.75rem 1.25rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Icons.PackageCheck size={18} /> Receive Stock Screen
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
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '0.5rem' }}>
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
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>PO Number</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Vendor</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Delivery Target</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Items Ordered</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Total Cost</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Invoice Document</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
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
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                          <div>{p.poNumber || `PO-${p.id}`}</div>
                          {p.invoiceNumber && !p.invoiceNumber.startsWith('INV-PO-') && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Inv: {p.invoiceNumber}</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>{p.vendor?.name || 'N/A'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{p.expectedDeliveryDate || p.invoiceDate || '—'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {p.items?.length || 0} line items
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>₹{(p.totalAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {p.invoiceAttachmentUrl ? (
                            <button
                              onClick={() => {
                                setPreviewDocUrl(p.invoiceAttachmentUrl);
                                setPreviewDocName(p.invoiceAttachmentName || 'Vendor-Invoice.pdf');
                                setShowInvoiceViewer(true);
                              }}
                              style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Icons.FileCheck size={14} color="#059669" /> View Challan
                            </button>
                          ) : (
                            <button
                              onClick={() => setInvoiceModalPO(p)}
                              style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f8fafc', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Icons.Upload size={13} /> + Attach Bill
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {p.status !== 'Received' && p.status !== 'Cancelled' && (
                              <button
                                onClick={() => {
                                  setSelectedVendorId(p.vendor?.id?.toString() || '');
                                  handleSelectPOForReceive(p.id.toString());
                                  setActiveTab('receive');
                                }}
                                style={{ padding: '0.35rem 0.75rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Receive
                              </button>
                            )}
                            {p.status !== 'Received' && p.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelPO(p.id)}
                                style={{ padding: '0.35rem 0.6rem', backgroundColor: '#f1f5f9', color: '#ef4444', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
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
                      <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
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
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.PackageCheck size={22} color="#0284c7" /> Goods Receipt / Stock Inward
            </h3>

            {/* Barcode Quick Search Field */}
            {selectedPOId && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '240px' }}>
                  <Icons.ScanBarcode size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                  <input
                    type="text"
                    placeholder="Scan incoming item barcode..."
                    value={barcodeSearch}
                    onChange={e => setBarcodeSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan(barcodeSearch); }}
                    style={{ width: '100%', padding: '0.55rem 0.5rem 0.55rem 2rem', borderRadius: '6px', border: '1px solid #0284c7', fontSize: '0.8rem', backgroundColor: '#f0f9ff' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeScan(barcodeSearch)}
                  style={{ padding: '0.55rem 0.85rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Locate
                </button>
              </div>
            )}
          </div>

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
                    setInvoiceVerificationStatus('IDLE');
                    setInvoiceVerificationMessage('');
                    setVerifiedInvoiceData(null);
                    setReceiveForm({ ...receiveForm, invoiceNumber: '', items: [] });
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

            {/* Step 3: Invoice & Receipt Details */}
            {selectedPOId && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155', fontWeight: 600 }}>3. Invoice & Receipt Details</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Vendor: <strong style={{ color: '#0f172a' }}>{vendors.find(v => v.id === parseInt(selectedVendorId))?.name || '—'}</strong></span>
                    <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                    <span>PO: <strong style={{ color: '#0284c7' }}>{selectedPOObject?.poNumber || `PO-${selectedPOId}`}</strong></span>
                  </div>
                </div>

                {/* Attached Document Status */}
                {selectedPOObject && (
                  <div style={{ backgroundColor: selectedPOObject.invoiceAttachmentUrl ? '#f0fdf4' : '#fffbeb', border: selectedPOObject.invoiceAttachmentUrl ? '1px solid #bbf7d0' : '1px solid #fef3c7', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedPOObject.invoiceAttachmentUrl ? <Icons.FileCheck size={18} color="#166534" /> : <Icons.AlertCircle size={18} color="#b45309" />}
                      <span style={{ fontWeight: 600, color: selectedPOObject.invoiceAttachmentUrl ? '#166534' : '#92400e', fontSize: '0.85rem' }}>
                        {selectedPOObject.invoiceAttachmentUrl ? `Attached Document: ${selectedPOObject.invoiceAttachmentName || 'Supplier Invoice'}` : 'Original Supplier Invoice Document Not Yet Attached'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedPOObject.invoiceAttachmentUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocUrl(selectedPOObject.invoiceAttachmentUrl);
                            setPreviewDocName(selectedPOObject.invoiceAttachmentName || 'Delivery-Challan');
                            setShowInvoiceViewer(true);
                          }}
                          style={{ padding: '0.35rem 0.75rem', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          Inspect Document
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInvoiceModalPO(selectedPOObject)}
                        style={{ padding: '0.35rem 0.75rem', backgroundColor: selectedPOObject.invoiceAttachmentUrl ? '#0284c7' : '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        {selectedPOObject.invoiceAttachmentUrl ? 'Replace Document' : '+ Upload Document'}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vendor Invoice # *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 261036G002900941"
                        value={receiveForm.invoiceNumber}
                        onChange={e => {
                          const val = e.target.value;
                          setReceiveForm(prev => ({
                            ...prev,
                            invoiceNumber: val,
                            items: [] // strictly clear items on invoice number edit
                          }));
                          setInvoiceVerificationStatus('IDLE');
                          setInvoiceVerificationMessage('');
                          setVerifiedInvoiceData(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          borderRadius: '4px',
                          border: invoiceVerificationStatus === 'VERIFIED'
                            ? '2px solid #10b981'
                            : (invoiceVerificationStatus === 'INVALID' || invoiceVerificationStatus === 'DUPLICATE' || invoiceVerificationStatus === 'MISMATCH' || invoiceVerificationStatus === 'VENDOR_MISMATCH')
                              ? '2px solid #ef4444'
                              : '1px solid #cbd5e1',
                          backgroundColor: 'white'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyInvoice()}
                        disabled={invoiceVerificationStatus === 'CHECKING' || !receiveForm.invoiceNumber.trim()}
                        style={{
                          padding: '0.6rem 1rem',
                          backgroundColor: invoiceVerificationStatus === 'CHECKING' ? '#94a3b8' : '#0284c7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: (invoiceVerificationStatus === 'CHECKING' || !receiveForm.invoiceNumber.trim()) ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {invoiceVerificationStatus === 'CHECKING' ? 'Checking...' : 'Verify Invoice'}
                      </button>
                      <label
                        style={{
                          padding: '0.6rem 0.85rem',
                          backgroundColor: '#f8fafc',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          borderRadius: '4px',
                          cursor: isUploadingInvoice ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap'
                        }}
                        title="Upload supplier invoice (PDF/Image) for automatic extraction & verification"
                      >
                        <Icons.FileText size={16} color="#0284c7" />
                        {isUploadingInvoice ? 'Extracting...' : '📎 Attach Invoice'}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: 'none' }}
                          disabled={isUploadingInvoice || !selectedPOId}
                          onChange={e => {
                            if (selectedPOObject) handleFileUpload(e, selectedPOObject.id);
                            else alert('Please select a Purchase Order first.');
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Invoice Date *</label>
                    <input
                      required
                      type="date"
                      value={receiveForm.invoiceDate}
                      onChange={e => setReceiveForm({ ...receiveForm, invoiceDate: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Stock Receipt Date *</label>
                    <input
                      required
                      type="date"
                      value={receiveForm.receiptDate}
                      onChange={e => setReceiveForm({ ...receiveForm, receiptDate: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                    />
                  </div>
                </div>

                {/* Verification Status Banner */}
                {invoiceVerificationStatus === 'CHECKING' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', color: '#1e40af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Loader2 size={16} className="animate-spin" /> Verifying invoice against supplier records...
                  </div>
                )}

                {invoiceVerificationStatus === 'VERIFIED' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', color: '#166534', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <Icons.CheckCircle size={18} color="#15803d" /> Verified Supplier Invoice: #{verifiedInvoiceData?.invoiceNumber}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                      Vendor: <b>{verifiedInvoiceData?.vendorName || selectedPOObject?.vendor?.name}</b> {verifiedInvoiceData?.vendorGstin ? `(GSTIN: ${verifiedInvoiceData.vendorGstin})` : ''} | Verified Invoice Total: <b>₹{(verifiedInvoiceData?.invoiceTotal !== undefined ? verifiedInvoiceData.invoiceTotal : (selectedPOObject?.totalAmount || 0)).toFixed(2)}</b>
                    </div>
                  </div>
                )}

                {(invoiceVerificationStatus === 'INVALID' || invoiceVerificationStatus === 'MISMATCH' || invoiceVerificationStatus === 'VENDOR_MISMATCH' || invoiceVerificationStatus === 'DUPLICATE') && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <Icons.AlertTriangle size={18} color="#dc2626" />
                      {invoiceVerificationStatus === 'DUPLICATE' ? 'Duplicate Invoice Submission Blocked' : 'Invoice Validation Error'}
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      {invoiceVerificationMessage || 'The entered invoice number could not be validated. Option 4 (Items Received) is locked to prevent unauthorized stock posting.'}
                    </div>
                  </div>
                )}

                {invoiceVerificationStatus === 'UNVERIFIED' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fde047', borderRadius: '6px', color: '#854d0e', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.AlertCircle size={18} color="#d97706" />
                      <div>
                        <b>Original Invoice Document Not Attached:</b> {invoiceVerificationMessage}
                      </div>
                    </div>
                    <label
                      style={{
                        padding: '0.45rem 0.9rem',
                        backgroundColor: '#d97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Icons.Upload size={14} /> Upload Supplier Invoice
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          if (selectedPOObject) handleFileUpload(e, selectedPOObject.id);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Guided Notice: Step 4 is hidden until Step 1, 2, 3 are validated */}
            {selectedPOId && !showItemsReceived && (
              <div style={{ padding: '1.25rem', backgroundColor: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: '8px', color: '#1e40af', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Icons.Lock size={20} color="#2563eb" />
                <div>
                  <strong>Option 4 (Items Received) is Locked:</strong> Enter the official supplier invoice number above and click <strong>Verify Invoice</strong> (or attach the invoice file) to validate genuine line items, pack sizes, and prices.
                </div>
              </div>
            )}

            {/* Step 4: Items Received List (Visible ONLY after Option 1, 2, and 3 are validated) */}
            {showItemsReceived && (
              <div style={{ marginBottom: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.PackageCheck size={20} color="#059669" />
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>4. Verified Items Received & Raw Material Mapping Review</h4>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Inwarding against Verified Invoice: <strong style={{ color: '#0284c7' }}>#{receiveForm.invoiceNumber.trim()}</strong>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem', color: '#475569' }}>
                        <th style={{ padding: '0.75rem' }}>Invoice Item & Pack</th>
                        <th style={{ padding: '0.75rem', minWidth: '220px' }}>Mapped Raw Material (Review & Map)</th>
                        <th style={{ padding: '0.75rem' }}>Pack Conversion</th>
                        <th style={{ padding: '0.75rem' }}>PO Ordered</th>
                        <th style={{ padding: '0.75rem' }}>Inward Qty (Base Unit) *</th>
                        <th style={{ padding: '0.75rem' }}>Invoice Rate (₹)</th>
                        <th style={{ padding: '0.75rem' }}>Tax / Disc</th>
                        <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                        <th style={{ padding: '0.75rem' }}>Line Inward Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveForm.items.map((item, idx) => {
                        const inwardQty = parseFloat(item.inwardQuantity) || parseFloat(item.quantity) || 1;
                        const recQty = parseFloat(item.quantity) || 0;
                        const lineInwardValue = inwardQty > 0 ? (item.lineTotal * (recQty / inwardQty)) : 0;
                        const isHighlighted = highlightedIngredientId === item.ingredientId;
                        const maxRemaining = item.remaining !== undefined ? item.remaining : Math.max(0, (item.quantityOrdered || 0) - (item.alreadyReceived || 0));
                        const isExceeding = parseFloat(item.quantity) > maxRemaining;
                        const isUnmapped = !item.ingredientId || item.mismatchFlag;

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: isUnmapped ? '#fffbeb' : isExceeding ? '#fef2f2' : isHighlighted ? '#eff6ff' : 'white',
                              transition: 'background-color 0.3s'
                            }}
                          >
                            <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{item.description || item.ingredientName}</div>
                              {item.itemCode && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HSN: {item.itemCode}</div>}
                              <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '2px' }}>
                                Invoice Qty: <strong>{item.invoiceQuantity} {item.invoiceUnit}</strong>
                              </div>
                              {isUnmapped && (
                                <span style={{ display: 'inline-block', marginTop: '0.35rem', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                                  ⚠️ Unmapped: Flagged for Review
                                </span>
                              )}
                              {isHighlighted && <span style={{ marginLeft: '0.5rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600 }}>[Scanned]</span>}
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                              <select
                                value={item.ingredientId || ''}
                                onChange={e => handleItemMappingChange(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem',
                                  fontSize: '0.8rem',
                                  borderRadius: '4px',
                                  border: isUnmapped ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                  backgroundColor: isUnmapped ? '#fffbeb' : 'white',
                                  fontWeight: 500
                                }}
                              >
                                <option value="">-- Select / Correct Material Mapping --</option>
                                {ingredients.map(ing => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.unit})
                                  </option>
                                ))}
                              </select>
                              {item.ingredientId ? (
                                <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '3px', fontWeight: 600 }}>
                                  ✓ Mapped: {item.ingredientName} (Base: {item.baseUnit})
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '3px', fontWeight: 600 }}>
                                  Select an existing material to map
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top', fontSize: '0.8rem', color: '#475569' }}>
                              <div style={{ fontWeight: 600 }}>{item.packDisplay || `1 ${item.invoiceUnit} = 1 ${item.unit}`}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Multiplier: x{item.multiplier}</div>
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top', color: '#64748b', fontSize: '0.8rem' }}>
                              <div>{item.quantityOrdered} {item.unit}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Prev: {item.alreadyReceived || 0}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: maxRemaining > 0 ? '#0284c7' : '#10b981', marginTop: '2px' }}>
                                Rem: {maxRemaining} {item.unit}
                              </div>
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <input
                                    id={`receive-qty-input-${idx}`}
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
                                    style={{
                                      width: '95px',
                                      padding: '0.4rem',
                                      borderRadius: '4px',
                                      border: isExceeding ? '2px solid #ef4444' : isHighlighted ? '2px solid #0284c7' : '1px solid #cbd5e1',
                                      fontWeight: 600,
                                      backgroundColor: isExceeding ? '#fee2e2' : 'white'
                                    }}
                                  />
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.unit}</span>
                                  <button
                                    type="button"
                                    title="Fill full inward quantity"
                                    onClick={() => {
                                      const updated = [...receiveForm.items];
                                      updated[idx].quantity = item.inwardQuantity !== undefined ? item.inwardQuantity : maxRemaining;
                                      setReceiveForm({ ...receiveForm, items: updated });
                                    }}
                                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    All
                                  </button>
                                </div>
                                {isExceeding && (
                                  <div style={{ color: '#dc2626', fontSize: '0.7rem', fontWeight: 600, marginTop: '2px' }}>
                                    Exceeds remaining ({maxRemaining} {item.unit})
                                  </div>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top', fontSize: '0.85rem' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>₹{(parseFloat(item.unitRate) || parseFloat(item.costPerUnit) || 0).toFixed(2)}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>per {item.invoiceUnit || 'unit'}</div>
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top', fontSize: '0.75rem', color: '#64748b' }}>
                              <div>{item.taxRate ? `${item.taxRate}% GST` : '0%'}</div>
                              {item.discountPercent > 0 && <span style={{ display: 'block', color: '#059669', fontWeight: 600 }}>-{item.discountPercent}% Disc</span>}
                              {item.taxAmount > 0 && <span style={{ display: 'block', color: '#64748b' }}>Tax: ₹{Number(item.taxAmount).toFixed(2)}</span>}
                            </td>

                            <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
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

                            <td style={{ padding: '0.75rem', verticalAlign: 'top', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                              ₹{lineInwardValue.toFixed(2)}
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                                Rate: ₹{(recQty > 0 ? (lineInwardValue / recQty) : 0).toFixed(2)}/{item.unit}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Accurate Invoice Total and Stock Value Reconciliation Card */}
                <div style={{ marginTop: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Receipt size={18} color="#0284c7" />
                    <span>3. Financial Reconciliation & Tax Breakdown</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Invoice Subtotal (Gross)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(verifiedInvoiceData?.subtotal || verifiedInvoiceData?.invoiceTotal || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Discounts</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>
                        -₹{Number(verifiedInvoiceData?.discountAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Taxable Amount</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(verifiedInvoiceData?.taxableAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Applicable GST</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(verifiedInvoiceData?.taxAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Supplier Invoice Total</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                        ₹{Number(verifiedInvoiceData?.invoiceTotal || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        Items selected for receiving: <strong>{validReceivingItemsCount} of {receiveForm.items.length}</strong>
                      </div>
                      {verifiedInvoiceData?.invoiceTotal !== undefined && Math.abs(totalInwardAmount - Number(verifiedInvoiceData.invoiceTotal)) <= 0.05 ? (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Icons.CheckCircle size={16} color="#16a34a" />
                          <span>Complete Delivery: Total inward stock value (₹{totalInwardAmount.toFixed(2)}) fully reconciles with the supplier invoice total.</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Icons.AlertCircle size={16} color="#d97706" />
                          <span>
                            Partial Delivery Recorded: Inwarding ₹{totalInwardAmount.toFixed(2)} of ₹{Number(verifiedInvoiceData?.invoiceTotal || 0).toFixed(2)} invoice value. Difference: ₹{(Number(verifiedInvoiceData?.invoiceTotal || 0) - totalInwardAmount).toFixed(2)} pending inwarding.
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Inward Stock Value</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                        ₹{totalInwardAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons directly under Option 4 (Option 5 Removed) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPOId('');
                      setSelectedVendorId('');
                      setInvoiceVerificationStatus('IDLE');
                      setInvoiceVerificationMessage('');
                      setVerifiedInvoiceData(null);
                      setReceiveForm({
                        invoiceNumber: '',
                        invoiceDate: new Date().toISOString().split('T')[0],
                        receiptDate: new Date().toISOString().split('T')[0],
                        amountPaid: 0,
                        paymentMethod: 'CREDIT',
                        paymentReference: '',
                        paymentDate: new Date().toISOString().split('T')[0],
                        items: []
                      });
                    }}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReceiving || validReceivingItemsCount === 0 || hasOverReceivingError}
                    style={{
                      padding: '0.75rem 2rem',
                      backgroundColor: (isReceiving || validReceivingItemsCount === 0 || hasOverReceivingError) ? '#94a3b8' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (isReceiving || validReceivingItemsCount === 0 || hasOverReceivingError) ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Icons.CheckCircle size={18} /> {isReceiving ? 'Confirming & Inwarding Stock...' : 'Confirm & Inward Stock'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: RECEIVED GOODS BATCHES & GRN HISTORY */}
      {activeTab === 'receipts' && (
        <div>
          {/* Sub Tab Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setReceiptsSubTab('grns')}
              style={{
                padding: '0.55rem 1.1rem',
                backgroundColor: receiptsSubTab === 'grns' ? '#0284c7' : '#f1f5f9',
                color: receiptsSubTab === 'grns' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Icons.FileCheck size={16} /> Goods Receipt Notes / GRNs ({receipts.length})
            </button>
            <button
              onClick={() => setReceiptsSubTab('batches')}
              style={{
                padding: '0.55rem 1.1rem',
                backgroundColor: receiptsSubTab === 'batches' ? '#0284c7' : '#f1f5f9',
                color: receiptsSubTab === 'batches' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Icons.Boxes size={16} /> FIFO Stock Batches ({batches.length})
            </button>
          </div>

          {receiptsSubTab === 'grns' && (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>GRN #</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                    <th style={{ padding: '0.85rem 1rem' }}>PO #</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Vendor</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Receipt Date</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Total Value</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Received By</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0284c7' }}>{r.receiptNumber}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{r.invoiceNumber}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{r.purchaseOrder?.poNumber || `PO-${r.purchaseOrder?.id}`}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{r.vendor?.name || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{r.receiptDate || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#059669' }}>₹{(r.totalAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-block',
                            width: 'fit-content',
                            backgroundColor: r.paymentStatus === 'Paid' || (r.amountPaid >= r.totalAmount && r.totalAmount > 0) ? '#dcfce7' : r.amountPaid > 0 ? '#fef3c7' : '#fee2e2',
                            color: r.paymentStatus === 'Paid' || (r.amountPaid >= r.totalAmount && r.totalAmount > 0) ? '#15803d' : r.amountPaid > 0 ? '#b45309' : '#b91c1c'
                          }}>
                            {r.paymentStatus || (r.amountPaid >= r.totalAmount && r.totalAmount > 0 ? 'Paid' : r.amountPaid > 0 ? 'Partially Paid' : 'Unpaid')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ₹{(r.amountPaid || 0).toFixed(2)} via {r.paymentMethod || 'UPI'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: r.status === 'Completed' ? '#d1fae5' : '#fef3c7', color: r.status === 'Completed' ? '#047857' : '#b45309' }}>
                          {r.status || 'Completed'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{r.receivedBy || 'Manager'}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReceiptForView(r)}
                          style={{ padding: '0.35rem 0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Items ({r.items?.length || 0})
                        </button>
                      </td>
                    </tr>
                  ))}
                  {receipts.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No goods receipts recorded yet. Use the Receive Stock Screen to inward stock against a purchase order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {receiptsSubTab === 'batches' && (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Batch #</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Raw Material</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Received Qty</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Current Balance</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Cost / Unit</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Received Date</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>BATCH-{b.id}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{b.ingredient?.name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{b.initialQuantity} {b.ingredient?.unit}</td>
                      <td style={{ padding: '0.85rem 1rem', color: b.currentQuantity <= 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                        {b.currentQuantity} {b.ingredient?.unit}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>₹{(b.costPerUnit || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: b.expiryDate ? '#dc2626' : '#64748b' }}>{b.expiryDate || '—'}</td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No received batches recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Create Purchase Order</h3>
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
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
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
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={e => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Raw Materials to Order</h4>
                  <button type="button" onClick={handleAddPOItem} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
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

      {/* MODAL: UPLOAD VENDOR INVOICE / CHALLAN */}
      {invoiceModalPO && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                Attach Vendor Invoice / Delivery Challan
              </h3>
              <button onClick={() => setInvoiceModalPO(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              Upload a scanned image (JPEG/PNG) or PDF of the vendor delivery receipt for <b>{invoiceModalPO.poNumber || `PO-${invoiceModalPO.id}`}</b>.
            </p>

            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '1.5rem' }}>
              <Icons.UploadCloud size={40} color="#0284c7" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                {isUploadingInvoice ? 'Uploading document...' : 'Select or capture invoice document'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
                Supports PNG, JPG, PDF up to 10MB
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={isUploadingInvoice}
                onChange={e => handleFileUpload(e, invoiceModalPO.id)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInvoiceModalPO(null)}
                style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL DOCUMENT PREVIEW VIEWER */}
      {showInvoiceViewer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.FileCheck size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{previewDocName}</h3>
              </div>
              <button onClick={() => setShowInvoiceViewer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={22} /></button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              {previewDocUrl.startsWith('data:application/pdf') ? (
                <iframe src={previewDocUrl} style={{ width: '100%', height: '550px', border: 'none' }} title="Invoice PDF" />
              ) : (
                <img src={previewDocUrl} alt="Vendor Invoice Challan" style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowInvoiceViewer(false)}
                style={{ padding: '0.65rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW GOODS RECEIPT ITEMS */}
      {selectedReceiptForView && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Goods Receipt #{selectedReceiptForView.receiptNumber}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedReceiptForView.invoiceNumber}</strong> | PO: <strong>{selectedReceiptForView.purchaseOrder?.poNumber || `PO-${selectedReceiptForView.purchaseOrder?.id}`}</strong> | Vendor: <strong>{selectedReceiptForView.vendor?.name}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedReceiptForView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Receipt Date</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedReceiptForView.receiptDate || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#059669' }}>{selectedReceiptForView.status || 'Completed'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Inward</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>₹{(selectedReceiptForView.totalAmount || 0).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Amount Paid</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#059669' }}>₹{(selectedReceiptForView.amountPaid || 0).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Balance Due</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: (selectedReceiptForView.remainingBalance || 0) > 0 ? '#d97706' : '#10b981' }}>
                  ₹{(selectedReceiptForView.remainingBalance !== undefined ? selectedReceiptForView.remainingBalance : Math.max(0, (selectedReceiptForView.totalAmount || 0) - (selectedReceiptForView.amountPaid || 0))).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Method</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0284c7' }}>{selectedReceiptForView.paymentMethod || 'UPI'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Status</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  <span style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: selectedReceiptForView.paymentStatus === 'Paid' || (selectedReceiptForView.amountPaid >= selectedReceiptForView.totalAmount && selectedReceiptForView.totalAmount > 0) ? '#dcfce7' : selectedReceiptForView.amountPaid > 0 ? '#fef3c7' : '#fee2e2',
                    color: selectedReceiptForView.paymentStatus === 'Paid' || (selectedReceiptForView.amountPaid >= selectedReceiptForView.totalAmount && selectedReceiptForView.totalAmount > 0) ? '#15803d' : selectedReceiptForView.amountPaid > 0 ? '#b45309' : '#b91c1c'
                  }}>
                    {selectedReceiptForView.paymentStatus || (selectedReceiptForView.amountPaid >= selectedReceiptForView.totalAmount && selectedReceiptForView.totalAmount > 0 ? 'Paid' : selectedReceiptForView.amountPaid > 0 ? 'Partially Paid' : 'Unpaid')}
                  </span>
                </div>
              </div>
              {selectedReceiptForView.paymentReference && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reference #</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{selectedReceiptForView.paymentReference}</div>
                </div>
              )}
            </div>

            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#334155' }}>Inwarded Items</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', fontSize: '0.8rem', color: '#475569' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Raw Material</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Ordered</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Inwarded Qty</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Remaining</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Unit Cost (₹)</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Expiry Date</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedReceiptForView.items?.map((it: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{it.ingredient?.name}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{it.quantityOrdered} {it.unit}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#059669' }}>{it.quantityReceived} {it.unit}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{it.quantityRemaining} {it.unit}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>₹{(it.unitCost || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: it.expiryDate ? '#dc2626' : '#64748b' }}>{it.expiryDate || '—'}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>₹{(it.totalCost || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedReceiptForView(null)}
                style={{ padding: '0.6rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
