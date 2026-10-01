import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const taxRate = settings?.defaultTaxRate || 5.0;", "const discountRate = settings?.defaultDiscount || 0.0;\n    const discountAmount = subtotal * (discountRate / 100);\n    const subtotalAfterDiscount = subtotal - discountAmount;\n    const taxRate = settings?.defaultTaxRate || 5.0;")
text = text.replace("const tax = subtotal * (taxRate / 100);", "const tax = subtotalAfterDiscount * (taxRate / 100);")
text = text.replace("const total = subtotal + tax;", "const total = subtotalAfterDiscount + tax;")

text = text.replace("const taxRate = settings?.defaultTaxRate || 5.0;", "const discountRate = settings?.defaultDiscount || 0.0;\n      const discountAmount = total * (discountRate / 100);\n      const subtotalAfterDiscount = total - discountAmount;\n      const taxRate = settings?.defaultTaxRate || 5.0;", 1) # First occurrence inside placeOrder
text = text.replace("const tax = total * (taxRate / 100);", "const tax = subtotalAfterDiscount * (taxRate / 100);")
text = text.replace("const finalTotal = total + tax;", "const finalTotal = subtotalAfterDiscount + tax;")

ui_discount = """
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem' }}>
                    <span>Subtotal</span>
                    <span>Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  {discountRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '0.875rem' }}>
                    <span>Discount ({discountRate}%)</span>
                    <span>-Rs.{discountAmount.toFixed(2)}</span>
                  </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem' }}>
                    <span>Tax ({taxRate}%)</span>
                    <span>Rs.{tax.toFixed(2)}</span>
                  </div>
"""

text = text.replace("""                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem' }}>
                    <span>Subtotal</span>
                    <span>Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem' }}>
                    <span>Tax ({taxRate}%)</span>
                    <span>Rs.{tax.toFixed(2)}</span>
                  </div>""", ui_discount)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Orders.tsx with discount logic")
