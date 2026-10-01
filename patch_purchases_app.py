import os
import re

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Vendors from './pages/restaurant/Vendors';", "import Vendors from './pages/restaurant/Vendors';\nimport Purchases from './pages/restaurant/Purchases';")
text = text.replace("<Route path=\"/res-vendors\" element={<Vendors />} />", "<Route path=\"/res-vendors\" element={<Vendors />} />\n                <Route path=\"/res-purchases\" element={<Purchases />} />")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Purchases")
