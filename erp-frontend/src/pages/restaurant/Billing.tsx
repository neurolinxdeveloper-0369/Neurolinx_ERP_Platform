import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function RestaurantBilling() {
  const [orders, setOrders] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'reconciliation'>('history');

  // Reconciliation state
  const [actualCash, setActualCash] = useState<number>(0);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/inventory/purchases').then(res => res.json())
    ]).then(([o, p]) => {
      setOrders(o.filter((order: any) => order.status === 'Completed'));
      setPurchases(p);
      setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => {
    fetchData();
    const handleBranchChange = () => fetchData();
    window.addEventListener('branch_changed', handleBranchChange);
    return () => window.removeEventListener('branch_changed', handleBranchChange);
  }, []);

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    
    let itemsHtml = '';
    if (order.items) {
      order.items.forEach((item: any) => {
        itemsHtml += `<tr><td style="padding: 4px 0; font-size: 14px;">${item.quantity}x ${item.dish?.name || item.name || 'Item'}</td><td style="padding: 4px 0; text-align: right; font-size: 14px;">${(item.price * item.quantity).toFixed(2)}</td></tr>`;
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
        <div class="header"><h2>RESTAURANT</h2><p>Order #${order.orderNumber}</p><p>${new Date(order.createdAt).toLocaleString()}</p><p>${order.orderType}${order.tableName ? ' - ' + order.tableName : ''}</p></div>
        <table><tbody>${itemsHtml}</tbody></table>
        <div class="totals"><div><span>Subtotal</span> <span>${(order.totalAmount - (order.taxApplied || 0)).toFixed(2)}</span></div><div><span>Tax</span> <span>${(order.taxApplied || 0).toFixed(2)}</span></div><div class="grand-total"><span>Total</span> <span>${order.totalAmount.toFixed(2)}</span></div></div>
        <div class="footer"><p>Thank you for visiting!</p><p>Powered by Neurolinx</p></div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // EOD Calculation Logic (For today's transactions only)
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayPurchases = purchases.filter(p => new Date(p.orderDate).toDateString() === new Date().toDateString());

  const totalCashSales = todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCardSales = todayOrders.filter(o => o.paymentMethod === 'Card').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalUPI = todayOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = totalCashSales + totalCardSales + totalUPI;

  const totalCashPayouts = todayPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0); // Assuming all POs are paid in cash from till for MVP

  const expectedCashInTill = totalCashSales - totalCashPayouts;
  const cashVariance = actualCash - expectedCashInTill;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Billing & Accounting</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Manage past invoices and perform End of Day (EOD) till reconciliation.</p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('history')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'history' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Invoice History</button>
        <button onClick={() => setActiveTab('reconciliation')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'reconciliation' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'reconciliation' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.Calculator size={18} /> EOD Reconciliation</button>
      </div>

      {isLoading ? <div>Loading records...</div> : (
        <>
          {activeTab === 'history' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem' }}>Order Number</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Time</th>
                  <th style={{ padding: '1rem' }}>Total Amount</th>
                  <th style={{ padding: '1rem' }}>Payment Method</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>{ord.orderNumber}</td>
                    <td style={{ padding: '1rem' }}>{ord.orderType} {ord.tableName ? `(${ord.tableName})` : ''}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(ord.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{ord.totalAmount?.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 500 }}>
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handlePrint(ord)} style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                        <Icons.Printer size={16} /> Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No completed orders found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'reconciliation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.BarChart size={20} color="#0284c7" /> Today's Cash Flow Summary</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#475569' }}>Total Gross Revenue</span>
                  <span style={{ fontWeight: 600 }}>₹{totalRevenue.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', paddingLeft: '1rem' }}>↳ Cash Sales</span>
                  <span style={{ color: '#64748b' }}>₹{totalCashSales.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', paddingLeft: '1rem' }}>↳ Card Sales</span>
                  <span style={{ color: '#64748b' }}>₹{totalCardSales.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ color: '#64748b', paddingLeft: '1rem' }}>↳ UPI / Digital</span>
                  <span style={{ color: '#64748b' }}>₹{totalUPI.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#ef4444' }}>Total Expenses (Vendor Payouts)</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>- ₹{totalCashPayouts.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Net Profit (Today)</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: (totalRevenue - totalCashPayouts) >= 0 ? '#10b981' : '#ef4444' }}>
                    ₹{(totalRevenue - totalCashPayouts).toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Wallet size={20} color="#10b981" /> Till Reconciliation (Cash Drawer)</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ color: '#475569', fontSize: '1.1rem' }}>Expected Cash in Till</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{expectedCashInTill.toFixed(2)}</span>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Actual Cash Counted in Till</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>₹</span>
                    <input 
                      type="number" 
                      value={actualCash || ''} 
                      onChange={e => setActualCash(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '1rem 1rem 1rem 2.5rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1.25rem', fontWeight: 600 }} 
                    />
                  </div>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '8px', backgroundColor: cashVariance === 0 ? '#f8fafc' : (cashVariance > 0 ? '#d1fae5' : '#fee2e2'), border: `1px solid ${cashVariance === 0 ? '#e2e8f0' : (cashVariance > 0 ? '#a7f3d0' : '#fecaca')}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: cashVariance === 0 ? '#475569' : (cashVariance > 0 ? '#059669' : '#dc2626') }}>
                      Variance (Short / Over)
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '1.5rem', color: cashVariance === 0 ? '#475569' : (cashVariance > 0 ? '#059669' : '#dc2626') }}>
                      {cashVariance > 0 ? '+' : ''}₹{cashVariance.toFixed(2)}
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: cashVariance === 0 ? '#64748b' : (cashVariance > 0 ? '#059669' : '#dc2626') }}>
                    {cashVariance === 0 ? 'Till is perfectly balanced.' : (cashVariance > 0 ? 'Till is over the expected amount.' : 'Till is short. Cash is missing.')}
                  </p>
                </div>

                <button style={{ width: '100%', marginTop: '2rem', padding: '1rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                  Close Register for the Day
                </button>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
