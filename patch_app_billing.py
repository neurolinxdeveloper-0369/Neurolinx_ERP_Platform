import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import RawMaterials from './pages/restaurant/RawMaterials';", "import RawMaterials from './pages/restaurant/RawMaterials';\nimport RestaurantBilling from './pages/restaurant/Billing';")
text = text.replace("<Route path=\"/res-billing\" element={<PlaceholderModule title=\"Billing Module\" iconName=\"Receipt\" description=\"View all past invoices, receipts, and split payments.\" />} />", "<Route path=\"/res-billing\" element={<RestaurantBilling />} />")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated App.tsx billing")
