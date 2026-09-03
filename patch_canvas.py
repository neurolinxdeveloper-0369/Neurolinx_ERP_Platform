import os
import re

path = 'erp-frontend/src/pages/restaurant/PrinterCanvas.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add handlePairAndAdd function
insert_idx = text.find('const removePrinter')
new_func = """  const handlePairAndAdd = async () => {
    try {
      const device = await connectBluetoothPrinter();
      if (device) {
        setNewPrinterName(device.name || 'Bluetooth Printer');
        setShowAddForm(true);
      }
    } catch (err: any) {
      alert(`Bluetooth Pairing Failed: ${err.message}`);
    }
  };

"""
text = text[:insert_idx] + new_func + text[insert_idx:]

# Replace onClick={connectBluetoothPrinter} with onClick={handlePairAndAdd}
text = text.replace('onClick={connectBluetoothPrinter}', 'onClick={handlePairAndAdd}')

# Now for the 'match the UI and frontend with this printer' part:
status_old = """                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    <Icons.Bluetooth size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> {p.connectionType}
                  </td>"""
status_new = """                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
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
text = text.replace(status_old, status_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('PrinterCanvas patched!')
