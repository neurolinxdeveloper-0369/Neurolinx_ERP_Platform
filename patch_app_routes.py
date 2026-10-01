import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import RestaurantInventory from './pages/restaurant/Inventory';", "import RestaurantInventory from './pages/restaurant/Inventory';\nimport RawMaterials from './pages/restaurant/RawMaterials';")
text = text.replace("<Route path=\"/res-raw-materials\" element={<PlaceholderModule title=\"Raw Materials\" iconName=\"Box\" description=\"Monitor raw material inventory and stock alerts.\" />} />", "<Route path=\"/res-raw-materials\" element={<RawMaterials />} />")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated App.tsx routes")
