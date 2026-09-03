import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Let's wrap the categories and dishes grid with {viewMode === 'POS' && ( ... )}

text = re.sub(
    r"(\{\/\* Categories \*\/.*?)\s*\{\/\* Right Order Sidebar \*\/\}",
    r"{viewMode === 'POS' && (<>\n\1\n</>)}\n\n"
    r"{viewMode === 'Tables' && (\n"
    r"  <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', alignContent: 'start', paddingRight: '0.5rem' }}>\n"
    r"    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (\n"
    r"      <div key={num} onClick={() => { setViewMode('POS'); setOrderType('Dine-In'); setSelectedTable(`Table ${num}`); }} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>\n"
    r"        <Icons.Armchair size={32} color={num % 3 === 0 ? '#ef4444' : '#10b981'} style={{ marginBottom: '0.5rem' }} />\n"
    r"        <span style={{ fontWeight: 700, color: '#1e293b' }}>Table {num}</span>\n"
    r"        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{num % 3 === 0 ? 'Occupied' : 'Available'}</span>\n"
    r"      </div>\n"
    r"    ))}\n"
    r"  </div>\n"
    r")}\n\n"
    r"{viewMode === 'Reservations' && (\n"
    r"  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>\n"
    r"    <Icons.CalendarDays size={48} color=\"#cbd5e1\" style={{ marginBottom: '1rem' }} />\n"
    r"    <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No Reservations Today</h2>\n"
    r"    <p style={{ color: '#64748b', margin: 0 }}>Upcoming reservations will appear here.</p>\n"
    r"    <button style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>\n"
    r"      + New Reservation\n"
    r"    </button>\n"
    r"  </div>\n"
    r")}\n\n"
    r"        </div>\n\n        {/* Right Order Sidebar */}",
    text,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched main area conditionally')
