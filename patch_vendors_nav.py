import os

path = 'erp-frontend/src/pages/restaurant/Vendors.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import * as Icons from 'lucide-react';", "import * as Icons from 'lucide-react';\nimport { useNavigate } from 'react-router-dom';")
text = text.replace("const [form, setForm] = useState", "const navigate = useNavigate();\n  const [form, setForm] = useState")
text = text.replace("<button onClick={() => { setIsEditing(false);", "<button onClick={() => navigate('/res-purchases')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', marginRight: '1rem' }}>View Purchase Orders</button>\n        <button onClick={() => { setIsEditing(false);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added nav to Vendors")
