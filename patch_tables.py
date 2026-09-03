import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add state for activeTableTab
state_old = "const [selectedTable, setSelectedTable] = useState<string>('');\n  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');"
state_new = "const [selectedTable, setSelectedTable] = useState<string>('');\n  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');\n  const [activeTableTab, setActiveTableTab] = useState<string | null>(null);\n  const [activeFloor, setActiveFloor] = useState<string>('1st Floor');"
text = text.replace(state_old, state_new)

# 2. Table Data definition
table_data = """  const tableLayout = [
    { id: 'A1', type: 'square', seats: 4, status: 'available', x: 0, y: 0 },
    { id: 'A2', type: 'square', seats: 4, status: 'reserved', time: '17:00 PM', x: 1, y: 0 },
    { id: 'A3', type: 'rect-h', seats: 6, status: 'cant-select', x: 2, y: 0 },
    { id: 'A6', type: 'rect-h', seats: 4, status: 'in-progress', text: 'In Progress', orderId: 'DI104', x: 3, y: 0 },
    { id: 'A7', type: 'rect-v', seats: 6, status: 'reserved', time: '17:00 PM', x: 4, y: 0, rowSpan: 2 },
    
    { id: 'A4', type: 'square', seats: 4, status: 'available', x: 0, y: 1 },
    { id: 'A5', type: 'square', seats: 4, status: 'available', x: 1, y: 1 },
    { id: 'A8', type: 'square-lg', seats: 4, status: 'available', x: 2, y: 1 },
    { id: 'A9', type: 'square', seats: 4, status: 'available', x: 3, y: 1 },
    
    { id: 'A10', type: 'square', seats: 4, status: 'available', x: 0, y: 2 },
    { id: 'A11', type: 'rect-h-lg', seats: 4, status: 'in-progress', text: 'In Progress', orderId: 'DI105', x: 1, y: 2 },
    { id: 'A12', type: 'square', seats: 4, status: 'available', x: 2, y: 2 },
    { id: 'A13', type: 'rect-h-lg', seats: 6, status: 'in-progress', orderId: 'DI106', x: 3, y: 2 },
    { id: 'A14', type: 'rect-v-lg', seats: 6, status: 'cant-select', x: 4, y: 2 }
  ];

  const getTableColor = (status: string, isSelected: boolean) => {
    if (isSelected) return { bg: '#e2e8f0', border: '#3b82f6', text: '#1e293b' }; // Selected (A8)
    switch(status) {
      case 'available': return { bg: 'white', border: '#e2e8f0', text: '#1e293b' };
      case 'in-progress': return { bg: '#f59e0b', border: '#f59e0b', text: 'white' };
      case 'reserved': return { bg: '#0f172a', border: '#0f172a', text: 'white' };
      case 'cant-select': return { bg: '#e2e8f0', border: '#e2e8f0', text: '#64748b' };
      default: return { bg: 'white', border: '#e2e8f0', text: '#1e293b' };
    }
  };

  const renderChairs = (type: string, status: string) => {
    const chairColor = status === 'in-progress' ? '#f59e0b' : status === 'reserved' ? '#0f172a' : status === 'cant-select' ? '#cbd5e1' : '#f1f5f9';
    const chairStyle = { position: 'absolute' as 'absolute', backgroundColor: chairColor, borderRadius: '4px' };
    
    if (type === 'square' || type === 'square-lg') {
      return (
        <>
          <div style={{ ...chairStyle, top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
          <div style={{ ...chairStyle, right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
        </>
      );
    }
    if (type.includes('rect-h')) {
      return (
        <>
          <div style={{ ...chairStyle, top: '-8px', left: '20%', width: '24px', height: '6px' }} />
          {type === 'rect-h-lg' ? <div style={{ ...chairStyle, top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} /> : null}
          <div style={{ ...chairStyle, top: '-8px', right: '20%', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, bottom: '-8px', left: '20%', width: '24px', height: '6px' }} />
          {type === 'rect-h-lg' ? <div style={{ ...chairStyle, bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} /> : null}
          <div style={{ ...chairStyle, bottom: '-8px', right: '20%', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
          <div style={{ ...chairStyle, right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
        </>
      );
    }
    if (type.includes('rect-v')) {
      return (
        <>
          <div style={{ ...chairStyle, top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, left: '-8px', top: '20%', width: '6px', height: '24px' }} />
          {type === 'rect-v-lg' ? <div style={{ ...chairStyle, left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} /> : null}
          <div style={{ ...chairStyle, left: '-8px', bottom: '20%', width: '6px', height: '24px' }} />
          <div style={{ ...chairStyle, right: '-8px', top: '20%', width: '6px', height: '24px' }} />
          {type === 'rect-v-lg' ? <div style={{ ...chairStyle, right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} /> : null}
          <div style={{ ...chairStyle, right: '-8px', bottom: '20%', width: '6px', height: '24px' }} />
        </>
      );
    }
    return null;
  };
"""

