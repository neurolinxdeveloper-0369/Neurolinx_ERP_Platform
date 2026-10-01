import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import {
  IndianRupee,
  ShoppingBag,
  Utensils,
  TrendingUp,
  Clock,
  ChefHat,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  ExternalLink,
  Store,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ResStats {
  todayRevenue: number;
  todayRevenueDineIn: number;
  todayRevenueTakeaway: number;
  todayOrders: number;
  todayOrdersDineIn: number;
  todayOrdersTakeaway: number;
  activeTables: number;
  totalTables?: number;
  avgOrderValue: number;
  weeklyRevenue: { day: string; date?: string; amount: number; orderCount?: number }[];
  recentOrders: {
    id: string;
    orderNumber?: string;
    table: string;
    orderType?: string;
    amount: number;
    status: string;
    time: string;
    paymentMethod?: string;
  }[];
  pendingKots: number;
  topSellingItems?: {name: string; sales: number}[];
}

interface Dish {
  id: number;
  name: string;
  price: number;
  category?: { id: number; name: string };
  isAvailable?: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface RestaurantTable {
  id: number;
  tableName: string;
  status: string;
  floor?: number;
  capacity?: number;
}

interface CartItem {
  dish: Dish;
  quantity: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<ResStats>({
    todayRevenue: 0,
    todayRevenueDineIn: 0,
    todayRevenueTakeaway: 0,
    todayOrders: 0,
    todayOrdersDineIn: 0,
    todayOrdersTakeaway: 0,
    activeTables: 0,
    totalTables: 0,
    avgOrderValue: 0,
    weeklyRevenue: [
      { day: 'Mon', amount: 0, orderCount: 0 },
      { day: 'Tue', amount: 0, orderCount: 0 },
      { day: 'Wed', amount: 0, orderCount: 0 },
      { day: 'Thu', amount: 0, orderCount: 0 },
      { day: 'Fri', amount: 0, orderCount: 0 },
      { day: 'Sat', amount: 0, orderCount: 0 },
      { day: 'Sun', amount: 0, orderCount: 0 }
    ],
    recentOrders: [],
    pendingKots: 0,
    topSellingItems: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Quick Place Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchDish, setSearchDish] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  /**
   * Aggregates live orders placed from Orders menu (localStorage + API) and backend stats
   * Ensuring orders placed from tables immediately appear and generate all dashboard metrics!
   */
  const computeDashboardMetrics = useCallback((serverStats?: any, serverOrders?: any[], serverTables?: any[]) => {
    // 1. Retrieve all locally placed orders from Orders menu
    let localOrders: any[] = [];
    try {
      const cached = localStorage.getItem('pos_recent_orders');
      if (cached) {
        localOrders = JSON.parse(cached);
      }
    } catch (e) {
      localOrders = [];
    }

    // 2. Count occupied and total tables across all configured floors
    let activeTablesCount = 0;
    let totalTablesCount = 0;
    try {
      for (let floor = 1; floor <= 10; floor++) {
        const floorDataStr = localStorage.getItem(`floor_tables_${floor}`);
        if (floorDataStr) {
          const floorTables: any[] = JSON.parse(floorDataStr);
          if (Array.isArray(floorTables)) {
            totalTablesCount += floorTables.length;
            activeTablesCount += floorTables.filter(t => t.status === 'Occupied').length;
          }
        }
      }
    } catch (e) {
      console.warn('Local tables count error', e);
    }

    // Fallback/augment with server tables if available
    if (serverTables && Array.isArray(serverTables) && serverTables.length > 0) {
      if (totalTablesCount === 0) totalTablesCount = serverTables.length;
      const serverOccupied = serverTables.filter((t: any) => t.status === 'Occupied').length;
      activeTablesCount = Math.max(activeTablesCount, serverOccupied);
    }

    // 3. Build unified de-duplicated recent orders list
    const orderMap = new Map<string, any>();

    // A. Local orders placed directly in Orders menu or POS
    localOrders.forEach(o => {
      const key = String(o.orderNumber || o.id);
      let tableName = o.tableName;
      if (!tableName) {
        tableName = o.orderType === 'Takeaway' ? 'Takeaway' : 'Dine-In';
      }
      orderMap.set(key, {
        id: o.orderNumber || o.id,
        orderNumber: o.orderNumber || o.id,
        table: tableName,
        orderType: o.orderType || 'Dine-In',
        time: o.createdAt || 'Today',
        amount: Number(o.totalAmount || 0),
        status: o.status || 'Completed',
        paymentMethod: o.paymentMethod || 'UPI'
      });
    });

    // B. Orders from server recent endpoint
    if (serverOrders && Array.isArray(serverOrders)) {
      serverOrders.forEach((o: any) => {
        const key = String(o.orderNumber || o.id);
        if (!orderMap.has(key)) {
          let tableName = 'Takeaway';
          if (o.orderType === 'Dine-In') {
            tableName = o.restaurantTable?.tableName || 'Dine-In';
          }
          orderMap.set(key, {
            id: o.orderNumber || o.id,
            orderNumber: o.orderNumber || o.id,
            table: tableName,
            orderType: o.orderType || 'Dine-In',
            time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            amount: Number(o.totalAmount || 0),
            status: o.status || 'Completed',
            paymentMethod: o.paymentMethod || 'UPI'
          });
        }
      });
    }

    // C. Orders from serverStats if present
    if (serverStats?.recentOrders && Array.isArray(serverStats.recentOrders)) {
      serverStats.recentOrders.forEach((o: any) => {
        const key = String(o.orderNumber || o.id);
        if (!orderMap.has(key)) {
          orderMap.set(key, {
            id: o.orderNumber || o.id,
            orderNumber: o.orderNumber || o.id,
            table: o.table || o.orderType || 'Dine-In',
            orderType: o.orderType || 'Dine-In',
            time: o.time || 'Today',
            amount: Number(o.amount || 0),
            status: o.status || 'Completed',
            paymentMethod: o.paymentMethod || 'UPI'
          });
        }
      });
    }

    const mergedOrders = Array.from(orderMap.values());

    // Also check if any active order occupies a table
    const occupiedFromOrders = new Set(
      mergedOrders
        .filter(o => o.orderType === 'Dine-In' && o.table && !o.table.toLowerCase().includes('takeaway'))
        .map(o => o.table)
    );
    if (occupiedFromOrders.size > activeTablesCount) {
      activeTablesCount = occupiedFromOrders.size;
    }

    // 4. Calculate Revenue, Orders, and Breakdown
    const computedTotalRev = mergedOrders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Voided')
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);

    const computedDineInRev = mergedOrders
      .filter(o => o.orderType === 'Dine-In' && o.status !== 'Cancelled' && o.status !== 'Voided')
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);

    const computedTakeawayRev = mergedOrders
      .filter(o => o.orderType === 'Takeaway' && o.status !== 'Cancelled' && o.status !== 'Voided')
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);

    const computedDineInCount = mergedOrders.filter(o => o.orderType === 'Dine-In').length;
    const computedTakeawayCount = mergedOrders.filter(o => o.orderType === 'Takeaway').length;

    const computedPendingKots = mergedOrders.filter(
      o => o.status === 'Pending' || o.status === 'Parked' || o.status === 'Preparing' || o.status === 'Kitchen'
    ).length;

    // Use higher value between server calculation and local verified orders
    const todayRevenue = Math.max(serverStats?.todayRevenue || 0, computedTotalRev);
    const todayRevenueDineIn = Math.max(serverStats?.todayRevenueDineIn || 0, computedDineInRev);
    const todayRevenueTakeaway = Math.max(serverStats?.todayRevenueTakeaway || 0, computedTakeawayRev);

    const todayOrders = Math.max(serverStats?.todayOrders || 0, mergedOrders.length);
    const todayOrdersDineIn = Math.max(serverStats?.todayOrdersDineIn || 0, computedDineInCount);
    const todayOrdersTakeaway = Math.max(serverStats?.todayOrdersTakeaway || 0, computedTakeawayCount);

    const activeTables = Math.max(serverStats?.activeTables || 0, activeTablesCount);
    const totalTables = Math.max(serverStats?.totalTables || 0, totalTablesCount, activeTables > 0 ? activeTables : 6);

    const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
    const pendingKots = Math.max(serverStats?.pendingKots || 0, computedPendingKots);

    // 5. Weekly Revenue Trend calculation
    const currentDayIdx = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let weeklyRevenue = (serverStats?.weeklyRevenue && serverStats.weeklyRevenue.length === 7)
      ? [...serverStats.weeklyRevenue]
      : dayNames.map(d => ({ day: d, amount: 0, orderCount: 0 }));

    // Ensure today's bar accurately represents today's accumulated revenue
    weeklyRevenue = weeklyRevenue.map((w, idx) => {
      if (idx === currentDayIdx) {
        return {
          ...w,
          amount: Math.max(w.amount || 0, todayRevenue),
          orderCount: Math.max(w.orderCount || 0, todayOrders)
        };
      }
      return w;
    });

    return {
      todayRevenue,
      todayRevenueDineIn,
      todayRevenueTakeaway,
      todayOrders,
      todayOrdersDineIn,
      todayOrdersTakeaway,
      activeTables,
      totalTables,
      avgOrderValue,
      weeklyRevenue,
      recentOrders: mergedOrders.slice(0, 10),
      pendingKots
    };
  }, []);

  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      // Parallel fetch from API endpoints
      const [statsRes, recentRes, tablesRes] = await Promise.allSettled([
        apiFetch('https://erp-api.neurolinx.in/api/restaurant/dashboard-stats'),
        apiFetch('https://erp-api.neurolinx.in/api/pos/orders/recent'),
        apiFetch('https://erp-api.neurolinx.in/api/pos/tables')
      ]);

      let serverStats: any = null;
      let serverOrders: any[] = [];
      let serverTables: any[] = [];

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        serverStats = await statsRes.value.json().catch(() => null);
      }
      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        serverOrders = await recentRes.value.json().catch(() => []);
      }
      if (tablesRes.status === 'fulfilled' && tablesRes.value.ok) {
        serverTables = await tablesRes.value.json().catch(() => []);
      }

      // Compute aggregated live metrics
      const aggregated = computeDashboardMetrics(serverStats, serverOrders, serverTables);
      setStats(aggregated);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Dashboard stats refresh error:', err);
      // Fallback compute directly from local store
      const localOnly = computeDashboardMetrics();
      setStats(localOnly);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Event listeners to instantly update dashboard whenever an order is placed anywhere (Orders menu, POS, or modal)
    const handleOrderPlaced = () => {
      fetchStats();
    };

    window.addEventListener('neurolinx_order_placed', handleOrderPlaced);
    window.addEventListener('storage', handleOrderPlaced);
    window.addEventListener('focus', handleOrderPlaced);

    return () => {
      window.removeEventListener('neurolinx_order_placed', handleOrderPlaced);
      window.removeEventListener('storage', handleOrderPlaced);
      window.removeEventListener('focus', handleOrderPlaced);
    };
  }, []);

  const openQuickOrderModal = async () => {
    setShowOrderModal(true);
    setCart([]);
    setSelectedTableId(null);
    setSelectedOrderType('Dine-In');
    setLoadingModalData(true);
    try {
      const [dishesRes, catsRes, tablesRes] = await Promise.all([
        apiFetch('https://erp-api.neurolinx.in/api/pos/dishes'),
        apiFetch('https://erp-api.neurolinx.in/api/pos/categories'),
        apiFetch('https://erp-api.neurolinx.in/api/pos/tables')
      ]);

      if (dishesRes.ok) {
        const dishesData = await dishesRes.json();
        setDishes(dishesData);
      }
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      }
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
        // Default to first free table if Dine-In
        const firstFree = tablesData.find((t: RestaurantTable) => t.status === 'Free' || t.status === 'Available');
        if (firstFree) setSelectedTableId(firstFree.id);
      }
    } catch (err) {
      console.warn('Failed loading POS data for modal', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const updateQuantity = (dishId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.dish.id === dishId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const taxAmount = Number((cartSubtotal * 0.05).toFixed(2));
  const cartTotal = Number((cartSubtotal + taxAmount).toFixed(2));

  const handlePlaceOrderSubmit = async (status: 'Completed' | 'Parked' = 'Completed') => {
    if (cart.length === 0) {
      alert('Please add at least one dish to the cart.');
      return;
    }
    if (selectedOrderType === 'Dine-In' && !selectedTableId) {
      alert('Please select a dining table.');
      return;
    }

    const currentTable = tables.find(t => t.id === selectedTableId);
    const tableName = selectedOrderType === 'Dine-In' ? (currentTable?.tableName || 'Table') : undefined;

    setIsSubmittingOrder(true);
    try {
      const payload = {
        orderType: selectedOrderType,
        tableId: selectedOrderType === 'Dine-In' ? selectedTableId : null,
        totalAmount: cartTotal,
        taxApplied: taxAmount,
        discountApplied: 0,
        paymentMethod: status === 'Parked' ? null : paymentMethod,
        status: status,
        items: cart.map(item => ({
          dishId: item.dish.id,
          quantity: item.quantity
        }))
      };

      let createdOrder: any = null;
      try {
        const res = await apiFetch('https://erp-api.neurolinx.in/api/pos/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          createdOrder = await res.json().catch(() => null);
        }
      } catch (e) {
        console.warn('API error, saving locally', e);
      }

      const orderNumber = createdOrder?.orderNumber || `ORD-${Date.now().toString().slice(-4)}`;
      const orderRecord = {
        id: createdOrder?.id || Date.now(),
        orderNumber: orderNumber,
        orderType: selectedOrderType,
        tableName: tableName,
        items: cart.map(c => ({ name: c.dish.name, quantity: c.quantity, price: c.dish.price })),
        totalAmount: cartTotal,
        paymentMethod: status === 'Parked' ? 'Unpaid' : paymentMethod,
        status: status,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Store locally so it syncs immediately with Orders and Dashboard
      try {
        const cached = localStorage.getItem('pos_recent_orders');
        const prev = cached ? JSON.parse(cached) : [];
        const updated = [orderRecord, ...prev.filter((p: any) => p.orderNumber !== orderNumber)].slice(0, 10);
        localStorage.setItem('pos_recent_orders', JSON.stringify(updated));
      } catch (e) {}

      // Update table occupancy in local storage
      if (selectedOrderType === 'Dine-In' && selectedTableId) {
        try {
          const cachedTables = localStorage.getItem('floor_tables_1');
          if (cachedTables) {
            const parsed = JSON.parse(cachedTables);
            const updated = parsed.map((t: any) => t.id === selectedTableId ? { ...t, status: 'Occupied' } : t);
            localStorage.setItem('floor_tables_1', JSON.stringify(updated));
          }
        } catch (e) {}
      }

      // Dispatch event
      window.dispatchEvent(new CustomEvent('neurolinx_order_placed', { detail: orderRecord }));
      window.dispatchEvent(new Event('storage'));

      setOrderToast({
        message: `Order #${orderNumber} placed successfully!`,
        type: 'success'
      });
      setTimeout(() => setOrderToast(null), 4000);
      setShowOrderModal(false);
      setCart([]);
      fetchStats(false);
    } catch (err) {
      console.error('Order submission error:', err);
      setOrderToast({ message: 'Error placing order.', type: 'error' });
      setTimeout(() => setOrderToast(null), 4000);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const filteredDishes = dishes.filter(d => {
    const matchesCat = selectedCategory === null || d.category?.id === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(searchDish.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const maxWeeklyRevenue = Math.max(...stats.weeklyRevenue.map(d => d.amount), 1);
  const totalWeeklyRevenue = stats.weeklyRevenue.reduce((sum, d) => sum + (d.amount || 0), 0);
  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const occupancyRate = stats.totalTables && stats.totalTables > 0
    ? Math.round((stats.activeTables / stats.totalTables) * 100)
    : 0;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw size={36} color="#3b82f6" className="animate-spin" />
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Loading live restaurant metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 3rem 0', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Toast Notification */}
      {orderToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            color: 'white',
            backgroundColor: orderToast.type === 'success' ? '#10b981' : '#ef4444',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {orderToast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{orderToast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>
              Operations Dashboard
            </h1>
            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
              Live POS & Tables
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.925rem', fontWeight: 500 }}>
            Real-time sales, live table occupancy, kitchen queue, and operational overview.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Live Sync Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
              <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
              <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: '#10b981' }}></span>
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>Live Sync</span>
            {lastUpdated && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({lastUpdated})</span>}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            title="Refresh metrics"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              color: '#475569',
              padding: '0.625rem 0.875rem',
              borderRadius: '10px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} style={{ transition: 'transform 0.3s' }} />
            <span>Refresh</span>
          </button>

          {/* Place Orders Primary CTA */}
          <button
            onClick={openQuickOrderModal}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              color: 'white',
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Place Order</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Today's Revenue */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.07)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Today's Revenue
              </p>
              <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.03em' }}>
                ₹{Number(stats.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: '14px', display: 'flex' }}>
              <IndianRupee size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #f8fafc', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
              Dine-In: ₹{Number(stats.todayRevenueDineIn || 0).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
              Takeaway: ₹{Number(stats.todayRevenueTakeaway || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Card 2: Today's Orders */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.07)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Today's Orders
              </p>
              <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {stats.todayOrders || 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#f5f3ff', color: '#7c3aed', padding: '0.75rem', borderRadius: '14px', display: 'flex' }}>
              <ShoppingBag size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #f8fafc', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
              Dine-In: {stats.todayOrdersDineIn || 0}
            </span>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
              Takeaway: {stats.todayOrdersTakeaway || 0}
            </span>
          </div>
        </div>

        {/* Card 3: Active Tables */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.07)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Tables
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.4rem' }}>
                <h2 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {stats.activeTables || 0}
                </h2>
                {stats.totalTables !== undefined && stats.totalTables > 0 && (
                  <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>
                    / {stats.totalTables}
                  </span>
                )}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff7ed', color: '#ea580c', padding: '0.75rem', borderRadius: '14px', display: 'flex' }}>
              <Utensils size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Occupied Dine-in
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                backgroundColor: stats.activeTables > 0 ? '#ffedd5' : '#f1f5f9',
                color: stats.activeTables > 0 ? '#c2410c' : '#64748b'
              }}
            >
              {occupancyRate > 0 ? `${occupancyRate}% Floor Capacity` : 'All Tables Free'}
            </span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.07)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Order Value
              </p>
              <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.03em' }}>
                ₹{Math.round(stats.avgOrderValue || 0).toLocaleString('en-IN')}
              </h2>
            </div>
            <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.75rem', borderRadius: '14px', display: 'flex' }}>
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Revenue / Total Orders
            </span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, backgroundColor: '#d1fae5', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
              AOV Metric
            </span>
          </div>
        </div>

      </div>

      {/* Middle Grid: Weekly Trend (Left) + Kitchen Queue & Quick Actions (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* Weekly Revenue Trend Bar Chart */}
        <div
          style={{
            gridColumn: 'span 2',
            backgroundColor: 'white',
            borderRadius: '18px',
            padding: '1.75rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>
                Weekly Revenue Trend
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.8125rem' }}>
                Mon – Sun performance across the current calendar week
              </p>
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
                Total Week: <strong style={{ color: '#0f172a' }}>₹{totalWeeklyRevenue.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div style={{ height: '230px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem', padding: '1rem 0.5rem 0 0.5rem' }}>
            {stats.weeklyRevenue.map((d, index) => {
              const heightPercent = maxWeeklyRevenue > 0 ? (d.amount / maxWeeklyRevenue) * 100 : 0;
              const isToday = index === currentDayIndex;

              return (
                <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', gap: '0.5rem' }}>
                  {/* Bar pillar with tooltip */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                    <div
                      className="bar-container"
                      style={{
                        width: '100%',
                        maxWidth: '46px',
                        margin: '0 auto',
                        height: `${Math.max(heightPercent, d.amount === 0 ? 5 : 10)}%`,
                        backgroundColor: isToday
                          ? '#2563eb'
                          : d.amount > 0
                          ? '#93c5fd'
                          : '#f1f5f9',
                        borderRadius: '8px 8px 3px 3px',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        cursor: 'pointer',
                        boxShadow: isToday ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = isToday ? '#1d4ed8' : '#60a5fa';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = isToday ? '#2563eb' : (d.amount > 0 ? '#93c5fd' : '#f1f5f9');
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div
                        className="bar-tooltip"
                        style={{
                          position: 'absolute',
                          top: '-48px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#0f172a',
                          color: 'white',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                          zIndex: 10
                        }}
                      >
                        <div>₹{Number(d.amount).toLocaleString('en-IN')}</div>
                        {d.orderCount !== undefined && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{d.orderCount} orders</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Day Label */}
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? '#2563eb' : '#64748b'
                      }}
                    >
                      {d.day}
                    </span>
                    {isToday && (
                      <div style={{ width: '4px', height: '4px', backgroundColor: '#2563eb', borderRadius: '50%', margin: '2px auto 0 auto' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Stack: Kitchen Queue & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Kitchen Queue Card */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '18px',
              padding: '1.5rem',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem'
            }}
          >
            <div
              style={{
                backgroundColor: stats.pendingKots > 0 ? '#fef2f2' : '#f8fafc',
                color: stats.pendingKots > 0 ? '#ef4444' : '#64748b',
                padding: '1.125rem',
                borderRadius: '16px',
                display: 'flex',
                boxShadow: stats.pendingKots > 0 ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'none'
              }}
            >
              <ChefHat size={34} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kitchen Queue
                </p>
                {stats.pendingKots > 0 && (
                  <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                    Active KOTs
                  </span>
                )}
              </div>
              <h3 style={{ margin: '0.2rem 0', fontSize: '1.875rem', color: '#0f172a', fontWeight: 800 }}>
                {stats.pendingKots || 0}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: stats.pendingKots > 0 ? '#dc2626' : '#64748b', fontWeight: 500 }}>
                {stats.pendingKots > 0 ? 'Orders preparing or awaiting fulfillment' : 'Kitchen queue is clear'}
              </p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '18px',
              padding: '1.5rem',
              color: 'white',
              backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              flex: 1,
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Quick Actions
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Shortcuts</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Action 1: Instant Quick Order */}
              <button
                onClick={openQuickOrderModal}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Plus size={16} color="#38bdf8" />
                  <ArrowRight size={12} color="#64748b" />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Create Order</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Place via modal</span>
              </button>

              {/* Action 2: Go to Full POS */}
              <button
                onClick={() => navigate('/res-orders')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Store size={16} color="#4ade80" />
                  <ArrowRight size={12} color="#64748b" />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>POS Terminal</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Full screen POS</span>
              </button>

              {/* Action 3: View Active Tables */}
              <button
                onClick={() => navigate('/res-orders')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Layers size={16} color="#f59e0b" />
                  <ArrowRight size={12} color="#64748b" />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Tables & Floors</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Floor layout</span>
              </button>

              {/* Action 4: Inventory */}
              <button
                onClick={() => navigate('/res-inventory')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Clock size={16} color="#a855f7" />
                  <ArrowRight size={12} color="#64748b" />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Inventory</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Raw stock alerts</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Recent Orders Section */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>
              Recent Orders
            </h3>
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
              {stats.recentOrders.length} Latest Orders
            </span>
          </div>

          <button
            onClick={() => navigate('/res-orders')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Open Orders & POS</span>
            <ExternalLink size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.875rem 1.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Order ID</th>
                <th style={{ padding: '0.875rem 1.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Table / Type</th>
                <th style={{ padding: '0.875rem 1.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Time</th>
                <th style={{ padding: '0.875rem 1.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Payment</th>
                <th style={{ padding: '0.875rem 1.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '0.875rem 1.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 0', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '50%', marginBottom: '0.75rem', color: '#94a3b8' }}>
                      <ShoppingBag size={32} />
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontWeight: 600, fontSize: '0.925rem' }}>
                      No orders placed yet today.
                    </p>
                    <button
                      onClick={openQuickOrderModal}
                      style={{
                        marginTop: '0.75rem',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: 600
                      }}
                    >
                      + Place First Order
                    </button>
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order, idx) => (
                  <tr
                    key={order.id || idx}
                    style={{
                      borderBottom: idx === stats.recentOrders.length - 1 ? 'none' : '1px solid #f1f5f9',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Order ID */}
                    <td style={{ padding: '1rem 1.75rem', color: '#0f172a', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      #{order.id}
                    </td>

                    {/* Table / Type */}
                    <td style={{ padding: '1rem 1.75rem' }}>
                      <span
                        style={{
                          backgroundColor: order.table?.toLowerCase().includes('takeaway') ? '#f1f5f9' : '#fff7ed',
                          color: order.table?.toLowerCase().includes('takeaway') ? '#475569' : '#c2410c',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {order.table?.toLowerCase().includes('takeaway') ? <ShoppingBag size={12} /> : <Utensils size={12} />}
                        {order.table}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={{ padding: '1rem 1.75rem', color: '#64748b', fontSize: '0.8125rem', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} color="#94a3b8" />
                        <span>{order.time || 'Today'}</span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td style={{ padding: '1rem 1.75rem', color: '#475569', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {order.paymentMethod || 'UPI'}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '1rem 1.75rem', color: '#0f172a', fontWeight: 700, fontSize: '0.875rem', textAlign: 'right' }}>
                      ₹{Number(order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '1rem 1.75rem', textAlign: 'right' }}>
                      <span
                        style={{
                          backgroundColor:
                            order.status === 'Completed'
                              ? '#dcfce7'
                              : order.status === 'Parked'
                              ? '#fef9c3'
                              : '#eff6ff',
                          color:
                            order.status === 'Completed'
                              ? '#15803d'
                              : order.status === 'Parked'
                              ? '#854d0e'
                              : '#1d4ed8',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {order.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK PLACE ORDER MODAL */}
      {showOrderModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setShowOrderModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '980px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc'
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                  Quick Place Order
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.8125rem' }}>
                  Select order type, choose dishes, and submit straight to POS & live dashboard
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Split 2 columns (Left: Catalog, Right: Cart) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Order Settings & Menu */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Order Type & Table Selection */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
                    <button
                      onClick={() => setSelectedOrderType('Dine-In')}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: selectedOrderType === 'Dine-In' ? 'white' : 'transparent',
                        color: selectedOrderType === 'Dine-In' ? '#0f172a' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        boxShadow: selectedOrderType === 'Dine-In' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      Dine-In
                    </button>
                    <button
                      onClick={() => setSelectedOrderType('Takeaway')}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: selectedOrderType === 'Takeaway' ? 'white' : 'transparent',
                        color: selectedOrderType === 'Takeaway' ? '#0f172a' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        boxShadow: selectedOrderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      Takeaway
                    </button>
                  </div>

                  {selectedOrderType === 'Dine-In' && (
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <select
                        value={selectedTableId || ''}
                        onChange={e => setSelectedTableId(e.target.value ? Number(e.target.value) : null)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8125rem',
                          color: '#0f172a',
                          fontWeight: 600,
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select Table...</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.tableName} ({t.status || 'Free'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Dish Search & Categories */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchDish}
                      onChange={e => setSearchDish(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Category Pills */}
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        border: selectedCategory === null ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: selectedCategory === null ? '#eff6ff' : 'white',
                        color: selectedCategory === null ? '#2563eb' : '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      All Items
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '999px',
                          border: selectedCategory === c.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          backgroundColor: selectedCategory === c.id ? '#eff6ff' : 'white',
                          color: selectedCategory === c.id ? '#2563eb' : '#64748b',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dish Grid */}
                {loadingModalData ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading menu items...</p>
                  </div>
                ) : filteredDishes.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Utensils size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>No dishes found matching criteria.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {filteredDishes.map(dish => {
                      const inCart = cart.find(ci => ci.dish.id === dish.id);
                      return (
                        <div
                          key={dish.id}
                          style={{
                            border: inCart ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0.875rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            backgroundColor: inCart ? '#eff6ff' : 'white',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.675rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                              {dish.category?.name || 'Dish'}
                            </span>
                            <h4 style={{ margin: '0.2rem 0', fontSize: '0.875rem', color: '#0f172a', fontWeight: 700 }}>
                              {dish.name}
                            </h4>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                              ₹{dish.price}
                            </span>
                            <button
                              onClick={() => addToCart(dish)}
                              style={{
                                backgroundColor: inCart ? '#2563eb' : '#f1f5f9',
                                color: inCart ? 'white' : '#1e293b',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Plus size={12} strokeWidth={3} />
                              <span>{inCart ? `${inCart.quantity} in Cart` : 'Add'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary & Place Order */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', overflowY: 'auto' }}>
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                    Order Summary
                  </h3>

                  {cart.length === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <ShoppingBag size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500 }}>
                        Cart is empty. Add dishes from the menu to build the order.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                      {cart.map(item => (
                        <div
                          key={item.dish.id}
                          style={{
                            backgroundColor: 'white',
                            padding: '0.625rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                              {item.dish.name}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ₹{item.dish.price} x {item.quantity} = ₹{item.dish.price * item.quantity}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              onClick={() => updateQuantity(item.dish.id, -1)}
                              style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.dish.id, 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals & Submit */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b' }}>
                    <span>Tax (5% GST)</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                    <span>Total Amount</span>
                    <span style={{ color: '#2563eb' }}>₹{cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>
                      Payment Method
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {(['UPI', 'Cash', 'Card'] as const).map(method => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: paymentMethod === method ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            backgroundColor: paymentMethod === method ? '#eff6ff' : 'white',
                            color: paymentMethod === method ? '#2563eb' : '#475569',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {method === 'UPI' && <QrCode size={14} />}
                          {method === 'Cash' && <Banknote size={14} />}
                          {method === 'Card' && <CreditCard size={14} />}
                          <span>{method}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handlePlaceOrderSubmit('Parked')}
                      disabled={cart.length === 0 || isSubmittingOrder}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: 'white',
                        color: '#475569',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: cart.length === 0 || isSubmittingOrder ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Park / Hold
                    </button>
                    <button
                      onClick={() => handlePlaceOrderSubmit('Completed')}
                      disabled={cart.length === 0 || isSubmittingOrder}
                      style={{
                        flex: 2,
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: cart.length === 0 || isSubmittingOrder ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      {isSubmittingOrder ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      <span>Place & Settle</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Chart Tooltips & Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .bar-container .bar-tooltip {
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease-in-out;
        }
        .bar-container:hover .bar-tooltip {
          opacity: 1;
          visibility: visible;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
}
