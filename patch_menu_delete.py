import os

path = 'erp-frontend/src/pages/restaurant/Inventory.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

delete_cat_js = """
  const deleteCategory = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await apiFetch(`/api/pos/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };
"""

delete_dish_js = """
  const deleteDish = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    try {
      await apiFetch(`/api/pos/dishes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };
"""

if "const deleteCategory =" not in text:
    text = text.replace('const fetchData = () => {', delete_cat_js + delete_dish_js + '\  const fetchData = () => {')

# Add delete buttons
text = text.replace('<td style={{ padding: \'1rem\', display: \'flex\', gap: \'0.5rem\' }}>', '<td style={{ padding: \'1rem\', display: \'flex\', gap: \'0.5rem\' }}>\n<button onClick={() => deleteDish(d.id)} style={{ padding: \'0.5rem\', borderRadius: \'6px\', backgroundColor: \'#fee2e2\', color: \'#ef4444\', border: \'none\', cursor: \'pointer\' }}><Icons.Trash2 size={16} /></button>')

text = text.replace('<td style={{ padding: \'1rem\', textAlign: \'right\' }}>', '<td style={{ padding: \'1rem\', textAlign: \'right\', display: \'flex\', gap: \'0.5rem\', justifyContent: \'flex-end\' }}>\n<button onClick={() => deleteCategory(c.id)} style={{ padding: \'0.5rem\', borderRadius: \'6px\', backgroundColor: \'#fee2e2\', color: \'#ef4444\', border: \'none\', cursor: \'pointer\' }}><Icons.Trash2 size={16} /></button>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added UI delete buttons")
