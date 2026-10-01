import os
import re

path = 'erp-frontend/src/pages/restaurant/Inventory.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const [isLoading, setIsLoading] = useState(true);", "const [isLoading, setIsLoading] = useState(true);\n  const [searchQuery, setSearchQuery] = useState('');")

search_ui = """
        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <Icons.Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                    type="text" 
                    placeholder="Search dishes or categories..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
            </div>
        </div>
"""

text = text.replace("{/* Tabs */}", search_ui + "\n        {/* Tabs */}")
text = text.replace("dishes.map(d => (", "dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.category?.name.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (")
text = text.replace("categories.map(c => (", "categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added Search functionality to Inventory.tsx")
