import os

path = 'erp-frontend/src/pages/restaurant/Vendors.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import * as Icons from 'lucide-react';", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
