import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch, parseOrderDate } from '../../api';
import * as Icons from 'lucide-react';
import { formatISTTime } from '../../utils/timeUtils';

export interface DeliveryOrder {
  id: number;
  orderNumber: string;
  orderType: string;
  status: string;
  kitchenStatus?: string;
  deliveryStatus?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  deliveryInstructions?: string;
  deliveryStaffId?: number;
  deliveryStaffName?: string;
  deliveryStaffPhone?: string;
  deliveryAssignedBy?: string;
  deliveryAssignedAt?: string;
  estimatedPrepMinutes?: number;
  expectedReadyTime?: string;
  estimatedDeliveryMinutes?: number;
  expectedDeliveryTime?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  totalAmount?: number;
  paymentMethod?: string;
  createdAt?: string;
  createdAtFormatted?: string;
  items?: Array<{
    id?: number;
    quantity: number;
    dish?: { name: string; price: number };
    dishName?: string;
    name?: string;
    price?: number;
    notes?: string;
  }>;
}

const STATUS_STEPS = [
  'Order Placed',
  'Preparing',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered'
];

export default function DeliveryManagement() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL_ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<DeliveryOrder | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const [selectedOrderForEstimates, setSelectedOrderForEstimates] = useState<DeliveryOrder | null>(null);
  const [editPrepMins, setEditPrepMins] = useState<number>(20);
  const [editDelivMins, setEditDelivMins] = useState<number>(30);

  // Ticker for elapsed and overdue calculations
  const [, setTicker] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTicker(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const formatTime = (dateVal: any): string => {
    if (!dateVal) return '--:--';
    return formatISTTime(dateVal) || '--:--';
  };

  const getElapsedMinutes = (dateVal: any): number => {
    if (!dateVal) return 0;
    const d = parseOrderDate(dateVal);
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  };

  const checkIsOverdue = (order: DeliveryOrder): { isOverdue: boolean; message: string; diffMins: number } => {
    const status = order.deliveryStatus || 'Order Placed';
    const now = Date.now();

    if (status === 'Delivered' || status === 'Cancelled') {
      return { isOverdue: false, message: '', diffMins: 0 };
    }

    if (status === 'Out for Delivery') {
      if (order.expectedDeliveryTime) {
        const expected = parseOrderDate(order.expectedDeliveryTime).getTime();
        if (now > expected) {
          const diff = Math.floor((now - expected) / 60000);
          return { isOverdue: true, message: `Delivery delayed by ${diff}m`, diffMins: diff };
        }
      }
    } else {
      if (order.expectedReadyTime) {
        const expected = parseOrderDate(order.expectedReadyTime).getTime();
        if (now > expected) {
          const diff = Math.floor((now - expected) / 60000);
          return { isOverdue: true, message: `Kitchen delayed by ${diff}m`, diffMins: diff };
        }
      }
    }

    return { isOverdue: false, message: '', diffMins: 0 };
  };

  const fetchDeliveries = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [ordersRes, staffRes] = await Promise.all([
        apiFetch('https://erp-api.neurolinx.in/api/pos/orders/deliveries'),
        apiFetch('https://erp-api.neurolinx.in/api/staff/employees')
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data)) {
          setOrders(data);
          setErrorMessage(null);
        }
      } else {
        // Fallback: fetch all orders and filter by orderType === 'Delivery'
        const allRes = await apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all');
        if (allRes.ok) {
          const allData = await allRes.json();
          if (Array.isArray(allData)) {
            setOrders(allData.filter((o: any) => o.orderType === 'Delivery'));
          }
        }
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        if (Array.isArray(staffData)) {
          setEmployees(staffData.filter((e: any) => e.isActive !== false));
        }
      }
    } catch (e: any) {
      console.error('Failed to load deliveries:', e);
      if (isManual) setErrorMessage(e.message || 'Error loading deliveries');
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDeliveries();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDeliveries]);

  // Change Delivery Status
  const handleUpdateStatus = async (orderId: number, nextStatus: string, assignStaffId?: string) => {
    setActionLoadingId(orderId);
    try {
      const payload: any = { deliveryStatus: nextStatus };
      if (assignStaffId) {
        payload.staffId = assignStaffId;
      }
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/pos/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to update status (${res.status})`);
      }

      const updated = await res.json();
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      showToast(`Order #${updated.orderNumber} updated to ${nextStatus}!`);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Assign Delivery Person
  const handleAssignStaff = async () => {
    if (!selectedOrderForAssign) return;
    setActionLoadingId(selectedOrderForAssign.id);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/pos/orders/${selectedOrderForAssign.id}/delivery-assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: selectedStaffId || null })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to assign staff');
      }

      const updated = await res.json();
      setOrders(prev => prev.map(o => (o.id === selectedOrderForAssign.id ? updated : o)));
      showToast(selectedStaffId ? `Driver assigned to #${updated.orderNumber}!` : `Driver unassigned from #${updated.orderNumber}`);
      setSelectedOrderForAssign(null);
      setSelectedStaffId('');
    } catch (err: any) {
      alert(`Error assigning delivery person: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Update Estimates
  const handleSaveEstimates = async () => {
    if (!selectedOrderForEstimates) return;
    setActionLoadingId(selectedOrderForEstimates.id);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/pos/orders/${selectedOrderForEstimates.id}/delivery-estimates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimatedPrepMinutes: editPrepMins,
          estimatedDeliveryMinutes: editDelivMins
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update delivery estimates');
      }

      const updated = await res.json();
      setOrders(prev => prev.map(o => (o.id === selectedOrderForEstimates.id ? updated : o)));
      showToast(`Estimates updated for #${updated.orderNumber}!`);
      setSelectedOrderForEstimates(null);
    } catch (err: any) {
      alert(`Error updating estimates: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Print Delivery Bill / Slip
  const handlePrintDeliverySlip = (order: DeliveryOrder) => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
      order.items.forEach(it => {
        const name = it.dish?.name || it.dishName || it.name || 'Item';
        const price = (it.price || it.dish?.price || 0) * (it.quantity || 1);
        itemsHtml += `
          <tr>
            <td style="padding: 6px 0; font-size: 13px;">${it.quantity}x ${name} ${it.notes ? `<br/><small style="color:#666;">Note: ${it.notes}</small>` : ''}</td>
            <td style="padding: 6px 0; text-align: right; font-size: 13px;">₹${price.toFixed(2)}</td>
          </tr>
        `;
      });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Dispatch Slip - ${order.orderNumber}</title>
        <style>
          body { font-family: monospace; width: 330px; margin: 0 auto; padding: 15px; color: #000; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: bold; margin: 0; }
          .badge { display: inline-block; background: #000; color: #fff; padding: 2px 8px; font-size: 12px; margin-top: 5px; font-weight: bold; }
          .section { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dotted #ccc; font-size: 13px; }
          .section-title { font-weight: bold; margin-bottom: 4px; text-decoration: underline; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .totals { border-top: 1px dashed #000; padding-top: 8px; font-size: 14px; }
          .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; border-top: 1px dashed #000; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">NEUROLINX RESTAURANT</div>
          <div class="badge">DELIVERY DISPATCH SLIP</div>
          <p style="margin: 4px 0 0 0; font-size: 13px;">Order #${order.orderNumber}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px;">Created: ${formatTime(order.createdAt)}</p>
        </div>

        <div class="section">
          <div class="section-title">CUSTOMER DETAILS:</div>
          <div><strong>Name:</strong> ${order.customerName || 'Customer'}</div>
          <div><strong>Phone:</strong> ${order.customerPhone || 'Not provided'}</div>
          <div style="margin-top: 4px;"><strong>Delivery Address:</strong></div>
          <div style="white-space: pre-wrap; font-size: 13px; padding-left: 6px;">${order.deliveryAddress || 'Not specified'}${order.deliveryArea ? ', ' + order.deliveryArea : ''}${order.deliveryCity ? ', ' + order.deliveryCity : ''}${order.deliveryPostalCode ? ' - ' + order.deliveryPostalCode : ''}</div>
          ${order.deliveryInstructions ? `<div style="margin-top: 4px; color: #333;"><strong>Instructions:</strong> ${order.deliveryInstructions}</div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">DELIVERY ASSIGNMENT:</div>
          <div><strong>Driver:</strong> ${order.deliveryStaffName || 'Unassigned'}</div>
          <div><strong>Driver Phone:</strong> ${order.deliveryStaffPhone || '-'}</div>
          ${order.expectedDeliveryTime ? `<div><strong>Expected Delivery:</strong> ${formatTime(order.expectedDeliveryTime)}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding-bottom: 4px;">Item</th>
              <th style="text-align: right; padding-bottom: 4px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="grand-total">
            <span>Total Bill:</span>
            <span>₹${(order.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px;">
            <span>Payment Method:</span>
            <span>${order.paymentMethod || 'Pay on Delivery'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 12px;">
            <span>Payment Status:</span>
            <span>${order.status || 'Pending'}</span>
          </div>
        </div>

        <div class="footer">
          <p>Please deliver hot and on time!</p>
          <p>Thank you for ordering with us.</p>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // KPIs
  const stats = useMemo(() => {
    let totalActive = 0;
    let inKitchen = 0;
    let readyForDispatch = 0;
    let outForDelivery = 0;
    let overdueCount = 0;

    orders.forEach(o => {
      const st = o.deliveryStatus || 'Order Placed';
      if (st !== 'Delivered' && st !== 'Cancelled') {
        totalActive++;
        if (st === 'Order Placed' || st === 'Preparing') inKitchen++;
        if (st === 'Ready for Dispatch') readyForDispatch++;
        if (st === 'Out for Delivery') outForDelivery++;

        if (checkIsOverdue(o).isOverdue) overdueCount++;
      }
    });

    return { totalActive, inKitchen, readyForDispatch, outForDelivery, overdueCount };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const st = o.deliveryStatus || 'Order Placed';

      // Status filter
      if (filterStatus === 'ALL_ACTIVE') {
        if (st === 'Delivered' || st === 'Cancelled') return false;
      } else if (filterStatus !== 'ALL') {
        if (st !== filterStatus) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (o.orderNumber || '').toLowerCase();
        const name = (o.customerName || '').toLowerCase();
        const phone = (o.customerPhone || '').toLowerCase();
        const addr = (o.deliveryAddress || '').toLowerCase();
        const driver = (o.deliveryStaffName || '').toLowerCase();
        return num.includes(q) || name.includes(q) || phone.includes(q) || addr.includes(q) || driver.includes(q);
      }

      return true;
    });
  }, [orders, filterStatus, searchQuery]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Order Placed':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'Preparing':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' };
      case 'Ready for Dispatch':
        return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'Out for Delivery':
        return { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' };
      case 'Delivered':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'Cancelled':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <Icons.CheckCircle size={18} />
          {successToast}
        </div>
      )}

      {errorMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <Icons.AlertTriangle size={18} />
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)} 
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex' }}
          >
            <Icons.X size={16} />
          </button>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ backgroundColor: '#0284c7', color: 'white', padding: '6px', borderRadius: '10px', display: 'flex' }}>
              <Icons.Truck size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                Delivery Management
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Live dispatching, driver assignments, route status, and expected delivery tracking.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: autoRefresh ? '#f0fdf4' : 'white',
              color: autoRefresh ? '#15803d' : '#64748b',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Icons.Radio size={15} style={{ color: autoRefresh ? '#22c55e' : '#94a3b8' }} />
            {autoRefresh ? 'Live Sync ON' : 'Live Sync Paused'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchDeliveries(true)}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'white',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isRefreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <Icons.RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <Icons.Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Deliveries</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalActive}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
            <Icons.Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Kitchen Preparing</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.inKitchen}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
            <Icons.CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ready for Dispatch</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.readyForDispatch}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
            <Icons.Navigation size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Out for Delivery</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.outForDelivery}</div>
          </div>
        </div>

        <div style={{ backgroundColor: stats.overdueCount > 0 ? '#fff1f2' : 'white', padding: '1rem', borderRadius: '12px', border: `1px solid ${stats.overdueCount > 0 ? '#fecdd3' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: stats.overdueCount > 0 ? '#fee2e2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stats.overdueCount > 0 ? '#e11d48' : '#94a3b8' }}>
            <Icons.AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: stats.overdueCount > 0 ? '#be123c' : '#64748b', fontWeight: 600 }}>Overdue Delays</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.overdueCount > 0 ? '#e11d48' : '#0f172a' }}>{stats.overdueCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL_ACTIVE', label: 'All Active' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                backgroundColor: filterStatus === tab.id ? '#0284c7' : '#f1f5f9',
                color: filterStatus === tab.id ? 'white' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Icons.Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search Order #, customer, driver..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem 0.5rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <Icons.X
              size={14}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>

      {/* Main Delivery Orders Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <Icons.Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#0284c7' }} />
          <p style={{ fontWeight: 600 }}>Loading Delivery Orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          <Icons.Truck size={48} style={{ margin: '0 auto 1rem auto', color: '#cbd5e1' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>No delivery orders found</h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {filterStatus === 'ALL_ACTIVE'
              ? 'There are currently no active deliveries. When customers or POS create a delivery order, it will appear here.'
              : `No orders matching filter "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredOrders.map(order => {
            const currentStatus = order.deliveryStatus || 'Order Placed';
            const colors = getStatusColor(currentStatus);
            const overdueInfo = checkIsOverdue(order);
            const elapsed = getElapsedMinutes(order.createdAt);
            const stepIndex = STATUS_STEPS.indexOf(currentStatus);

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: overdueInfo.isOverdue ? '2px solid #f43f5e' : '1px solid #e2e8f0',
                  boxShadow: overdueInfo.isOverdue ? '0 4px 15px rgba(244, 63, 94, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Overdue Banner if applicable */}
                {overdueInfo.isOverdue && (
                  <div style={{
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    borderBottom: '1px solid #fecdd3'
                  }}>
                    <Icons.AlertCircle size={15} />
                    <span>OVERDUE ALERT: {overdueInfo.message}</span>
                  </div>
                )}

                {/* Card Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        #{order.orderNumber}
                      </span>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`
                      }}>
                        {currentStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem', fontSize: '0.78rem', color: '#64748b' }}>
                      <span>Ordered {formatTime(order.createdAt)}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: elapsed > 45 ? '#e11d48' : '#64748b' }}>
                        {elapsed} mins ago
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      {order.paymentMethod || 'Pay on Delivery'}
                    </div>
                  </div>
                </div>

                {/* Workflow Stepper Bar */}
                {currentStatus !== 'Cancelled' && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = stepIndex >= idx;
                        const isCurrent = stepIndex === idx;
                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: isDone ? (isCurrent ? '#0284c7' : '#10b981') : '#e2e8f0',
                              color: isDone ? 'white' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800
                            }}>
                              {isDone && !isCurrent ? <Icons.Check size={12} /> : idx + 1}
                            </div>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: isCurrent ? 800 : 500,
                              color: isCurrent ? '#0284c7' : (isDone ? '#334155' : '#94a3b8'),
                              marginTop: '3px',
                              textAlign: 'center',
                              whiteSpace: 'nowrap'
                            }}>
                              {step === 'Ready for Dispatch' ? 'Ready' : (step === 'Out for Delivery' ? 'Dispatched' : step)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customer & Address Details */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  
                  {/* Customer Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.User size={16} style={{ color: '#0284c7' }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {order.customerName || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {order.customerPhone || 'No contact provided'}
                        </div>
                      </div>
                    </div>
                    {order.customerPhone && (
                      <a
                        href={`tel:${order.customerPhone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        <Icons.PhoneCall size={13} />
                        Call
                      </a>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <Icons.MapPin size={16} style={{ color: '#e11d48', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 600 }}>{order.deliveryAddress || 'No address provided'}</div>
                      {(order.deliveryArea || order.deliveryCity || order.deliveryPostalCode) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {[order.deliveryArea, order.deliveryCity, order.deliveryPostalCode].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.deliveryInstructions && (
                    <div style={{
                      backgroundColor: '#fefce8',
                      border: '1px solid #fef08a',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.78rem',
                      color: '#854d0e',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.4rem'
                    }}>
                      <Icons.Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>Instructions:</strong> {order.deliveryInstructions}
                      </div>
                    </div>
                  )}

                  {/* Driver Assignment Section */}
                  <div style={{
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: order.deliveryStaffName ? '#f0fdf4' : '#fafafa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Bike size={16} style={{ color: order.deliveryStaffName ? '#16a34a' : '#94a3b8' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Delivery Driver</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: order.deliveryStaffName ? '#15803d' : '#64748b' }}>
                          {order.deliveryStaffName ? `${order.deliveryStaffName} (${order.deliveryStaffPhone || 'No Phone'})` : 'Not Assigned'}
                        </div>
                      </div>
                    </div>

                    {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
                      <button
                        onClick={() => {
                          setSelectedOrderForAssign(order);
                          setSelectedStaffId(order.deliveryStaffId ? String(order.deliveryStaffId) : '');
                        }}
                        style={{
                          border: 'none',
                          backgroundColor: order.deliveryStaffName ? '#e0f2fe' : '#0284c7',
                          color: order.deliveryStaffName ? '#0284c7' : 'white',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {order.deliveryStaffName ? 'Reassign' : 'Assign'}
                      </button>
                    )}
                  </div>

                  {/* Estimates & Timestamps */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    backgroundColor: '#f8fafc',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <div style={{ color: '#64748b', fontWeight: 600 }}>Kitchen Ready</div>
                      <div style={{ fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                        {order.expectedReadyTime ? formatTime(order.expectedReadyTime) : '--:--'}
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                          ({order.estimatedPrepMinutes || 20}m prep)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontWeight: 600 }}>Expected Delivery</div>
                      <div style={{ fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                        {order.expectedDeliveryTime ? formatTime(order.expectedDeliveryTime) : '--:--'}
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                          ({order.estimatedDeliveryMinutes || 30}m transit)
                        </span>
                      </div>
                    </div>

                    {/* Actual timestamps */}
                    {order.dispatchedAt && (
                      <div style={{ gridColumn: 'span 1', borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                        <span style={{ color: '#64748b' }}>Dispatched: </span>
                        <strong style={{ color: '#0891b2' }}>{formatTime(order.dispatchedAt)}</strong>
                      </div>
                    )}
                    {order.deliveredAt && (
                      <div style={{ gridColumn: 'span 1', borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                        <span style={{ color: '#64748b' }}>Delivered: </span>
                        <strong style={{ color: '#16a34a' }}>{formatTime(order.deliveredAt)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Ordered Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>Items ({order.items.reduce((s, it) => s + (it.quantity || 1), 0)}): </span>
                      {order.items.map(it => `${it.quantity}x ${it.dish?.name || it.dishName || it.name || 'Item'}`).join(', ')}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Next Workflow Action Button */}
                  {currentStatus === 'Order Placed' && (
                    <button
                      disabled={actionLoadingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: '#ea580c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Icons.Flame size={15} />
                      Start Preparing
                    </button>
                  )}

                  {currentStatus === 'Preparing' && (
                    <button
                      disabled={actionLoadingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'Ready for Dispatch')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: '#7e22ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Icons.CheckCircle2 size={15} />
                      Mark Ready for Dispatch
                    </button>
                  )}

                  {currentStatus === 'Ready for Dispatch' && (
                    <button
                      disabled={actionLoadingId === order.id}
                      onClick={() => {
                        if (!order.deliveryStaffId) {
                          setSelectedOrderForAssign(order);
                          setSelectedStaffId('');
                        } else {
                          handleUpdateStatus(order.id, 'Out for Delivery');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Icons.Navigation size={15} />
                      Dispatch Order
                    </button>
                  )}

                  {currentStatus === 'Out for Delivery' && (
                    <button
                      disabled={actionLoadingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Icons.CheckCircle size={15} />
                      Mark Delivered
                    </button>
                  )}

                  {/* Edit Estimates Button */}
                  {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
                    <button
                      title="Adjust expected preparation and delivery times"
                      onClick={() => {
                        setSelectedOrderForEstimates(order);
                        setEditPrepMins(order.estimatedPrepMinutes || 20);
                        setEditDelivMins(order.estimatedDeliveryMinutes || 30);
                      }}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icons.Clock size={16} />
                    </button>
                  )}

                  {/* Print Delivery Slip Button */}
                  <button
                    title="Print Delivery Dispatch Slip"
                    onClick={() => handlePrintDeliverySlip(order)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icons.Printer size={16} />
                  </button>

                  {/* Cancel Delivery Button */}
                  {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
                    <button
                      title="Cancel Delivery Order"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to cancel delivery order #${order.orderNumber}?`)) {
                          handleUpdateStatus(order.id, 'Cancelled');
                        }
                      }}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icons.XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Driver Modal */}
      {selectedOrderForAssign && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '450px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Bike size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Assign Delivery Person
                </h3>
              </div>
              <Icons.X
                size={20}
                style={{ cursor: 'pointer', color: '#64748b' }}
                onClick={() => setSelectedOrderForAssign(null)}
              />
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                  Order Details:
                </label>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div><strong>Order:</strong> #{selectedOrderForAssign.orderNumber}</div>
                  <div><strong>Customer:</strong> {selectedOrderForAssign.customerName} ({selectedOrderForAssign.customerPhone})</div>
                  <div><strong>Address:</strong> {selectedOrderForAssign.deliveryAddress}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                  Select Staff / Driver:
                </label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Unassigned / Clear Driver --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.jobRole ? `(${emp.jobRole})` : ''} {emp.phone ? `- ${emp.phone}` : ''}
                    </option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: '#f59e0b' }}>
                    Tip: You can add delivery drivers in the Staff menu.
                  </p>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedOrderForAssign(null)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoadingId === selectedOrderForAssign.id}
                onClick={handleAssignStaff}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Estimates Modal */}
      {selectedOrderForEstimates && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '420px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Clock size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Update Delivery Estimates
                </h3>
              </div>
              <Icons.X
                size={20}
                style={{ cursor: 'pointer', color: '#64748b' }}
                onClick={() => setSelectedOrderForEstimates(null)}
              />
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Adjust estimated preparation and transit times for Order #{selectedOrderForEstimates.orderNumber} when delays or rush hours occur.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                  Estimated Kitchen Preparation Time (Minutes):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {[15, 20, 30, 45].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditPrepMins(m)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: editPrepMins === m ? '#0284c7' : 'white',
                        color: editPrepMins === m ? 'white' : '#475569',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={editPrepMins}
                    onChange={e => setEditPrepMins(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: '70px',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                  Estimated Transit / Delivery Duration (Minutes):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {[20, 30, 45, 60].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditDelivMins(m)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: editDelivMins === m ? '#0284c7' : 'white',
                        color: editDelivMins === m ? 'white' : '#475569',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={editDelivMins}
                    onChange={e => setEditDelivMins(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: '70px',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedOrderForEstimates(null)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoadingId === selectedOrderForEstimates.id}
                onClick={handleSaveEstimates}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Update Estimates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
