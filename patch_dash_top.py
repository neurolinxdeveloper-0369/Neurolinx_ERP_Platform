import os

path = 'erp-frontend/src/pages/restaurant/Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("pendingKots: number;", "pendingKots: number;\n  topSellingItems?: {name: string; sales: number}[];")
text = text.replace("pendingKots: 0", "pendingKots: 0,\n    topSellingItems: []")

widget = """
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#3b82f6" /> Top Selling Items
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.topSellingItems?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx === (stats.topSellingItems?.length || 0) - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 500, color: '#334155' }}>{item.name}</span>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{item.sales} sold</span>
              </div>
            ))}
            {!stats.topSellingItems?.length && <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No sales data yet.</div>}
          </div>
        </div>
      </div>
"""

text = text.replace("      {/* Tables Grid */}", widget + "\n      {/* Tables Grid */}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Dashboard UI")
