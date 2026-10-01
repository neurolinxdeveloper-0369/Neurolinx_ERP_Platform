import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r"const total = cart\.reduce\(\(sum, item\) => sum \+ \(item\.dish\.price \* item\.quantity\), 0\);\s*const discountRate.*?const finalTotal = subtotalAfterDiscount \+ tax;",
    "const total = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);\n    const discountRate = settings?.defaultDiscount || 0.0;\n    const discountAmount = total * (discountRate / 100);\n    const subtotalAfterDiscount = total - discountAmount;\n    const taxRate = settings?.defaultTaxRate || 5.0;\n    const tax = subtotalAfterDiscount * (taxRate / 100);\n    const finalTotal = subtotalAfterDiscount + tax;",
    text,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed Orders.tsx TS errors")
