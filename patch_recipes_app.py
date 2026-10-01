import os
import re

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Purchases from './pages/restaurant/Purchases';", "import Purchases from './pages/restaurant/Purchases';\nimport Recipes from './pages/restaurant/Recipes';")
text = text.replace("<Route path=\"/res-recipes\" element={<PlaceholderModule title=\"Recipe Management\" iconName=\"ChefHat\" description=\"Build recipes to automatically deduct raw ingredients on sales.\" />} />", "<Route path=\"/res-recipes\" element={<Recipes />} />")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Recipes")
