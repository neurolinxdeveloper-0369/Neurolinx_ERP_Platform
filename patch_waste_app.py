import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Recipes from './pages/restaurant/Recipes';", "import Recipes from './pages/restaurant/Recipes';\nimport WasteManagement from './pages/restaurant/Waste';")
text = text.replace('<Route path="/res-waste" element={<PlaceholderModule title="Waste Management" iconName="Trash2" description="Track and analyze kitchen waste and spoilage." />} />', '<Route path="/res-waste" element={<WasteManagement />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Waste")
