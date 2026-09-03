import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Header
text = re.sub(
    r"<h1 style=\{\{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 \}\}>Point of Sale<\/h1>.*?<\/div>\s*<\/div>",
    """<div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem' }}>
                <button onClick={() => setViewMode('POS')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'POS' ? 'white' : 'transparent', color: viewMode === 'POS' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'POS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Monitor size={16} /> Point of Sale
                </button>
                <button onClick={() => setViewMode('Tables')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Tables' ? 'white' : 'transparent', color: viewMode === 'Tables' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Tables' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.LayoutGrid size={16} /> Tables
                </button>
                <button onClick={() => setViewMode('Reservations')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Reservations' ? 'white' : 'transparent', color: viewMode === 'Reservations' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Reservations' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Calendar size={16} /> Reservations
                </button>
              </div>
            </div>
            
            {viewMode === 'POS' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..." 
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '250px' }}
                />
              </div>
            )}
          </div>""",
    text,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Regex patched header')
