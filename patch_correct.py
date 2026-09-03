import os

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. State changes
text = text.replace(
    "const [orderType, setOrderType] = useState<'Table' | 'Reservation'>('Table');\n  const [selectedTable, setSelectedTable] = useState<string>('');",
    "const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');\n  const [selectedTable, setSelectedTable] = useState<string>('');\n  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');"
)

# 2. Header and View Mode tabs
header_old = """          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Point of Sale</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search dishes..." 
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '250px' }}
              />
            </div>
          </div>"""

header_new = """          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
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
          </div>"""

text = text.replace(header_old, header_new)

# 3. Categories wrap
cat_start = "{/* Categories */}"
text = text.replace(cat_start, "{viewMode === 'POS' && (\n            <>\n          {/* Categories */}")

# Dishes Grid end is right before "{/* Right Order Sidebar */}"
# We will find the closing div of Dishes Grid and add `</>\n          )}\n\n          {viewMode === 'Tables' ...`
import re
text = re.sub(
    r"(\s*)<\/div>\s*\{\/\* Right Order Sidebar \*\/\}",
    r"\1</div>\n            </>\n          )}\n"
    r"          {viewMode === 'Tables' && (\n"
    r"            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', alignContent: 'start', paddingRight: '0.5rem' }}>\n"
    r"              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (\n"
    r"                <div key={num} onClick={() => { setViewMode('POS'); setOrderType('Dine-In'); setSelectedTable(`Table ${num}`); }} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>\n"
    r"                  <Icons.Armchair size={32} color={num % 3 === 0 ? '#ef4444' : '#10b981'} style={{ marginBottom: '0.5rem' }} />\n"
    r"                  <span style={{ fontWeight: 700, color: '#1e293b' }}>Table {num}</span>\n"
    r"                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{num % 3 === 0 ? 'Occupied' : 'Available'}</span>\n"
    r"                </div>\n"
    r"              ))}\n"
    r"            </div>\n"
    r"          )}\n"
    r"          {viewMode === 'Reservations' && (\n"
    r"            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>\n"
    r"              <Icons.CalendarDays size={48} color=\"#cbd5e1\" style={{ marginBottom: '1rem' }} />\n"
    r"              <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No Reservations Today</h2>\n"
    r"              <p style={{ color: '#64748b', margin: 0 }}>Upcoming reservations will appear here.</p>\n"
    r"              <button style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>\n"
    r"                + New Reservation\n"
    r"              </button>\n"
    r"            </div>\n"
    r"          )}\n"
    r"\1</div>\n\n        {/* Right Order Sidebar */}",
    text
)

# 4. Right side panel toggle
right_old = """        {/* Order Type Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setOrderType('Table')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Table' ? 'white' : 'transparent', color: orderType === 'Table' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Icons.Monitor size={18} /> Table
          </button>
          <button 
            onClick={() => setOrderType('Reservation')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Reservation' ? 'white' : 'transparent', color: orderType === 'Reservation' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Reservation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Icons.Calendar size={18} /> Reservation
          </button>
        </div>

        {/* Table Selection Dropdown */}
        {orderType === 'Table' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Select Table</label>
            <select 
              value={selectedTable} 
              onChange={e => setSelectedTable(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#1e293b' }}
            >
              <option value="">-- Choose Table --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={`Table ${num}`}>Table {num}</option>
              ))}
            </select>
          </div>
        )}

        {/* Reservation Inputs */}
        {orderType === 'Reservation' && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Customer Name</label>
              <input type="text" placeholder="e.g. John Doe" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#1e293b', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Time</label>
              <input type="time" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '1rem', color: '#1e293b', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}"""

right_new = """        {/* Order Type Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setOrderType('Dine-In')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Dine-In' ? 'white' : 'transparent', color: orderType === 'Dine-In' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Dine-In' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Dine-In
          </button>
          <button 
            onClick={() => setOrderType('Takeaway')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Takeaway
          </button>
        </div>
        
        {orderType === 'Dine-In' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Selected Table:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0ea5e9' }}>{selectedTable || 'None'}</span>
          </div>
        )}"""

text = text.replace(right_old, right_new)

# 5. Fix payload printer check
payload_old = "payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType} ${orderType === 'Table' && selectedTable ? '('+selectedTable+')' : ''}\\n`)]);"
payload_new = "payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType} ${orderType === 'Dine-In' && selectedTable ? '('+selectedTable+')' : ''}\\n`)]);"
text = text.replace(payload_old, payload_new)

payload_old2 = "if (orderType === 'Table') {"
payload_new2 = "if (orderType === 'Dine-In') {"
text = text.replace(payload_old2, payload_new2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched correctly')
