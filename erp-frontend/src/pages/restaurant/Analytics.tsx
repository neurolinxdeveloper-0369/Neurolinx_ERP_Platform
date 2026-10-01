import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Analytics() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all')
      .then(res => res.json())
      .then(data => {
        // Only look at completed orders
        setOrders(data.filter((o: any) => o.status === 'Completed'));
        setIsLoading(false);
      })
      .catch(e => { console.error(e); setIsLoading(false); });
  }, []);

  // Compute analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const dishSales: Record<string, { qty: number, rev: number }> = {};
  orders.forEach(o => {
    if (o.items) {
      o.items.forEach((item: any) => {
        const dishName = item.dish?.name || 'Unknown';
        if (!dishSales[dishName]) dishSales[dishName] = { qty: 0, rev: 0 };
        dishSales[dishName].qty += item.quantity;
        dishSales[dishName].rev += (item.quantity * item.price);
      });
    }
  });

  const topDishes = Object.entries(dishSales)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  const salesByTime: Record<string, number> = {
    'Morning (6am-12pm)': 0,
    'Afternoon (12pm-5pm)': 0,
    'Evening (5pm-10pm)': 0,
    'Late Night (10pm-6am)': 0
  };

  orders.forEach(o => {
    if (o.createdAt) {
      const hour = new Date(o.createdAt).getHours();
      if (hour >= 6 && hour < 12) salesByTime['Morning (6am-12pm)'] += o.totalAmount || 0;
      else if (hour >= 12 && hour < 17) salesByTime['Afternoon (12pm-5pm)'] += o.totalAmount || 0;
      else if (hour >= 17 && hour < 22) salesByTime['Evening (5pm-10pm)'] += o.totalAmount || 0;
      else salesByTime['Late Night (10pm-6am)'] += o.totalAmount || 0;
    }
  });

  const peakTime = Object.entries(salesByTime).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Restaurant Analytics & Reporting</h2>
      </div>

      {isLoading ? <div>Loading Analytics...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '50%' }}>
                <Icons.TrendingUp size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Total Historical Revenue</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>₹{totalRevenue.toFixed(2)}</h3>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#10b981', borderRadius: '50%' }}>
                <Icons.ShoppingBag size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Total Completed Orders</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>{orders.length}</h3>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '50%' }}>
                <Icons.Clock size={24} />
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Peak Ordering Time</p>
                <h3 style={{ margin: '0.25rem 0 0 0', color: '#0f172a' }}>{peakTime}</h3>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Award size={20} color="#0284c7" /> Top Selling Items
              </h3>
              {topDishes.length === 0 ? <p style={{ color: '#94a3b8' }}>No sales data yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {topDishes.map(([name, stats]: any, idx) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: idx === topDishes.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 600, color: '#64748b', width: '20px' }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 500 }}>{name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{stats.qty} sold</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>₹{stats.rev.toFixed(2)} generated</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.BarChart3 size={20} color="#10b981" /> Sales by Time Period
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(salesByTime).map(([period, rev]) => (
                  <div key={period} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>{period}</span>
                    <span style={{ fontWeight: 600 }}>₹{rev.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
