import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function RestaurantBilling() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = () => {
    setIsLoading(true);
    // Since we don't have a specific billing endpoint, we can use the recent orders endpoint.
    // In a real app we would have a paginated endpoint /api/pos/orders/history
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders/recent')
      .then(res => res.json())
      .then(data => { setOrders(data); setIsLoading(false); })
      .catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Billing & Invoices</h2>
        <button onClick={fetchOrders} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.RefreshCw size={16} /> Refresh
        </button>
      </div>

      {isLoading ? <div>Loading bills...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem' }}>Order #</th>
              <th style={{ padding: '1rem' }}>Table / Type</th>
              <th style={{ padding: '1rem' }}>Total Amount</th>
              <th style={{ padding: '1rem' }}>Payment</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(ord => (
              <tr key={ord.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>{ord.orderNumber}</td>
                <td style={{ padding: '1rem' }}>{ord.orderType === 'Dine-In' ? ord.restaurantTable?.tableName || 'Dine-In' : ord.orderType}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>₹{ord.totalAmount?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: '1rem' }}>{ord.paymentMethod || 'UPI'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: ord.status === 'Completed' ? '#d1fae5' : '#fef3c7', color: ord.status === 'Completed' ? '#10b981' : '#d97706' }}>
                    {ord.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                    <Icons.Printer size={16} /> Print Receipt
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No billing history found.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
