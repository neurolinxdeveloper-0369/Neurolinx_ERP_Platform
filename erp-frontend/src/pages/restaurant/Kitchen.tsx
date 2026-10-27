import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

<<<<<<< HEAD
interface OrderItem {
  id?: number;
  quantity: number;
  dish?: {
    id: number;
    name: string;
    price?: number;
  };
  dishName?: string;
  notes?: string;
  price?: number;
}
=======
export default function KitchenDisplay() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)

interface RestaurantTable {
  id?: number;
  tableName?: string;
  tableNumber?: string | number;
  floor?: number;
}

interface CustomerOrder {
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
  expectedReadyTime?: string;
  estimatedPrepMinutes?: number;
  createdAt: string;
  notes?: string;
  tableName?: string;
  totalAmount?: number;
  restaurantTable?: RestaurantTable;
  items?: OrderItem[];
}

export default function KitchenDisplay() {
  const [allOrders, setAllOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [, setTicker] = useState<number>(Date.now());

  // Parse date safely
  const parseOrderDate = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (Array.isArray(dateVal)) {
      return new Date(dateVal[0], (dateVal[1] || 1) - 1, dateVal[2] || 1, dateVal[3] || 0, dateVal[4] || 0, dateVal[5] || 0);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatOrderTime = (dateVal: any): string => {
    const d = parseOrderDate(dateVal);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedMinutes = (dateVal: any): number => {
    const d = parseOrderDate(dateVal);
    const diff = Date.now() - d.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  const getTableDisplay = (order: CustomerOrder): string => {
    if (order.restaurantTable) {
      if (order.restaurantTable.tableName) return order.restaurantTable.tableName;
      if (order.restaurantTable.tableNumber) return `Table ${order.restaurantTable.tableNumber}`;
      if (order.restaurantTable.id) return `Table ${order.restaurantTable.id}`;
    }
    if (order.tableName) return order.tableName;
    if (order.orderType === 'Takeaway') return 'Takeaway';
    if (order.orderType === 'Delivery') return 'Delivery';
    return order.orderType || 'Dine-In';
  };

  const fetchOrders = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all');
      if (!res.ok) {
        let errText = `Server returned HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.message) errText = errData.message;
        } catch (e) {}
        throw new Error(errText);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllOrders(data);
        setErrorMessage(null);
      } else {
        setAllOrders([]);
      }
    } catch (err: any) {
      console.error('Error fetching kitchen orders:', err);
      setErrorMessage(`Failed to sync orders with server: ${err.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Polling & auto-refresh
  useEffect(() => {
    fetchOrders(false);

<<<<<<< HEAD
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrders(false);
      }, 8000);
    }

    // Live elapsed time tick every 30s
    const tickInterval = setInterval(() => {
      setTicker(Date.now());
    }, 30000);

    // Listen to local POS order placement event
    const handleLocalOrder = () => {
      fetchOrders(false);
    };
    window.addEventListener('neurolinx_order_placed', handleLocalOrder);
    window.addEventListener('storage', handleLocalOrder);

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(tickInterval);
      window.removeEventListener('neurolinx_order_placed', handleLocalOrder);
      window.removeEventListener('storage', handleLocalOrder);
    };
  }, [autoRefresh, fetchOrders]);

  // Update order kitchen status with strict server verification
  const updateKitchenStatus = async (order: CustomerOrder, nextStatus: string) => {
    setUpdatingOrderId(order.id);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/pos/orders/${order.id}/kitchen-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenStatus: nextStatus })
      });

      if (!res.ok) {
        let errText = `Server returned HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.message) errText = errData.message;
        } catch (e) {}
        throw new Error(errText);
      }

      const updated = await res.json();
      setSuccessToast(`Order #${updated.orderNumber || order.orderNumber || order.id} updated to "${nextStatus}"`);
      setTimeout(() => setSuccessToast(null), 3500);

      // Re-fetch all orders directly from server to ensure database sync
      await fetchOrders(false);
    } catch (err: any) {
      console.error('Failed to update kitchen status:', err);
      setErrorMessage(`Failed to update status to ${nextStatus}: ${err.message || 'Network error'}. Changes were NOT saved to server.`);
    } finally {
      setUpdatingOrderId(null);
=======
  const simulateOnlineOrder = async (channel: 'Swiggy' | 'Zomato') => {
    setIsSimulating(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/aggregators/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
      } else {
        alert(data.message || 'Simulation failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
      case 'Preparing': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'Ready': return { bg: '#d1fae5', text: '#10b981', border: '#6ee7b7' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
    }
  };

  const getStatusTheme = (status?: string) => {
    const s = (status || 'Pending').toLowerCase();
    switch (s) {
      case 'pending':
        return {
          title: 'Pending',
          bg: '#fff1f2',
          cardBorder: '#fecdd3',
          badgeBg: '#ffe4e6',
          badgeText: '#e11d48',
          headerBg: '#ffe4e6',
          accent: '#e11d48',
          nextStatus: 'Preparing',
          nextLabel: 'Start Preparing',
          nextBg: '#f59e0b',
          prevStatus: null,
          prevLabel: null
        };
      case 'preparing':
        return {
          title: 'Preparing',
          bg: '#fffbeb',
          cardBorder: '#fde68a',
          badgeBg: '#fef3c7',
          badgeText: '#d97706',
          headerBg: '#fef3c7',
          accent: '#d97706',
          nextStatus: 'Ready',
          nextLabel: 'Mark Ready',
          nextBg: '#10b981',
          prevStatus: 'Pending',
          prevLabel: 'Back to Pending'
        };
      case 'ready':
        return {
          title: 'Ready',
          bg: '#f0fdf4',
          cardBorder: '#bbf7d0',
          badgeBg: '#dcfce7',
          badgeText: '#15803d',
          headerBg: '#dcfce7',
          accent: '#15803d',
          nextStatus: 'Completed',
          nextLabel: 'Mark Completed',
          nextBg: '#0284c7',
          prevStatus: 'Preparing',
          prevLabel: 'Back to Preparing'
        };
      case 'completed':
      case 'delivered':
        return {
          title: 'Completed',
          bg: '#f8fafc',
          cardBorder: '#e2e8f0',
          badgeBg: '#e2e8f0',
          badgeText: '#475569',
          headerBg: '#f1f5f9',
          accent: '#475569',
          nextStatus: null,
          nextLabel: null,
          nextBg: '#64748b',
          prevStatus: 'Ready',
          prevLabel: 'Reopen to Ready'
        };
      default:
        return {
          title: status || 'Pending',
          bg: '#ffffff',
          cardBorder: '#cbd5e1',
          badgeBg: '#f1f5f9',
          badgeText: '#475569',
          headerBg: '#f8fafc',
          accent: '#64748b',
          nextStatus: 'Preparing',
          nextLabel: 'Start Preparing',
          nextBg: '#f59e0b',
          prevStatus: null,
          prevLabel: null
        };
    }
  };

  // Filtered lists & counts
  const counts = useMemo(() => {
    let pending = 0;
    let preparing = 0;
    let ready = 0;
    let completed = 0;
    let active = 0;

    allOrders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const ks = (o.kitchenStatus || 'Pending').toLowerCase();
      if (ks === 'pending') {
        pending++;
        active++;
      } else if (ks === 'preparing') {
        preparing++;
        active++;
      } else if (ks === 'ready') {
        ready++;
        active++;
      } else if (ks === 'completed' || ks === 'delivered') {
        completed++;
      } else {
        pending++;
        active++;
      }
    });

    return {
      active,
      pending,
      preparing,
      ready,
      completed,
      all: allOrders.length
    };
  }, [allOrders]);

  const displayOrders = useMemo(() => {
    let list = allOrders.filter(o => o.status !== 'Cancelled');

    if (activeTab === 'active') {
      list = list.filter(o => {
        const ks = (o.kitchenStatus || 'Pending').toLowerCase();
        return ks !== 'completed' && ks !== 'delivered';
      });
    } else if (activeTab === 'Pending') {
      list = list.filter(o => (o.kitchenStatus || 'Pending').toLowerCase() === 'pending');
    } else if (activeTab === 'Preparing') {
      list = list.filter(o => (o.kitchenStatus || '').toLowerCase() === 'preparing');
    } else if (activeTab === 'Ready') {
      list = list.filter(o => (o.kitchenStatus || '').toLowerCase() === 'ready');
    } else if (activeTab === 'Completed') {
      list = list.filter(o => {
        const ks = (o.kitchenStatus || '').toLowerCase();
        return ks === 'completed' || ks === 'delivered';
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o => {
        const num = (o.orderNumber || String(o.id)).toLowerCase();
        const table = getTableDisplay(o).toLowerCase();
        const hasItem = o.items?.some(i => (i.dish?.name || i.dishName || '').toLowerCase().includes(q));
        return num.includes(q) || table.includes(q) || hasItem;
      });
    }

    // Sort: Active orders sorted by oldest first so chefs cook in order. Completed sorted newest first.
    if (activeTab === 'Completed') {
      list.sort((a, b) => parseOrderDate(b.createdAt).getTime() - parseOrderDate(a.createdAt).getTime());
    } else {
      list.sort((a, b) => parseOrderDate(a.createdAt).getTime() - parseOrderDate(b.createdAt).getTime());
    }

    return list;
  }, [allOrders, activeTab, searchQuery]);

  return (
<<<<<<< HEAD
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.ChefHat size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Kitchen Display System (KDS)</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Live Kitchen Order Ticket (KOT) workflow & status manager</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: `1px solid ${autoRefresh ? '#86efac' : '#cbd5e1'}`,
              backgroundColor: autoRefresh ? '#f0fdf4' : '#f8fafc',
              color: autoRefresh ? '#15803d' : '#64748b',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={autoRefresh ? 'Auto-refresh active (every 8s)' : 'Auto-refresh paused'}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: autoRefresh ? '#22c55e' : '#94a3b8',
              display: 'inline-block'
            }} />
            {autoRefresh ? 'Auto: 8s' : 'Paused'}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#334155'
            }}
          >
            <Icons.RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
