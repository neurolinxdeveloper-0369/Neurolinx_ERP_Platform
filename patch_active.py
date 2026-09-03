import os

path = 'erp-frontend/src/pages/restaurant/PrinterCanvas.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Enable input, and change the Active status logic to just check if connectedDevice exists and connectionType is BLUETOOTH
old_input = '<input required type="text" value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} disabled={!!connectedDevice} placeholder="e.g. Kitchen Printer 1" style={{ width: \'100%\', padding: \'0.75rem\', borderRadius: \'8px\', border: \'1px solid #cbd5e1\', outline: \'none\', backgroundColor: connectedDevice ? \'#f1f5f9\' : \'white\' }} />'
new_input = '<input required type="text" value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} placeholder="e.g. Kitchen Printer 1" style={{ width: \'100%\', padding: \'0.75rem\', borderRadius: \'8px\', border: \'1px solid #cbd5e1\', outline: \'none\' }} />'

text = text.replace(old_input, new_input)

status_old = """                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {connectedDevice && (connectedDevice.name === p.name) ? (
                      <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icons.Bluetooth size={14} /> Active (Paired)
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icons.Bluetooth size={14} /> Offline / Not Paired
                      </span>
                    )}
                  </td>"""

status_new = """                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {connectedDevice && p.connectionType === 'BLUETOOTH' ? (
                      <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icons.Bluetooth size={14} /> Active (Paired)
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icons.Bluetooth size={14} /> Offline / Not Paired
                      </span>
                    )}
                  </td>"""

text = text.replace(status_old, status_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed logic for naming and active status')
