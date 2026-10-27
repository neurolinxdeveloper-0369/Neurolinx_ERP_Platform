import os

# 1. Patch Billing.tsx
path_bill = 'erp-frontend/src/pages/restaurant/Billing.tsx'
with open(path_bill, 'r', encoding='utf-8') as f:
    text = f.read()

rev_target = """  const totalCashSales = todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCardSales = todayOrders.filter(o => o.paymentMethod === 'Card').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalUPI = todayOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = totalCashSales + totalCardSales + totalUPI;"""

rev_repl = """  const totalCashSales = todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCardSales = todayOrders.filter(o => o.paymentMethod === 'Card').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalUPI = todayOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAggregator = todayOrders.filter(o => o.orderType === 'Swiggy' || o.orderType === 'Zomato' || (o.paymentMethod && o.paymentMethod.includes('Prepaid'))).reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = totalCashSales + totalCardSales + totalUPI + totalAggregator;"""

text = text.replace(rev_target, rev_repl)

ui_rev_target = """                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ color: '#64748b', paddingLeft: '1rem' }}>↳ UPI / Digital</span>
                  <span style={{ color: '#64748b' }}>₹{totalUPI.toFixed(2)}</span>
                </div>"""

ui_rev_repl = """                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', paddingLeft: '1rem' }}>↳ UPI / Digital</span>
                  <span style={{ color: '#64748b' }}>₹{totalUPI.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ color: '#ea580c', paddingLeft: '1rem', fontWeight: 500 }}>↳ Online Aggregators (Swiggy / Zomato)</span>
                  <span style={{ color: '#ea580c', fontWeight: 600 }}>₹{totalAggregator.toFixed(2)}</span>
                </div>"""

text = text.replace(ui_rev_target, ui_rev_repl)

# Badge in invoice history table
badge_target = """<td style={{ padding: '1rem' }}>{ord.orderType} {ord.tableName ? `(${ord.tableName})` : ''}</td>"""
badge_repl = """<td style={{ padding: '1rem' }}>
  <span style={{
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: ord.orderType === 'Swiggy' ? '#fff7ed' : (ord.orderType === 'Zomato' ? '#fef2f2' : '#f1f5f9'),
    color: ord.orderType === 'Swiggy' ? '#ea580c' : (ord.orderType === 'Zomato' ? '#dc2626' : '#334155'),
    border: `1px solid ${ord.orderType === 'Swiggy' ? '#fed7aa' : (ord.orderType === 'Zomato' ? '#fecaca' : '#cbd5e1')}`
  }}>
    {ord.orderType}
  </span>
  {ord.tableName ? ` (${ord.tableName})` : ''}
</td>"""

text = text.replace(badge_target, badge_repl)

with open(path_bill, 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Patch ClientProvisioning.tsx
path_prov = 'erp-frontend/src/pages/admin/ClientProvisioning.tsx'
with open(path_prov, 'r', encoding='utf-8') as f:
    prov_text = f.read()

prov_target = """                {(industryType === 'Restaurant' || industryType === 'Hotel' || industryType === 'Hybrid (Hotel & Restaurant)') ? (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Food License (Optional)</label>
                  <input type="text" value={foodLicense} onChange={e => setFoodLicense(e.target.value)} placeholder="FSSAI License" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'} />
                </div>
                ) : (
                <div style={{ flex: 1 }}></div>
                )}
              </div>"""

prov_repl = """                {(industryType === 'Restaurant' || industryType === 'Hotel' || industryType === 'Hybrid (Hotel & Restaurant)') ? (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Food License (Optional)</label>
                  <input type="text" value={foodLicense} onChange={e => setFoodLicense(e.target.value)} placeholder="FSSAI License" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9375rem', transition: 'border-color 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'} />
                </div>
                ) : (
                <div style={{ flex: 1 }}></div>
                )}
              </div>

              {(industryType === 'Restaurant' || industryType === 'Hotel' || industryType === 'Hybrid (Hotel & Restaurant)') && (
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Layers size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', textTransform: 'uppercase' }}>Online Delivery Aggregators (Option 2 Middleware)</span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    Ready for UrbanPiper Hub. Outlets & Swiggy/Zomato IDs can be configured under Branch Management.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff7ed', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>SWIGGY:</span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>Enabled</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>ZOMATO:</span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>Enabled</span>
                    </div>
                  </div>
                </div>
              )}"""

prov_text = prov_text.replace(prov_target, prov_repl)

with open(path_prov, 'w', encoding='utf-8') as f:
    f.write(prov_text)

print("Billing.tsx and ClientProvisioning.tsx patched successfully")