=======
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Kitchen Display System (KDS)</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Live order preparation queue with auto-synced aggregator delivery tracking.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
            <button 
              disabled={isSimulating}
              onClick={() => simulateOnlineOrder('Swiggy')} 
              style={{ padding: '0.4rem 0.75rem', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Icons.Zap size={14} /> + Sim Swiggy
            </button>
            <button 
              disabled={isSimulating}
              onClick={() => simulateOnlineOrder('Zomato')} 
              style={{ padding: '0.4rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Icons.Zap size={14} /> + Sim Zomato
            </button>
          </div>
          <button onClick={fetchOrders} style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Icons.RefreshCw size={14} /> Refresh
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Notifications / Error Banner */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '1.25rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.AlertCircle size={18} color="#dc2626" />
            <span><strong>Server Error:</strong> {errorMessage}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchOrders(true)}
              style={{ padding: '0.3rem 0.75rem', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Retry
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '0.2rem' }}
            >
              <Icons.X size={16} />
            </button>
          </div>
        </div>
      )}

      {successToast && (
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#166534',
          marginBottom: '1.25rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Icons.CheckCircle size={18} color="#16a34a" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Search & Tabs Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'active', label: 'Active Queue', count: counts.active, icon: Icons.ListOrdered },
            { id: 'Pending', label: 'Pending', count: counts.pending, color: '#e11d48' },
            { id: 'Preparing', label: 'Preparing', count: counts.preparing, color: '#d97706' },
            { id: 'Ready', label: 'Ready', count: counts.ready, color: '#15803d' },
            { id: 'Completed', label: 'Completed', count: counts.completed, color: '#64748b' },
            { id: 'all', label: 'All Orders', count: counts.all }
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : (tab.color || '#475569')
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Icons.Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Order #, Table, Dish..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Main Order Grid */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <Icons.Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#0284c7', marginBottom: '1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading kitchen display queue...</div>
        </div>
      ) : displayOrders.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          color: '#64748b'
        }}>
          {activeTab === 'Completed' ? (
            <>
              <Icons.Archive size={48} style={{ marginBottom: '1rem', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem 0' }}>No Completed Orders Found</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Orders marked as completed will appear in this history tab.</p>
            </>
          ) : (
            <>
              <Icons.CheckCircle2 size={48} style={{ marginBottom: '1rem', color: '#22c55e' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem 0' }}>Kitchen is All Caught Up!</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>There are currently no active orders waiting in the queue.</p>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {displayOrders.map(order => {
            const currentStatus = order.kitchenStatus || 'Pending';
            const theme = getStatusTheme(currentStatus);
            const elapsed = getElapsedMinutes(order.createdAt);
            const orderTimeStr = formatOrderTime(order.createdAt);
            const tableText = getTableDisplay(order);
            const isOrderUpdating = updatingOrderId === order.id;

            // Elapsed urgency styling
            let elapsedColor = '#16a34a'; // Green (< 10 mins)
            let elapsedBg = '#f0fdf4';
            if (elapsed >= 10 && elapsed < 20) {
              elapsedColor = '#d97706'; // Amber (10-20 mins)
              elapsedBg = '#fffbeb';
            } else if (elapsed >= 20) {
              elapsedColor = '#dc2626'; // Red (> 20 mins)
              elapsedBg = '#fef2f2';
            }

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: `2px solid ${theme.cardBorder}`,
                  boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Order Card Header */}
                <div style={{
                  backgroundColor: theme.headerBg,
                  padding: '1rem',
                  borderBottom: `1px solid ${theme.cardBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        #{order.orderNumber || order.id}
                      </h3>
                      {/* Current Status Badge */}
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: theme.badgeBg,
                        color: theme.badgeText,
                        border: `1px solid ${theme.cardBorder}`
                      }}>
                        {theme.title}
                      </span>
                      {order.orderType === 'Delivery' && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: '#ecfeff',
                          color: '#0e7490',
                          border: '1px solid #a5f3fc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Icons.Truck size={10} /> Delivery
                        </span>
                      )}
                    </div>

                    {/* Table / Order Type info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                      {order.orderType === 'Takeaway' ? (
                        <Icons.ShoppingBag size={14} style={{ color: '#0284c7' }} />
                      ) : order.orderType === 'Delivery' ? (
                        <Icons.Truck size={14} style={{ color: '#8b5cf6' }} />
                      ) : (
                        <Icons.UtensilsCrossed size={14} style={{ color: '#ea580c' }} />
                      )}
                      <span>
                        {order.orderType === 'Delivery' && order.customerName
                          ? `${order.customerName}${order.deliveryArea ? ' (' + order.deliveryArea + ')' : ''}`
                          : tableText}
                      </span>
                      {order.orderType && order.orderType !== 'Dine-In' && order.orderType !== tableText && order.orderType !== 'Delivery' && (
                        <span style={{ color: '#94a3b8' }}>• {order.orderType}</span>
                      )}
                    </div>
=======
      {isLoading ? <div>Loading kitchen queue...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {orders.map(order => {
            const colors = getStatusColor(order.kitchenStatus || 'Pending');
            const timeElapsed = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
            const isSwiggy = order.orderType === 'Swiggy';
            const isZomato = order.orderType === 'Zomato';
            
            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: `2px solid ${isSwiggy ? '#fed7aa' : (isZomato ? '#fecaca' : colors.border)}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                {/* Channel Banner for Swiggy / Zomato */}
                {(isSwiggy || isZomato) && (
                  <div style={{ backgroundColor: isSwiggy ? '#ea580c' : '#dc2626', color: 'white', padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>{isSwiggy ? '🛵 SWIGGY DELIVERY ORDER' : '🛵 ZOMATO DELIVERY ORDER'}</span>
                    <span>{order.paymentMethod || 'PREPAID'}</span>
                  </div>
                )}

                <div style={{ backgroundColor: colors.bg, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
                  <div>
                    <h3 style={{ margin: 0, color: colors.text }}>#{order.orderNumber}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                      {order.orderType} {order.restaurantTable ? `- Table ${order.restaurantTable.tableNumber}` : ''}
                    </span>
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
                  </div>

                  {/* Timing Pill (Elapsed & Created Time) */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: elapsedBg,
                      color: elapsedColor,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: `1px solid ${elapsedColor}30`
                    }}>
                      <Icons.Clock size={13} />
                      <span>{elapsed}m</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {orderTimeStr}
                    </div>
                  </div>
                </div>

<<<<<<< HEAD
                {/* Order Items Body */}
                <div style={{ padding: '1rem', flex: 1, backgroundColor: '#ffffff' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Order Items
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <li
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '0.55rem 0',
                            borderBottom: idx === (order.items?.length || 0) - 1 ? 'none' : '1px dashed #e2e8f0',
                            fontSize: '0.95rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '24px',
                              height: '24px',
                              padding: '0 0.35rem',
                              backgroundColor: '#f1f5f9',
                              color: '#0f172a',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}>
                              {item.quantity}x
                            </span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                {item.dish?.name || item.dishName || 'Dish Item'}
                              </span>
                              {item.notes && (
                                <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.15rem', fontStyle: 'italic' }}>
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                        No items detailed
=======
                {/* Rider & Customer Dispatch Info for Online Delivery */}
                {(order.customerName || order.deliveryRiderName) && (
                  <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8125rem', color: '#475569' }}>
                    {order.customerName && <div><strong>Diner:</strong> {order.customerName}</div>}
                    {order.deliveryRiderName && <div><strong>Rider:</strong> {order.deliveryRiderName} {order.deliveryRiderPhone ? `(${order.deliveryRiderPhone})` : ''}</div>}
                  </div>
                )}

                <div style={{ padding: '1rem', flex: 1 }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {order.items?.map((item: any) => (
                      <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0', fontSize: '1.05rem', fontWeight: 500 }}>
                        <span>{item.quantity}x {item.dish?.name}</span>
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
                      </li>
                    )}
                  </ul>

                  {/* Order-level Notes */}
                  {order.notes && (
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#991b1b',
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'flex-start'
                    }}>
                      <Icons.MessageSquare size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Instructions:</strong> {order.notes}
                      </div>
                    </div>
                  )}
                </div>

<<<<<<< HEAD
                {/* Status Transitions Action Footer */}
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {/* Primary Progression Button (Pending -> Preparing -> Ready -> Completed) */}
                  {theme.nextStatus && (
                    <button
                      onClick={() => updateKitchenStatus(order, theme.nextStatus!)}
                      disabled={isOrderUpdating}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        backgroundColor: isOrderUpdating ? '#94a3b8' : theme.nextBg,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: isOrderUpdating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {isOrderUpdating ? (
                        <>
                          <Icons.Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Saving to server...</span>
                        </>
                      ) : (
                        <>
                          {theme.nextStatus === 'Preparing' && <Icons.Flame size={16} />}
                          {theme.nextStatus === 'Ready' && <Icons.BellRing size={16} />}
                          {theme.nextStatus === 'Completed' && <Icons.CheckCheck size={16} />}
                          <span>{theme.nextLabel}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Secondary / Rollback Button if applicable */}
                  {theme.prevStatus && (
                    <button
                      onClick={() => updateKitchenStatus(order, theme.prevStatus!)}
                      disabled={isOrderUpdating}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        backgroundColor: 'transparent',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: isOrderUpdating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Icons.Undo2 size={13} />
                      <span>{theme.prevLabel}</span>
                    </button>
                  )}

                  {/* Completed State badge when finished */}
                  {!theme.nextStatus && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem',
                      color: '#16a34a',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      <Icons.CheckCircle2 size={16} />
                      <span>Order Completed</span>
                    </div>
=======
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                  {(order.kitchenStatus || 'Pending') === 'Pending' && (
                    <button onClick={() => updateKitchenStatus(order.id, 'Preparing')} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Start Preparing
                    </button>
                  )}
                  {(order.kitchenStatus || 'Pending') === 'Preparing' && (
                    <button onClick={() => updateKitchenStatus(order.id, 'Ready')} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Mark Food Ready (Notify Rider)
                    </button>
                  )}
                  {(order.kitchenStatus || 'Pending') === 'Ready' && (
                    <button onClick={() => updateKitchenStatus(order.id, 'Delivered')} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      {isSwiggy || isZomato ? 'Handover to Rider' : 'Mark Delivered'}
                    </button>
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
                  )}
                </div>
              </div>
            );
          })}
<<<<<<< HEAD
=======
          {orders.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <Icons.UtensilsCrossed size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h3>All caught up! No active kitchen orders.</h3>
              <p>When an order is placed in POS or received from Swiggy/Zomato, it will ring and appear here in real time.</p>
              <button onClick={() => simulateOnlineOrder('Swiggy')} style={{ marginTop: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                Try Simulating a Swiggy Order Now
              </button>
            </div>
          )}
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
        </div>
      )}

      {/* Global Style for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
