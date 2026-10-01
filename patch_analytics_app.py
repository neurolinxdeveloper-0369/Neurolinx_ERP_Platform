import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Staff from './pages/restaurant/Staff';", "import Staff from './pages/restaurant/Staff';\nimport Analytics from './pages/restaurant/Analytics';")
text = text.replace('<Route path="/res-analytics" element={<PlaceholderModule title="Analytics" iconName="LineChart" description="Deep dive into sales trends, popular items, and staff performance." />} />', '<Route path="/res-analytics" element={<Analytics />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Analytics")