# Insert table_data right before the `useEffect`
text = text.replace("useEffect(() => {", table_data + "\n  useEffect(() => {")

# 3. Replace viewMode === 'Tables' content
old_tables = """        {viewMode === 'Tables' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', alignContent: 'start', paddingRight: '0.5rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
              <div key={num} onClick={() => { setViewMode('POS'); setOrderType('Dine-In'); setSelectedTable(`Table ${num}`); }} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Icons.Armchair size={32} color={num % 3 === 0 ? '#ef4444' : '#10b981'} style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontWeight: 700, color: '#1e293b' }}>Table {num}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{num % 3 === 0 ? 'Occupied' : 'Available'}</span>
              </div>
            ))}
          </div>
        )}"""

new_tables = """        {viewMode === 'Tables' && (
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Top Legend Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', gap: '1rem', alignItems: 'center', backgroundColor: 'transparent', zIndex: 10 }}>
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', gap: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: 'white' }} /> Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Not Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f172a' }} /> Reserved</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} /> Can't Select</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '0.25rem', borderRadius: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {['1st Floor', '2nd Floor', '3rd Floor'].map(floor => (
                  <button key={floor} onClick={() => setActiveFloor(floor)} style={{ padding: '0.375rem 1rem', border: 'none', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', backgroundColor: activeFloor === floor ? '#f1f5f9' : 'transparent', color: activeFloor === floor ? '#1e293b' : '#94a3b8' }}>
                    {floor}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Grid Area */}
            <div style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 140px)', gap: '2.5rem', paddingBottom: '5rem' }}>
                {tableLayout.map(t => {
                  const isSelected = activeTableTab === t.id;
                  const colors = getTableColor(t.status, isSelected);
                  
                  return (
                    <div key={t.id} style={{ 
                      gridColumn: t.x + 1, 
                      gridRow: `${t.y + 1} / span ${t.rowSpan || 1}`,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Chairs */}
                      {renderChairs(t.type, t.status)}
                      
                      {/* Table Body */}
                      <div 
                        onClick={() => t.status !== 'cant-select' && setActiveTableTab(t.id)}
                        style={{ 
                          width: t.type.includes('rect-h') ? '100%' : '80px', 
                          height: t.type.includes('rect-v') ? '100%' : '80px', 
                          backgroundColor: colors.bg,
                          border: `2px solid ${colors.border}`,
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: t.status === 'cant-select' ? 'not-allowed' : 'pointer',
                          boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                          transition: 'all 0.2s',
                          zIndex: 2
                        }}>
                        
                        <span style={{ fontWeight: 700, color: colors.text }}>{t.id}</span>
                        
                        {/* Tags / Info */}
                        {t.time && (
                          <div style={{ position: 'absolute', bottom: '8px', backgroundColor: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.Clock size={10} /> {t.time}
                          </div>
                        )}
                        {t.text && (
                          <div style={{ position: 'absolute', bottom: '8px', backgroundColor: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.Coffee size={10} /> {t.text}
                          </div>
                        )}
                        {t.orderId && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.65rem', fontWeight: 700, color: 'white' }}>
                            {t.orderId}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Floating Action Bar */}
            {activeTableTab && (
              <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', borderRadius: '32px', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', zIndex: 50 }}>
                <span style={{ color: 'white', fontSize: '0.875rem', paddingLeft: '1rem' }}>Table Selected:</span>
                <div style={{ backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Table {activeTableTab}
                  <Icons.X size={16} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setActiveTableTab(null)} />
                </div>
                <button style={{ backgroundColor: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  <Icons.CalendarDays size={16} /> Info Reservation
                </button>
                <button 
                  onClick={() => { setOrderType('Dine-In'); setSelectedTable(`Table ${activeTableTab}`); setViewMode('POS'); setActiveTableTab(null); }}
                  style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginRight: '0.25rem' }}>
                  Continue <Icons.ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}"""

text = text.replace(old_tables, new_tables)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Table UI patched successfully!")
