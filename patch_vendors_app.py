import os
import re

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import RestaurantBilling from './pages/restaurant/Billing';", "import RestaurantBilling from './pages/restaurant/Billing';\nimport Vendors from './pages/restaurant/Vendors';")
text = text.replace("<Route path=\"/res-vendors\" element={<PlaceholderModule title=\"Vendor Management\" iconName=\"Users\" description=\"Manage suppliers, purchase orders, and supplier payments.\" />} />", "<Route path=\"/res-vendors\" element={<Vendors />} />")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Vendors")
