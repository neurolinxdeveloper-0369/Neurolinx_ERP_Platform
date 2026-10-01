import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import WasteManagement from './pages/restaurant/Waste';", "import WasteManagement from './pages/restaurant/Waste';\nimport Staff from './pages/restaurant/Staff';")
text = text.replace('<Route path="/res-staff" element={<PlaceholderModule title="Staff" iconName="UserCog" description="Manage employees, roles, shifts, and payroll." />} />', '<Route path="/res-staff" element={<Staff />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched App.tsx with Staff")
