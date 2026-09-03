import os
import re

path = 'erp-frontend/src/pages/restaurant/PrinterCanvas.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add logs, clearLogs to usePrinter destructuring
text = text.replace('const { connectedDevice, isConnecting, connectBluetoothPrinter, sendEscPos, disconnect } = usePrinter();', 'const { connectedDevice, isConnecting, connectBluetoothPrinter, sendEscPos, disconnect, logs, clearLogs } = usePrinter();')

# Wrap the connection panel and add the logs panel
panel_start = "{/* Connection Panel */}"
panel_end = """        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          <button 
            onClick={testKotPrint}
            disabled={!connectedDevice}
            style={{ flex: 1, padding: '1rem', backgroundColor: !connectedDevice ? '#f8fafc' : '#f0fdf4', color: !connectedDevice ? '#94a3b8' : '#166534', border: !connectedDevice ? '1px dashed #cbd5e1' : '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 600, cursor: !connectedDevice ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Icons.ChefHat size={20} /> Test KOT Bill (No Prices)
          </button>
          <button 
            onClick={testCustomerBill}
            disabled={!connectedDevice}
            style={{ flex: 1, padding: '1rem', backgroundColor: !connectedDevice ? '#f8fafc' : '#eff6ff', color: !connectedDevice ? '#94a3b8' : '#1d4ed8', border: !connectedDevice ? '1px dashed #cbd5e1' : '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: !connectedDevice ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Icons.Receipt size={20} /> Test Customer Bill (With Prices)
          </button>
        </div>
      </div>"""

logs_panel = """
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Connection Panel */}
"""

logs_panel_end = """        </div>
        </div>
        
        {/* Logs Panel */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
              <Icons.Terminal size={18} /> Diagnostic Logs
            </h2>
            <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Clear</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {logs.length === 0 && <span style={{ color: '#475569' }}>Awaiting connection...</span>}
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#22c55e' : '#cbd5e1', lineHeight: '1.4' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
"""

text = text.replace(panel_start, logs_panel)
text = text.replace(panel_end, panel_end + logs_panel_end)

# Also remove marginBottom: '2rem' from connection panel to avoid double margin inside flex column
text = text.replace("marginBottom: '2rem' }}>\n        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>", "}}>\n        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('PrinterCanvas logs panel added')
