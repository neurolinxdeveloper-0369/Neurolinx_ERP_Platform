import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import KitchenDisplay from './pages/restaurant/Kitchen';", "import KitchenDisplay from './pages/restaurant/Kitchen';\nimport Branches from './pages/restaurant/Branches';")
text = text.replace('<Route path="/res-settings" element={<RestaurantSettings />} />', '<Route path="/res-branches" element={<Branches />} />\n              <Route path="/res-settings" element={<RestaurantSettings />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Branches")
