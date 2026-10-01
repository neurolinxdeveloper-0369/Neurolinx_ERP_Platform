import os

path = 'erp-frontend/src/pages/restaurant/Settings.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const [address, setAddress] = useState('');", "const [address, setAddress] = useState('');\n  const [currencySymbol, setCurrencySymbol] = useState('₹');\n  const [openingTime, setOpeningTime] = useState('09:00');\n  const [closingTime, setClosingTime] = useState('22:00');")
text = text.replace("if (data.receiptFooter) setReceiptFooter(data.receiptFooter);", "if (data.receiptFooter) setReceiptFooter(data.receiptFooter);\n        if (data.currencySymbol) setCurrencySymbol(data.currencySymbol);\n        if (data.openingTime) setOpeningTime(data.openingTime);\n        if (data.closingTime) setClosingTime(data.closingTime);")
text = text.replace("defaultTaxRate: taxRate, defaultDiscount: discountPercent, upiQrImageBase64", "defaultTaxRate: taxRate, defaultDiscount: discountPercent, upiQrImageBase64, currencySymbol, openingTime, closingTime")

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

text = text.replace('<div style={{ display: \'flex\', gap: \'1.5rem\', marginBottom: \'1.5rem\' }}>\n              <div style={{ flex: 1 }}>\n                <label style={{ display: \'block\', fontSize: \'0.875rem\', fontWeight: 500, color: \'#475569\', marginBottom: \'0.5rem\' }}>Store Name</label>', ui_fields + '\n            <div style={{ display: \'flex\', gap: \'1.5rem\', marginBottom: \'1.5rem\' }}>\n              <div style={{ flex: 1 }}>\n                <label style={{ display: \'block\', fontSize: \'0.875rem\', fontWeight: 500, color: \'#475569\', marginBottom: \'0.5rem\' }}>Store Name</label>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Settings.tsx")
