import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Analytics from './pages/restaurant/Analytics';", "import Analytics from './pages/restaurant/Analytics';\nimport KitchenDisplay from './pages/restaurant/Kitchen';")
text = text.replace('<Route path="/res-orders" element={<RestaurantOrders />} />', '<Route path="/res-orders" element={<RestaurantOrders />} />\n              <Route path="/res-kitchen" element={<KitchenDisplay />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Kitchen")
