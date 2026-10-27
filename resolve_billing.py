import os

path = 'erp-frontend/src/pages/restaurant/Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

conflict_target = """                    <td style={{ padding: '1rem' }}>
<<<<<<< HEAD
                      <div style={{ fontWeight: 500 }}>{ord.orderType} {ord.tableName ? `(${ord.tableName})` : ''}</div>
                      {ord.orderType === 'Delivery' && ord.customerName && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {ord.customerName} {ord.customerPhone ? `• ${ord.customerPhone}` : ''}
                          {ord.deliveryArea ? ` (${ord.deliveryArea})` : ''}
                        </div>
                      )}
                    </td>
=======
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
</td>
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)"""

conflict_repl = """                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: ord.orderType === 'Swiggy' ? '#fff7ed' : (ord.orderType === 'Zomato' ? '#fef2f2' : (ord.orderType === 'Delivery' ? '#eff6ff' : '#f1f5f9')),
                          color: ord.orderType === 'Swiggy' ? '#ea580c' : (ord.orderType === 'Zomato' ? '#dc2626' : (ord.orderType === 'Delivery' ? '#2563eb' : '#334155')),
                          border: `1px solid ${ord.orderType === 'Swiggy' ? '#fed7aa' : (ord.orderType === 'Zomato' ? '#fecaca' : (ord.orderType === 'Delivery' ? '#bfdbfe' : '#cbd5e1'))}`
                        }}>
                          {ord.orderType}
                        </span>
                        {ord.tableName && <span style={{ fontWeight: 500 }}>({ord.tableName})</span>}
                      </div>
                      {ord.customerName && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          {ord.customerName} {ord.customerPhone ? `• ${ord.customerPhone}` : ''}
                          {ord.deliveryArea ? ` (${ord.deliveryArea})` : ''}
                        </div>
                      )}
                    </td>"""

text = text.replace(conflict_target, conflict_repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Billing.tsx resolved cleanly")
