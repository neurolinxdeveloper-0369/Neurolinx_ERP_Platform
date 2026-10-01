import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix table workflow in placeOrder
old_workflow = """      if (orderType === 'Dine-In' && currentTableId) {
        handleTableStatusChange(currentTableId, 'Occupied');
      }"""
new_workflow = """      if (orderType === 'Dine-In' && currentTableId) {
        handleTableStatusChange(currentTableId, status === 'Parked' ? 'Occupied' : 'Free');
      }"""
text = text.replace(old_workflow, new_workflow)

# Fix missing delivery button
text = re.sub(
    r"<button\s+onClick=\{\(\) => \{ setOrderType\('Takeaway'\);.*?Takeaway\s+</button>",
    """<button onClick={() => { setOrderType('Takeaway'); setSelectedTableId(null); setSelectedTableName(''); }} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Takeaway</button>
            <button onClick={() => { setOrderType('Delivery'); setSelectedTableId(null); setSelectedTableName(''); }} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Delivery' ? 'white' : 'transparent', color: orderType === 'Delivery' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Delivery' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Delivery</button>""",
    text,
    flags=re.DOTALL | re.IGNORECASE
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
