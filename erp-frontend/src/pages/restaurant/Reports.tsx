import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Reports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState('sales_summary');
  const [dateRange, setDateRange] = useState('this_month');
  
  const fetchOrders = () => {
    setIsLoading(true);
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders/all')
      .then(res => res.json())
      .then(data => {
        setOrders(data.filter((o: any) => o.status === 'Completed'));
        setIsLoading(false);
      })
      .catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => {
    fetchOrders();
    const handleBranchChange = () => fetchOrders();
    window.addEventListener('branch_changed', handleBranchChange);
    return () => window.removeEventListener('branch_changed', handleBranchChange);
  }, []);

  // Filter orders by date range
  const filteredOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    const now = new Date();
    
    if (dateRange === 'today') {
      return d.toDateString() === now.toDateString();
    } else if (dateRange === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      return d >= firstDay;
    } else if (dateRange === 'this_month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true; // all_time
  });

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'sales_summary') {
      csvContent += "Order No,Date,Type,Payment,Subtotal,Tax,Total\n";
      filteredOrders.forEach(o => {
        const subtotal = o.totalAmount - (o.taxApplied || 0);
        csvContent += `${o.orderNumber},${new Date(o.createdAt).toLocaleString()},${o.orderType},${o.paymentMethod},${subtotal.toFixed(2)},${(o.taxApplied || 0).toFixed(2)},${o.totalAmount.toFixed(2)}\n`;
      });
    } else if (reportType === 'item_sales') {
      csvContent += "Item Name,Quantity Sold,Revenue Generated\n";
      const itemMap: Record<string, {qty: number, rev: number}> = {};
      filteredOrders.forEach(o => {
        o.items?.forEach((item: any) => {
          const name = item.dish?.name || item.name || 'Unknown';
          if (!itemMap[name]) itemMap[name] = { qty: 0, rev: 0 };
          itemMap[name].qty += item.quantity;
          itemMap[name].rev += (item.quantity * item.price);
        });
      });
      Object.entries(itemMap).forEach(([name, stats]) => {
        csvContent += `"${name}",${stats.qty},${stats.rev.toFixed(2)}\n`;
      });
    } else if (reportType === 'tax_report') {
      csvContent += "Order No,Total Sales,Tax Collected\n";
      filteredOrders.forEach(o => {
        csvContent += `${o.orderNumber},${o.totalAmount.toFixed(2)},${(o.taxApplied || 0).toFixed(2)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `restaurant_report_${reportType}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Advanced Reporting Engine</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Generate, filter, and export detailed business reports.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Select Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <option value="sales_summary">Sales Summary (Invoice Level)</option>
              <option value="item_sales">Item-wise Sales (Product Level)</option>
              <option value="tax_report">Tax & GST Summary</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Date Range</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all_time">All Time Historical</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={exportToCSV} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Icons.Download size={18} /> Export as CSV
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <div>Compiling Report Data...</div> : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.FileText size={20} color="#0284c7" /> Report Preview ({filteredOrders.length} records found)
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              
              {reportType === 'sales_summary' && (
                <>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Order No</th>
                      <th style={{ padding: '1rem' }}>Date & Time</th>
                      <th style={{ padding: '1rem' }}>Type</th>
                      <th style={{ padding: '1rem' }}>Payment</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Tax</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 50).map((o, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{o.orderNumber}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(o.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '1rem' }}>{o.orderType}</td>
                        <td style={{ padding: '1rem' }}>{o.paymentMethod}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>₹{(o.taxApplied || 0).toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>₹{o.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {reportType === 'item_sales' && (
                <>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Item Name</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity Sold</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const itemMap: Record<string, {qty: number, rev: number}> = {};
                      filteredOrders.forEach(o => {
                        o.items?.forEach((item: any) => {
                          const name = item.dish?.name || item.name || 'Unknown';
                          if (!itemMap[name]) itemMap[name] = { qty: 0, rev: 0 };
                          itemMap[name].qty += item.quantity;
                          itemMap[name].rev += (item.quantity * item.price);
                        });
                      });
                      return Object.entries(itemMap).sort((a,b) => b[1].rev - a[1].rev).slice(0, 50).map(([name, stats], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{name}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>{stats.qty}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>₹{stats.rev.toFixed(2)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </>
              )}

              {reportType === 'tax_report' && (
                <>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Order No</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total Sales (Incl. Tax)</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Tax Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 50).map((o, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{o.orderNumber}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>₹{o.totalAmount.toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>₹{(o.taxApplied || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

            </table>
            {filteredOrders.length > 50 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc' }}>
                Preview limited to top 50 records. Export as CSV to view all {filteredOrders.length} records.
              </div>
            )}
            {filteredOrders.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No records found for the selected date range.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
