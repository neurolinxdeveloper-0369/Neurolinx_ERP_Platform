import os
import re

path = 'erp-frontend/src/pages/restaurant/Inventory.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix relative URLs
text = text.replace("apiFetch(`/api/pos/dishes/${id}`", "apiFetch(`https://erp-api.neurolinx.in/api/pos/dishes/${id}`")
text = text.replace("apiFetch(`/api/pos/categories/${id}`", "apiFetch(`https://erp-api.neurolinx.in/api/pos/categories/${id}`")

# Remove duplicate trash buttons (the old static ones)
# For Categories:
text = text.replace("""<button onClick={() => deleteCategory(c.id)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Icons.Trash2 size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Icons.Trash2 size={18} /></button>""",
"""<button onClick={() => deleteCategory(c.id)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Icons.Trash2 size={16} /></button>""")

# For Dishes:
text = text.replace("""<button onClick={() => deleteDish(d.id)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Icons.Trash2 size={16} /></button>
                      <button onClick={() => handleEditDish(d)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginRight: '1rem' }}><Icons.Edit size={18} /></button>
                      <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Icons.Trash2 size={18} /></button>""",
"""<button onClick={() => deleteDish(d.id)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}><Icons.Trash2 size={16} /></button>
                      <button onClick={() => handleEditDish(d)} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', cursor: 'pointer' }}><Icons.Edit size={16} /></button>""")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
