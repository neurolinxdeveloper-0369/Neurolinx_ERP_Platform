import os

path = 'erp-frontend/src/pages/restaurant/PrinterCanvas.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_input = '<input required type="text" value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} placeholder="e.g. Kitchen Printer 1" style={{ width: \'100%\', padding: \'0.75rem\', borderRadius: \'8px\', border: \'1px solid #cbd5e1\', outline: \'none\' }} />'
new_input = '<input required type="text" value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} disabled={!!connectedDevice} placeholder="e.g. Kitchen Printer 1" style={{ width: \'100%\', padding: \'0.75rem\', borderRadius: \'8px\', border: \'1px solid #cbd5e1\', outline: \'none\', backgroundColor: connectedDevice ? \'#f1f5f9\' : \'white\' }} />'

text = text.replace(old_input, new_input)
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Disabled name input if paired')
