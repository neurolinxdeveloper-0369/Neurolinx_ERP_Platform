import os

path = 'erp-frontend/src/components/MasterLayout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add states for branches
state_injection = """  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>(localStorage.getItem('activeBranchId') || 'global');
  const [showBranchMenu, setShowBranchMenu] = useState(false);"""

text = text.replace("  const [expanded, setExpanded] = useState<Record<number, boolean>>({});", state_injection)

# Add fetch branches effect
fetch_effect = """
    if (username !== 'admin' && username !== 'neurolinxdeveloper@gmail.com') {
      apiFetch('https://erp-api.neurolinx.in/api/branches')
        .then(res => res.json())
        .then(data => setBranches(data))
        .catch(err => console.error(err));
    }
  }, [navigate, username]);
"""
text = text.replace("  }, [navigate, username]);", fetch_effect)

# Add the UI for Branch Switcher
ui_injection = """
              {/* Branch Switcher Dropdown */}
              {branches.length > 0 && (
                <div 
                  style={{ position: 'relative', marginRight: '1rem' }}
                  onMouseEnter={() => setShowBranchMenu(true)}
                  onMouseLeave={() => setShowBranchMenu(false)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <Icons.Store size={16} color="#64748b" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                      {activeBranchId === 'global' ? 'Global (All Branches)' : branches.find(b => b.id.toString() === activeBranchId)?.name || 'Unknown Branch'}
                    </span>
                    <Icons.ChevronDown size={14} color="#94a3b8" />
                  </div>

                  {showBranchMenu && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '0.5rem', width: '220px', zIndex: 50 }}>
                      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', padding: '0.5rem' }}>
                        <button 
                          onClick={() => { localStorage.setItem('activeBranchId', 'global'); setActiveBranchId('global'); window.dispatchEvent(new Event('branch_changed')); }}
                          style={{ width: '100%', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeBranchId === 'global' ? '#eff6ff' : 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', color: activeBranchId === 'global' ? '#2563eb' : '#334155', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                        >
                          Global (All Branches)
                        </button>
                        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }}></div>
                        {branches.map(b => (
                          <button 
                            key={b.id}
                            onClick={() => { localStorage.setItem('activeBranchId', b.id.toString()); setActiveBranchId(b.id.toString()); window.dispatchEvent(new Event('branch_changed')); }}
                            style={{ width: '100%', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeBranchId === b.id.toString() ? '#eff6ff' : 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', color: activeBranchId === b.id.toString() ? '#2563eb' : '#334155', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* User Profile Dropdown */}
"""
text = text.replace("{/* User Profile Dropdown */}", ui_injection)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched MasterLayout with Branch Switcher")
