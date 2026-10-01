import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = () => {
    // Fetch all orders, but we only care about ones that aren't fully completed/delivered in the kitchen
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all')
      .then(res => res.json())
      .then(data => {
        // Filter active kitchen orders: Not 'Delivered' and status != Cancelled
        const activeOrders = data.filter((o: any) => o.status !== 'Cancelled' && o.kitchenStatus !== 'Delivered');
        // Sort by creation time (oldest first, so chef makes them first)
        activeOrders.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setOrders(activeOrders);
        setIsLoading(false);
      })
      .catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh KDS every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateKitchenStatus = (id: number, status: string) => {
    apiFetch(`https://erp-api.neurolinx.in/api/pos/orders/${id}/kitchen-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kitchenStatus: status })
    }).then(fetchOrders);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
      case 'Preparing': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'Ready': return { bg: '#d1fae5', text: '#10b981', border: '#6ee7b7' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Kitchen Display System (KDS)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}><Icons.RefreshCw size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/> Auto-refreshes every 10s</span>
          <button onClick={fetchOrders} style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Refresh Now</button>
        </div>
      </div>

      {isLoading ? <div>Loading kitchen queue...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {orders.map(order => {
            const colors = getStatusColor(order.kitchenStatus || 'Pending');
            const timeElapsed = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
            
            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '8px', border: `2px solid ${colors.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: colors.bg, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
                  <div>
                    <h3 style={{ margin: 0, color: colors.text }}>#{order.orderNumber}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{order.orderType} {order.restaurantTable ? `- Table ${order.restaurantTable.tableNumber}` : ''}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: timeElapsed > 15 ? '#ef4444' : '#0f172a' }}>{timeElapsed} min</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Elapsed</div>
                  </div>
                </div>

                <div style={{ padding: '1rem', flex: 1 }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {order.items?.map((item: any) => (
                      <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0', fontSize: '1.1rem', fontWeight: 500 }}>
                        <span>{item.quantity}x {item.dish?.name}</span>
                      </li>
                    ))}
                  </ul>
                  {order.notes && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.875rem', color: '#991b1b' }}>
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                  {(order.kitchenStatus || 'Pending') === 'Pending' && (
                    <button onClick={() => updateKitchenStatus(order.id, 'Preparing')} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Start Preparing</button>
                  )}
                  {(order.kitchenStatus || 'Pending') === 'Preparing' && (
                    <button onClick={() => updateKitchenStatus(order.id, 'Ready')} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Mark Ready</button>
                  )}
                  {(order.kitchenStatus || 'Pending') === 'Ready' && (
                    <button onClick={() => updateKitchenStatus(order.id, 'Delivered')} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Mark Delivered</button>
                  )}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              <Icons.CheckCircle size={48} style={{ marginBottom: '1rem', color: '#10b981' }} />
              <h3>Kitchen is all caught up!</h3>
              <p>No active orders in the queue.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
