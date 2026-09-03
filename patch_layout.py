import os
import re

path = 'erp-frontend/src/pages/restaurant/PrinterCanvas.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Destructure logs, clearLogs
text = text.replace('const { connectedDevice, isConnecting, connectBluetoothPrinter, sendEscPos, disconnect } = usePrinter();', 'const { connectedDevice, isConnecting, connectBluetoothPrinter, sendEscPos, disconnect, logs, clearLogs } = usePrinter();')

# Replace the connection panel with the wrapper
old_connection_panel = """      {/* Connection Panel */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>"""
new_connection_panel = """      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Connection Panel */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>"""
text = text.replace(old_connection_panel, new_connection_panel)

# Find the end of the connection panel and add the logs panel
old_connection_panel_end = """          </button>
        </div>
      </div>"""
new_connection_panel_end = """          </button>
        </div>
      </div>
      
      </div>
      
      {/* Logs Panel */}
      <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
            <Icons.Terminal size={18} /> Diagnostic Logs
          </h2>
          <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Clear</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs && logs.length === 0 && <span style={{ color: '#475569' }}>Awaiting connection...</span>}
          {logs && logs.map((log, idx) => (
            <div key={idx} style={{ color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#22c55e' : '#cbd5e1', lineHeight: '1.4' }}>{log}</div>
          ))}
        </div>
      </div>
      
    </div>"""

# Only replace the first occurrence after connection panel starts
idx = text.find(old_connection_panel_end)
text = text[:idx] + new_connection_panel_end + text[idx+len(old_connection_panel_end):]

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Logs Panel Added!')
