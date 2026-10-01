import os

path = 'erp-frontend/src/pages/admin/ClientProvisioning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """              </div>
                </div>

              {editingId ? ("""

target2 = """              </div>
                </div>

              {editingId ? (""" # Wait, the exact formatting is:
#                  </div>
#                </div>
#
#                {editingId ? (

ui_inject = """                  </div>
                </div>

              {!editingId && (
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>Franchises / Branches (Optional)</label>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>Pre-configure locations for this client.</p>
                  
                  {branches.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {branches.map((b, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <div><strong style={{ fontSize: '0.875rem' }}>{b.name}</strong> <span style={{ fontSize: '0.875rem', color: '#64748b' }}>- {b.location}</span></div>
                          <button type="button" onClick={() => setBranches(branches.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input type="text" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="Branch Name (e.g. MG Road)" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    <input type="text" value={newBranchLocation} onChange={e => setNewBranchLocation(e.target.value)} placeholder="Location" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    <button type="button" onClick={() => { if(newBranchName && newBranchLocation) { setBranches([...branches, {name: newBranchName, location: newBranchLocation}]); setNewBranchName(''); setNewBranchLocation(''); } }} style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Add</button>
                  </div>
                </div>
              )}

              {editingId ? ("""

import re
text = re.sub(r'(\s+)</div>\s+</div>\s+\{editingId \? \(', r'\n' + ui_inject, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched UI correctly")
