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


  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    
    let itemsHtml = '';
    if (order.items) {
      order.items.forEach((item: any) => {
        itemsHtml += `
          <tr>
            <td style="padding: 4px 0; font-size: 14px;">${item.quantity}x ${item.dish?.name || 'Item'}</td>
            <td style="padding: 4px 0; text-align: right; font-size: 14px;">${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.orderNumber}</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h2 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .totals { border-top: 1px dashed #000; padding-top: 10px; }
          .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
          .totals .grand-total { font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>RESTAURANT</h2>
          <p>Order #${order.orderNumber}</p>
          <p>${new Date(order.createdAt).toLocaleString()}</p>
          <p>${order.orderType}${order.restaurantTable ? ' - Table ' + order.restaurantTable.tableNumber : ''}</p>
        </div>
        
        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <div><span>Subtotal</span> <span>${(order.totalAmount - (order.taxApplied || 0)).toFixed(2)}</span></div>
          <div><span>Tax</span> <span>${(order.taxApplied || 0).toFixed(2)}</span></div>
          <div class="grand-total"><span>Total</span> <span>${order.totalAmount.toFixed(2)}</span></div>
        </div>
        
        <div class="footer">
          <p>Thank you for visiting!</p>
          <p>Powered by Neurolinx</p>
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
                  <button onClick={() => handlePrint(ord)} style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
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
