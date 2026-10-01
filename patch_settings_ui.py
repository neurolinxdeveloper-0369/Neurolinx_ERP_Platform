import os
import re

path = 'erp-frontend/src/pages/restaurant/Settings.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

ui_fields = """
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Currency Symbol</label>
                <input type="text" value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Opening Time</label>
                <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Closing Time</label>
                <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            """

text = re.sub(r"(<div style=\{\{ display: 'flex', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>\s*<div style=\{\{ flex: 1 \}\}>\s*<label.*?Store Name</label>)", ui_fields + r"\1", text, count=1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
