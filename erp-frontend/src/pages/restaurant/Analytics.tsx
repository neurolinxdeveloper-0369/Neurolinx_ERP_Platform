import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string>(localStorage.getItem('activeBranchId') || 'global');

  useEffect(() => {
    // Listen for branch changes from MasterLayout top nav
    const handleBranchChange = () => {
      setActiveBranchId(localStorage.getItem('activeBranchId') || 'global');
    };
    window.addEventListener('branch_changed', handleBranchChange);
    return () => window.removeEventListener('branch_changed', handleBranchChange);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all')
      .then(res => res.json())
      .then(data => {
        setOrders(data.filter((o: any) => o.status === 'Completed'));
        setIsLoading(false);
      })
      .catch(e => { console.error(e); setIsLoading(false); });
  }, [activeBranchId]); // Refetch when branch context changes!

  // Analytics Engine
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // 1. Branch Performance (Only relevant if in 'global' view)
  const branchSales: Record<string, number> = {};
  orders.forEach(o => {
    const bName = o.branch?.name || 'Headquarters / Unassigned';
    if (!branchSales[bName]) branchSales[bName] = 0;
    branchSales[bName] += (o.totalAmount || 0);
  });
  const branchChartData = Object.entries(branchSales).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);

  // 2. Daily Sales Trend (Last 7 Days)
  const last7DaysData: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7DaysData[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  }
  
  orders.forEach(o => {
    if (o.createdAt) {
      const d = new Date(o.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (last7DaysData[dateStr] !== undefined) {
        last7DaysData[dateStr] += (o.totalAmount || 0);
      }
    }
  });
  const trendChartData = Object.entries(last7DaysData).map(([date, revenue]) => ({ date, revenue }));

  // 3. Top Selling Items
  const dishSales: Record<string, { qty: number, rev: number }> = {};
  orders.forEach(o => {
    if (o.items) {
      o.items.forEach((item: any) => {
        const dishName = item.dish?.name || item.name || 'Unknown';
        if (!dishSales[dishName]) dishSales[dishName] = { qty: 0, rev: 0 };
        dishSales[dishName].qty += item.quantity;
        dishSales[dishName].rev += (item.quantity * item.price);
      });
    }
  });
  const topDishes = Object.entries(dishSales).map(([name, stats]) => ({ name, value: stats.qty })).sort((a, b) => b.value - a.value).slice(0, 5);
  const topDishesRev = Object.entries(dishSales).map(([name, stats]) => ({ name, revenue: stats.rev })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // 4. Sales by Time Period
  const salesByTime: Record<string, number> = {
    'Morning': 0, 'Afternoon': 0, 'Evening': 0, 'Late Night': 0
  };
  orders.forEach(o => {
    if (o.createdAt) {
      const hour = new Date(o.createdAt).getHours();
      if (hour >= 6 && hour < 12) salesByTime['Morning'] += o.totalAmount || 0;
      else if (hour >= 12 && hour < 17) salesByTime['Afternoon'] += o.totalAmount || 0;
      else if (hour >= 17 && hour < 22) salesByTime['Evening'] += o.totalAmount || 0;
      else salesByTime['Late Night'] += o.totalAmount || 0;
    }
  });
  const timeChartData = Object.entries(salesByTime).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Advanced BI Dashboard</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            {activeBranchId === 'global' ? 'Showing global analytics across all branches.' : `Showing analytics for specific branch context.`}
          </p>
        </div>
      </div>

      {isLoading ? <div>Loading Analytics...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '50%' }}>
                <Icons.TrendingUp size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Total Revenue</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>₹{totalRevenue.toFixed(2)}</h3>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#10b981', borderRadius: '50%' }}>
                <Icons.ShoppingBag size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Completed Orders</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>{orders.length}</h3>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', color: '#a855f7', borderRadius: '50%' }}>
                <Icons.Utensils size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Items Sold</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>{Object.values(dishSales).reduce((sum, s) => sum + s.qty, 0)}</h3>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '50%' }}>
                <Icons.Clock size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Busiest Time</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>{timeChartData.sort((a,b) => b.value - a.value)[0]?.name || 'N/A'}</h3>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>7-Day Revenue Trend</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value: any) => `₹${value}`} dx={-10} />
                    <Tooltip formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>Sales by Time Period</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={timeChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {timeChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: activeBranchId === 'global' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '2rem' }}>
            {activeBranchId === 'global' && (
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>Branch Comparison (Revenue)</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={branchChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value: any) => `₹${value}`} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                      <Tooltip formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Revenue']} cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>Top Selling Items (Quantity)</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={topDishes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: any) => [`${value} units`, 'Quantity Sold']} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>Top Revenue Generators</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={topDishesRev}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value: any) => `₹${value}`} />
                    <Tooltip formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Revenue']} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
