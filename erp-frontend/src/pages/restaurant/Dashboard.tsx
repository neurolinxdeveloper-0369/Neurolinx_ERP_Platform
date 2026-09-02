import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { IndianRupee, ShoppingBag, Utensils, TrendingUp, Clock, ChefHat, Bell } from 'lucide-react';

interface ResStats {
  todayRevenue: number;
  todayRevenueDineIn: number;
  todayRevenueTakeaway: number;
  todayOrders: number;
  todayOrdersDineIn: number;
  todayOrdersTakeaway: number;
  activeTables: number;
  avgOrderValue: number;
  weeklyRevenue: { day: string; amount: number }[];
  recentOrders: { id: string; table: string; amount: number; status: string; time: string }[];
  pendingKots: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ResStats>({
    todayRevenue: 0,
    todayRevenueDineIn: 0,
    todayRevenueTakeaway: 0,
    todayOrders: 0,
    todayOrdersDineIn: 0,
    todayOrdersTakeaway: 0,
    activeTables: 0,
    avgOrderValue: 0,
    weeklyRevenue: [
      { day: 'Mon', amount: 0 },
      { day: 'Tue', amount: 0 },
      { day: 'Wed', amount: 0 },
      { day: 'Thu', amount: 0 },
      { day: 'Fri', amount: 0 },
      { day: 'Sat', amount: 0 },
      { day: 'Sun', amount: 0 }
    ],
    recentOrders: [],
    pendingKots: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetching from a restaurant-specific operational API endpoint
      // If the backend doesn't have this yet, it will throw an error and we gracefully default to 0
      const res = await apiFetch('https://erp-api.neurolinx.in/api/restaurant/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Operational data unavailable or endpoint missing. Defaulting to empty state.", err);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, subtitle, color, bgColor }: any) => (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{title}</p>
          <h3 style={{ margin: 0, fontSize: '1.875rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>{value}</h3>
        </div>
        <div style={{ backgroundColor: bgColor, padding: '0.75rem', borderRadius: '12px', color: color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
        {subtitle}
      </div>
    </div>
  );

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading operational metrics...</div>;
  }

  // Find max revenue for graph scaling
  const maxWeeklyRevenue = Math.max(...stats.weeklyRevenue.map(d => d.amount), 1); // Avoid division by zero

  return (
    <div style={{ padding: '0.5rem 0 2rem 0', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>Overview Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '1rem' }}>
            Live performance metrics for your restaurant.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Live Sync Active</span>
          </div>
          <button style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.625rem', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}>
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <StatCard 
            title="Today's Revenue" 
            value={`₹${stats.todayRevenue.toLocaleString()}`} 
            icon={<IndianRupee size={24} strokeWidth={2.5} />} 
            subtitle={
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>Dine-in: ₹{stats.todayRevenueDineIn.toLocaleString()}</span>
                <span>Takeaway: ₹{stats.todayRevenueTakeaway.toLocaleString()}</span>
              </div>
            }
            color="#2563eb" 
            bgColor="#eff6ff" 
          />
          <StatCard 
            title="Today's Orders" 
            value={stats.todayOrders} 
            icon={<ShoppingBag size={24} strokeWidth={2.5} />} 
            subtitle={
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>Dine-in: {stats.todayOrdersDineIn}</span>
                <span>Takeaway: {stats.todayOrdersTakeaway}</span>
              </div>
            }
            color="#7c3aed" 
            bgColor="#f5f3ff" 
          />
          <StatCard 
            title="Active Tables" 
            value={stats.activeTables} 
            icon={<Utensils size={24} strokeWidth={2.5} />} 
            subtitle="Total currently seated across all zones"
            color="#ea580c" 
            bgColor="#fff7ed" 
          />
          <StatCard 
            title="Average Order Value" 
            value={`₹${stats.avgOrderValue.toLocaleString()}`} 
            icon={<TrendingUp size={24} strokeWidth={2.5} />} 
            subtitle="Combined average across all today's orders"
            color="#059669" 
            bgColor="#ecfdf5" 
          />
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Weekly Revenue Graph (Left Column) */}
        <div style={{ flex: '2 1 500px', backgroundColor: 'white', borderRadius: '16px', padding: '1.75rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>Weekly Revenue Trend</h2>
          </div>
          
          <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', paddingTop: '1rem' }}>
            {stats.weeklyRevenue.map((day, i) => {
              const heightPercent = maxWeeklyRevenue > 1 ? (day.amount / maxWeeklyRevenue) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flex: 1, height: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        maxWidth: '40px', 
                        margin: '0 auto', 
                        backgroundColor: day.amount === 0 ? '#f1f5f9' : '#3b82f6', 
                        height: `${Math.max(heightPercent, day.amount === 0 ? 4 : 8)}%`, // Minimum height for 0
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                      }} 
                    >
                      {/* Tooltip on hover */}
                      <div className="bar-tooltip" style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                        ₹{day.amount}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Kitchen & Alerts (Right Column) */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.75rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#fef2f2', padding: '1.25rem', borderRadius: '50%', color: '#dc2626' }}>
              <ChefHat size={32} strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Kitchen Queue</p>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 800 }}>{stats.pendingKots}</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>Pending KOTs</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.5rem', color: 'white', flex: 1, backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Clock size={20} color="#38bdf8" />
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Quick Actions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.875rem', borderRadius: '8px', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                Create New Order
              </button>
              <button style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.875rem', borderRadius: '8px', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                View Active Tables
              </button>
              <button style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.875rem', borderRadius: '8px', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
                Settle Cash Register
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>Recent Orders</h2>
          <button style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Order ID</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Table / Type</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Time</th>
                <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Amount</th>
                <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                      <Utensils size={32} color="#94a3b8" />
                    </div>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>No orders recorded today yet.</p>
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order, i) => (
                  <tr key={order.id} style={{ borderBottom: i === stats.recentOrders.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a', fontWeight: 600, fontSize: '0.875rem' }}>{order.id}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontSize: '0.875rem' }}>{order.table}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>{order.time}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>₹{order.amount.toLocaleString()}</td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <span style={{ backgroundColor: order.status === 'Completed' ? '#dcfce7' : '#fef9c3', color: order.status === 'Completed' ? '#166534' : '#854d0e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .bar-tooltip { opacity: 0; }
        div:hover > .bar-tooltip { opacity: 1 !important; }
      `}} />
    </div>
  );
}
