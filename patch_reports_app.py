import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Analytics from './pages/restaurant/Analytics';", "import Analytics from './pages/restaurant/Analytics';\nimport Reports from './pages/restaurant/Reports';")
text = text.replace('<Route path="/res-analytics" element={<Analytics />} />', '<Route path="/res-analytics" element={<Analytics />} />\n              <Route path="/res-reports" element={<Reports />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Reports")
