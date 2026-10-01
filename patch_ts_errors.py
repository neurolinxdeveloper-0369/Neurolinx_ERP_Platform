import os

path = 'erp-frontend/src/pages/restaurant/Inventory.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the incorrect replacement in the dishes mapping
text = text.replace("<button onClick={() => deleteCategory(c.id)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Icons.Trash2 size={16} /></button>\n                      <button onClick={() => handleEditDish(d)}", "<button onClick={() => deleteDish(d.id)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Icons.Trash2 size={16} /></button>\n                      <button onClick={() => handleEditDish(d)}")

# Remove the unused Icons warning in RawMaterials
path_rm = 'erp-frontend/src/pages/restaurant/RawMaterials.tsx'
with open(path_rm, 'r', encoding='utf-8') as f:
    rm_text = f.read()

rm_text = rm_text.replace("import * as Icons from 'lucide-react';", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

with open(path_rm, 'w', encoding='utf-8') as f:
    f.write(rm_text)
print("Fixed TS errors")
