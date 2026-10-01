import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'Dine-In' | 'Takeaway'", "'Dine-In' | 'Takeaway' | 'Delivery'")

btn_takeaway = """            <button 
              onClick={() => { setOrderType('Takeaway'); setSelectedTableId(null); setSelectedTableName(''); }}
              style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Takeaway
            </button>"""

btn_delivery = """            <button 
              onClick={() => { setOrderType('Takeaway'); setSelectedTableId(null); setSelectedTableName(''); }}
              style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Takeaway
            </button>
            <button 
              onClick={() => { setOrderType('Delivery'); setSelectedTableId(null); setSelectedTableName(''); }}
              style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Delivery' ? 'white' : 'transparent', color: orderType === 'Delivery' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Delivery' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Delivery
            </button>"""

text = text.replace(btn_takeaway, btn_delivery)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Orders.tsx with Delivery")
